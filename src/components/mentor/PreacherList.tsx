"use client";

import { useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { AuthMessage } from "@/components/auth/AuthMessage";
import { formatDisplayScoreWithDenom } from "@/lib/evaluation/display-score";
import {
  releaseMentoredEvaluationErrorMessage,
  type ReleaseMentoredEvaluationResult,
} from "@/lib/mentor/release";
import {
  endMentorRelationshipErrorMessage,
  type EndMentorRelationshipResult,
} from "@/lib/mentor/relationships";
import { mentorSeatDisplayName } from "@/lib/mentor/seat-labels";
import type { MentoredSubmissionListItem } from "@/lib/mentor/submissions";
import { createClient } from "@/lib/supabase/client";
import type { PreacherCard } from "@/components/mentor/mentoring-model";

const uiFont = { fontFamily: "var(--font-ui)" };
const serifFont = { fontFamily: "var(--font-serif)" };

const RELEASE_CONFIRM_HEADING = "Release the score?";
const RELEASE_CONFIRM_BODY =
  "Once released, your preacher can see the scored evaluation. This cannot be undone.";
const END_CONFIRM_BODY =
  "Ending this releases every scored evaluation you are still holding. Continue?";

function formatDate(iso: string): string {
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
    return "Evaluation failed";
  }
  return null;
}

function isDebriefComplete(item: MentoredSubmissionListItem): boolean {
  return item.seatType === "debrief" && item.status === "complete";
}

function canRelease(item: MentoredSubmissionListItem): boolean {
  return isDebriefComplete(item) && item.releasedToMenteeAt == null;
}

function isReleased(item: MentoredSubmissionListItem): boolean {
  return isDebriefComplete(item) && item.releasedToMenteeAt != null;
}

function evaluationHref(item: MentoredSubmissionListItem): string {
  return `/dashboard/sermons/${item.sermonId}/evaluations/${item.evaluationId}`;
}

/* ---------------------------------------------------------------- controls */

function PrimaryButton({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="inline-flex items-center rounded border px-5 py-2.5 text-[13px] font-semibold tracking-wide no-underline transition-opacity hover:opacity-90"
      style={{
        ...uiFont,
        background: "var(--sc-ink)",
        color: "var(--sc-bg)",
        borderColor: "var(--sc-ink)",
      }}
    >
      {children}
    </Link>
  );
}

function SecondaryButton({
  children,
  disabled,
  onClick,
}: {
  children: ReactNode;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="inline-flex items-center rounded border px-5 py-2.5 text-[13px] font-semibold tracking-wide transition-colors disabled:cursor-wait disabled:opacity-60"
      style={{
        ...uiFont,
        background: "var(--sc-panel)",
        color: "var(--sc-ink-mid)",
        borderColor: "var(--sc-rule)",
        cursor: disabled ? "wait" : "pointer",
      }}
    >
      {children}
    </button>
  );
}

function QuietAction({
  children,
  disabled,
  onClick,
}: {
  children: ReactNode;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="border-0 bg-transparent p-0 text-[13px] font-medium underline-offset-4 hover:underline disabled:cursor-wait disabled:no-underline disabled:opacity-60"
      style={{ ...uiFont, color: "var(--sc-ink-soft)", cursor: "pointer" }}
    >
      {children}
    </button>
  );
}

