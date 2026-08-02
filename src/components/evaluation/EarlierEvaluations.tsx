import Link from "next/link";
import { parseEvaluationCardLabels } from "@/lib/evaluation/display-score";
import type { SermonEvaluationListItem } from "@/lib/evaluation/types";

const uiFont = { fontFamily: "var(--font-ui)" };

function formatEvaluationDate(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
  }).format(new Date(iso));
}

type EarlierEvaluationsProps = {
  sermonId: string;
  currentEvaluationId: string;
  evaluations: SermonEvaluationListItem[];
};

/** Diagnostic-mode prior runs for the evaluation report page. */
export function EarlierEvaluations({
  sermonId,
  currentEvaluationId,
  evaluations,
}: EarlierEvaluationsProps) {
  const earlier = evaluations
    .filter(
      (evaluation) =>
        evaluation.status === "complete" &&
        evaluation.report_mode === "diagnostic" &&
        evaluation.id !== currentEvaluationId,
    )
    .sort((a, b) => {
      const aTime = new Date(a.completed_at ?? a.created_at).getTime();
      const bTime = new Date(b.completed_at ?? b.created_at).getTime();
      return bTime - aTime;
    });

  if (earlier.length === 0) {
    return null;
  }

  return (
    <section
      className="screen-only mt-12 border-t pt-8"
      style={{ borderColor: "var(--sc-rule)" }}
    >
      <p
        className="mb-4 text-[11px] font-semibold uppercase tracking-[0.12em]"
        style={{ ...uiFont, color: "var(--sc-ink-soft)" }}
      >
        Earlier evaluations
      </p>
      <ul className="m-0 flex list-none flex-col gap-3 p-0">
        {earlier.map((evaluation) => {
          const { bandLabel } = parseEvaluationCardLabels(
            evaluation.score_band,
            evaluation.overall_score,
          );
          const dateLabel = formatEvaluationDate(
            evaluation.completed_at ?? evaluation.created_at,
          );

          return (
            <li key={evaluation.id}>
              <Link
                href={`/dashboard/sermons/${sermonId}/evaluations/${evaluation.id}`}
                className="flex items-center justify-between gap-3 rounded border px-5 py-4 no-underline transition-colors hover:border-[var(--sc-accent)]"
                style={{
                  background: "var(--sc-bg)",
                  borderColor: "var(--sc-rule)",
                }}
              >
                <span
                  style={{
                    ...uiFont,
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    color: "#a67c2e",
                  }}
                >
                  {bandLabel}
                </span>
                <span
                  style={{ ...uiFont, fontSize: 12, color: "var(--sc-ink-soft)" }}
                >
                  {dateLabel}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
