import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import { AuthLink } from "@/components/auth/AuthForm";
import { MentorAcceptForm } from "@/components/mentor/MentorAcceptForm";
import {
  MENTOR_INVITE_COOKIE,
  resolveMentorInviteToken,
} from "@/lib/mentor/invite";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Accept mentoring invitation",
  description: "Accept an invitation to be mentored through Sermon Coach.",
};

type MentorAcceptPageProps = {
  searchParams: Promise<{ token?: string | string[] }>;
};

export default async function MentorAcceptPage({
  searchParams,
}: MentorAcceptPageProps) {
  const params = await searchParams;
  const tokenParam = Array.isArray(params.token) ? params.token[0] : params.token;

  const jar = await cookies();
  const token = resolveMentorInviteToken(
    jar.get(MENTOR_INVITE_COOKIE)?.value,
    tokenParam,
  );

  if (!token) {
    return (
      <AuthShell
        title="Invitation not found"
        subtitle="This mentoring link is missing or incomplete."
      >
        <p
          className="text-center text-[15px] leading-relaxed"
          style={{ fontFamily: "var(--font-ui)", color: "var(--sc-ink-mid)" }}
        >
          Ask your mentor to send a new invitation link.
        </p>
      </AuthShell>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // Route handler sets the httpOnly cookie, then sends to signup with next=
    redirect(`/mentor/accept/carry?token=${encodeURIComponent(token)}`);
  }

  return (
    <AuthShell
      title="Accept mentoring invitation"
      subtitle="Read what you are agreeing to, then accept if you want to continue."
      footer={
        <>
          Changed your mind?{" "}
          <AuthLink href="/dashboard">Go to your dashboard</AuthLink>
        </>
      }
    >
      <MentorAcceptForm token={token} />
    </AuthShell>
  );
}
