import { test } from "node:test";
import assert from "node:assert/strict";
import { setStage, upsertFound, type Pipeline } from "../src/store.ts";

const hit = { id: 7, title: "t", url: "u", type: "fixed" as const, budget: "$1–2", bids: 3, score: 50 };

test("a search hit does not reset a project you already moved along", () => {
  const p: Pipeline = { entries: {} };
  upsertFound(p, hit, "t1");
  setStage(p, 7, "bid", { note: "sent" }, "t2");
  const again = upsertFound(p, { ...hit, bids: 9 }, "t3");
  assert.equal(again.stage, "bid");
  assert.equal(again.note, "sent");
  assert.equal(again.bids, 9);
  assert.equal(again.firstSeen, "t1");
});

test("setStage on an unknown project fails loudly", () => {
  assert.throws(() => setStage({ entries: {} }, 1, "won"), /not in the pipeline/);
});
