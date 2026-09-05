/**
 * Measure 9: local named-person valence.
 * Strengths-only. Coding call returns each local naming with a valence.
 * Hit: sermon has zero fault-valenced local namings.
 */

import Anthropic from "@anthropic-ai/sdk";
import { cleanSermonText } from "./text";
import { verifyQuoteInText } from "./landing-zone";

export type NamingValence = "praise" | "neutral" | "trouble" | "fault";

export type LocalNaming = {
  name: string;
  quote: string;
  valence: NamingValence;
};

export type SermonNamingCoding = {
  sermonId: string;
  namings: LocalNaming[];
  /** True when no local naming carries fault valence (including zero namings). */
  noFaultNaming: boolean;
};

const VALENCES = new Set<NamingValence>([
  "praise",
  "neutral",
  "trouble",
  "fault",
]);

const SYSTEM_PROMPT = `You code local person namings in sermons for The Sermon Coach prep card.

LOCAL NAMINGS ONLY.
A local naming is a real person named in connection with this congregation or this room: a member, visitor, family member of someone in the room, a living contemporary the preacher is talking about as present or nearby. Include the preacher naming himself.

NOT LOCAL (omit):
- Biblical characters (Paul, Moses, Mary, Peter)
- Historical figures and dead authors
- Generic roles with no proper name ("a mother", "someone at work")
- God, Jesus, Christ, the Spirit, the Father

VALENCE (exactly one per naming)
- praise: the person is held up positively
- neutral: named without evaluation
- trouble: the person is in hardship or need; not blamed
- fault: the person is blamed, shamed, or made the object of criticism

Return quote as a verbatim contiguous substring from the manuscript that contains the naming.
Return one sermons[] row for every sermon_id you were given.`;

const TOOL: Anthropic.Tool = {
  name: "submit_prep_card_naming_coding",
  description:
    "Local person namings with praise/neutral/trouble/fault valence. No counts.",
  input_schema: {
    type: "object",
    required: ["sermons"],
    properties: {
      sermons: {
        type: "array",
        items: {
          type: "object",
          required: ["sermon_id", "namings"],
          properties: {
            sermon_id: { type: "string" },
            namings: {
              type: "array",
              items: {
                type: "object",
                required: ["name", "quote", "valence"],
                properties: {
                  name: { type: "string" },
                  quote: { type: "string" },
                  valence: {
                    type: "string",
                    enum: ["praise", "neutral", "trouble", "fault"],
                  },
                },
              },
            },
          },
        },
      },
    },
  },
};

function buildUserPrompt(
  sermons: Array<{ id: string; title: string; raw: string }>,
): string {
  const blocks = sermons.map((sermon) => {
    const cleaned = cleanSermonText(sermon.raw);
    return `## ${sermon.title}\nid: ${sermon.id}\n\n${cleaned}`;
  });
  return (
    "Code every sermon below. One row per id. Local namings only, with valence.\n\n" +
    blocks.join("\n\n----\n\n")
  );
}

function extractToolInput(message: Anthropic.Message): unknown {
  for (const block of message.content) {
    if (
      block.type === "tool_use" &&
      block.name === "submit_prep_card_naming_coding"
    ) {
      return block.input;
    }
  }
  throw new Error("Model did not return submit_prep_card_naming_coding.");
}

function verifyNamingsForSermon(
  raw: string,
  namings: LocalNaming[],
): LocalNaming[] {
  const cleaned = cleanSermonText(raw);
  const kept: LocalNaming[] = [];
  for (const naming of namings) {
    if (
      typeof naming.name !== "string" ||
      typeof naming.quote !== "string" ||
      !VALENCES.has(naming.valence)
    ) {
      continue;
    }
    const offset = verifyQuoteInText(cleaned, naming.quote, 0, cleaned.length);
    if (offset == null) {
      continue;
    }
    kept.push({
      name: naming.name.trim(),
      quote: naming.quote,
      valence: naming.valence,
    });
  }
  return kept;
}

/**
 * One tool call for a batch of sermons. Returns per-sermon local namings
 * and a no-fault boolean for measure 9.
 */
export async function codeLocalNamings(
  sermons: Array<{ id: string; title: string; raw: string }>,
  options?: { apiKey?: string; model?: string },
): Promise<SermonNamingCoding[]> {
  if (sermons.length === 0) {
    return [];
  }

  const apiKey =
    options?.apiKey?.trim() || process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not set");
  }
  const model =
    options?.model?.trim() ||
    process.env.EVALUATION_MODEL?.trim() ||
    "claude-sonnet-4-6";

  const client = new Anthropic({ apiKey });
  const message = await client.messages.create({
    model,
    max_tokens: 16000,
    system: SYSTEM_PROMPT,
    tools: [TOOL],
    tool_choice: { type: "tool", name: TOOL.name },
    messages: [{ role: "user", content: buildUserPrompt(sermons) }],
  });

  const input = extractToolInput(message) as {
    sermons?: Array<{
      sermon_id?: string;
      namings?: LocalNaming[];
    }>;
  };

  const byId = new Map(sermons.map((sermon) => [sermon.id, sermon] as const));
  const results: SermonNamingCoding[] = [];

  for (const row of input.sermons ?? []) {
    const id = row.sermon_id;
    if (typeof id !== "string") {
      continue;
    }
    const sermon = byId.get(id);
    if (!sermon) {
      continue;
    }
    const namings = verifyNamingsForSermon(sermon.raw, row.namings ?? []);
    results.push({
      sermonId: id,
      namings,
      noFaultNaming: !namings.some((naming) => naming.valence === "fault"),
    });
  }

  for (const sermon of sermons) {
    if (!results.some((row) => row.sermonId === sermon.id)) {
      results.push({
        sermonId: sermon.id,
        namings: [],
        noFaultNaming: true,
      });
    }
  }

  return results;
}
