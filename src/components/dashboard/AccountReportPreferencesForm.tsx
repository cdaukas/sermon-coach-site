"use client";

import { useState } from "react";
import { AuthMessage } from "@/components/auth/AuthMessage";
import { saveReportPreferences } from "@/lib/auth/profile-actions";

const uiFont = { fontFamily: "var(--font-ui)" };

type AccountReportPreferencesFormProps = {
  initialIncludeMethodology: boolean;
};

export function AccountReportPreferencesForm({
  initialIncludeMethodology,
}: AccountReportPreferencesFormProps) {
  const [includeMethodology, setIncludeMethodology] = useState(
    initialIncludeMethodology,
  );
  const [saving, setSaving] = useState(false);
  const [banner, setBanner] = useState<{
    variant: "error" | "success";
    text: string;
  } | null>(null);

  async function handleChange(checked: boolean) {
    const previous = includeMethodology;
    setIncludeMethodology(checked);
    setBanner(null);
    setSaving(true);

    try {
      const result = await saveReportPreferences(checked);
      if (!result.ok) {
        setIncludeMethodology(previous);
        setBanner({ variant: "error", text: result.error });
        return;
      }
      setBanner({ variant: "success", text: "Preference saved." });
    } finally {
      setSaving(false);
    }
  }

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
          opacity: saving ? 0.7 : 1,
        }}
      >
        <input
          type="checkbox"
          name="includeMethodologyInReports"
          checked={includeMethodology}
          disabled={saving}
          onChange={(event) => void handleChange(event.target.checked)}
          className="mt-1 h-4 w-4 shrink-0"
        />
        <span className="min-w-0">
          <span
            className="block font-medium"
            style={{ color: "var(--sc-ink)" }}
          >
            Include score summary and methodology in reports
          </span>
          <span
            className="mt-1 block text-[13px] leading-relaxed"
            style={{ color: "var(--sc-ink-soft)" }}
          >
            Adds a short section at the end of each report naming the rubric and
            its sources. Turn it off if you already know it.
          </span>
        </span>
      </label>
    </div>
  );
}
