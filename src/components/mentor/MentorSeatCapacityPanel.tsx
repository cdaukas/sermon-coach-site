import type { MentorSeatCapacity } from "@/lib/mentor/capacity";
import { mentorSeatDisplayName } from "@/lib/mentor/seat-labels";
import { buildMentorSeatCheckoutPath } from "@/lib/billing/checkout";
import type { MentorSeatType } from "@/lib/mentor/relationships";
import Link from "next/link";

const uiFont = { fontFamily: "var(--font-ui)" };
const serifFont = { fontFamily: "var(--font-serif)" };

type MentorSeatCapacityPanelProps = {
  capacity: MentorSeatCapacity;
};

function SeatLine({
  seatType,
  used,
  held,
}: {
  seatType: MentorSeatType;
  used: number;
  held: number;
}) {
  const label = mentorSeatDisplayName(seatType);
  return (
    <p
      className="text-[15px] leading-relaxed"
      style={{ ...uiFont, color: "var(--sc-ink)" }}
    >
      <span className="font-semibold">{label}</span>
      {": "}
      {used} of {held} seat{held === 1 ? "" : "s"} in use
      {held === 0 ? (
        <>
          {" · "}
          <Link
            href={buildMentorSeatCheckoutPath(seatType)}
            className="font-semibold underline-offset-2 hover:underline"
            style={{ color: "var(--sc-accent)" }}
          >
            Add seats
          </Link>
        </>
      ) : null}
    </p>
  );
}

export function MentorSeatCapacityPanel({
  capacity,
}: MentorSeatCapacityPanelProps) {
  const debriefHeld = capacity.debrief.capacity;
  const evaluationHeld = capacity.evaluation.capacity;
  const totalHeld = debriefHeld + evaluationHeld;

  return (
    <section
      className="mb-10 rounded px-5 py-4"
      style={{
        background: "var(--sc-bg)",
        border: "1px solid var(--sc-rule)",
      }}
      aria-labelledby="seat-capacity-heading"
    >
      <h2
        id="seat-capacity-heading"
        className="text-[18px] font-semibold leading-snug tracking-tight"
        style={{ ...serifFont, color: "var(--sc-ink)" }}
      >
        Your seats
      </h2>
      <div className="mt-3 space-y-1.5">
        <SeatLine
          seatType="debrief"
          used={capacity.debrief.used}
          held={debriefHeld}
        />
        <SeatLine
          seatType="evaluation"
          used={capacity.evaluation.used}
          held={evaluationHeld}
        />
      </div>
      {totalHeld === 0 ? (
        <p
          className="mt-3 text-[13px] leading-relaxed"
          style={{ ...uiFont, color: "var(--sc-ink-soft)" }}
        >
          Purchase seats to invite mentees. Complimentary and paid seats show as
          one held number.
        </p>
      ) : null}
      <div className="mt-4 flex flex-wrap gap-4">
        <Link
          href={buildMentorSeatCheckoutPath("debrief")}
          className="text-[13px] font-semibold underline-offset-2 hover:underline"
          style={{ ...uiFont, color: "var(--sc-accent)" }}
        >
          Buy {mentorSeatDisplayName("debrief")} · $12/mo
        </Link>
        <Link
          href={buildMentorSeatCheckoutPath("evaluation")}
          className="text-[13px] font-semibold underline-offset-2 hover:underline"
          style={{ ...uiFont, color: "var(--sc-accent)" }}
        >
          Buy {mentorSeatDisplayName("evaluation")} · $25/mo
        </Link>
      </div>
    </section>
  );
}
