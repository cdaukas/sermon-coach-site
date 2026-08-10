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
import { SignupHoneypotField } from "@/components/auth/SignupHoneypotField";
import {
  EmailExistsMessage,
  isDuplicateSignupError,
} from "@/lib/auth/signup-errors";
import { assertSignupBotAllowed } from "@/lib/auth/signup-bot-guard";
import { setEmailPreferencesAtSignup } from "@/lib/auth/newsletter-opt-in";
import { START_PATH, startPathWithClaim } from "@/lib/auth/start";
import { browserSiteOrigin } from "@/lib/site-origin";
import { createClient } from "@/lib/supabase/client";
import {
  buildAuthCallbackUrl,
  buildCheckoutPath,
  buildLoginPath,
  buildMentorSeatCheckoutPath,
  buildPackCheckoutPath,
  buildPackLoginPath,
  parseCoachCheckoutParams,
  parseMentorSeatCheckoutParams,
  parsePackCheckoutParams,
} from "@/lib/billing/checkout";

const NEWSLETTER_OPT_IN_LABEL =
  "Get the Friday post. One email a week on preaching that lands.";

const TUESDAY_NUDGE_OPT_IN_LABEL = "Send me the Tuesday nudge";

const TUESDAY_NUDGE_OPT_IN_DETAIL =
  "A prompt to look back at Sunday and start next week's sketch.";

function friendlySignupError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("password")) {
    return message;
  }
  return "Something went wrong. Please try again.";
}

/** Relative post-auth path only (mirrors confirm-redirect safeRedirectPath). */
function safeNextPath(raw: string | null): string | null {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return null;
  return raw;
}

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const checkoutParams = parseCoachCheckoutParams(searchParams);
  const packParams = parsePackCheckoutParams(searchParams);
  const seatParams = parseMentorSeatCheckoutParams(searchParams);
  const claimToken = searchParams.get("claim")?.trim() || null;
  const preservedNext = safeNextPath(searchParams.get("next"));
  const postCheckoutPath = checkoutParams
    ? buildCheckoutPath(checkoutParams.cadence)
    : packParams
      ? buildPackCheckoutPath(packParams.pack)
      : seatParams
        ? buildMentorSeatCheckoutPath(seatParams.seat, seatParams.quantity)
        : null;
  const defaultNextPath = postCheckoutPath
    ? postCheckoutPath
    : preservedNext
      ? preservedNext
      : claimToken
        ? startPathWithClaim(claimToken)
        : START_PATH;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [websiteHoneypot, setWebsiteHoneypot] = useState("");
  const [newsletterOptedIn, setNewsletterOptedInState] = useState(false);
  const [tuesdayNudgeOptedIn, setTuesdayNudgeOptedInState] = useState(false);
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
      : seatParams
        ? `/login?redirectTo=${encodeURIComponent(postCheckoutPath!)}`
        : preservedNext || claimToken
          ? `/login?redirectTo=${encodeURIComponent(defaultNextPath)}`
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
    const siteOrigin = browserSiteOrigin();
    const emailRedirectTo = postCheckoutPath
      ? buildAuthCallbackUrl(siteOrigin, postCheckoutPath)
      : buildAuthCallbackUrl(siteOrigin, defaultNextPath);

    const botGate = await assertSignupBotAllowed(
      trimmedEmail,
      websiteHoneypot,
    );
    if (!botGate.ok) {
      setLoading(false);
      setBanner({ variant: "error", text: botGate.message });
      return;
    }

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
        data: {
          newsletter_opted_in: newsletterOptedIn,
          tuesday_nudge_opted_in: tuesdayNudgeOptedIn,
        },
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
      await setEmailPreferencesAtSignup(
        newsletterOptedIn,
        tuesdayNudgeOptedIn,
      );
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
          : seatParams
            ? "Check your email to confirm your account. After you verify, you'll continue to mentoring seat checkout."
            : preservedNext
              ? "Check your email to confirm your account. After you verify, you'll return to finish accepting the invitation."
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
            : seatParams
              ? "Create your account, then continue to mentoring seat checkout."
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
        <AuthForm onSubmit={handleSubmit} className="relative">
          <SignupHoneypotField
            id="signup-website"
            value={websiteHoneypot}
            onChange={setWebsiteHoneypot}
          />
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
          <label
            className="flex cursor-pointer items-start gap-3 text-[14px] leading-relaxed"
            style={{ fontFamily: "var(--font-ui)", color: "var(--sc-ink-mid)" }}
          >
            <input
              type="checkbox"
              name="newsletterOptedIn"
              checked={newsletterOptedIn}
              onChange={(e) => setNewsletterOptedInState(e.target.checked)}
              className="mt-1 h-4 w-4 shrink-0"
            />
            <span>{NEWSLETTER_OPT_IN_LABEL}</span>
          </label>
          <label
            className="flex cursor-pointer items-start gap-3 text-[14px] leading-relaxed"
            style={{ fontFamily: "var(--font-ui)", color: "var(--sc-ink-mid)" }}
          >
            <input
              type="checkbox"
              name="tuesdayNudgeOptedIn"
              checked={tuesdayNudgeOptedIn}
              onChange={(e) => setTuesdayNudgeOptedInState(e.target.checked)}
              className="mt-1 h-4 w-4 shrink-0"
            />
            <span className="min-w-0">
              <span className="block">{TUESDAY_NUDGE_OPT_IN_LABEL}</span>
              <span
                className="mt-1 block text-[13px] leading-relaxed"
                style={{ color: "var(--sc-ink-soft)" }}
              >
                {TUESDAY_NUDGE_OPT_IN_DETAIL}
              </span>
            </span>
          </label>
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
