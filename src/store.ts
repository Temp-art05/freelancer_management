import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { ROOT } from "./config.ts";

// The pipeline is one JSON file in data/ (gitignored). Small enough to read whole every time,
// and readable enough that Claude can open it directly.

export const STAGES = [
  "found", // seen in a search, not looked at yet
  "shortlist", // worth a bid
  "drafted", // proposal written in proposals/<id>.md
  "bid", // bid placed
  "chat", // employer replied / interviewing
  "won",
  "lost",
  "skipped",
] as const;
export type Stage = (typeof STAGES)[number];

export type Entry = {
  id: number;
  title: string;
  url: string;
  type: "fixed" | "hourly";
  budget: string;
  bids: number;
  score: number;
  stage: Stage;
  bidAmount?: string;
  note?: string;
  firstSeen: string;
  updated: string;
};

export type Pipeline = { entries: Record<string, Entry> };

const FILE = `${ROOT}/data/pipeline.json`;

export function load(file = FILE): Pipeline {
  try {
    return JSON.parse(readFileSync(file, "utf8")) as Pipeline;
  } catch {
    return { entries: {} };
  }
}

export function save(pipeline: Pipeline, file = FILE): void {
  mkdirSync(file.slice(0, file.lastIndexOf("/")), { recursive: true });
  writeFileSync(file, JSON.stringify(pipeline, null, 2) + "\n");
}

/** Records a search hit; an entry you already moved along keeps its stage and note. */
export function upsertFound(
  pipeline: Pipeline,
  e: Omit<Entry, "stage" | "firstSeen" | "updated">,
  now = new Date().toISOString(),
): Entry {
  const prev = pipeline.entries[e.id];
  const next: Entry = prev
    ? { ...prev, ...e, stage: prev.stage, note: prev.note, updated: now }
    : { ...e, stage: "found", firstSeen: now, updated: now };
  pipeline.entries[e.id] = next;
  return next;
}

export function setStage(
  pipeline: Pipeline,
  id: number,
  stage: Stage,
  extra: Partial<Pick<Entry, "note" | "bidAmount">> = {},
  now = new Date().toISOString(),
): Entry {
  const prev = pipeline.entries[id];
  if (!prev) throw new Error(`Project ${id} is not in the pipeline — run \`fl show ${id} --track\` first`);
  const next = { ...prev, ...extra, stage, updated: now };
  pipeline.entries[id] = next;
  return next;
}
