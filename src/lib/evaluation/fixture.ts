import type { EvaluationResult } from "./schema";

/** Static payload for stub evaluations — no Anthropic call */
export const EVALUATION_FIXTURE: EvaluationResult = {
  meta: {
    sermon_title: "Boasting That Sounds Like Defeat",
    scripture_reference: "2 Corinthians 11:16–33",
    preacher_name: "Sample Preacher",
    church_or_context: "Fixture church",
    estimated_length_minutes: 40,
    series_name: null,
    submission_mode: "manuscript",
  },
  scoring: {
    composite_simple: 73,
    composite_weighted: 74,
    band: "Strong",
    letter: "B",
    diagnostic_gap: 1,
    raw_total: 40,
    raw_max: 55,
  },
  verdict: {
    affirmation_paragraph:
      "The central paradox — boasting in weakness — lands with clarity and stays tethered to the text. Listeners leave knowing what Paul is doing and why it matters for them.",
    improvement_sentence:
      "Name the fallen condition as one present-tense sentence at the introduction, application turn, and gospel landing so the middle movements stay anchored.",
  },
  categories: [
    {
      id: "text_and_theology",
      name: "Text & Theology",
      number: 1,
      subtotal: 12,
      max: 15,
      average: 3.8,
      criteria: [
        {
          name: "Faithful handling of the text",
          source: "Chapell",
          principle_tag: "Chapell · FCF",
          score: 4,
          weighted: true,
          detail_paragraphs: [
            "The sermon names Paul's foolish-boasting frame and keeps the hardship list tied to apostolic legitimacy rather than generic suffering.",
          ],
          anchored_quote: {
            text: "Paul is not asking you to perform weakness — he is displaying what Christ's power looks like when strength is refused.",
            approximate_location: "closing",
          },
        },
        {
          name: "Context and structure",
          source: "Simeon Trust",
          principle_tag: "Simeon Trust · Context",
          score: 4,
          weighted: false,
          detail_paragraphs: [
            "The contrast with the super-apostles is present; the hearer understands why the catalog of trials belongs here.",
          ],
          anchored_quote: null,
        },
      ],
      growth_opportunities: [
        {
          headline: "Name the rhetorical sting earlier.",
          explanation:
            "Surface v. 19–21 in the introduction so the foolish-speech turn feels inevitable.",
        },
      ],
    },
    {
      id: "structure_and_craft",
      name: "Structure & Craft",
      number: 2,
      subtotal: 10,
      max: 15,
      average: 3.5,
      criteria: [
        {
          name: "Big idea / melodic line",
          source: "Robinson",
          principle_tag: "Robinson · Big Idea",
          score: 4,
          weighted: false,
          detail_paragraphs: [
            "Each movement has a clear headline; transitions are mostly signposted.",
          ],
          anchored_quote: null,
        },
      ],
      growth_opportunities: [],
    },
    {
      id: "application_and_audience",
      name: "Application & Audience",
      number: 3,
      subtotal: 10,
      max: 15,
      average: 3.4,
      criteria: [
        {
          name: "Application to present audience",
          source: "Keller",
          principle_tag: "Keller · Three Audiences",
          score: 3,
          weighted: true,
          detail_paragraphs: [
            "Hearers are told to boast in weakness but given few worked examples of what that looks like Monday morning.",
          ],
          anchored_quote: null,
        },
      ],
      growth_opportunities: [
        {
          headline: "Add one concrete scene.",
          explanation: "Script one negative and one positive example under three minutes each.",
        },
      ],
    },
    {
      id: "ecclesial_and_spiritual",
      name: "Ecclesial & Spiritual",
      number: 4,
      subtotal: 8,
      max: 10,
      average: 4,
      criteria: [
        {
          name: "Pastoral tone",
          source: "9Marks",
          principle_tag: "9Marks · Tone",
          score: 4,
          weighted: false,
          detail_paragraphs: [
            "The closing invitation nudges toward trust in Christ's sufficiency without moralizing weakness as performance.",
          ],
          anchored_quote: null,
        },
      ],
      growth_opportunities: [],
    },
  ],
  heat_map: {
    audio_processed: false,
    warning_note: "⚠ Inferred from manuscript — audio not processed",
    total_minutes: 40,
    beats: [
      {
        time_start_seconds: 0,
        time_end_seconds: 780,
        time_display: "0:00–13:00",
        label: "Context and irony setup",
        register: "teaching",
        text_supports: "yes",
        notes: "Front-loaded but clear",
      },
      {
        time_start_seconds: 980,
        time_end_seconds: 1080,
        time_display: "16:20–18:00",
        label: "Voices in your life",
        register: "convicting",
        text_supports: "partial",
        notes: "Asked outward more than inward",
      },
      {
        time_start_seconds: 2145,
        time_end_seconds: 2400,
        time_display: "35:45–40:00",
        label: "Gospel landing",
        register: "doxological",
        text_supports: "strong",
        notes: "Compressed but exact",
      },
    ],
  },
  whats_working: [
    {
      headline: "The exegetical refusal to soften Paul's irony",
      anchored_quote:
        "He's going to play the game. Let's boast — I can boast according to the flesh too.",
      explanation:
        "The sermon names the rhetorical stunt instead of domesticating it, and trusts the congregation to track the move.",
    },
    {
      headline: "Weakness read through the cross",
      anchored_quote: null,
      explanation:
        "Boasting in weakness is tied to resurrection power rather than humility theater.",
    },
    {
      headline: "The central paradox stays tethered to the text",
      anchored_quote: null,
      explanation:
        "Listeners leave knowing what Paul is doing in 11:16–33 and why it matters.",
    },
    {
      headline: "The gospel landing is unmistakable",
      anchored_quote:
        "Fall into the arms of the one who bore your sinful weakness all the way into the grave and back again.",
      explanation: "Invitation grammar is exact — sinful weakness, not abstraction.",
    },
  ],
  growth_opportunities_detailed: [
    {
      number: 1,
      headline: "Name the FCF as one sentence at the seams",
      principle_badge: "Chapell · Fallen Condition Focus",
      diagnosis_paragraphs: [
        "The sermon has a clear fallen condition but never states it as one portable sentence at structural seams.",
      ],
      next_step:
        "Write the FCF on a 3×5 card and re-read it after every major section.",
    },
    {
      number: 2,
      headline: "Press application inward, not only outward",
      principle_badge: "Keller · Three Audiences",
      diagnosis_paragraphs: [
        "The middle application warns about other people's swagger more than putting the listener's own voice on the hook.",
      ],
      next_step:
        "Write the application in two halves — outward identification, then inward confession.",
    },
    {
      number: 3,
      headline: "Plant the gospel earlier",
      principle_badge: "Piper · Expository Exultation",
      diagnosis_paragraphs: [
        "The clearest gospel sentence arrives very late; grace could be the air the sermon breathes earlier.",
      ],
      next_step: "Add one short gospel sentence around the 12–15 minute mark.",
    },
  ],
  top_priorities: [
    {
      rank: 1,
      headline: "Write the FCF as one sentence and place it at three structural seams.",
      rationale:
        "High diagnostic leverage — double-weighted — and the sermon already implies the FCF without naming it.",
      practical_step:
        "Tape the sentence to the top of the manuscript and re-read after every major section.",
    },
    {
      rank: 2,
      headline: "Turn application from outward diagnosis to inward confession.",
      rationale:
        "The current question keeps the listener safe as a critic of other voices.",
      practical_step:
        "Script outward then inward questions before preaching the application block.",
    },
    {
      rank: 3,
      headline: "Add one concrete Monday-morning scene.",
      rationale: "Boast in weakness stays general without embodied examples.",
      practical_step:
        "Script one negative and one positive example under three minutes each.",
    },
  ],
  rewrites: [
    {
      moment_label: "Application section, minutes 16–18",
      analysis:
        "The question points at categories of bad influencers; the listener stays the discerning consumer.",
      original:
        "Is there a voice in your life filled with swagger — the celebrity pastor, the politician?",
      rewrite:
        "Is there a voice filled with swagger? And harder: whose voice are you when people hear your week?",
    },
  ],
  fcf: {
    named_in_sermon: false,
    implied_fcf:
      "We are drawn to visible strength and ashamed of weakness, and Christians are not immune.",
    placement_notes: null,
  },
  methodology_note: {
    diagnostic_summary:
      "Weighted score exceeds simple by 1 point — load-bearing criteria (FCF, gospel, application) slightly outperform supporting ones.",
  },
};

export const EVALUATION_FIXTURE_PROMPT_VERSION = "fixture-v2";
