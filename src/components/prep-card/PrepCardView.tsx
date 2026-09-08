import {
  formatPrepCountCaption,
  formatPrepDenominatorNote,
  PREP_CARD_REVERENCE,
  PREP_CARD_STANDING_STRENGTH,
  PREP_MEASURE_COPY,
  PREP_THEME_QUESTION,
  prepBuiltFromSummary,
  prepInterpretationParagraph,
} from "@/lib/prep-card/copy";
import type {
  PrepCardSnapshot,
  PrepFocusExample,
  PrepRankedMeasure,
  PrepStrengthExample,
} from "@/lib/prep-card/types";
import { serifFont, uiFont } from "@/components/evaluation/shared";
import type { ReactNode } from "react";

type PrepCardViewProps = {
  snapshot: PrepCardSnapshot;
};

function AttributionLabel({
  children,
  className = "mb-1",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p
      className={`${className} text-[11px] font-semibold uppercase tracking-[0.12em]`}
      style={{ ...uiFont, color: "var(--sc-accent)" }}
    >
      {children}
    </p>
  );
}

function InterpretationSlot({
  measureId,
  band,
}: {
  measureId: PrepRankedMeasure["id"];
  band: "high" | "low";
}) {
  const text = prepInterpretationParagraph(measureId, band);
  if (!text) {
    return null;
  }
  return (
    <div className="prep-card-interpretation mt-3">
      <AttributionLabel>Coach</AttributionLabel>
      <p
        className="m-0 max-w-[56ch] text-[15px] leading-relaxed"
        style={{ ...serifFont, color: "var(--sc-ink-soft)" }}
      >
        {text}
      </p>
    </div>
  );
}

function StrengthEvidence({
  example,
  className = "mt-4",
}: {
  example: PrepStrengthExample;
  className?: string;
}) {
  return (
    <div className={`prep-card-strength-evidence ${className}`}>
      {example.kind === "point_heads" && example.heads?.length ? (
        <ul
          className="m-0 list-none space-y-1 border-l-2 pl-[14px] text-[16px] leading-snug"
          style={{
            ...serifFont,
            borderColor: "var(--sc-rule)",
            color: "var(--sc-ink)",
          }}
        >
          {example.heads.map((head) => (
            <li key={head}>{head}</li>
          ))}
        </ul>
      ) : (
        <blockquote
          className="m-0 border-l-2 pl-[14px] text-[16px] leading-snug"
          style={{
            ...serifFont,
            borderColor: "var(--sc-rule)",
            color: "var(--sc-ink)",
          }}
        >
          “{example.quote}”
        </blockquote>
      )}
      <p
        className="mt-1.5 text-[13px]"
        style={{ ...serifFont, color: "var(--sc-ink-soft)" }}
      >
        {example.sermonTitle}
      </p>
    </div>
  );
}

function StrengthEntry({
  row,
  examples,
  sampleSize,
}: {
  row: PrepRankedMeasure;
  examples: PrepStrengthExample[];
  sampleSize: number;
}) {
  const copy = PREP_MEASURE_COPY[row.id];
  const denominatorNote = formatPrepDenominatorNote(
    row.eligible,
    sampleSize,
    row.id,
  );
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
        {denominatorNote ? (
          <span style={{ color: "var(--sc-ink-soft)" }}>
            {" "}
            {denominatorNote}
          </span>
        ) : null}
      </p>
      <InterpretationSlot measureId={row.id} band="high" />
      {examples.length > 0 ? (
        <div className="mt-4">
          <AttributionLabel>Your sermons</AttributionLabel>
          {examples.map((example, exampleIndex) => (
            <StrengthEvidence
              key={`${example.sermonId}-${example.offset}`}
              example={example}
              className={exampleIndex === 0 ? "mt-1" : "mt-4"}
            />
          ))}
        </div>
      ) : null}
    </article>
  );
}

