import type { Project } from "../src/api.ts";
import { loadConfig, type Config } from "../src/config.ts";

export const NOW = 1_800_000_000;

export function project(over: Partial<Project> = {}): Project {
  return {
    id: 1,
    title: "Flutter app bug fixes",
    seo_url: "flutter/Flutter-app-bug-fixes",
    type: "fixed",
    budget: { minimum: 250, maximum: 750 },
    currency: { code: "USD", sign: "$", exchange_rate: 1 },
    bid_stats: { bid_count: 10, bid_avg: 500 },
    time_submitted: NOW - 3600,
    description: "Fix crashes in our Flutter app before the Google Play release.",
    jobs: [{ id: 1315, name: "Flutter" }, { id: 44, name: "Mobile App Development" }],
    upgrades: {},
    frontend_project_status: "open",
    language: "en",
    ...over,
  };
}

export const config: Config = loadConfig();
