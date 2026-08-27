const STRENGTHS = ["Textual fidelity & exegesis", "Gospel clarity"] as const;
const GAPS = ["Pastoral specificity", "Application to present audience"] as const;

const SUPPORTING =
  "A single evaluation can show you what to work on this week. Over time, those evaluations reveal something larger: what consistently holds, what keeps slipping, and where your next development focus should be.";

const READS = [
  {
    title: "Patterns, not verdicts",
    body: "The same strength shows up week after week. So does the same gap. One sermon can teach you something; a body of sermons shows you a pattern.",
  },
  {
    title: "The same criterion, quoted twice",
    body: "Your growth report sets an earlier sermon beside a later one and shows the lines from each that scored the same criterion, so you can read the change in your own words.",
  },
  {
    title: "One next thing",
    body: "Not eleven areas to fix. The report names the growth edge worth working on before the next sermon.",
  },
] as const;

export function HomeV2GrowthProfile() {
  return (
    <section className="section">
      <div className="container center">
        <div className="eyebrow">Over time</div>
        <h2>
          Feedback shows you what to work on. Patterns show you where to grow.
        </h2>
        <p className="lead">{SUPPORTING}</p>
        <p className="closer">
          The goal is not a higher score. The goal is a better preacher.
        </p>
      </div>

      <div className="container">
        <div className="profilecard">
          <div className="profilehead">
            <strong>Your preaching growth profile</strong>
            <span className="illustration">Example profile</span>
          </div>

          <div className="profilebody">
            <div className="profilecol">
              <small>Consistently strong</small>
              <ul className="critlist strong">
                {STRENGTHS.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <small>Keeps slipping</small>
              <ul className="critlist gap">
                {GAPS.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>

            <div className="profilecol focus">
              <small>Next development focus</small>
              <strong>Move from explanation to specific practice.</strong>
              <p>
                Your exposition holds. The application stays general — name the
                actual people in the room and what Monday looks like for them.
              </p>
            </div>
          </div>

          <div className="profilenote">
            No scores shown here. Your own report is built from your own
            evaluations. When the framework itself is revised, the boundary is
            marked and numbers are not compared across it — a change in the
            instrument is not growth in the preacher.
          </div>
        </div>
      </div>

      <div className="container grid3">
        {READS.map((read) => (
          <div key={read.title} className="card">
            <h3>{read.title}</h3>
            <p>{read.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