function FocusEntry({
  row,
  index,
  example,
  sampleSize,
}: {
  row: PrepRankedMeasure;
  index: number;
  example: PrepFocusExample | undefined;
  sampleSize: number;
}) {
  const copy = PREP_MEASURE_COPY[row.id];
  const denominatorNote = formatPrepDenominatorNote(
    row.eligible,
    sampleSize,
    row.id,
  );
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
            {denominatorNote ? (
              <span style={{ color: "var(--sc-ink-soft)" }}>
                {" "}
                {denominatorNote}
              </span>
            ) : null}
          </p>

          <InterpretationSlot measureId={row.id} band="low" />

          {example ? (
            <div className="prep-card-was-now mt-4">
              <div className="prep-card-was">
                <AttributionLabel>Was</AttributionLabel>
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
                  <AttributionLabel>Now</AttributionLabel>
                  <p
                    className="m-0 text-[16px] leading-snug"
                    style={{ ...serifFont, color: "var(--sc-ink)" }}
                  >
                    {example.rewrite}
                  </p>
                  <AttributionLabel className="mt-1.5 mb-0">
                    Suggested
                  </AttributionLabel>
                </div>
              ) : null}
              {(example.also?.length ?? 0) > 0 ? (
                <div className="prep-card-also mt-4">
                  <AttributionLabel>The same pattern in your sermons</AttributionLabel>
                  <ul className="m-0 list-none space-y-3 p-0">
                    {example.also.map((alsoRow) => (
                      <li key={`${alsoRow.sermonId}:${alsoRow.offset}`}>
                        <blockquote
                          className="m-0 text-[15px] leading-snug"
                          style={{ ...serifFont, color: "var(--sc-ink)" }}
                        >
                          “{alsoRow.quote}”
                        </blockquote>
                        <p
                          className="mt-1 text-[13px]"
                          style={{
                            ...serifFont,
                            color: "var(--sc-ink-soft)",
                          }}
                        >
                          {alsoRow.sermonTitle}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          ) : null}

          {copy.ask ? (
            <div
              className="mt-4 px-4 py-3"
              style={{ background: "var(--sc-gold-soft)" }}
            >
              <AttributionLabel className="mb-1.5">
                Growth question {index + 1}
              </AttributionLabel>
              <p
                className="m-0 text-[16.5px] italic leading-snug"
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
  const isChristTheme = snapshot.themeId === "christ";
  const isAskTheme =
    snapshot.themeId === "ask" || snapshot.themeId == null;
  const generated = new Date(snapshot.generatedAt);
  const dateLabel = generated.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const manuscriptCount = snapshot.manuscriptCount ?? 0;
  const transcriptCount = snapshot.transcriptCount ?? 0;
  const focusExamples = snapshot.focusExamples ?? [];
  const exampleByMeasure = new Map(
    focusExamples.map((example) => [example.measureId, example] as const),
  );
  const strengthExamples = snapshot.strengthExamples ?? [];
  const strengthExamplesByMeasure = new Map<number, PrepStrengthExample[]>();
  for (const example of strengthExamples) {
    const list = strengthExamplesByMeasure.get(example.measureId) ?? [];
    list.push(example);
    strengthExamplesByMeasure.set(example.measureId, list);
  }
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
        className="mb-2.5 text-[36px] font-normal leading-tight tracking-tight md:text-[40px]"
        style={{ ...serifFont, color: "var(--sc-ink)" }}
      >
        {isChristTheme
          ? "Christ in the sermon"
          : isAskTheme
            ? "The ask"
            : "Before you preach"}
      </h1>
      <p
        className="mb-10 max-w-[42ch] text-[20px] leading-snug"
        style={{ ...serifFont, color: "var(--sc-ink)" }}
      >
        {isChristTheme
          ? PREP_THEME_QUESTION.christ
          : PREP_THEME_QUESTION.ask}
      </p>

      <section className="mb-11">
        <SectionHead title="What is working" tag="Don't trade it" />
        {snapshot.strengths.length === 0 ? (
          <p style={{ ...serifFont, color: "var(--sc-ink-soft)" }}>
            {snapshot.strengthsNote ??
              "Not enough measured signal yet for a strength column."}
          </p>
        ) : (
          <>
            {snapshot.strengths.map((row) => (
              <StrengthEntry
                key={`s-${row.id}`}
                row={row}
                examples={strengthExamplesByMeasure.get(row.id) ?? []}
                sampleSize={snapshot.sampleSize}
              />
            ))}
            {snapshot.strengthsNote ? (
              <p
                className="mt-4 max-w-[56ch] text-[14.5px] leading-relaxed"
                style={{ ...serifFont, color: "var(--sc-ink-soft)" }}
              >
                {snapshot.strengthsNote}
              </p>
            ) : null}
          </>
        )}
        {!isChristTheme ? (
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
        ) : null}
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
              sampleSize={snapshot.sampleSize}
            />
          ))
        )}
      </section>

      {!isChristTheme ? (
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
      ) : null}

      <footer
        className="border-t pt-5"
        style={{ borderColor: "var(--sc-rule)" }}
      >
        <p
          className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.12em]"
          style={{ ...uiFont, color: "var(--sc-accent)" }}
        >
          How this was measured
        </p>
        <div
          className="space-y-2 text-[12.5px] leading-relaxed"
          style={{ ...uiFont, color: "var(--sc-ink-soft)" }}
        >
          <p className="m-0">
            {prepBuiltFromSummary({
              rankedMeasureCount: snapshot.rankedMeasureCount,
              sampleSize: snapshot.sampleSize,
              manuscriptCount,
              transcriptCount,
              dateLabel,
            })}
          </p>
          {snapshot.unmeasuredNote ? (
            <p className="m-0 max-w-[62ch]">{snapshot.unmeasuredNote}</p>
          ) : null}
          {snapshot.genreCaveat ? (
            <p className="m-0 max-w-[62ch]">{snapshot.genreCaveat}</p>
          ) : null}
        </div>
      </footer>
    </article>
  );
}
