import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CoachingReportView } from "@/components/evaluation/CoachingReportView";
import { EvaluationDashboard } from "@/components/evaluation/EvaluationDashboard";
import {
  EvaluationPdfCover,
  type EvaluationPdfCoverVariant,
} from "@/components/evaluation/EvaluationPdfCover";
import { EvaluationPdfCapture } from "@/components/evaluation/EvaluationPdfCapture";
import { EvaluationPrintHeader } from "@/components/evaluation/EvaluationPrintHeader";
import { IncompleteEvaluationPoller } from "@/components/evaluation/IncompleteEvaluationPoller";
import { EarlierEvaluations } from "@/components/evaluation/EarlierEvaluations";
import { ReportEvaluationRerun } from "@/components/evaluation/ReportEvaluationRerun";
import { ReportManuscriptDisclosure } from "@/components/evaluation/ReportManuscriptDisclosure";
import { TuesdayNudgeOffer } from "@/components/evaluation/TuesdayNudgeOffer";
import { toCoachingReportPresentation } from "@/lib/evaluation/coaching-report";
import {
  getEvaluation,
  listEvaluationsForSermon,
  sermonHasActiveEvaluation,
} from "@/lib/evaluation/queries";
import { getEvaluationEntitlement } from "@/lib/evaluation/quota";
import { viewerHasActiveMentorRelationship } from "@/lib/mentor/relationship";
import { createClient } from "@/lib/supabase/server";
import {
  parseOutputLanguage,
  parseCriterion2Wording,
  evaluationReportCopy,
  formatEvaluationDate,
} from "@/lib/evaluation/output-language";
import "@/app/evaluation-print.css";

const uiFont = { fontFamily: "var(--font-ui)" };

type EvaluationPageProps = {
  params: Promise<{ id: string; evaluationId: string }>;
  searchParams: Promise<{
    pdf?: string;
    for?: string;
    variant?: string;
    preacher?: string;
    /** Owner stopgap debrief: omit or "evaluation" for scores; "debrief" for coaching. */
    view?: string;
    /** Temporary: Spanish criterion 2 wording (omit or "alt"). */
    c2?: string;
  }>;
};

function evaluationPath(sermonId: string, evaluationId: string): string {
  return `/dashboard/sermons/${sermonId}/evaluations/${evaluationId}`;
}

function evaluationHref(
  path: string,
  query: { view?: string; c2?: string },
): string {
  const params = new URLSearchParams();
  if (query.view) params.set("view", query.view);
  if (query.c2) params.set("c2", query.c2);
  const encoded = params.toString();
  return encoded ? `${path}?${encoded}` : path;
}

export async function generateMetadata({
  params,
  searchParams,
}: EvaluationPageProps): Promise<Metadata> {
  const { id, evaluationId } = await params;
  const { view } = await searchParams;
  const data = await getEvaluation(evaluationId, id);

  if (!data?.evaluation.result && !data?.evaluation.coaching_narrative) {
    return { title: evaluationReportCopy("en").pageTitleEvaluation };
  }

  const titleBase =
    data.evaluation.result?.meta.sermon_title ?? data.sermon.title;
  const language = parseOutputLanguage(data.evaluation.output_language);
  const copy = evaluationReportCopy(language);
  if (
    data.evaluation.report_mode === "debrief" &&
    view === "debrief"
  ) {
    return { title: `${titleBase} — ${copy.pageTitleMentoringDebrief}` };
  }

  return { title: `${titleBase} — ${copy.pageTitleEvaluation}` };
}

function ArtifactSwitchLink({
  href,
  children,
}: {
  href: string;
  children: string;
}) {
  return (
    <Link
      href={href}
      className="inline-block text-[13px] font-medium no-underline hover:underline"
      style={{ ...uiFont, color: "var(--sc-accent)" }}
    >
      {children}
    </Link>
  );
}

