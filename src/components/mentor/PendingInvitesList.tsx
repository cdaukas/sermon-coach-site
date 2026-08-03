"use client";

import { useRef, useState, type ReactNode } from "react";
import { AuthMessage } from "@/components/auth/AuthMessage";
import {
  revokeMentorInviteErrorMessage,
  type PendingMentorInvite,
  type RevokeMentorInviteResult,
} from "@/lib/mentor/relationships";
import { browserSiteOrigin } from "@/lib/site-origin";
import { createClient } from "@/lib/supabase/client";

const uiFont = { fontFamily: "var(--font-ui)" };
const serifFont = { fontFamily: "var(--font-serif)" };

const QUIET_ACTION = {
  ...uiFont,
  color: "#4a5568",
  cursor: "pointer",
} as const;

function seatLabel(seatType: PendingMentorInvite["seatType"]): string {
  return seatType === "debrief" ? "Debrief seat" : "Evaluation seat";
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(
    new Date(iso),
  );
}

function inviteUrl(token: string): string {
  return `${browserSiteOrigin()}/invite/${token}`;
}

function emailMeta(item: PendingMentorInvite): string {
  if (item.inviteEmailSentAt && item.inviteEmailTo) {
    return `Emailed to ${item.inviteEmailTo} · ${formatDate(item.inviteEmailSentAt)}`;
  }
  if (item.inviteEmailTo) {
    return `Email recorded for ${item.inviteEmailTo}`;
  }
  return "Not emailed yet";
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

function PendingInviteRow({
  item,
  showDivider,
  onRevoked,
}: {
  item: PendingMentorInvite;
  showDivider: boolean;
  onRevoked: (relationshipId: string) => void;
}) {
  const [copied, setCopied] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [revoking, setRevoking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inFlightRef = useRef(false);

  const link = inviteUrl(item.inviteToken);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  async function handleRevoke() {
    if (inFlightRef.current) {
      return;
    }
    inFlightRef.current = true;
    setError(null);
    setRevoking(true);

    try {
      const supabase = createClient();
      const { data, error: rpcError } = await supabase.rpc(
        "revoke_mentor_invite",
        { p_relationship_id: item.relationshipId },
      );

      if (rpcError) {
        setError(revokeMentorInviteErrorMessage(null));
        return;
      }

      const result = data as RevokeMentorInviteResult | null;
      if (result?.ok === true) {
        onRevoked(item.relationshipId);
        return;
      }

      setError(
        revokeMentorInviteErrorMessage(
          result && "error_code" in result ? result.error_code : null,
        ),
      );
    } catch {
      setError(revokeMentorInviteErrorMessage(null));
    } finally {
      inFlightRef.current = false;
      setRevoking(false);
    }
  }

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
          {seatLabel(item.seatType)}
        </p>
        <p
          className="mt-1.5 text-[13px] leading-relaxed"
          style={{ ...uiFont, color: "var(--sc-ink-soft)" }}
        >
          Created {formatDate(item.createdAt)}
          <span aria-hidden="true"> · </span>
          {emailMeta(item)}
        </p>
        <p
          className="mt-2 break-all text-[13px] leading-relaxed"
          style={{ ...uiFont, color: "var(--sc-ink-mid)" }}
        >
          {link}
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
          <QuietAction onClick={() => void handleCopy()}>
            {copied ? "Copied" : "Copy link"}
          </QuietAction>
          {!confirming ? (
            <QuietAction
              onClick={() => {
                setError(null);
                setConfirming(true);
              }}
            >
              Revoke
            </QuietAction>
          ) : null}
        </div>

        {confirming ? (
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
              This invitation link will stop working. Anyone who has not
              accepted yet cannot use it.
            </p>
            {error ? <AuthMessage variant="error">{error}</AuthMessage> : null}
            <div className="flex flex-wrap gap-3">
              <QuietAction
                disabled={revoking}
                onClick={() => void handleRevoke()}
              >
                {revoking ? "Revoking…" : "Revoke invitation"}
              </QuietAction>
              <QuietAction
                disabled={revoking}
                onClick={() => {
                  setConfirming(false);
                  setError(null);
                }}
              >
                Cancel
              </QuietAction>
            </div>
          </div>
        ) : error ? (
          <div className="mt-3">
            <AuthMessage variant="error">{error}</AuthMessage>
          </div>
        ) : null}
      </div>
    </li>
  );
}

type PendingInvitesListProps = {
  invites: PendingMentorInvite[];
};

export function PendingInvitesList({
  invites: initialInvites,
}: PendingInvitesListProps) {
  const [invites, setInvites] = useState(initialInvites);

  function handleRevoked(relationshipId: string) {
    setInvites((prev) =>
      prev.filter((row) => row.relationshipId !== relationshipId),
    );
  }

  return (
    <section
      className="mt-10 border-t pt-10"
      style={{ borderColor: "var(--sc-rule)" }}
      aria-labelledby="pending-invites-heading"
    >
      <h2
        id="pending-invites-heading"
        className="text-[28px] font-semibold leading-tight tracking-tight"
        style={{ ...serifFont, color: "var(--sc-ink)" }}
      >
        Pending invitations
      </h2>

      {invites.length === 0 ? (
        <p
          className="mt-4 text-[15px] leading-relaxed"
          style={{ ...uiFont, color: "var(--sc-ink-mid)" }}
        >
          No open invitations. When you create one, it stays here until they
          accept or you revoke it—so a reload does not lose the link.
        </p>
      ) : (
        <ul className="mt-2">
          {invites.map((item, index) => (
            <PendingInviteRow
              key={item.relationshipId}
              item={item}
              showDivider={index > 0}
              onRevoked={handleRevoked}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
