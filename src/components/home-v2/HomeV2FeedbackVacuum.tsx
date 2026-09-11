/** Two symptoms of the same gap. Each card's body ends on the phrase that
 *  names what is actually missing, so the emphasis always closes the
 *  sentence rather than interrupting it. */
const POINTS = [
  {
    label: "01 · Useful feedback is rare",
    heading: "You rarely get useful feedback.",
    lead: "People may encourage you after you preach. But few can consistently show you ",
    emphasis: "what worked, what didn't, and what to work on next.",
  },
  {
    label: "02 · Growth becomes hard to see",
    heading: "Every sermon starts over.",
    lead: "You may sense something worked, or didn't, but without consistent feedback, it's hard to know ",
    emphasis: "why, what to change, or whether it's becoming a pattern.",
  },
] as const;

/** The conclusion of the argument. Two sentences, each on its own line, with
 *  the payoff carrying the weight. Kept as consts so the apostrophes stay
 *  straight like the rest of this directory's copy rather than becoming JSX
 *  entities. */
const CLOSER_SETUP = "Encouragement gets you through a sermon.";
const CLOSER_ACCENT = "Clear feedback";
const CLOSER_REST = " helps you grow from it.";

const BRIDGE = "That's the gap Sermon Coach was built to fill.";

export function HomeV2FeedbackVacuum() {
  return (
    <section className="section problem">
      <div className="container center">
        <div className="eyebrow">The feedback gap</div>
        <h2>
          How do you know where you need to grow{" "}
          <br />
          as a preacher?
        </h2>
      </div>
      <div className="container grid2 gap-cards">
        {POINTS.map((point) => (
          <div key={point.heading} className="card gap-card">
            <div className="gap-label">{point.label}</div>
            <h3>{point.heading}</h3>
            <p>
              {point.lead}
              <strong className="gap-emphasis">{point.emphasis}</strong>
            </p>
          </div>
        ))}
      </div>
      <div className="container center">
        <div className="gap-closer">
          <p>
            <span className="gap-closer-setup">{CLOSER_SETUP}</span>
            <span className="gap-closer-payoff">
              <span className="gap-closer-accent">{CLOSER_ACCENT}</span>
              {CLOSER_REST}
            </span>
          </p>
          <p className="gap-bridge">{BRIDGE}</p>
          {/* Decorative. Points into the section that follows. */}
          <svg
            className="gap-chevron"
            width="18"
            height="10"
            viewBox="0 0 18 10"
            aria-hidden="true"
            focusable="false"
          >
            <path
              d="M1 1l8 7 8-7"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
    </section>
  );
}
