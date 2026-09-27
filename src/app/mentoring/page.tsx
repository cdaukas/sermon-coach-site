import type { Metadata } from "next";
import { HomeV2Footer } from "@/components/home-v2/HomeV2Footer";
import { HomeV2Header } from "@/components/home-v2/HomeV2Header";
import { MentoringLink } from "@/components/mentoring/MentoringLink";
import { MentoringPageView } from "@/components/mentoring/MentoringPageView";
import "@/components/home-v2/home-v2.css";
import "@/components/mentoring/mentoring.css";
import {
  APPRENTICE_SEAT_CHECKOUT_PATH,
  CLASSROOM_PATH,
  COLLEAGUE_SEAT_CHECKOUT_PATH,
} from "@/lib/mentoring/public-links";

const DISCLAIMER =
  "The Sermon Coach is an independent tool. It is not affiliated with, endorsed by, or sponsored by Bryan Chapell, Tim Keller, John Piper, Haddon Robinson, the Simeon Trust, 9Marks, or any author, ministry, or organization whose published work informs its rubric. All names and works are referenced for identification and attribution only. None of these individuals or organizations, nor any author or teacher associated with them, has endorsed or is affiliated with The Sermon Coach.";

export const metadata: Metadata = {
  title: "Mentoring",
  description:
    "They submit their own sermons and keep their own library. Sermon Coach gives them a practical coaching debrief. You see the full evaluation.",
  alternates: { canonical: "/mentoring" },
};

const CHANGES = [
  {
    title: "Better-prepared conversations",
    paragraphs: [
      "Spend your time on the preacher's highest-leverage development need instead of diagnosing everything from scratch.",
      "Sermon Coach brings structured evidence and a consistent framework. You bring what you know about the preacher, his congregation, his context, his calling, and his character.",
    ],
  },
  {
    title: "Patterns across sermons",
    paragraphs: [
      "One sermon may reveal a problem. Several sermons show whether it is recurring, improving, or tied to a particular text or occasion.",
      "You read the evaluations side by side over months and notice what one review never could.",
    ],
  },
  {
    title: "Coaching without taking ownership away",
    paragraphs: [
      "The preacher accepts the relationship, submits the sermon, reads his feedback, and keeps his library.",
      "You bring the wisdom, encouragement, and judgment that software cannot provide.",
    ],
  },
] as const;

const STEPS = [
  {
    lead: "Invite a preacher you are developing.",
    rest: "An associate, a church planter, an intern, or a lay preacher in your church.",
  },
  {
    lead: "He accepts and submits his own sermon.",
    rest: "Nothing is visible to you until he accepts. The sermons are his, in his own account.",
  },
  {
    lead: "He reads the feedback his seat provides.",
    rest: "A coaching debrief and How It Preaches on Apprentice. The full evaluation on Colleague.",
  },
  {
    lead: "You read the full evaluation.",
    rest: "Every seat gives you the complete picture, sermon after sermon.",
  },
  {
    lead: "You meet around one practical focus.",
    rest: "One thing to work on before the next sermon, not eleven.",
  },
  {
    lead: "You decide when the score will help.",
    rest: "On Apprentice, the scored evaluation waits for you. Release it when it will serve his growth rather than distract from it.",
  },
] as const;

const TRUST = [
  "The preacher has his own account and a private library.",
  "The mentoring relationship starts only when he accepts it.",
  "What you can see follows the seat you chose.",
  "You read his evaluations. His manuscripts stay his.",
  "Preachers you mentor never see one another's sermons.",
  "Your sermons are never used to train AI or shared outside the service.",
  "When a relationship ends, any held evaluations are released to him.",
] as const;

