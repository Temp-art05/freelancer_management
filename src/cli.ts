import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { parseArgs } from "node:util";
import { getProject, getSelf, placeBid, projectUrl, searchActive, type Project } from "./api.ts";
import { loadConfig, ROOT, token, type Config } from "./config.ts";
import { budgetUsd, marketStats, suggestBid, type Spread } from "./price.ts";
import { checkProfile, sections } from "./profile.ts";
import { scoreProject } from "./score.ts";
import { load, save, setStage, STAGES, upsertFound, type Stage } from "./store.ts";

const HELP = `fl — Freelancer.com helper for a mobile developer

  search [--query q] [--type fixed|hourly] [--limit 100] [--top 20] [--min 40] [--all] [--json] [--no-track]
                         find open mobile projects, rank them by fit, record them in the pipeline
  show <id> [--track]    full description, fit reasons and a suggested bid
  price [--query q] [--limit 100] [--json]
                         what mobile projects pay right now (fixed vs hourly, USD)
  draft <id>             write proposals/<id>.md with everything needed to write the proposal
  track [--stage s]      list the pipeline
  track set <id> <stage> [--note t] [--amount a]
                         stages: ${STAGES.join(", ")}
  profile                check profile/profile.md against what employers skim for
  me                     who the token belongs to (needs FREELANCER_TOKEN)
  bid <id> --amount a --days d [--milestone 50] [--yes]
                         place the bid with the "## Proposal" from proposals/<id>.md.
                         Without --yes it only prints what it would send.
`;

const fmt = (n: number | null | undefined, d = 0) => (n == null ? "—" : n.toFixed(d));

function budgetText(p: Project): string {
  const { min, max } = budgetUsd(p);
  const unit = p.type === "hourly" ? "/h" : "";
  return `$${fmt(min)}–${fmt(max)}${unit}`;
}

function ageText(p: Project): string {
  const h = (Date.now() / 1000 - p.time_submitted) / 3600;
  return h < 1 ? `${Math.round(h * 60)}m` : h < 48 ? `${Math.round(h)}h` : `${Math.round(h / 24)}d`;
}

function pad(s: string, n: number): string {
  return s.length > n ? s.slice(0, n - 1) + "…" : s.padEnd(n);
}

async function search(argv: string[], cfg: Config) {
  const { values } = parseArgs({
    args: argv,
    options: {
      query: { type: "string" },
      type: { type: "string" },
      limit: { type: "string", default: "100" },
      top: { type: "string", default: "20" },
      min: { type: "string", default: "40" },
      all: { type: "boolean", default: false },
      json: { type: "boolean", default: false },
      "no-track": { type: "boolean", default: false },
    },
  });
  const type = values.type as "fixed" | "hourly" | undefined;
  const { projects, total } = await searchActive({
    query: values.query,
    jobIds: Object.keys(cfg.jobs),
    limit: Number(values.limit),
    type,
  });

  const ranked = projects
    .map((p) => ({ p, fit: scoreProject(p, cfg) }))
    .filter((x) => values.all || (!x.fit.skip && x.fit.score >= Number(values.min)))
    .sort((a, b) => b.fit.score - a.fit.score)
    .slice(0, Number(values.top));

  if (!values["no-track"]) {
    const pipeline = load();
    for (const { p, fit } of ranked)
      upsertFound(pipeline, {
        id: p.id,
        title: p.title,
        url: projectUrl(p),
        type: p.type,
        budget: budgetText(p),
        bids: p.bid_stats.bid_count,
        score: fit.score,
      });
    save(pipeline);
  }

  if (values.json) {
    console.log(JSON.stringify(ranked.map(({ p, fit }) => ({ ...summary(p), fit })), null, 2));
    return;
  }
  console.log(`${total} open projects match your skills; ${projects.length} fetched, top ${ranked.length}:\n`);
  console.log(`${"score".padEnd(6)}${"id".padEnd(10)}${"type".padEnd(7)}${"budget USD".padEnd(15)}${"bids".padEnd(6)}${"age".padEnd(5)}title`);
  for (const { p, fit } of ranked)
    console.log(
      `${String(fit.score).padEnd(6)}${String(p.id).padEnd(10)}${p.type.padEnd(7)}${pad(budgetText(p), 15)}${String(p.bid_stats.bid_count).padEnd(6)}${ageText(p).padEnd(5)}${pad(p.title, 60)}${fit.skip ? `  [skip: ${fit.skip}]` : ""}`,
    );
  console.log(`\nNext: \`npm run fl -- show <id>\` for one project, \`npm run fl -- draft <id>\` to start a proposal.`);
}

