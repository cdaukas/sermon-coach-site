"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { AuthMessage } from "@/components/auth/AuthMessage";
import { formatDisplayScoreWithDenom } from "@/lib/evaluation/display-score";
import {
  releaseMentoredEvaluationErrorMessage,
  type ReleaseMentoredEvaluationResult,
} from "@/lib/mentor/release";
import type { MentoredSubmissionListItem } from "@/lib/mentor/submissions";
import { createClient } from "@/lib/supabase/client";

const uiFont = { fontFamily: "var(--font-ui)" };
const serifFont = { fontFamily: "var(--font-serif)" };

const EMPTY_COPY =
  "No submissions yet. When someone you are mentoring submits a sermon, it will show up here.";

const CONTROL_LABEL = "Release the evaluation";
const CONFIRM_BODY =
  "This hands him the scored evaluation. He will see it the next time he opens the sermon, and you cannot take it back.";
const CONFIRM_RELEASE = "Release";
const CONFIRM_CANCEL = "Cancel";
const RELEASED_STATE = "Released";

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

function isDebriefComplete(item: MentoredSubmissionListItem): boolean {
  return item.seatType === "debrief" && item.status === "complete";
}

function canRelease(item: MentoredSubmissionListItem): boolean {
  return isDebriefComplete(item) && item.releasedToMenteeAt == null;
}

function showsReleased(item: MentoredSubmissionListItem): boolean {
  return isDebriefComplete(item) && item.releasedToMenteeAt != null;
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

function ReleaseControl({
  evaluationId,
  onReleased,
}: {
  evaluationId: string;
  onReleased: (releasedAt: string) => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const [releasing, setReleasing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inFlightRef = useRef(false);

  async function handleRelease() {
    if (inFlightRef.current) {
      return;
    }
    inFlightRef.current = true;
    setError(null);
    setReleasing(true);

    try {
      const supabase = createClient();
      const { data, error: rpcError } = await supabase.rpc(
        "release_mentored_evaluation",
        { p_evaluation_id: evaluationId },
      );

      if (rpcError) {
        setError(releaseMentoredEvaluationErrorMessage(null));
        return;
      }

      const result = data as ReleaseMentoredEvaluationResult | null;

      if (
        result?.ok === true &&
        typeof result.released_to_mentee_at === "string"
      ) {
        onReleased(result.released_to_mentee_at);
        setConfirming(false);
        return;
      }

      setError(
        releaseMentoredEvaluationErrorMessage(
          result && "error_code" in result ? result.error_code : null,
        ),
      );
    } catch {
      setError(releaseMentoredEvaluationErrorMessage(null));
    } finally {
      inFlightRef.current = false;
      setReleasing(false);
    }
  }

  if (!confirming) {
    return (
      <div className="mt-3 space-y-2">
        {error ? <AuthMessage variant="error">{error}</AuthMessage> : null}
        <button
          type="button"
          onClick={() => {
            setError(null);
            setConfirming(true);
          }}
          className="border-0 bg-transparent p-0 text-[13px] font-medium underline-offset-2 hover:underline"
          style={{ ...uiFont, color: "var(--sc-accent)", cursor: "pointer" }}
        >
          {CONTROL_LABEL}
        </button>
      </div>
    );
  }

  return (
    <div
      className="mt-3 space-y-3 rounded px-4 py-3"
      style={{
        background: "var(--sc-bg)",
        border: "1px solid var(--sc-rule)",
      }}
    >
      <p
        className="text-[13px] leading-relaxed"
        style={{ ...uiFont, color: "var(--sc-ink-mid)" }}
      >
        {CONFIRM_BODY}
      </p>

      {error ? <AuthMessage variant="error">{error}</AuthMessage> : null}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled={releasing}
          onClick={() => void handleRelease()}
          className="rounded border px-4 py-2 text-[13px] font-semibold"
          style={{
            ...uiFont,
            background: "var(--sc-ink)",
            color: "var(--sc-bg)",
            borderColor: "var(--sc-ink)",
            cursor: releasing ? "wait" : "pointer",
            opacity: releasing ? 0.7 : 1,
          }}
        >
          {releasing ? "Releasing…" : CONFIRM_RELEASE}
        </button>
        <button
          type="button"
          disabled={releasing}
          onClick={() => {
            setConfirming(false);
            setError(null);
          }}
          className="rounded border px-4 py-2 text-[13px] font-medium"
          style={{
            ...uiFont,
            background: "var(--sc-panel)",
            color: "var(--sc-ink-mid)",
            borderColor: "var(--sc-rule)",
            cursor: releasing ? "wait" : "pointer",
          }}
        >
          {CONFIRM_CANCEL}
        </button>
      </div>
    </div>
  );
}

function SubmissionRow({
  item,
  showDivider,
  onReleased,
}: {
  item: MentoredSubmissionListItem;
  showDivider: boolean;
  onReleased: (evaluationId: string, releasedAt: string) => void;
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

  const releaseSlot = canRelease(item) ? (
    <ReleaseControl
      evaluationId={item.evaluationId}
      onReleased={(releasedAt) => onReleased(item.evaluationId, releasedAt)}
    />
  ) : showsReleased(item) ? (
    <p
      className="mt-3 text-[13px] leading-relaxed"
      style={{ ...uiFont, color: "var(--sc-ink-soft)" }}
    >
      {RELEASED_STATE}
    </p>
  ) : null;

  if (item.status === "complete") {
    return (
      <li style={liStyle}>
        <div className="px-1 py-4">
          <Link
            href={`/dashboard/sermons/${item.sermonId}/evaluations/${item.evaluationId}`}
            className="block rounded no-underline transition-opacity hover:opacity-80"
          >
            {body}
          </Link>
          {releaseSlot}
        </div>
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
  submissions: initialSubmissions,
}: MentoredSubmissionsListProps) {
  const [submissions, setSubmissions] = useState(initialSubmissions);

  function handleReleased(evaluationId: string, releasedAt: string) {
    setSubmissions((prev) =>
      prev.map((row) =>
        row.evaluationId === evaluationId
          ? { ...row, releasedToMenteeAt: releasedAt }
          : row,
      ),
    );
  }

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
              onReleased={handleReleased}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
