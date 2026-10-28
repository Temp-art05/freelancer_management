import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { checkProfile, sections } from "../src/profile.ts";
import { config } from "./fixtures.ts";

test("sections splits on ## and drops comments", () => {
  assert.deepEqual(sections("# x\n## Headline\n<!-- hint -->\nSenior iOS dev\n## Skills\n- Swift"), {
    headline: "Senior iOS dev",
    skills: "- Swift",
  });
});

test("the shipped template is flagged as unfinished, not crashed on", () => {
  const findings = checkProfile(readFileSync("profile/profile.md", "utf8"), config);
  assert.ok(findings.some((f) => f.level !== "ok"));
});

test("missing sections fail", () => {
  const findings = checkProfile("## Headline\nAndroid & iOS developer", config);
  assert.ok(findings.some((f) => f.level === "fail" && /summary/.test(f.text)));
});
