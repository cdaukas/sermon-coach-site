"use client";

import { useEffect, useState } from "react";
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

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [banner, setBanner] = useState<{
    variant: "error" | "success";
    text: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    async function checkSession() {
      const supabase = createClient();
      const { data, error } = await supabase.auth.getUser();

      if (error || !data.user) {
        setHasSession(false);
        setBanner({
          variant: "error",
          text: "This reset link is invalid or has expired. Request a new one.",
        });
      } else {
        setHasSession(true);
      }

      setCheckingSession(false);
    }

    void checkSession();
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBanner(null);

    if (!password || !confirmPassword) {
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
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      setBanner({
        variant: "error",
        text: error.message.includes("password")
          ? error.message
          : "Something went wrong. Please try again.",
      });
      return;
    }

    await supabase.auth.signOut();
    router.push("/login?message=password_updated");
    router.refresh();
  }

  return (
    <AuthShell
      title="Choose a new password"
      subtitle="Enter and confirm your new password below."
      footer={
        <>
          <AuthLink href="/reset-password">Request a new reset link</AuthLink>
        </>
      }
    >
      {checkingSession ? (
        <p
          className="text-center text-sm"
          style={{ fontFamily: "var(--font-ui)", color: "var(--sc-ink-soft)" }}
        >
          Loading…
        </p>
      ) : null}

      {!checkingSession && banner ? (
        <div className="mb-5">
          <AuthMessage variant={banner.variant}>{banner.text}</AuthMessage>
        </div>
      ) : null}

      {!checkingSession && hasSession ? (
        <AuthForm onSubmit={handleSubmit}>
          <AuthField
            id="password"
            label="New password"
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
            label="Confirm new password"
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
            {loading ? "Updating…" : "Update password"}
          </AuthSubmit>
        </AuthForm>
      ) : null}

      {!checkingSession && !hasSession ? (
        <p
          className="text-center text-sm"
          style={{ fontFamily: "var(--font-ui)", color: "var(--sc-ink-soft)" }}
        >
          <AuthLink href="/login">Back to sign in</AuthLink>
        </p>
      ) : null}
    </AuthShell>
  );
}
