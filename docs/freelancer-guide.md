# How Freelancer.com works — the parts that matter for bidding

Notes for Claude and for you. Numbers marked *(verify)* change often or sources disagree —
check https://www.freelancer.com/feesandcharges and https://www.freelancer.com/membership
before relying on them.

## Money
- **Freelancer fee:** 10% of what you earn on fixed-price work (minimum $5) and 10% on hourly.
  Preferred Freelancer Program: 15%. *(verify)*
- So a $300 fixed bid nets about $270. Price with that in mind; `fl price` shows gross figures.
- Bids are entered in the **project's currency** (INR, EUR, AUD…). `fl show`/`fl draft` print both
  the project currency amount (what you type) and its USD value.
- Milestones: ask for one funded up front before starting. Never work outside the platform before
  a milestone is created — that is where disputes and scams happen.

## Bids
- Free membership has a small monthly bid allowance (6–8 depending on source) *(verify)*; paid
  plans raise it. Each bid is scarce, which is why `fl search` ranks and skips instead of listing all.
- Bid count tells you competition, not quality. Mobile projects here routinely get 50–150 bids
  (`fl price` shows the current median). Early bids get read more — freshness is part of the score.
- Sealed bids hide other bids' amounts; `bid_avg` is still exposed by the API.
- Some projects are gated: *Preferred Freelancers only*, *qualified* (needs a passed skill exam),
  NDA, IP agreement. `fl search` skips the first two.

## What gets a bid opened
The client sees a list: your photo, name, rating, price, delivery days and the **first ~150
characters** of the proposal. That snippet decides everything.
1. Open with their problem in their words, and your concrete answer — not "Hi, I read your post".
2. One proof that matches: an app on the store doing the same thing, with a link.
3. A short plan (2–4 steps, with milestones) and a clear delivery estimate.
4. One or two sharp questions that show you read the brief.
5. Under ~1,200 characters, plain text (no markdown), no copy-paste template feel.

## Red flags in a project
- Budget wildly below the scope ("Uber clone, $100").
- Asks to move to WhatsApp/Telegram/email before awarding, or to pay a "registration" fee.
- "Test task" that is the actual work, unpaid.
- Brand-new client with no payment verified *(the API needs a token to show this — check the page)*.
- Description is a copy of a whole app's spec with no priorities.

## Profile
What is shown in search results: headline, hourly rate, rating, review count, earnings score,
location, top skills. Reviews compound — early on, smaller fast jobs (bug fixes, store
releases, crash fixes, UI tweaks) buy the first 5-star reviews faster than big builds.
`profile/profile.md` + `fl profile` keep the profile honest.

## API (what this repo uses)
- Anonymous: active project search, project details, bid count/average, currency rates.
- Needs an OAuth token (`FREELANCER_TOKEN`): employer details, `users/0.1/self`, placing bids
  (`POST /projects/0.1/bids/`, header `freelancer-oauth-v1`). `fl bid` has not been run against
  a real account yet — try it first on a project you actually want, with the dry run.
- Docs: https://developers.freelancer.com
