import Link from "next/link";

/** Matches .pricingnote's scale and colour on the dark footercta ground
 *  (--sc-rule on --sc-ink, 8.03:1 at the darker gradient stop) without
 *  borrowing its class, since these are separate statements. */
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
