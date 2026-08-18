import {
  formatDisplayScoreBare,
  formatDisplayScoreWithDenom,
} from "@/lib/evaluation/display-score";
import {
  displayCategoryName,
  displayScoreBand,
  evaluationReportCopy,
  type OutputLanguage,
} from "@/lib/evaluation/output-language";
import type { EvaluationResultStrict } from "@/lib/evaluation/schema";
import {
  CATEGORY_MAX_POINTS,
  categorySubtotal,
} from "@/lib/evaluation/schema";
import { serifFont, uiFont } from "./shared";

const GRADING_BANDS = [
  {
    range: "47–55",
    rangeDisplay: "8.5–10.0",
    band: "Exemplary",
    meaning: "Multiple criteria scored 5s. Worth studying or sharing.",
  },
  {
    range: "39–46",
    rangeDisplay: "7.1–8.4",
    band: "Strong",
    meaning: "Most criteria scored 4s. Doing the work well.",
  },
  {
    range: "30–38",
    rangeDisplay: "5.5–6.9",
    band: "Faithful",
    meaning: "Most criteria scored 3s. Faithfully doing the work.",
  },
  {
    range: "22–29",
    rangeDisplay: "4.0–5.4",
    band: "Needs Improvement",
    meaning: "Multiple criteria scored 2s. Real gaps to address.",
  },
  {
    range: "<22",
    rangeDisplay: "<4.0",
    band: "Significant Concerns",
    meaning: "Multiple criteria scored 1s. Address before preaching again.",
  },
] as const;

type MethodologySectionProps = {
  scoring: EvaluationResultStrict["scoring"];
  categories: EvaluationResultStrict["categories"];
  outputLanguage?: OutputLanguage;
};

