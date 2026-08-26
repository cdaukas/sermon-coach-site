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
    <section className="section">
      <div className="container center">
        <div className="eyebrow">What the coach does</div>
        <h2>
          Know what&apos;s strong. Know what&apos;s holding you back. Know what
          to work on next.
        </h2>
      </div>
      <div className="container grid3">
        {CARDS.map((card) => (
          <div key={card.title} className="card">
            <h3>{card.title}</h3>
            <p>{card.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
