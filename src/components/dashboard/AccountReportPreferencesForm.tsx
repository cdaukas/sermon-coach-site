"use client";

import { useState } from "react";
import { AuthMessage } from "@/components/auth/AuthMessage";
import {
  saveReportLanguage,
  saveReportPreferences,
} from "@/lib/auth/profile-actions";

const uiFont = { fontFamily: "var(--font-ui)" };

type ReportLanguage = "en" | "es";

type AccountReportPreferencesFormProps = {
  initialIncludeMethodology: boolean;
  initialReportLanguage: ReportLanguage;
};

const REPORT_LANGUAGE_COPY = {
  en: {
    label: "Report language",
    help: "Your report is written in this language. You can submit sermons in any language. Existing reports keep the language they were written in.",
    saved: "Preference saved.",
  },
  es: {
    label: "Idioma del informe",
    help: "Tu informe se escribe en este idioma. Puedes enviar sermones en cualquier idioma. Los informes existentes conservan el idioma en que fueron escritos.",
    saved: "Preferencia guardada.",
  },
} as const;

export function AccountReportPreferencesForm({
  initialIncludeMethodology,
  initialReportLanguage,
}: AccountReportPreferencesFormProps) {
  const [includeMethodology, setIncludeMethodology] = useState(
    initialIncludeMethodology,
  );
  const [reportLanguage, setReportLanguage] = useState<ReportLanguage>(
    initialReportLanguage,
  );
  const [saving, setSaving] = useState(false);
  const [banner, setBanner] = useState<{
    variant: "error" | "success";
    text: string;
  } | null>(null);

  const languageCopy = REPORT_LANGUAGE_COPY[reportLanguage];

  async function handleMethodologyChange(checked: boolean) {
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

  async function handleLanguageChange(next: ReportLanguage) {
    const previous = reportLanguage;
    setReportLanguage(next);
    setBanner(null);
    setSaving(true);

    try {
      const result = await saveReportLanguage(next);
      if (!result.ok) {
        setReportLanguage(previous);
        setBanner({ variant: "error", text: result.error });
        return;
      }
      setBanner({
        variant: "success",
        text: REPORT_LANGUAGE_COPY[next].saved,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex max-w-md flex-col gap-5">
      {banner ? (
        <AuthMessage variant={banner.variant}>{banner.text}</AuthMessage>
      ) : null}

      <div
        className="flex flex-col gap-2"
        style={{ opacity: saving ? 0.7 : 1 }}
      >
        <label
          htmlFor="report-language"
          className="text-[14px] font-medium"
          style={{ ...uiFont, color: "var(--sc-ink)" }}
        >
          {languageCopy.label}
        </label>
        <select
          id="report-language"
          name="reportLanguage"
          value={reportLanguage}
          disabled={saving}
          onChange={(event) =>
            void handleLanguageChange(
              event.target.value === "es" ? "es" : "en",
            )
          }
          className="w-full rounded border px-3 py-2.5 text-[14px] outline-none transition-colors focus:border-[var(--sc-accent)] focus:ring-2 focus:ring-[var(--sc-accent)]/20"
          style={{
            ...uiFont,
            background: "var(--sc-panel)",
            borderColor: "var(--sc-rule)",
            color: "var(--sc-ink)",
          }}
        >
          <option value="en">English</option>
          <option value="es">Español</option>
        </select>
        <p
          className="text-[13px] leading-relaxed"
          style={{ ...uiFont, color: "var(--sc-ink-soft)" }}
        >
          {languageCopy.help}
        </p>
      </div>

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
          onChange={(event) => void handleMethodologyChange(event.target.checked)}
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
            its sources. Turn it off if you&apos;d prefer.
          </span>
        </span>
      </label>
    </div>
  );
}
