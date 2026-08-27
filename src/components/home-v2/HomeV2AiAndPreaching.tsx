const WILL_NOT = [
  "It will not write your sermon, and it will not study the passage for you.",
  "It will not tell you what God is saying. It does not know, and neither does anything else you can buy.",
  "It will not replace your judgment about the people who will be sitting in front of you on Sunday. It has never met them.",
  "It will not tell you whether you were faithful. That is not something software can measure, and anything that claims otherwise is selling you something.",
] as const;

export function HomeV2AiAndPreaching() {
  return (
    <section className="section objection">
      <div className="container">
        <div className="eyebrow">The question you should be asking</div>
        <h2>Concerned about AI and preaching? Good. So am I.</h2>
        <p className="lead objection-lead">
          The hard work of prayer and study and wrestling with the text is what
          the Spirit uses to form the preacher, not just the sermon. So The
          Sermon Coach was built around a narrower question: could technology
          help preachers see what they actually wrote, without touching any of
          the work that formed them?
        </p>
        <ul className="willnot">
          {WILL_NOT.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p className="objection-close">
          Your study, your writing, your preaching, your judgment about your
          people, and the Spirit&rsquo;s work in all of it stay yours. The
          evaluation is an assessment, not a verdict.
        </p>
        <a href="/why-sermon-coach.html" className="cardlink">
          Read the full position &rarr;
        </a>
      </div>
    </section>
  );
}
