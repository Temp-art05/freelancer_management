import { test } from "node:test";
import assert from "node:assert/strict";
import { scoreProject } from "../src/score.ts";
import { config, NOW, project } from "./fixtures.ts";

test("a fresh, on-niche project scores high and is not skipped", () => {
  const fit = scoreProject(project(), config, NOW);
  assert.equal(fit.skip, undefined);
  assert.ok(fit.score >= 80, `score ${fit.score}: ${fit.reasons.join("; ")}`);
});

test("off-niche words pull the score down", () => {
  const on = scoreProject(project(), config, NOW).score;
  const off = scoreProject(project({ description: "WordPress site with SEO" }), config, NOW).score;
  assert.ok(off < on - 30);
});

test("budget under the floor is skipped, using the exchange rate", () => {
  const inr = project({ budget: { minimum: 1000, maximum: 2000 }, currency: { code: "INR", sign: "₹", exchange_rate: 0.012 } });
  assert.match(scoreProject(inr, config, NOW).skip ?? "", /under your/);
});

test("crowded, stale, gated and foreign projects are skipped", () => {
  assert.match(scoreProject(project({ bid_stats: { bid_count: 500, bid_avg: 1 } }), config, NOW).skip ?? "", /bids/);
  assert.match(scoreProject(project({ time_submitted: NOW - 10 * 86400 }), config, NOW).skip ?? "", /older/);
  assert.match(scoreProject(project({ upgrades: { pf_only: true } }), config, NOW).skip ?? "", /Preferred/);
  assert.match(scoreProject(project({ language: "es" }), config, NOW).skip ?? "", /es/);
  assert.match(scoreProject(project({ title: "App推广与用户增长" }), config, NOW).skip ?? "", /English/);
});