const QUESTIONS = [
  {
    q: "What is the difference between Apprentice and Colleague?",
    a: "You read the full evaluation in both. The difference is how feedback reaches the preacher. On Apprentice he reads the coaching debrief and How It Preaches, and the scored evaluation waits for you to release it. On Colleague he reads everything right away.",
  },
  {
    q: "Who sees the full evaluation?",
    a: "You always do. A Colleague preacher sees it immediately. An Apprentice preacher sees it when you release it, and you can release any held evaluation whenever you judge it will help.",
  },
  {
    q: "Who owns the sermon library?",
    a: "The preacher. He submits his own sermons and keeps his own library. A seat gives you visibility. It does not give you ownership.",
  },
  {
    q: "Do I see his manuscripts?",
    a: "No. You read his evaluations, which quote the sermon where it matters. The manuscript stays in his account.",
  },
  {
    q: "What happens when a seat is cancelled or reassigned?",
    a: "The seat stays active through the end of your billing period. When it ends, the relationship closes, you no longer see his library, and any held evaluations are released to him. You can also end a relationship and invite a different preacher to the same seat.",
  },
  {
    q: "Can a preacher continue on his own afterward?",
    a: "Yes. His account, sermons, and evaluations stay with him. He can keep going on his own with a plan or a pack.",
  },
  {
    q: "Does Sermon Coach replace the mentor?",
    a: "No. It gives you structured evidence and a consistent framework. You bring what software cannot: knowledge of the preacher, his congregation, his calling, and his character.",
  },
  {
    q: "Do seat submissions use my own evaluations?",
    a: "No. Each seat has its own monthly submissions. Your plan and packs stay yours, and unused seat submissions don't roll over.",
  },
] as const;

function SeatCard({
  name,
  description,
  price,
  submissions,
  heReads,
  scored,
  href,
  event,
  button,
}: {
  name: string;
  description: string;
  price: string;
  submissions: string;
  heReads: string;
  scored: string;
  href: string;
  event: "apprentice" | "colleague";
  button: string;
}) {
  return (
    <article className="mentoring-seat">
      <h3>{name}</h3>
      <p className="mentoring-seat-desc">{description}</p>
      <p className="mentoring-seat-row">
        <span className="mentoring-seat-label">Price</span>
        <span className="mentoring-seat-value mentoring-seat-price">{price}</span>
      </p>
      <p className="mentoring-seat-row">
        <span className="mentoring-seat-label">Submissions</span>
        <span className="mentoring-seat-value">{submissions}</span>
      </p>
      <p className="mentoring-seat-row">
        <span className="mentoring-seat-label">He reads</span>
        <span className="mentoring-seat-value">{heReads}</span>
      </p>
      <p className="mentoring-seat-row">
        <span className="mentoring-seat-label">You read</span>
        <span className="mentoring-seat-value">Full evaluation</span>
      </p>
      <p className="mentoring-seat-row">
        <span className="mentoring-seat-label">Scored evaluation</span>
        <span className="mentoring-seat-value">{scored}</span>
      </p>
      <MentoringLink href={href} className="btn" event={event}>
        {button}
      </MentoringLink>
    </article>
  );
}

