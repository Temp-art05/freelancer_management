import type { Config } from "./config.ts";

// profile/profile.md is the source of truth for what goes on the Freelancer profile page.
// The checks are heuristics from how employers skim a profile, not Freelancer's own rules.

export type Finding = { level: "ok" | "warn" | "fail"; text: string };

export function sections(md: string): Record<string, string> {
  const out: Record<string, string> = {};
  let current = "";
  for (const line of md.split("\n")) {
    const h = /^##\s+(.+?)\s*$/.exec(line);
    if (h) {
      current = h[1]!.toLowerCase();
      out[current] = "";
    } else if (current) {
      out[current] += line + "\n";
    }
  }
  for (const k of Object.keys(out)) out[k] = out[k]!.replace(/<!--[\s\S]*?-->/g, "").trim();
  return out;
}

const words = (s: string) => s.split(/\s+/).filter(Boolean).length;

export function checkProfile(md: string, cfg: Config): Finding[] {
  const s = sections(md);
  const f: Finding[] = [];
  const need = (name: string) => {
    if (!s[name]) f.push({ level: "fail", text: `"## ${name}" section is missing or empty` });
    return s[name] ?? "";
  };

  const headline = need("headline");
  if (headline) {
    if (headline.length > 60) f.push({ level: "warn", text: `headline is ${headline.length} chars — keep it under ~60 so it is not cut off in search results` });
    else f.push({ level: "ok", text: `headline: "${headline}"` });
    if (!/(ios|android|flutter|mobile|kotlin|swift)/i.test(headline))
      f.push({ level: "warn", text: "headline does not say mobile/iOS/Android — that is what employers search for" });
  }

  const summary = need("summary");
  if (summary) {
    const n = words(summary);
    if (n < 120) f.push({ level: "warn", text: `summary is ${n} words — 150–300 words reads as serious without being a wall` });
    else if (n > 400) f.push({ level: "warn", text: `summary is ${n} words — trim, the first 2 lines do most of the work` });
    else f.push({ level: "ok", text: `summary is ${n} words` });
    const firstLine = summary.split("\n")[0] ?? "";
    if (/^(hi|hello|i am|i'm)\b/i.test(firstLine))
      f.push({ level: "warn", text: "summary opens with a greeting — open with what you build and for whom" });
    const missing = cfg.keywords.filter((k) => !summary.toLowerCase().includes(k.toLowerCase()));
    if (missing.length > cfg.keywords.length / 2)
      f.push({ level: "warn", text: `summary mentions few of your keywords; missing e.g. ${missing.slice(0, 5).join(", ")}` });
  }

  const skills = need("skills")
    .split(/[\n,]/)
    .map((x) => x.replace(/^[-*]\s*/, "").trim())
    .filter(Boolean);
  if (skills.length) {
    const absent = cfg.strongSkills.filter((x) => !skills.some((y) => y.toLowerCase() === x.toLowerCase()));
    if (absent.length) f.push({ level: "warn", text: `skills list lacks: ${absent.join(", ")} — search filters on these tags` });
    else f.push({ level: "ok", text: `${skills.length} skills listed` });
  }

  const portfolio = need("portfolio")
    .split("\n")
    .filter((l) => /^[-*]\s+/.test(l));
  if (portfolio.length < 3) f.push({ level: "warn", text: `${portfolio.length} portfolio items — aim for 3–6 with store links or screenshots` });
  else f.push({ level: "ok", text: `${portfolio.length} portfolio items` });
  if (portfolio.length && !portfolio.some((l) => /(apps\.apple\.com|play\.google\.com)/.test(l)))
    f.push({ level: "warn", text: "no App Store / Google Play link in the portfolio — a live app is the strongest proof" });

  const rate = need("hourly rate");
  if (rate && !/\d/.test(rate)) f.push({ level: "fail", text: "hourly rate has no number" });

  return f;
}
