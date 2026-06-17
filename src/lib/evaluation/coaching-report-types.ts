/** Client-safe coaching report types — no server or schema imports. */

export type CoachingStrengthPresentation = {
  claim: string;
  quote: string;
  development?: string;
  /** @deprecated Legacy cached coaching rows store affirmation prose as `why`. */
  why?: string;
};

export type CoachingNarrativePresentation = {
  lead_with_this: CoachingStrengthPresentation[];
  how_to_grow: {
    edge: string;
    this_week: string;
  };
  what_it_looks_like: {
    before: string;
    after: string;
    what_changed: string;
  };
};

export type CoachingReportPresentation = {
  sermonTitle: string;
  scriptureReference: string;
  evaluatedAt: string;
  preacherName: string | null;
  submissionMode: string;
  overallBand: string;
  coachingNarrative: CoachingNarrativePresentation | null;
};
