import type { EvaluationResult } from "@/lib/evaluation/schema";

const serifFont = { fontFamily: "var(--font-serif)" };
const uiFont = { fontFamily: "var(--font-ui)" };

type HeadlineLockupProps = {
  headline: EvaluationResult["headline"];
};

export function HeadlineLockup({ headline }: HeadlineLockupProps) {
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
          className="mb-3 text-[64px] leading-none tracking-tight"
          style={serifFont}
        >
          {headline.score}
        </p>
        <p className="mb-3 text-[22px] italic" style={{ color: "var(--sc-accent-soft)" }}>
          {headline.band}
        </p>
        <div
          className="mb-3 h-px w-10"
          style={{ background: "rgba(250,248,243,0.3)" }}
        />
        <p
          className="text-[10px] tracking-[0.1em] uppercase"
          style={{ ...uiFont, color: "rgba(250,248,243,0.55)" }}
        >
          Overall score
        </p>
      </div>
      <div
        className="flex flex-col justify-center border-l-[3px] px-8 py-9"
        style={{ borderColor: "var(--sc-accent)" }}
      >
        <p className="mb-4 text-[17px] leading-snug" style={{ ...serifFont, color: "var(--sc-ink)" }}>
          {headline.strengthVerdict}
        </p>
        <p className="text-[17px] leading-snug" style={{ ...serifFont, color: "var(--sc-ink-soft)" }}>
          <strong style={{ color: "var(--sc-ink)" }}>Grow here: </strong>
          {headline.improvementVerdict}
        </p>
      </div>
    </section>
  );
}
