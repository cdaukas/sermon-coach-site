import { serifFont, uiFont } from "./fonts";
import { StaticButton } from "./StaticButton";

export function HomeV2Hero() {
  return (
    <section
      className="border-y px-6 py-16 text-center max-[720px]:px-5 max-[720px]:py-10"
      style={{
        background: "var(--sc-panel)",
        borderColor: "var(--sc-rule)",
      }}
    >
      <div className="mx-auto max-w-[850px]">
        <p
          className="mb-5 text-[11px] font-semibold uppercase tracking-[0.2em]"
          style={{ ...uiFont, color: "var(--sc-accent)" }}
        >
          Built by a preacher for preachers
        </p>
        <h1
          className="mb-6 text-[56px] font-semibold leading-[1.08] tracking-[-0.02em] max-[720px]:text-[38px]"
          style={{ ...serifFont, color: "var(--sc-ink)" }}
        >
          Become a Better Preacher—One Sermon at a Time.
        </h1>
        <p
          className="mx-auto mb-8 max-w-[720px] text-[18px] leading-[1.7]"
          style={{ ...serifFont, color: "var(--sc-ink-soft)" }}
        >
          The Sermon Coach gives you a systematic way to evaluate your preaching,
          identify your greatest opportunities for growth, and track your
          development sermon after sermon.
        </p>
        <StaticButton>Evaluate Your First Sermon Free</StaticButton>
        <p
          className="mt-[18px] text-[13px]"
          style={{ ...uiFont, color: "var(--sc-ink-soft)" }}
        >
          No card required. See how your preaching can improve before you ever
          step into the pulpit.
        </p>
      </div>
    </section>
  );
}
