"use client";

import { useState, type FormEvent } from "react";
import type { OutlineForm, SketchIntake } from "@/lib/sketch/types";

const uiFont = { fontFamily: "var(--font-ui)" };
const serifFont = { fontFamily: "var(--font-serif)" };

const fieldClass =
  "w-full resize-y rounded border px-3 py-2.5 text-[15px] leading-relaxed outline-none transition-colors focus:border-[var(--sc-accent)] focus:ring-2 focus:ring-[var(--sc-accent)]/20";

const fieldStyle = {
  ...uiFont,
  background: "var(--sc-panel)",
  borderColor: "var(--sc-rule)",
  color: "var(--sc-ink)",
};

type SketchIntakeFormProps = {
  submitting: boolean;
  error: string | null;
  onSubmit: (intake: SketchIntake) => void;
};

const QUESTIONS: Array<{
  key: keyof Omit<SketchIntake, "primary_passage" | "outline_form">;
  label: string;
  hint: string;
  rows: number;
}> = [
  {
    key: "ache",
    label: "The ache",
    hint: "What is broken in the person listening that this text speaks to?",
    rows: 3,
  },
  {
    key: "big_idea",
    label: "The big idea",
    hint: "The one sentence they should still carry on Tuesday.",
    rows: 2,
  },
  {
    key: "gospel_turn",
    label: "The gospel turn",
    hint: "Where the sermon stops being advice and becomes good news.",
    rows: 3,
  },
  {
    key: "points",
    label: "The points",
    hint: "Your points, and whether each comes out of the passage.",
    rows: 4,
  },
  {
    key: "one_person",
    label: "The one thing",
    hint: "The one concrete change you want someone to do, think, or believe differently on Monday.",
    rows: 3,
  },
  {
    key: "ending",
    label: "The last ninety seconds",
    hint: "How the sermon actually lands.",
    rows: 3,
  },
];

export function SketchIntakeForm({
  submitting,
  error,
  onSubmit,
}: SketchIntakeFormProps) {
  const [primaryPassage, setPrimaryPassage] = useState("");
  const [outlineForm, setOutlineForm] = useState<OutlineForm>("manuscript");
  const [ache, setAche] = useState("");
  const [bigIdea, setBigIdea] = useState("");
  const [gospelTurn, setGospelTurn] = useState("");
  const [points, setPoints] = useState("");
  const [onePerson, setOnePerson] = useState("");
  const [ending, setEnding] = useState("");

  const values: Record<string, string> = {
    ache,
    big_idea: bigIdea,
    gospel_turn: gospelTurn,
    points,
    one_person: onePerson,
    ending,
  };

  const setters: Record<string, (v: string) => void> = {
    ache: setAche,
    big_idea: setBigIdea,
    gospel_turn: setGospelTurn,
    points: setPoints,
    one_person: setOnePerson,
    ending: setEnding,
  };

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    onSubmit({
      primary_passage: primaryPassage.trim(),
      outline_form: outlineForm,
      ache: ache.trim(),
      big_idea: bigIdea.trim(),
      gospel_turn: gospelTurn.trim(),
      points: points.trim(),
      one_person: onePerson.trim(),
      ending: ending.trim(),
    });
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-[640px]">
      <header className="mb-8">
        <div
          className="mb-3 text-[11px] font-semibold tracking-[0.18em] uppercase"
          style={{ ...uiFont, color: "var(--sc-accent)" }}
        >
          The Sketch
        </div>
        <h1
          className="mb-2 text-[30px] font-semibold leading-tight tracking-tight"
          style={{ ...serifFont, color: "var(--sc-ink)" }}
        >
          A read on your sermon before you build it out.
        </h1>
        <p
          className="text-[15px] leading-relaxed"
          style={{ ...uiFont, color: "var(--sc-ink-soft)" }}
        >
          Insight into the core of your sermon, whether you preach from an
          outline or build it into a manuscript.
        </p>
      </header>

      <div className="mb-6">
        <label
          htmlFor="sketch-passage"
          className="mb-1.5 block text-[13px] font-semibold"
          style={{ ...uiFont, color: "var(--sc-ink)" }}
        >
          The passage
        </label>
        <input
          id="sketch-passage"
          className={fieldClass}
          style={fieldStyle}
          value={primaryPassage}
          onChange={(e) => setPrimaryPassage(e.target.value)}
          placeholder="Romans 8:31-39"
          disabled={submitting}
        />
      </div>

      <fieldset className="mb-8">
        <legend
          className="mb-2 text-[13px] font-semibold"
          style={{ ...uiFont, color: "var(--sc-ink)" }}
        >
          Outline form
        </legend>
        <div className="flex flex-col gap-2" style={uiFont}>
          <label className="flex items-start gap-2 text-[14px] leading-snug">
            <input
              type="radio"
              name="outline_form"
              value="manuscript"
              checked={outlineForm === "manuscript"}
              onChange={() => setOutlineForm("manuscript")}
              disabled={submitting}
              className="mt-1"
            />
            <span>I&apos;m still heading toward a manuscript</span>
          </label>
          <label className="flex items-start gap-2 text-[14px] leading-snug">
            <input
              type="radio"
              name="outline_form"
              value="outline"
              checked={outlineForm === "outline"}
              onChange={() => setOutlineForm("outline")}
              disabled={submitting}
              className="mt-1"
            />
            <span>This is the outline I&apos;ll preach from</span>
          </label>
        </div>
      </fieldset>

      <div className="flex flex-col gap-6">
        {QUESTIONS.map((q) => (
          <div key={q.key}>
            <label
              htmlFor={`sketch-${q.key}`}
              className="mb-1 block text-[13px] font-semibold"
              style={{ ...uiFont, color: "var(--sc-ink)" }}
            >
              {q.label}
            </label>
            <p
              className="mb-2 text-[13px] leading-snug"
              style={{ ...uiFont, color: "var(--sc-ink-soft)" }}
            >
              {q.hint}
            </p>
            <textarea
              id={`sketch-${q.key}`}
              className={fieldClass}
              style={fieldStyle}
              rows={q.rows}
              required
              value={values[q.key]}
              onChange={(e) => setters[q.key](e.target.value)}
              disabled={submitting}
            />
          </div>
        ))}
      </div>

      {error ? (
        <p
          className="mt-6 rounded border px-4 py-3 text-[14px]"
          style={{
            ...uiFont,
            color: "var(--sc-error)",
            background: "var(--sc-error-bg)",
            borderColor: "var(--sc-error)",
          }}
          role="alert"
        >
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={submitting}
        className="mt-8 w-full rounded border px-4 py-3 text-[14px] font-semibold tracking-wide transition-opacity disabled:opacity-60"
        style={{
          ...uiFont,
          background: "var(--sc-ink)",
          color: "var(--sc-bg)",
          borderColor: "var(--sc-ink)",
          cursor: submitting ? "wait" : "pointer",
        }}
      >
        {submitting ? "Reading your six answers…" : "Get The Sketch"}
      </button>
    </form>
  );
}
