"use client";

import { useState } from "react";
import { AuthMessage } from "@/components/auth/AuthMessage";
import { saveEmailPreferences } from "@/lib/auth/profile-actions";

const uiFont = { fontFamily: "var(--font-ui)" };

type AccountEmailPreferencesFormProps = {
  email: string;
  initialNewsletterOptedIn: boolean;
  initialTuesdayNudgeOptedIn: boolean;
};

export function AccountEmailPreferencesForm({
  email,
  initialNewsletterOptedIn,
  initialTuesdayNudgeOptedIn,
}: AccountEmailPreferencesFormProps) {
  const [newsletterOptedIn, setNewsletterOptedIn] = useState(
    initialNewsletterOptedIn,
  );
  const [tuesdayNudgeOptedIn, setTuesdayNudgeOptedIn] = useState(
    initialTuesdayNudgeOptedIn,
  );
  const [savingKey, setSavingKey] = useState<"newsletter" | "tuesday" | null>(
    null,
  );
  const [banner, setBanner] = useState<{
    variant: "error" | "success";
    text: string;
  } | null>(null);

  async function handleTuesdayChange(checked: boolean) {
    const previousNewsletter = newsletterOptedIn;
    const previousTuesday = tuesdayNudgeOptedIn;
    setTuesdayNudgeOptedIn(checked);
    setBanner(null);
    setSavingKey("tuesday");

    try {
      const result = await saveEmailPreferences(previousNewsletter, checked);
      if (!result.ok) {
        setTuesdayNudgeOptedIn(previousTuesday);
        setBanner({ variant: "error", text: result.error });
        return;
      }
      setBanner({ variant: "success", text: "Preference saved." });
    } finally {
      setSavingKey(null);
    }
  }

  async function handleNewsletterChange(checked: boolean) {
    const previousNewsletter = newsletterOptedIn;
    const previousTuesday = tuesdayNudgeOptedIn;
    setNewsletterOptedIn(checked);
    setBanner(null);
    setSavingKey("newsletter");

    try {
      const result = await saveEmailPreferences(checked, previousTuesday);
      if (!result.ok) {
        setNewsletterOptedIn(previousNewsletter);
        setBanner({ variant: "error", text: result.error });
        return;
      }
      setBanner({ variant: "success", text: "Preference saved." });
    } finally {
      setSavingKey(null);
    }
  }

  const disabled = savingKey !== null;

  return (
    <div className="flex max-w-md flex-col gap-5">
      {banner ? (
        <AuthMessage variant={banner.variant}>{banner.text}</AuthMessage>
      ) : null}

      <label
        className="flex cursor-pointer items-start gap-3 text-[14px] leading-relaxed"
        style={{
          ...uiFont,
          color: "var(--sc-ink-mid)",
          opacity: disabled ? 0.7 : 1,
        }}
      >
        <input
          type="checkbox"
          name="tuesdayNudgeOptedIn"
          checked={tuesdayNudgeOptedIn}
          disabled={disabled}
          onChange={(event) => void handleTuesdayChange(event.target.checked)}
          className="mt-1 h-4 w-4 shrink-0"
        />
        <span className="min-w-0">
          <span
            className="block font-medium"
            style={{ color: "var(--sc-ink)" }}
          >
            The Tuesday nudge
          </span>
          <span
            className="mt-1 block text-[13px] leading-relaxed"
            style={{ color: "var(--sc-ink-soft)" }}
          >
            A prompt to look back at Sunday and start next week&apos;s sketch.
          </span>
        </span>
      </label>

      <label
        className="flex cursor-pointer items-start gap-3 text-[14px] leading-relaxed"
        style={{
          ...uiFont,
          color: "var(--sc-ink-mid)",
          opacity: disabled ? 0.7 : 1,
        }}
      >
        <input
          type="checkbox"
          name="newsletterOptedIn"
          checked={newsletterOptedIn}
          disabled={disabled}
          onChange={(event) => void handleNewsletterChange(event.target.checked)}
          className="mt-1 h-4 w-4 shrink-0"
        />
        <span className="min-w-0">
          <span
            className="block font-medium"
            style={{ color: "var(--sc-ink)" }}
          >
            The Friday post
          </span>
          <span
            className="mt-1 block text-[13px] leading-relaxed"
            style={{ color: "var(--sc-ink-soft)" }}
          >
            One short piece each week on a single criterion from the rubric.
          </span>
        </span>
      </label>

      <p
        className="text-[13px] leading-relaxed"
        style={{ ...uiFont, color: "var(--sc-ink-soft)" }}
      >
        Sent to {email}
      </p>
    </div>
  );
}
