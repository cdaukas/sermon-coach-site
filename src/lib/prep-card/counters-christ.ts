/**
 * Theme 2 (Christ in the sermon) counters.
 *
 * C1 / C2 — UDPipe dependency parse (counters-agency.ts).
 * C3 — cross has a named object (coding call).
 * C4 — gospel word in a numbered main point (manuscript-only parser).
 * C5 — non-Christian address (reuses measure 12).
 */

import Anthropic from "@anthropic-ai/sdk";
import { measure12AddressesNonChristian } from "./counters-address";
import { quotableMainPoints } from "./counters-frame";
import {
  cleanSermonText,
  detectPrepSourceFormat,
} from "./text";

export {
  CHRIST_C1_MEASURE_ID,
  CHRIST_C2_MEASURE_ID,
  christAgencyDetail,
  christAgencyInPointsDetail,
  measureChristAgencyInPoint,
  measureChristAgencyInProse,
  measure6ChristInPoint,
} from "./counters-agency";

/** Prep measure id for C3 (cross named object). */
export const CHRIST_C3_MEASURE_ID = 8 as const;
/** Prep measure id for C4 (gospel in skeleton). */
export const CHRIST_C4_MEASURE_ID = 11 as const;
/** Prep measure id for C5 (outside the faith addressed). */
export const CHRIST_C5_MEASURE_ID = 12 as const;

/**
 * Gospel-content words that mark a live gospel move in a point head.
 * Drawn from the gospel-clarity outline test (corpus derivation).
 */
const GOSPEL_WORD =
  /\b(gospel|cross|crucif(?:y|ied|ixion)|blood|aton(?:e|ement)|redeem(?:ed|s|ing|er|ption)?|resurrection|risen|calvary|propitiat(?:e|ion)|justif(?:y|ied|ication)|reconcile[ds]?|reconciliation|wrath|curse|penalty|debt|grave|died|death|sacrifice|lamb|saved|salvation|grace|forgiveness|forgiven|bought|purchase[ds]?)\b/i;

/**
 * C4: true when any numbered / ALL-CAPS outline point contains a gospel word.
 * Manuscript-only. Transcripts return null (not false).
 */
export function measureGospelInSkeleton(
  raw: string,
  intakePath?: string | null,
): boolean | null {
  if (detectPrepSourceFormat(raw, intakePath) !== "manuscript") {
    return null;
  }
  const cleaned = cleanSermonText(raw);
  const points = quotableMainPoints(cleaned);
  if (points.length === 0) {
    return false;
  }
  return points.some((point) => GOSPEL_WORD.test(point));
}

/** First outline point that carries a gospel word, for evidence. */
export function measureGospelInSkeletonMatch(
  raw: string,
  intakePath?: string | null,
): string | null {
  if (detectPrepSourceFormat(raw, intakePath) !== "manuscript") {
    return null;
  }
  const cleaned = cleanSermonText(raw);
  for (const point of quotableMainPoints(cleaned)) {
    if (GOSPEL_WORD.test(point)) {
      return point;
    }
  }
  return null;
}

/** C5 alias — same detector as prep measure 12. */
export function measureChristAddressesNonChristian(raw: string): boolean {
  return measure12AddressesNonChristian(raw);
}

export type CrossObjectSpan = {
  quote: string;
  /** True when the cross / gospel move names a specific object. */
  named_object: boolean;
};

export type SermonCrossCoding = {
  sermonId: string;
  spans: CrossObjectSpan[];
  /** Hit: at least one gospel/cross span with a named object. */
  namedObject: boolean;
};

const CROSS_SYSTEM = `You code gospel / cross spans in sermons for The Sermon Coach.

Find contiguous spans where the preacher speaks of the cross, Christ's death, or the atonement.

named_object is true ONLY when the span names a specific thing the cross defeated, absorbed, purchased, or broke — e.g. wrath, the curse, the penalty, the debt, the grave, death, shame.

named_object is false when the object is empty or placeholder ("for our sins", "for us", "for the world") with no content given to it, or when the gospel hangs off a noun with no verb ("the cross of Christ", "the blood of Christ" as a modifier).

Return quote as a verbatim contiguous substring from the manuscript.
Return one sermons[] row for every sermon_id you were given. Empty spans[] is allowed.`;

