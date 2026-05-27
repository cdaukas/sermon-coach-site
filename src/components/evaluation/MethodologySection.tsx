import type { EvaluationResultStrict } from "@/lib/evaluation/schema";
import {
  CATEGORY_MAX_POINTS,
  categorySubtotal,
  deriveLetterFromWeighted,
  diagnosticGap,
  formatScoreBandStrict,
} from "@/lib/evaluation/schema";
import { serifFont, uiFont } from "./shared";

const GRADING_BANDS = [
  {
    letter: "A",
    range: "47–55",
    band: "Exemplary",
    meaning: "Multiple criteria scored 5s. Worth studying or sharing.",
  },
  {
    letter: "B",
    range: "39–46",
    band: "Strong",
    meaning: "Most criteria scored 4s. Doing the work well.",
  },
  {
    letter: "C",
    range: "30–38",
    band: "Faithful",
    meaning: "Most criteria scored 3s. Faithfully doing the work.",
  },
  {
    letter: "D",
    range: "22–29",
    band: "Needs Improvement",
    meaning: "Multiple criteria scored 2s. Real gaps to address.",
  },
  {
    letter: "F",
    range: "<22",
    band: "Significant Concerns",
    meaning: "Multiple criteria scored 1s. Address before preaching again.",
  },
] as const;

type MethodologySectionProps = {
  scoring: EvaluationResultStrict["scoring"];
  categories: EvaluationResultStrict["categories"];
};

function methodologyGapNote(simple: number, weighted: number): string {
  const gap = diagnosticGap(simple, weighted);
  if (gap === 0) {
    return "Simple and weighted composites match — load-bearing criteria (FCF, gospel clarity, application) scored in line with the rest.";
  }
  if (gap > 0) {
    return `Weighted exceeds simple by ${gap} point${gap === 1 ? "" : "s"} — load-bearing criteria outperformed supporting ones.`;
  }
  return `Weighted trails simple by ${Math.abs(gap)} point${Math.abs(gap) === 1 ? "" : "s"} — supporting criteria outscored load-bearing ones.`;
}

export function MethodologySection({ scoring, categories }: MethodologySectionProps) {
  const currentLetter = deriveLetterFromWeighted(scoring.composite_weighted);
  const gap = diagnosticGap(scoring.composite_simple, scoring.composite_weighted);

  return (
    <details
      className="group mt-14 border-t-[3px]"
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
            className="mt-1.5 shrink-0 text-[12px] leading-none transition-transform group-open:rotate-90"
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
              Methodology · Show Your Work
            </h2>
            <p
              className="mt-2 text-[10px] tracking-[0.1em] uppercase"
              style={{ ...uiFont, color: "var(--sc-ink-soft)" }}
            >
              Grading bands · score calculation
            </p>
          </div>
        </div>
      </summary>

      <div className="border-t px-6 pb-9 pt-2 md:px-9" style={{ borderColor: "var(--sc-rule)" }}>
        <h3
          className="mb-3 text-lg font-normal"
          style={{ ...serifFont, color: "var(--sc-ink)" }}
        >
          Grading Bands
        </h3>
        <p
          className="mb-5 text-[14px] leading-relaxed"
          style={{ ...serifFont, color: "var(--sc-ink-soft)" }}
        >
          Weighted score of <strong>{scoring.composite_weighted}</strong>/55 places this sermon in{" "}
          <strong>{formatScoreBandStrict(scoring)}</strong>.
        </p>

        <div className="-mx-2 mb-8 overflow-x-auto">
          <table className="w-full min-w-[520px] border-collapse text-[13px]">
            <thead>
              <tr style={{ ...uiFont, color: "var(--sc-ink)" }}>
                {["Letter", "Range", "Band", "What it means"].map((col) => (
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
                const isCurrent =
                  band.letter === currentLetter && band.band === scoring.band;
                return (
                  <tr
                    key={band.letter}
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
                      {band.letter}
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
                      {band.band}
                      {isCurrent ? " ← this sermon" : ""}
                    </td>
                    <td
                      className="border-b px-3 py-2.5"
                      style={{ borderColor: "var(--sc-rule)" }}
                    >
                      {band.meaning}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <h3
          className="mb-4 text-lg font-normal"
          style={{ ...serifFont, color: "var(--sc-ink)" }}
        >
          How this sermon was scored
        </h3>
        <div
          className="mb-6 grid grid-cols-1 gap-6 rounded border px-6 py-6 md:grid-cols-2"
          style={{
            borderColor: "var(--sc-rule)",
            background: "var(--sc-cream-tint)",
          }}
        >
          <div>
            <p className="text-[40px] leading-none" style={{ ...serifFont, color: "var(--sc-ink)" }}>
              {scoring.composite_simple}/55
            </p>
            <p
              className="mt-1 text-[11px] font-semibold uppercase tracking-[0.08em]"
              style={{ ...uiFont, color: "var(--sc-ink-soft)" }}
            >
              Composite (Simple)
            </p>
          </div>
          <div>
            <p className="text-[40px] leading-none" style={{ ...serifFont, color: "var(--sc-ink)" }}>
              {scoring.composite_weighted}/55
            </p>
            <p
              className="mt-1 text-[11px] font-semibold uppercase tracking-[0.08em]"
              style={{ ...uiFont, color: "var(--sc-ink-soft)" }}
            >
              Composite (Weighted)
            </p>
          </div>
        </div>
        <p
          className="mb-6 text-[14px] leading-relaxed"
          style={{ ...serifFont, color: "var(--sc-ink-soft)" }}
        >
          {methodologyGapNote(scoring.composite_simple, scoring.composite_weighted)}
        </p>
        <p
          className="mb-4 text-[13px]"
          style={{ ...uiFont, color: "var(--sc-ink-soft)" }}
        >
          Diagnostic gap (weighted − simple):{" "}
          <strong style={{ color: "var(--sc-ink)" }}>
            {gap > 0 ? "+" : ""}
            {gap}
          </strong>
          {" · "}
          Raw total: {scoring.raw_total}/{scoring.raw_max}
        </p>

        <table className="w-full max-w-md border-collapse text-[13px]">
          <tbody>
            {categories.map((row) => {
              const subtotal = categorySubtotal(row.criteria);
              const max = CATEGORY_MAX_POINTS[row.number] ?? subtotal;
              return (
                <tr key={row.id} style={{ ...serifFont, color: "var(--sc-ink)" }}>
                  <td className="border-b py-2 pr-4" style={{ borderColor: "var(--sc-rule)" }}>
                    {row.name}
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
      </div>
    </details>
  );
}
