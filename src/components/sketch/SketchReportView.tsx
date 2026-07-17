"use client";

import type { ReactNode } from "react";
import {
  SKETCH_AREA_LABELS,
  SKETCH_FIELDS,
  SKETCH_STATUS_LABELS,
  type SketchIntake,
  type SketchStatus,
  type SketchStatusMap,
} from "@/lib/sketch/types";

const serifFont = { fontFamily: "var(--font-serif)" };
const uiFont = { fontFamily: "var(--font-ui)" };

const PILL_STYLE: Record<
  SketchStatus,
  { color: string; background: string; border: string }
> = {
  solid: {
    color: "var(--sc-olive)",
    background: "var(--sc-olive-soft)",
    border: "var(--sc-olive)",
  },
  thin: {
    color: "var(--sc-gold)",
    background: "var(--sc-gold-soft)",
    border: "var(--sc-gold)",
  },
  seam: {
    color: "var(--sc-rust)",
    background: "var(--sc-rust-soft)",
    border: "var(--sc-rust)",
  },
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
    if (m.index > last) {
      parts.push(text.slice(last, m.index));
    }
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

function renderProseBlocks(markdown: string): ReactNode {
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

    const heading = line.match(/^\*\*(.+?)\*\*$/);
    if (heading) {
      const title = heading[1];
      if (
        title.startsWith("THE ONE THING TO FIND") ||
        title.startsWith("THE ONE THING TO PRESS") ||
        title === "WHAT'S SOLID" ||
        title.startsWith("TWO SMALLER THINGS") ||
        title === "CLOSING LINE"
      ) {
        blocks.push(
          <h2
            key={key++}
            className="mt-10 mb-4 text-[22px] font-semibold tracking-tight"
            style={{ ...serifFont, color: "var(--sc-ink)" }}
          >
            {title.replace(/\s*—\s*.*$/, "")}
          </h2>,
        );
        i += 1;
        continue;
      }

      // Bold card lead-in for WHAT'S SOLID / smaller things
      blocks.push(
        <p
          key={key++}
          className="mt-5 mb-2 text-[17px] font-semibold leading-snug"
          style={{ ...serifFont, color: "var(--sc-ink)" }}
        >
          {title}
        </p>,
      );
      i += 1;
      continue;
    }

    if (/^THE QUESTION HE MUST ANSWER/i.test(line)) {
      const question = line.replace(/^THE QUESTION HE MUST ANSWER:?\s*/i, "");
      const rest: string[] = question ? [question] : [];
      i += 1;
      while (i < lines.length && lines[i].trim()) {
        rest.push(lines[i].trim());
        i += 1;
      }
      blocks.push(
        <aside
          key={key++}
          className="my-6 rounded border-l-4 px-5 py-4"
          style={{
            borderLeftColor: "var(--sc-gold)",
            background: "var(--sc-gold-soft)",
            borderTop: "1px solid var(--sc-rule)",
            borderRight: "1px solid var(--sc-rule)",
            borderBottom: "1px solid var(--sc-rule)",
          }}
        >
          <div
            className="mb-2 text-[11px] font-semibold tracking-[0.14em] uppercase"
            style={{ ...uiFont, color: "var(--sc-gold)" }}
          >
            The question to settle
          </div>
          <p
            className="text-[16px] leading-relaxed"
            style={{ ...serifFont, color: "var(--sc-ink)" }}
          >
            {inlineMarkdown(rest.join(" "))}
          </p>
        </aside>,
      );
      continue;
    }

    // Closing line heuristic: short italic-ish closing paragraphs near end
    const para: string[] = [line];
    i += 1;
    while (i < lines.length && lines[i].trim() && !lines[i].trim().startsWith("**") && !/^THE QUESTION HE MUST ANSWER/i.test(lines[i].trim())) {
      para.push(lines[i].trim());
      i += 1;
    }

    const text = para.join(" ");
    const isClosing =
      text.startsWith("This is a pre-read") ||
      text.startsWith("If the outline is what you'll preach from");

    blocks.push(
      <p
        key={key++}
        className={`mb-4 text-[16px] leading-[1.7] ${isClosing ? "italic mt-8" : ""}`}
        style={{
          ...serifFont,
          color: isClosing ? "var(--sc-ink-soft)" : "var(--sc-ink)",
        }}
      >
        {inlineMarkdown(text)}
      </p>,
    );
  }

  return blocks;
}

