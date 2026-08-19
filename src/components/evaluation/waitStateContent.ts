/** Wait-state stage line and teaching slides. Timer-driven; no pipeline stage events. */

import type { OutputLanguage } from "@/lib/evaluation/output-language";

export const WAIT_STAGE_LABELS = [
  "Reading the manuscript...",
  "Working through the text...",
  "Structure and craft...",
  "Application and audience connection...",
  "Ecclesial and spiritual...",
  "Writing the growth edges...",
  "Finishing your read...",
] as const;

const WAIT_STAGE_LABELS_ES = [
  "Leyendo el manuscrito...",
  "Trabajando el texto...",
  "Estructura y oficio...",
  "Aplicación y conexión con la audiencia...",
  "Eclesial y espiritual...",
  "Escribiendo los bordes de crecimiento...",
  "Terminando tu lectura...",
] as const;

/** Elapsed seconds at which each stage becomes active (inclusive lower bound). */
const STAGE_START_SECONDS = [0, 12, 32, 52, 72, 92, 110] as const;

export const WAIT_SLIDE_DURATION_SECONDS = 13;

export type WaitSlide = {
  title: string;
  body: string;
};

/** Full teaching set — ship to everyone until lifetime run count is cheap. */
export const WAIT_SLIDES: readonly WaitSlide[] = [
  {
    title: "Sourced, not invented",
    body: "The eleven criteria in this read come from Bryan Chapell, Tim Keller, John Piper, Haddon Robinson, the Simeon Trust workshop method, and 9Marks. Every one traces to a published source you can go read for yourself.",
  },
  {
    title: "The burden the text names",
    body: "Chapell asks what burden the passage addresses in the listener before it offers any relief. This read looks for that burden by name, not for a general problem loosely attached to the text.",
  },
  {
    title: "The tune the whole book is singing",
    body: "Simeon Trust calls it the melodic line: the theme that holds an entire book together. A sermon can be accurate verse by verse and still sit apart from the book it lives in. This read names that tune so you can hear it. It does not score it.",
  },
  {
    title: "Where the weight sits",
    body: "Three criteria count double: the fallen condition focus, gospel clarity, and application. A sermon can be well built and well delivered and still miss on all three, which is why they carry more.",
  },
  {
    title: "You will see a band, not a number",
    body: "Bands describe what a sermon is doing. A number invites you to compare yourself to someone else, which is not what this is for.",
  },
  {
    title: "What a 3 means",
    body: "A 3 is competent preaching that did its job. It is not a failing grade. Most faithful weekly sermons live at 3 and 4, and the distance between them is usually one specific choice, not a different level of gifting.",
  },
  {
    title: "Fives are rare on purpose",
    body: "A 5 means the criterion could not have been executed better in this sermon. That is a high bar and it should be. A read full of 5s would not be worth the time it took you to read it.",
  },
  {
    title: "What this read cannot do",
    body: "This evaluation does not know your congregation. It has not sat with the family in the third row or prayed with a grieving widow. It is a second set of eyes on the text and the craft. It is not the Holy Spirit, and it is not the people who know your church best.",
  },
  {
    title: "Start with the growth edges",
    body: "When the report opens, read the growth edges before the scores. That is where next Sunday gets better. The scores are the map. The edges are the work.",
  },
] as const;

