import type { EvaluationResult } from "@/lib/evaluation/schema";
import {
  beatBackgroundColor,
  beatHasMismatch,
  serifFont,
  textSupportLabel,
  textSupportTone,
  uiFont,
} from "./shared";

type HeatMapSectionProps = {
  heatMap: NonNullable<EvaluationResult["heat_map"]>;
};

export function HeatMapSection({ heatMap }: HeatMapSectionProps) {
  const totalSeconds = Math.max(
    heatMap.beats.reduce((max, b) => Math.max(max, b.time_end_seconds), 0),
    heatMap.total_minutes * 60,
    1,
  );

  return (
    <section
      className="mb-7 px-6 py-7 md:px-8"
      style={{
        background: "var(--sc-panel)",
        boxShadow: "var(--sc-shadow)",
      }}
    >
      <h2
        className="mb-1.5 text-[22px] font-normal"
        style={{ ...serifFont, color: "var(--sc-ink)" }}
      >
        Heat Map · Emotional Beats
      </h2>
      {heatMap.warning_note ? (
        <p
          className="mb-5 text-[11px] font-semibold uppercase tracking-[0.08em]"
          style={{ ...uiFont, color: "var(--sc-amber)" }}
        >
          {heatMap.warning_note}
        </p>
      ) : null}

      <div className="mb-3 flex h-[60px] overflow-hidden rounded">
        {heatMap.beats.map((beat) => {
          const duration = Math.max(beat.time_end_seconds - beat.time_start_seconds, 1);
          return (
            <div
              key={`${beat.time_display}-${beat.label}`}
              title={beat.label}
              className="relative min-w-[4px] transition-[filter] hover:brightness-110"
              style={{
                flex: duration / totalSeconds,
                background: beatBackgroundColor(beat.register),
              }}
            >
              {beat.text_supports === "mismatch" || beatHasMismatch(beat.register) ? (
                <span
                  className="pointer-events-none absolute inset-0"
                  style={{
                    background:
                      "repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(255,255,255,0.35) 4px, rgba(255,255,255,0.35) 8px)",
                  }}
                />
              ) : null}
            </div>
          );
        })}
      </div>
      <div
        className="mb-5 flex justify-between text-[10px]"
        style={{ ...uiFont, color: "var(--sc-ink-soft)" }}
      >
        <span>0:00</span>
        <span>~{heatMap.total_minutes}:00</span>
      </div>

      <div className="-mx-2 overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-[12px]">
          <thead>
            <tr style={{ ...uiFont, color: "var(--sc-ink)" }}>
              {["Time", "Beat", "Register", "Text supports?", "Notes"].map((col) => (
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
            {heatMap.beats.map((row) => {
              const tone = textSupportTone(row.text_supports);
              return (
                <tr
                  key={`${row.time_display}-${row.label}`}
                  style={{ ...uiFont, color: "var(--sc-ink)" }}
                >
                  <td
                    className="border-b px-3 py-2.5 align-top"
                    style={{ borderColor: "var(--sc-rule)" }}
                  >
                    {row.time_display}
                  </td>
                  <td
                    className="border-b px-3 py-2.5 align-top"
                    style={{ borderColor: "var(--sc-rule)" }}
                  >
                    {row.label}
                  </td>
                  <td
                    className="border-b px-3 py-2.5 align-top capitalize"
                    style={{ borderColor: "var(--sc-rule)" }}
                  >
                    {row.register}
                  </td>
                  <td
                    className="border-b px-3 py-2.5 align-top font-medium"
                    style={{
                      borderColor: "var(--sc-rule)",
                      color:
                        tone === "partial" ? "var(--sc-amber)" : "var(--sc-green)",
                    }}
                  >
                    {textSupportLabel(row.text_supports)}
                  </td>
                  <td
                    className="border-b px-3 py-2.5 align-top"
                    style={{ borderColor: "var(--sc-rule)" }}
                  >
                    {row.notes}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
