"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import {
  SKETCH_AREA_LABELS,
  SKETCH_FIELDS,
  SKETCH_STATUS_LABELS,
  type SketchIntake,
  type SketchStatus,
  type SketchStatusMap,
} from "@/lib/sketch/types";

/** Matches bare HE/YOU/TO SETTLE, optional ** wrapping, colon in/out of bold, inline or split question. */
const QUESTION_LINE_RE =
  /^(?:\*\*)?\s*THE QUESTION (?:(?:HE|YOU) MUST ANSWER|TO SETTLE):?\s*(?:\*\*)?:?\s*(.*)$/i;

function matchQuestionLine(line: string): string | null {
  const m = line.match(QUESTION_LINE_RE);
  return m ? (m[1] ?? "").trim() : null;
}

/** Section / closing markers that end a question block mid-run. */
function isQuestionBlockBoundary(line: string): boolean {
  if (
    line.startsWith("This is a pre-read") ||
    line.startsWith("If the outline is what you'll preach from")
  ) {
    return true;
  }
  const heading = line.match(/^\*\*(.+?)\*\*$/);
  if (!heading) return false;
  const raw = heading[1].replace(/\s*—\s*.*$/, "").trim().toUpperCase();
  if (raw.startsWith("CLOSING LINE")) return true;
  return Object.keys(SECTION_TITLES).some((k) => raw.startsWith(k));
}

const serifFont = { fontFamily: "var(--font-serif)" };
const uiFont = { fontFamily: "var(--font-ui)" };

const PILL_STYLE: Record<
  SketchStatus,
  { color: string; background: string; swatch: string }
> = {
  solid: {
    color: "var(--sc-olive)",
    background: "rgba(74,90,56,0.10)",
    swatch: "var(--sc-olive)",
  },
  thin: {
    color: "var(--sc-gold)",
    background: "rgba(138,102,36,0.10)",
    swatch: "var(--sc-accent-soft)",
  },
  seam: {
    color: "var(--sc-rust)",
    background: "rgba(143,74,50,0.10)",
    swatch: "var(--sc-rust)",
  },
};

const LEGEND: Array<{ status: SketchStatus; text: string }> = [
  { status: "solid", text: "Solid, it's here and holding" },
  { status: "thin", text: "Thin, present but light" },
  { status: "seam", text: "In tension, something to resolve" },
];

const SECTION_TITLES: Record<string, string> = {
  "WHAT'S SOLID": "What's solid",
  "THE ONE THING TO FIND": "The one thing to find",
  "THE ONE THING TO PRESS": "The one thing to press",
  "TWO SMALLER THINGS": "Two smaller things",
  "ONE SMALLER THING": "One smaller thing",
  "A SMALLER THING": "One smaller thing",
};

type SketchReportViewProps = {
  intake: SketchIntake;
  read: string;
  status: SketchStatusMap;
  onStartAnother: () => void;
};

function inlineMarkdown(text: string): ReactNode[] {
  const parts: ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|\*[^*]+\*)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let key = 0;

  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    const token = m[0];
    if (token.startsWith("**")) {
      parts.push(<strong key={key++}>{token.slice(2, -2)}</strong>);
    } else {
      parts.push(<em key={key++}>{token.slice(1, -1)}</em>);
    }
    last = m.index + token.length;
  }

  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

function SectionTitle({ title, muted }: { title: string; muted?: string }) {
  return (
    <h2
      className="mt-10 mb-3 flex items-baseline gap-3 border-b pb-2 text-[20px] font-semibold tracking-tight"
      style={{
        ...serifFont,
        color: "var(--sc-ink)",
        borderColor: "var(--sc-rule)",
      }}
    >
      {title}
      {muted ? (
        <span
          className="text-[11px] font-semibold tracking-[0.14em] uppercase"
          style={{ ...uiFont, color: "var(--sc-ink-soft)" }}
        >
          {muted}
        </span>
      ) : null}
    </h2>
  );
}

function CardHeader({ children }: { children: ReactNode }) {
  return (
    <p
      className="mt-4 mb-1.5 text-[12px] font-semibold tracking-[0.12em] uppercase"
      style={{ ...uiFont, color: "var(--sc-gold)" }}
    >
      {children}
    </p>
  );
}

function Body({ children }: { children: ReactNode }) {
  return (
    <p
      className="mb-3 text-[16px] leading-[1.7]"
      style={{ ...serifFont, color: "var(--sc-ink)" }}
    >
      {children}
    </p>
  );
}

