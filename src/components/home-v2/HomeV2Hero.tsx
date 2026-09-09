import Link from "next/link";

/** Three beats, hard-broken. The breaks are the copy, so each line is its own
 *  block and the type scales down at narrow widths rather than reflowing. */
const HEADLINE = [
  "Preach better sermons.",
  "Become a better preacher.",
  "Build a healthier church.",
] as const;

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
          {HEADLINE.map((line, i) => (
            <span
              key={line}
              className={
                i === HEADLINE.length - 1 ? "hero-line hero-line-turn" : "hero-line"
              }
            >
              {line}
            </span>
          ))}
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
