export type MenteeReads = "debrief" | "none";

/** Mentee-facing when the mentor has no display_name. */
export const FALLBACK_MENTOR_NAME = "your mentor";

const LEGACY_MENTOR_FALLBACK = "a preacher you know";

/**
 * Normalize a mentor name for mentee-facing copy. Maps the old RPC fallback
 * and blank values to FALLBACK_MENTOR_NAME.
 */
export function menteeFacingMentorName(
  name: string | null | undefined,
): string {
  const trimmed = typeof name === "string" ? name.trim() : "";
  if (!trimmed || trimmed === LEGACY_MENTOR_FALLBACK) {
    return FALLBACK_MENTOR_NAME;
  }
  return trimmed;
}

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

/** Handoff after a dark submission. Three sentences. Nothing else. */
export function menteeHandoffSentences(
  mentorName: string,
): [string, string, string] {
  const name = menteeFacingMentorName(mentorName);
  const atSentenceStart = name.charAt(0).toUpperCase() + name.slice(1);
  return [
    `Sent to ${name}.`,
    `${atSentenceStart} will review it and reach out to you.`,
    "It will not appear in your account.",
  ];
}

/** Invite-page replacement for the debrief line, dark invites only. */
export function darkInviteDebriefLine(mentorName: string): string {
  return `${mentorName} will read your sermons and talk with you about them. Everything comes through them.`;
}

function sentenceStartMentorName(name: string): string {
  const normalized = menteeFacingMentorName(name);
  if (normalized.length === 0) {
    return normalized;
  }
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

export type MenteeSubmitStandingInput = {
  mentorName: string;
  /** debrief = Apprentice (including dark); evaluation = Colleague. */
  seatType: "debrief" | "evaluation";
  menteeReadsNone: boolean;
  used: number;
  cap: number;
};

/**
 * Standing line above the mentee submit control. Caller must only invoke
 * when used and cap are known numbers. Digits for the allotment count.
 */
export function menteeSubmitStandingLine(
  input: MenteeSubmitStandingInput,
): string {
  const mentor = menteeFacingMentorName(input.mentorName);
  const mentorStart = sentenceStartMentorName(input.mentorName);

  if (input.used >= input.cap) {
    return `${input.cap} of ${input.cap} sermons with ${mentor} this month. You can submit again on the 1st.`;
  }

  if (input.seatType === "debrief" && input.menteeReadsNone) {
    return `This sermon goes to ${mentor}. It will not appear in your account. ${mentorStart} will review it and reach out to you. ${input.used} of ${input.cap} this month.`;
  }

  if (input.seatType === "debrief") {
    return `This sermon goes to ${mentor}. You will get the coaching debrief and How It Preaches. ${mentorStart} decides when to release your score. ${input.used} of ${input.cap} this month.`;
  }

  return `This sermon goes to ${mentor}. You see everything, including the score, as soon as it is ready. ${input.used} of ${input.cap} this month.`;
}
