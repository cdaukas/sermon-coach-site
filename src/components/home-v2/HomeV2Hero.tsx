import Link from "next/link";

/** Three beats. The first two are inline and unbreakable, so they share a line
 *  wherever they fit and the browser wraps between them when they do not. The
 *  wrap point is therefore always the gap between sentences, never inside one,
 *  at any width. The third beat is its own block at every width. */
const BEAT_ONE = "Preach better sermons.";
const BEAT_TWO = "Become a better preacher.";
const BEAT_TURN = "Build a healthier church.";

/** Serif lede. Carries the promise; the paragraph under it carries the loop. */
const LEDE =
  "The Sermon Coach reads the sermons you actually write and shows you what is working, what needs attention, and where to focus before you preach on Sunday.";

const BODY =
  "Do that week after week and the patterns become visible: what you keep doing well, what keeps slipping, and what to work on next to keep growing as a preacher.";

export function HomeV2Hero() {
  return (
    <header className="hero">
      <div className="container">
        <div className="eyebrow">Built by a preacher for preachers</div>
        <h1>
          <span className="hero-beat">{BEAT_ONE}</span>{" "}
          <span className="hero-beat">{BEAT_TWO}</span>
          <span className="hero-beat hero-beat-turn">{BEAT_TURN}</span>
        </h1>
        <p className="hero-lede">{LEDE}</p>
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
