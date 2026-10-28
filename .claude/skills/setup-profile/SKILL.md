---
name: setup-profile
description: Build or improve the owner's Freelancer.com profile (headline, summary, skills, portfolio, rate) in profile/profile.md. Use when the owner asks to set up, write, review or improve their profile, or "setup hồ sơ".
---

# Set up the profile

1. Read `profile/profile.md` and run `npm run fl -- profile` to see what is missing.
2. Interview the owner (Vietnamese, a few questions at a time, only for gaps): years in mobile,
   platforms and stacks they actually ship, 3–6 apps with store links and what they did on each,
   notable numbers (downloads, ratings, crash-free rate), timezone/availability, target rate.
   Never fill gaps with made-up facts.
3. Write the sections in English:
   - **Headline** ≤ 60 chars: platform + stack + outcome.
   - **Summary** 150–300 words: first two lines = what you build, for whom, one proof. Then stack,
     kinds of work taken, how you work (milestones, updates, timezone), a call to action.
   - **Skills** using Freelancer's own names (see `fl.config.json` → `jobs`).
   - **Portfolio** lines: `- App — what you did — store link`.
   - **Hourly rate**: pick with `price-research`; keep `fl.config.json` → `hourlyRateUsd` in sync.
4. Re-run `npm run fl -- profile` until nothing is blocking.
5. Tell the owner exactly where each section goes on freelancer.com (Profile → Edit) and suggest
   1–2 skill exams relevant to their stack, since some projects require them.
