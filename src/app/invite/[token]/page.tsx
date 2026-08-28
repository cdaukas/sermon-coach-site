import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import {
  InviteAcceptPanel,
  type InviteSeatType,
} from "@/components/mentor/InviteAcceptPanel";
import { parseMenteeReads, type MenteeReads } from "@/lib/mentor/mentee-reads";
import { createClient } from "@/lib/supabase/server";
import { CANONICAL_SITE_ORIGIN } from "@/lib/site-origin";

export const metadata: Metadata = {
  title: "Mentoring invitation",
  description: "Accept a personal sermon coaching invitation.",
};

type InvitePageProps = {
  params: Promise<{ token: string }>;
};

type PreviewResult =
  | {
      ok: true;
      mentor_name: string;
      seat_type: InviteSeatType;
      mentee_reads: MenteeReads;
    }
  | {
      ok: false;
      error_code: "invalid_or_used";
    };

function parsePreview(data: unknown): PreviewResult {
  if (!data || typeof data !== "object") {
    return { ok: false, error_code: "invalid_or_used" };
  }
  const row = data as Record<string, unknown>;
  if (row.ok !== true) {
    return { ok: false, error_code: "invalid_or_used" };
  }
  const mentor_name =
    typeof row.mentor_name === "string" ? row.mentor_name : null;
  const seat_type = row.seat_type;
  if (
    !mentor_name ||
    (seat_type !== "debrief" && seat_type !== "evaluation")
  ) {
    return { ok: false, error_code: "invalid_or_used" };
  }
  return { ok: true, mentor_name, seat_type, mentee_reads: parseMenteeReads(row.mentee_reads) };
}

const uiFont = { fontFamily: "var(--font-ui)" };
const serifFont = { fontFamily: "var(--font-serif)" };

function InviteShell({ children }: { children: ReactNode }) {
  return (
    <div
      className="flex min-h-full flex-col px-6 py-10"
      style={{ background: "var(--sc-bg)" }}
    >
      <header className="mx-auto w-full max-w-[560px]">
        <Link
          href={CANONICAL_SITE_ORIGIN}
          className="inline-block text-xl font-semibold tracking-tight no-underline"
          style={{ fontFamily: "var(--font-serif)", color: "var(--sc-ink)" }}
        >
          The Sermon{" "}
          <span style={{ color: "var(--sc-accent)" }}>Coach</span>™
        </Link>
      </header>

      <main className="mx-auto flex w-full max-w-[620px] flex-1 flex-col justify-center py-10">
        <div
          className="rounded px-6 py-9 sm:px-10 sm:py-11"
          style={{
            background: "var(--sc-panel)",
            border: "1px solid var(--sc-rule)",
          }}
        >
          {children}
        </div>
      </main>
    </div>
  );
}

function InvalidInvite() {
  return (
    <div className="space-y-4">
      <h1
        className="text-[28px] font-semibold leading-tight tracking-tight"
        style={{ ...serifFont, color: "var(--sc-ink)" }}
      >
        This invitation is no longer active
      </h1>
      <p
        className="text-[15px] leading-relaxed"
        style={{ ...uiFont, color: "var(--sc-ink-mid)" }}
      >
        It may have been used already, the mentor may have ended it, or the seat
        it sat on is no longer open. Ask them for a fresh link if they still
        want to mentor you. If you already have an account here, sign in and
        check whether it went through.
      </p>
    </div>
  );
}

export default async function InvitePage({ params }: InvitePageProps) {
  const { token: rawToken } = await params;
  const token = rawToken?.trim() ?? "";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!token) {
    return (
      <InviteShell>
        <InvalidInvite />
      </InviteShell>
    );
  }

  const { data, error } = await supabase.rpc("preview_mentor_invite", {
    p_token: token,
  });

  if (error) {
    return (
      <InviteShell>
        <InvalidInvite />
      </InviteShell>
    );
  }

  const preview = parsePreview(data);
  if (!preview.ok) {
    return (
      <InviteShell>
        <InvalidInvite />
      </InviteShell>
    );
  }

  return (
    <InviteShell>
      <InviteAcceptPanel
        token={token}
        mentorName={preview.mentor_name}
        seatType={preview.seat_type}
        menteeReads={preview.mentee_reads}
        loggedIn={Boolean(user)}
      />
    </InviteShell>
  );
}