export function MethodologySection({
  scoring,
  categories,
  outputLanguage = "en",
}: MethodologySectionProps) {
  const copy = evaluationReportCopy(outputLanguage);
  return (
    <details
      className="evaluation-methodology group mt-14 border-t-[3px]"
      style={{
        background: "var(--sc-panel)",
        borderColor: "var(--sc-ink)",
        boxShadow: "var(--sc-shadow)",
      }}
    >
      <summary
        className="cursor-pointer list-none px-6 py-6 transition-colors hover:bg-[var(--sc-cream-tint)] md:px-9 [&::-webkit-details-marker]:hidden"
      >
        <div className="flex gap-3">
          <span
            className="evaluation-disclosure-chevron mt-1.5 shrink-0 text-[12px] leading-none transition-transform group-open:rotate-90"
            style={{ color: "var(--sc-ink-soft)" }}
            aria-hidden
          >
            ▸
          </span>
          <div className="min-w-0 flex-1">
            <h2
              className="text-[26px] font-normal leading-snug"
              style={{ ...serifFont, color: "var(--sc-ink)" }}
            >
              {copy.methodologyTitle}
            </h2>
            <p
              className="mt-2 text-[10px] tracking-[0.1em] uppercase"
              style={{ ...uiFont, color: "var(--sc-ink-soft)" }}
            >
              {copy.methodologySubtitle}
            </p>
          </div>
        </div>
      </summary>

      <div className="border-t px-6 pb-9 pt-2 md:px-9" style={{ borderColor: "var(--sc-rule)" }}>
        <h3
          className="mb-4 text-lg font-normal"
          style={{ ...serifFont, color: "var(--sc-ink)" }}
        >
          {copy.howScored}
        </h3>
        <div
          className="mb-6 rounded border px-6 py-6"
          style={{
            borderColor: "var(--sc-rule)",
            background: "var(--sc-cream-tint)",
          }}
        >
          <p className="text-[40px] leading-none" style={{ ...serifFont, color: "var(--sc-ink)" }}>
            {formatDisplayScoreWithDenom(scoring.composite_weighted)}
          </p>
          <p
            className="mt-1 text-[11px] font-semibold uppercase tracking-[0.08em]"
            style={{ ...uiFont, color: "var(--sc-ink-soft)" }}
          >
            {copy.compositeScore}
          </p>
          <p
            className="mt-4 text-[13px] leading-relaxed"
            style={{ ...serifFont, color: "var(--sc-ink-soft)" }}
          >
            {outputLanguage === "es" ? (
              copy.internalWeighted(scoring.composite_weighted)
            ) : (
              <>
                Internal weighted score: <strong>{scoring.composite_weighted}/55</strong>
              </>
            )}
          </p>
          <p
            className="mt-2 text-[12px] leading-relaxed"
            style={{ ...serifFont, color: "var(--sc-ink-soft)" }}
          >
            {outputLanguage === "es" ? (
              copy.displayConversion(
                scoring.composite_weighted,
                formatDisplayScoreBare(scoring.composite_weighted),
              )
            ) : (
              <>
                Base-10 display converts weighted /55 ÷ 5.5 ({scoring.composite_weighted} ÷ 5.5 ={" "}
                {formatDisplayScoreBare(scoring.composite_weighted)}).
              </>
            )}
          </p>
        </div>

        <table className="mb-8 w-full max-w-md border-collapse text-[13px]">
          <tbody>
            {categories.map((row) => {
              const subtotal = categorySubtotal(row.criteria);
              const max = CATEGORY_MAX_POINTS[row.number] ?? subtotal;
              return (
                <tr key={row.id} style={{ ...serifFont, color: "var(--sc-ink)" }}>
                  <td className="border-b py-2 pr-4" style={{ borderColor: "var(--sc-rule)" }}>
                    {displayCategoryName(row.id, row.name, outputLanguage)}
                  </td>
                  <td
                    className="border-b py-2 text-right font-medium"
                    style={{ borderColor: "var(--sc-rule)" }}
                  >
                    {subtotal} / {max}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <blockquote
          className="mb-8 border-l-2 py-1 pl-5 text-[14px] leading-relaxed"
          style={{
            ...serifFont,
            borderColor: "var(--sc-accent)",
            color: "var(--sc-ink-soft)",
          }}
        >
          <strong style={{ color: "var(--sc-ink)" }}>{copy.whyDoubleWeightLead}</strong>{" "}
          {copy.whyDoubleWeightBody}
        </blockquote>

        <h3
          className="mb-3 text-lg font-normal"
          style={{ ...serifFont, color: "var(--sc-ink)" }}
        >
          {copy.gradingBands}
        </h3>
        <p
          className="mb-5 text-[14px] leading-relaxed"
          style={{ ...serifFont, color: "var(--sc-ink-soft)" }}
        >
          {outputLanguage === "es" ? (
            copy.placesThisSermon(
              formatDisplayScoreWithDenom(scoring.composite_weighted),
              displayScoreBand(scoring.band, outputLanguage),
              scoring.composite_weighted,
            )
          ) : (
            <>
              Display score of{" "}
              <strong>{formatDisplayScoreWithDenom(scoring.composite_weighted)}</strong> places this
              sermon in <strong>{scoring.band}</strong>. Band thresholds use the internal weighted
              /55 score ({scoring.composite_weighted}/55).
            </>
          )}
        </p>

        <div className="-mx-2 overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-[13px]">
            <thead>
              <tr style={{ ...uiFont, color: "var(--sc-ink)" }}>
                {copy.bandTableHeaders.map((col) => (
                  <th
                    key={col}
                    className="border-b px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.06em]"
                    style={{
                      borderColor: "var(--sc-rule)",
                      background: "var(--sc-cream-tint)",
                    }}
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {GRADING_BANDS.map((band) => {
                const isCurrent = band.band === scoring.band;
                return (
                  <tr
                    key={band.band}
                    style={{
                      ...serifFont,
                      color: "var(--sc-ink)",
                      background: isCurrent ? "var(--sc-accent-pale)" : undefined,
                    }}
                  >
                    <td
                      className="border-b px-3 py-2.5 font-semibold"
                      style={{ borderColor: "var(--sc-rule)" }}
                    >
                      {displayScoreBand(band.band, outputLanguage)}
                      {isCurrent ? copy.thisSermon : ""}
                    </td>
                    <td
                      className="border-b px-3 py-2.5"
                      style={{ borderColor: "var(--sc-rule)" }}
                    >
                      {band.range}
                    </td>
                    <td
                      className="border-b px-3 py-2.5"
                      style={{ borderColor: "var(--sc-rule)" }}
                    >
                      {band.rangeDisplay}
                    </td>
                    <td
                      className="border-b px-3 py-2.5"
                      style={{ borderColor: "var(--sc-rule)" }}
                    >
                      {copy.gradingBandMeanings[band.band] ?? band.meaning}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </details>
  );
}
