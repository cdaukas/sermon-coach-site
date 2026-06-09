import type { EvaluationResultStrict } from "./schema";

/** Static payload for stub evaluations — SCHEMA_SPEC v2 strict shape */
export const EVALUATION_FIXTURE: EvaluationResultStrict = {
  meta: {
    sermon_title: "Boasting That Sounds Like Defeat",
    scripture_reference: "2 Corinthians 11:16–33",
    preacher_name: "Sample Preacher",
    church_or_context: "Fixture church",
    estimated_length_minutes: 40,
    series_name: null,
    submission_mode: "manuscript",
    audio_available: false,
  },
  scoring: {
    composite_simple: 40,
    composite_weighted: 39,
    band: "Strong",
    raw_total: 40,
    raw_max: 55,
  },
  verdict: {
    affirmation:
      "The central paradox — boasting in weakness — lands with clarity and stays tethered to the text. Listeners leave knowing what Paul is doing and why it matters for them.",
    improvement:
      "The single highest-leverage change for the next sermon: let the Paton illustration breathe for thirty fewer words, then spend those recovered seconds crossing the bridge into a named, present-day life situation.",
  },
  categories: [
    {
      id: "text_and_theology",
      name: "Text & Theology",
      number: 1,
      criteria: [
        {
          id: 1,
          name: "Textual fidelity & exegesis",
          category: 1,
          tradition_tag: "Simeon Trust",
          score: 4,
          narrative:
            "The sermon names Paul's foolish-boasting frame and keeps the hardship list tied to apostolic legitimacy rather than generic suffering.",
          anchored_quote: {
            text: "Paul is not asking you to perform weakness — he is displaying what Christ's power looks like when strength is refused.",
            approximate_location: "closing",
          },
          is_double_weighted: false,
        },
        {
          id: 2,
          name: "Christ-centered / redemptive arc",
          category: 1,
          tradition_tag: "Chapell",
          score: 4,
          narrative:
            "The contrast with the super-apostles stays Christward — weakness is displayed as the shape of apostolic legitimacy, not moralism.",
          anchored_quote: null,
          is_double_weighted: false,
        },
        {
          id: 3,
          name: "Gospel clarity",
          category: 1,
          tradition_tag: "Piper",
          score: 4,
          narrative:
            "The closing invitation makes grace audible: sinful weakness borne to the grave and back, not generic trust-more faith.",
          anchored_quote: {
            text: "Fall into the arms of the one who bore your sinful weakness all the way into the grave and back again.",
            approximate_location: "closing",
          },
          is_double_weighted: true,
        },
      ],
    },
    {
      id: "structure_and_craft",
      name: "Structure & Craft",
      number: 2,
      criteria: [
        {
          id: 4,
          name: "Fallen Condition Focus",
          category: 2,
          tradition_tag: "Chapell",
          score: 3,
          narrative:
            "The sermon implies a fallen condition — drawn to visible strength, ashamed of weakness — but never states it as one portable sentence at structural seams.",
          anchored_quote: null,
          is_double_weighted: true,
        },
        {
          id: 5,
          name: "Structure",
          category: 2,
          tradition_tag: "Simeon Trust",
          score: 4,
          narrative:
            "Each movement has a clear headline and the catalog of trials feels inevitable once the rhetorical game is named.",
          anchored_quote: null,
          is_double_weighted: false,
        },
        {
          id: 6,
          name: "Hard things handled",
          category: 2,
          tradition_tag: "Simeon Trust",
          score: 3,
          narrative:
            "Paul's irony is not softened, though the hardest rhetorical sting in vv. 19–21 could surface earlier.",
          anchored_quote: {
            text: "He's going to play the game. Let's boast — I can boast according to the flesh too.",
            approximate_location: "mid-sermon",
          },
          is_double_weighted: false,
        },
      ],
    },
    {
      id: "application_and_audience",
      name: "Application & Audience Connection",
      number: 3,
      criteria: [
        {
          id: 7,
          name: "Application to present audience",
          category: 3,
          tradition_tag: "Keller",
          score: 3,
          narrative:
            "Hearers are told to boast in weakness but given few worked examples of what that looks like Monday morning; the 'voices in your life' question stays outward.",
          anchored_quote: {
            text: "Is there a voice in your life filled with swagger — the celebrity pastor, the politician?",
            approximate_location: "application",
          },
          is_double_weighted: true,
        },
        {
          id: 8,
          name: "Emotional arc and dynamics",
          category: 3,
          tradition_tag: "Simeon Trust",
          score: 3,
          narrative:
            "The emotional arc is partially designed (irony, catalog, doxological landing) but holds one register too long in the middle; the turn to doxology could be engineered more deliberately on the page.",
          anchored_quote: null,
          is_double_weighted: false,
        },
        {
          id: 9,
          name: "Pastoral specificity",
          category: 3,
          tradition_tag: "Keller",
          score: 4,
          narrative:
            "The swagger question names recognizable categories of influence, even when it does not yet turn inward.",
          anchored_quote: null,
          is_double_weighted: false,
        },
      ],
    },
    {
      id: "ecclesial_and_spiritual",
      name: "Ecclesial & Spiritual",
      number: 4,
      criteria: [
        {
          id: 10,
          name: "Ecclesial faithfulness",
          category: 4,
          tradition_tag: "9Marks",
          score: 4,
          narrative:
            "The sermon functions expositionally — the church hears the Word applied to congregational life, not a detached lecture.",
          anchored_quote: null,
          is_double_weighted: false,
        },
        {
          id: 11,
          name: "Expository exultation",
          category: 4,
          tradition_tag: "Piper",
          score: 4,
          narrative:
            "The closing invitation nudges toward trust in Christ's sufficiency without moralizing weakness as performance.",
          anchored_quote: null,
          is_double_weighted: false,
        },
      ],
    },
  ],
  heat_map: null,
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
  top_priorities: [
    {
      rank: 1,
      headline: "Write the FCF as one sentence and place it at three structural seams.",
      principle_tag: "Chapell · Fallen Condition Focus",
      rationale:
        "The sermon already implies the FCF without naming it; stating it once at introduction, application, and gospel landing would anchor the middle movements.",
      practical_step:
        "Tape the sentence to the top of the manuscript and re-read after every major section.",
    },
    {
      rank: 2,
      headline: "Turn application from outward diagnosis to inward confession.",
      principle_tag: "Keller · Application to present audience",
      rationale:
        "The current question keeps the listener safe as a critic of other voices rather than examining their own.",
      practical_step:
        "Script outward then inward questions before preaching the application block.",
    },
    {
      rank: 3,
      headline: "Add one concrete Monday-morning scene.",
      principle_tag: "Keller · Pastoral specificity",
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
};

export const EVALUATION_FIXTURE_PROMPT_VERSION = "fixture-v3";
