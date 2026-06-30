import { z } from "zod";
import type { Tool } from "@anthropic-ai/sdk/resources/messages/messages";

export const HIP_MOVEMENT_NAMES = [
  "The Open",
  "The Big Idea",
  "The Structural Logic",
  "The Illustrations",
  "The Landing",
] as const;

export type HipMovementName = (typeof HIP_MOVEMENT_NAMES)[number];

export const hipMovementSchema = z.object({
  name: z.enum(HIP_MOVEMENT_NAMES),
  body: z.string().min(1),
});

export const howItPreachesSchema = z.object({
  movements: z.tuple([
    hipMovementSchema,
    hipMovementSchema,
    hipMovementSchema,
    hipMovementSchema,
    hipMovementSchema,
  ]),
});

export type HowItPreaches = z.infer<typeof howItPreachesSchema>;

export const submitHowItPreachesTool: Tool = {
  name: "submit_how_it_preaches",
  description:
    "Submit the How It Preaches craft read — five movements in fixed order, each with HTML body prose quoting the sermon in span.q tags.",
  input_schema: {
    type: "object",
    additionalProperties: false,
    required: ["movements"],
    properties: {
      movements: {
        type: "array",
        minItems: 5,
        maxItems: 5,
        items: {
          type: "object",
          additionalProperties: false,
          required: ["name", "body"],
          properties: {
            name: {
              type: "string",
              enum: [...HIP_MOVEMENT_NAMES],
            },
            body: {
              type: "string",
              description:
                "Two to four sentences in second person. Wrap quoted sermon text in <span class=\"q\">...</span>.",
            },
          },
        },
      },
    },
  },
};

export function validateHowItPreachesMovements(
  data: HowItPreaches,
): HowItPreaches {
  for (let i = 0; i < HIP_MOVEMENT_NAMES.length; i++) {
    if (data.movements[i].name !== HIP_MOVEMENT_NAMES[i]) {
      throw new Error(
        `Movement ${i + 1} must be "${HIP_MOVEMENT_NAMES[i]}", got "${data.movements[i].name}".`,
      );
    }
  }
  return data;
}
