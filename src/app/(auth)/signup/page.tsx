"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import { AuthMessage } from "@/components/auth/AuthMessage";
import {
  AuthField,
  AuthForm,
  AuthLink,
  AuthSubmit,
} from "@/components/auth/AuthForm";
import { createClient } from "@/lib/supabase/client";

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

export default function SignupPage() {
  const router = useRouter();
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
    const redirectBase =
      typeof window !== "undefined" ? window.location.origin : "";
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: `${redirectBase}/auth/callback?next=/dashboard`,
      },
    });
    setLoading(false);

    if (error) {
      setBanner({ variant: "error", text: friendlySignupError(error.message) });
      return;
    }

    if (data.session) {
      router.push("/dashboard");
      router.refresh();
      return;
    }

    setAwaitingConfirmation(true);
    setBanner({
      variant: "success",
      text: "Check your email to confirm your account, then sign in.",
    });
  }

  return (
    <AuthShell
      title="Create account"
      subtitle="Start building your private sermon library."
      footer={
        <>
          Already have an account?{" "}
          <AuthLink href="/login">Sign in</AuthLink>
        </>
      }
    >
      {banner ? (
        <div className="mb-5">
          <AuthMessage variant={banner.variant}>{banner.text}</AuthMessage>
        </div>
      ) : null}

      {awaitingConfirmation ? (
        <p
          className="text-center text-sm"
          style={{ fontFamily: "var(--font-ui)", color: "var(--sc-ink-soft)" }}
        >
          <AuthLink href="/login">Go to sign in</AuthLink>
        </p>
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
