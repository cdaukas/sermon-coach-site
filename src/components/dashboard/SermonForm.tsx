"use client";

import { useRouter } from "next/navigation";
import { useCallback, useMemo, useRef, useState } from "react";
import { AuthMessage } from "@/components/auth/AuthMessage";
import {
  AuthField,
  AuthForm,
  AuthLabel,
  AuthSubmit,
} from "@/components/auth/AuthForm";
import { ModeSelector } from "@/components/dashboard/ModeSelector";
import { EvaluationCreditLine } from "@/components/evaluation/EvaluationCreditLine";
import { EvaluationPollingStatus } from "@/components/evaluation/EvaluationPollingStatus";
import { useEvaluationPolling } from "@/components/evaluation/useEvaluationPolling";
import { requestEvaluation } from "@/lib/evaluation/actions";
import {
  normalizeSermonContext,
  sermonContextStorageKey,
  type StashedReportMode,
} from "@/lib/evaluation/context";
import { evalErrorParamForStartFailure } from "@/lib/evaluation/eval-start-errors";
import type { EvaluationEntitlement } from "@/lib/evaluation/entitlement-types";
import { createSermon } from "@/lib/sermons/actions";
import type { TranscriptErrorCode } from "@/lib/transcripts/types";

const uiFont = { fontFamily: "var(--font-ui)" };
const serifFont = { fontFamily: "var(--font-serif)" };
const WORDS_PER_MINUTE = 140;

const contextFieldClassName =
  "w-full resize-y rounded border px-3 py-2.5 text-[15px] leading-relaxed outline-none transition-colors focus:border-[var(--sc-accent)] focus:ring-2 focus:ring-[var(--sc-accent)]/20";

const contextFieldStyle = {
  ...uiFont,
  background: "var(--sc-panel)",
  borderColor: "var(--sc-rule)",
  color: "var(--sc-ink)",
};

const YOUTUBE_ERROR_MESSAGES: Record<TranscriptErrorCode, string> = {
  NO_CAPTIONS:
    "This video doesn't have captions we can read yet. If it was streamed in the last day or two, captions may still be processing — try again tomorrow, or paste the transcript below.",
  VIDEO_UNAVAILABLE:
    "We couldn't reach that video. Check that the link is public, or paste the transcript below.",
  PROVIDER_ERROR:
    "Something went wrong on our end. Try again in a minute, or paste the transcript below.",
  RATE_LIMITED:
    "You've hit today's fetch limit. Paste the transcript below, or try again tomorrow.",
  INVALID_URL: "Enter a valid YouTube link (watch, youtu.be, or live).",
  INVALID_SOURCE: "That transcript source is not supported yet.",
  UNAUTHORIZED: "You must be signed in to fetch a transcript.",
  NOT_CONFIGURED: "YouTube transcript fetch is not configured on the server.",
};

type YoutubeTranscriptResponse =
  | { ok: true; transcript: string }
  | { ok: false; error: TranscriptErrorCode; message?: string };

type InputMethod = "paste" | "youtube";

type SermonFormProps = {
  entitlement: EvaluationEntitlement | null;
  defaultReportMode: StashedReportMode;
};

function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) {
    return 0;
  }

  return trimmed.split(/\s+/).length;
}

function estimateSermonMinutes(wordCount: number): number {
  if (wordCount === 0) {
    return 0;
  }

  const rawMinutes = wordCount / WORDS_PER_MINUTE;
  const rounded = Math.round(rawMinutes / 5) * 5;
  return rounded > 0 ? rounded : 5;
}

