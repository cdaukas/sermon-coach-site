import type { Tool } from "@anthropic-ai/sdk/resources/messages/messages";

/** JSON Schema for Anthropic tool `submit_sermon_evaluation` — keep in sync with evaluationResultStrictSchema. */
export const submitSermonEvaluationInputSchema = {
  type: "object" as const,
  additionalProperties: false,
  required: [
    "meta",
    "headline",
    "categories",
    "heatmap",
    "working",
    "growthOpportunities",
    "priorities",
    "rewrites",
    "methodology",
  ],
  properties: {
    meta: {
      type: "object",
      additionalProperties: false,
      required: ["title", "passage", "preacher", "length", "mode", "source"],
      properties: {
        title: { type: "string" },
        passage: { type: "string" },
        preacher: { type: "string" },
        length: { type: "string" },
        mode: { type: "string" },
        source: { type: "string", description: "e.g. manuscript upload" },
      },
    },
    headline: {
      type: "object",
      additionalProperties: false,
      required: [
        "score",
        "band",
        "strengthVerdict",
        "improvementVerdict",
      ],
      properties: {
        score: { type: "integer", minimum: 0, maximum: 100 },
        band: { type: "string", description: "e.g. B · Strong" },
        strengthVerdict: { type: "string" },
        improvementVerdict: { type: "string" },
      },
    },
    categories: {
      type: "array",
      minItems: 3,
      maxItems: 4,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["number", "title", "averageLabel", "criteria"],
        properties: {
          number: { type: "integer", minimum: 1 },
          title: { type: "string" },
          averageLabel: { type: "string" },
          criteria: {
            type: "array",
            minItems: 1,
            items: {
              type: "object",
              additionalProperties: false,
              required: ["name", "principle", "score", "detail"],
              properties: {
                name: { type: "string" },
                principle: { type: "string" },
                score: { type: "integer", minimum: 1, maximum: 5 },
                detail: { type: "string" },
                blockquotes: {
                  type: "array",
                  items: { type: "string" },
                },
              },
            },
          },
          growthItems: {
            type: "array",
            items: { type: "string" },
          },
        },
      },
    },
    heatmap: {
      type: "object",
      additionalProperties: false,
      required: ["disclaimer", "timeline", "rows"],
      properties: {
        disclaimer: { type: "string" },
        timeline: {
          type: "array",
          minItems: 1,
          items: {
            type: "object",
            additionalProperties: false,
            required: ["label", "register"],
            properties: {
              label: { type: "string" },
              register: { type: "string" },
              flex: { type: "number" },
            },
          },
        },
        rows: {
          type: "array",
          minItems: 1,
          items: {
            type: "object",
            additionalProperties: false,
            required: ["time", "beat", "register", "textSupport", "notes"],
            properties: {
              time: { type: "string" },
              beat: { type: "string" },
              register: { type: "string" },
              textSupport: { type: "string" },
              notes: { type: "string" },
            },
          },
        },
      },
    },
    working: {
      type: "array",
      minItems: 4,
      maxItems: 4,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["headline", "detail"],
        properties: {
          headline: { type: "string" },
          blockquote: { type: "string" },
          detail: { type: "string" },
        },
      },
    },
    growthOpportunities: {
      type: "array",
      minItems: 3,
      maxItems: 3,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["number", "headline", "principleBadge", "detail", "nextStep"],
        properties: {
          number: { type: "string" },
          headline: { type: "string" },
          principleBadge: { type: "string" },
          detail: { type: "string" },
          nextStep: { type: "string" },
        },
      },
    },
    priorities: {
      type: "array",
      minItems: 3,
      maxItems: 3,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["number", "headline", "rationale", "practicalStep"],
        properties: {
          number: { type: "string" },
          headline: { type: "string" },
          rationale: { type: "string" },
          practicalStep: { type: "string" },
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
        required: ["label", "headline", "analysis", "weak", "strong"],
        properties: {
          label: { type: "string" },
          headline: { type: "string" },
          analysis: { type: "string" },
          weak: { type: "string" },
          strong: { type: "string" },
        },
      },
    },
    methodology: {
      type: "object",
      additionalProperties: false,
      required: [
        "summary",
        "bands",
        "simpleScore",
        "weightedScore",
        "explainer",
        "subtotals",
        "mathNotes",
      ],
      properties: {
        summary: { type: "string" },
        bands: {
          type: "array",
          minItems: 1,
          items: {
            type: "object",
            additionalProperties: false,
            required: ["letter", "range", "band", "meaning"],
            properties: {
              letter: { type: "string" },
              range: { type: "string" },
              band: { type: "string" },
              meaning: { type: "string" },
              isCurrent: { type: "boolean" },
            },
          },
        },
        simpleScore: { type: "integer", minimum: 0, maximum: 100 },
        weightedScore: { type: "integer", minimum: 0, maximum: 100 },
        explainer: { type: "string" },
        subtotals: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: ["category", "score"],
            properties: {
              category: { type: "string" },
              score: { type: "string" },
            },
          },
        },
        mathNotes: { type: "string" },
      },
    },
  },
};

export const submitSermonEvaluationTool: Tool = {
  name: "submit_sermon_evaluation",
  description:
    "Submit the complete structured sermon evaluation JSON. All sections are required.",
  input_schema: submitSermonEvaluationInputSchema,
};
