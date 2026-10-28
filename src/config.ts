import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

export const ROOT = fileURLToPath(new URL("..", import.meta.url));

export type Config = {
  /** Freelancer job (skill) ids to search, id → name. */
  jobs: Record<string, string>;
  /** Skills you are strongest in; a project tagged with them scores higher. */
  strongSkills: string[];
  /** Words in the title/description that make a project a better fit. */
  keywords: string[];
  /** Words that make a project a poor fit. */
  avoidKeywords: string[];
  minBudgetUsd: { fixed: number; hourly: number };
  /** Projects with more bids than this are skipped by `search`. */
  maxBids: number;
  maxAgeHours: number;
  /** Project languages you bid in (ISO codes); empty means any. */
  languages: string[];
  hourlyRateUsd: number;
  currency: string;
};

export function loadConfig(path = `${ROOT}/fl.config.json`): Config {
  return JSON.parse(readFileSync(path, "utf8")) as Config;
}

/** FREELANCER_TOKEN from the environment, falling back to `.env` in the repo root. */
export function token(): string | undefined {
  if (process.env.FREELANCER_TOKEN) return process.env.FREELANCER_TOKEN;
  try {
    const env = readFileSync(`${ROOT}/.env`, "utf8");
    const line = env.split("\n").find((l) => l.startsWith("FREELANCER_TOKEN="));
    const value = line?.slice("FREELANCER_TOKEN=".length).trim();
    return value || undefined;
  } catch {
    return undefined;
  }
}
