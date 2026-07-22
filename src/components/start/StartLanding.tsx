"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AuthMessage } from "@/components/auth/AuthMessage";
import {
  AuthField,
  AuthForm,
  AuthLink,
  AuthSubmit,
} from "@/components/auth/AuthForm";
import { START_PATH, startPathWithClaim } from "@/lib/auth/start";
import { buildAuthCallbackUrl } from "@/lib/billing/checkout";
import { createClient } from "@/lib/supabase/client";

const uiFont = { fontFamily: "var(--font-ui)" };

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

const VALUE_POINTS = [
  "Paste your manuscript and get a structured evaluation in minutes.",
  "Scored and narrated against eleven questions drawn from Chapell, Keller, Piper, and the expository tradition.",
  "Your first evaluation is free — no card, no commitment.",
];

export function StartLanding({ claimToken = null }: { claimToken?: string | null }) {
  const router = useRouter();
  const nextPath = claimToken ? startPathWithClaim(claimToken) : START_PATH;
  const loginHref = `/login?redirectTo=${encodeURIComponent(nextPath)}`;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [banner, setBanner] = useState<{
    variant: "error" | "success";
    text: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);

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
    const emailRedirectTo = buildAuthCallbackUrl(siteOrigin, nextPath);

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
      router.refresh();
      return;
    }

    setAwaitingConfirmation(true);
    setBanner({
      variant: "success",
      text: "Check your email to confirm your account. After you verify, you'll land right back here and we'll take you to sermon submission.",
    });
  }

  return (
    <div
      className="flex min-h-full flex-col px-6 py-10"
      style={{ background: "var(--sc-bg)" }}
    >
      <header className="mx-auto w-full max-w-[520px]">
        <Link
          href="/"
          className="inline-block text-xl font-semibold tracking-tight no-underline"
          style={{ fontFamily: "var(--font-serif)", color: "var(--sc-ink)" }}
        >
          The Sermon{" "}
          <span style={{ color: "var(--sc-accent)" }}>Coach</span>™
        </Link>
      </header>

      <main className="mx-auto flex w-full max-w-[520px] flex-1 flex-col justify-center py-10">
        <div
          className="rounded px-8 py-9"
          style={{
            background: "var(--sc-panel)",
            border: "1px solid var(--sc-rule)",
            boxShadow: "var(--sc-shadow-lift)",
          }}
        >
          <div className="mb-7 text-center">
            <p
              className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em]"
              style={{
                ...uiFont,
                color: "var(--sc-accent)",
              }}
            >
              Get started
            </p>
            <h1
              className="text-[28px] font-semibold leading-tight tracking-tight"
              style={{ fontFamily: "var(--font-serif)", color: "var(--sc-ink)" }}
            >
              Get your first evaluation free
            </h1>
            <p
              className="mt-3 text-base leading-relaxed"
              style={{
                fontFamily: "var(--font-serif)",
                color: "var(--sc-ink-soft)",
                fontStyle: "italic",
              }}
            >
              Submit a sermon and see what to sharpen before Sunday.
            </p>
          </div>

          <ul
            className="mb-7 list-disc space-y-2 pl-5 text-[15px] leading-relaxed"
            style={{ fontFamily: "var(--font-serif)", color: "var(--sc-ink-mid)" }}
          >
            {VALUE_POINTS.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>

          {banner ? (
            <div className="mb-5">
              <AuthMessage variant={banner.variant}>{banner.text}</AuthMessage>
            </div>
          ) : null}

          {awaitingConfirmation ? (
            <div>
              <p
                className="mb-5 text-center text-sm leading-relaxed"
                style={{ ...uiFont, color: "var(--sc-ink-soft)" }}
              >
                Check your spam or junk folder if it doesn&apos;t arrive within a
                minute. Confirmation emails sometimes land there. Still nothing?
                Email Chris at{" "}
                <AuthLink href="mailto:chris@sermoncoach.online">
                  chris@sermoncoach.online
                </AuthLink>{" "}
                and he&apos;ll sort it out.
              </p>
              <p
                className="text-center text-sm"
                style={{ ...uiFont, color: "var(--sc-ink-soft)" }}
              >
                <AuthLink href={loginHref}>Go to sign in</AuthLink>
              </p>
            </div>
          ) : (
            <AuthForm onSubmit={handleSubmit}>
              <AuthField
                id="start-email"
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
                id="start-password"
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
                id="start-confirm-password"
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
                {loading ? "Creating account…" : "Create free account"}
              </AuthSubmit>
            </AuthForm>
          )}
        </div>

        {!awaitingConfirmation ? (
          <div
            className="mt-6 text-center text-[13px] leading-relaxed"
            style={{ ...uiFont, color: "var(--sc-ink-soft)" }}
          >
            Already have an account?{" "}
            <AuthLink href={loginHref}>Sign in</AuthLink>
          </div>
        ) : null}
      </main>
    </div>
  );
}
