import type { Tool } from "@anthropic-ai/sdk/resources/messages/messages";

/** JSON Schema for Anthropic tool `submit_sermon_evaluation` — keep in sync with evaluationResultStrictSchema. */
export const submitSermonEvaluationInputSchema = {
  type: "object" as const,
  additionalProperties: false,
  required: [
    "meta",
    "scoring",
    "verdict",
    "categories",
    "heat_map",
    "whats_working",
    "growth_opportunities_detailed",
    "top_priorities",
    "rewrites",
    "fcf",
    "methodology_note",
  ],
  properties: {
    meta: {
      type: "object",
      additionalProperties: false,
      required: [
        "sermon_title",
        "scripture_reference",
        "preacher_name",
        "church_or_context",
        "estimated_length_minutes",
        "series_name",
        "submission_mode",
      ],
      properties: {
        sermon_title: { type: "string" },
        scripture_reference: { type: "string" },
        preacher_name: { type: ["string", "null"] },
        church_or_context: { type: ["string", "null"] },
        estimated_length_minutes: { type: "integer", minimum: 1 },
        series_name: { type: ["string", "null"] },
        submission_mode: {
          type: "string",
          enum: ["manuscript", "transcript", "manuscript-inferred"],
        },
      },
    },
    scoring: {
      type: "object",
      additionalProperties: false,
      required: [
        "composite_simple",
        "composite_weighted",
        "band",
        "letter",
        "diagnostic_gap",
        "raw_total",
        "raw_max",
      ],
      properties: {
        composite_simple: { type: "integer", minimum: 0, maximum: 100 },
        composite_weighted: { type: "integer", minimum: 0, maximum: 100 },
        band: {
          type: "string",
          enum: [
            "Exemplary",
            "Strong",
            "Faithful",
            "Needs Improvement",
            "Significant Concerns",
          ],
        },
        letter: { type: "string", enum: ["A", "B", "C", "D", "F"] },
        diagnostic_gap: { type: "integer" },
        raw_total: { type: "integer", minimum: 0 },
        raw_max: { type: "integer", minimum: 1 },
      },
    },
    verdict: {
      type: "object",
      additionalProperties: false,
      required: ["affirmation_paragraph", "improvement_sentence"],
      properties: {
        affirmation_paragraph: { type: "string" },
        improvement_sentence: { type: "string" },
      },
    },
    categories: {
      type: "array",
      minItems: 4,
      maxItems: 4,
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "id",
          "name",
          "number",
          "subtotal",
          "max",
          "average",
          "criteria",
          "growth_opportunities",
        ],
        properties: {
          id: {
            type: "string",
            enum: [
              "text_and_theology",
              "structure_and_craft",
              "application_and_audience",
              "ecclesial_and_spiritual",
            ],
          },
          name: { type: "string" },
          number: { type: "integer", minimum: 1, maximum: 4 },
          subtotal: { type: "integer", minimum: 0 },
          max: { type: "integer", minimum: 1 },
          average: { type: "number" },
          criteria: {
            type: "array",
            minItems: 1,
            items: {
              type: "object",
              additionalProperties: false,
              required: [
                "name",
                "source",
                "principle_tag",
                "score",
                "weighted",
                "detail_paragraphs",
                "anchored_quote",
              ],
              properties: {
                name: { type: "string" },
                source: { type: "string" },
                principle_tag: { type: "string" },
                score: { type: "integer", minimum: 1, maximum: 5 },
                weighted: { type: "boolean" },
                detail_paragraphs: {
                  type: "array",
                  minItems: 1,
                  maxItems: 5,
                  items: { type: "string" },
                },
                anchored_quote: {
                  anyOf: [
                    {
                      type: "object",
                      additionalProperties: false,
                      required: ["text", "approximate_location"],
                      properties: {
                        text: { type: "string" },
                        approximate_location: { type: "string" },
                      },
                    },
                    { type: "null" },
                  ],
                },
              },
            },
          },
          growth_opportunities: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              required: ["headline", "explanation"],
              properties: {
                headline: { type: "string" },
                explanation: { type: "string" },
              },
            },
          },
        },
      },
    },
    heat_map: {
      type: "object",
      additionalProperties: false,
      required: [
        "audio_processed",
        "warning_note",
        "total_minutes",
        "beats",
      ],
      properties: {
        audio_processed: { type: "boolean" },
        warning_note: { type: ["string", "null"] },
        total_minutes: { type: "integer", minimum: 1 },
        beats: {
          type: "array",
          minItems: 1,
          items: {
            type: "object",
            additionalProperties: false,
            required: [
              "time_start_seconds",
              "time_end_seconds",
              "time_display",
              "label",
              "register",
              "text_supports",
              "notes",
            ],
            properties: {
              time_start_seconds: { type: "integer", minimum: 0 },
              time_end_seconds: { type: "integer", minimum: 0 },
              time_display: { type: "string" },
              label: { type: "string" },
              register: {
                type: "string",
                enum: [
                  "diagnostic",
                  "teaching",
                  "reverent",
                  "pastoral",
                  "convicting",
                  "climactic",
                  "awe",
                  "tender",
                  "doxological",
                  "declarative",
                ],
              },
              text_supports: {
                type: "string",
                enum: ["strong", "yes", "partial", "mismatch"],
              },
              notes: { type: "string" },
            },
          },
        },
      },
    },
    whats_working: {
      type: "array",
      minItems: 3,
      maxItems: 5,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["headline", "anchored_quote", "explanation"],
        properties: {
          headline: { type: "string" },
          anchored_quote: { type: ["string", "null"] },
          explanation: { type: "string" },
        },
      },
    },
    growth_opportunities_detailed: {
      type: "array",
      minItems: 3,
      maxItems: 3,
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "number",
          "headline",
          "principle_badge",
          "diagnosis_paragraphs",
          "next_step",
        ],
        properties: {
          number: { type: "integer", minimum: 1, maximum: 3 },
          headline: { type: "string" },
          principle_badge: { type: "string" },
          diagnosis_paragraphs: {
            type: "array",
            minItems: 1,
            maxItems: 5,
            items: { type: "string" },
          },
          next_step: { type: "string" },
        },
      },
    },
    top_priorities: {
      type: "array",
      minItems: 3,
      maxItems: 3,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["rank", "headline", "rationale", "practical_step"],
        properties: {
          rank: { type: "integer", minimum: 1, maximum: 3 },
          headline: { type: "string" },
          rationale: { type: "string" },
          practical_step: { type: "string" },
        },
      },
    },
    rewrites: {
      type: "array",
      minItems: 1,
      maxItems: 2,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["moment_label", "analysis", "original", "rewrite"],
        properties: {
          moment_label: { type: "string" },
          analysis: { type: "string" },
          original: { type: "string" },
          rewrite: { type: "string" },
        },
      },
    },
    fcf: {
      type: "object",
      additionalProperties: false,
      required: ["named_in_sermon", "implied_fcf", "placement_notes"],
      properties: {
        named_in_sermon: { type: "boolean" },
        implied_fcf: { type: "string" },
        placement_notes: { type: ["string", "null"] },
      },
    },
    methodology_note: {
      type: "object",
      additionalProperties: false,
      required: ["diagnostic_summary"],
      properties: {
        diagnostic_summary: { type: "string" },
      },
    },
  },
};

export const submitSermonEvaluationTool: Tool = {
  name: "submit_sermon_evaluation",
  description:
    "Submit the complete structured sermon evaluation JSON. All sections are required. Use snake_case field names exactly as in the schema.",
  input_schema: submitSermonEvaluationInputSchema,
};
