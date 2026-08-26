import { serifFont, uiFont } from "./fonts";

const CARDS = [
  {
    title: "Sketch",
    body: "Before you write: test whether the sermon idea holds together.",
  },
  {
    title: "Evaluate",
    body: "Before you preach: find the soft spots and strengthen the manuscript.",
  },
  {
    title: "Grow",
    body: "After you preach: carry the learning into the next sermon.",
  },
] as const;

export function HomeV2PreachingWeek() {
  return (
    <section className="mx-auto max-w-[1100px] px-6 py-20 text-center max-[720px]:px-5 max-[720px]:py-14">
      <p
        className="mb-4 text-[11px] font-semibold uppercase tracking-[0.2em]"
        style={{ ...uiFont, color: "var(--sc-accent)" }}
      >
        Built for the preaching week
      </p>
      <h2
        className="mx-auto mb-[18px] max-w-[760px] text-[36px] font-semibold leading-[1.2] tracking-[-0.01em] max-[720px]:text-[28px]"
        style={{ ...serifFont, color: "var(--sc-ink)" }}
      >
        A coach for more than the moment before Sunday.
      </h2>
      <p
        className="mx-auto max-w-[720px] text-[17px] leading-[1.7]"
        style={{ ...serifFont, color: "var(--sc-ink-soft)" }}
      >
        From the first outline to the finished sermon—and from one sermon to the
        next—The Sermon Coach turns your preaching rhythm into a development
        rhythm.
      </p>
      <div className="mt-[42px] grid grid-cols-1 gap-[18px] text-left min-[721px]:grid-cols-3">
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
