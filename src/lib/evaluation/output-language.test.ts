import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  displayCategoryName,
  displayCriterionName,
  displayPrincipleTag,
  displayScoreBand,
  displayTraditionTag,
  evaluationReportCopy,
  parseCriterion2Wording,
  parseOutputLanguage,
  resolveRequestedOutputLanguage,
  SPANISH_EVALUATION_OUTPUT_INSTRUCTIONS,
} from "./output-language";

describe("output language gating", () => {
  it("treats anything except es as English", () => {
    assert.equal(parseOutputLanguage("es"), "es");
    assert.equal(parseOutputLanguage("en"), "en");
    assert.equal(parseOutputLanguage("fr"), "en");
    assert.equal(parseOutputLanguage(undefined), "en");
    assert.equal(parseOutputLanguage(true), "en");
  });

  it("ignores a Spanish request unless the account is flagged", () => {
    assert.equal(resolveRequestedOutputLanguage("es", false), "en");
    assert.equal(resolveRequestedOutputLanguage("es", true), "es");
    assert.equal(resolveRequestedOutputLanguage("en", true), "en");
  });
});

describe("Spanish display maps", () => {
  it("keeps English criterion names unless language is es", () => {
    assert.equal(
      displayCriterionName(3, "Gospel clarity", "en"),
      "Gospel clarity",
    );
    assert.equal(
      displayCriterionName(1, "Textual fidelity & exegesis", "es"),
      "Fidelidad al texto y exégesis",
    );
    assert.equal(
      displayCriterionName(2, "Christ-centered / redemptive arc", "es"),
      "Arco redentor centrado en Cristo",
    );
    assert.equal(
      displayCriterionName(
        2,
        "Christ-centered / redemptive arc",
        "es",
        "cristocentrico",
      ),
      "Arco redentor cristocéntrico",
    );
    assert.equal(
      displayCriterionName(3, "Gospel clarity", "es"),
      "Claridad del evangelio",
    );
    assert.equal(
      displayCriterionName(4, "Fallen Condition Focus", "es"),
      "Enfoque de la condición caída",
    );
    assert.equal(
      displayCriterionName(6, "Hard things handled", "es"),
      "Manejo de temas difíciles",
    );
    assert.equal(
      displayCriterionName(7, "Application to present audience", "es"),
      "Aplicación a los oyentes presentes",
    );
    assert.equal(
      displayCriterionName(9, "Pastoral specificity", "es"),
      "Concreción pastoral",
    );
    assert.equal(parseCriterion2Wording("alt"), "cristocentrico");
    assert.equal(parseCriterion2Wording(undefined), "default");
  });

  it("maps category ids and score bands for Spanish reports", () => {
    assert.equal(
      displayCategoryName("text_and_theology", "Text & Theology", "es"),
      "Texto y teología",
    );
    assert.equal(displayScoreBand("Faithful", "es"), "Fiel");
    assert.equal(displayScoreBand("Faithful", "en"), "Faithful");
    assert.equal(
      displayTraditionTag(1, "Simeon Trust · Expositional Preaching", "es"),
      "Simeon Trust · La predicación expositiva",
    );
    assert.equal(
      displayTraditionTag(6, "Simeon Trust · Workshop practice", "es"),
      "Simeon Trust · práctica de taller",
    );
    assert.equal(
      displayTraditionTag(10, "9Marks · Preach", "es"),
      "9Marcas · Preach",
    );
    assert.equal(
      displayTraditionTag(2, "Chapell · Christ-Centered Preaching", "en"),
      "Chapell · Christ-Centered Preaching",
    );
    assert.equal(
      displayPrincipleTag("Chapell · Fallen Condition Focus", "es"),
      "Chapell · Enfoque de la condición caída",
    );
    assert.equal(
      displayPrincipleTag("Keller · Application to present audience", "es"),
      "Keller · Aplicación a los oyentes presentes",
    );
    assert.equal(
      displayPrincipleTag("Keller · Preaching", "es"),
      "Keller · La predicación",
    );
    assert.equal(
      displayPrincipleTag("Chapell · Christ-Centered Preaching", "es"),
      "Chapell · La predicación cristocéntrica",
    );
    assert.equal(
      displayPrincipleTag("Robinson · Biblical Preaching", "es"),
      "Robinson · La predicación bíblica",
    );
  });

  it("keeps English report chrome by default", () => {
    const copy = evaluationReportCopy("en");
    assert.equal(copy.whereItsStrong, "Where It's Strong");
    assert.equal(copy.eyebrow, "Evaluation");
    assert.equal(copy.whatTheScoresMean, "What the scores mean");
    assert.equal(
      copy.criterionScaleLead,
      "Each of the eleven criteria is scored 1 to 5.",
    );
    assert.equal(
      copy.criterionScaleClose,
      "A 3 is not a failing mark. Most faithful weekly preaching lands at 3 on several criteria, and a sermon built of 3s and 4s is doing the work. A 4 asks for something beyond competence, and a 5 is worth studying, not flawless.",
    );
    assert.deepEqual(
      copy.criterionScoreMeanings.map((row) => row.score),
      [5, 4, 3, 2, 1],
    );
    assert.equal(
      copy.criterionScoreMeanings[0].meaning,
      "Excellent. Nothing this criterion asks for is missing, and another preacher could learn from how it was done.",
    );
    assert.equal(copy.melodicLineTitle, "The text");
    assert.equal(copy.melodicLinePassage, "This passage");
    assert.equal(copy.melodicLineReading, "Melodic line");
    assert.equal(
      copy.melodicLineReadingGloss,
      "the theme the whole book keeps returning to",
    );
  });

  it("maps the text-block chrome for Spanish reports", () => {
    const copy = evaluationReportCopy("es");
    assert.equal(copy.melodicLineTitle, "El texto");
    assert.equal(copy.melodicLinePassage, "Este pasaje");
    assert.equal(copy.melodicLineReading, "Línea melódica");
    assert.equal(
      copy.melodicLineReadingGloss,
      "el tema al que vuelve todo el libro",
    );
    assert.equal(copy.howItPreaches, "Cómo predica");
    assert.equal(copy.whatTheScoresMean, "Qué significan las puntuaciones");
    assert.equal(copy.criterionScaleLead, "Cada uno de los once criterios se puntúa del 1 al 5.");
    assert.equal(copy.backToLibrary, "Volver a la biblioteca");
    assert.equal(copy.printSavePdf, "Imprimir / Guardar como PDF");
    assert.equal(copy.whereItsStrong, "Dónde está fuerte");
    assert.equal(copy.summary, "Resumen");
    assert.equal(copy.runEvaluationAgain, "Volver a ejecutar The Evaluation");
    assert.equal(copy.viewManuscript, "Ver el manuscrito");
    assert.equal(copy.usesOneCredit, "Esto usa un crédito.");
    assert.equal(copy.firstEvaluationFree, "Tu primera evaluación es gratis.");
    assert.equal(copy.starting, "Iniciando…");
    assert.equal(
      copy.evaluationInProgress,
      "Ya hay una evaluación en curso para este sermón.",
    );
    assert.equal(copy.earlierEvaluations, "Evaluaciones anteriores");
    assert.equal(copy.criterion2Switcher, "Criterio 2");
    assert.equal(copy.tuesdayNudgeTitle, "Envíame el aviso del martes");
    assert.equal(copy.waitTimedOutTitle, "Esto está tardando más de lo debido");
    assert.equal(copy.coachingReport, "Informe de coaching");
    assert.equal(copy.backToMentoring, "Volver a la mentoría");
  });

  it("includes Reina-Valera 1960 in the Spanish output contract", () => {
    assert.match(SPANISH_EVALUATION_OUTPUT_INSTRUCTIONS, /Reina-Valera 1960/);
    assert.match(SPANISH_EVALUATION_OUTPUT_INSTRUCTIONS, /Never free-translate/);
    assert.match(
      SPANISH_EVALUATION_OUTPUT_INSTRUCTIONS,
      /canonical English enum/,
    );
    assert.match(
      SPANISH_EVALUATION_OUTPUT_INSTRUCTIONS,
      /No em-dashes \(U\+2014\)/,
    );
    assert.match(
      SPANISH_EVALUATION_OUTPUT_INSTRUCTIONS,
      /must begin by naming the book/,
    );
  });
});
