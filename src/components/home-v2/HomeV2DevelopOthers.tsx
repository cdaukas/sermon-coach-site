const HEADING =
  "Preachers are formed by other preachers. This gives you something concrete to hand them.";

const PARAGRAPH_1 =
  "An associate who preaches once a month. A church planter you are coaching. The men in your Tuesday morning lab. Give one of them a seat and he submits his own sermons, keeps his own library, and reads his own coaching.";

const PARAGRAPH_2 =
  "What he reads is a debrief, not a score. The number stays with you until you decide to release it.";

/** Carries the change-over-time argument the growth profile section used to
 *  make. Reader's own library first, then the mentee's. */
const GROWTH =
  "The strengths that repeat and the gaps that keep returning only show up across sermons, in your library and in his. His seat keeps every sermon he submits, so what you read after six months is a line of development rather than six unrelated critiques.";

const PARAGRAPH_3 =
  "For a staff, a class, or a training lab, seats are billed on one invoice.";

export function HomeV2DevelopOthers() {
  return (
    <section className="section develop">
      <div className="container center">
        <div className="eyebrow">Develop others</div>
        <h2>{HEADING}</h2>
        <p className="lead">{PARAGRAPH_1}</p>
        <p>{PARAGRAPH_2}</p>
        <p>{GROWTH}</p>
        <p>{PARAGRAPH_3}</p>
        {/* Names the teaching contexts the page otherwise never mentions. No
            price and no mailto here: the pricing page carries both. */}
        <p>
          Seminaries, cohorts, and training labs read every preacher against the
          same framework, with{" "}
          <a href="/pricing.html#classroom">
            Classroom and Preaching Lab seats
          </a>{" "}
          set up before the term starts.
        </p>
        <a href="/pricing.html" className="cardlink">
          See seats and pricing &rarr;
        </a>
      </div>
    </section>
  );
}
