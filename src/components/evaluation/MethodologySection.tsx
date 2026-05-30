import type { EvaluationResultStrict } from "@/lib/evaluation/schema";
import {
  CATEGORY_MAX_POINTS,
  categorySubtotal,
  deriveTierFromWeighted,
  formatScoreBandStrict,
} from "@/lib/evaluation/schema";
import { serifFont, uiFont } from "./shared";

const GRADING_BANDS = [
  {
    tier: 5,
    range: "47–55",
    band: "Exemplary",
    meaning: "Multiple criteria scored 5s. Worth studying or sharing.",
  },
  {
    tier: 4,
    range: "39–46",
    band: "Strong",
    meaning: "Most criteria scored 4s. Doing the work well.",
  },
  {
    tier: 3,
    range: "30–38",
    band: "Faithful",
    meaning: "Most criteria scored 3s. Faithfully doing the work.",
  },
  {
    tier: 2,
    range: "22–29",
    band: "Needs Improvement",
    meaning: "Multiple criteria scored 2s. Real gaps to address.",
  },
  {
    tier: 1,
    range: "<22",
    band: "Significant Concerns",
    meaning: "Multiple criteria scored 1s. Address before preaching again.",
  },
] as const;

type MethodologySectionProps = {
  scoring: EvaluationResultStrict["scoring"];
  categories: EvaluationResultStrict["categories"];
};

export function MethodologySection({ scoring, categories }: MethodologySectionProps) {
  const currentTier = deriveTierFromWeighted(scoring.composite_weighted);

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
                {["Tier", "Range", "Band", "What it means"].map((col) => (
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
                  band.tier === currentTier && band.band === scoring.band;
                return (
                  <tr
                    key={band.tier}
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
                      {band.tier}
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

        <blockquote
          className="mb-8 border-l-2 py-1 pl-5 text-[14px] leading-relaxed"
          style={{
            ...serifFont,
            borderColor: "var(--sc-accent)",
            color: "var(--sc-ink-soft)",
          }}
        >
          <strong style={{ color: "var(--sc-ink)" }}>Why some criteria count twice.</strong>{" "}
          Three of the eleven criteria carry double weight in the composite score: Fallen Condition
          Focus, Gospel Clarity, and Application. These are the load-bearing tests of whether a
          sermon actually preaches the gospel to real people — not just whether it handles the text
          well, but whether it brings that text to bear on human fallenness, makes the good news
          unmistakable, and lands it in the hearer&apos;s actual life. A sermon can score
          respectably everywhere else and still miss the point if these three are weak, so the math
          reflects what the pulpit reflects.
        </blockquote>

        <h3
          className="mb-4 text-lg font-normal"
          style={{ ...serifFont, color: "var(--sc-ink)" }}
        >
          How this sermon was scored
        </h3>
        <div
          className="mb-6 rounded border px-6 py-6"
          style={{
            borderColor: "var(--sc-rule)",
            background: "var(--sc-cream-tint)",
          }}
        >
          <p className="text-[40px] leading-none" style={{ ...serifFont, color: "var(--sc-ink)" }}>
            {scoring.composite_weighted}/55
          </p>
          <p
            className="mt-1 text-[11px] font-semibold uppercase tracking-[0.08em]"
            style={{ ...uiFont, color: "var(--sc-ink-soft)" }}
          >
            Composite score
          </p>
        </div>

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