function summary(p: Project) {
  return {
    id: p.id,
    title: p.title,
    url: projectUrl(p),
    type: p.type,
    budget: budgetText(p),
    currency: p.currency.code,
    bids: p.bid_stats.bid_count,
    bidAvgUsd: p.bid_stats.bid_avg ? Math.round(p.bid_stats.bid_avg * p.currency.exchange_rate) : null,
    age: ageText(p),
    skills: (p.jobs ?? []).map((j) => j.name),
  };
}

async function show(argv: string[], cfg: Config) {
  const { values, positionals } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: { track: { type: "boolean", default: false } },
  });
  const p = await getProject(Number(positionals[0]));
  const fit = scoreProject(p, cfg);
  const bid = suggestBid(p, cfg);
  const s = summary(p);
  console.log(`# ${p.title}\n${s.url}\n`);
  console.log(`type ${p.type} · budget ${s.budget} (${p.currency.code} ${fmt(p.budget.minimum)}–${fmt(p.budget.maximum)}) · ${s.bids} bids, avg $${s.bidAvgUsd ?? "—"} · posted ${s.age} ago · ${p.frontend_project_status}`);
  console.log(`skills: ${s.skills.join(", ")}`);
  console.log(`\nfit ${fit.score}/100${fit.skip ? ` — skip: ${fit.skip}` : ""}\n  ${fit.reasons.join("\n  ")}`);
  console.log(`\nsuggested bid: ${bid.currency} ${bid.amount} (≈ $${bid.amountUsd}) — ${bid.reason}`);
  console.log(`\n---\n${p.description ?? p.preview_description ?? ""}`);
  if (values.track) {
    const pipeline = load();
    upsertFound(pipeline, { id: p.id, title: p.title, url: s.url, type: p.type, budget: s.budget, bids: s.bids, score: fit.score });
    save(pipeline);
    console.log(`\n(tracked)`);
  }
}

function spreadText(s: Spread, unit = "$"): string {
  if (!s.n) return "no data";
  return `p25 ${unit}${fmt(s.p25)} · median ${unit}${fmt(s.median)} · p75 ${unit}${fmt(s.p75)}  (n=${s.n})`;
}

async function price(argv: string[], cfg: Config) {
  const { values } = parseArgs({
    args: argv,
    options: {
      query: { type: "string" },
      limit: { type: "string", default: "100" },
      json: { type: "boolean", default: false },
    },
  });
  const { projects } = await searchActive({
    query: values.query,
    jobIds: Object.keys(cfg.jobs),
    limit: Number(values.limit),
    fullDescription: false,
  });
  const overall = marketStats(projects);
  const bySkill = cfg.strongSkills
    .map((skill) => ({ skill, stats: marketStats(projects.filter((p) => p.jobs?.some((j) => j.name === skill))) }))
    .filter((x) => x.stats.some((s) => s.projects > 0));

  if (values.json) {
    console.log(JSON.stringify({ sample: projects.length, overall, bySkill }, null, 2));
    return;
  }
  console.log(`Sample: ${projects.length} open projects${values.query ? ` matching "${values.query}"` : ""} (amounts in USD)\n`);
  for (const s of overall) {
    console.log(`${s.type.toUpperCase()} — ${s.projects} projects`);
    console.log(`  avg bid    ${spreadText(s.bidAvgUsd)}`);
    console.log(`  budget max ${spreadText(s.budgetMaxUsd)}`);
    console.log(`  bid count  ${spreadText(s.bidCount, "")}`);
  }
  console.log(`\nBy skill (median avg bid, USD):`);
  for (const { skill, stats } of bySkill) {
    const [fixed, hourly] = stats;
    console.log(`  ${skill.padEnd(26)} fixed ${fmt(fixed!.bidAvgUsd.median).padStart(6)} (n=${fixed!.projects})   hourly ${fmt(hourly!.bidAvgUsd.median).padStart(4)}/h (n=${hourly!.projects})`);
  }
  console.log(`\nYour floor: $${cfg.hourlyRateUsd}/h (fl.config.json → hourlyRateUsd).`);
}