const WAIT_SLIDES_ES: readonly WaitSlide[] = [
  {
    title: "Con fuente, no inventado",
    body: "Los once criterios de esta lectura vienen de Bryan Chapell, Tim Keller, John Piper, Haddon Robinson, el método de taller de Simeon Trust y 9Marcas. Cada uno remite a una fuente publicada que puedes ir a leer tú mismo.",
  },
  {
    title: "La carga que el texto nombra",
    body: "Chapell pregunta qué carga enfrenta el pasaje en el oyente antes de ofrecer alivio. Esta lectura busca esa carga por nombre, no un problema general pegado al texto.",
  },
  {
    title: "La melodía que canta todo el libro",
    body: "Simeon Trust la llama la línea melódica: el tema que sostiene un libro entero. Un sermón puede ser preciso versículo a versículo y aun así quedar aparte del libro en el que vive. Esta lectura nombra esa melodía para que la oigas. No la puntúa.",
  },
  {
    title: "Dónde está el peso",
    body: "Tres criterios cuentan doble: el enfoque de la condición caída, la claridad del evangelio y la aplicación. Un sermón puede estar bien construido y bien predicado y aun así fallar en los tres, por eso pesan más.",
  },
  {
    title: "Verás una banda, no un número",
    body: "Las bandas describen lo que un sermón está haciendo. Un número te invita a compararte con otro, y eso no es para lo que esto sirve.",
  },
  {
    title: "Qué significa un 3",
    body: "Un 3 es predicación competente que hizo su trabajo. No es un reprobado. La mayoría de los sermones semanales fieles viven en 3 y 4, y la distancia entre ellos suele ser una decisión concreta, no otro nivel de don.",
  },
  {
    title: "Los 5 son raros a propósito",
    body: "Un 5 significa que el criterio no podría haberse ejecutado mejor en este sermón. Es un listón alto, y debe serlo. Una lectura llena de 5 no valdría el tiempo que te tomó leerla.",
  },
  {
    title: "Lo que esta lectura no puede hacer",
    body: "Esta evaluación no conoce a tu congregación. No se ha sentado con la familia de la tercera fila ni ha orado con una viuda en duelo. Es un segundo par de ojos sobre el texto y el oficio. No es el Espíritu Santo, y no es la gente que mejor conoce tu iglesia.",
  },
  {
    title: "Empieza por los bordes de crecimiento",
    body: "Cuando se abra el informe, lee los bordes de crecimiento antes que las puntuaciones. Ahí es donde mejora el próximo domingo. Las puntuaciones son el mapa. Los bordes son el trabajo.",
  },
] as const;

export const WAIT_TIME_ESTIMATE =
  "This usually takes about two minutes.";

const WAIT_TIME_ESTIMATE_ES = "Esto suele tardar unos dos minutos.";

/** Persistent line swaps here; slide 9 continues to hold. */
export const WAIT_OVERRUN_SECONDS = 150;

export const WAIT_TIME_OVERRUN =
  "Still working. Longer manuscripts take a little more time.";

const WAIT_TIME_OVERRUN_ES =
  "Sigue trabajando. Los manuscritos más largos tardan un poco más.";

export function waitSlidesFor(
  language: OutputLanguage = "en",
): readonly WaitSlide[] {
  return language === "es" ? WAIT_SLIDES_ES : WAIT_SLIDES;
}

export function timeEstimateForElapsed(
  elapsedSeconds: number,
  language: OutputLanguage = "en",
): string {
  const overrun = elapsedSeconds >= WAIT_OVERRUN_SECONDS;
  if (language === "es") {
    return overrun ? WAIT_TIME_OVERRUN_ES : WAIT_TIME_ESTIMATE_ES;
  }
  return overrun ? WAIT_TIME_OVERRUN : WAIT_TIME_ESTIMATE;
}

export function stageLabelForElapsed(
  elapsedSeconds: number,
  language: OutputLanguage = "en",
): string {
  const elapsed = Math.max(0, elapsedSeconds);
  let index = 0;
  for (let i = STAGE_START_SECONDS.length - 1; i >= 0; i--) {
    if (elapsed >= STAGE_START_SECONDS[i]) {
      index = i;
      break;
    }
  }
  const labels = language === "es" ? WAIT_STAGE_LABELS_ES : WAIT_STAGE_LABELS;
  return labels[index];
}

/** 0-based slide index; holds on the last slide after the carousel finishes. */
export function slideIndexForElapsed(elapsedSeconds: number): number {
  const last = WAIT_SLIDES.length - 1;
  if (last < 0) return 0;
  const raw = Math.floor(Math.max(0, elapsedSeconds) / WAIT_SLIDE_DURATION_SECONDS);
  return Math.min(raw, last);
}

export function slideForElapsed(
  elapsedSeconds: number,
  language: OutputLanguage = "en",
): WaitSlide {
  const slides = waitSlidesFor(language);
  return slides[slideIndexForElapsed(elapsedSeconds)] ?? slides[0];
}
