import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Develop others",
};

const uiFont = { fontFamily: "var(--font-ui)" };
const serifFont = { fontFamily: "var(--font-serif)" };

const CTA_LABEL = "Tell us who you're developing";
const CTA_HREF =
  "mailto:chris@sermoncoach.online?subject=Develop%20Others%20seat";
const CLASSROOM_CTA_LABEL = "Tell us about your class";
const CLASSROOM_CTA_HREF =
  "mailto:chris@sermoncoach.online?subject=Classroom%20interest";

type SeatCard = {
  name: string;
  priceLead: string;
  priceAmount: string;
  priceSuffix: string;
  priceNote: string | null;
  tagline: string;
  features: ReactNode[];
  ctaLabel: string;
  ctaHref: string;
};

const CARDS: SeatCard[] = [
  {
    name: "Apprentice",
    priceLead: "$",
    priceAmount: "12",
    priceSuffix: "per seat / mo",
    priceNote: null,
    tagline:
      "For the associate, the lay preacher, the church planter you are bringing along.",
    features: [
      "Two submissions a month, drawn from the seat and not from your credits",
      "He reads the coaching debrief and How It Preaches",
      "The scored evaluation is generated and held until you release it",
      "His own account and his own library, which you can read",
    ],
    ctaLabel: CTA_LABEL,
    ctaHref: CTA_HREF,
  },
  {
    name: "Colleague",
    priceLead: "$",
    priceAmount: "25",
    priceSuffix: "per seat / mo",
    priceNote: null,
    tagline: "For the peer you are reading, and who is ready to see everything.",
    features: [
      "Four submissions a month, drawn from the seat",
      "He reads everything the moment it is ready, including the score",
      "His own account and his own library, which you can read",
    ],
    ctaLabel: CTA_LABEL,
    ctaHref: CTA_HREF,
  },
  {
    name: "Classroom",
    priceLead: "from $",
    priceAmount: "125",
    priceSuffix: "/ mo",
    priceNote: "$25 per seat, five-seat minimum. Billed by the term.",
    tagline:
      "For institutions training preachers — a seminary course, a church planting cohort, a denominational track.",
    features: [
      <>
        <strong>$25 per seat, per month</strong>
        {" — billed by the term, with a five-seat floor"}
      </>,
      <>
        <strong>4 credits per seat</strong>
        {" each month, pooled across the class"}
      </>,
      "The instructor seat is free",
      "Everything in Coach for every preacher in the class",
      "Each preacher keeps a private library — visible to the instructor, never to classmates",
      "One invoice for the institution. We set up the class by hand before your term starts",
    ],
    ctaLabel: CLASSROOM_CTA_LABEL,
    ctaHref: CLASSROOM_CTA_HREF,
  },
];

export default function DevelopPage() {
  return (
    <main
      className="develop-seats-page rounded px-8 py-10"
      style={{
        background: "var(--sc-panel)",
        border: "1px solid var(--sc-rule)",
        boxShadow: "var(--sc-shadow-lift)",
      }}
    >
      <div className="mb-8">
        <h1
          className="text-[32px] font-semibold leading-tight tracking-tight"
          style={{ ...serifFont, color: "var(--sc-ink)" }}
        >
          Develop others
        </h1>
        <p
          className="mt-3 max-w-2xl text-[15px] leading-relaxed"
          style={{ ...uiFont, color: "var(--sc-ink-mid)" }}
        >
          A Coach subscription evaluates your own preaching; a seat gives
          another preacher his own account, his own submissions, and a library
          you can read.
        </p>
      </div>

      <div className="develop-seats-grid">
        {CARDS.map((card) => (
          <article key={card.name} className="develop-seat-card">
            <h2 className="develop-seat-name" style={serifFont}>
              {card.name}
            </h2>
            <p className="develop-seat-tagline" style={serifFont}>
              {card.tagline}
            </p>
            <div className="develop-seat-price-row" style={serifFont}>
              <span className="develop-seat-price">
                <span className="develop-seat-currency">{card.priceLead}</span>
                {card.priceAmount}
              </span>
              <span className="develop-seat-period" style={uiFont}>
                {card.priceSuffix}
              </span>
            </div>
            {card.priceNote ? (
              <p className="develop-seat-note" style={uiFont}>
                {card.priceNote}
              </p>
            ) : null}
            <ul className="develop-seat-features" style={uiFont}>
              {card.features.map((feature, index) => (
                <li key={`${card.name}-${index}`}>{feature}</li>
              ))}
            </ul>
            <Link href={card.ctaHref} className="develop-seat-cta" style={uiFont}>
              {card.ctaLabel}
            </Link>
          </article>
        ))}
      </div>
    </main>
  );
}
