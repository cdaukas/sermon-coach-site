import Link from "next/link";
import { Fragment } from "react";
import type { MelodicLineAndBigIdea } from "@/lib/evaluation/schema";
import {
  evaluationReportCopy,
  type OutputLanguage,
} from "@/lib/evaluation/output-language";
import { serifFont, uiFont } from "./shared";

export const MELODIC_TREATMENTS = [1, 2, 3] as const;
export type MelodicTreatment = (typeof MELODIC_TREATMENTS)[number];
export type MelodicTreatmentView = MelodicTreatment | "all";

const TREATMENT_KICKERS: Record<MelodicTreatment, string> = {
  1: "1 · Lightest",
  2: "2 · Quiet",
  3: "3 · Marked",
};

export function parseMelodicTreatment(value: unknown): MelodicTreatmentView {
  if (value === "2") return 2;
  if (value === "3") return 3;
  if (value === "all") return "all";
  return 1;
}

export function melodicTreatmentHref(
  path: string,
  current: {
    view?: string;
    for?: string;
    variant?: string;
    preacher?: string;
  },
  ml: MelodicTreatmentView,
): string {
  const params = new URLSearchParams();
  if (current.view) params.set("view", current.view);
  if (current.for) params.set("for", current.for);
  if (current.variant) params.set("variant", current.variant);
  if (current.preacher) params.set("preacher", current.preacher);
  if (ml !== 1) params.set("ml", String(ml));
  const query = params.toString();
  return query ? `${path}?${query}` : path;
}

type MelodicSwitcherHrefs = Record<MelodicTreatmentView, string>;

type MelodicLineSectionProps = {
  block: MelodicLineAndBigIdea;
  outputLanguage?: OutputLanguage;
  treatment?: MelodicTreatmentView;
  switcherHrefs?: MelodicSwitcherHrefs;
};

export function MelodicLineSection({
  block,
  outputLanguage = "en",
  treatment = 1,
  switcherHrefs,
}: MelodicLineSectionProps) {
  const copy = evaluationReportCopy(outputLanguage);
  const treatments: MelodicTreatment[] =
    treatment === "all" ? [1, 2, 3] : [treatment];
  const showAll = treatment === "all";

  const switcher = switcherHrefs ? (
    <MelodicTreatmentSwitcher current={treatment} hrefs={switcherHrefs} />
  ) : null;
  const blocks = treatments.map((id) => (
    <MelodicLineBlock
      key={id}
      block={block}
      copy={copy}
      treatment={id}
      kicker={showAll ? TREATMENT_KICKERS[id] : null}
      compareExtra={showAll && id !== 1}
    />
  ));

  if (showAll) {
    return (
      <div className="mb-14 space-y-12">
        {switcher}
        {blocks}
      </div>
    );
  }

  return (
    <>
      {switcher}
      {blocks}
    </>
  );
}

function MelodicTreatmentSwitcher({
  current,
  hrefs,
}: {
  current: MelodicTreatmentView;
  hrefs: MelodicSwitcherHrefs;
}) {
  const options: { id: MelodicTreatmentView; label: string }[] = [
    { id: 1, label: "1 lightest" },
    { id: 2, label: "2 quiet" },
    { id: 3, label: "3 marked" },
    { id: "all", label: "all three" },
  ];

  return (
    <nav
      className="evaluation-melodic-switcher screen-only mb-6 flex flex-wrap items-baseline gap-x-3 gap-y-1"
      aria-label="Melodic line block treatments"
    >
      <span
        className="text-[10px] font-medium uppercase tracking-[0.12em]"
        style={{ ...uiFont, color: "var(--sc-ink-soft)" }}
      >
        Compare
      </span>
      {options.map((option) => {
        const active = option.id === current;
        return (
          <Link
            key={String(option.id)}
            href={hrefs[option.id]}
            className="text-[12px] no-underline"
            style={{
              ...uiFont,
              color: active ? "var(--sc-ink)" : "var(--sc-ink-soft)",
              fontWeight: active ? 600 : 400,
              textDecoration: active ? "underline" : "none",
              textUnderlineOffset: "0.18em",
            }}
          >
            {option.label}
          </Link>
        );
      })}
    </nav>
  );
}

