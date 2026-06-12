import type { EvaluationResultStrict } from "@/lib/evaluation/schema";
import { SectionTitle } from "./SectionTitle";
import { serifFont } from "./shared";

type WorkingSectionProps = {
  whatsWorking: EvaluationResultStrict["whats_working"];
};

export function WorkingSection({ whatsWorking }: WorkingSectionProps) {
  return (
    <section className="mb-7">
      <SectionTitle>Lead with these</SectionTitle>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {whatsWorking.map((card) => (
          <article
            key={card.headline}
            className="evaluation-working-card border-t-[3px] px-6 py-6"
            style={{
              background: "var(--sc-panel)",
              borderColor: "var(--sc-green)",
              boxShadow: "var(--sc-shadow)",
            }}
          >
            <h3
              className="mb-3.5 text-[19px] leading-snug"
              style={{ ...serifFont, color: "var(--sc-green)" }}
            >
              {card.headline}
            </h3>
            {card.anchored_quote ? (
              <blockquote
                className="mb-3 border-l-2 pl-3 text-[14px] italic leading-normal"
                style={{
                  ...serifFont,
                  borderColor: "var(--sc-green-soft)",
                  color: "var(--sc-ink-soft)",
                }}
              >
                {card.anchored_quote}
              </blockquote>
            ) : null}
            <p className="text-[14px] leading-relaxed" style={{ ...serifFont, color: "var(--sc-ink)" }}>
              {card.explanation}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