async function draft(argv: string[], cfg: Config) {
  const id = Number(argv[0]);
  const p = await getProject(id);
  const fit = scoreProject(p, cfg);
  const bid = suggestBid(p, cfg);
  const s = summary(p);
  const file = `${ROOT}/proposals/${id}.md`;
  if (existsSync(file)) {
    console.log(`${file} already exists — not overwriting.`);
    return;
  }
  mkdirSync(`${ROOT}/proposals`, { recursive: true });
  writeFileSync(
    file,
    `# ${p.title}

- url: ${s.url}
- type: ${p.type} · budget ${s.budget} (${p.currency.code} ${fmt(p.budget.minimum)}–${fmt(p.budget.maximum)})
- bids: ${s.bids} · avg $${s.bidAvgUsd ?? "—"} · posted ${s.age} ago
- skills: ${s.skills.join(", ")}
- fit: ${fit.score}/100 — ${fit.reasons.join("; ")}
- suggested bid: ${bid.currency} ${bid.amount} (≈ $${bid.amountUsd}) — ${bid.reason}

## Brief

${p.description ?? p.preview_description ?? ""}

## Questions for the client

<!-- 1–2 sharp questions that show you read the brief -->

## Bid

- amount: ${bid.amount}
- days:
- milestone %: 50

## Proposal

<!-- Written by the write-proposal skill. Plain text, no markdown — Freelancer shows it raw. -->
`,
  );
  const pipeline = load();
  upsertFound(pipeline, { id, title: p.title, url: s.url, type: p.type, budget: s.budget, bids: s.bids, score: fit.score });
  setStage(pipeline, id, "shortlist", { bidAmount: `${bid.currency} ${bid.amount}` });
  save(pipeline);
  console.log(`wrote proposals/${id}.md — fill "## Proposal", then \`npm run fl -- track set ${id} drafted\``);
}

function track(argv: string[]) {
  const pipeline = load();
  if (argv[0] === "set") {
    const { values, positionals } = parseArgs({
      args: argv.slice(1),
      allowPositionals: true,
      options: { note: { type: "string" }, amount: { type: "string" } },
    });
    const [id, stage] = positionals;
    if (!STAGES.includes(stage as Stage)) throw new Error(`stage must be one of: ${STAGES.join(", ")}`);
    const e = setStage(pipeline, Number(id), stage as Stage, {
      ...(values.note !== undefined && { note: values.note }),
      ...(values.amount !== undefined && { bidAmount: values.amount }),
    });
    save(pipeline);
    console.log(`${e.id} → ${e.stage}`);
    return;
  }
  const { values } = parseArgs({ args: argv, options: { stage: { type: "string" } } });
  const entries = Object.values(pipeline.entries)
    .filter((e) => (values.stage ? e.stage === values.stage : e.stage !== "skipped"))
    .sort((a, b) => STAGES.indexOf(b.stage) - STAGES.indexOf(a.stage) || b.score - a.score);
  if (!entries.length) {
    console.log("Pipeline is empty — run `npm run fl -- search`.");
    return;
  }
  const counts = STAGES.map((st) => `${st} ${Object.values(pipeline.entries).filter((e) => e.stage === st).length}`);
  console.log(counts.join(" · ") + "\n");
  for (const e of entries)
    console.log(`${e.stage.padEnd(10)}${String(e.score).padEnd(5)}${String(e.id).padEnd(10)}${pad(e.budget, 15)}${pad(e.title, 55)}${e.bidAmount ? `  bid ${e.bidAmount}` : ""}${e.note ? `  — ${e.note}` : ""}`);
}

