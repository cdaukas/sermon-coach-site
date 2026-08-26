const PILLS = [
  "Biblical Faithfulness",
  "Expository Clarity",
  "Christ-Centeredness",
  "Gospel Clarity",
  "Application",
  "Pastoral Connection",
  "Structure",
  "Communication",
] as const;

export function HomeV2ExpositoryStandard() {
  return (
    <section className="section">
      <div className="container">
        <div className="card standard">
          <div className="eyebrow">The methodology</div>
          <h2>The Sermon Coach Expository Standard&trade;</h2>
          <p>
            A framework for evaluating the essential dimensions of faithful,
            clear, Christ-centered, pastorally effective preaching.
          </p>
          <div className="pills">
            {PILLS.map((pill) => (
              <span key={pill} className="pill">
                {pill}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
