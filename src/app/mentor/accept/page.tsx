import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  MENTOR_INVITE_COOKIE,
  resolveMentorInviteToken,
} from "@/lib/mentor/invite";

type MentorAcceptPageProps = {
  searchParams: Promise<{ token?: string | string[] }>;
};

/** Accept surface moved to /invite/[token]. Preserve token from query or cookie. */
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
    redirect("/invite/invalid");
  }

  redirect(`/invite/${encodeURIComponent(token)}`);
}
