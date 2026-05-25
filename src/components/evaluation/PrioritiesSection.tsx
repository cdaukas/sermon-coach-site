import type { EvaluationResult } from "@/lib/evaluation/schema";
import { serifFont, uiFont } from "./shared";

type PrioritiesSectionProps = {
  topPriorities: NonNullable<EvaluationResult["top_priorities"]>;
};

export function PrioritiesSection({ topPriorities }: PrioritiesSectionProps) {
  return (
    <section
      className="mb-7 px-6 py-9 md:px-9"
      style={{
        background: "linear-gradient(165deg, #1a2332 0%, #2a3548 100%)",
        color: "#faf8f3",
      }}
    >
      <p
        className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em]"
        style={{ ...uiFont, color: "var(--sc-accent-soft)" }}
      >
        For the next sermon
      </p>
      <h2
        className="mb-2 text-[32px] font-normal"
        style={{ ...serifFont, color: "#faf8f3" }}
      >
        Where You Can Grow
      </h2>
      <p
        className="mb-7 text-base italic"
        style={{ ...serifFont, color: "var(--sc-accent-soft)" }}
      >
        In order — highest leverage first
      </p>

      <div className="divide-y" style={{ borderColor: "rgba(250,248,243,0.15)" }}>
        {topPriorities.map((priority) => (
          <article
            key={priority.rank}
            className="grid grid-cols-1 gap-4 py-6 first:pt-0 last:pb-0 md:grid-cols-[80px_1fr] md:gap-5"
          >
            <p
              className="text-[56px] font-light leading-none"
              style={{ ...serifFont, color: "var(--sc-accent-soft)" }}
            >
              {String(priority.rank).padStart(2, "0")}
            </p>
            <div>
              <h3
                className="mb-2.5 text-xl leading-snug"
                style={{ ...serifFont, color: "#faf8f3" }}
              >
                {priority.headline}
              </h3>
              <p
                className="mb-3.5 text-[14px] leading-relaxed"
                style={{ color: "rgba(250,248,243,0.75)" }}
              >
                {priority.rationale}
              </p>
              <div
                className="border-l-2 px-4 py-3 text-[13px] leading-relaxed"
                style={{
                  background: "rgba(199,165,92,0.12)",
                  borderColor: "var(--sc-accent-soft)",
                  color: "rgba(250,248,243,0.9)",
                }}
              >
                <p
                  className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.12em]"
                  style={{ ...uiFont, color: "var(--sc-accent-soft)" }}
                >
                  Practical step
                </p>
                {priority.practical_step}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
