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
    <section className="section">
      <div className="container center">
        <div className="eyebrow">Built for the preaching week</div>
        <h2>A coach for more than the moment before Sunday.</h2>
        <p className="lead">
          From the first outline to the finished sermon—and from one sermon to
          the next—The Sermon Coach turns your preaching rhythm into a
          development rhythm.
        </p>
        <div className="grid3">
          {CARDS.map((card) => (
            <div key={card.title} className="card">
              <h3>{card.title}</h3>
              <p>{card.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
