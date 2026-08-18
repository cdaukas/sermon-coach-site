import { HIP_MOVEMENT_NAMES } from "./hip-schema";

export const OUTPUT_LANGUAGES = ["en", "es"] as const;
export type OutputLanguage = (typeof OUTPUT_LANGUAGES)[number];

export function parseOutputLanguage(value: unknown): OutputLanguage {
  return value === "es" ? "es" : "en";
}

export function resolveRequestedOutputLanguage(
  requested: unknown,
  spanishEnabled: boolean,
): OutputLanguage {
  if (!spanishEnabled) {
    return "en";
  }
  return parseOutputLanguage(requested);
}

export const SPANISH_EVALUATION_OUTPUT_INSTRUCTIONS = `## OUTPUT LANGUAGE (SPANISH)

Write the entire evaluation in Spanish — a pastoral, literate Latin American register. All coaching prose must be Spanish: criterion narratives (including the per-criterion close), verdict.affirmation, verdict.improvement, whats_working headlines and explanations, top_priorities headlines/rationales/practical_steps, rewrite analysis/original/rewrite/moment_label, heat_map beat_label and notes, melodic_line_and_big_idea.book / .passage / .melodic_line, tradition_tag may stay as the English source names.

Keep JSON keys and schema-locked enum values in English:
- criterion \`name\` must remain the canonical English enum from the rubric (the app maps display names)
- \`scoring.band\` must remain the English band enum (Exemplary, Strong, Faithful, Needs Improvement, Significant Concerns)
- category \`id\`, heat_map \`register\`, \`text_supports\`, and \`melodic_line_and_big_idea.reading_source\` stay English enums
- You MAY write category \`name\` as a Spanish display label

PER-CRITERION CLOSE — write the required close sentence in Spanish, same job as the English format:
- Scores 1 to 4: "Para llegar a un [next score], [cambio concreto anclado a este sermón]."
- Score 5: "Para mantener esto, [práctica concreta anclada a este sermón]."
Word limits on verdict.affirmation and verdict.improvement still apply (count Spanish words the same way).

## SCRIPTURE (REINA-VALERA 1960)

When you cite the preacher's biblical text, quote Reina-Valera 1960 (RVR1960) or name the passage without quoting it. Never free-translate a verse into Spanish yourself. Quotes of the preacher's own sermon language stay in the manuscript's language.`;

export const SPANISH_HIP_OUTPUT_INSTRUCTIONS = `## OUTPUT LANGUAGE (SPANISH)

Write every movement \`body\` in Spanish — pastoral, literate Latin American register. Keep each movement \`name\` as the English enum required by the schema (The Open, The Big Idea, The Structural Logic, The Illustrations, The Landing). Quotes of the preacher's sermon language stay in the manuscript's language, still wrapped in \`<span class="q">...</span>\`.

When you cite the preacher's biblical text, quote Reina-Valera 1960 (RVR1960) or name the passage without quoting it. Never free-translate a verse.`;

export const SPANISH_VERDICT_LINE_OUTPUT_INSTRUCTIONS = `Write every verdict_line in Spanish. Keep the twelve-to-eighteen-word band. Canonical criterion names in this prompt stay English; the sentences you write are Spanish. Quotes of the preacher stay in the manuscript's language. When citing Scripture, quote Reina-Valera 1960 or name the passage without quoting it — never free-translate a verse.`;

const SPANISH_CRITERION_NAMES: Record<number, string> = {
  1: "Fidelidad textual y exégesis",
  2: "Arco redentor / centrado en Cristo",
  3: "Claridad del evangelio",
  4: "Enfoque en la condición caída",
  5: "Estructura",
  6: "Temas difíciles",
  7: "Aplicación a la audiencia presente",
  8: "Arco emocional y dinámica",
  9: "Especificidad pastoral",
  10: "Fidelidad eclesial",
  11: "Exultación expositiva",
};

const SPANISH_CATEGORY_NAMES: Record<string, string> = {
  text_and_theology: "Texto y teología",
  structure_and_craft: "Estructura y oficio",
  application_and_audience: "Aplicación y conexión con la audiencia",
  ecclesial_and_spiritual: "Eclesial y espiritual",
};

