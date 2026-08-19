import { SermonManuscript } from "@/components/dashboard/SermonManuscript";
import {
  evaluationReportCopy,
  type OutputLanguage,
} from "@/lib/evaluation/output-language";

const uiFont = { fontFamily: "var(--font-ui)" };
const serifFont = { fontFamily: "var(--font-serif)" };

type ReportManuscriptDisclosureProps = {
  content: string;
  outputLanguage?: OutputLanguage;
};

/** Collapsed "View manuscript" at the bottom of the evaluation report. */
export function ReportManuscriptDisclosure({
  content,
  outputLanguage = "en",
}: ReportManuscriptDisclosureProps) {
  const copy = evaluationReportCopy(outputLanguage);
  return (
    <details className="group screen-only mt-12">
      <summary
        className="flex cursor-pointer items-start gap-3 list-none [&::-webkit-details-marker]:hidden"
        style={{ ...uiFont, color: "var(--sc-ink)" }}
      >
        <span
          aria-hidden="true"
          className="mt-[7px] inline-block h-0 w-0 shrink-0 border-y-[5px] border-l-[7px] border-y-transparent border-l-[#a67c2e] transition-transform group-open:rotate-90"
        />
        <span
          className="text-[17px] font-semibold"
          style={serifFont}
        >
          {copy.viewManuscript}
        </span>
      </summary>
      <div className="mt-4">
        <SermonManuscript content={content} />
      </div>
    </details>
  );
}
