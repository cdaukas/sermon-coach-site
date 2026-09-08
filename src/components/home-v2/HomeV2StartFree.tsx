import Link from "next/link";

/** Matches .pricingnote's scale and colour on the dark footercta ground
 *  (--sc-rule on --sc-ink, 8.03:1 at the darker gradient stop). Every
 *  property the section's own p rule sets is restated so the inline style
 *  fully overrides it. */
const dataNoteStyle = {
  margin: "24px auto 0",
  maxWidth: 540,
  fontFamily: "var(--font-ui)",
  fontSize: 13,
  lineHeight: 1.7,
  fontStyle: "normal",
  color: "var(--sc-rule)",
} as const;

export function HomeV2StartFree() {
  return (
    <section className="footercta">
      <div className="container">
        <h2>Walk into Sunday knowing you&rsquo;re ready.</h2>
        <p>
          Start with one. Your first evaluation is free — no card, no
          commitment, full evaluation back in minutes.
        </p>
        <Link href="/start" className="btn btn-lg">
          Get Your First Evaluation Free
        </Link>
        {/* Answers the hesitation that stops the click, so it sits above the
            pricing note rather than below it. Styled inline to match the
            pricingnote typography without borrowing its class: these are
            separate statements and editing one should not move the other.
            Not italic, because this is a plain statement of fact. */}
        <p style={dataNoteStyle}>
          Your manuscript stays in your account. It is not used to train AI
          models and it is not sold.
        </p>
        <p className="pricingnote">
          After that it is $29 a month for ten credits, an introductory rate
          that stays locked while your subscription is active. Or skip the
          subscription and buy credits in packs instead.{" "}
          <a href="/pricing.html">Full pricing</a>
        </p>
      </div>
    </section>
  );
}
