const SUBHEAD = "Eleven questions. Four areas. One standard for every sermon.";

const CATEGORIES = [
  {
    number: "01",
    name: "Text & Theology",
    question: "Does the sermon say what the text actually says?",
    criteria: [
      "Textual fidelity & exegesis",
      "Christ-centered / redemptive arc",
      "Gospel clarity",
    ],
  },
  {
    number: "02",
    name: "Structure & Craft",
    question: "Does the sermon make the truth clear and memorable?",
    criteria: ["Fallen Condition Focus", "Structure", "Hard things handled"],
  },
  {
    number: "03",
    name: "Application & Audience",
    question: "Does the sermon reach the real people in the room?",
    criteria: [
      "Application to present audience",
      "Emotional arc & dynamics",
      "Pastoral specificity",
    ],
  },
  {
    number: "04",
    name: "Ecclesial & Spiritual",
    question:
      "Does this build up the church as the people of God under the Word?",
    criteria: ["Ecclesial faithfulness", "Expository exultation"],
  },
] as const;

const SOURCES =
  "Bryan Chapell · Tim Keller · John Piper · Haddon Robinson · The Simeon Trust · 9Marks";

const DISCLAIMER =
  "These individuals and organizations are not affiliated with or endorsing The Sermon Coach. The Framework is our synthesis of principles rooted in their approaches to faithful preaching.";

export function HomeV2Framework() {
  return (
    <section className="section">
      <div className="container">
        <div className="card standard">
          <div className="eyebrow">The standard</div>
          <h2>The Sermon Coach Expositional Framework&trade;</h2>
          <p>{SUBHEAD}</p>

          <div className="framework-grid">
            {CATEGORIES.map((category) => (
              <div key={category.name} className="framework-cat">
                <span className="framework-num">{category.number}</span>
                <span className="framework-name">{category.name}</span>
                <p className="framework-question">{category.question}</p>
                <ul>
                  {category.criteria.map((criterion) => (
                    <li key={criterion}>{criterion}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="framework-sources">
            <small>Every criterion traces to a named principle</small>
            <p className="sources-line">{SOURCES}</p>
            <p className="disclaimer">{DISCLAIMER}</p>
            <a href="/how-its-scored.html" className="standard-link">
              See all 11 questions and where each comes from &rarr;
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
