import { AuthLink } from "@/components/auth/AuthForm";

export function isDuplicateSignupError(message: string): boolean {
  const msg = message.toLowerCase();
  return (
    msg.includes("duplicate") ||
    msg.includes("unique") ||
    msg.includes("already") ||
    msg.includes("database error saving new user")
  );
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
