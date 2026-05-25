import type { EvaluationResult } from "@/lib/evaluation/schema";
import { serifFont, splitVerdictImprovement, uiFont } from "./shared";

type HeadlineLockupProps = {
  scoring: EvaluationResult["scoring"];
  verdict: EvaluationResult["verdict"];
};

export function HeadlineLockup({ scoring, verdict }: HeadlineLockupProps) {
  const { opener, body } = splitVerdictImprovement(verdict.improvement_sentence);

  return (
    <section
      className="mb-10 grid min-h-[280px] grid-cols-1 md:grid-cols-[280px_1fr]"
      style={{
        background: "var(--sc-panel)",
        boxShadow: "var(--sc-shadow)",
      }}
    >
      <div
        className="flex flex-col items-center justify-center px-8 py-10 text-center"
        style={{
          background: "linear-gradient(165deg, #1a2332 0%, #2a3548 100%)",
          color: "#faf8f3",
        }}
      >
        <p
          className="mb-3 text-[52px] leading-none italic"
          style={{ ...serifFont, color: "var(--sc-accent-soft)" }}
        >
          {scoring.band}
        </p>
        <p
          className="mb-3 text-[20px] leading-none tracking-tight"
          style={uiFont}
        >
          {scoring.raw_total}/{scoring.raw_max}
        </p>
        <div
          className="mb-3 h-px w-10"
          style={{ background: "rgba(250,248,243,0.3)" }}
        />
        <p
          className="text-[10px] tracking-[0.1em] uppercase"
          style={{ ...uiFont, color: "rgba(250,248,243,0.55)" }}
        >
          Composite · See methodology at end
        </p>
      </div>
      <div
        className="flex flex-col justify-center border-l-[3px] px-8 py-9"
        style={{ borderColor: "var(--sc-accent)" }}
      >
        <p className="mb-4 text-[17px] leading-snug" style={{ ...serifFont, color: "var(--sc-ink)" }}>
          {verdict.affirmation_paragraph}
        </p>
        <p className="text-[17px] leading-snug" style={{ ...serifFont, color: "var(--sc-ink-soft)" }}>
          <strong style={{ color: "var(--sc-ink)", fontWeight: 600 }}>{opener}</strong> {body}
        </p>
      </div>
    </section>
  );
}
