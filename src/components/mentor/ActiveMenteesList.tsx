"use client";

import { useRef, useState, type ReactNode } from "react";
import { AuthMessage } from "@/components/auth/AuthMessage";
import {
  endMentorRelationshipErrorMessage,
  type ActiveMentorMentee,
  type EndMentorRelationshipResult,
} from "@/lib/mentor/relationships";
import { mentorSeatDisplayName } from "@/lib/mentor/seat-labels";
import { createClient } from "@/lib/supabase/client";

const uiFont = { fontFamily: "var(--font-ui)" };
const serifFont = { fontFamily: "var(--font-serif)" };

const QUIET_ACTION = {
  ...uiFont,
  color: "#4a5568",
  cursor: "pointer",
} as const;

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(
    new Date(iso),
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
      className="border-0 bg-transparent p-0 text-[13px] font-medium underline-offset-2 hover:underline disabled:cursor-wait disabled:no-underline disabled:opacity-60"
      style={QUIET_ACTION}
    >
      {children}
    </button>
  );
}

function ActiveMenteeRow({
  item,
  showDivider,
  onEnded,
}: {
  item: ActiveMentorMentee;
  showDivider: boolean;
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
        { p_relationship_id: item.relationshipId },
      );

      if (rpcError) {
        setError(endMentorRelationshipErrorMessage(null));
        return;
      }

      const result = data as EndMentorRelationshipResult | null;
      if (result?.ok === true) {
        onEnded(item.relationshipId);
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

  const title =
    item.menteeEmail && item.menteeEmail.length > 0
      ? item.menteeEmail
      : "Mentee";

  return (
    <li
      style={
        showDivider ? { borderTop: "1px solid var(--sc-rule)" } : undefined
      }
    >
      <div className="px-1 py-4">
        <p
          className="text-[17px] font-semibold leading-snug tracking-tight"
          style={{ ...serifFont, color: "var(--sc-ink)" }}
        >
          {title}
        </p>
        <p
          className="mt-1.5 text-[13px] leading-relaxed"
          style={{ ...uiFont, color: "var(--sc-ink-soft)" }}
        >
          {mentorSeatDisplayName(item.seatType)}
          <span aria-hidden="true"> · </span>
          {item.submissionsUsed} of {item.submissionsLimit} submissions this
          month
          {item.acceptedAt ? (
            <>
              <span aria-hidden="true"> · </span>
              Accepted {formatDate(item.acceptedAt)}
            </>
          ) : null}
        </p>

        {!confirming ? (
          <div className="mt-3">
            <QuietAction
              onClick={() => {
                setError(null);
                setConfirming(true);
              }}
            >
              End mentoring
            </QuietAction>
          </div>
        ) : (
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
              This ends the mentoring relationship. Any held evaluations will
              be released to the mentee. They will see every scored evaluation
              that was closed to them for this seat, and you cannot take that
              back.
            </p>
            {error ? <AuthMessage variant="error">{error}</AuthMessage> : null}
            <div className="flex flex-wrap gap-3">
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
        )}

        {!confirming && error ? (
          <div className="mt-3">
            <AuthMessage variant="error">{error}</AuthMessage>
          </div>
        ) : null}
      </div>
    </li>
  );
}

type ActiveMenteesListProps = {
  mentees: ActiveMentorMentee[];
};

export function ActiveMenteesList({
  mentees: initialMentees,
}: ActiveMenteesListProps) {
  const [mentees, setMentees] = useState(initialMentees);

  function handleEnded(relationshipId: string) {
    setMentees((prev) =>
      prev.filter((row) => row.relationshipId !== relationshipId),
    );
  }

  if (mentees.length === 0) {
    return null;
  }

  return (
    <section
      className="mt-10 border-t pt-10"
      style={{ borderColor: "var(--sc-rule)" }}
      aria-labelledby="active-mentees-heading"
    >
      <h2
        id="active-mentees-heading"
        className="text-[28px] font-semibold leading-tight tracking-tight"
        style={{ ...serifFont, color: "var(--sc-ink)" }}
      >
        Your Preachers
      </h2>

      <ul className="mt-2">
        {mentees.map((item, index) => (
          <ActiveMenteeRow
            key={item.relationshipId}
            item={item}
            showDivider={index > 0}
            onEnded={handleEnded}
          />
        ))}
      </ul>
    </section>
  );
}
