import Link from "next/link";
import { buildMentorSeatCheckoutPath } from "@/lib/billing/checkout";

const uiFont = { fontFamily: "var(--font-ui)" };
const serifFont = { fontFamily: "var(--font-serif)" };

const SEATS = [
  {
    seat: "debrief" as const,
    name: "Apprentice",
    price: "$12 a month",
    tagline:
      "For the associate, the lay preacher, the church planter you are bringing along.",
    body: "Two submissions a month. They read the coaching debrief and How It Preaches. The scored evaluation is generated and held until you release it.",
    cta: "Add an Apprentice seat",
  },
  {
    seat: "evaluation" as const,
    name: "Colleague",
    price: "$25 a month",
    tagline: "For the peer you are reading, and who is ready to see everything.",
    body: "Four submissions a month. They read everything the moment it is ready, including the score.",
    cta: "Add a Colleague seat",
  },
] as const;

export function MentorSeatPurchaseOptions() {
  return (
    <div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {SEATS.map((seat) => (
          <article
            key={seat.seat}
            className="flex flex-col rounded px-6 py-6"
            style={{
              background: "var(--sc-panel)",
              border: "1px solid var(--sc-rule)",
            }}
          >
            <h3
              className="text-[22px] font-semibold leading-snug tracking-tight"
              style={{ ...serifFont, color: "var(--sc-ink)" }}
            >
              {seat.name}
            </h3>
            <p
              className="mt-2 text-[16px] font-semibold leading-snug"
              style={{ ...uiFont, color: "var(--sc-ink)" }}
            >
              {seat.price}
            </p>
            <p
              className="mt-3 text-[15px] leading-relaxed"
              style={{ ...uiFont, color: "var(--sc-ink-mid)" }}
            >
              {seat.tagline}
            </p>
            <p
              className="mt-3 flex-1 text-[15px] leading-relaxed"
              style={{ ...uiFont, color: "var(--sc-ink-mid)" }}
            >
              {seat.body}
            </p>
            <Link
              href={buildMentorSeatCheckoutPath(seat.seat)}
              className="mt-6 inline-flex items-center justify-center rounded border px-7 py-3.5 text-sm font-semibold tracking-wide no-underline transition-opacity hover:opacity-90"
              style={{
                ...uiFont,
                background: "var(--sc-ink)",
                color: "var(--sc-bg)",
                borderColor: "var(--sc-ink)",
              }}
            >
              {seat.cta}
            </Link>
          </article>
        ))}
      </div>
      <p
        className="mt-6 text-[14px] leading-relaxed"
        style={{ ...uiFont, color: "var(--sc-ink-soft)" }}
      >
        Both seats give them their own account and their own library, which you
        can read.
      </p>
    </div>
  );
}
