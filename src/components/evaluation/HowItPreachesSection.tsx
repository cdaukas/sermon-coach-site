import type { HowItPreaches } from "@/lib/evaluation/hip-schema";
import { serifFont, uiFont } from "./shared";

type HowItPreachesSectionProps = {
  howItPreaches: HowItPreaches;
};

export function HowItPreachesSection({ howItPreaches }: HowItPreachesSectionProps) {
  return (
    <section className="evaluation-hip-section mb-7 mt-12">
      <div className="mb-6">
        <p
          className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em]"
          style={{ ...uiFont, color: "var(--sc-amber)" }}
        >
          Beyond the rubric
        </p>
        <h2
          className="mb-3 text-[32px] font-normal tracking-tight md:text-[36px]"
          style={{ ...serifFont, color: "var(--sc-ink)" }}
        >
          How It Preaches
        </h2>
        <p
          className="max-w-[680px] text-[13.5px] leading-relaxed"
          style={{ ...uiFont, color: "var(--sc-ink-soft)" }}
        >
          How the sermon actually moves. The craft of it, in five movements from the open to the landing.
        </p>
      </div>

      <div
        className="border-t-[3px] px-6 py-2 pb-8 md:px-9"
        style={{
          background: "var(--sc-panel)",
          borderColor: "var(--sc-accent)",
          boxShadow: "var(--sc-shadow)",
        }}
      >
        {howItPreaches.movements.map((movement) => (
          <article
            key={movement.name}
            className="border-b py-6 last:border-b-0"
            style={{ borderColor: "var(--sc-rule)" }}
          >
            <div
              className="mb-2.5 flex items-center gap-3.5 text-[11px] font-bold uppercase tracking-[0.16em]"
              style={{ ...uiFont, color: "var(--sc-accent)" }}
            >
              <span>{movement.name}</span>
              <span
                className="h-px flex-1"
                style={{ background: "var(--sc-rule)" }}
                aria-hidden="true"
              />
            </div>
            <div
              className="evaluation-hip-movement text-base leading-[1.72]"
              style={{ ...serifFont, color: "var(--sc-ink)" }}
              dangerouslySetInnerHTML={{ __html: movement.body }}
            />
          </article>
        ))}
      </div>
    </section>
  );
}
