import type { Config } from "./config.ts";
import type { Project } from "./api.ts";
import { budgetUsd } from "./price.ts";

export type Fit = { score: number; reasons: string[]; skip?: string };

const HOUR = 3600;
const NON_LATIN = /[\u0400-\u04ff\u0600-\u06ff\u0e00-\u0e7f\u3040-\u30ff\u3400-\u9fff\uac00-\ud7af]/;
const MOBILE_TITLE = /\b(app|ios|iphone|ipad|android|flutter|kotlin|swift(ui)?|react native|mobile|apk|play store|app store|compose|kmp)\b/i;

/**
 * How worth a bid this project is for you, 0–100. The reasons are the point — they say *why*, so
 * you (or Claude) can disagree with the number.
 */
export function scoreProject(p: Project, cfg: Config, now = Date.now() / 1000): Fit {
  const reasons: string[] = [];
  let score = 30;
  const text = `${p.title}\n${p.description ?? p.preview_description ?? ""}`.toLowerCase();

  const strong = new Set(cfg.strongSkills.map((s) => s.toLowerCase()));
  const matched = (p.jobs ?? []).filter((j) => strong.has(j.name.toLowerCase())).map((j) => j.name);
  if (matched.length) {
    const pts = Math.min(15, matched.length * 5);
    score += pts;
    reasons.push(`+${pts} skills: ${matched.join(", ")}`);
  }

  // Tags are set loosely by employers; the title says what the job really is.
  if (MOBILE_TITLE.test(p.title)) {
    score += 15;
    reasons.push("+15 mobile work in the title");
  }

  const hits = cfg.keywords.filter((k) => text.includes(k.toLowerCase()));
  if (hits.length) {
    const pts = Math.min(15, hits.length * 5);
    score += pts;
    reasons.push(`+${pts} keywords: ${hits.join(", ")}`);
  }

  const avoid = cfg.avoidKeywords.filter((k) => new RegExp(`\\b${k}\\b`, "i").test(text));
  if (avoid.length) {
    score -= 25 * avoid.length;
    reasons.push(`-${25 * avoid.length} off-niche: ${avoid.join(", ")}`);
  }

  const { max } = budgetUsd(p);
  const floor = cfg.minBudgetUsd[p.type];
  if (max != null && max < floor) {
    score -= 30;
    reasons.push(`-30 budget max $${max.toFixed(0)} under your $${floor} floor`);
  } else if (max != null && max >= floor * 4) {
    score += 10;
    reasons.push(`+10 budget up to $${max.toFixed(0)}`);
  }

  const bids = p.bid_stats.bid_count;
  const crowd = Math.round(20 * Math.max(0, 1 - bids / cfg.maxBids));
  score += crowd;
  reasons.push(`+${crowd} ${bids} bids so far`);

  const ageH = (now - p.time_submitted) / HOUR;
  if (ageH < 6) {
    score += 10;
    reasons.push(`+10 posted ${ageH.toFixed(1)}h ago`);
  } else if (ageH < 24) {
    score += 5;
    reasons.push(`+5 posted ${ageH.toFixed(0)}h ago`);
  }

  if (p.upgrades?.urgent) reasons.push("urgent");
  if (p.upgrades?.NDA) reasons.push("NDA");

  let skip: string | undefined;
  if (p.upgrades?.pf_only) skip = "Preferred Freelancers only";
  else if (p.upgrades?.qualified) skip = "needs a passed qualification exam";
  else if (max != null && max < floor) skip = `budget max $${max.toFixed(0)} under your $${floor} floor`;
  else if (cfg.languages.length && p.language && !cfg.languages.includes(p.language)) skip = `written in ${p.language}`;
  // The language field is often left at "en"; a title in another script gives it away.
  else if (cfg.languages.includes("en") && cfg.languages.length === 1 && NON_LATIN.test(p.title)) skip = "title is not in English";
  else if (bids > cfg.maxBids) skip = `over ${cfg.maxBids} bids`;
  else if (ageH > cfg.maxAgeHours) skip = `older than ${cfg.maxAgeHours}h`;
  else if (p.frontend_project_status && p.frontend_project_status !== "open") skip = p.frontend_project_status;

  return { score: Math.max(0, Math.min(100, score)), reasons, skip };
}
