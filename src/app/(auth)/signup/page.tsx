"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import { AuthMessage } from "@/components/auth/AuthMessage";
import {
  AuthField,
  AuthForm,
  AuthLink,
  AuthSubmit,
} from "@/components/auth/AuthForm";
import { createClient } from "@/lib/supabase/client";
import {
  buildAuthCallbackUrl,
  buildCheckoutPath,
  buildLoginPath,
  parseCoachCheckoutParams,
} from "@/lib/billing/checkout";

function friendlySignupError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("already registered") || lower.includes("already exists")) {
    return "An account with this email already exists. Try signing in.";
  }
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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [banner, setBanner] = useState<{
    variant: "error" | "success";
    text: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);

  const loginHref = checkoutParams
    ? buildLoginPath(checkoutParams.cadence)
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
    const siteOrigin = getSiteOrigin();
    const emailRedirectTo = checkoutParams
      ? buildAuthCallbackUrl(
          siteOrigin,
          buildCheckoutPath(checkoutParams.cadence),
        )
      : `${siteOrigin}/login`;

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo,
      },
    });
    setLoading(false);

    if (error) {
      setBanner({ variant: "error", text: friendlySignupError(error.message) });
      return;
    }

    if (data.session) {
      router.push(
        checkoutParams
          ? buildCheckoutPath(checkoutParams.cadence)
          : "/dashboard",
      );
      router.refresh();
      return;
    }

    setAwaitingConfirmation(true);
    setBanner({
      variant: "success",
      text: checkoutParams
        ? "Check your email to confirm your account. After you verify, you'll continue to Coach checkout."
        : "Check your email to confirm your account, then sign in.",
    });
  }

  return (
    <AuthShell
      title="Create account"
      subtitle={
        checkoutParams
          ? "Create your account, then continue to Coach checkout."
          : "Start building your private sermon library."
      }
      footer={
        <>
          Already have an account?{" "}
          <AuthLink href={loginHref}>Sign in</AuthLink>
        </>
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
