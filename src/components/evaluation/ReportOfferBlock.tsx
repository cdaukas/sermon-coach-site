"use client";

import { track } from "@vercel/analytics";
import { useEffect } from "react";
import { serifFont, uiFont } from "./shared";

export type ReportOffer =
  | { kind: "zero" }
  | { kind: "remaining"; packRemaining: number };

const COACH_HREF = "/checkout?plan=coach&cadence=monthly&source=report-offer";
const PACK_HREF = "/checkout?pack=pack_2&source=report-offer";
const COACH_FROM_PACK_HREF =
  "/checkout?plan=coach&cadence=monthly&source=report-offer-pack";
const NEXT_EVALUATION_HREF = "/dashboard/sermons/new";

const VIEW_EVENT = "report offer viewed";

const buttonStyle = {
  ...uiFont,
  display: "inline-block",
  padding: "13px 26px",
  background: "#1a2332",
  color: "#faf8f3",
  borderRadius: 4,
  fontSize: 13,
  fontWeight: 600,
  textDecoration: "none",
  lineHeight: 1.2,
} as const;

function remainingLine(count: number): string {
  if (count === 1) {
    return "You have 1 evaluation left.";
  }
  return `You have ${count} evaluations left.`;
}

export function ReportOfferBlock({ offer }: { offer: ReportOffer }) {
  useEffect(() => {
    track(VIEW_EVENT, { variant: offer.kind });
  }, [offer.kind]);

  return (
    <section
      className="screen-only mb-10 px-6 py-8 md:px-9"
      style={{
        background: "var(--sc-panel)",
        boxShadow: "var(--sc-shadow)",
      }}
      data-report-offer={offer.kind}
    >
      {offer.kind === "zero" ? (
        <ZeroPackOffer />
      ) : (
        <RemainingPackOffer packRemaining={offer.packRemaining} />
      )}
    </section>
  );
}

function ZeroPackOffer() {
  return (
    <>
      <h2
        className="mb-4 text-[26px] font-normal leading-snug tracking-tight md:text-[28px]"
        style={{ ...serifFont, color: "var(--sc-ink)" }}
      >
        One sermon shows you this sermon. Several show you your preaching.
      </h2>
      <p
        className="max-w-[52ch] text-[16px] leading-relaxed"
        style={{ ...serifFont, color: "var(--sc-ink-soft)" }}
      >
        Your next evaluation tells you whether what you read here is a pattern
        or a one-off. Coach evaluates every sermon you preach, up to ten a
        month, and Growth reads them together.
      </p>
      <a
        href={COACH_HREF}
        onClick={() => {
          track("report_offer_coach_click", { variant: "zero" });
        }}
        className="mt-6"
        style={buttonStyle}
      >
        Continue with Coach
      </a>
      <p
        className="mt-3 text-[14px] leading-relaxed"
        style={{ ...uiFont, color: "var(--sc-ink-soft)" }}
      >
        $29 a month. Cancel anytime. 30-day money-back guarantee.
      </p>
      <p
        className="mt-5 max-w-[52ch] text-[14px] leading-relaxed"
        style={{ ...uiFont, color: "var(--sc-ink-soft)" }}
      >
        Prefer not to subscribe? Two evaluations for the same $29, one time,
        good for 18 months.
      </p>
      <a
        href={PACK_HREF}
        onClick={() => {
          track("report_offer_pack_click");
        }}
        className="mt-2 inline-block text-[14px] font-semibold no-underline hover:underline"
        style={{ ...uiFont, color: "var(--sc-accent)" }}
      >
        Buy two evaluations
      </a>
    </>
  );
}

function RemainingPackOffer({ packRemaining }: { packRemaining: number }) {
  return (
    <>
      <p
        className="max-w-[52ch] text-[16px] leading-relaxed"
        style={{ ...serifFont, color: "var(--sc-ink)" }}
      >
        {remainingLine(packRemaining)}
      </p>
      <a
        href={NEXT_EVALUATION_HREF}
        onClick={() => {
          track("report_offer_next_eval_click");
        }}
        className="mt-6"
        style={buttonStyle}
      >
        Evaluate your next sermon
      </a>
      <p
        className="mt-5 max-w-[52ch] text-[14px] leading-relaxed"
        style={{ ...uiFont, color: "var(--sc-ink-soft)" }}
      >
        Preaching every week? Coach evaluates every sermon for $29 a month.
      </p>
      <a
        href={COACH_FROM_PACK_HREF}
        onClick={() => {
          track("report_offer_coach_click", { variant: "remaining" });
        }}
        className="mt-2 inline-block text-[14px] font-semibold no-underline hover:underline"
        style={{ ...uiFont, color: "var(--sc-accent)" }}
      >
        See Coach
      </a>
    </>
  );
}
