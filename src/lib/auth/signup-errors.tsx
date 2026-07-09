import { AuthLink } from "@/components/auth/AuthForm";
import type { SupabaseClient } from "@supabase/supabase-js";

export function isDuplicateSignupError(message: string): boolean {
  const msg = message.toLowerCase();
  return (
    msg.includes("duplicate") ||
    msg.includes("unique") ||
    msg.includes("already")
  );
}

export async function checkEmailAvailable(
  supabase: SupabaseClient,
  email: string,
): Promise<boolean | null> {
  const { data: available, error: checkError } = await supabase.rpc(
    "email_available",
    { p_email: email },
  );
  if (checkError) return null;
  return available === true;
}

type EmailExistsMessageProps = {
  loginHref: string;
};

export function EmailExistsMessage({ loginHref }: EmailExistsMessageProps) {
  return (
    <>
      An account with this email already exists. Try{" "}
      <AuthLink href={loginHref}>Sign in instead</AuthLink>.
    </>
  );
}
