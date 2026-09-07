const TESTIMONIALS = [
  {
    quote:
      "“It takes a lot of effort and knowledge to give really specific feedback. That is where The Sermon Coach comes in — it is like having the best preachers listening to your sermon and taking the time to give specific feedback from their expert perspective.”",
    name: "Tyler",
    role: "Lead Pastor in Phoenix, AZ",
  },
  {
    quote:
      "“The Sermon Coach has been an incredibly valuable tool for my growth as a preacher. It has helped me identify communication patterns, address blind spots, and take practical steps toward becoming a more effective communicator of God’s Word.”",
    name: "Jon Demeter",
    role: "Lead Pastor of Redemption Peoria",
  },
  {
    quote:
      "“Being able to incorporate theologically rich and pastorally practical feedback from a consistently applied analytical tool into the sermon before it is ever delivered is a game-changer for our entire pastoral team.”",
    name: "Dr. Steven Wilhoit",
    role: "Author, Pastor, and Church Planter of Dwell City Church, Bel Air, MD",
  },
] as const;

const BUILDER =
  "The Sermon Coach was built by Dr. Christopher M. Daukas, a former church planter in Phoenix, Arizona, with 25 years of pastoral ministry experience and 14 years as a Lead Pastor. Today, Chris serves as EVP of Global Training Network, where he equips and encourages indigenous pastors in the Majority World.";

export function HomeV2Proof() {
  return (
    <section className="section">
      <div className="container center">
        <div className="eyebrow">From preachers using it</div>
        <h2>Feedback specific enough to help you grow.</h2>
      </div>

      <div className="container grid3">
        {TESTIMONIALS.map((testimonial) => (
          <figure key={testimonial.name} className="card quotecard">
            <blockquote>{testimonial.quote}</blockquote>
            <figcaption>
              <strong>{testimonial.name}</strong>
              <span>{testimonial.role}</span>
            </figcaption>
          </figure>
        ))}
      </div>

      <div className="container">
        <div className="builder">
          <div className="builder-photo">
            {/* Plain img on purpose: the site uses no next/image anywhere, and
                this asset ships pre-cropped square at 640px for a slot that is
                never wider than 226px. The circle and its gold ring come from
                .builder-photo in CSS. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/chris-daukas.jpg"
              width={640}
              height={640}
              alt="Dr. Christopher M. Daukas"
              loading="lazy"
              decoding="async"
            />
          </div>
          <div className="builder-body">
            <div className="eyebrow">Built by a preacher</div>
            <h3>Built by a preacher. Tested in the pulpit.</h3>
            <p>{BUILDER}</p>
            <p>
              The framework is the one Chris uses on his own work. It finds the
              soft spots in a sermon, and he let it find his before he showed it
              to anyone.
            </p>
            <a href="/story.html" className="cardlink">
              Read the story &rarr;
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
