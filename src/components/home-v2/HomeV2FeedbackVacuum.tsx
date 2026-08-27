const POINTS = [
  {
    heading: "Encouragement is not the same as feedback.",
    body: "The people around you care about your preaching. But caring about your preaching and being able to evaluate it are two different things. Most pastors have people who encourage them. Far fewer have someone who can consistently tell them what is working, what is not, and what to work on next.",
  },
  {
    heading: "Without clear feedback, development stays difficult to see.",
    body: "You may know a sermon felt stronger—or something didn't quite land. But without a consistent way to examine your preaching, it is hard to know why. And if you don't know what to work on, the next sermon starts with the same questions.",
  },
] as const;

export function HomeV2FeedbackVacuum() {
  return (
    <section className="section problem">
      <div className="container center">
        <div className="eyebrow">The problem underneath</div>
        <h2>
          You want to grow as a preacher.
          <br />
          But who helps you see how?
        </h2>
      </div>
      <div className="container grid2">
        {POINTS.map((point) => (
          <div key={point.heading} className="card">
            <h3>{point.heading}</h3>
            <p>{point.body}</p>
          </div>
        ))}
      </div>
      <div className="container center">
        <p className="closer">
          Encouragement gets you through a sermon. Clear feedback helps you grow
          from it.
        </p>
      </div>
    </section>
  );
}
