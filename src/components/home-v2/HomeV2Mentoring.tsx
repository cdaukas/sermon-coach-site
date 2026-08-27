const SEATS = [
  {
    name: "Apprentice",
    who: "For the associate, the lay preacher, the church planter you are bringing along.",
    price: "$12/mo per seat",
    detail:
      "The coaching debrief and How It Preaches go to them. The scored evaluation is generated and held until you release it.",
  },
  {
    name: "Colleague",
    who: "For the peer you are reading, and who is ready to see everything.",
    price: "$25/mo per seat",
    detail:
      "They read everything the moment it is ready, including the score. Nothing is held.",
  },
] as const;

export function HomeV2Mentoring() {
  return (
    <section className="section mentoring">
      <div className="container center">
        <div className="eyebrow">Mentoring</div>
        <h2>Bring another preacher along.</h2>
        <p className="lead">
          A seat gives another preacher their own account, their own
          submissions, and a library you can read. You are not grading him. You
          are developing him.
        </p>
      </div>

      <div className="container grid2">
        {SEATS.map((seat) => (
          <div key={seat.name} className="card">
            <h3>{seat.name}</h3>
            <small className="price">{seat.price}</small>
            <p>{seat.who}</p>
            <p>{seat.detail}</p>
          </div>
        ))}
      </div>

      <div className="container">
        <div className="held">
          <div className="eyebrow">Why a score can wait</div>
          <p>
            On an Apprentice seat the evaluation still runs in full. It is simply
            held. The younger preacher reads the coaching first, does the work,
            and sees the number when you decide it will help him rather than
            flatten him. The formation comes before the score, which is how good
            preaching workshops have always worked.
          </p>
          <div className="ctarow">
            <a
              href="mailto:chris@sermoncoach.com?subject=Mentoring%20seat"
              className="btn"
            >
              Tell us who you are developing
            </a>
            <a href="/pricing.html" className="cardlink">
              See seat pricing &rarr;
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
