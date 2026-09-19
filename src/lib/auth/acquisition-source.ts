import { createClient } from "@/lib/supabase/client";

export const ACQUISITION_SOURCES = [
  "pastor_friend",
  "chris_email",
  "newsletter_blog",
  "gtn",
  "search",
  "social",
  "other",
] as const;

export type AcquisitionSource = (typeof ACQUISITION_SOURCES)[number];

/**
 * Sources that accept a free-text detail. Declared once and mirrored by the
 * `set_acquisition_source` RPC — the database is what actually enforces it,
 * because client UPDATE on profiles is revoked. Widening this list without
 * the matching migration means the detail is discarded silently.
 */
export const ACQUISITION_SOURCES_WITH_DETAIL = [
  "pastor_friend",
  "gtn",
  "other",
] as const satisfies ReadonlyArray<AcquisitionSource>;

export function acquisitionSourceAcceptsDetail(
  source: AcquisitionSource | null,
): boolean {
  return (
    source !== null &&
    (ACQUISITION_SOURCES_WITH_DETAIL as ReadonlyArray<AcquisitionSource>).includes(
      source,
    )
  );
}

/** Longest detail the column is asked to hold. Fits a name and a church, not a paragraph. */
export const ACQUISITION_DETAIL_MAX_LENGTH = 120;

export const ACQUISITION_SOURCE_OPTIONS = [
  {
    key: "pastor_friend",
    label: "A pastor or friend recommended it",
    detailLabel: "Who was it? I'd like to thank them.",
  },
  { key: "chris_email", label: "A personal email from Chris" },
  { key: "newsletter_blog", label: "The Friday email or a blog post" },
  {
    key: "gtn",
    label: "GTN",
    detailLabel: "Who at GTN pointed you here?",
  },
  { key: "search", label: "A web search" },
  { key: "social", label: "Social media" },
  {
    key: "other",
    label: "Something else",
    detailLabel: "Tell me more.",
  },
] as const satisfies ReadonlyArray<{
  key: AcquisitionSource;
  label: string;
  detailLabel?: string;
}>;

export function acquisitionDetailLabel(
  source: AcquisitionSource | null,
): string | null {
  if (source === null) {
    return null;
  }

  const option = ACQUISITION_SOURCE_OPTIONS.find(
    (candidate) => candidate.key === source,
  );

  return option && "detailLabel" in option ? option.detailLabel : null;
}

/** Persist attribution for the signed-in user. No-op if RPC fails — never block start. */
export async function setAcquisitionSource(
  source: AcquisitionSource,
  detail?: string | null,
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.rpc("set_acquisition_source", {
    p_source: source,
    p_detail: acquisitionSourceAcceptsDetail(source)
      ? detail?.trim() || null
      : null,
  });

  if (error) {
    console.error("[setAcquisitionSource] set_acquisition_source failed", {
      callSite: "src/lib/auth/acquisition-source.ts#setAcquisitionSource",
      source,
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
  }
}