const SPANISH_SCORE_BANDS: Record<string, string> = {
  Exemplary: "Ejemplar",
  Strong: "Sólido",
  Faithful: "Fiel",
  "Needs Improvement": "Necesita mejorar",
  "Significant Concerns": "Preocupaciones graves",
};

const SPANISH_HIP_MOVEMENT_NAMES: Record<(typeof HIP_MOVEMENT_NAMES)[number], string> =
  {
    "The Open": "La apertura",
    "The Big Idea": "La idea central",
    "The Structural Logic": "La lógica estructural",
    "The Illustrations": "Las ilustraciones",
    "The Landing": "El cierre",
  };

const SPANISH_HEAT_MAP_REGISTERS: Record<string, string> = {
  humor: "humor",
  diagnostic: "diagnóstico",
  declarative: "declarativo",
  reverent: "reverente",
  pastoral: "pastoral",
  awe: "asombro",
  encouragement: "ánimo",
  convicting: "convicción",
  doxological: "doxológico",
  teaching: "enseñanza",
  climactic: "clímax",
  invitation: "invitación",
  tender: "tierno",
  info: "información",
};

export function displayCriterionName(
  id: number,
  englishName: string,
  language: OutputLanguage,
): string {
  if (language !== "es") {
    return englishName;
  }
  return SPANISH_CRITERION_NAMES[id] ?? englishName;
}

export function displayCategoryName(
  id: string,
  englishName: string,
  language: OutputLanguage,
): string {
  if (language !== "es") {
    return englishName;
  }
  return SPANISH_CATEGORY_NAMES[id] ?? englishName;
}

export function displayScoreBand(
  band: string,
  language: OutputLanguage,
): string {
  if (language !== "es") {
    return band;
  }
  return SPANISH_SCORE_BANDS[band] ?? band;
}

export function displayHipMovementName(
  name: string,
  language: OutputLanguage,
): string {
  if (language !== "es") {
    return name;
  }
  return SPANISH_HIP_MOVEMENT_NAMES[name as (typeof HIP_MOVEMENT_NAMES)[number]] ?? name;
}

export function displayHeatMapRegister(
  register: string,
  language: OutputLanguage,
): string {
  if (language !== "es") {
    return register;
  }
  return SPANISH_HEAT_MAP_REGISTERS[register.toLowerCase()] ?? register;
}

export function displaySubmissionMode(
  mode: string,
  language: OutputLanguage,
): string {
  if (language !== "es") {
    return mode;
  }
  if (mode === "manuscript") return "manuscrito";
  if (mode === "transcript") return "transcripción";
  return mode;
}

export function displayTextSupportLabel(
  textSupport: string,
  language: OutputLanguage,
): string {
  if (language !== "es") {
    switch (textSupport) {
      case "strong":
        return "✓ Strong";
      case "ok":
      case "yes":
        return "✓";
      case "partial":
        return "⚠ Partial";
      case "mismatch":
        return "✗ Mismatch";
      default:
        return "✓";
    }
  }

  switch (textSupport) {
    case "strong":
      return "✓ Fuerte";
    case "ok":
    case "yes":
      return "✓";
    case "partial":
      return "⚠ Parcial";
    case "mismatch":
      return "✗ No coincide";
    default:
      return "✓";
  }
}

