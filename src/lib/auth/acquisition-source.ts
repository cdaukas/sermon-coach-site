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

export const ACQUISITION_SOURCE_OPTIONS = [
  { key: "pastor_friend", label: "A pastor or friend recommended it" },
  { key: "chris_email", label: "A personal email from Chris" },
  { key: "newsletter_blog", label: "The Friday email or a blog post" },
  { key: "gtn", label: "GTN" },
  { key: "search", label: "A web search" },
  { key: "social", label: "Social media" },
  { key: "other", label: "Something else" },
] as const satisfies ReadonlyArray<{
  key: AcquisitionSource;
  label: string;
}>;

/** Persist attribution for the signed-in user. No-op if RPC fails — never block start. */
export async function setAcquisitionSource(
  source: AcquisitionSource,
  detail?: string | null,
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.rpc("set_acquisition_source", {
    p_source: source,
    p_detail: source === "other" ? (detail?.trim() || null) : null,
  });

  if (error) {
    console.error("set_acquisition_source failed:", error.message);
  }
}