function renderProseBlocks(markdown: string, solidCount: number): ReactNode {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const blocks: ReactNode[] = [];
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i].trim();
    if (!line) {
      i += 1;
      continue;
    }

    // Question callout before heading check — a bold-only label line would
    // otherwise be swallowed as a card header.
    const questionInline = matchQuestionLine(line);
    if (questionInline !== null) {
      const rest: string[] = questionInline ? [questionInline] : [];
      i += 1;

      // Skip blanks after a lone label so the question body can start.
      if (rest.length === 0) {
        while (i < lines.length && !lines[i].trim()) i += 1;
      }

      // Pull every following line until blank or next block (section /
      // closing). Seam mode often spans a bolded first clause + a normal
      // continuation across two or more lines.
      while (i < lines.length) {
        const next = lines[i].trim();
        if (!next) break;
        if (matchQuestionLine(next) !== null) break;
        if (isQuestionBlockBoundary(next)) break;
        rest.push(next);
        i += 1;
      }

      // Strip ** markers so bolded clauses render as body text in the box,
      // not gold all-caps CardHeader styling.
      const questionText = rest
        .map((chunk) => chunk.replace(/\*\*/g, "").trim())
        .filter(Boolean)
        .join(" ")
        .trim();

      blocks.push(
        <aside
          key={key++}
          className="my-6 rounded-r px-5 py-4"
          style={{
            borderLeft: "3px solid var(--sc-rule)",
            background: "var(--sc-bg)",
          }}
        >
          <div
            className="mb-1.5 text-[11px] font-semibold tracking-[0.14em] uppercase"
            style={{ ...uiFont, color: "var(--sc-ink-soft)" }}
          >
            The question to settle
          </div>
          <p
            className="text-[16px] leading-relaxed"
            style={{ ...serifFont, color: "var(--sc-ink)" }}
          >
            {inlineMarkdown(questionText)}
          </p>
        </aside>,
      );
      continue;
    }

    const heading = line.match(/^\*\*(.+?)\*\*$/);
    if (heading) {
      const raw = heading[1].replace(/\s*—\s*.*$/, "").trim();
      const sectionKey = Object.keys(SECTION_TITLES).find((k) =>
        raw.toUpperCase().startsWith(k),
      );

      if (sectionKey) {
        if (
          sectionKey === "WHAT'S SOLID" ||
          sectionKey.startsWith("THE ONE THING")
        ) {
          const muted =
            sectionKey === "WHAT'S SOLID"
              ? solidCount > 0
                ? `${solidCount} of six`
                : undefined
              : "before Sunday";
          blocks.push(
            <SectionTitle
              key={key++}
              title={SECTION_TITLES[sectionKey]}
              muted={muted}
            />,
          );
        } else {
          blocks.push(
            <SectionTitle key={key++} title={SECTION_TITLES[sectionKey]} />,
          );
        }
        i += 1;
        continue;
      }

      if (raw.toUpperCase().startsWith("CLOSING LINE")) {
        // No heading for the closing line; the italic paragraph follows.
        i += 1;
        continue;
      }

      // Card header (bold lead-in) — may carry inline prose after an em-dash.
      const full = heading[1];
      const dash = full.indexOf(" — ");
      if (dash !== -1) {
        blocks.push(<CardHeader key={key++}>{full.slice(0, dash)}</CardHeader>);
        blocks.push(
          <Body key={key++}>{inlineMarkdown(full.slice(dash + 3))}</Body>,
        );
      } else {
        blocks.push(<CardHeader key={key++}>{full}</CardHeader>);
      }
      i += 1;
      continue;
    }

    const para: string[] = [line];
    i += 1;
    while (
      i < lines.length &&
      lines[i].trim() &&
      !lines[i].trim().startsWith("**") &&
      matchQuestionLine(lines[i].trim()) === null
    ) {
      para.push(lines[i].trim());
      i += 1;
    }

    const text = para.join(" ");
    const isClosing =
      text.startsWith("This is a pre-read") ||
      text.startsWith("If the outline is what you'll preach from");

    if (isClosing) {
      blocks.push(
        <p
          key={key++}
          className="mt-8 mb-4 text-[16px] italic leading-[1.7]"
          style={{ ...serifFont, color: "var(--sc-ink-soft)" }}
        >
          {inlineMarkdown(text)}
        </p>,
      );
    } else {
      blocks.push(<Body key={key++}>{inlineMarkdown(text)}</Body>);
    }
  }

  return blocks;
}

function StatusPill({ status }: { status: SketchStatus }) {
  const style = PILL_STYLE[status];
  return (
    <span
      className="inline-flex items-center rounded-sm px-2.5 py-1 text-[12px] font-semibold tracking-wide"
      style={{ ...uiFont, color: style.color, background: style.background }}
    >
      {SKETCH_STATUS_LABELS[status]}
    </span>
  );
}

