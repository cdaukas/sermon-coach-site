import Link from "next/link";

/** Fine print on the dark footercta ground: --sc-rule on --sc-ink, 8.03:1 at
 *  the darker gradient stop. Inline because it is the only paragraph at this
 *  scale in the section. */
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
        <div className="eyebrow">Your next sermon is already coming</div>
        <h2>Walk into Sunday knowing your sermon is ready.</h2>
        <Link href="/start" className="btn btn-lg">
          Evaluate your first sermon free
        </Link>
        {/* Under the button, not above it: the reassurance answers the
            hesitation the button just created. */}
        <p className="ctanote">
          No card. No commitment. Full evaluation, back in minutes.
        </p>
        {/* Answers the hesitation that stops the click. Not italic, because
            this is a plain statement of fact. */}
        <p style={dataNoteStyle}>
          Your manuscript stays in your account. It is not used to train AI
          models and it is not sold.
        </p>
        <a href="/pricing.html" className="ctapricing">
          Full pricing
        </a>
      </div>
    </section>
  );
}
