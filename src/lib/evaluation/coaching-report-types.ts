/** Client-safe coaching report types — no server or schema imports. */

export type CoachingStrengthPresentation = {
  claim: string;
  quote: string;
  why: string;
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

export type CoachingReportCategoryPresentation = {
  id: string;
  number: number;
  name: string;
  band: string;
  scoreLabel: string;
  averageLabel: string;
};

export type CoachingReportPresentation = {
  sermonTitle: string;
  scriptureReference: string;
  evaluatedAt: string;
  preacherName: string | null;
  submissionMode: string;
  categories: CoachingReportCategoryPresentation[];
  coachingNarrative: CoachingNarrativePresentation | null;
};
