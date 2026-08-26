import { serifFont, uiFont } from "./fonts";

export function HomeV2Testimonial() {
  return (
    <section
      className="px-6 py-20 max-[720px]:px-5 max-[720px]:py-14"
      style={{ background: "var(--sc-olive-soft)" }}
    >
      <div className="mx-auto max-w-[820px]">
        <blockquote
          className="text-center text-[28px] leading-[1.55] max-[720px]:text-[22px]"
          style={{ ...serifFont, color: "var(--sc-ink)" }}
        >
          “The Sermon Coach has been an incredibly valuable tool for my growth
          as a preacher. It has helped me identify communication patterns,
          address blind spots, and take practical steps toward becoming a more
          effective communicator of God&apos;s Word.”
        </blockquote>
        <cite
          className="mt-[22px] block text-center text-[13px] not-italic"
          style={{ ...uiFont, color: "var(--sc-ink-soft)" }}
        >
          — Jon Demeter, Lead Pastor of Redemption Peoria
        </cite>
      </div>
    </section>
  );
}
