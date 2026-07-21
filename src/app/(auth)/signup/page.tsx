"use client";

import { Suspense, useState, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import { AuthMessage } from "@/components/auth/AuthMessage";
import {
  AuthField,
  AuthForm,
  AuthLink,
  AuthSubmit,
} from "@/components/auth/AuthForm";
import {
  EmailExistsMessage,
  isDuplicateSignupError,
} from "@/lib/auth/signup-errors";
import { START_PATH, startPathWithClaim } from "@/lib/auth/start";
import { createClient } from "@/lib/supabase/client";
import {
  buildAuthCallbackUrl,
  buildCheckoutPath,
  buildLoginPath,
  buildPackCheckoutPath,
  buildPackLoginPath,
  parseCoachCheckoutParams,
  parsePackCheckoutParams,
} from "@/lib/billing/checkout";

function friendlySignupError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("password")) {
    return message;
  }
  return "Something went wrong. Please try again.";
}

function getSiteOrigin(): string {
  const isLocalDev =
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1");

  if (isLocalDev && typeof window !== "undefined") {
    return window.location.origin;
  }

  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
    "https://sermoncoach.online"
  );
}

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const checkoutParams = parseCoachCheckoutParams(searchParams);
  const packParams = parsePackCheckoutParams(searchParams);
  const claimToken = searchParams.get("claim")?.trim() || null;
  const postCheckoutPath = checkoutParams
    ? buildCheckoutPath(checkoutParams.cadence)
    : packParams
      ? buildPackCheckoutPath(packParams.pack)
      : null;
  const defaultNextPath =
    claimToken && !postCheckoutPath
      ? startPathWithClaim(claimToken)
      : START_PATH;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [banner, setBanner] = useState<{
    variant: "error" | "success";
    text: ReactNode;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);

  const loginHref = checkoutParams
    ? buildLoginPath(checkoutParams.cadence)
    : packParams
      ? buildPackLoginPath(packParams.pack)
      : "/login";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBanner(null);
    setAwaitingConfirmation(false);

    if (!email.trim() || !password || !confirmPassword) {
      setBanner({
        variant: "error",
        text: "Please fill in all required fields.",
      });
      return;
    }

    if (password !== confirmPassword) {
      setBanner({
        variant: "error",
        text: "Passwords don't match.",
      });
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const trimmedEmail = email.trim();
    const siteOrigin = getSiteOrigin();
    const emailRedirectTo = postCheckoutPath
      ? buildAuthCallbackUrl(siteOrigin, postCheckoutPath)
      : buildAuthCallbackUrl(siteOrigin, defaultNextPath);

    const { data: available, error: checkError } = await supabase.rpc(
      "email_available",
      { p_email: trimmedEmail },
    );
    if (!checkError && available === false) {
      setLoading(false);
      setBanner({
        variant: "error",
        text: <EmailExistsMessage loginHref={loginHref} />,
      });
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email: trimmedEmail,
      password,
      options: {
        emailRedirectTo,
      },
    });
    setLoading(false);

    if (error) {
      setBanner({
        variant: "error",
        text: isDuplicateSignupError(error.message) ? (
          <EmailExistsMessage loginHref={loginHref} />
        ) : (
          friendlySignupError(error.message)
        ),
      });
      return;
    }

    if (data.session) {
      router.push(postCheckoutPath ?? defaultNextPath);
      router.refresh();
      return;
    }

    setAwaitingConfirmation(true);
    setBanner({
      variant: "success",
      text: checkoutParams
        ? "Check your email to confirm your account. After you verify, you'll continue to Coach checkout."
        : packParams
          ? "Check your email to confirm your account. After you verify, you'll continue to pack checkout."
          : "Check your email to confirm your account. After you verify, you'll land right back here and we'll take you to sermon submission.",
    });
  }

  return (
    <AuthShell
      title="Create account"
      subtitle={
        checkoutParams
          ? "Create your account, then continue to Coach checkout."
          : packParams
            ? "Create your account, then continue to pack checkout."
            : "Start building your private sermon library."
      }
      footer={
        awaitingConfirmation ? undefined : (
          <>
            Already have an account?{" "}
            <AuthLink href={loginHref}>Sign in</AuthLink>
          </>
        )
      }
    >
      {banner ? (
        <div className="mb-5">
          <AuthMessage variant={banner.variant}>{banner.text}</AuthMessage>
        </div>
      ) : null}

      {awaitingConfirmation ? (
        <div>
          <p
            className="mb-5 text-center text-sm leading-relaxed"
            style={{ fontFamily: "var(--font-ui)", color: "var(--sc-ink-soft)" }}
          >
            Check your spam or junk folder if it doesn't arrive within a minute.
            Confirmation emails sometimes land there. Still nothing? Email Chris at{" "}
            <AuthLink href="mailto:chris@sermoncoach.online">
              chris@sermoncoach.online
            </AuthLink>{" "}
            and he'll sort it out.
          </p>
          <p
            className="text-center text-sm"
            style={{ fontFamily: "var(--font-ui)", color: "var(--sc-ink-soft)" }}
          >
            <AuthLink href={loginHref}>Go to sign in</AuthLink>
          </p>
        </div>
      ) : (
        <AuthForm onSubmit={handleSubmit}>
          <AuthField
            id="email"
            label="Email"
            inputProps={{
              name: "email",
              type: "email",
              autoComplete: "email",
              required: true,
              value: email,
              onChange: (e) => setEmail(e.target.value),
            }}
          />
          <AuthField
            id="password"
            label="Password"
            inputProps={{
              name: "password",
              type: "password",
              autoComplete: "new-password",
              required: true,
              minLength: 6,
              value: password,
              onChange: (e) => setPassword(e.target.value),
            }}
          />
          <AuthField
            id="confirm-password"
            label="Confirm password"
            inputProps={{
              name: "confirmPassword",
              type: "password",
              autoComplete: "new-password",
              required: true,
              minLength: 6,
              value: confirmPassword,
              onChange: (e) => setConfirmPassword(e.target.value),
            }}
          />
          <AuthSubmit disabled={loading}>
            {loading ? "Creating account…" : "Create account"}
          </AuthSubmit>
        </AuthForm>
      )}
    </AuthShell>
  );
}

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <AuthShell title="Create account" subtitle="Start building your private sermon library.">
          <p
            className="text-center text-sm"
            style={{ fontFamily: "var(--font-ui)", color: "var(--sc-ink-soft)" }}
          >
            Loading…
          </p>
        </AuthShell>
      }
    >
      <SignupForm />
    </Suspense>
  );
}
