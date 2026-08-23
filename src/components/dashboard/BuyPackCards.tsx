"use client";

import { useState, type KeyboardEvent } from "react";
import Link from "next/link";

import {
  buildPackCheckoutPath,
  type PackSku,
} from "@/lib/billing/checkout";

const uiFont = {
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
};
const serifFont = { fontFamily: "var(--font-serif)" };

type BuyPackCard = {
  packKey: PackSku;
  sizeLabel: string;
  name: string;
  price: string;
  perEval: string;
  save: string | null;
  tagline: string;
  features: string[];
  ctaLabel: string;
  featured?: boolean;
};

const BUY_PACK_CARDS: BuyPackCard[] = [
  {
    packKey: "pack_2",
    sizeLabel: "2 credits",
    name: "Guest Preacher",
    price: "$29",
    perEval: "$14.50 per credit",
    save: null,
    tagline:
      "For candidating messages, conference keynotes, and the elder who fills in a few times a year.",
    features: ["Two full credits", "Valid 18 months"],
    ctaLabel: "Add 2 credits",
  },
  {
    packKey: "pack_6",
    sizeLabel: "6 credits",
    name: "Pulpit Supply",
    price: "$69",
    perEval: "$11.50 per credit",
    save: "Saves $18 against the 2-pack rate.",
    tagline:
      "For supply preachers, interim pastors, and anyone in the pulpit most months.",
    features: ["Six full credits", "Valid 18 months"],
    ctaLabel: "Add 6 credits",
  },
  {
    packKey: "pack_12",
    sizeLabel: "12 credits",
    name: "Series Prep",
    price: "$109",
    perEval: "$9.08 per credit",
    save: "Saves $65 against the 2-pack rate.",
    tagline:
      "For running a full quarter of sermons through the rubric the week before you preach each one.",
    features: ["Twelve full credits", "Valid 18 months"],
    ctaLabel: "Add 12 credits",
    featured: true,
  },
];

const PACK_ORDER: PackSku[] = ["pack_2", "pack_6", "pack_12"];

function cardFor(packKey: PackSku): BuyPackCard {
  const card = BUY_PACK_CARDS.find((entry) => entry.packKey === packKey);
  if (!card) {
    throw new Error(`Unknown pack ${packKey}`);
  }
  return card;
}

export function BuyPackCards() {
  const [selectedPack, setSelectedPack] = useState<PackSku>("pack_6");
  const card = cardFor(selectedPack);

  function onSizeKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") {
      return;
    }
    event.preventDefault();
    const delta = event.key === "ArrowRight" ? 1 : -1;
    const index = PACK_ORDER.indexOf(selectedPack);
    const next =
      PACK_ORDER[(index + delta + PACK_ORDER.length) % PACK_ORDER.length];
    setSelectedPack(next);
    const group = event.currentTarget.parentElement;
    const buttons = group?.querySelectorAll<HTMLButtonElement>('[role="radio"]');
    buttons?.[PACK_ORDER.indexOf(next)]?.focus();
  }

  return (
    <div className="dashboard-pack-picker">
      <div
        className="dashboard-pack-size-control"
        role="radiogroup"
        aria-label="Pack size"
      >
        {BUY_PACK_CARDS.map((option) => {
          const checked = option.packKey === selectedPack;
          return (
            <button
              key={option.packKey}
              type="button"
              className="dashboard-pack-size-option"
              role="radio"
              aria-checked={checked}
              onClick={() => setSelectedPack(option.packKey)}
              onKeyDown={onSizeKeyDown}
              style={uiFont}
            >
              {option.sizeLabel}
            </button>
          );
        })}
      </div>

      <div
        className={`dashboard-pack-card${card.featured ? " is-featured" : ""}`}
      >
        {card.featured ? (
          <div className="dashboard-pack-ribbon" style={uiFont}>
            Best Pack Value
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
        <div className="dashboard-pack-save" style={uiFont}>
          {card.save ?? ""}
        </div>

        <p className="dashboard-pack-tagline" style={serifFont}>
          {card.tagline}
        </p>

        <ul className="dashboard-pack-features">
          {card.features.map((feature) => (
            <li key={feature} style={uiFont}>
              {feature}
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
    </div>
  );
}
