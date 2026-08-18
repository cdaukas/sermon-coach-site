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

  return (
    <section
      className="evaluation-melodic-block mb-10"
      aria-label={copy.melodicLineTitle}
    >
      <p
        className="mb-4 text-[11px] font-semibold uppercase tracking-[0.14em]"
        style={{ ...uiFont, color: "var(--sc-accent)" }}
      >
        {copy.melodicLineTitle}
      </p>
      {block.reading_source === "preacher" ? (
        <p
          className="mb-4 text-[12px] leading-relaxed"
          style={{ ...uiFont, color: "var(--sc-ink-soft)", fontStyle: "italic" }}
        >
          {copy.melodicLinePreacherNote}
        </p>
      ) : null}
      <div
        className="border-t-[3px] px-6 py-2 md:px-8"
        style={{
          background: "var(--sc-panel)",
          borderColor: "var(--sc-accent)",
          boxShadow: "var(--sc-shadow)",
        }}
      >
        <MelodicLineRow label={copy.melodicLineBook} body={block.book} />
        <MelodicLineRow
          label={copy.melodicLinePassage}
          body={block.passage}
        />
        <MelodicLineRow
          label={copy.melodicLineReading}
          body={block.melodic_line}
          last
        />
      </div>
    </section>
  );
}

function MelodicLineRow({
  label,
  body,
  last = false,
}: {
  label: string;
  body: string;
  last?: boolean;
}) {
  return (
    <div
      className={`grid grid-cols-1 gap-2 py-5 md:grid-cols-[148px_1fr] md:gap-6 ${last ? "" : "border-b"}`}
      style={{ borderColor: "var(--sc-rule)" }}
    >
      <p
        className="text-[11px] font-semibold uppercase tracking-[0.12em]"
        style={{ ...uiFont, color: "var(--sc-ink-soft)" }}
      >
        {label}
      </p>
      <p
        className="text-[16px] leading-[1.7]"
        style={{ ...serifFont, color: "var(--sc-ink)" }}
      >
        {body}
      </p>
    </div>
  );
}
