import { serifFont } from "./fonts";
import { StaticButton } from "./StaticButton";

export function HomeV2ClosingCta() {
  return (
    <section
      className="border-t px-6 py-[90px] text-center max-[720px]:px-5 max-[720px]:py-16"
      style={{
        background: "var(--sc-panel)",
        borderColor: "var(--sc-rule)",
      }}
    >
      <div className="mx-auto max-w-[760px]">
        <h2
          className="mb-[18px] text-[42px] font-semibold leading-[1.2] tracking-[-0.01em] max-[720px]:text-[30px]"
          style={{ ...serifFont, color: "var(--sc-ink)" }}
        >
          What if every sermon made you a better preacher?
        </h2>
        <p
          className="mb-7 text-[17px] leading-[1.7]"
          style={{ ...serifFont, color: "var(--sc-ink-soft)" }}
        >
          Your next sermon is your next opportunity to grow.
        </p>
        <StaticButton>Start Your Free Preaching Growth Profile</StaticButton>
      </div>
    </section>
  );
}