export type EvaluationReportCopy = {
  eyebrow: string;
  sermon: string;
  preacher: string;
  mode: string;
  context: string;
  series: string;
  summary: string;
  seeMethodology: string;
  average: (score: string) => string;
  whereItsStrong: string;
  forTheNextSermon: string;
  whereYouCanGrow: string;
  inOrder: string;
  practicalStep: string;
  whatImprovementLooksLike: string;
  suggestedRewrite: (index: number) => string;
  whyThisWorks: string;
  original: string;
  improved: string;
  beyondTheRubric: string;
  howItPreaches: string;
  howItPreachesDeck: string;
  heatMap: string;
  heatMapColumns: [string, string, string, string, string];
  methodologyTitle: string;
  methodologySubtitle: string;
  howScored: string;
  compositeScore: string;
  internalWeighted: (score: number) => string;
  displayConversion: (weighted: number, display: string) => string;
  whyDoubleWeightLead: string;
  whyDoubleWeightBody: string;
  gradingBands: string;
  placesThisSermon: (display: string, band: string, weighted: number) => string;
  bandTableHeaders: [string, string, string, string];
  thisSermon: string;
  verdictImprovementFallback: string;
  gradingBandMeanings: Record<string, string>;
  melodicLineTitle: string;
  melodicLineBook: string;
  melodicLinePassage: string;
  melodicLineReading: string;
  melodicLinePreacherNote: string;
};

const ENGLISH_COPY: EvaluationReportCopy = {
  eyebrow: "Evaluation",
  sermon: "Sermon",
  preacher: "Preacher",
  mode: "Mode",
  context: "Context",
  series: "Series",
  summary: "Summary",
  seeMethodology: "See methodology for score",
  average: (score) => `Average ${score} / 5`,
  whereItsStrong: "Where It's Strong",
  forTheNextSermon: "For the next sermon",
  whereYouCanGrow: "Where You Can Grow",
  inOrder: "In order: highest leverage first",
  practicalStep: "Practical step",
  whatImprovementLooksLike: "What Improvement Looks Like",
  suggestedRewrite: (index) => `Suggested rewrite · Moment ${index}`,
  whyThisWorks: "Why this works",
  original: "Original",
  improved: "Improved",
  beyondTheRubric: "Beyond the rubric",
  howItPreaches: "How It Preaches",
  howItPreachesDeck:
    "How the sermon actually moves. The craft of it, in five movements from the open to the landing.",
  heatMap: "Heat Map · Emotional Beats",
  heatMapColumns: ["Time", "Beat", "Register", "Text supports?", "Notes"],
  methodologyTitle: "Methodology · Show Your Work",
  methodologySubtitle: "Score calculation · grading bands",
  howScored: "How this sermon was scored",
  compositeScore: "Composite score (display)",
  internalWeighted: (score) =>
    `Internal weighted score: ${score}/55`,
  displayConversion: (weighted, display) =>
    `Base-10 display converts weighted /55 ÷ 5.5 (${weighted} ÷ 5.5 = ${display}).`,
  whyDoubleWeightLead: "Why some criteria count twice.",
  whyDoubleWeightBody:
    "Three of the eleven criteria carry double weight in the composite score: Fallen Condition Focus, Gospel Clarity, and Application. These are the load-bearing tests of whether a sermon actually preaches the gospel to real people, not just whether it handles the text well, but whether it brings that text to bear on human fallenness, makes the good news unmistakable, and lands it in the hearer's actual life. A sermon can score respectably everywhere else and still miss the point if these three are weak, so the math reflects what the pulpit reflects.",
  gradingBands: "Grading Bands",
  placesThisSermon: (display, band, weighted) =>
    `Display score of ${display} places this sermon in ${band}. Band thresholds use the internal weighted /55 score (${weighted}/55).`,
  bandTableHeaders: ["Band", "Range (/55)", "Display (/10)", "What it means"],
  thisSermon: " ← this sermon",
  verdictImprovementFallback:
    "The single highest-leverage change for the next sermon:",
  gradingBandMeanings: {
    Exemplary: "Multiple criteria scored 5s. Worth studying or sharing.",
    Strong: "Most criteria scored 4s. Doing the work well.",
    Faithful: "Most criteria scored 3s. Faithfully doing the work.",
    "Needs Improvement":
      "Multiple criteria scored 2s. Real gaps to address.",
    "Significant Concerns":
      "Multiple criteria scored 1s. Address before preaching again.",
  },
  melodicLineTitle: "Melodic line and big idea",
  melodicLineBook: "The book",
  melodicLinePassage: "This passage",
  melodicLineReading: "Melodic line",
  melodicLinePreacherNote: "Working from the line you named.",
};

