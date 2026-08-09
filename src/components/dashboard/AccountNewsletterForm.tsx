"use client";

import { useState } from "react";
import { AuthForm, AuthSubmit } from "@/components/auth/AuthForm";
import { AuthMessage } from "@/components/auth/AuthMessage";
import { saveNewsletterPreference } from "@/lib/auth/profile-actions";

const uiFont = { fontFamily: "var(--font-ui)" };

type AccountNewsletterFormProps = {
  email: string;
  initialOptedIn: boolean;
};

export function AccountNewsletterForm({
  email,
  initialOptedIn,
}: AccountNewsletterFormProps) {
  const [optedIn, setOptedIn] = useState(initialOptedIn);
  const [saving, setSaving] = useState(false);
  const [banner, setBanner] = useState<{
    variant: "error" | "success";
    text: string;
  } | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBanner(null);
    setSaving(true);

    try {
      const result = await saveNewsletterPreference(optedIn);
      if (!result.ok) {
        setBanner({ variant: "error", text: result.error });
        return;
      }
      setBanner({ variant: "success", text: "Saved." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <AuthForm onSubmit={handleSubmit} className="max-w-md">
      {banner ? (
        <AuthMessage variant={banner.variant}>{banner.text}</AuthMessage>
      ) : null}

      <p
        className="text-[15px] leading-relaxed"
        style={{ ...uiFont, color: "var(--sc-ink)" }}
      >
        {email}
      </p>

      <label
        className="flex cursor-pointer items-start gap-3 text-[14px] leading-relaxed"
        style={{ ...uiFont, color: "var(--sc-ink-mid)" }}
      >
        <input
          type="checkbox"
          name="newsletterOptedIn"
          checked={optedIn}
          onChange={(event) => setOptedIn(event.target.checked)}
          className="mt-1 h-4 w-4 shrink-0"
        />
        <span>Send me the weekly post.</span>
      </label>

      <AuthSubmit disabled={saving}>
        {saving ? "Saving…" : "Save"}
      </AuthSubmit>
    </AuthForm>
  );
}
