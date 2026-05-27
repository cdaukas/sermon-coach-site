import type { EvaluationResultStrict } from "@/lib/evaluation/schema";
import { SectionTitle } from "./SectionTitle";
import { serifFont, uiFont } from "./shared";

type RewritesSectionProps = {
  rewrites: EvaluationResultStrict["rewrites"];
};

export function RewritesSection({ rewrites }: RewritesSectionProps) {
  return (
    <section className="mb-7">
      <SectionTitle>What Improvement Looks Like</SectionTitle>
      <div className="space-y-4">
        {rewrites.map((rewrite, index) => (
          <details
            key={rewrite.moment_label}
            className="group"
            open={index === 0}
            style={{
              background: "var(--sc-panel)",
              boxShadow: "var(--sc-shadow)",
            }}
          >
            <summary
              className="cursor-pointer list-none px-6 py-5 transition-colors hover:bg-[var(--sc-cream-tint)] md:px-8 [&::-webkit-details-marker]:hidden"
            >
              <div className="flex gap-3">
                <span
                  className="mt-1 shrink-0 text-[12px] leading-none transition-transform group-open:rotate-90"
                  style={{ color: "var(--sc-ink-soft)" }}
                  aria-hidden
                >
                  ▸
                </span>
                <div className="min-w-0 flex-1">
                  <h3
                    className="text-[22px] font-normal leading-snug"
                    style={{ ...serifFont, color: "var(--sc-ink)" }}
                  >
                    {rewrite.moment_label}
                  </h3>
                  <p
                    className="mt-2 text-[10px] font-semibold uppercase tracking-[0.12em]"
                    style={{ ...uiFont, color: "var(--sc-amber)" }}
                  >
                    Suggested rewrite · Moment {index + 1}
                  </p>
                </div>
              </div>
            </summary>
            <div
              className="border-t px-6 pb-7 pt-2 md:px-8"
              style={{
                borderColor: "var(--sc-rule)",
                background: "var(--sc-accent-pale)",
              }}
            >
              <p
                className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.1em]"
                style={{ ...uiFont, color: "var(--sc-accent)" }}
              >
                Why this works
              </p>
              <p
                className="mb-5 text-[14px] leading-relaxed"
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
                  <p
                    className="text-[14px] italic leading-relaxed"
                    style={{ ...serifFont, color: "var(--sc-ink)" }}
                  >
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
                    Improved
                  </p>
                  <p
                    className="text-[14px] italic leading-relaxed"
                    style={{ ...serifFont, color: "var(--sc-ink)" }}
                  >
                    {rewrite.rewrite}
                  </p>
                </div>
              </div>
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