export default async function EvaluationPage({
  params,
  searchParams,
}: EvaluationPageProps) {
  const { id: sermonId, evaluationId } = await params;
  const {
    pdf,
    for: preparedForParam,
    variant: variantParam,
    preacher: preacherParam,
    view: viewParam,
    c2: c2Param,
  } = await searchParams;
  const pdfCapture = pdf === "1";
  const preparedFor = preparedForParam?.trim() ?? "";
  const showCover = pdfCapture && preparedFor.length > 0;
  const coverVariant: EvaluationPdfCoverVariant =
    variantParam === "mine" ? "mine" : "theirs";
  const criterion2Wording = parseCriterion2Wording(c2Param);
  const data = await getEvaluation(evaluationId, sermonId);

  if (!data) {
    notFound();
  }

  const { evaluation, sermon, manuscriptContent, resolvedVia } = data;
  const outputLanguage = parseOutputLanguage(evaluation.output_language);
  const reportCopy = evaluationReportCopy(outputLanguage);
  const backHref =
    resolvedVia === "owner" ? "/dashboard" : "/dashboard/mentoring";
  const backLabel =
    resolvedVia === "owner" ? reportCopy.backToLibrary : reportCopy.backToMentoring;

  const isDebriefMode = evaluation.report_mode === "debrief";
  const hasScoredResult = evaluation.result != null;
  const hasCoachingNarrative = evaluation.coaching_narrative != null;
  // One row with both payloads (owner stopgap). Mentored debrief rows have
  // narrative only and stay on a single coaching view.
  const hasSplitViews = isDebriefMode && hasScoredResult && hasCoachingNarrative;
  const showCoachingView =
    isDebriefMode && (!hasSplitViews || viewParam === "debrief");
  const showScoresView = !isDebriefMode || (hasSplitViews && !showCoachingView);

  const basePath = evaluationPath(sermonId, evaluationId);
  const evaluationViewHref = basePath;
  const debriefViewHref = `${basePath}?view=debrief`;

  const siblingEvaluations =
    resolvedVia === "owner" && !pdfCapture && showScoresView
      ? await listEvaluationsForSermon(sermonId)
      : [];

  // Scores view of a stopgap debrief should match an ordinary diagnostic page.
  const showOwnerReportActions =
    resolvedVia === "owner" && !pdfCapture && showScoresView;

  let entitlement = null;
  let hasActiveEvaluation = false;
  let isMentoredMentee = false;
  /** Screen-only: owner + not opted in + never acted on the offer. */
  let tuesdayNudgeOffer: { newsletterOptedIn: boolean } | null = null;

  if (resolvedVia === "owner" && !pdfCapture) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const profilePromise = supabase
        .from("profiles")
        .select(
          "newsletter_opted_in, tuesday_nudge_opted_in, tuesday_nudge_offer_seen_at",
        )
        .eq("id", user.id)
        .maybeSingle();

      if (showOwnerReportActions) {
        const [nextEntitlement, nextHasActive, nextIsMentored, profileResult] =
          await Promise.all([
            getEvaluationEntitlement(user.id),
            sermonHasActiveEvaluation(sermonId),
            viewerHasActiveMentorRelationship(user.id),
            profilePromise,
          ]);
        entitlement = nextEntitlement;
        hasActiveEvaluation = nextHasActive;
        isMentoredMentee = nextIsMentored;

        const profile = profileResult.data;
        if (
          profile &&
          profile.tuesday_nudge_opted_in !== true &&
          profile.tuesday_nudge_offer_seen_at == null
        ) {
          tuesdayNudgeOffer = {
            newsletterOptedIn: profile.newsletter_opted_in === true,
          };
        }
      } else {
        const { data: profile } = await profilePromise;
        if (
          profile &&
          profile.tuesday_nudge_opted_in !== true &&
          profile.tuesday_nudge_offer_seen_at == null
        ) {
          tuesdayNudgeOffer = {
            newsletterOptedIn: profile.newsletter_opted_in === true,
          };
        }
      }
    }
  }

  const debriefReady = isDebriefMode && hasCoachingNarrative;
  const diagnosticReady = !isDebriefMode && hasScoredResult;

  if (evaluation.status !== "complete" || (!debriefReady && !diagnosticReady)) {
    return (
      <main
        className="rounded px-8 py-10"
        style={{
          background: "var(--sc-panel)",
          border: "1px solid var(--sc-rule)",
          boxShadow: "var(--sc-shadow-lift)",
        }}
      >
        <IncompleteEvaluationPoller
          evaluationId={evaluationId}
          sermonId={sermonId}
          sermonTitle={sermon.title}
          backHref={backHref}
          backLabel={backLabel}
          initialStatus={evaluation.status}
          initialErrorMessage={evaluation.error_message}
          outputLanguage={outputLanguage}
        />
      </main>
    );
  }

  // Defensive: split view requested but scores missing — fall through to coaching.
  if (showScoresView && !hasScoredResult) {
    notFound();
  }

  const evaluatedAt = evaluation.completed_at ?? evaluation.created_at;
  const pastorName = evaluation.result?.meta.preacher_name ?? null;
  const coverPreacher =
    pastorName?.trim() || preacherParam?.trim() || null;
  const scriptureReference =
    sermon.primary_passage?.trim() ||
    evaluation.result?.meta.scripture_reference.trim() ||
    null;
  const footerDate = formatEvaluationDate(evaluatedAt, outputLanguage);

  const showManuscript =
    !pdfCapture &&
    typeof manuscriptContent === "string" &&
    manuscriptContent.length > 0;

  return (
    <main
      className="evaluation-page-main rounded px-6 py-10 md:px-8"
      data-pdf-capture={pdfCapture ? "1" : undefined}
      style={{
        background: "var(--sc-panel)",
        border: pdfCapture ? undefined : "1px solid var(--sc-rule)",
        boxShadow: pdfCapture ? undefined : "var(--sc-shadow-lift)",
      }}
    >
      {pdfCapture ? <EvaluationPdfCapture /> : null}

      {showCover && evaluation.result ? (
        <EvaluationPdfCover
          preparedFor={preparedFor}
          variant={coverVariant}
          sermonTitle={sermon.title}
          scriptureReference={scriptureReference}
          preacherName={coverPreacher}
          seriesName={evaluation.result.meta.series_name}
          submissionMode={evaluation.result.meta.submission_mode}
        />
      ) : null}

      {!pdfCapture ? (
        <div className="screen-only mb-8 flex flex-wrap items-center justify-between gap-4">
          <Link
            href={backHref}
            className="inline-block text-[13px] font-medium no-underline hover:underline"
            style={{ ...uiFont, color: "var(--sc-accent)" }}
          >
            {`← ${backLabel}`}
          </Link>
          {hasSplitViews ? (
            showCoachingView ? (
              <ArtifactSwitchLink href={evaluationViewHref}>
                {`← ${reportCopy.theEvaluation}`}
              </ArtifactSwitchLink>
            ) : (
              <ArtifactSwitchLink href={debriefViewHref}>
                {`${reportCopy.theMentoringDebrief} →`}
              </ArtifactSwitchLink>
            )
          ) : null}
        </div>
      ) : null}

      {!pdfCapture ? (
        <EvaluationPrintHeader
          pastorName={pastorName}
          sermonTitle={sermon.title}
          scriptureReference={scriptureReference}
          evaluatedAt={evaluatedAt}
          outputLanguage={outputLanguage}
        />
      ) : null}

      {showCoachingView ? (
        <CoachingReportView
          data={toCoachingReportPresentation({ evaluation, sermon })}
          showPrintActions={!pdfCapture}
          outputLanguage={outputLanguage}
        />
      ) : (
        <EvaluationDashboard
          result={evaluation.result!}
          sermonTitle={sermon.title}
          scriptureReference={scriptureReference}
          showPrintActions={!pdfCapture}
          howItPreaches={evaluation.how_it_preaches}
          outputLanguage={outputLanguage}
          criterion2Wording={criterion2Wording}
          criterion2SwitcherHrefs={
            pdfCapture || outputLanguage !== "es"
              ? undefined
              : {
                  default: evaluationHref(basePath, { view: viewParam }),
                  cristocentrico: evaluationHref(basePath, {
                    view: viewParam,
                    c2: "alt",
                  }),
                }
          }
        />
      )}

      {tuesdayNudgeOffer ? (
        <TuesdayNudgeOffer
          newsletterOptedIn={tuesdayNudgeOffer.newsletterOptedIn}
          outputLanguage={outputLanguage}
        />
      ) : null}

      {!pdfCapture && resolvedVia === "owner" && showScoresView ? (
        <EarlierEvaluations
          sermonId={sermonId}
          currentEvaluationId={evaluationId}
          evaluations={siblingEvaluations}
          outputLanguage={outputLanguage}
        />
      ) : null}

      {showOwnerReportActions ? (
        <ReportEvaluationRerun
          sermonId={sermonId}
          entitlement={entitlement}
          hasActiveEvaluation={hasActiveEvaluation}
          isMentoredMentee={isMentoredMentee}
          outputLanguage={outputLanguage}
        />
      ) : null}

      {showManuscript ? (
        <ReportManuscriptDisclosure
          content={manuscriptContent}
          outputLanguage={outputLanguage}
        />
      ) : null}

      {!pdfCapture ? (
        <footer
          className="evaluation-print-footer print-only"
          aria-hidden="true"
          data-date={footerDate}
        >
          The Sermon Coach · sermoncoach.com · {footerDate}
        </footer>
      ) : null}
    </main>
  );
}
