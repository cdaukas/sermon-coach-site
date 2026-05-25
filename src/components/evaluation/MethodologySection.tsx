import type { EvaluationResult } from "@/lib/evaluation/schema";
import { formatScoreBand } from "@/lib/evaluation/schema";
import { serifFont, uiFont } from "./shared";

const GRADING_BANDS = [
  { letter: "A", range: "85–100", band: "Exemplary", meaning: "Multiple 5s. Worth studying." },
  { letter: "B", range: "70–84", band: "Strong", meaning: "Most 4s. Doing the work well." },
  { letter: "C", range: "55–69", band: "Faithful", meaning: "Most 3s. Faithfully doing the work." },
  { letter: "D", range: "40–54", band: "Needs Improvement", meaning: "Multiple 2s. Real gaps." },
  { letter: "F", range: "<40", band: "Significant Concerns", meaning: "Multiple 1s." },
] as const;

type MethodologySectionProps = {
  scoring: EvaluationResult["scoring"];
  categories: EvaluationResult["categories"];
  methodologyNote: NonNullable<EvaluationResult["methodology_note"]>;
};

export function MethodologySection({
  scoring,
  categories,
  methodologyNote,
}: MethodologySectionProps) {
  return (
    <section
      className="mt-14 border-t-[3px] px-6 py-9 md:px-9"
      style={{
        background: "var(--sc-panel)",
        borderColor: "var(--sc-ink)",
        boxShadow: "var(--sc-shadow)",
      }}
    >
      <p
        className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em]"
        style={{ ...uiFont, color: "var(--sc-ink-soft)" }}
      >
        Methodology · Show Your Work
      </p>
      <h2
        className="mb-6 text-[28px] font-normal"
        style={{ ...serifFont, color: "var(--sc-ink)" }}
      >
        What the score means &amp; how it was calculated
      </h2>

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
        Weighted score of <strong>{scoring.composite_weighted}</strong> places this sermon in{" "}
        <strong>{formatScoreBand(scoring)}</strong>.
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
                band.letter === scoring.letter && band.band === scoring.band;
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
            {scoring.composite_simple}/100
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
            {scoring.composite_weighted}/100
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
        {methodologyNote.diagnostic_summary}
      </p>
      <p
        className="mb-4 text-[13px]"
        style={{ ...uiFont, color: "var(--sc-ink-soft)" }}
      >
        Diagnostic gap (weighted − simple):{" "}
        <strong style={{ color: "var(--sc-ink)" }}>
          {scoring.diagnostic_gap > 0 ? "+" : ""}
          {scoring.diagnostic_gap}
        </strong>
        {" · "}
        Raw total: {scoring.raw_total}/{scoring.raw_max}
      </p>

      <table className="w-full max-w-md border-collapse text-[13px]">
        <tbody>
          {categories.map((row) => (
            <tr key={row.id} style={{ ...serifFont, color: "var(--sc-ink)" }}>
              <td className="border-b py-2 pr-4" style={{ borderColor: "var(--sc-rule)" }}>
                {row.name}
              </td>
              <td
                className="border-b py-2 text-right font-medium"
                style={{ borderColor: "var(--sc-rule)" }}
              >
                {row.subtotal} / {row.max}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
