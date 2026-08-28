export type MenteeReads = "debrief" | "none";

export function parseMenteeReads(value: unknown): MenteeReads {
  return value === "none" ? "none" : "debrief";
}

/** Handoff after a dark submission. Two sentences. Nothing else. */
export function menteeHandoffSentences(mentorName: string): [string, string] {
  return [
    `Your sermon went to ${mentorName}.`,
    "He'll set up a time to talk with you about it.",
  ];
}

/** Invite-page replacement for the debrief line, dark invites only. */
export function darkInviteDebriefLine(mentorName: string): string {
  return `${mentorName} will read your sermons and talk with you about them. Everything comes through him.`;
}
