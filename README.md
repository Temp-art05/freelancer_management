# freelancer_management

Find, price, bid on and track Freelancer.com jobs as a mobile developer — a small CLI over the
Freelancer API plus Claude Code skills that do the reading and writing. Built to be driven from
Claude Station (project **Freelancer**).

```sh
npm install                # dev deps only (typescript); needs Node 24+
npm run fl -- search       # ranked open mobile projects
npm run fl -- show 40790861
npm run fl -- price        # what mobile work pays right now
npm run fl -- draft 40790861   # proposals/40790861.md
npm run fl -- track        # your pipeline
npm run fl -- profile      # check profile/profile.md
```

Searching and pricing need no account. Placing bids (`fl bid`) needs an OAuth token in `.env`
(see `.env.example`) and always dry-runs unless given `--yes`.

With Claude: ask for `daily-hunt` (the full loop), `find-jobs`, `write-proposal <id>`, `price-research`, `setup-profile`
(see `.claude/skills/`; agents `job-scout` and `proposal-writer` in `.claude/agents/`). Tune ranking in `fl.config.json`. Background on fees, bids and what wins
in `docs/freelancer-guide.md`.

`npm test` · `npm run typecheck`
