/** Wait-state stage line and teaching slides. Timer-driven; no pipeline stage events. */

export const WAIT_STAGE_LABELS = [
  "Reading the manuscript...",
  "Working through the text...",
  "Structure and craft...",
  "Application and audience connection...",
  "Ecclesial and spiritual...",
  "Writing the growth edges...",
  "Finishing your read...",
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
    title: "The tune the passage is singing",
    body: "Simeon Trust calls it the melodic line. Every passage has one, and a sermon can be true in every sentence while singing a different tune than the text it opened.",
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

export const WAIT_TIME_ESTIMATE =
  "This usually takes about two minutes.";

/** Persistent line swaps here; slide 9 continues to hold. */
export const WAIT_OVERRUN_SECONDS = 150;

export const WAIT_TIME_OVERRUN =
  "Still working. Longer manuscripts take a little more time.";

export function timeEstimateForElapsed(elapsedSeconds: number): string {
  return elapsedSeconds >= WAIT_OVERRUN_SECONDS
    ? WAIT_TIME_OVERRUN
    : WAIT_TIME_ESTIMATE;
}

export function stageLabelForElapsed(elapsedSeconds: number): string {
  const elapsed = Math.max(0, elapsedSeconds);
  let index = 0;
  for (let i = STAGE_START_SECONDS.length - 1; i >= 0; i--) {
    if (elapsed >= STAGE_START_SECONDS[i]) {
      index = i;
      break;
    }
  }
  return WAIT_STAGE_LABELS[index];
}

/** 0-based slide index; holds on the last slide after the carousel finishes. */
export function slideIndexForElapsed(elapsedSeconds: number): number {
  const last = WAIT_SLIDES.length - 1;
  if (last < 0) return 0;
  const raw = Math.floor(Math.max(0, elapsedSeconds) / WAIT_SLIDE_DURATION_SECONDS);
  return Math.min(raw, last);
}

export function slideForElapsed(elapsedSeconds: number): WaitSlide {
  return WAIT_SLIDES[slideIndexForElapsed(elapsedSeconds)] ?? WAIT_SLIDES[0];
}
