import type { EvaluationResult } from "@/lib/evaluation/schema";
import { serifFont, uiFont } from "./shared";

type FcfSectionProps = {
  fcf: NonNullable<EvaluationResult["fcf"]>;
};

export function FcfSection({ fcf }: FcfSectionProps) {
  return (
    <section
      className="mb-7 border-l-4 px-6 py-6 md:px-8"
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
        Fallen Condition Focus
      </p>
      <p
        className="mb-3 text-[11px] font-semibold uppercase tracking-[0.08em]"
        style={{
          ...uiFont,
          color: fcf.named_in_sermon ? "var(--sc-green)" : "var(--sc-amber)",
        }}
      >
        {fcf.named_in_sermon ? "Named in sermon" : "Implied, not named as one sentence"}
      </p>
      <p className="text-lg leading-relaxed" style={{ ...serifFont, color: "var(--sc-ink)" }}>
        {fcf.implied_fcf}
      </p>
      {fcf.placement_notes ? (
        <p className="mt-4 text-[14px] leading-relaxed" style={{ ...serifFont, color: "var(--sc-ink-soft)" }}>
          {fcf.placement_notes}
        </p>
      ) : null}
    </section>
  );
}