export function SermonForm({
  entitlement,
  defaultReportMode,
}: SermonFormProps) {
  const router = useRouter();
  const savedSermonIdRef = useRef<string | null>(null);
  const [inputMethod, setInputMethod] = useState<InputMethod>("paste");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [primaryPassage, setPrimaryPassage] = useState("");
  const [occasion, setOccasion] = useState("");
  const [audience, setAudience] = useState("");
  const [series, setSeries] = useState("");
  const [other, setOther] = useState("");
  const [reportMode, setReportMode] = useState<StashedReportMode>(defaultReportMode);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [youtubeError, setYoutubeError] = useState<string | null>(null);
  const [youtubeFetching, setYoutubeFetching] = useState(false);
  const [contentFromYoutube, setContentFromYoutube] = useState(false);

  const canEvaluate = entitlement?.canEvaluate ?? false;

  const handleEvalComplete = useCallback(
    (evaluationId: string, sermonId: string) => {
      router.push(`/dashboard/sermons/${sermonId}/evaluations/${evaluationId}`);
    },
    [router],
  );

  const handleEvalFailed = useCallback(
    (message: string) => {
      const sermonId = savedSermonIdRef.current;
      if (sermonId) {
        router.push(
          `/dashboard/sermons/${sermonId}?evalError=${evalErrorParamForStartFailure(message)}`,
        );
      }
    },
    [router],
  );

  const { polling, elapsed, startPolling } = useEvaluationPolling({
    onComplete: handleEvalComplete,
    onFailed: handleEvalFailed,
  });

  const wordCount = useMemo(() => countWords(content), [content]);
  const sermonMinutes = useMemo(() => estimateSermonMinutes(wordCount), [wordCount]);

  async function handleFetchYoutubeTranscript() {
    setYoutubeError(null);

    const trimmedUrl = youtubeUrl.trim();
    if (!trimmedUrl) {
      setYoutubeError(YOUTUBE_ERROR_MESSAGES.INVALID_URL);
      return;
    }

    setYoutubeFetching(true);

    try {
      const response = await fetch("/api/sermons/youtube-transcript", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: trimmedUrl, source: "youtube" }),
      });

      const data = (await response.json()) as YoutubeTranscriptResponse;

      if (!response.ok || !data.ok) {
        const code =
          !data.ok && "error" in data ? data.error : "PROVIDER_ERROR";
        setYoutubeError(
          (!data.ok && data.message) ||
            YOUTUBE_ERROR_MESSAGES[code] ||
            YOUTUBE_ERROR_MESSAGES.PROVIDER_ERROR,
        );
        return;
      }

      setContent(data.transcript);
      setContentFromYoutube(true);
      setYoutubeError(null);
      setInputMethod("paste");
    } catch {
      setYoutubeError(YOUTUBE_ERROR_MESSAGES.PROVIDER_ERROR);
    } finally {
      setYoutubeFetching(false);
    }
  }

  function buildContext() {
    return normalizeSermonContext({
      occasion,
      audience,
      series,
      other,
    });
  }

  function validateForm(): string | null {
    if (!title.trim() || !content.trim()) {
      return "Title and manuscript are required.";
    }

    return null;
  }

  async function saveSermon(): Promise<
    { ok: true; sermonId: string } | { ok: false; error: string }
  > {
    const validationError = validateForm();
    if (validationError) {
      return { ok: false, error: validationError };
    }

    return createSermon({ title, content, primaryPassage });
  }

  function stashContext(sermonId: string) {
    const context = buildContext();

    if (context) {
      sessionStorage.setItem(
        sermonContextStorageKey(sermonId),
        JSON.stringify(context),
      );
    }
  }

  async function handleSaveWithoutRunning() {
    setError(null);

    setSaving(true);

    try {
      const result = await saveSermon();

      if (!result.ok) {
        setError(result.error);
        return;
      }

      stashContext(result.sermonId);
      router.push(`/dashboard/sermons/${result.sermonId}`);
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveAndRun() {
    setError(null);

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);

    try {
      const result = await saveSermon();

      if (!result.ok) {
        setError(result.error);
        return;
      }

      savedSermonIdRef.current = result.sermonId;
      const context = buildContext();

      // requestEvaluation may redirect to /pricing.html if credits were
      // exhausted between page load and this call.
      const evalResult = await requestEvaluation(
        result.sermonId,
        context,
        reportMode,
      );

      if (!evalResult.ok) {
        router.push(
          `/dashboard/sermons/${result.sermonId}?evalError=${evalErrorParamForStartFailure(evalResult.error)}`,
        );
        return;
      }

      startPolling(evalResult.evaluationId, evalResult.sermonId);
    } catch {
      setError("Something went wrong. Try again in a minute.");
    } finally {
      setSaving(false);
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void handleSaveAndRun();
  }

  const formDisabled = saving || polling || youtubeFetching;
  const primaryDisabled = formDisabled || !canEvaluate;
  const primaryLabel = polling
    ? "Evaluating…"
    : saving
      ? "Saving…"
      : "Save and run evaluation";

  return (
    <AuthForm onSubmit={handleSubmit}>
      {error ? <AuthMessage variant="error">{error}</AuthMessage> : null}

      <div className="flex flex-col items-start gap-2">
        <div
          className="inline-flex rounded border p-1"
          style={{ borderColor: "var(--sc-rule)", background: "var(--sc-bg)" }}
          role="tablist"
          aria-label="Input method"
        >
          {(
            [
              { value: "paste", label: "Paste manuscript" },
              { value: "youtube", label: "YouTube link" },
            ] as const
          ).map((tab) => {
            const selected = inputMethod === tab.value;

            return (
              <button
                key={tab.value}
                type="button"
                role="tab"
                aria-selected={selected}
                disabled={formDisabled}
                onClick={() => setInputMethod(tab.value)}
                className="rounded px-4 py-2.5 text-[13px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                style={{
                  ...uiFont,
                  background: selected ? "var(--sc-panel)" : "transparent",
                  color: selected ? "var(--sc-ink)" : "var(--sc-ink-soft)",
                  boxShadow: selected ? "var(--sc-shadow-lift)" : "none",
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div
          role="tabpanel"
          hidden={inputMethod !== "paste"}
          className="w-full flex flex-col gap-1.5"
        >
          {contentFromYoutube ? (
            <p
              className="text-[13px] leading-relaxed"
              style={{ ...uiFont, color: "var(--sc-ink-soft)" }}
            >
              Captions often include announcements and worship. Trim to just the
              sermon for the most accurate evaluation.
            </p>
          ) : null}
          <textarea
            id="sermon-content"
            name="content"
            required
            value={content}
            onChange={(event) => {
              setContent(event.target.value);
              if (contentFromYoutube) {
                setContentFromYoutube(false);
              }
            }}
            disabled={formDisabled}
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
          {wordCount > 0 ? (
            <p
              className="text-[13px] leading-relaxed"
              style={{ ...uiFont, color: "var(--sc-ink-soft)" }}
            >
              {wordCount.toLocaleString()} words, about a {sermonMinutes}-minute
              sermon
            </p>
          ) : null}
        </div>

        <div role="tabpanel" hidden={inputMethod !== "youtube"} className="w-full flex flex-col gap-3">
          <AuthField
            id="sermon-youtube-url"
            label="Paste a YouTube link"
            inputProps={{
              name: "youtube-url",
              type: "url",
              autoComplete: "off",
              value: youtubeUrl,
              onChange: (event) => setYoutubeUrl(event.target.value),
              onKeyDown: (event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  void handleFetchYoutubeTranscript();
                }
              },
              disabled: formDisabled,
              placeholder: "https://www.youtube.com/watch?v=…",
            }}
          />

          <button
            type="button"
            disabled={formDisabled}
            onClick={() => void handleFetchYoutubeTranscript()}
            className="self-start rounded border px-5 py-2.5 text-sm font-semibold tracking-wide transition-all disabled:cursor-not-allowed disabled:opacity-60"
            style={{
              ...uiFont,
              background: "var(--sc-ink)",
              color: "var(--sc-bg)",
              borderColor: "var(--sc-ink)",
            }}
          >
            {youtubeFetching ? "Fetching captions…" : "Fetch transcript"}
          </button>

          {youtubeError ? (
            <AuthMessage variant="error">{youtubeError}</AuthMessage>
          ) : null}
        </div>
      </div>

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
          disabled: formDisabled,
          placeholder: "e.g. The God Who Hears",
        }}
      />

      <AuthField
        id="sermon-primary-passage"
        label="Primary passage (recommended)"
        inputProps={{
          name: "primary-passage",
          type: "text",
          autoComplete: "off",
          value: primaryPassage,
          onChange: (event) => setPrimaryPassage(event.target.value),
          disabled: formDisabled,
          placeholder: "e.g. Hebrews 12:5-17",
        }}
      />

      <details className="group">
        <summary
          className="cursor-pointer list-none rounded border px-5 py-4 transition-colors hover:border-[var(--sc-ink)] [&::-webkit-details-marker]:hidden"
          style={{
            ...uiFont,
            background: "var(--sc-bg)",
            borderColor: "var(--sc-rule)",
            color: "var(--sc-ink)",
          }}
        >
          <span className="block text-[15px] font-semibold" style={serifFont}>
            Add context (optional)
          </span>
          <span
            className="mt-1 block text-[13px] font-normal leading-relaxed"
            style={{ color: "var(--sc-ink-soft)" }}
          >
            A minute of context sharpens the read. Skip it and the evaluation
            still runs.
          </span>
        </summary>

        <div className="mt-4 flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <AuthLabel htmlFor="sermon-context-occasion">
              What&apos;s the occasion?
            </AuthLabel>
            <textarea
              id="sermon-context-occasion"
              name="context-occasion"
              value={occasion}
              onChange={(event) => setOccasion(event.target.value)}
              disabled={formDisabled}
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
              disabled={formDisabled}
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
              disabled={formDisabled}
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
              disabled={formDisabled}
              rows={2}
              placeholder="The thing you'd tell a friend before he read your manuscript."
              className={contextFieldClassName}
              style={contextFieldStyle}
            />
          </div>
        </div>
      </details>

      <ModeSelector
        value={reportMode}
        onChange={setReportMode}
        disabled={formDisabled}
      />

      <div>
        {polling ? <EvaluationPollingStatus elapsed={elapsed} /> : null}

        <AuthSubmit type="submit" disabled={primaryDisabled}>
          {primaryLabel}
        </AuthSubmit>

        <p className="mt-3 text-center">
          <button
            type="button"
            disabled={formDisabled}
            onClick={() => void handleSaveWithoutRunning()}
            className="border-0 bg-transparent p-0 text-[13px] underline-offset-2 hover:underline disabled:cursor-not-allowed disabled:opacity-60"
            style={{ ...uiFont, color: "var(--sc-ink-soft)" }}
          >
            Save without running
          </button>
        </p>

        <EvaluationCreditLine entitlement={entitlement} />
      </div>
    </AuthForm>
  );
}