/**
 * Release control. Calls release_mentored_evaluation unchanged; only the
 * presentation differs from the previous submissions list.
 */
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
      <div className="space-y-2">
        {error ? <AuthMessage variant="error">{error}</AuthMessage> : null}
        <SecondaryButton
          onClick={() => {
            setError(null);
            setConfirming(true);
          }}
        >
          Release score
        </SecondaryButton>
      </div>
    );
  }

  return (
    <div
      className="w-full space-y-3 rounded px-4 py-4"
      style={{ background: "var(--sc-bg)", border: "1px solid var(--sc-rule)" }}
    >
      <p
        className="text-[16px] font-semibold leading-snug"
        style={{ ...serifFont, color: "var(--sc-ink)" }}
      >
        {RELEASE_CONFIRM_HEADING}
      </p>
      <p
        className="text-[13px] leading-relaxed"
        style={{ ...uiFont, color: "var(--sc-ink-mid)" }}
      >
        {RELEASE_CONFIRM_BODY}
      </p>

      {error ? <AuthMessage variant="error">{error}</AuthMessage> : null}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled={releasing}
          onClick={() => void handleRelease()}
          className="inline-flex items-center rounded border px-5 py-2.5 text-[13px] font-semibold tracking-wide"
          style={{
            ...uiFont,
            background: "var(--sc-ink)",
            color: "var(--sc-bg)",
            borderColor: "var(--sc-ink)",
            cursor: releasing ? "wait" : "pointer",
            opacity: releasing ? 0.7 : 1,
          }}
        >
          {releasing ? "Releasing…" : "Release score"}
        </button>
        <SecondaryButton
          disabled={releasing}
          onClick={() => {
            setConfirming(false);
            setError(null);
          }}
        >
          Cancel
        </SecondaryButton>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------- submissions */

function ScoreBlock({ item }: { item: MentoredSubmissionListItem }) {
  const score =
    item.status === "complete" && item.overallScore != null
      ? formatDisplayScoreWithDenom(item.overallScore)
      : null;
  const process = statusLabel(item.status);

  if (!score) {
    return process ? (
      <p
        className="text-[13px] leading-relaxed"
        style={{ ...uiFont, color: "var(--sc-ink-soft)" }}
      >
        {process}
      </p>
    ) : null;
  }

  const held = canRelease(item);
  const released = isReleased(item);

  return (
    <div className="sm:text-right">
      <p
        className="text-[28px] font-semibold leading-none tracking-tight"
        style={{ ...serifFont, color: "var(--sc-ink)" }}
      >
        {score}
      </p>
      {held ? (
        <p
          className="mt-2 text-[12px] font-medium uppercase tracking-[0.12em]"
          style={{ ...uiFont, color: "var(--sc-accent)" }}
        >
          Score held
        </p>
      ) : null}
      {released && item.releasedToMenteeAt ? (
        <p
          className="mt-2 text-[12px] leading-relaxed"
          style={{ ...uiFont, color: "var(--sc-ink-soft)" }}
        >
          Released {formatDate(item.releasedToMenteeAt)}
        </p>
      ) : null}
    </div>
  );
}

function SubmissionBlock({
  item,
  label,
  onReleased,
}: {
  item: MentoredSubmissionListItem;
  label?: string;
  onReleased: (evaluationId: string, releasedAt: string) => void;
}) {
  const held = canRelease(item);

  return (
    <div>
      {label ? (
        <p
          className="text-[11px] font-medium uppercase tracking-[0.14em]"
          style={{ ...uiFont, color: "var(--sc-ink-soft)" }}
        >
          {label}
        </p>
      ) : null}

      <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-8">
        <div className="min-w-0">
          <p
            className="text-[19px] font-semibold leading-snug tracking-tight"
            style={{ ...serifFont, color: "var(--sc-ink)" }}
          >
            {item.sermonTitle}
          </p>
          <p
            className="mt-1 text-[13px] leading-relaxed"
            style={{ ...uiFont, color: "var(--sc-ink-soft)" }}
          >
            {formatDate(item.createdAt)}
            {item.primaryPassage ? (
              <>
                <span aria-hidden="true"> · </span>
                {item.primaryPassage}
              </>
            ) : null}
          </p>
        </div>
        <div className="shrink-0">
          <ScoreBlock item={item} />
        </div>
      </div>

      {held ? (
        <p
          className="mt-3 max-w-xl text-[14px] leading-relaxed"
          style={{ ...uiFont, color: "var(--sc-ink-mid)" }}
        >
          Coaching debrief and How It Preaches are available to you. Release the
          score when you&rsquo;re ready.
        </p>
      ) : null}

      {item.status === "complete" ? (
        <div className="mt-4 flex flex-wrap items-start gap-3">
          <PrimaryButton href={evaluationHref(item)}>
            Open evaluation
          </PrimaryButton>
          {held ? (
            <ReleaseControl
              evaluationId={item.evaluationId}
              onReleased={(releasedAt) =>
                onReleased(item.evaluationId, releasedAt)
              }
            />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

/* -------------------------------------------------------------------- card */

function EndMentoring({
  relationshipId,
  onEnded,
}: {
  relationshipId: string;
  onEnded: (relationshipId: string) => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const [ending, setEnding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inFlightRef = useRef(false);

  async function handleEnd() {
    if (inFlightRef.current) {
      return;
    }
    inFlightRef.current = true;
    setError(null);
    setEnding(true);

    try {
      const supabase = createClient();
      const { data, error: rpcError } = await supabase.rpc(
        "end_mentor_relationship",
        { p_relationship_id: relationshipId },
      );

      if (rpcError) {
        setError(endMentorRelationshipErrorMessage(null));
        return;
      }

      const result = data as EndMentorRelationshipResult | null;
      if (result?.ok === true) {
        onEnded(relationshipId);
        return;
      }

      setError(
        endMentorRelationshipErrorMessage(
          result && "error_code" in result ? result.error_code : null,
        ),
      );
    } catch {
      setError(endMentorRelationshipErrorMessage(null));
    } finally {
      inFlightRef.current = false;
      setEnding(false);
    }
  }

  if (!confirming) {
    return (
      <div className="space-y-2">
        {error ? <AuthMessage variant="error">{error}</AuthMessage> : null}
        <QuietAction
          onClick={() => {
            setError(null);
            setConfirming(true);
          }}
        >
          End mentoring
        </QuietAction>
      </div>
    );
  }

  return (
    <div
      className="space-y-3 rounded px-4 py-4"
      style={{ background: "var(--sc-bg)", border: "1px solid var(--sc-rule)" }}
    >
      <p
        className="text-[13px] leading-relaxed"
        style={{ ...uiFont, color: "var(--sc-ink-mid)" }}
      >
        {END_CONFIRM_BODY}
      </p>
      {error ? <AuthMessage variant="error">{error}</AuthMessage> : null}
      <div className="flex flex-wrap gap-4">
        <QuietAction disabled={ending} onClick={() => void handleEnd()}>
          {ending ? "Ending…" : "End mentoring"}
        </QuietAction>
        <QuietAction
          disabled={ending}
          onClick={() => {
            setConfirming(false);
            setError(null);
          }}
        >
          Cancel
        </QuietAction>
      </div>
    </div>
  );
}

function PreacherCardView({
  card,
  onReleased,
  onEnded,
}: {
  card: PreacherCard;
  onReleased: (evaluationId: string, releasedAt: string) => void;
  onEnded: (relationshipId: string) => void;
}) {
  const [showAll, setShowAll] = useState(false);

  const [latest, ...earlier] = card.submissions;
  const title =
    card.menteeEmail && card.menteeEmail.length > 0
      ? card.menteeEmail
      : "Preacher";

  return (
    <article
      className="rounded px-6 py-6 sm:px-8 sm:py-8"
      style={{
        background: "var(--sc-panel)",
        border: "1px solid var(--sc-rule)",
      }}
    >
      <header>
        <h3
          className="text-[22px] font-semibold leading-snug tracking-tight break-words"
          style={{ ...serifFont, color: "var(--sc-ink)" }}
        >
          {title}
        </h3>
        <p
          className="mt-1.5 text-[13px] leading-relaxed"
          style={{ ...uiFont, color: "var(--sc-ink-soft)" }}
        >
          {mentorSeatDisplayName(card.seatType)}
          <span aria-hidden="true"> · </span>
          {card.submissionsUsed} of {card.submissionsLimit} sermon
          {card.submissionsLimit === 1 ? "" : "s"} this month
        </p>
      </header>

      {latest ? (
        <>
          <div
            className="mt-6 border-t pt-6"
            style={{ borderColor: "var(--sc-rule)" }}
          >
            <SubmissionBlock
              item={latest}
              label="Latest sermon"
              onReleased={onReleased}
            />
          </div>

          {earlier.length > 0 ? (
            <div
              className="mt-6 border-t pt-5"
              style={{ borderColor: "var(--sc-rule)" }}
            >
              {!showAll ? (
                <QuietAction onClick={() => setShowAll(true)}>
                  Show {earlier.length} earlier sermon
                  {earlier.length === 1 ? "" : "s"}
                </QuietAction>
              ) : (
                <div className="space-y-6">
                  {earlier.map((item) => (
                    <SubmissionBlock
                      key={item.evaluationId}
                      item={item}
                      onReleased={onReleased}
                    />
                  ))}
                  <QuietAction onClick={() => setShowAll(false)}>
                    Hide earlier sermons
                  </QuietAction>
                </div>
              )}
            </div>
          ) : null}
        </>
      ) : (
        <p
          className="mt-5 text-[14px] leading-relaxed"
          style={{ ...uiFont, color: "var(--sc-ink-mid)" }}
        >
          No sermons yet. When they submit one, the evaluation appears here.
        </p>
      )}

      <div
        className="mt-6 border-t pt-5"
        style={{ borderColor: "var(--sc-rule)" }}
      >
        <EndMentoring relationshipId={card.relationshipId} onEnded={onEnded} />
      </div>
    </article>
  );
}

/* -------------------------------------------------------------------- list */

export function PreacherList({
  cards: initialCards,
  inviteAction,
}: {
  cards: PreacherCard[];
  inviteAction: ReactNode;
}) {
  const [cards, setCards] = useState(initialCards);

  function handleReleased(evaluationId: string, releasedAt: string) {
    setCards((prev) =>
      prev.map((card) => ({
        ...card,
        submissions: card.submissions.map((row) =>
          row.evaluationId === evaluationId
            ? { ...row, releasedToMenteeAt: releasedAt }
            : row,
        ),
      })),
    );
  }

  function handleEnded(relationshipId: string) {
    setCards((prev) =>
      prev.filter((card) => card.relationshipId !== relationshipId),
    );
  }

  if (cards.length === 0) {
    return (
      <div
        className="rounded px-6 py-12 text-center sm:px-8 sm:py-16"
        style={{
          background: "var(--sc-panel)",
          border: "1px solid var(--sc-rule)",
        }}
      >
        <p
          className="text-[24px] font-semibold leading-snug tracking-tight"
          style={{ ...serifFont, color: "var(--sc-ink)" }}
        >
          No preachers yet.
        </p>
        <p
          className="mx-auto mt-3 max-w-md text-[15px] leading-relaxed"
          style={{ ...uiFont, color: "var(--sc-ink-mid)" }}
        >
          Invite someone you&rsquo;re developing and begin walking with them
          sermon by sermon.
        </p>
        <div className="mt-7 flex justify-center">{inviteAction}</div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {cards.map((card) => (
        <PreacherCardView
          key={card.relationshipId}
          card={card}
          onReleased={handleReleased}
          onEnded={handleEnded}
        />
      ))}
    </div>
  );
}