const SPANISH_COPY: EvaluationReportCopy = {
  eyebrow: "Evaluación",
  sermon: "Sermón",
  preacher: "Predicador",
  mode: "Modo",
  context: "Contexto",
  series: "Serie",
  summary: "Resumen",
  seeMethodology: "Véase la metodología para la puntuación",
  average: (score) => `Promedio ${score} / 5`,
  whereItsStrong: "Dónde está fuerte",
  forTheNextSermon: "Para el próximo sermón",
  whereYouCanGrow: "Dónde puedes crecer",
  inOrder: "En orden: el de mayor peso primero",
  practicalStep: "Paso práctico",
  whatImprovementLooksLike: "Cómo se ve la mejora",
  suggestedRewrite: (index) => `Reescritura sugerida · Momento ${index}`,
  whyThisWorks: "Por qué funciona",
  original: "Original",
  improved: "Mejorado",
  beyondTheRubric: "Más allá de la rúbrica",
  howItPreaches: "Cómo predica",
  howItPreachesDeck:
    "Cómo se mueve realmente el sermón. El oficio, en cinco movimientos desde la apertura hasta el cierre.",
  heatMap: "Mapa de calor · Pulsos emocionales",
  heatMapColumns: ["Tiempo", "Pulso", "Registro", "¿Sostiene el texto?", "Notas"],
  methodologyTitle: "Metodología · Mostrar el trabajo",
  methodologySubtitle: "Cálculo de la puntuación · bandas",
  howScored: "Cómo se puntuó este sermón",
  compositeScore: "Puntuación compuesta (pantalla)",
  internalWeighted: (score) =>
    `Puntuación ponderada interna: ${score}/55`,
  displayConversion: (weighted, display) =>
    `La pantalla en base 10 convierte ponderada /55 ÷ 5.5 (${weighted} ÷ 5.5 = ${display}).`,
  whyDoubleWeightLead: "Por qué algunos criterios cuentan doble.",
  whyDoubleWeightBody:
    "Tres de los once criterios llevan peso doble en la puntuación compuesta: Enfoque en la condición caída, Claridad del evangelio y Aplicación. Son las pruebas de carga de si un sermón realmente predica el evangelio a personas concretas: no solo si trata el texto con cuidado, sino si lleva ese texto a la condición caída, deja las buenas nuevas inconfundibles y las aterriza en la vida real del oyente. Un sermón puede puntuar decentemente en todo lo demás y aún así fallar el punto si estos tres están débiles, así que la matemática refleja lo que el púlpito refleja.",
  gradingBands: "Bandas de puntuación",
  placesThisSermon: (display, band, weighted) =>
    `La puntuación de pantalla de ${display} sitúa este sermón en ${band}. Los umbrales de banda usan la puntuación ponderada interna /55 (${weighted}/55).`,
  bandTableHeaders: ["Banda", "Rango (/55)", "Pantalla (/10)", "Qué significa"],
  thisSermon: " ← este sermón",
  verdictImprovementFallback:
    "El único cambio de mayor peso para el próximo sermón:",
  gradingBandMeanings: {
    Exemplary: "Varios criterios en 5. Vale la pena estudiarlo o compartirlo.",
    Strong: "La mayoría de los criterios en 4. Hace bien el trabajo.",
    Faithful: "La mayoría de los criterios en 3. Hace el trabajo con fidelidad.",
    "Needs Improvement":
      "Varios criterios en 2. Hay huecos reales que atender.",
    "Significant Concerns":
      "Varios criterios en 1. Atender antes de predicar de nuevo.",
  },
  melodicLineTitle: "Línea melódica e idea central",
  melodicLineBook: "El libro",
  melodicLinePassage: "Este pasaje",
  melodicLineReading: "Línea melódica",
  melodicLinePreacherNote: "A partir de la línea que nombraste.",
};

export function evaluationReportCopy(
  language: OutputLanguage,
): EvaluationReportCopy {
  return language === "es" ? SPANISH_COPY : ENGLISH_COPY;
}
