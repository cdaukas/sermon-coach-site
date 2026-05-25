import type { EvaluationResult } from "@/lib/evaluation/schema";
import { serifFont, uiFont } from "./shared";

type RewritesSectionProps = {
  rewrites: NonNullable<EvaluationResult["rewrites"]>;
};

export function RewritesSection({ rewrites }: RewritesSectionProps) {
  return (
    <section className="mb-7 space-y-4">
      {rewrites.map((rewrite) => (
        <article
          key={rewrite.moment_label}
          className="px-6 py-7 md:px-8"
          style={{
            background: "var(--sc-panel)",
            boxShadow: "var(--sc-shadow)",
          }}
        >
          <p
            className="mb-2.5 text-[10px] font-semibold uppercase tracking-[0.12em]"
            style={{ ...uiFont, color: "var(--sc-accent)" }}
          >
            Suggested rewrite
          </p>
          <h3
            className="mb-4 text-[22px] font-normal"
            style={{ ...serifFont, color: "var(--sc-ink)" }}
          >
            {rewrite.moment_label}
          </h3>
          <p
            className="mb-4 text-[14px] leading-relaxed"
            style={{ ...serifFont, color: "var(--sc-ink-soft)" }}
          >
            {rewrite.analysis}
          </p>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div
              className="border-l-2 px-5 py-4"
              style={{
                background: "var(--sc-cream-tint)",
                borderColor: "var(--sc-red)",
              }}
            >
              <p
                className="mb-2.5 text-[10px] font-semibold uppercase tracking-[0.1em]"
                style={{ ...uiFont, color: "var(--sc-red)" }}
              >
                Original
              </p>
              <p className="text-[14px] italic leading-relaxed" style={{ ...serifFont, color: "var(--sc-ink)" }}>
                {rewrite.original}
              </p>
            </div>
            <div
              className="border-l-2 px-5 py-4"
              style={{
                background: "var(--sc-cream-tint)",
                borderColor: "var(--sc-green)",
              }}
            >
              <p
                className="mb-2.5 text-[10px] font-semibold uppercase tracking-[0.1em]"
                style={{ ...uiFont, color: "var(--sc-green)" }}
              >
                Rewrite
              </p>
              <p className="text-[14px] italic leading-relaxed" style={{ ...serifFont, color: "var(--sc-ink)" }}>
                {rewrite.rewrite}
              </p>
            </div>
          </div>
        </article>
      ))}
    </section>
  );
}
