import { serifFont, uiFont } from "./fonts";

const PILLS = [
  "Biblical Faithfulness",
  "Expository Clarity",
  "Christ-Centeredness",
  "Gospel Clarity",
  "Application",
  "Pastoral Connection",
  "Structure",
  "Communication",
] as const;

export function HomeV2ExpositoryStandard() {
  return (
    <section className="mx-auto max-w-[1100px] px-6 py-20 max-[720px]:px-5 max-[720px]:py-14">
      <div
        className="rounded px-8 py-9 max-[720px]:px-6 max-[720px]:py-7"
        style={{
          background: "var(--sc-ink)",
          boxShadow: "var(--sc-shadow)",
        }}
      >
        <p
          className="mb-4 text-[11px] font-semibold uppercase tracking-[0.2em]"
          style={{ ...uiFont, color: "var(--sc-accent-soft)" }}
        >
          The methodology
        </p>
        <h2
          className="mb-4 text-[36px] font-semibold leading-[1.2] tracking-[-0.01em] max-[720px]:text-[28px]"
          style={{ ...serifFont, color: "var(--sc-panel)" }}
        >
          The Sermon Coach Expository Standard&trade;
        </h2>
        <p
          className="max-w-[720px] text-[16px] leading-[1.7]"
          style={{ ...serifFont, color: "var(--sc-rule)" }}
        >
          A framework for evaluating the essential dimensions of faithful,
          clear, Christ-centered, pastorally effective preaching.
        </p>
        <div className="mt-[25px] flex flex-wrap gap-2.5">
          {PILLS.map((pill) => (
            <span
              key={pill}
              className="rounded-full border px-[13px] py-[9px] text-[12px]"
              style={{
                ...uiFont,
                color: "var(--sc-panel)",
                borderColor: "color-mix(in srgb, var(--sc-panel) 35%, transparent)",
              }}
            >
              {pill}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
