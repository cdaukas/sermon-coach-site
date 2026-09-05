/**
 * Measures 2 and 3: witnessable ask + cost-naming via one Anthropic tool call.
 * Prompt/tool adapted from scripts/run_application_coding.py.
 */

import Anthropic from "@anthropic-ai/sdk";
import { landingZone, verifyQuoteInText } from "./landing-zone";
import { cleanSermonText } from "./text";

export type ApplicationAskCoding = {
  quote: string;
  named_object: boolean;
  named_cost: boolean;
};

export type SermonApplicationCoding = {
  sermonId: string;
  asks: ApplicationAskCoding[];
  namedObject: boolean;
  namedCost: boolean;
};

const SYSTEM_PROMPT = `You code sermon application asks for The Sermon Coach prep card.

LANDING-ZONE ASKS (asks[])
For every distinct ask inside the marked landing zone, return:
- quote: a verbatim contiguous substring copied from that landing zone
- named_object: true only if the ask passes the witnessability test, false otherwise
- named_cost: true if the ask acknowledges it will cost something

NAMED OBJECT IS THE WITNESSABILITY TEST.
The test is not the verb. It is whether the sermon supplied enough that someone other than the hearer could tell the command was obeyed. Grammatical direct object is not the variable.

Yes: "Move from once a month to twice a month." Someone else could tell.
No: "Do you know Jesus, who has become for us the wisdom of God?" Nobody but the hearer can tell. Know, see, trust, hold, remember, be content, focus your mind, stand in awe: all no.

Do not return objections or modes. Quotes must be exact contiguous substrings.
Return one sermons[] row for every sermon_id you were given.`;

const TOOL: Anthropic.Tool = {
  name: "submit_prep_card_ask_coding",
  description:
    "Landing-zone asks with named_object and named_cost booleans. No counts.",
  input_schema: {
    type: "object",
    required: ["sermons"],
    properties: {
      sermons: {
        type: "array",
        items: {
          type: "object",
          required: ["sermon_id", "asks"],
          properties: {
            sermon_id: { type: "string" },
            asks: {
              type: "array",
              items: {
                type: "object",
                required: ["quote", "named_object", "named_cost"],
                properties: {
                  quote: { type: "string" },
                  named_object: { type: "boolean" },
                  named_cost: { type: "boolean" },
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
    const zone = landingZone(sermon.raw);
    return (
      `## ${sermon.title}\nid: ${sermon.id}\n` +
      `zone_source: ${zone.source}\nzone_start: ${zone.start}\nzone_end: ${zone.end}\n\n` +
      `LANDING ZONE — code named_object and named_cost only on asks inside this span:\n\n` +
      `${zone.text}\n\n` +
      `FULL MANUSCRIPT (context only):\n\n${cleaned}`
    );
  });
  return (
    "Code every sermon below. One row per id. " +
    "Landing-zone asks go in asks[]. Quotes must be exact contiguous substrings.\n\n" +
    blocks.join("\n\n----\n\n")
  );
}

function extractToolInput(message: Anthropic.Message): unknown {
  for (const block of message.content) {
    if (
      block.type === "tool_use" &&
      block.name === "submit_prep_card_ask_coding"
    ) {
      return block.input;
    }
  }
  throw new Error("Model did not return submit_prep_card_ask_coding.");
}

function verifyAsksForSermon(
  raw: string,
  asks: ApplicationAskCoding[],
): ApplicationAskCoding[] {
  const cleaned = cleanSermonText(raw);
  const zone = landingZone(raw);
  const kept: ApplicationAskCoding[] = [];
  for (const ask of asks) {
    if (
      typeof ask.quote !== "string" ||
      typeof ask.named_object !== "boolean" ||
      typeof ask.named_cost !== "boolean"
    ) {
      continue;
    }
    const offset = verifyQuoteInText(
      cleaned,
      ask.quote,
      zone.start,
      zone.end,
    );
    if (offset == null) {
      continue;
    }
    kept.push({
      quote: ask.quote,
      named_object: ask.named_object,
      named_cost: ask.named_cost,
    });
  }
  return kept;
}

/**
 * One tool call for a batch of sermons. Returns per-sermon booleans for
 * measures 2 (named_object) and 3 (named_cost).
 */
export async function codeApplicationAsks(
  sermons: Array<{ id: string; title: string; raw: string }>,
  options?: { apiKey?: string; model?: string },
): Promise<SermonApplicationCoding[]> {
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
      asks?: ApplicationAskCoding[];
    }>;
  };

  const byId = new Map(
    sermons.map((sermon) => [sermon.id, sermon] as const),
  );
  const results: SermonApplicationCoding[] = [];

  for (const row of input.sermons ?? []) {
    const id = row.sermon_id;
    if (typeof id !== "string") {
      continue;
    }
    const sermon = byId.get(id);
    if (!sermon) {
      continue;
    }
    const asks = verifyAsksForSermon(sermon.raw, row.asks ?? []);
    results.push({
      sermonId: id,
      asks,
      namedObject: asks.some((ask) => ask.named_object),
      namedCost: asks.some((ask) => ask.named_cost),
    });
  }

  // Fill missing ids as empty (no positive hits)
  for (const sermon of sermons) {
    if (!results.some((row) => row.sermonId === sermon.id)) {
      results.push({
        sermonId: sermon.id,
        asks: [],
        namedObject: false,
        namedCost: false,
      });
    }
  }

  return results;
}