export default function MentoringPage() {
  return (
    <div className="home-v2 mentoring-page">
      <MentoringPageView />
      <HomeV2Header />

      <header className="mentoring-hero">
        <div className="container mentoring-hero-grid">
          <div>
            <div className="eyebrow">For preachers you develop</div>
            <h1>
              Help another preacher grow without starting every review from
              scratch.
            </h1>
            <p className="mentoring-lede">
              They submit their own sermons and keep their own library. Sermon
              Coach gives them a practical coaching debrief. You see the full
              evaluation, recognize patterns across sermons, and walk into the
              mentoring conversation knowing where to focus.
            </p>
            <div className="mentoring-actions">
              <MentoringLink
                href="#seats"
                className="btn btn-lg"
                event="apprentice"
              >
                Add an Apprentice seat
              </MentoringLink>
              <a href="#relationship" className="btn btn-lg btn-secondary">
                See how the relationship works
              </a>
            </div>
          </div>
          <blockquote className="mentoring-quote">
            <p>Sermon Coach does not replace the mentor.</p>
            <p>
              It makes the mentoring conversation more specific, more
              consistent, and more useful.
            </p>
          </blockquote>
        </div>
      </header>

      <section className="section mentoring-section">
        <div className="container">
          <h2>What changes when you mentor with Sermon Coach</h2>
          <div className="grid3">
            {CHANGES.map((item) => (
              <article key={item.title} className="card">
                <h3>{item.title}</h3>
                {item.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </article>
            ))}
          </div>
        </div>
      </section>

      <section
        className="section mentoring-section mentoring-band center"
        id="relationship"
      >
        <div className="container">
          <h2>How the relationship works</h2>
          <p className="mentoring-sub">
            Six steps, and most of the work happens in the conversation, not
            the software.
          </p>
          <ol className="mentoring-steps">
            {STEPS.map((step) => (
              <li key={step.lead}>
                <span>
                  <strong>{step.lead}</strong> {step.rest}
                </span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section mentoring-section">
        <div className="container">
          <div className="mentoring-shots">
            <figure className="mentoring-shot">
              <h3>What he reads on Monday morning</h3>
              <p className="mentoring-shot-body">
                Every debrief ends with one direction for the next sermon and
                a rewrite of his own words showing what it looks like. This is
                the kind of thing you will sit down to talk about.
              </p>
              <img
                src="/images/mentoring/mentoring-debrief-rewrite.jpg"
                alt="A before and after rewrite from a Sermon Coach debrief. The before quotes Jonathan Edwards at length. The after names how the congregation presumes on grace in the preacher's own words."
              />
              <figcaption>
                From the How To Grow section of a coaching debrief, the
                feedback an Apprentice preacher receives.
              </figcaption>
            </figure>
            <figure className="mentoring-shot">
              <h3>What you read before you meet</h3>
              <p className="mentoring-shot-body">
                The full evaluation ranks where he can grow, highest leverage
                first. The first item is usually where your conversation
                starts.
              </p>
              <img
                src="/images/mentoring/mentoring-where-you-can-grow.jpg"
                alt="The Where You Can Grow section of a full Sermon Coach evaluation. Item one, landing the application in one concrete Monday, explains that the sermon's application stays abstract and the closing questions are never answered with a concrete picture."
              />
              <figcaption>
                From the full evaluation, which you read on either seat.
              </figcaption>
            </figure>
          </div>
        </div>
      </section>

      <section
        className="section mentoring-section mentoring-band center"
        id="seats"
      >
        <div className="container">
          <h2>Two kinds of mentoring relationship</h2>
          <p className="mentoring-sub">
            Choose by how feedback should work between you, not by how many
            sermons you expect. Packs are for your sermons. Seats are for
            preachers you develop.
          </p>
          <div className="mentoring-seats">
            <SeatCard
              name="Apprentice"
              description="For an emerging preacher whose full feedback is best interpreted inside the mentoring conversation."
              price="$12 per seat/month"
              submissions="Two a month"
              heReads="Coaching debrief and How It Preaches"
              scored="Held until you release it"
              href={APPRENTICE_SEAT_CHECKOUT_PATH}
              event="apprentice"
              button="Add an Apprentice seat"
            />
            <SeatCard
              name="Colleague"
              description="For an experienced associate or a peer who can work directly with the full evaluation while you keep meeting."
              price="$25 per seat/month"
              submissions="Four a month"
              heReads="Full evaluation"
              scored="Visible to both of you right away"
              href={COLLEAGUE_SEAT_CHECKOUT_PATH}
              event="colleague"
              button="Add a Colleague seat"
            />
          </div>
          <p className="mentoring-classroom">
            Training a seminary class or a church-planting cohort?{" "}
            <a href={CLASSROOM_PATH}>See Classroom</a>, billed by the term
            with one invoice for the institution.
          </p>
        </div>
      </section>

      <section className="section mentoring-section">
        <div className="container">
          <div className="mentoring-trust-head">
            <h2>Trust and privacy</h2>
            <p className="mentoring-trust-intro">
              Read the full commitments in our{" "}
              <a href="/terms.html">Terms</a>,{" "}
              <a href="/privacy.html">Privacy policy</a>, and{" "}
              <a href="/faq.html">FAQ</a>.
            </p>
          </div>
          <ul className="mentoring-trust-list">
            {TRUST.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </section>

      <section
        className="section mentoring-section mentoring-band center"
      >
        <div className="container">
          <h2>Questions mentors ask</h2>
          <div className="mentoring-faq">
            {QUESTIONS.map((item) => (
              <div key={item.q}>
                <h3>{item.q}</h3>
                <p>{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section mentoring-section mentoring-close center">
        <div className="container">
          <h2>Give the next mentoring conversation something concrete to work with.</h2>
          <div className="mentoring-actions">
            <MentoringLink
              href={APPRENTICE_SEAT_CHECKOUT_PATH}
              className="btn btn-lg"
              event="apprentice"
            >
              Add an Apprentice seat
            </MentoringLink>
            <MentoringLink
              href={COLLEAGUE_SEAT_CHECKOUT_PATH}
              className="btn btn-lg btn-secondary"
              event="colleague"
            >
              Add a Colleague seat
            </MentoringLink>
          </div>
        </div>
      </section>

      <HomeV2Footer />
      <p className="legal-disclaimer">{DISCLAIMER}</p>
    </div>
  );
}
