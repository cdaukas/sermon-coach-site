"use client";

import type {
  CoachingNarrativePresentation,
  CoachingReportPresentation,
  CoachingStrengthPresentation,
} from "@/lib/evaluation/coaching-report-types";
import { EvaluationPrintButtons } from "@/components/evaluation/EvaluationPrintButtons";
import { serifFont, uiFont } from "./shared";

type CoachingReportViewProps = {
  data: CoachingReportPresentation;
  showPrintActions?: boolean;
};

function formatEvaluatedDate(iso: string): string {
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(
    new Date(iso),
  );
}

function SectionHeading({ children }: { children: string }) {
  return (
    <h2
      className="evaluation-section-title mb-7 text-[32px] font-normal tracking-tight md:text-[36px]"
      style={{ ...serifFont, color: "var(--sc-ink)" }}
    >
      {children}
    </h2>
  );
}

function StrengthItem({ strength }: { strength: CoachingStrengthPresentation }) {
  return (
    <article
      className="evaluation-working-card border-t-[3px] px-6 py-6"
      style={{
        background: "var(--sc-panel)",
        borderColor: "var(--sc-accent)",
        boxShadow: "var(--sc-shadow)",
      }}
    >
      <p
        className="mb-3.5 text-[19px] leading-snug"
        style={{ ...serifFont, color: "var(--sc-ink)" }}
      >
        {strength.claim}
      </p>
      <blockquote
        className="mb-3 border-l-2 pl-3 text-[14px] italic leading-normal"
        style={{
          ...serifFont,
          borderColor: "var(--sc-accent)",
          color: "var(--sc-ink-soft)",
        }}
      >
        {strength.quote}
      </blockquote>
      <p className="text-[14px] leading-relaxed" style={{ ...serifFont, color: "var(--sc-ink)" }}>
        {strength.development ?? strength.why}
      </p>
    </article>
  );
}

function CoachingNarrativeSections({
  narrative,
}: {
  narrative: CoachingNarrativePresentation;
}) {
  return (
    <>
      <section className="evaluation-coaching-movement mb-7">
        <SectionHeading>Where It&apos;s Strong</SectionHeading>
        <div className="space-y-5">
          {narrative.lead_with_this.map((strength) => (
            <StrengthItem key={strength.claim} strength={strength} />
          ))}
        </div>
      </section>

      <section className="evaluation-coaching-movement mb-7">
        <SectionHeading>How To Grow</SectionHeading>
        <article
          className="border-t-[3px] px-6 py-6"
          style={{
            background: "var(--sc-panel)",
            borderColor: "var(--sc-amber)",
            boxShadow: "var(--sc-shadow)",
          }}
        >
          <p
            className="mb-4 text-[17px] leading-relaxed"
            style={{ ...serifFont, color: "var(--sc-ink)" }}
          >
            {narrative.how_to_grow.edge}
          </p>
          <p
            className="text-[14px] leading-relaxed"
            style={{ ...serifFont, color: "var(--sc-ink-soft)" }}
          >
            <strong style={{ color: "var(--sc-ink)", fontWeight: 600 }}>
              This week:
            </strong>{" "}
            {narrative.how_to_grow.this_week}
          </p>
        </article>
      </section>

      <section className="evaluation-coaching-movement mb-7">
        <SectionHeading>What It Looks Like</SectionHeading>
        <article
          className="px-6 py-6"
          style={{
            background: "var(--sc-panel)",
            boxShadow: "var(--sc-shadow)",
          }}
        >
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div
              className="border-l-2 px-5 py-4"
              style={{
                background: "var(--sc-cream-tint)",
                borderColor: "var(--sc-red)",
              }}
            >
              <p
                className="mb-2.5 text-[10px] font-semibold uppercase tracking-[0.1em]"
                style={{ ...uiFont, color: "var(--sc-red)" }}
              >
                Before
              </p>
              <p
                className="text-[14px] italic leading-relaxed"
                style={{ ...serifFont, color: "var(--sc-ink)" }}
              >
                {narrative.what_it_looks_like.before}
              </p>
            </div>
            <div
              className="border-l-2 px-5 py-4"
              style={{
                background: "var(--sc-cream-tint)",
                borderColor: "var(--sc-green)",
              }}
            >
              <p
                className="mb-2.5 text-[10px] font-semibold uppercase tracking-[0.1em]"
                style={{ ...uiFont, color: "var(--sc-green)" }}
              >
                After
              </p>
              <p
                className="text-[14px] italic leading-relaxed"
                style={{ ...serifFont, color: "var(--sc-ink)" }}
              >
                {narrative.what_it_looks_like.after}
              </p>
            </div>
          </div>
          <p
            className="mt-5 border-t pt-4 text-[14px] leading-relaxed"
            style={{
              ...serifFont,
              borderColor: "var(--sc-rule)",
              color: "var(--sc-ink-soft)",
            }}
          >
            {narrative.what_it_looks_like.what_changed}
          </p>
        </article>
      </section>
    </>
  );
}

