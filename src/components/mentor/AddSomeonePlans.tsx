import Link from "next/link";
import type { ReactNode } from "react";

const uiFont = { fontFamily: "var(--font-ui)" };
const serifFont = { fontFamily: "var(--font-serif)" };

const CTA_LABEL = "Tell us who you're developing";
const CTA_HREF = "mailto:chris@sermoncoach.online?subject=Mentoring%20seat";

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
  startHere?: boolean;
};

const CARDS: SeatCard[] = [
  {
    name: "Apprentice",
    priceLead: "$",
    priceAmount: "12",
    priceSuffix: "/mo",
    priceNote: "Per seat, billed monthly.",
    tagline:
      "For the associate, the lay preacher, the church planter you are bringing along.",
    features: [
      "Two submissions a month, drawn from the seat and not from their credits",
      "They read the coaching debrief and How It Preaches",
      "The scored evaluation is generated and held until you release it",
      "Their own account and their own library, which you can read",
    ],
    ctaLabel: CTA_LABEL,
    ctaHref: CTA_HREF,
    startHere: true,
  },
  {
    name: "Colleague",
    priceLead: "$",
    priceAmount: "25",
    priceSuffix: "/mo",
    priceNote: "Per seat, billed monthly.",
    tagline: "For the peer you are reading, and who is ready to see everything.",
    features: [
      "Four submissions a month, drawn from the seat",
      "They read everything the moment it is ready, including the score",
      "Their own account and their own library, which you can read",
    ],
    ctaLabel: CTA_LABEL,
    ctaHref: CTA_HREF,
  },
];

export function AddSomeonePlans() {
  return (
    <div className="develop-seats-grid develop-seats-grid--two">
      {CARDS.map((card) => (
        <article
          key={card.name}
          className={`develop-seat-card${card.startHere ? " is-start-here" : ""}`}
        >
          {card.startHere ? (
            <div className="develop-seat-ribbon" style={uiFont}>
              Start Here
            </div>
          ) : null}
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
  );
}
