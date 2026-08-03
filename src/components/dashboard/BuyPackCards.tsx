import Link from "next/link";

import { buildPackCheckoutPath } from "@/lib/billing/checkout";

const uiFont = {
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
};
const serifFont = { fontFamily: "var(--font-serif)" };

type BuyPackCard = {
  packKey: "pack_2" | "pack_6" | "pack_12";
  name: string;
  price: string;
  perEval: string;
  tagline: string;
  features: string[];
  ctaLabel: string;
  featured?: boolean;
};

const BUY_PACK_CARDS: BuyPackCard[] = [
  {
    packKey: "pack_2",
    name: "Guest Preacher",
    price: "$29",
    perEval: "$14.50 per credit",
    tagline:
      "Candidating messages, conference keynotes, or the elder filling in a few times a year",
    features: ["Two full credits", "Valid 18 months"],
    ctaLabel: "Add 2 credits",
  },
  {
    packKey: "pack_6",
    name: "Pulpit Supply",
    price: "$69",
    perEval: "$11.50 per credit",
    tagline:
      "Built for supply preachers, interim pastors, and anyone in the pulpit most months",
    features: ["Six full credits", "Valid 18 months"],
    ctaLabel: "Add 6 credits",
  },
  {
    packKey: "pack_12",
    name: "Series Prep",
    price: "$109",
    perEval: "$9.08 per credit",
    tagline:
      "For running a full quarter of sermons through the rubric the week before you preach each one.",
    features: ["Twelve full credits", "Valid 18 months"],
    ctaLabel: "Add 12 credits",
    featured: true,
  },
];

export function BuyPackCards() {
  return (
    <div className="dashboard-pack-grid">
      {BUY_PACK_CARDS.map((card) => (
        <div
          key={card.packKey}
          className={`dashboard-pack-card${card.featured ? " is-featured" : ""}`}
        >
          {card.featured ? (
            <div className="dashboard-pack-ribbon" style={uiFont}>
              Best value
            </div>
          ) : null}

          <div className="dashboard-pack-name" style={serifFont}>
            {card.name}
          </div>

          <div className="dashboard-pack-price" style={serifFont}>
            {card.price}
          </div>
          <div className="dashboard-pack-per" style={uiFont}>
            {card.perEval}
          </div>

          <p className="dashboard-pack-tagline" style={serifFont}>
            {card.tagline}
          </p>

          <ul className="dashboard-pack-features">
            {card.features.map((f, i) => (
              <li key={i} style={uiFont}>
                {f}
              </li>
            ))}
          </ul>

          <Link
            href={buildPackCheckoutPath(card.packKey)}
            className="dashboard-pack-cta"
            style={uiFont}
          >
            {card.ctaLabel}
          </Link>
        </div>
      ))}
    </div>
  );
}