export function CoachingReportView({
  data,
  showPrintActions = true,
}: CoachingReportViewProps) {
  return (
    <article className="evaluation-report">
      <p
        className="evaluation-report-eyebrow mb-3 text-[11px] font-semibold uppercase tracking-[0.12em]"
        style={{ ...uiFont, color: "var(--sc-accent)" }}
      >
        Coaching report
      </p>
      <h1
        className="evaluation-report-title mb-2 text-[36px] font-normal leading-tight tracking-tight md:text-[44px]"
        style={{ ...serifFont, color: "var(--sc-ink)" }}
      >
        {data.sermonTitle}
      </h1>
      {data.scriptureReference ? (
        <p
          className="evaluation-report-scripture mb-6 text-lg italic"
          style={{ ...serifFont, color: "var(--sc-ink-soft)" }}
        >
          {data.scriptureReference}
        </p>
      ) : null}

      <div
        className="evaluation-report-meta mb-10 flex flex-wrap gap-x-6 gap-y-2 border-y py-3 text-[12px]"
        style={{ ...uiFont, borderColor: "var(--sc-rule)", color: "var(--sc-ink-soft)" }}
      >
        <span>
          <strong style={{ color: "var(--sc-ink)" }}>Sermon:</strong> {data.sermonTitle}
        </span>
        {data.preacherName ? (
          <span>
            <strong style={{ color: "var(--sc-ink)" }}>Preacher:</strong> {data.preacherName}
          </span>
        ) : null}
        <span>
          <strong style={{ color: "var(--sc-ink)" }}>Evaluated:</strong>{" "}
          {formatEvaluatedDate(data.evaluatedAt)}
        </span>
        <span>
          <strong style={{ color: "var(--sc-ink)" }}>Mode:</strong> {data.submissionMode}
        </span>
      </div>

      {showPrintActions ? (
        <div className="screen-only -mt-6 mb-10 flex justify-end gap-2">
          <EvaluationPrintButtons />
        </div>
      ) : null}

      <section
        className="evaluation-headline-lockup mb-10 px-8 py-6"
        style={{
          background: "var(--sc-panel)",
          boxShadow: "var(--sc-shadow)",
        }}
      >
        <p className="text-[19px] leading-relaxed" style={{ ...serifFont, color: "var(--sc-ink)" }}>
          This sermon reads as{" "}
          <em style={{ fontStyle: "italic", color: "var(--sc-accent)" }}>{data.overallBand}</em>{" "}
          overall.
        </p>
      </section>

      {data.coachingNarrative ? (
        <CoachingNarrativeSections narrative={data.coachingNarrative} />
      ) : (
        <p
          className="text-[15px] leading-relaxed"
          style={{ ...serifFont, color: "var(--sc-ink-soft)" }}
        >
          The coaching narrative is not available for this evaluation.
        </p>
      )}
    </article>
  );
}