const CROSS_TOOL: Anthropic.Tool = {
  name: "submit_prep_card_cross_coding",
  description:
    "Gospel/cross spans with named_object boolean. No counts.",
  input_schema: {
    type: "object",
    required: ["sermons"],
    properties: {
      sermons: {
        type: "array",
        items: {
          type: "object",
          required: ["sermon_id", "spans"],
          properties: {
            sermon_id: { type: "string" },
            spans: {
              type: "array",
              items: {
                type: "object",
                required: ["quote", "named_object"],
                properties: {
                  quote: { type: "string" },
                  named_object: { type: "boolean" },
                },
              },
            },
          },
        },
      },
    },
  },
};

function extractCrossToolInput(message: Anthropic.Message): unknown {
  for (const block of message.content) {
    if (
      block.type === "tool_use" &&
      block.name === "submit_prep_card_cross_coding"
    ) {
      return block.input;
    }
  }
  throw new Error("Model did not return submit_prep_card_cross_coding.");
}

function parseCrossCoding(
  input: unknown,
  expectedIds: string[],
): SermonCrossCoding[] {
  if (
    typeof input !== "object" ||
    input == null ||
    !("sermons" in input) ||
    !Array.isArray((input as { sermons: unknown }).sermons)
  ) {
    throw new Error("Cross coding tool input missing sermons[].");
  }
  const rows = (input as { sermons: unknown[] }).sermons;
  const byId = new Map<string, SermonCrossCoding>();
  for (const row of rows) {
    if (
      typeof row !== "object" ||
      row == null ||
      typeof (row as { sermon_id?: unknown }).sermon_id !== "string" ||
      !Array.isArray((row as { spans?: unknown }).spans)
    ) {
      continue;
    }
    const sermonId = (row as { sermon_id: string }).sermon_id;
    const spans: CrossObjectSpan[] = [];
    for (const span of (row as { spans: unknown[] }).spans) {
      if (
        typeof span !== "object" ||
        span == null ||
        typeof (span as { quote?: unknown }).quote !== "string" ||
        typeof (span as { named_object?: unknown }).named_object !== "boolean"
      ) {
        continue;
      }
      const quote = (span as { quote: string }).quote.trim();
      if (!quote) {
        continue;
      }
      spans.push({
        quote,
        named_object: (span as { named_object: boolean }).named_object,
      });
    }
    byId.set(sermonId, {
      sermonId,
      spans,
      namedObject: spans.some((s) => s.named_object),
    });
  }
  return expectedIds.map(
    (id) =>
      byId.get(id) ?? {
        sermonId: id,
        spans: [],
        namedObject: false,
      },
  );
}

/**
 * C3: code cross/gospel spans for named object.
 * Hit when any span names a specific thing the cross dealt with.
 */
export async function codeCrossNamedObjects(
  sermons: Array<{ id: string; title: string; raw: string }>,
  options?: { apiKey?: string; model?: string },
): Promise<SermonCrossCoding[]> {
  if (sermons.length === 0) {
    return [];
  }
  const apiKey = options?.apiKey ?? process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is required for cross coding.");
  }
  const model =
    options?.model ??
    process.env.EVALUATION_MODEL ??
    "claude-sonnet-4-6";
  const client = new Anthropic({ apiKey });

  const body = sermons
    .map((s) => {
      const cleaned = cleanSermonText(s.raw);
      const clipped =
        cleaned.length > 12000
          ? `${cleaned.slice(0, 12000)}\n\n[…truncated…]`
          : cleaned;
      return `### sermon_id=${s.id}\ntitle=${s.title}\n\n${clipped}`;
    })
    .join("\n\n");

  const message = await client.messages.create({
    model,
    max_tokens: 8192,
    system: CROSS_SYSTEM,
    tools: [CROSS_TOOL],
    tool_choice: { type: "tool", name: "submit_prep_card_cross_coding" },
    messages: [
      {
        role: "user",
        content:
          "Code named_object on gospel/cross spans in each sermon.\n\n" + body,
      },
    ],
  });

  return parseCrossCoding(
    extractCrossToolInput(message),
    sermons.map((s) => s.id),
  );
}