function StatusPill({ status }: { status: SketchStatus }) {
  const style = PILL_STYLE[status];
  return (
    <span
      className="inline-flex items-center rounded-sm px-2.5 py-1 text-[12px] font-semibold tracking-wide"
      style={{
        ...uiFont,
        color: style.color,
        background: style.background,
        border: `1px solid ${style.border}`,
      }}
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
  const workingIdea =
    intake.big_idea.trim().length > 90
      ? `${intake.big_idea.trim().slice(0, 87)}…`
      : intake.big_idea.trim();

  return (
    <article className="mx-auto max-w-[720px]">
      <header className="mb-8 border-b pb-6" style={{ borderColor: "var(--sc-rule)" }}>
        <div
          className="mb-3 text-[11px] font-semibold tracking-[0.18em] uppercase"
          style={{ ...uiFont, color: "var(--sc-accent)" }}
        >
          The Sermon Coach · The Sketch
        </div>
        <h1
          className="mb-2 text-[32px] font-semibold leading-tight tracking-tight"
          style={{ ...serifFont, color: "var(--sc-ink)" }}
        >
          Here&apos;s what your sermon is about, before you build it.
        </h1>
        <p
          className="mb-1 text-[15px] leading-relaxed"
          style={{ ...uiFont, color: "var(--sc-ink-soft)" }}
        >
          a read on your sermon before you build it
        </p>
        <p
          className="text-[15px] leading-relaxed"
          style={{ ...uiFont, color: "var(--sc-ink-soft)" }}
        >
          A reflected read of your six answers. Not a score, a mirror.
        </p>
      </header>

      <dl
        className="mb-4 grid gap-3 text-[13px] sm:grid-cols-3"
        style={{ ...uiFont, color: "var(--sc-ink-mid)" }}
      >
        <div>
          <dt className="mb-1 font-semibold tracking-wide uppercase text-[11px]" style={{ color: "var(--sc-ink-soft)" }}>
            Text
          </dt>
          <dd>{intake.primary_passage.trim() || "Not given"}</dd>
        </div>
        <div>
          <dt className="mb-1 font-semibold tracking-wide uppercase text-[11px]" style={{ color: "var(--sc-ink-soft)" }}>
            Working idea
          </dt>
          <dd>{workingIdea || "Not given"}</dd>
        </div>
        <div>
          <dt className="mb-1 font-semibold tracking-wide uppercase text-[11px]" style={{ color: "var(--sc-ink-soft)" }}>
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
        This read works from what you told us in the six answers. It is a mirror
        of the sermon you are making, not a grade and not a substitute for the
        full evaluation.
      </p>

      {hasStatus ? (
        <section className="mb-10">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <h2
              className="text-[18px] font-semibold tracking-tight"
              style={{ ...serifFont, color: "var(--sc-ink)" }}
            >
              At a glance
            </h2>
            <div className="flex flex-wrap gap-3 text-[12px]" style={uiFont}>
              {(["solid", "thin", "seam"] as const).map((s) => (
                <span key={s} className="inline-flex items-center gap-1.5">
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-sm"
                    style={{ background: PILL_STYLE[s].color }}
                    aria-hidden
                  />
                  {SKETCH_STATUS_LABELS[s]}
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

      <section>{renderProseBlocks(read)}</section>

      <footer
        className="mt-12 border-t pt-6 text-[13px] leading-relaxed"
        style={{ ...uiFont, borderColor: "var(--sc-rule)", color: "var(--sc-ink-soft)" }}
      >
        <p className="mb-2">
          The Sermon Coach · The Sketch · a reflection on your sermon in
          progress, not a graded evaluation.
        </p>
        <p className="mb-6">
          The Sketch reflects the answers you provided. It is not a substitute
          for the full evaluation.
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
