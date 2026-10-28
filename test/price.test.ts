import { test } from "node:test";
import assert from "node:assert/strict";
import { marketStats, quantile, suggestBid } from "../src/price.ts";
import { config, project } from "./fixtures.ts";

test("quantile interpolates", () => {
  assert.equal(quantile([10, 20, 30, 40], 0.5), 25);
  assert.equal(quantile([], 0.5), null);
});

test("market stats convert to USD and split fixed from hourly", () => {
  const stats = marketStats([
    project({ bid_stats: { bid_count: 5, bid_avg: 100 } }),
    project({ bid_stats: { bid_count: 5, bid_avg: 10000 }, currency: { code: "INR", sign: "₹", exchange_rate: 0.01 } }),
    project({ type: "hourly", bid_stats: { bid_count: 5, bid_avg: 20 } }),
  ]);
  const fixed = stats.find((s) => s.type === "fixed")!;
  assert.equal(fixed.projects, 2);
  assert.equal(fixed.bidAvgUsd.median, 100);
  assert.equal(stats.find((s) => s.type === "hourly")!.projects, 1);
});

test("crowded project: bid under the average, in the project's currency", () => {
  const bid = suggestBid(project({ bid_stats: { bid_count: 40, bid_avg: 500 } }), config);
  assert.equal(bid.amount, 460);
  assert.equal(bid.currency, "USD");
});

test("bid stays inside the posted budget", () => {
  assert.equal(suggestBid(project({ bid_stats: { bid_count: 3, bid_avg: 2000 } }), config).amount, 750);
  assert.equal(suggestBid(project({ bid_stats: { bid_count: 3, bid_avg: 50 } }), config).amount, 250);
});

test("hourly bid is raised to your floor rate", () => {
  const bid = suggestBid(
    project({ type: "hourly", budget: { minimum: 5, maximum: 100 }, bid_stats: { bid_count: 3, bid_avg: 10 } }),
    config,
  );
  assert.equal(bid.amountUsd, config.hourlyRateUsd);
});
