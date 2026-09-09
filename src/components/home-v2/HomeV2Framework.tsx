/** Overview only. The eleven criteria and their sources live on
 *  /how-its-scored.html; these four cards carry the architecture so a visitor
 *  can see there is one consistent standard without reading the rubric. */
const HEADLINE = "Every sermon is measured against the same standard.";

const SUBHEAD =
  "Eleven questions. Four areas. One consistent framework for every sermon.";

const CATEGORIES = [
  {
    number: "01",
    name: "Text & Theology",
    question: "Does the sermon say what the text actually says?",
  },
  {
    number: "02",
    name: "Structure & Craft",
    question: "Does the sermon make the truth clear and memorable?",
  },
  {
    number: "03",
    name: "Application & Audience",
    question: "Does the sermon reach the real people in the room?",
  },
  {
    number: "04",
    name: "Ecclesial & Spiritual",
    question:
      "Does this build up the church as the people of God under the Word?",
  },
] as const;

const SOURCES_EYEBROW = "Rooted in established principles of expository preaching";

const SOURCES =
  "Bryan Chapell · Tim Keller · John Piper · Haddon Robinson · The Simeon Trust · 9Marks";

const DISCLAIMER =
  "The Sermon Coach is not affiliated with or endorsed by these individuals or organizations. The Framework is our synthesis of principles rooted in their approaches to faithful preaching.";

export function HomeV2Framework() {
  return (
    <section className="section">
      <div className="container">
        <div className="card standard">
          <div className="eyebrow">The standard</div>
          <h2>{HEADLINE}</h2>
          {/* The framework's proper name, deliberately below the headline:
              important, but the claim leads and the name follows it. */}
          <p className="standard-name">
            The Sermon Coach Expositional Framework&trade;
          </p>
          <p className="standard-sub">{SUBHEAD}</p>

          <div className="framework-grid">
            {CATEGORIES.map((category) => (
              <div key={category.name} className="framework-cat">
                <span className="framework-num">{category.number}</span>
                <span className="framework-name">{category.name}</span>
                <p className="framework-question">{category.question}</p>
              </div>
            ))}
          </div>

          <div className="framework-sources">
            <small>{SOURCES_EYEBROW}</small>
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
