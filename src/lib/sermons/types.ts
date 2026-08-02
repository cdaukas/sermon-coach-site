export type Sermon = {
  id: string;
  user_id: string;
  title: string;
  primary_passage: string | null;
  created_at: string;
  updated_at: string;
};

export type SermonVersion = {
  id: string;
  sermon_id: string;
  content: string;
  version_number: number;
  created_at: string;
};

export type SermonListItem = Pick<
  Sermon,
  "id" | "title" | "created_at" | "updated_at"
>;

/** Dashboard home row — additive sibling of SermonListItem; does not change listSermons. */
export type DashboardSermonRow = {
  id: string;
  title: string;
  primary_passage: string | null;
  created_at: string;
  completeEvaluationCount: number;
  latestEvaluation: {
    id: string;
    score_band: string | null;
    completed_at: string | null;
  } | null;
};

export type SermonWithLatestVersion = Sermon & {
  latest_version: SermonVersion | null;
};

export type CreateSermonInput = {
  title: string;
  content: string;
  primaryPassage?: string;
};

export type CreateSermonResult =
  | { ok: true; sermonId: string }
  | { ok: false; error: string };
