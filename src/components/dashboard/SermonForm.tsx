"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthMessage } from "@/components/auth/AuthMessage";
import {
  AuthField,
  AuthForm,
  AuthLabel,
  AuthSubmit,
} from "@/components/auth/AuthForm";
import {
  normalizeSermonContext,
  sermonContextStorageKey,
} from "@/lib/evaluation/context";
import { createSermon } from "@/lib/sermons/actions";

const uiFont = { fontFamily: "var(--font-ui)" };
const serifFont = { fontFamily: "var(--font-serif)" };

const contextFieldClassName =
  "w-full resize-y rounded border px-3 py-2.5 text-[15px] leading-relaxed outline-none transition-colors focus:border-[var(--sc-accent)] focus:ring-2 focus:ring-[var(--sc-accent)]/20";

const contextFieldStyle = {
  ...uiFont,
  background: "var(--sc-panel)",
  borderColor: "var(--sc-rule)",
  color: "var(--sc-ink)",
};

export function SermonForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [occasion, setOccasion] = useState("");
  const [audience, setAudience] = useState("");
  const [series, setSeries] = useState("");
  const [other, setOther] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!title.trim() || !content.trim()) {
      setError("Title and manuscript are required.");
      return;
    }

    setLoading(true);

    try {
      const result = await createSermon({ title, content });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      const context = normalizeSermonContext({
        occasion,
        audience,
        series,
        other,
      });

      if (context) {
        sessionStorage.setItem(
          sermonContextStorageKey(result.sermonId),
          JSON.stringify(context),
        );
      }

      router.push(`/dashboard/sermons/${result.sermonId}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthForm onSubmit={handleSubmit}>
      {error ? <AuthMessage variant="error">{error}</AuthMessage> : null}

      <AuthField
        id="sermon-title"
        label="Title"
        inputProps={{
          name: "title",
          type: "text",
          autoComplete: "off",
          required: true,
          value: title,
          onChange: (event) => setTitle(event.target.value),
          disabled: loading,
          placeholder: "e.g. The God Who Hears",
        }}
      />

      <div className="flex flex-col gap-1.5">
        <AuthLabel htmlFor="sermon-content">Manuscript</AuthLabel>
        <textarea
          id="sermon-content"
          name="content"
          required
          value={content}
          onChange={(event) => setContent(event.target.value)}
          disabled={loading}
          rows={16}
          placeholder="Paste your manuscript or transcript here..."
          className="w-full resize-y rounded border px-3 py-2.5 text-[15px] leading-relaxed outline-none transition-colors focus:border-[var(--sc-accent)] focus:ring-2 focus:ring-[var(--sc-accent)]/20"
          style={{
            ...uiFont,
            background: "var(--sc-panel)",
            borderColor: "var(--sc-rule)",
            color: "var(--sc-ink)",
          }}
        />
      </div>

      <section
        className="flex flex-col gap-5 border-t pt-6"
        style={{ borderColor: "var(--sc-rule)" }}
        aria-labelledby="sermon-context-heading"
      >
        <div>
          <h2
            id="sermon-context-heading"
            className="text-[22px] font-semibold leading-snug tracking-tight"
            style={{ ...serifFont, color: "var(--sc-ink)" }}
          >
            Before we begin, a minute of context sharpens the read.
          </h2>
          <p
            className="mt-2 text-base leading-relaxed"
            style={{
              ...serifFont,
              color: "var(--sc-ink-soft)",
              fontStyle: "italic",
            }}
          >
            Optional, but it helps. Or{" "}
            <button
              type="submit"
              disabled={loading}
              className="inline border-0 bg-transparent p-0 text-[13px] not-italic underline-offset-2 transition-colors hover:underline disabled:cursor-not-allowed disabled:opacity-60"
              style={{ ...uiFont, color: "var(--sc-ink-soft)" }}
            >
              skip it and start the evaluation
            </button>
            .
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <AuthLabel htmlFor="sermon-context-occasion">
            What&apos;s the occasion?
          </AuthLabel>
          <textarea
            id="sermon-context-occasion"
            name="context-occasion"
            value={occasion}
            onChange={(event) => setOccasion(event.target.value)}
            disabled={loading}
            rows={2}
            placeholder="Sunday morning, a funeral, a conference, a guest pulpit, a chapel service."
            className={contextFieldClassName}
            style={contextFieldStyle}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <AuthLabel htmlFor="sermon-context-audience">
            Who&apos;s in the seats?
          </AuthLabel>
          <textarea
            id="sermon-context-audience"
            name="context-audience"
            value={audience}
            onChange={(event) => setAudience(event.target.value)}
            disabled={loading}
            rows={2}
            placeholder="A rural plant, a college town, a Reformed church, a mixed-belief crowd on Easter."
            className={contextFieldClassName}
            style={contextFieldStyle}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <AuthLabel htmlFor="sermon-context-series">Part of a series?</AuthLabel>
          <textarea
            id="sermon-context-series"
            name="context-series"
            value={series}
            onChange={(event) => setSeries(event.target.value)}
            disabled={loading}
            rows={2}
            placeholder="If this is week three of six, say so. It explains what you don't have to re-establish."
            className={contextFieldClassName}
            style={contextFieldStyle}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <AuthLabel htmlFor="sermon-context-other">
            Anything else I should know?
          </AuthLabel>
          <textarea
            id="sermon-context-other"
            name="context-other"
            value={other}
            onChange={(event) => setOther(event.target.value)}
            disabled={loading}
            rows={2}
            placeholder="The thing you'd tell a friend before he read your manuscript."
            className={contextFieldClassName}
            style={contextFieldStyle}
          />
        </div>
      </section>

      <AuthSubmit type="submit" disabled={loading}>
        {loading ? "Saving…" : "Save sermon"}
      </AuthSubmit>
    </AuthForm>
  );
}
