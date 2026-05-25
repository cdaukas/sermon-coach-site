import type { EvaluationResult } from "@/lib/evaluation/schema";
import { SectionEyebrow } from "./SectionEyebrow";
import { SectionTitle } from "./SectionTitle";
import { serifFont, uiFont } from "./shared";

type GrowthOpportunitiesSectionProps = {
  growthOpportunities: NonNullable<EvaluationResult["growth_opportunities_detailed"]>;
};

export function GrowthOpportunitiesSection({
  growthOpportunities,
}: GrowthOpportunitiesSectionProps) {
  return (
    <section className="mb-7">
      <SectionEyebrow variant="amber">Where it can get better</SectionEyebrow>
      <SectionTitle>Three growth opportunities</SectionTitle>
      <div className="space-y-4">
        {growthOpportunities.map((panel) => (
          <article
            key={panel.number}
            className="border-l-4 px-6 py-7 md:px-8"
            style={{
              background: "var(--sc-cream-tint)",
              borderColor: "var(--sc-amber)",
            }}
          >
            <p
              className="mb-3 text-[10px] font-semibold uppercase tracking-[0.12em]"
              style={{ ...uiFont, color: "var(--sc-amber)" }}
            >
              Growth Opportunity {String(panel.number).padStart(2, "0")}
            </p>
            <h3
              className="mb-3.5 text-2xl font-normal leading-snug"
              style={{ ...serifFont, color: "var(--sc-ink)" }}
            >
              {panel.headline}
            </h3>
            <span
              className="mb-4 inline-block px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.08em]"
              style={{
                ...uiFont,
                background: "var(--sc-ink)",
                color: "var(--sc-bg)",
              }}
            >
              {panel.principle_badge}
            </span>
            {panel.diagnosis_paragraphs.map((paragraph) => (
              <p
                key={paragraph.slice(0, 48)}
                className="mb-3 text-[15px] leading-relaxed last:mb-0"
                style={{ ...serifFont, color: "var(--sc-ink)" }}
              >
                {paragraph}
              </p>
            ))}
            <div
              className="mt-4 border-l-[3px] px-5 py-4"
              style={{
                background: "var(--sc-panel)",
                borderColor: "var(--sc-accent)",
              }}
            >
              <p
                className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em]"
                style={{ ...uiFont, color: "var(--sc-accent)" }}
              >
                Next step
              </p>
              <p className="text-[14px] leading-snug" style={{ ...serifFont, color: "var(--sc-ink)" }}>
                {panel.next_step}
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
