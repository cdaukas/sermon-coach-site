export type SermonContext = {
  occasion?: string;
  audience?: string;
  series?: string;
  other?: string;
};

export type SermonContextInput = {
  occasion?: string;
  audience?: string;
  series?: string;
  other?: string;
};

export function sermonContextStorageKey(sermonId: string): string {
  return `sermonContext:${sermonId}`;
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

  const occasion = trimField(input.occasion);
  const audience = trimField(input.audience);
  const series = trimField(input.series);
  const other = trimField(input.other);

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

  return Object.keys(context).length > 0 ? context : undefined;
}

export function buildContextPreamble(context: SermonContext): string {
  const lines: string[] = ["PREACHING CONTEXT (provided by the preacher):"];

  if (context.occasion) {
    lines.push(`- Occasion: ${context.occasion}`);
  }
  if (context.audience) {
    lines.push(`- Audience / setting: ${context.audience}`);
  }
  if (context.series) {
    lines.push(`- Series: ${context.series}`);
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

  return lines.join("\n");
}
