/**
 * Fixed movement-report copy. Selected by measure + verdict.
 * The model writes nothing on this report.
 */

import type { PrepMeasureId } from "@/lib/prep-card/measures";

/** Short verdict-table labels (spec examples). */
export const MOVEMENT_MEASURE_LABEL: Partial<Record<PrepMeasureId, string>> = {
  2: "Making obedience visible",
  3: "Naming the cost",
  4: "Finishing the conclusion",
  5: "Keeping points in the passage",
  7: "Asking for one another",
  9: "Naming people without fault",
  12: "Addressing the one who does not yet believe",
};

export function movementMeasureLabel(id: PrepMeasureId): string {
  return MOVEMENT_MEASURE_LABEL[id] ?? `Measure ${id}`;
}

const MOVED: Partial<Record<PrepMeasureId, string>> = {
  2: "The asks got concrete. Where the earlier set left people with a feeling to carry home, the newer sermons name something someone else could see. That is the discipline, and the count moved with it.",
  3: "The cost showed up in the ask. The newer sermons name a price in words rather than hoping the room will infer one. That is harder to write on Saturday, and the count shows it.",
  7: "The ask started needing someone else in the room. Confession, encouragement, or a shared step — the newer sermons stop sending people home to obey alone.",
  4: "The endings landed as written. The newer sermons leave the room somewhere rather than signaling that the sermon is over.",
  5: "The points stayed with the passage. The newer outlines break the pattern less often where a point used to arrive from outside the text.",
};

const HELD: Partial<Record<PrepMeasureId, string>> = {
  2: "Making obedience visible held. Twelve weeks of attention and the rate did not change. That is worth knowing rather than working around.",
  3: "Naming the cost held. Twelve weeks of attention and the rate did not change. That is worth knowing rather than working around.",
  7: "Asking for one another held. Twelve weeks of attention and the rate did not change. That is worth knowing rather than working around.",
  4: "Finishing the conclusion held. Twelve weeks of attention and the rate did not change. That is worth knowing rather than working around.",
  5: "Keeping points in the passage held. Twelve weeks of attention and the rate did not change. That is worth knowing rather than working around.",
};

const HELD_TRY: Partial<Record<PrepMeasureId, string>> = {
  2: "Before you write the ask, write the witness test in the margin: who could see this happen by Friday? If you cannot name a person, rewrite the ask before you leave the desk.",
  3: "After the ask is drafted, add one clause that names the price in dollars, hours, or a relationship. If the clause feels too sharp to preach, that is usually the clause the room needs.",
  7: "Underline every second-person plural in the application. If none of them require a face across the aisle, replace one private ask with a shared one before you print.",
  4: "Write the last two sentences of the conclusion before you write the introduction. Put them at the top of the manuscript and do not touch them until the body is done.",
  5: "List the point heads in a column and strike any head that could sit under a different text. Rewrite the struck head from the passage before you outline the rest.",
};

const SLIPPED: Partial<Record<PrepMeasureId, string>> = {
  2: "Making obedience visible slipped. The rate went down under attention. That is an uncomfortable finding and it stands without a softer reading.",
  3: "Naming the cost slipped. The rate went down under attention. That is an uncomfortable finding and it stands without a softer reading.",
  7: "Asking for one another slipped. The rate went down under attention. That is an uncomfortable finding and it stands without a softer reading.",
  4: "Finishing the conclusion slipped. The rate went down under attention. That is an uncomfortable finding and it stands without a softer reading.",
  5: "Keeping points in the passage slipped. The rate went down under attention. That is an uncomfortable finding and it stands without a softer reading.",
};

export function movedParagraph(id: PrepMeasureId): string {
  return (
    MOVED[id] ??
    "This discipline moved. The newer sermons show the count climbing, in the preacher's own words."
  );
}

export function heldParagraph(id: PrepMeasureId): string {
  return (
    HELD[id] ??
    "This discipline held. Twelve weeks of attention and the rate did not change. That is worth knowing rather than working around."
  );
}

export function heldTryNext(id: PrepMeasureId): string {
  return (
    HELD_TRY[id] ??
    "Try one concrete move this week that is different from the diagnostic question — not the same instruction louder."
  );
}

export function slippedParagraph(id: PrepMeasureId): string {
  return (
    SLIPPED[id] ??
    "This discipline slipped. The rate went down under attention. That is an uncomfortable finding and it stands without a softer reading."
  );
}

export function formatSampleFace(params: {
  baselineSize: number;
  comparisonSize: number;
  sampleLabel: string | null;
}): string {
  const baseline =
    params.sampleLabel && params.sampleLabel.trim()
      ? `Your ${params.baselineSize} sermons, ${params.sampleLabel.trim()}`
      : `Your first ${params.baselineSize} sermons`;
  return `${baseline}, against the ${params.comparisonSize} you have preached since.`;
}

export function waitingCopy(have: number, need: number): string {
  return `Your movement report opens at ${need} new sermons. You have ${have}.`;
}
