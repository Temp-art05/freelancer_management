---
name: write-proposal
description: Write the bid (proposal text, amount, delivery days) for one Freelancer.com project. Use when the owner says draft/write a bid or proposal for a project id or link, or "viết bid cho job này".
---

# Write a proposal

1. `npm run fl -- draft <id>` → `proposals/<id>.md` (brief, stats, suggested bid). If it already
   exists, read it and keep the owner's edits.
2. Read `profile/profile.md` for real proof. If there is no matching portfolio item, ask the owner
   for one ("có app nào tương tự không?") — never invent apps, clients or numbers.
3. Fill `## Questions for the client` (1–2 questions that only someone who read the brief asks).
4. Fill `## Bid`: amount in the **project's currency** (start from the suggestion; explain if you
   move it), days (realistic, not hopeful), milestone % (50 is normal for a first milestone).
5. Write `## Proposal` — plain text, no markdown, 600–1,200 characters:
   - Line 1–2 (the ~150 chars shown in the list): their problem in their words + your concrete
     answer. No "Hi", no "I read your post", no "I am an expert".
   - One proof matching their stack/problem, with a store link.
   - A 2–4 step plan with what they get at each milestone.
   - One question. Sign-off with your first name only.
   Match the brief's language. Mirror their terms (if they say "Flutter", don't say "cross-platform").
6. Show the owner the proposal and bid in chat, then `npm run fl -- track set <id> drafted`.
7. Only if the owner explicitly says to send it: run the dry run
   `npm run fl -- bid <id> --amount <a> --days <d>`, show it, and on a second clear yes add `--yes`.
   Without `FREELANCER_TOKEN`, tell them to paste it on the project page and then
   `npm run fl -- track set <id> bid --amount "<currency> <a>"`.
