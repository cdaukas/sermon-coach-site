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
  buildCheckoutPath,
  buildSignupPath,
  parseCoachCheckoutParams,
} from "@/lib/billing/checkout";

const QUERY_MESSAGES: Record<string, { variant: "error" | "success"; text: string }> =
  {
    auth_callback_failed: {
      variant: "error",
      text: "Sign-in link expired or invalid. Try again.",
    },
    password_updated: {
      variant: "success",
      text: "Your password was updated. Sign in with your new password.",
    },
  };

function friendlyAuthError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("invalid login credentials")) {
    return "Email or password is incorrect.";
  }
  if (lower.includes("email not confirmed")) {
    return "Please confirm your email before signing in.";
  }
  return "Something went wrong. Please try again.";
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const checkoutParams = parseCoachCheckoutParams(searchParams);
  const redirectTo = searchParams.get("redirectTo") ?? "/dashboard";
  const queryKey = searchParams.get("error") ?? searchParams.get("message");
  const queryBanner = queryKey ? QUERY_MESSAGES[queryKey] : undefined;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [banner, setBanner] = useState<{
    variant: "error" | "success";
    text: string;
  } | null>(queryBanner ?? null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBanner(null);

    if (!email.trim() || !password) {
      setBanner({
        variant: "error",
        text: "Please fill in all required fields.",
      });
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setLoading(false);

    if (error) {
      setBanner({ variant: "error", text: friendlyAuthError(error.message) });
      return;
    }

    router.push(
      checkoutParams
        ? buildCheckoutPath(checkoutParams.cadence)
        : redirectTo.startsWith("/")
          ? redirectTo
          : "/dashboard",
    );
    router.refresh();
  }

  return (
    <AuthShell
      title="Sign in"
      subtitle="Access your sermon library and evaluations."
      footer={
        <>
          Don&apos;t have an account?{" "}
          <AuthLink
            href={
              checkoutParams
                ? buildSignupPath(checkoutParams.cadence)
                : "/signup"
            }
          >
            Create one
          </AuthLink>
        </>
      }
    >
      {banner ? (
        <div className="mb-5">
          <AuthMessage variant={banner.variant}>{banner.text}</AuthMessage>
        </div>
      ) : null}

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
            autoComplete: "current-password",
            required: true,
            value: password,
            onChange: (e) => setPassword(e.target.value),
          }}
        />
        <div className="-mt-1 text-right">
          <AuthLink href="/reset-password">Forgot password?</AuthLink>
        </div>
        <AuthSubmit disabled={loading}>
          {loading ? "Signing in…" : "Sign in"}
        </AuthSubmit>
      </AuthForm>
    </AuthShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <AuthShell title="Sign in" subtitle="Access your sermon library and evaluations.">
          <p
            className="text-center text-sm"
            style={{ fontFamily: "var(--font-ui)", color: "var(--sc-ink-soft)" }}
          >
            Loading…
          </p>
        </AuthShell>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
