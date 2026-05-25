import type { EvaluationResult } from "./schema";

/** Static payload for 6.2 stub — no Anthropic call */
export const EVALUATION_FIXTURE: EvaluationResult = {
  meta: {
    title: "Boasting That Sounds Like Defeat",
    passage: "2 Corinthians 11:16–33",
    preacher: "Sample Preacher",
    length: "~40 minutes",
    mode: "Expository",
    source: "Fixture (Step 6.2 stub)",
  },
  headline: {
    score: 74,
    band: "B · Strong",
    strengthVerdict:
      "The central paradox — boasting in weakness — lands with clarity and stays tethered to the text. Listeners leave knowing what Paul is doing and why it matters for them.",
    improvementVerdict:
      "Application stays general in the middle movements. Sharpen one concrete scene (family, workplace, or pastoral burden) so the boast in weakness becomes a decision, not only an idea.",
  },
  categories: [
    {
      number: 1,
      title: "Biblical Fidelity & Exegesis",
      averageLabel: "Avg 3.8 / 5",
      criteria: [
        {
          name: "Faithful handling of the text",
          principle: "Chapell · FCF",
          score: 4,
          detail:
            "The sermon names Paul's foolish-boasting frame and keeps the hardship list tied to apostolic legitimacy rather than generic suffering.",
          blockquotes: [
            "Paul is not asking you to perform weakness — he is displaying what Christ's power looks like when strength is refused.",
          ],
        },
        {
          name: "Context and structure",
          principle: "Simeon Trust",
          score: 4,
          detail:
            "The contrast with the 'super-apostles' is present; the hearer understands why the catalog of trials belongs here and not as detour.",
        },
      ],
      growthItems: [
        "Name the rhetorical sting in v. 19–21 earlier so the foolish-speech turn feels inevitable, not abrupt.",
      ],
    },
    {
      number: 2,
      title: "Gospel Logic & Christ-Centeredness",
      averageLabel: "Avg 3.5 / 5",
      criteria: [
        {
          name: "Christ as climax",
          principle: "Keller · Gospel",
          score: 4,
          detail:
            "Weakness is read through the cross and resurrection rather than moralized as humility theater.",
        },
        {
          name: "Grace vs. performance",
          principle: "Chapell · FCF",
          score: 3,
          detail:
            "The closing invitation nudges toward trust in Christ's sufficiency, but the middle still sounds like advice-heavy exhortation.",
        },
      ],
    },
    {
      number: 3,
      title: "Communication & Application",
      averageLabel: "Avg 3.4 / 5",
      criteria: [
        {
          name: "Clarity and movement",
          principle: "Robinson · Big Idea",
          score: 4,
          detail:
            "Each movement has a clear headline; transitions are mostly signposted.",
        },
        {
          name: "Specific application",
          principle: "9Marks · Application",
          score: 3,
          detail:
            "Hearers are told to 'boast in weakness' but given few worked examples of what that looks like Monday morning.",
        },
      ],
      growthItems: [
        "Add one negative example (religious swagger) and one positive example (quiet faithfulness under pressure).",
      ],
    },
  ],
};

export const EVALUATION_FIXTURE_PROMPT_VERSION = "fixture-v1";
