"use client";

import { useState } from "react";
import { AuthShell } from "@/components/auth/AuthShell";
import { AuthMessage } from "@/components/auth/AuthMessage";
import {
  AuthField,
  AuthForm,
  AuthLink,
  AuthSubmit,
} from "@/components/auth/AuthForm";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [banner, setBanner] = useState<{
    variant: "error" | "success";
    text: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBanner(null);

    if (!email.trim()) {
      setBanner({
        variant: "error",
        text: "Please fill in all required fields.",
      });
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const redirectBase =
      typeof window !== "undefined" ? window.location.origin : "";
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${redirectBase}/auth/callback?next=/update-password`,
    });
    setLoading(false);

    if (error) {
      setBanner({
        variant: "error",
        text: "Something went wrong. Please try again.",
      });
      return;
    }

    setEmailSent(true);
    setBanner({
      variant: "success",
      text: "If an account exists for that email, we sent a reset link.",
    });
  }

  return (
    <AuthShell
      title="Reset password"
      subtitle="We'll email you a link to choose a new password."
      footer={
        <>
          Remember your password?{" "}
          <AuthLink href="/login">Sign in</AuthLink>
        </>
      }
    >
      {banner ? (
        <div className="mb-5">
          <AuthMessage variant={banner.variant}>{banner.text}</AuthMessage>
        </div>
      ) : null}

      {emailSent ? (
        <p
          className="text-center text-sm"
          style={{ fontFamily: "var(--font-ui)", color: "var(--sc-ink-soft)" }}
        >
          <AuthLink href="/login">Back to sign in</AuthLink>
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
          <AuthSubmit disabled={loading}>
            {loading ? "Sending…" : "Send reset link"}
          </AuthSubmit>
        </AuthForm>
      )}
    </AuthShell>
  );
}
