import {
  formatPrepCountCaption,
  PREP_CARD_REVERENCE,
  PREP_CARD_STANDING_STRENGTH,
  PREP_MEASURE_COPY,
} from "@/lib/prep-card/copy";
import type {
  PrepCardSnapshot,
  PrepFocusExample,
  PrepRankedMeasure,
} from "@/lib/prep-card/types";
import { serifFont, uiFont } from "@/components/evaluation/shared";

type PrepCardViewProps = {
  snapshot: PrepCardSnapshot;
};

function StrengthEntry({ row }: { row: PrepRankedMeasure }) {
  const copy = PREP_MEASURE_COPY[row.id];
  return (
    <article className="prep-card-entry mb-7 last:mb-0">
      <h3
        className="mb-2 text-[22px] font-normal leading-snug"
        style={{ ...serifFont, color: "var(--sc-ink)" }}
      >
        {copy.strengthHeadline}
      </h3>
      <p
        className="max-w-[56ch] text-[15px] leading-relaxed"
        style={{ ...serifFont, color: "var(--sc-ink-soft)" }}
      >
        {copy.strengthLine}
      </p>
      <p
        className="mt-2.5 text-[15px]"
        style={{ ...serifFont, color: "var(--sc-ink)" }}
      >
        <strong style={{ fontWeight: 600 }}>
          {formatPrepCountCaption(row.hits, row.eligible, row.id)}
        </strong>
      </p>
    </article>
  );
}

function FocusEntry({
  row,
  index,
  example,
}: {
  row: PrepRankedMeasure;
  index: number;
  example: PrepFocusExample | undefined;
}) {
  const copy = PREP_MEASURE_COPY[row.id];
  return (
    <article className="prep-card-focus-entry prep-card-entry mb-9 last:mb-0">
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
            className="mb-2 text-[22px] font-normal leading-snug"
            style={{ ...serifFont, color: "var(--sc-ink)" }}
          >
            {copy.focusHeadline ?? copy.strengthHeadline}
          </h3>
          <p
            className="mt-1 text-[15px]"
            style={{ ...serifFont, color: "var(--sc-ink)" }}
          >
            Right now:{" "}
            <strong style={{ fontWeight: 600 }}>
              {formatPrepCountCaption(row.hits, row.eligible, row.id)}
            </strong>
            .
          </p>

          {example ? (
            <div className="prep-card-was-now mt-4">
              <div className="prep-card-was">
                <p
                  className="mb-1 text-[11px] font-semibold uppercase tracking-[0.12em]"
                  style={{ ...uiFont, color: "var(--sc-accent)" }}
                >
                  Was
                </p>
                <blockquote
                  className="m-0 text-[16px] leading-snug"
                  style={{ ...serifFont, color: "var(--sc-ink)" }}
                >
                  “{example.quote}”
                </blockquote>
                <p
                  className="mt-1.5 text-[13px]"
                  style={{ ...serifFont, color: "var(--sc-ink-soft)" }}
                >
                  {example.sermonTitle}
                </p>
              </div>
              {example.rewrite ? (
                <div className="prep-card-now mt-3">
                  <p
                    className="mb-1 text-[11px] font-semibold uppercase tracking-[0.12em]"
                    style={{ ...uiFont, color: "var(--sc-accent)" }}
                  >
                    Now
                  </p>
                  <p
                    className="m-0 text-[16px] leading-snug"
                    style={{ ...serifFont, color: "var(--sc-ink)" }}
                  >
                    {example.rewrite}
                  </p>
                </div>
              ) : null}
            </div>
          ) : null}

          {copy.ask ? (
            <p
              className="mt-4 px-4 py-3 text-[16.5px] italic leading-snug"
              style={{
                ...serifFont,
                background: "var(--sc-gold-soft)",
                color: "var(--sc-ink)",
              }}
            >
              {copy.ask}
            </p>
          ) : null}
        </div>
      </div>
    </article>
  );
}

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

export function PrepCardView({ snapshot }: PrepCardViewProps) {
  const generated = new Date(snapshot.generatedAt);
  const dateLabel = generated.toLocaleDateString("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const manuscriptCount = snapshot.manuscriptCount ?? 0;
  const transcriptCount = snapshot.transcriptCount ?? 0;
  const formatDetail =
    manuscriptCount > 0 && transcriptCount > 0
      ? `${manuscriptCount} manuscripts, ${transcriptCount} transcripts`
      : snapshot.sourceFormat;
  const focusExamples = snapshot.focusExamples ?? [];
  const exampleByMeasure = new Map(
    focusExamples.map((example) => [example.measureId, example] as const),
  );
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
        className="mb-11 text-[20px]"
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
        className="mb-2.5 text-[36px] font-normal leading-tight tracking-tight md:text-[40px]"
        style={{ ...serifFont, color: "var(--sc-ink)" }}
      >
        Before you preach
      </h1>
      <p
        className="mb-6 text-[13.5px]"
        style={{ ...uiFont, color: "var(--sc-ink-soft)" }}
      >
        Built from your last {snapshot.sampleSize} sermons.
      </p>
      <p
        className="mb-11 max-w-[58ch] border-l-2 pl-[18px] text-[14.5px] leading-relaxed"
        style={{
          ...serifFont,
          borderColor: "var(--sc-accent-soft)",
          color: "var(--sc-ink-soft)",
        }}
      >
        {snapshot.poolNote}
      </p>

      <section className="mb-11">
        <SectionHead title="What is working" tag="Don't trade it" />
        {snapshot.strengths.length === 0 ? (
          <p style={{ ...serifFont, color: "var(--sc-ink-soft)" }}>
            Not enough measured signal yet for a strength column.
          </p>
        ) : (
          snapshot.strengths.map((row) => (
            <StrengthEntry key={`s-${row.id}`} row={row} />
          ))
        )}
        <p
          className="mt-6 border-t pt-4 text-[16px]"
          style={{
            ...serifFont,
            borderColor: "var(--sc-rule)",
            color: "var(--sc-ink-soft)",
          }}
        >
          {PREP_CARD_STANDING_STRENGTH}
        </p>
      </section>

      <section className="mb-11">
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
              example={exampleByMeasure.get(row.id)}
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
        className="flex flex-wrap justify-between gap-4 border-t pt-4 text-[12.5px]"
        style={{ ...uiFont, borderColor: "var(--sc-rule)", color: "var(--sc-ink-soft)" }}
      >
        <span>
          Built from {snapshot.sampleSize} sermons, {dateLabel}.
        </span>
        <span>{formatDetail}</span>
      </footer>
    </article>
  );
}
