import type { MelodicLineAndBigIdea } from "@/lib/evaluation/schema";
import {
  evaluationReportCopy,
  type OutputLanguage,
} from "@/lib/evaluation/output-language";
import { serifFont, uiFont } from "./shared";

type MelodicLineSectionProps = {
  block: MelodicLineAndBigIdea;
  outputLanguage?: OutputLanguage;
};

export function MelodicLineSection({
  block,
  outputLanguage = "en",
}: MelodicLineSectionProps) {
  const copy = evaluationReportCopy(outputLanguage);
  const preacherNote =
    block.reading_source === "preacher" ? copy.melodicLinePreacherNote : null;

  return (
    <section
      className="evaluation-melodic-block mb-10"
      aria-label={copy.melodicLineTitle}
    >
      <p
        className="evaluation-melodic-title mb-2 text-[10px] font-medium uppercase tracking-[0.12em]"
        style={{
          ...uiFont,
          color: "var(--sc-accent)",
        }}
      >
        {copy.melodicLineTitle}
      </p>
      <span
        className="evaluation-melodic-tick mb-6 block h-px w-8"
        style={{ background: "var(--sc-accent)" }}
        aria-hidden
      />
      <div className="evaluation-melodic-rows grid max-w-[60ch] grid-cols-[max-content_1fr] items-baseline gap-x-3 gap-y-5">
        <div className="col-span-2 grid grid-cols-subgrid gap-y-1.5">
          <div className="col-span-2">
            <MelodicLineLabel gloss={copy.melodicLineReadingGloss}>
              {copy.melodicLineReading}
            </MelodicLineLabel>
          </div>
          <div className="col-start-2">
            <MelodicLineValue>{block.melodic_line}</MelodicLineValue>
            {preacherNote ? (
              <MelodicPreacherNote>{preacherNote}</MelodicPreacherNote>
            ) : null}
          </div>
        </div>
        <MelodicLineLabel>{copy.melodicLinePassage}</MelodicLineLabel>
        <MelodicLineValue>{block.passage}</MelodicLineValue>
      </div>
    </section>
  );
}

function MelodicLineLabel({
  gloss,
  children,
}: {
  gloss?: string;
  children: string;
}) {
  return (
    <p className="evaluation-melodic-label-wrap m-0" style={uiFont}>
      <span
        className="evaluation-melodic-label text-[10px] font-normal uppercase tracking-[0.10em]"
        style={{ color: "var(--sc-ink-soft)", opacity: 0.72 }}
      >
        {children}
      </span>
      {gloss ? (
        <span
          className="evaluation-melodic-gloss ml-[0.35em] text-[9px] font-normal tracking-normal"
          style={{ color: "var(--sc-ink-soft)", opacity: 0.55 }}
        >
          ({gloss})
        </span>
      ) : null}
    </p>
  );
}

function MelodicLineValue({ children }: { children: string }) {
  return (
    <p
      className="evaluation-melodic-value m-0 text-[14px] leading-[1.65]"
      style={{ ...serifFont, color: "var(--sc-ink)" }}
    >
      {children}
    </p>
  );
}

function MelodicPreacherNote({ children }: { children: string }) {
  return (
    <p
      className="evaluation-melodic-preacher-note mt-1.5 text-[12px] leading-relaxed"
      style={{ ...uiFont, color: "var(--sc-ink-soft)", fontStyle: "italic" }}
    >
      {children}
    </p>
  );
}
