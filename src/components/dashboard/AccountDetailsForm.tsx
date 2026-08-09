"use client";

import { useState } from "react";
import { AuthField, AuthForm, AuthSubmit } from "@/components/auth/AuthForm";
import { AuthMessage } from "@/components/auth/AuthMessage";
import { saveProfileDetails } from "@/lib/auth/profile-actions";

const uiFont = { fontFamily: "var(--font-ui)" };

type AccountDetailsFormProps = {
  initialDisplayName: string;
  initialChurchName: string;
};

export function AccountDetailsForm({
  initialDisplayName,
  initialChurchName,
}: AccountDetailsFormProps) {
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [churchName, setChurchName] = useState(initialChurchName);
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
      const result = await saveProfileDetails(displayName, churchName);
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

      <AuthField
        id="account-display-name"
        label="Name"
        inputProps={{
          name: "displayName",
          type: "text",
          autoComplete: "name",
          maxLength: 80,
          value: displayName,
          onChange: (event) => setDisplayName(event.target.value),
        }}
      />

      <AuthField
        id="account-church-name"
        label="Church"
        inputProps={{
          name: "churchName",
          type: "text",
          autoComplete: "organization",
          maxLength: 120,
          value: churchName,
          onChange: (event) => setChurchName(event.target.value),
        }}
      />

      <p
        className="text-[13px] leading-relaxed"
        style={{ ...uiFont, color: "var(--sc-ink-soft)" }}
      >
        These prefill your evaluations so you are not retyping them each week.
      </p>

      <AuthSubmit disabled={saving}>
        {saving ? "Saving…" : "Save"}
      </AuthSubmit>
    </AuthForm>
  );
}
