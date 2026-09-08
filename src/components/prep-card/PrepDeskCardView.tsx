import {
  formatPrepCountCaption,
  formatPrepDenominatorNote,
  PREP_CARD_REVERENCE,
  PREP_MEASURE_COPY,
} from "@/lib/prep-card/copy";
import type { PrepCardSnapshot, PrepRankedMeasure } from "@/lib/prep-card/types";
import { serifFont, uiFont } from "@/components/evaluation/shared";

type PrepDeskCardViewProps = {
  snapshot: PrepCardSnapshot;
};

function SectionHead({
  title,
  tag,
}: {
  title: string;
  tag: string;
}) {
  return (
    <div className="prep-card-section-head">
      <h2 style={{ ...serifFont, color: "var(--sc-ink)" }}>{title}</h2>
      <span style={{ ...uiFont, color: "var(--sc-accent)" }}>{tag}</span>
    </div>
  );
}

function StrengthEntry({
  row,
  sampleSize,
}: {
  row: PrepRankedMeasure;
  sampleSize: number;
}) {
  const copy = PREP_MEASURE_COPY[row.id];
  const denominatorNote = formatPrepDenominatorNote(
    row.eligible,
    sampleSize,
    row.id,
  );
  return (
    <article className="prep-card-entry mb-6 last:mb-0">
      <h3
        className="mb-1.5 text-[20px] font-normal leading-snug"
        style={{ ...serifFont, color: "var(--sc-ink)" }}
      >
        {copy.strengthHeadline}
      </h3>
      <p
        className="max-w-[52ch] text-[15px] leading-relaxed"
        style={{ ...serifFont, color: "var(--sc-ink-soft)" }}
      >
        {copy.strengthLine}
      </p>
      <p
        className="mt-2 text-[15px]"
        style={{ ...serifFont, color: "var(--sc-ink)" }}
      >
        <strong style={{ fontWeight: 600 }}>
          {formatPrepCountCaption(row.hits, row.eligible, row.id)}
        </strong>
        {denominatorNote ? (
          <span style={{ color: "var(--sc-ink-soft)" }}>
            {" "}
            {denominatorNote}
          </span>
        ) : null}
      </p>
    </article>
  );
}

