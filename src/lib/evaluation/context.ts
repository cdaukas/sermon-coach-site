import type { ReportMode } from "./types";

export type { ReportMode } from "./types";

export type SermonContext = {
  church?: string;
  occasion?: string;
  audience?: string;
  series?: string;
  other?: string;
  /** Preacher's working book-level melodic line, when they have one. */
  workingMelodicLine?: string;
};

export type SermonContextInput = {
  church?: string;
  occasion?: string;
  audience?: string;
  series?: string;
  other?: string;
  workingMelodicLine?: string;
};

export function sermonContextStorageKey(sermonId: string): string {
  return `sermonContext:${sermonId}`;
}

export function sermonReportModeStorageKey(sermonId: string): string {
  return `sermonReportMode:${sermonId}`;
}

export function normalizeReportMode(value: unknown): ReportMode {
  if (value === "debrief") {
    return "debrief";
  }
  // Database backfill complete as of 2026-07-28. This branch remains solely
  // for stale sermonReportMode browser-storage values (still 'coaching').
  // Do not remove before 2027.
  if (value === "coaching") {
    return "debrief";
  }
  return "diagnostic";
}

function trimField(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export function normalizeSermonContext(
  input: SermonContextInput | undefined,
): SermonContext | undefined {
  if (!input) {
    return undefined;
  }

  const context: SermonContext = {};

  const church = trimField(input.church);
  const occasion = trimField(input.occasion);
  const audience = trimField(input.audience);
  const series = trimField(input.series);
  const other = trimField(input.other);
  const workingMelodicLine = trimField(input.workingMelodicLine);

  if (church) {
    context.church = church;
  }
  if (occasion) {
    context.occasion = occasion;
  }
  if (audience) {
    context.audience = audience;
  }
  if (series) {
    context.series = series;
  }
  if (other) {
    context.other = other;
  }
  if (workingMelodicLine) {
    context.workingMelodicLine = workingMelodicLine;
  }

  return Object.keys(context).length > 0 ? context : undefined;
}

export function buildContextPreamble(context: SermonContext): string {
  const lines: string[] = ["PREACHING CONTEXT (provided by the preacher):"];

  if (context.church) {
    lines.push(`- Church: ${context.church}`);
  }
  if (context.occasion) {
    lines.push(`- Occasion: ${context.occasion}`);
  }
  if (context.audience) {
    lines.push(`- Audience / setting: ${context.audience}`);
  }
  if (context.series) {
    lines.push(`- Series: ${context.series}`);
  }
  if (context.workingMelodicLine) {
    lines.push(
      `- Working melodic line for this book (named by the preacher): ${context.workingMelodicLine}`,
    );
  }
  if (context.other) {
    lines.push(`- Additional notes: ${context.other}`);
  }

  lines.push(
    "",
    "Use this context to read the sermon the way a trusted preaching mentor would",
    "who already knows the situation. Let it shape your narrative throughout: in your",
    "affirmation, name the room back to the preacher; in both your affirmation and",
    "improvement paragraphs, make observations specific to this occasion, this audience,",
    "and this moment in the series rather than generic.",
    "",
    "Scores may shift where the context genuinely bears on a criterion, such as whether",
    "the application reaches the actual people in the room. Unchanged or near-unchanged",
    "scores on an otherwise ordinary sermon are appropriate when the context does not",
    "materially change the read. The goal is a sharper, situation-specific narrative,",
    "not score movement for its own sake.",
    "",
    "This context informs understanding, not leniency. Hold the sermon to the full",
    "standard of the rubric. Do not raise or lower any score simply because of the",
    "setting. The rubric, criteria, and scoring are unchanged.",
  );

  if (context.workingMelodicLine) {
    lines.push(
      "",
      "MELODIC LINE OVERRIDE: The preacher named a working melodic line for this book.",
      "Use THAT line as the premise for `melodic_line_and_big_idea` and for the",
      "observation in criterion 1's narrative. Do not score against it. Name it as",
      "the preacher's reading before you comment. Set `reading_source` to `preacher`.",
    );
  }

  return lines.join("\n");
}
