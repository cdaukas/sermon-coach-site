const POINTS = [
  "$25 per seat, per month, billed by the term, with a five-seat floor",
  "Four credits per seat each month, pooled across the class",
  "The instructor seat is free",
  "Each preacher keeps a private library, visible to the instructor, never to classmates",
  "One invoice for the institution",
] as const;

export function HomeV2Institutions() {
  return (
    <section className="section">
      <div className="container center">
        <div className="eyebrow">Seminaries, networks, and churches</div>
        <h2>One standard for every preacher you train.</h2>
        <p className="lead">
          A seminary course, a church planting cohort, a denominational track.
          Every preacher read against the same framework, with development you
          can actually see over a term rather than a folder of comments that
          varies by whoever did the reading.
        </p>
      </div>

      <div className="container">
        <div className="classroom">
          <div className="classroom-head">
            <strong>Classroom</strong>
            <span>from $125/mo</span>
          </div>
          <ul>
            {POINTS.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
          <p className="classroom-note">
            Classes are set up by hand before the term starts, so this begins
            with a conversation rather than a checkout.
          </p>
          <a
            href="mailto:chris@sermoncoach.com?subject=Classroom%20interest"
            className="btn"
          >
            Tell us about your class
          </a>
        </div>
      </div>
    </section>
  );
}