function profile(cfg: Config) {
  const file = `${ROOT}/profile/profile.md`;
  const findings = checkProfile(readFileSync(file, "utf8"), cfg);
  const icon = { ok: "✓", warn: "!", fail: "✗" };
  for (const f of findings) console.log(`${icon[f.level]} ${f.text}`);
  const failed = findings.filter((f) => f.level === "fail").length;
  console.log(`\n${failed} blocking, ${findings.filter((f) => f.level === "warn").length} to improve.`);
  if (failed) process.exitCode = 1;
}

function requireToken(): string {
  const t = token();
  if (!t) throw new Error("FREELANCER_TOKEN is not set — copy .env.example to .env and add your OAuth token.");
  return t;
}

async function me() {
  const self = await getSelf(requireToken());
  console.log(`${self.username} (id ${self.id})${self.hourly_rate ? ` · $${self.hourly_rate}/h` : ""}`);
}

async function bid(argv: string[]) {
  const { values, positionals } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: {
      amount: { type: "string" },
      days: { type: "string" },
      milestone: { type: "string", default: "50" },
      yes: { type: "boolean", default: false },
    },
  });
  const id = Number(positionals[0]);
  const file = `${ROOT}/proposals/${id}.md`;
  if (!existsSync(file)) throw new Error(`No proposals/${id}.md — run \`npm run fl -- draft ${id}\` first.`);
  const text = sections(readFileSync(file, "utf8"))["proposal"];
  if (!text) throw new Error(`proposals/${id}.md has an empty "## Proposal" section.`);
  const amount = Number(values.amount);
  const days = Number(values.days);
  if (!(amount > 0) || !(days > 0)) throw new Error("--amount and --days are required (amount in the project's currency).");
  if (text.length < 100 || text.length > 1500)
    console.log(`warning: proposal is ${text.length} chars (Freelancer needs at least 100, and the first ~150 decide whether it is opened).`);

  const p = await getProject(id);
  console.log(`Project: ${p.title} (${projectUrl(p)})`);
  console.log(`Bid: ${p.currency.code} ${amount}${p.type === "hourly" ? "/h" : ""} · ${days} days · milestone ${values.milestone}%`);
  console.log(`---\n${text}\n---`);
  if (!values.yes) {
    console.log("Dry run. Re-run with --yes to place this bid on Freelancer.");
    return;
  }
  const t = requireToken();
  const self = await getSelf(t);
  const placed = await placeBid(t, {
    projectId: id,
    bidderId: self.id,
    amount,
    periodDays: days,
    milestonePercentage: Number(values.milestone),
    description: text,
  });
  const pipeline = load();
  if (pipeline.entries[id]) {
    setStage(pipeline, id, "bid", { bidAmount: `${p.currency.code} ${amount}` });
    save(pipeline);
  }
  console.log(`Bid placed (id ${placed.id}).`);
}

async function main() {
  const [cmd, ...rest] = process.argv.slice(2);
  const cfg = loadConfig();
  switch (cmd) {
    case "search": return search(rest, cfg);
    case "show": return show(rest, cfg);
    case "price": return price(rest, cfg);
    case "draft": return draft(rest, cfg);
    case "track": return track(rest);
    case "profile": return profile(cfg);
    case "me": return me();
    case "bid": return bid(rest);
    default: console.log(HELP);
  }
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
