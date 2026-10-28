---
name: find-jobs
description: Find Freelancer.com mobile projects worth bidding on — search, read the best ones, and shortlist with reasons. Use when the owner asks to find jobs, look for work, check new projects, or "có job nào không".
---

# Find jobs

1. `npm run fl -- search` (add `--query "<topic>"` or `--type fixed|hourly` if the owner named one).
   It ranks by fit and records hits in the pipeline as `found`.
2. For the top 5–8, run `npm run fl -- show <id>` and actually read the brief. The score is a
   heuristic; you are the judge. Downgrade a project when:
   - scope is far bigger than the budget (convert to USD; see `docs/freelancer-guide.md`),
   - it is not really mobile work (tagged mobile, but it is a website, marketing, QA-for-$10),
   - it shows red flags from the guide (off-platform contact, unpaid test task, vague clone).
3. Reply in Vietnamese with a short table: id, title, budget USD, bids, your verdict (bid / maybe /
   skip) and one line of why. Put the links in.
4. For the ones the owner wants: `npm run fl -- track set <id> shortlist`; for clear skips:
   `npm run fl -- track set <id> skipped --note "<why>"` so they stop coming back.
5. Offer to run `write-proposal` on the shortlist.

If almost everything is skipped, say which filter is doing it (the `[skip: …]` reasons with
`--all`) and suggest the `fl.config.json` change instead of silently loosening it.
