import type { Tool } from "@anthropic-ai/sdk/resources/messages/messages";

/** Canonical criterion names — enum-locked; keep in sync with SCHEMA_SPEC.md and evaluationResultStrictSchema. */
export const CANONICAL_CRITERION_NAMES = [
  "Textual fidelity & exegesis",
  "Christ-centered / redemptive arc",
  "Gospel clarity",
  "Fallen Condition Focus",
  "Structure",
  "Hard things handled",
  "Application to present audience",
  "Emotional arc and dynamics",
  "Pastoral specificity",
  "Ecclesial faithfulness",
  "Expository exultation",
] as const;

/**
 * Locked `tradition_tag` values: author or org, middle dot, work.
 * The work is never the criterion name. Criterion 4's work is
 * Christ-Centered Preaching, not Fallen Condition Focus.
 */
export const CANONICAL_TRADITION_TAGS: Record<number, string> = {
  1: "Simeon Trust · Expositional Preaching",
  2: "Chapell · Christ-Centered Preaching",
  3: "Piper · The Supremacy of God in Preaching",
  4: "Chapell · Christ-Centered Preaching",
  5: "Robinson · Biblical Preaching",
  6: "Simeon Trust · Workshop practice",
  7: "Keller · Preaching",
  8: "Piper · Expository Exultation",
  9: "Keller · Preaching",
  10: "9Marks · Preach",
  11: "Piper · Expository Exultation",
};

export function traditionTagForCriterion(
  id: number,
  fallback?: string,
): string {
  return CANONICAL_TRADITION_TAGS[id] ?? fallback ?? "";
}

const heatMapRegisterEnum = [
  "humor",
  "diagnostic",
  "declarative",
  "reverent",
  "pastoral",
  "awe",
  "encouragement",
  "convicting",
  "doxological",
  "teaching",
  "climactic",
  "invitation",
  "tender",
  "info",
] as const;

const anchoredQuoteSchema = {
  anyOf: [
    {
      type: "object" as const,
      additionalProperties: false,
      required: ["text", "approximate_location"],
      properties: {
        text: { type: "string" as const },
        approximate_location: { type: "string" as const },
      },
    },
    { type: "null" as const },
  ],
};

const criterionSchema = {
  type: "object" as const,
  additionalProperties: false,
  required: ["id", "name", "category", "tradition_tag", "score", "narrative"],
  properties: {
    id: { type: "integer" as const, minimum: 1, maximum: 11 },
    name: { type: "string" as const, enum: [...CANONICAL_CRITERION_NAMES] },
    category: { type: "integer" as const, minimum: 1, maximum: 4 },
    tradition_tag: {
      type: "string" as const,
      description:
        "Locked source attribution: author or org, space, middle dot, space, work title. Use the exact string from the tradition_tag table. Never put the criterion name in the work slot.",
    },
    score: { type: "integer" as const, minimum: 1, maximum: 5 },
    narrative: { type: "string" as const },
    anchored_quote: anchoredQuoteSchema,
  },
};

function categorySchema(criteriaCount: 2 | 3) {
  return {
    type: "object" as const,
    additionalProperties: false,
    required: ["id", "name", "number", "criteria"],
    properties: {
      id: {
        type: "string" as const,
        enum: [
          "text_and_theology",
          "structure_and_craft",
          "application_and_audience",
          "ecclesial_and_spiritual",
        ],
      },
      name: { type: "string" as const },
      number: { type: "integer" as const, minimum: 1, maximum: 4 },
      criteria: {
        type: "array" as const,
        minItems: criteriaCount,
        maxItems: criteriaCount,
        items: criterionSchema,
      },
    },
  };
}

