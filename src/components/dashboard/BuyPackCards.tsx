import Link from "next/link";

import { buildPackCheckoutPath } from "@/lib/billing/checkout";

const uiFont = { fontFamily: "var(--font-ui)" };

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
    perEval: "$14.50 per evaluation",
    tagline: "For the occasional guest spot.",
    features: [
      "Two full evaluations",
      "Valid 18 months",
      "Candidating messages, conference keynotes, or the elder filling in a few times a year",
    ],
    ctaLabel: "Add 2 evaluations",
  },
  {
    packKey: "pack_6",
    name: "Pulpit Supply",
    price: "$69",
    perEval: "$11.50 per evaluation",
    tagline: "For steady pulpit rotation.",
    features: [
      "Six full evaluations",
      "Valid 18 months",
      "Built for supply preachers, interim pastors, and anyone in the pulpit most months",
    ],
    ctaLabel: "Add 6 evaluations",
  },
  {
    packKey: "pack_12",
    name: "Series Prep",
    price: "$109",
    perEval: "$9.08 per evaluation",
    tagline: "Launch your next series with confidence.",
    features: [
      "Twelve full evaluations",
      "Valid 18 months",
      "Run every manuscript through the rubric the week before you preach it. A full quarter of sermons, twelve honest reads, one series done right.",
    ],
    ctaLabel: "Add 12 evaluations",
    featured: true,
  },
];

export function BuyPackCards() {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {BUY_PACK_CARDS.map((card) => (
        <div
          key={card.packKey}
          className="relative flex flex-col rounded border px-5 pb-5"
          style={{
            background: "var(--sc-panel)",
            borderColor: "var(--sc-rule)",
            borderTopWidth: card.featured ? "3px" : "1px",
            borderTopColor: card.featured ? "var(--sc-accent-soft)" : "var(--sc-rule)",
            paddingTop: card.featured ? "30px" : "20px",
            boxShadow: card.featured
              ? "0 12px 32px rgba(26,35,50,.10), 0 4px 12px rgba(26,35,50,.06)"
              : "0 1px 3px rgba(26,35,50,.06), 0 1px 2px rgba(26,35,50,.04)",
          }}
        >
          {card.featured ? (
            <div
              className="absolute left-1/2 -translate-x-1/2 -top-[11px] rounded px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em]"
              style={{ ...uiFont, background: "var(--sc-accent-soft)", color: "var(--sc-ink)" }}
            >
              Best Pack Value
            </div>
          ) : null}

          <div className="text-[18px] font-semibold" style={{ ...uiFont, color: "var(--sc-ink)" }}>
            {card.name}
          </div>

          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-[26px] font-semibold" style={{ ...uiFont, color: "var(--sc-ink)" }}>
              {card.price}
            </span>
          </div>
          <div className="text-[12px]" style={{ ...uiFont, color: "var(--sc-ink-soft)" }}>
            {card.perEval}
          </div>

          <p className="mt-2 text-[13px] italic" style={{ color: "var(--sc-ink-soft)" }}>
            {card.tagline}
          </p>

          <ul className="mt-3 mb-4 flex-grow list-none space-y-2">
            {card.features.map((f, i) => (
              <li key={i} className="relative pl-5 text-[13px]" style={{ color: "var(--sc-ink-mid)" }}>
                <span className="absolute left-0 font-bold" style={{ ...uiFont, color: "var(--sc-accent)" }}>
                  {"\u2713"}
                </span>
                {f}
              </li>
            ))}
          </ul>

          <Link
            href={buildPackCheckoutPath(card.packKey)}
            className="block w-full rounded border px-4 py-2.5 text-center text-[13px] font-semibold tracking-wide no-underline transition-colors"
            style={{ ...uiFont, background: "var(--sc-ink)", color: "var(--sc-bg)", borderColor: "var(--sc-ink)" }}
          >
            {card.ctaLabel}
          </Link>
        </div>
      ))}
    </div>
  );
}