function FocusEntry({
  row,
  index,
  sampleSize,
}: {
  row: PrepRankedMeasure;
  index: number;
  sampleSize: number;
}) {
  const copy = PREP_MEASURE_COPY[row.id];
  const denominatorNote = formatPrepDenominatorNote(
    row.eligible,
    sampleSize,
    row.id,
  );
  return (
    <article className="prep-card-focus-entry prep-card-entry mb-7 last:mb-0">
      <div className="prep-card-focus-grid">
        <div
          className="prep-card-focus-num"
          style={{ ...serifFont, color: "var(--sc-accent)" }}
          aria-hidden="true"
        >
          {index + 1}
        </div>
        <div>
          <h3
            className="mb-1.5 text-[20px] font-normal leading-snug"
            style={{ ...serifFont, color: "var(--sc-ink)" }}
          >
            {copy.focusHeadline ?? copy.strengthHeadline}
          </h3>
          <p
            className="max-w-[52ch] text-[15px] leading-relaxed"
            style={{ ...serifFont, color: "var(--sc-ink-soft)" }}
          >
            {copy.focusLine ?? copy.strengthLine}
          </p>
          <p
            className="mt-2 text-[15px]"
            style={{ ...serifFont, color: "var(--sc-ink)" }}
          >
            <strong style={{ fontWeight: 600 }}>
              {formatPrepCountCaption(row.hits, row.eligible, row.id)}
            </strong>
            {denominatorNote ? (
              <span style={{ color: "var(--sc-ink-soft)" }}>
                {" "}
                {denominatorNote}
              </span>
            ) : null}
          </p>
          {copy.ask ? (
            <div
              className="mt-3 px-4 py-3"
              style={{ background: "var(--sc-gold-soft)" }}
            >
              <p
                className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.12em]"
                style={{ ...uiFont, color: "var(--sc-accent)" }}
              >
                Growth question {index + 1}
              </p>
              <p
                className="m-0 text-[16px] italic leading-snug"
                style={{ ...serifFont, color: "var(--sc-ink)" }}
              >
                {copy.ask}
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}

/**
 * One-page desk prep card: claim, line, count — no quotes, rewrites,
 * or interpretation paragraphs.
 */
export function PrepDeskCardView({ snapshot }: PrepDeskCardViewProps) {
  const generated = new Date(snapshot.generatedAt);
  const dateLabel = generated.toLocaleDateString("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const focusTag =
    snapshot.focus.length === 1
      ? "One, this quarter"
      : snapshot.focus.length === 2
        ? "Two, this quarter"
        : snapshot.focus.length >= 3
          ? "Three, this quarter"
          : "This quarter";

  return (
    <article
      className="prep-card-sheet mx-auto max-w-[680px] border px-8 py-12 md:px-[60px] md:py-14"
      style={{
        background: "var(--sc-panel)",
        borderColor: "var(--sc-rule)",
        boxShadow: "var(--sc-shadow)",
      }}
    >
      <p
        className="mb-6 text-[20px]"
        style={{ ...serifFont, color: "var(--sc-ink)" }}
      >
        The <span style={{ color: "var(--sc-accent)" }}>Sermon Coach</span>
        <sup
          className="text-[9px]"
          style={{ color: "var(--sc-ink-soft)", verticalAlign: "super" }}
        >
          ™
        </sup>
      </p>

      <h1
        className="mb-10 text-[36px] font-normal leading-tight tracking-tight md:text-[40px]"
        style={{ ...serifFont, color: "var(--sc-ink)" }}
      >
        Before you preach
      </h1>

      <section className="mb-10">
        <SectionHead title="What is working" tag="Don't trade it" />
        {snapshot.strengths.length === 0 ? (
          <p style={{ ...serifFont, color: "var(--sc-ink-soft)" }}>
            {snapshot.strengthsNote ??
              "Not enough measured signal yet for a strength column."}
          </p>
        ) : (
          snapshot.strengths.map((row) => (
            <StrengthEntry
              key={`s-${row.id}`}
              row={row}
              sampleSize={snapshot.sampleSize}
            />
          ))
        )}
      </section>

      <section className="mb-10">
        <SectionHead title="Where to focus" tag={focusTag} />
        {snapshot.focus.length === 0 ? (
          <p style={{ ...serifFont, color: "var(--sc-ink-soft)" }}>
            Not enough measured signal yet for a focus column.
          </p>
        ) : (
          snapshot.focus.map((row, index) => (
            <FocusEntry
              key={`f-${row.id}`}
              row={row}
              index={index}
              sampleSize={snapshot.sampleSize}
            />
          ))
        )}
      </section>

      <section
        className="mb-10 px-7 py-6"
        style={{ background: "var(--sc-gold-soft)" }}
      >
        <p
          className="mb-3 text-[11.5px] font-semibold uppercase tracking-[0.13em]"
          style={{ ...uiFont, color: "var(--sc-accent)" }}
        >
          {PREP_CARD_REVERENCE.label}
        </p>
        <p
          className="max-w-[52ch] text-[18px] leading-snug"
          style={{ ...serifFont, color: "var(--sc-ink)" }}
        >
          {PREP_CARD_REVERENCE.body}
        </p>
        <p
          className="mt-2.5 text-[16px]"
          style={{ ...serifFont, color: "var(--sc-ink-soft)" }}
        >
          {PREP_CARD_REVERENCE.cut}
        </p>
      </section>

      <footer
        className="border-t pt-4 text-[12.5px]"
        style={{
          ...uiFont,
          borderColor: "var(--sc-rule)",
          color: "var(--sc-ink-soft)",
        }}
      >
        Built from {snapshot.sampleSize} sermons, {dateLabel}.
      </footer>
    </article>
  );
}
