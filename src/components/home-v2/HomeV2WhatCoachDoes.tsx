import { serifFont, uiFont } from "./fonts";

const CARDS = [
  {
    title: "Evaluate",
    body: "A structured read of your sermon against the Sermon Coach Expository Standard—not just a score, but a prioritized assessment.",
  },
  {
    title: "Identify",
    body: "See recurring patterns across sermons. Discover strengths, blind spots, and the areas where growth will have the greatest impact.",
  },
  {
    title: "Develop",
    body: "Turn feedback into a specific next step, then track that development across the sermons that follow.",
  },
] as const;

export function HomeV2WhatCoachDoes() {
  return (
    <section className="mx-auto max-w-[1100px] px-6 py-20 max-[720px]:px-5 max-[720px]:py-14">
      <div className="text-center">
        <p
          className="mb-4 text-[11px] font-semibold uppercase tracking-[0.2em]"
          style={{ ...uiFont, color: "var(--sc-accent)" }}
        >
          What the coach does
        </p>
        <h2
          className="mx-auto max-w-[760px] text-[36px] font-semibold leading-[1.2] tracking-[-0.01em] max-[720px]:text-[28px]"
          style={{ ...serifFont, color: "var(--sc-ink)" }}
        >
          Know what&apos;s strong. Know what&apos;s holding you back. Know what
          to work on next.
        </h2>
      </div>
      <div className="mt-[42px] grid grid-cols-1 gap-[18px] min-[721px]:grid-cols-3">
        {CARDS.map((card) => (
          <article
            key={card.title}
            className="rounded p-8"
            style={{
              background: "var(--sc-panel)",
              boxShadow: "var(--sc-shadow)",
            }}
          >
            <h3
              className="mb-3 text-[22px] font-semibold leading-[1.3]"
              style={{ ...serifFont, color: "var(--sc-ink)" }}
            >
              {card.title}
            </h3>
            <p
              className="text-[14px] leading-[1.65]"
              style={{ ...serifFont, color: "var(--sc-ink-soft)" }}
            >
              {card.body}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
