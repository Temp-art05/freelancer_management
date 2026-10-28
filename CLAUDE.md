# Freelancer workspace

This repo is where the owner — a **mobile developer** (iOS / Android / Flutter / Kotlin / Swift) —
finds, prices, bids on and tracks jobs on Freelancer.com, with Claude doing the legwork.
Talk to the owner in Vietnamese; write proposals and profile text in English unless the
project is in another language.

## Tools
`npm run fl -- <cmd>` (Node 24+, no build step). Run `npm run fl` for the list.

| Command | What for |
|---|---|
| `search [--query q] [--type fixed\|hourly]` | ranked open mobile projects, recorded in the pipeline |
| `show <id>` | full brief, fit reasons, suggested bid |
| `price [--query q]` | what the market pays right now |
| `draft <id>` | `proposals/<id>.md` with everything needed to write the proposal |
| `track` / `track set <id> <stage>` | the pipeline (`data/pipeline.json`) |
| `profile` | check `profile/profile.md` |
| `bid <id> --amount a --days d [--yes]` | place a bid; dry run without `--yes` |

Tuning lives in `fl.config.json` (skills, keywords, floors, max bids, hourly rate).
Domain notes: `docs/freelancer-guide.md` — read it before giving pricing or bidding advice.

## Skills and agents
- `daily-hunt` — the whole loop: pipeline → search → triage → shortlist → draft → send
- `find-jobs` — search, triage, shortlist
- `write-proposal` — write the bid text for one project
- `price-research` — what to charge, for a project or in general
- `setup-profile` — build or improve the profile
- agent `job-scout` — triages a batch of project ids, returns a verdict table
- agent `proposal-writer` — drafts one `proposals/<id>.md`; spawn one per project, in parallel

## Rules
- **Never run `fl bid ... --yes` unless the owner has said yes to that exact bid in this
  conversation** (amount, days, text). Placing a bid spends a limited monthly allowance and is
  public. Show the dry run first.
- Never invent experience, apps, reviews or numbers for the owner. If proof is missing, ask, or
  write around it. Portfolio facts come from `profile/profile.md` only.
- Bid amounts are in the project's currency, not USD.
- `data/` and `proposals/` are gitignored — they are the owner's private working state.

## Dev
`npm test` · `npm run typecheck`. TypeScript runs natively (type stripping): import with `.ts`
extensions, no enums or parameter properties.