export function SketchReportView({
  intake,
  read,
  status,
  onStartAnother,
}: SketchReportViewProps) {
  const hasStatus = SKETCH_FIELDS.some((f) => status[f]);
  const solidCount = SKETCH_FIELDS.filter((f) => status[f] === "solid").length;
  const workingIdea =
    intake.big_idea.trim().length > 90
      ? `${intake.big_idea.trim().slice(0, 87)}…`
      : intake.big_idea.trim();

  return (
    <article className="mx-auto max-w-[720px]">
      <header className="mb-8">
        <div
          className="mb-3 text-[11px] font-semibold tracking-[0.18em] uppercase"
          style={{ ...uiFont, color: "var(--sc-gold)" }}
        >
          The Sermon Coach · The Sketch
        </div>
        <h1
          className="mb-2 text-[32px] font-semibold leading-tight tracking-tight"
          style={{ ...serifFont, color: "var(--sc-ink)" }}
        >
          Here&apos;s how your sermon is aligned.
        </h1>
        <p
          className="text-[15px] leading-relaxed"
          style={{ ...uiFont, color: "var(--sc-ink-soft)" }}
        >
          No score. A read of how your sermon&apos;s core elements line up.
        </p>
      </header>

      <dl
        className="mb-4 grid gap-3 border-y py-4 text-[13px] sm:grid-cols-3"
        style={{
          ...uiFont,
          color: "var(--sc-ink-mid)",
          borderColor: "var(--sc-rule)",
        }}
      >
        <div>
          <dt
            className="mb-1 text-[11px] font-semibold tracking-[0.14em] uppercase"
            style={{ color: "var(--sc-gold)" }}
          >
            Text
          </dt>
          <dd>{intake.primary_passage.trim() || "Not given"}</dd>
        </div>
        <div>
          <dt
            className="mb-1 text-[11px] font-semibold tracking-[0.14em] uppercase"
            style={{ color: "var(--sc-gold)" }}
          >
            Working idea
          </dt>
          <dd>{workingIdea || "Not given"}</dd>
        </div>
        <div>
          <dt
            className="mb-1 text-[11px] font-semibold tracking-[0.14em] uppercase"
            style={{ color: "var(--sc-gold)" }}
          >
            Preaching
          </dt>
          <dd>
            {intake.outline_form === "outline"
              ? "From the outline"
              : "Toward a manuscript"}
          </dd>
        </div>
      </dl>

      <p
        className="mb-8 text-[13px] leading-relaxed"
        style={{ ...uiFont, color: "var(--sc-ink-soft)" }}
      >
        This read works from what you told us, not a finished manuscript. Where
        something looks thin or missing, it means we didn&apos;t see it in your
        six answers. If it&apos;s already in the sermon, you&apos;ll know where.
      </p>

      {hasStatus ? (
        <section className="mb-10">
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-3">
            <h2
              className="text-[20px] font-semibold tracking-tight"
              style={{ ...serifFont, color: "var(--sc-ink)" }}
            >
              At a glance
            </h2>
            <div
              className="flex flex-wrap gap-3 text-[12px]"
              style={{ ...uiFont, color: "var(--sc-ink-soft)" }}
            >
              {LEGEND.map(({ status: s, text }) => (
                <span key={s} className="inline-flex items-center gap-1.5">
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-sm"
                    style={{ background: PILL_STYLE[s].swatch }}
                    aria-hidden
                  />
                  {text}
                </span>
              ))}
            </div>
          </div>

          <table className="w-full border-collapse text-left">
            <tbody>
              {SKETCH_FIELDS.map((field) => {
                const value = status[field];
                return (
                  <tr
                    key={field}
                    className="border-t"
                    style={{ borderColor: "var(--sc-rule)" }}
                  >
                    <td
                      className="py-3 pr-4 text-[15px]"
                      style={{ ...serifFont, color: "var(--sc-ink)" }}
                    >
                      {SKETCH_AREA_LABELS[field]}
                    </td>
                    <td className="py-3 text-right">
                      {value ? <StatusPill status={value} /> : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      ) : null}

      <section>{renderProseBlocks(read, solidCount)}</section>

      <footer
        className="mt-12 border-t pt-6"
        style={{ ...uiFont, borderColor: "var(--sc-rule)" }}
      >
        <Link
          href="/start"
          className="mb-6 inline-block rounded border px-5 py-3 text-[14px] font-semibold tracking-wide no-underline transition-opacity hover:opacity-90"
          style={{
            background: "var(--sc-ink)",
            borderColor: "var(--sc-ink)",
            color: "var(--sc-bg)",
          }}
        >
          Ready for the full evaluation? Run it on your finished outline,
          manuscript, or transcript.
        </Link>
        <p
          className="mb-6 text-[13px] leading-relaxed"
          style={{ color: "var(--sc-ink-soft)" }}
        >
          The Sermon Coach · The Sketch · a reflection on your sermon in
          progress, not a graded evaluation.
        </p>
        <button
          type="button"
          onClick={onStartAnother}
          className="rounded border px-4 py-2 text-[13px] font-medium transition-colors hover:border-[var(--sc-ink)]"
          style={{
            ...uiFont,
            background: "var(--sc-panel)",
            borderColor: "var(--sc-rule)",
            color: "var(--sc-ink)",
            cursor: "pointer",
          }}
        >
          Start another Sketch
        </button>
      </footer>
    </article>
  );
}
