import Link from "next/link";
import {
  ActionArrow,
  BillingCard,
  MentoringCardIcon,
} from "@/components/dashboard/BillingCard";
import { buildMentorSeatCheckoutPath } from "@/lib/billing/checkout";

const uiFont = { fontFamily: "var(--font-ui)" };
const serifFont = { fontFamily: "var(--font-serif)" };

/**
 * Deliberately NOT `goldActionStyle`, which is #a67c2e and measures 3.79:1 on
 * the white card. `--sc-gold` is #8a6624, 5.1:1, which clears AA for normal
 * text. This is a second gold on the page on purpose: it is the value the
 * sitewide contrast fix should adopt, and no existing card is changed here.
 */
const seatLinkStyle = {
  ...uiFont,
  fontSize: 13,
  fontWeight: 600,
  color: "var(--sc-gold)",
} as const;

/**
 * Shown on Billing to a paying or comped preacher who holds no mentor seat.
 * A subscriber may never see the pricing page again after converting, so the
 * seat is otherwise invisible to him. Names one product and routes the rest;
 * a billing page listing four priced products reads as an upsell.
 *
 * Mutually exclusive with DevelopingOthersCard, which covers the seat holder,
 * so the shared "Developing others" eyebrow never appears twice at once.
 */
export function MentorSeatDiscoveryCard() {
  return (
    <BillingCard aria-label="Bringing someone along" icon={<MentoringCardIcon />}>
      <h2
        className="m-0"
        style={{
          ...serifFont,
          fontSize: 17,
          fontWeight: 600,
          color: "var(--sc-ink)",
        }}
      >
        Bringing someone along?
      </h2>
      <p
        className="mt-1 mb-0 leading-relaxed"
        style={{ ...uiFont, fontSize: 13, color: "var(--sc-ink-soft)" }}
      >
        A seat gives another preacher his own account, his own submissions, and
        a library you can read. He gets coaching. You decide when he sees the
        score.
      </p>
      <p
        className="mt-3 mb-0 leading-relaxed"
        style={{ ...uiFont, fontSize: 13, color: "var(--sc-ink-soft)" }}
      >
        <Link
          href={buildMentorSeatCheckoutPath("debrief")}
          className="no-underline hover:underline"
          style={seatLinkStyle}
        >
          $12 a month for a seat
        </Link>
        {". "}
        <Link
          href="/sample-debrief"
          className="no-underline hover:underline"
          style={seatLinkStyle}
        >
          See what he reads
          <ActionArrow />
        </Link>
      </p>
      <p
        className="mt-4 mb-0 leading-relaxed"
        style={{ ...uiFont, fontSize: 12, color: "var(--sc-ink-soft)" }}
      >
        Running a staff, a class, or a training lab?{" "}
        <Link
          href="/pricing.html"
          className="no-underline hover:underline"
          style={{ ...seatLinkStyle, fontSize: 12 }}
        >
          See seats and pricing
          <ActionArrow />
        </Link>
      </p>
    </BillingCard>
  );
}
