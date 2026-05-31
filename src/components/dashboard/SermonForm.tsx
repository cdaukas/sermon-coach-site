"use client";

import { useState } from "react";
import { AuthMessage } from "@/components/auth/AuthMessage";
import {
  AuthField,
  AuthForm,
  AuthLabel,
  AuthSubmit,
} from "@/components/auth/AuthForm";
import { createSermon } from "@/lib/sermons/actions";

const uiFont = { fontFamily: "var(--font-ui)" };

export function SermonForm() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
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
      }
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

      <AuthSubmit type="submit" disabled={loading}>
        {loading ? "Saving…" : "Save sermon"}
      </AuthSubmit>
    </AuthForm>
  );
}
