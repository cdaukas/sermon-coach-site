export type MenteeReads = "debrief" | "none";

export function parseMenteeReads(value: unknown): MenteeReads {
  return value === "none" ? "none" : "debrief";
}

/**
 * Whether this evaluation stays dark for the mentee. Live none hides all.
 * After a flip, created_at before debrief_visible_since stays dark.
 */
export function evaluationIsDarkForMentee(
  menteeReads: MenteeReads,
  debriefVisibleSince: string | null,
  createdAt: string,
): boolean {
  if (menteeReads === "none") {
    return true;
  }
  if (debriefVisibleSince == null) {
    return false;
  }
  return Date.parse(createdAt) < Date.parse(debriefVisibleSince);
}

/**
 * Hide "Not run" on the library when the mentee still cannot see a
 * mentored evaluation. Sermon created_at is the list-row proxy; the
 * sermon page uses evaluation created_at via mentee_sermon_is_dark_handoff.
 */
export function sermonHidesUnevaluatedBand(
  menteeReadsNone: boolean,
  debriefVisibleSince: string | null,
  sermonCreatedAt: string,
): boolean {
  if (menteeReadsNone) {
    return true;
  }
  if (debriefVisibleSince == null) {
    return false;
  }
  return Date.parse(sermonCreatedAt) < Date.parse(debriefVisibleSince);
}

/** Confirm copy when opening a dark seat to the debrief. Name only. */
export function enableDebriefConfirmBody(preacherName: string): string {
  return `${preacherName} will start seeing the coaching debrief and How It Preaches for sermons submitted from now on. Anything already submitted stays with you. Worth saying something before it turns up.`;
}

/** Handoff after a dark submission. Two sentences. Nothing else. */
export function menteeHandoffSentences(mentorName: string): [string, string] {
  return [
    `Your sermon went to ${mentorName}.`,
    "You'll hear from them about it.",
  ];
}

/** Invite-page replacement for the debrief line, dark invites only. */
export function darkInviteDebriefLine(mentorName: string): string {
  return `${mentorName} will read your sermons and talk with you about them. Everything comes through them.`;
}