const heatMapObjectSchema = {
  type: "object" as const,
  additionalProperties: false,
  required: ["beats"],
  properties: {
    total_minutes: { type: "integer" as const, minimum: 1 },
    beats: {
      type: "array" as const,
      items: {
        type: "object" as const,
        additionalProperties: false,
        required: [
          "time_range",
          "beat_label",
          "register",
          "text_supports",
          "notes",
        ],
        properties: {
          time_range: { type: "string" as const },
          beat_label: { type: "string" as const },
          register: { type: "string" as const, enum: [...heatMapRegisterEnum] },
          text_supports: {
            type: "string" as const,
            enum: ["strong", "ok", "partial", "mismatch"],
          },
          notes: { type: "string" as const },
        },
      },
    },
  },
};

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
    "top_priorities",
    "rewrites",
    "melodic_line_and_big_idea",
  ],
  properties: {
    meta: {
      type: "object" as const,
      additionalProperties: false,
      required: [
        "sermon_title",
        "scripture_reference",
        "preacher_name",
        "church_or_context",
        "estimated_length_minutes",
        "series_name",
        "submission_mode",
        "audio_available",
      ],
      properties: {
        sermon_title: { type: "string" as const },
        scripture_reference: { type: "string" as const },
        preacher_name: { type: ["string", "null"] as const },
        church_or_context: { type: ["string", "null"] as const },
        estimated_length_minutes: { type: "integer" as const, minimum: 1 },
        series_name: { type: ["string", "null"] as const },
        submission_mode: {
          type: "string" as const,
          enum: ["manuscript", "transcript"],
        },
        audio_available: { type: "boolean" as const },
      },
    },
    scoring: {
      type: "object" as const,
      additionalProperties: false,
      required: [
        "composite_simple",
        "composite_weighted",
        "band",
        "raw_total",
        "raw_max",
      ],
      properties: {
        composite_simple: { type: "integer" as const, minimum: 11, maximum: 55 },
        composite_weighted: { type: "integer" as const, minimum: 11, maximum: 55 },
        band: {
          type: "string" as const,
          enum: [
            "Exemplary",
            "Strong",
            "Faithful",
            "Needs Improvement",
            "Significant Concerns",
          ],
        },
        raw_total: { type: "integer" as const, minimum: 11, maximum: 55 },
        raw_max: { type: "integer" as const, enum: [55] },
      },
    },
    verdict: {
      type: "object" as const,
      additionalProperties: false,
      required: ["affirmation", "improvement"],
      properties: {
        affirmation: { type: "string" as const },
        improvement: { type: "string" as const },
      },
    },
    categories: {
      type: "array" as const,
      minItems: 4,
      maxItems: 4,
      prefixItems: [
        categorySchema(3),
        categorySchema(3),
        categorySchema(3),
        categorySchema(2),
      ],
    },
    heat_map: {
      anyOf: [{ type: "null" as const }, heatMapObjectSchema],
    },
    whats_working: {
      type: "array" as const,
      minItems: 3,
      maxItems: 5,
      items: {
        type: "object" as const,
        additionalProperties: false,
        required: ["headline", "anchored_quote", "explanation"],
        properties: {
          headline: { type: "string" as const },
          anchored_quote: { type: ["string", "null"] as const },
          explanation: { type: "string" as const },
        },
      },
    },
    top_priorities: {
      type: "array" as const,
      minItems: 3,
      maxItems: 3,
      items: {
        type: "object" as const,
        additionalProperties: false,
        required: [
          "rank",
          "headline",
          "principle_tag",
          "rationale",
          "practical_step",
        ],
        properties: {
          rank: { type: "integer" as const, minimum: 1, maximum: 3 },
          headline: { type: "string" as const },
          principle_tag: { type: "string" as const },
          rationale: { type: "string" as const },
          practical_step: { type: "string" as const },
        },
      },
    },
    rewrites: {
      type: "array" as const,
      minItems: 1,
      maxItems: 2,
      items: {
        type: "object" as const,
        additionalProperties: false,
        required: ["moment_label", "analysis", "original", "rewrite"],
        properties: {
          moment_label: { type: "string" as const },
          analysis: { type: "string" as const },
          original: { type: "string" as const },
          rewrite: { type: "string" as const },
        },
      },
    },
    melodic_line_and_big_idea: {
      type: "object" as const,
      additionalProperties: false,
      required: ["book", "passage", "melodic_line", "reading_source"],
      properties: {
        book: {
          type: "string" as const,
          description:
            "The book, named. Short. 'Philippians.' Not an argument and not a score.",
        },
        passage: {
          type: "string" as const,
          description:
            "One sentence: the theme / big idea of this passage. Not the book's melodic line.",
        },
        melodic_line: {
          type: "string" as const,
          description:
            "One sentence. Always begin by naming the book in the first clause, then the unifying theme of the book as this report reads it. Example: 'Hebrews keeps returning to the superiority of Christ over every prior covenant mediator...' Do not open with a claim that omits the book. If the preacher named a working line, restate it and still name the book first. Exception: withheld or topical copy that explains there is no single book's line — do not force a book name. Descriptive, not a verdict.",
        },
        reading_source: {
          type: "string" as const,
          enum: ["preacher", "derived", "withheld"],
        },
      },
    },
  },
};

export const submitSermonEvaluationTool: Tool = {
  name: "submit_sermon_evaluation",
  description:
    "Submit the complete structured sermon evaluation JSON. Use snake_case field names exactly as in the schema. Exactly 11 criteria (3+3+3+2) with canonical names. heat_map is null when meta.audio_available is false. Include melodic_line_and_big_idea (not scored). Category subtotals are not submitted.",
  input_schema: submitSermonEvaluationInputSchema,
};
