import Link from "next/link";

const HEADLINE_LEAD = "Your shelf is full of commentaries.";
const HEADLINE_TURN = "There has never been one on the sermon itself.";

const BODY =
  "The Sermon Coach reads the sermon you actually wrote and measures it against the Sermon Coach Expositional Framework™ — eleven questions across four areas. Then it keeps going. Sketch before you write. Evaluate before you preach. Learn from the result. Over time, those sermons become a picture of how you are developing as a preacher.";

export function HomeV2Hero() {
  return (
    <header className="hero">
      <div className="container">
        <div className="eyebrow">Built by a preacher for preachers</div>
        <h1>
          {HEADLINE_LEAD}
          <span className="hero-turn">{HEADLINE_TURN}</span>
        </h1>
        <p>{BODY}</p>
        <Link href="/start" className="btn btn-lg">
          Evaluate your first sermon free
        </Link>
        <div className="subnote">
          No card, no commitment. Full evaluation, back in minutes.
        </div>
        <div className="herolinks">
          <Link href="/sample-sketch">See a sample sketch &rarr;</Link>
          <Link href="/sample-evaluation">See a sample evaluation &rarr;</Link>
        </div>
      </div>
    </header>
  );
}
