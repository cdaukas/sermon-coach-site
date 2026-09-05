const HEADING =
  "Preachers are formed by other preachers. This gives you something concrete to hand them.";

const PARAGRAPH_1 =
  "An associate who preaches once a month. A church planter you are coaching. The men in your Tuesday morning lab. Give one of them a seat and he submits his own sermons, keeps his own library, and reads his own coaching.";

const PARAGRAPH_2 =
  "What he reads is a debrief, not a score. The number stays with you until you decide to release it.";

const PARAGRAPH_3 =
  "For a staff, a class, or a training lab, seats are billed on one invoice.";

export function HomeV2DevelopOthers() {
  return (
    <section className="section">
      <div className="container center">
        <div className="eyebrow">Develop others</div>
        <h2>{HEADING}</h2>
        <p className="lead">{PARAGRAPH_1}</p>
        <p>{PARAGRAPH_2}</p>
        <p>{PARAGRAPH_3}</p>
        <a href="/pricing.html" className="cardlink">
          See seats and pricing &rarr;
        </a>
      </div>
    </section>
  );
}
