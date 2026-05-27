export type Sermon = {
  id: string;
  user_id: string;
  title: string;
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

export type SermonWithLatestVersion = Sermon & {
  latest_version: SermonVersion | null;
};

export type CreateSermonInput = {
  title: string;
  content: string;
};

export type CreateSermonResult =
  | { ok: true; sermonId: string }
  | { ok: false; error: string };
