import type { EvaluationResultStrict } from "@/lib/evaluation/schema";
import { deriveTierFromWeighted } from "@/lib/evaluation/schema";
import { serifFont, splitVerdictImprovement, uiFont } from "./shared";

type HeadlineLockupProps = {
  scoring: EvaluationResultStrict["scoring"];
  verdict: EvaluationResultStrict["verdict"];
};

export function HeadlineLockup({ scoring, verdict }: HeadlineLockupProps) {
  const { opener, body } = splitVerdictImprovement(verdict.improvement);

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
          className="mb-3 leading-none"
          style={serifFont}
        >
          <span
            className="text-[52px] italic"
            style={{ color: "var(--sc-accent-soft)" }}
          >
            {scoring.band}
          </span>
          <span
            className="text-[11px] font-medium uppercase not-italic tracking-[0.14em]"
            style={{ ...uiFont, color: "rgba(250,248,243,0.65)" }}
          >
            {" · Tier "}
            {deriveTierFromWeighted(scoring.composite_weighted)}
          </span>
        </p>
        <p
          className="text-[10px] tracking-[0.1em] uppercase"
          style={{ ...uiFont, color: "rgba(250,248,243,0.55)" }}
        >
          See methodology for score
        </p>
      </div>
      <div
        className="flex flex-col justify-center border-l-[3px] px-8 py-9"
        style={{ borderColor: "var(--sc-accent)" }}
      >
        <p className="mb-4 text-[17px] leading-snug" style={{ ...serifFont, color: "var(--sc-ink)" }}>
          {verdict.affirmation}
        </p>
        <p className="text-[17px] leading-snug" style={{ ...serifFont, color: "var(--sc-ink-soft)" }}>
          <strong style={{ color: "var(--sc-ink)", fontWeight: 600 }}>{opener}</strong> {body}
        </p>
      </div>
    </section>
  );
}
