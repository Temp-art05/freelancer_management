---
name: price-research
description: Work out what to charge on Freelancer.com — for one project or for a kind of mobile work — from live market data. Use when the owner asks how much to bid, what rate to set, or "giá bao nhiêu thì hợp lý".
---

# Price research

1. Market: `npm run fl -- price` (or `--query "<topic>"`, e.g. "flutter", "bug fix", "in-app purchase").
   It reports p25 / median / p75 of the average bid and of budgets, fixed and hourly apart, in USD.
2. For one project: `npm run fl -- show <id>` → its bid count, average, budget, and a suggestion.
3. Reason it out for the owner (in Vietnamese), briefly:
   - Where the suggestion sits against the market median for this kind of work.
   - Net after the 10% fee (`docs/freelancer-guide.md`).
   - Hours it really takes × the owner's floor (`fl.config.json` → `hourlyRateUsd`). If the
     market price is under that, say so plainly — winning it means working under the floor.
   - Early-career trade-off: with few reviews, bidding near p25 on small, fast jobs buys reviews;
     with reviews, bid at or above the median and compete on proof.
4. Give one number (and the range you'd accept), not a survey. If the owner agrees to a new floor,
   update `fl.config.json`.

Small samples (n < 10 for a skill) are noise — say so instead of quoting them.
