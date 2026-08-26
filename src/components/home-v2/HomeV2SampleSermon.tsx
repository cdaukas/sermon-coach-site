import Link from "next/link";

const SUPPORTING =
  "The same Hebrews 3:1–6 sermon is shown at two stages: the Sketch before preaching and the evaluation after. The Sketch caught the gospel turn while it was still in tension. The evaluation found that the turn had been resolved.";

const SAMPLES = [
  {
    stage: "Stage one",
    title: "The Sketch",
    body: "A readiness read of the outline, before the manuscript is finished.",
    href: "/sample-sketch",
    linkLabel: "Read the sample sketch",
  },
  {
    stage: "Stage two",
    title: "The Evaluation",
    body: "A full read of the finished sermon against the Sermon Coach Expositional Framework™, anchored in lines from the manuscript.",
    href: "/sample-evaluation",
    linkLabel: "Read the sample evaluation",
  },
] as const;

export function HomeV2SampleSermon() {
  return (
    <section className="section sample">
      <div className="container center">
        <div className="eyebrow">See it on a real sermon</div>
        <h2>The Sermon Coach in Action.</h2>
        <p className="lead">{SUPPORTING}</p>
      </div>
      <div className="container grid2">
        {SAMPLES.map((sample) => (
          <div key={sample.title} className="card">
            <small className="stage">{sample.stage}</small>
            <h3>{sample.title}</h3>
            <p>{sample.body}</p>
            <Link href={sample.href} className="cardlink">
              {sample.linkLabel} &rarr;
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}