function MelodicLineBlock({
  block,
  copy,
  treatment,
  kicker,
  compareExtra,
}: {
  block: MelodicLineAndBigIdea;
  copy: ReturnType<typeof evaluationReportCopy>;
  treatment: MelodicTreatment;
  kicker: string | null;
  compareExtra: boolean;
}) {
  const rows = [
    { label: copy.melodicLineBook, body: block.book },
    { label: copy.melodicLinePassage, body: block.passage },
    { label: copy.melodicLineReading, body: block.melodic_line },
  ];

  const stacked = treatment === 1;
  const goldTitle = treatment === 3;

  return (
    <section
      className={`evaluation-melodic-block${compareExtra ? " evaluation-melodic-compare-extra" : ""} ${
        treatment === 1 ? "mb-14" : treatment === 2 ? "mb-12" : "mb-10"
      }`}
      data-melodic-treatment={treatment}
      aria-label={copy.melodicLineTitle}
    >
      {kicker ? (
        <p
          className="evaluation-melodic-treatment-kicker screen-only mb-3 text-[10px] font-medium uppercase tracking-[0.12em]"
          style={{ ...uiFont, color: "var(--sc-ink-soft)" }}
        >
          {kicker}
        </p>
      ) : null}
      <p
        className={`evaluation-melodic-title text-[10px] font-medium uppercase tracking-[0.12em] ${
          goldTitle ? "mb-2" : "mb-7 opacity-80"
        }`}
        style={{
          ...uiFont,
          color: goldTitle ? "var(--sc-accent)" : "var(--sc-ink-soft)",
        }}
      >
        {copy.melodicLineTitle}
      </p>
      {treatment === 3 ? (
        <span
          className="evaluation-melodic-tick mb-6 block h-px w-8"
          style={{ background: "var(--sc-accent)" }}
          aria-hidden
        />
      ) : null}
      {block.reading_source === "preacher" ? (
        <p
          className="mb-6 text-[12px] leading-relaxed"
          style={{ ...uiFont, color: "var(--sc-ink-soft)", fontStyle: "italic" }}
        >
          {copy.melodicLinePreacherNote}
        </p>
      ) : null}
      <div
        className={
          stacked
            ? "evaluation-melodic-rows max-w-[60ch] space-y-7"
            : "evaluation-melodic-rows grid max-w-[68ch] grid-cols-1 gap-x-8 gap-y-6 md:grid-cols-[7.5rem_1fr]"
        }
      >
        {rows.map((row) =>
          stacked ? (
            <div key={row.label} className="evaluation-melodic-row">
              <MelodicLineLabel stacked>{row.label}</MelodicLineLabel>
              <MelodicLineValue>{row.body}</MelodicLineValue>
            </div>
          ) : (
            <Fragment key={row.label}>
              <MelodicLineLabel stacked={false}>{row.label}</MelodicLineLabel>
              <MelodicLineValue>{row.body}</MelodicLineValue>
            </Fragment>
          ),
        )}
      </div>
    </section>
  );
}

function MelodicLineLabel({
  stacked,
  children,
}: {
  stacked: boolean;
  children: string;
}) {
  return (
    <p
      className={`evaluation-melodic-label text-[10px] font-normal uppercase tracking-[0.10em] ${
        stacked ? "mb-1.5" : "pt-[0.35em]"
      }`}
      style={{ ...uiFont, color: "var(--sc-ink-soft)", opacity: 0.72 }}
    >
      {children}
    </p>
  );
}

function MelodicLineValue({ children }: { children: string }) {
  return (
    <p
      className="evaluation-melodic-value text-[16px] leading-[1.7]"
      style={{ ...serifFont, color: "var(--sc-ink)" }}
    >
      {children}
    </p>
  );
}
