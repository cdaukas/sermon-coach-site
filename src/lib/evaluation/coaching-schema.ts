import { z } from "zod";
import type { Tool } from "@anthropic-ai/sdk/resources/messages/messages";

export const coachingStrengthSchema = z.object({
  claim: z.string().min(1),
  quote: z.string().min(1),
  why: z.string().min(1),
});

export const coachingNarrativeSchema = z.object({
  lead_with_this: z.array(coachingStrengthSchema).min(2).max(3),
  how_to_grow: z.object({
    edge: z.string().min(1),
    this_week: z.string().min(1),
  }),
  what_it_looks_like: z.object({
    before: z.string().min(1),
    after: z.string().min(1),
    what_changed: z.string().min(1),
  }),
});

export type CoachingStrength = z.infer<typeof coachingStrengthSchema>;
export type CoachingNarrative = z.infer<typeof coachingNarrativeSchema>;

export const submitCoachingNarrativeTool: Tool = {
  name: "submit_coaching_narrative",
  description:
    "Submit the coaching narrative JSON for a completed sermon evaluation.",
  input_schema: {
    type: "object",
    additionalProperties: false,
    required: ["lead_with_this", "how_to_grow", "what_it_looks_like"],
    properties: {
      lead_with_this: {
        type: "array",
        minItems: 2,
        maxItems: 3,
        items: {
          type: "object",
          additionalProperties: false,
          required: ["claim", "quote", "why"],
          properties: {
            claim: { type: "string" },
            quote: { type: "string" },
            why: { type: "string" },
          },
        },
      },
      how_to_grow: {
        type: "object",
        additionalProperties: false,
        required: ["edge", "this_week"],
        properties: {
          edge: { type: "string" },
          this_week: { type: "string" },
        },
      },
      what_it_looks_like: {
        type: "object",
        additionalProperties: false,
        required: ["before", "after", "what_changed"],
        properties: {
          before: { type: "string" },
          after: { type: "string" },
          what_changed: { type: "string" },
        },
      },
    },
  },
};
