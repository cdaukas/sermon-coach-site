import { createAdminClient } from "@/lib/supabase/admin";
import { coachingNarrativeSchema } from "./coaching-schema";
import type { CoachingReportPresentation } from "./coaching-report-types";
import { howItPreachesSchema } from "./hip-schema";
import type { HowItPreaches } from "./hip-schema";
import {
  formatDisplayScoreBare,
  formatStoredScoreBandForDisplay,
} from "./display-score";

/**
 * Hard-coded mentored pair for /sample-debrief.
 * Not selected via is_public_sample: that flag has a partial unique index
 * allowing only one true row on sermon_evaluations, already used by
 * /sample-evaluation. Flipping these would either collide with that index
 * or unflag the public evaluation sample. IDs are the selection mechanism.
 */
const SAMPLE_DEBRIEF_DIAGNOSTIC_ID =
  "59293eb9-d39f-4dbc-b20d-94557318d46c";
const SAMPLE_DEBRIEF_DEBRIEF_ID = "35ebacae-08df-4d8c-9423-580449fd7d27";

export type PublicSampleDebrief = {
  sermonTitle: string;
  primaryPassage: string | null;
  coaching: CoachingReportPresentation;
  howItPreaches: HowItPreaches;
  mentorScore: {
    /** Weighted /55, display numeral e.g. "8.2" */
    displayScore: string;
    /** Band label with legacy tier suffixes stripped */
    bandLabel: string;
    /** Internal weighted total for footer copy */
    weighted55: number;
  };
};

function toCoachingPresentation(
  narrative: ReturnType<typeof coachingNarrativeSchema.parse>,
  sermonTitle: string,
  primaryPassage: string | null,
  evaluatedAt: string,
): CoachingReportPresentation {
  return {
    sermonTitle,
    scriptureReference: primaryPassage,
    evaluatedAt,
    preacherName: null,
    submissionMode: null,
    overallBand: null,
    coachingNarrative: {
      lead_with_this: narrative.lead_with_this.map((strength) => ({
        claim: strength.claim,
        quote: strength.quote,
        development: strength.development,
      })),
      how_to_grow: {
        edge: narrative.how_to_grow.edge,
        this_week: narrative.how_to_grow.this_week,
      },
      what_it_looks_like: {
        before: narrative.what_it_looks_like.before,
        after: narrative.what_it_looks_like.after,
        what_changed: narrative.what_it_looks_like.what_changed,
      },
    },
  };
}

/**
 * Load the fixed mentored diagnostic + debrief pair for the public sample
 * debrief page via service role. Does not loosen RLS. Returns null when
 * either row is missing, incomplete, or fails validation.
 */
export async function getPublicSampleDebrief(): Promise<PublicSampleDebrief | null> {
  const admin = createAdminClient();

  const { data: rows, error } = await admin
    .from("sermon_evaluations")
    .select(
      "id, status, report_mode, result, overall_score, score_band, coaching_narrative, how_it_preaches, sermon_version_id, completed_at, created_at",
    )
    .in("id", [SAMPLE_DEBRIEF_DIAGNOSTIC_ID, SAMPLE_DEBRIEF_DEBRIEF_ID]);

  if (error) {
    console.error("[getPublicSampleDebrief] select failed", error);
    return null;
  }

  const diagnostic = rows?.find((row) => row.id === SAMPLE_DEBRIEF_DIAGNOSTIC_ID);
  const debrief = rows?.find((row) => row.id === SAMPLE_DEBRIEF_DEBRIEF_ID);

  if (
    !diagnostic ||
    diagnostic.status !== "complete" ||
    diagnostic.report_mode !== "diagnostic" ||
    diagnostic.result == null ||
    typeof diagnostic.overall_score !== "number"
  ) {
    console.error("[getPublicSampleDebrief] diagnostic row invalid", {
      found: Boolean(diagnostic),
      status: diagnostic?.status,
      report_mode: diagnostic?.report_mode,
      has_result: diagnostic?.result != null,
      overall_score: diagnostic?.overall_score,
    });
    return null;
  }

  if (
    !debrief ||
    debrief.status !== "complete" ||
    debrief.report_mode !== "debrief" ||
    debrief.coaching_narrative == null
  ) {
    console.error("[getPublicSampleDebrief] debrief row invalid", {
      found: Boolean(debrief),
      status: debrief?.status,
      report_mode: debrief?.report_mode,
      has_coaching: debrief?.coaching_narrative != null,
    });
    return null;
  }

  const coachingParsed = coachingNarrativeSchema.safeParse(
    debrief.coaching_narrative,
  );
  if (!coachingParsed.success) {
    console.error(
      "[getPublicSampleDebrief] coaching_narrative failed schema parse",
      coachingParsed.error,
    );
    return null;
  }

  const hipParsed = howItPreachesSchema.safeParse(debrief.how_it_preaches);
  if (!hipParsed.success) {
    console.error(
      "[getPublicSampleDebrief] how_it_preaches failed schema parse",
      hipParsed.error,
    );
    return null;
  }

  const { data: version, error: versionError } = await admin
    .from("sermon_versions")
    .select("sermon_id")
    .eq("id", diagnostic.sermon_version_id)
    .maybeSingle();

  if (versionError || !version) {
    console.error(
      "[getPublicSampleDebrief] sermon_version lookup failed",
      versionError,
    );
    return null;
  }

  const { data: sermon, error: sermonError } = await admin
    .from("sermons")
    .select("id, title, primary_passage")
    .eq("id", version.sermon_id)
    .maybeSingle();

  if (sermonError || !sermon) {
    console.error("[getPublicSampleDebrief] sermon lookup failed", sermonError);
    return null;
  }

  const sermonTitle = sermon.title as string;
  const primaryPassage = (sermon.primary_passage as string | null) ?? null;
  const evaluatedAt =
    (typeof debrief.completed_at === "string" && debrief.completed_at) ||
    (typeof debrief.created_at === "string" && debrief.created_at) ||
    new Date(0).toISOString();

  const weighted55 = diagnostic.overall_score;
  const bandLabel = formatStoredScoreBandForDisplay(
    typeof diagnostic.score_band === "string" ? diagnostic.score_band : null,
    weighted55,
  );

  return {
    sermonTitle,
    primaryPassage,
    coaching: toCoachingPresentation(
      coachingParsed.data,
      sermonTitle,
      primaryPassage,
      evaluatedAt,
    ),
    howItPreaches: hipParsed.data,
    mentorScore: {
      displayScore: formatDisplayScoreBare(weighted55),
      bandLabel,
      weighted55,
    },
  };
}
