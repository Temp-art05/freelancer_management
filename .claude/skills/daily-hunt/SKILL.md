---
name: daily-hunt
description: The whole daily Freelancer.com routine for the owner — search new mobile jobs, triage them, shortlist with the owner, draft bids for the chosen ones in parallel, and report the pipeline. Use when the owner says "săn job", "chạy hôm nay", "daily", or wants the full loop rather than one step.
---

# Daily hunt

1. **Pipeline first.** `npm run fl -- track --stage bid` and `--stage chat`: remind the owner of
   bids awaiting replies and chats to answer (those beat new bids).
2. **Search.** `npm run fl -- search --top 15`.
3. **Triage.** Spawn the `job-scout` agent with the top ids (split into 2 agents if > 8 ids, so
   they run in parallel). Merge their tables.
4. **Ask the owner** (Vietnamese) which to bid on — show bid/maybe only, with links. Mark the
   chosen ones `shortlist` and clear skips `skipped` with the reason.
5. **Draft.** Spawn one `proposal-writer` agent per chosen id, all in the same message. Collect
   their summaries; surface any `OWNER:` questions together.
6. **Review with the owner.** Show each proposal (first lines + amount + days). Apply edits.
   Mark `drafted`.
7. **Send.** Only on an explicit yes per bid: dry run `npm run fl -- bid <id> --amount … --days …`,
   then `--yes`. Without a token, give the text to paste and mark `bid` after they confirm.
8. **Close** with `npm run fl -- track` and one line: how many bids sent, allowance caveat
   (`docs/freelancer-guide.md`).
