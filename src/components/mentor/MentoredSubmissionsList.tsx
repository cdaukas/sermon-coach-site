import Link from "next/link";
import { formatDisplayScoreWithDenom } from "@/lib/evaluation/display-score";
import type { MentoredSubmissionListItem } from "@/lib/mentor/submissions";

const uiFont = { fontFamily: "var(--font-ui)" };
const serifFont = { fontFamily: "var(--font-serif)" };

const EMPTY_COPY =
  "No submissions yet. When someone you are mentoring submits a sermon, it will show up here.";

type MentoredSubmissionsListProps = {
  submissions: MentoredSubmissionListItem[];
};

function formatSubmittedAt(iso: string): string {
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(
    new Date(iso),
  );
}

function statusLabel(
  status: MentoredSubmissionListItem["status"],
): string | null {
  if (status === "pending" || status === "running") {
    return "Evaluating";
  }
  if (status === "failed") {
    return "Failed";
  }
  return null;
}

function completeScoreLabel(item: MentoredSubmissionListItem): string | null {
  if (item.overallScore == null) {
    return null;
  }
  return formatDisplayScoreWithDenom(item.overallScore);
}

function SubmissionMeta({ item }: { item: MentoredSubmissionListItem }) {
  const status = statusLabel(item.status);
  const score =
    item.status === "complete" ? completeScoreLabel(item) : null;

  return (
    <p
      className="mt-1.5 text-[13px] leading-relaxed"
      style={{ ...uiFont, color: "var(--sc-ink-soft)" }}
    >
      {item.menteeEmail}
      <span aria-hidden="true"> · </span>
      {formatSubmittedAt(item.createdAt)}
      {status ? (
        <>
          <span aria-hidden="true"> · </span>
          {status}
        </>
      ) : null}
      {score ? (
        <>
          <span aria-hidden="true"> · </span>
          {score}
        </>
      ) : null}
    </p>
  );
}

function SubmissionTitle({ title }: { title: string }) {
  return (
    <p
      className="text-[17px] font-semibold leading-snug tracking-tight"
      style={{ ...serifFont, color: "var(--sc-ink)" }}
    >
      {title}
    </p>
  );
}

function SubmissionRow({
  item,
  showDivider,
}: {
  item: MentoredSubmissionListItem;
  showDivider: boolean;
}) {
  const body = (
    <>
      <SubmissionTitle title={item.sermonTitle} />
      <SubmissionMeta item={item} />
    </>
  );

  const liStyle = showDivider
    ? { borderTop: "1px solid var(--sc-rule)" }
    : undefined;

  if (item.status === "complete") {
    return (
      <li style={liStyle}>
        <Link
          href={`/dashboard/sermons/${item.sermonId}/evaluations/${item.evaluationId}`}
          className="block rounded px-1 py-4 no-underline transition-opacity hover:opacity-80"
        >
          {body}
        </Link>
      </li>
    );
  }

  return (
    <li style={liStyle}>
      <div className="px-1 py-4">{body}</div>
    </li>
  );
}

export function MentoredSubmissionsList({
  submissions,
}: MentoredSubmissionsListProps) {
  return (
    <section
      className="mt-10 border-t pt-10"
      style={{ borderColor: "var(--sc-rule)" }}
      aria-labelledby="mentored-submissions-heading"
    >
      <h2
        id="mentored-submissions-heading"
        className="text-[28px] font-semibold leading-tight tracking-tight"
        style={{ ...serifFont, color: "var(--sc-ink)" }}
      >
        Submissions
      </h2>

      {submissions.length === 0 ? (
        <p
          className="mt-4 text-[15px] leading-relaxed"
          style={{ ...uiFont, color: "var(--sc-ink-mid)" }}
        >
          {EMPTY_COPY}
        </p>
      ) : (
        <ul className="mt-2">
          {submissions.map((item, index) => (
            <SubmissionRow
              key={item.evaluationId}
              item={item}
              showDivider={index > 0}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
