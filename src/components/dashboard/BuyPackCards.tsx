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
    <div className="grid items-stretch gap-3 sm:grid-cols-3">
      {BUY_PACK_CARDS.map((card) => (
        <div
          key={card.packKey}
          className="relative flex flex-col rounded border px-5 pb-5"
          style={{
            background: "var(--sc-panel)",
            borderColor: "var(--sc-rule)",
            borderTopWidth: card.featured ? "3px" : "1px",
            borderTopColor: card.featured
              ? "var(--sc-accent-soft)"
              : "var(--sc-rule)",
            paddingTop: card.featured ? "30px" : "20px",
            boxShadow: card.featured
              ? "0 12px 32px rgba(26,35,50,.10), 0 4px 12px rgba(26,35,50,.06)"
              : "0 1px 3px rgba(26,35,50,.06), 0 1px 2px rgba(26,35,50,.04)",
          }}
        >
          {card.featured ? (
            <div
              style={{
                ...uiFont,
                position: "absolute",
                top: -11,
                left: "50%",
                transform: "translateX(-50%)",
                background: "var(--sc-accent-soft)",
                color: "var(--sc-ink)",
                padding: "4px 12px",
                borderRadius: 3,
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                whiteSpace: "nowrap",
              }}
            >
              Best value
            </div>
          ) : null}

          <div
            className="sc-heading text-[18px] font-semibold"
            style={{ color: "var(--sc-ink)" }}
          >
            {card.name}
          </div>

          <div className="mt-1 flex items-baseline gap-2">
            <span
              className="text-[26px] font-semibold"
              style={{ ...uiFont, color: "var(--sc-ink)" }}
            >
              {card.price}
            </span>
          </div>
          <div
            className="text-[12px]"
            style={{ ...uiFont, color: "var(--sc-ink-soft)" }}
          >
            {card.perEval}
          </div>

          <p
            className="pack-tagline mt-2 mb-0"
            style={{
              ...serifFont,
              fontSize: 14,
              fontStyle: "italic",
              color: "#4a5568",
            }}
          >
            {card.tagline}
          </p>

          <ul
            className="mt-3 mb-4 list-none space-y-2"
            style={{ flexGrow: 1 }}
          >
            {card.features.map((f, i) => (
              <li
                key={i}
                className="relative pl-5 text-[13px]"
                style={{ color: "var(--sc-ink-mid)" }}
              >
                <span
                  className="absolute left-0 font-bold"
                  style={{ ...uiFont, color: "var(--sc-accent)" }}
                >
                  {"\u2713"}
                </span>
                {f}
              </li>
            ))}
          </ul>

          <Link
            href={buildPackCheckoutPath(card.packKey)}
            className="mt-auto block w-full rounded border px-4 py-2.5 text-center text-[13px] font-semibold tracking-wide no-underline transition-colors"
            style={{
              ...uiFont,
              background: "var(--sc-ink)",
              color: "var(--sc-bg)",
              borderColor: "var(--sc-ink)",
            }}
          >
            {card.ctaLabel}
          </Link>
        </div>
      ))}
    </div>
  );
}
