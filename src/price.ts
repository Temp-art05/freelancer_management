import type { Config } from "./config.ts";
import type { Project } from "./api.ts";

export function toUsd(amount: number, p: Pick<Project, "currency">): number {
  return amount * (p.currency.exchange_rate || 1);
}

export function budgetUsd(p: Project): { min: number | null; max: number | null } {
  return {
    min: p.budget.minimum != null ? toUsd(p.budget.minimum, p) : null,
    max: p.budget.maximum != null ? toUsd(p.budget.maximum, p) : null,
  };
}

export function quantile(sorted: number[], q: number): number | null {
  if (sorted.length === 0) return null;
  const pos = (sorted.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  return sorted[lo]! + (sorted[hi]! - sorted[lo]!) * (pos - lo);
}

export type Spread = { n: number; p25: number | null; median: number | null; p75: number | null };

function spread(values: number[]): Spread {
  const s = values.filter((v) => Number.isFinite(v) && v > 0).sort((a, b) => a - b);
  return { n: s.length, p25: quantile(s, 0.25), median: quantile(s, 0.5), p75: quantile(s, 0.75) };
}

export type MarketStats = {
  type: "fixed" | "hourly";
  projects: number;
  /** Average bid per project, in USD. */
  bidAvgUsd: Spread;
  budgetMaxUsd: Spread;
  bidCount: Spread;
};

/** Price spread across a sample of projects, split by fixed and hourly — they are not comparable. */
export function marketStats(projects: Project[]): MarketStats[] {
  return (["fixed", "hourly"] as const).map((type) => {
    const ps = projects.filter((p) => p.type === type);
    return {
      type,
      projects: ps.length,
      bidAvgUsd: spread(ps.map((p) => (p.bid_stats.bid_avg ? toUsd(p.bid_stats.bid_avg, p) : NaN))),
      budgetMaxUsd: spread(ps.map((p) => budgetUsd(p).max ?? NaN)),
      bidCount: spread(ps.map((p) => p.bid_stats.bid_count)),
    };
  });
}

function nice(n: number): number {
  if (n >= 1000) return Math.round(n / 50) * 50;
  if (n >= 200) return Math.round(n / 10) * 10;
  if (n >= 50) return Math.round(n / 5) * 5;
  return Math.round(n);
}

export type BidSuggestion = {
  /** In the project's own currency — that is what the bid form takes. */
  amount: number;
  currency: string;
  amountUsd: number;
  reason: string;
};

/**
 * A starting point, not an answer: slightly under the current average when the project is
 * crowded, at the average when it is not, never outside the posted budget and never under your
 * floor rate for hourly work.
 */
export function suggestBid(p: Project, cfg: Pick<Config, "hourlyRateUsd">): BidSuggestion {
  const rate = p.currency.exchange_rate || 1;
  const min = p.budget.minimum ?? 0;
  const max = p.budget.maximum ?? Math.max(min * 2, min);
  const avg = p.bid_stats.bid_avg ?? null;
  const crowded = p.bid_stats.bid_count >= 15;

  let amount: number;
  let reason: string;
  if (avg) {
    amount = crowded ? avg * 0.92 : avg;
    reason = crowded
      ? `${p.bid_stats.bid_count} bids, avg ${avg.toFixed(0)} — 8% under avg to stand out`
      : `${p.bid_stats.bid_count} bids, matching avg ${avg.toFixed(0)}`;
  } else {
    amount = (min + max) / 2;
    reason = "no bids yet — budget midpoint";
  }

  if (p.type === "hourly") {
    const floor = cfg.hourlyRateUsd / rate;
    if (amount < floor) {
      amount = floor;
      reason += `; raised to your floor $${cfg.hourlyRateUsd}/h`;
    }
  }
  if (min && amount < min) {
    amount = min;
    reason += "; clamped to budget min";
  }
  if (p.budget.maximum && amount > p.budget.maximum) {
    amount = p.budget.maximum;
    reason += "; clamped to budget max";
  }

  amount = nice(amount);
  return { amount, currency: p.currency.code, amountUsd: Math.round(amount * rate), reason };
}
