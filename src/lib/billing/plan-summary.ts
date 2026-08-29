import { mentorSeatDisplayName } from "@/lib/mentor/seat-labels";
import type { MentorSeatType } from "@/lib/mentor/relationships";

export type PlanProfileFields = {
  isComped: boolean;
  subscriptionActive: boolean;
  discountNote: string | null;
  subscriptionInterval: string | null;
  currentPeriodEnd: string | null;
};

export type PlanActions = "none" | "start_coach" | "manage" | "annual_and_manage";

export type PlanCopy = {
  headline: string | null;
  detail: string;
  nudge: string | null;
  actions: PlanActions;
};

const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sept",
  "Oct",
  "Nov",
  "Dec",
] as const;

export function formatPlanDate(
  iso: string,
  now: Date = new Date(),
): string | null {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  const month = MONTH_LABELS[date.getUTCMonth()];
  const day = date.getUTCDate();
  if (date.getUTCFullYear() === now.getUTCFullYear()) {
    return `${month} ${day}`;
  }
  return `${month} ${day}, ${date.getUTCFullYear()}`;
}

function normalizeDiscountNote(value: string | null | undefined): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function resolvePlanCopy(
  profile: PlanProfileFields,
  pack: { remaining: number; expiryIso: string | null },
  now: Date = new Date(),
): PlanCopy {
  if (profile.isComped) {
    return {
      headline: "Your account is comped.",
      detail: "No charges, no renewal date.",
      nudge: null,
      actions: "none",
    };
  }

  if (!profile.subscriptionActive) {
    if (pack.remaining > 0) {
      const expiry = pack.expiryIso ? formatPlanDate(pack.expiryIso, now) : null;
      const detail = expiry
        ? `You have ${pack.remaining} pack credits, good through ${expiry}.`
        : `You have ${pack.remaining} pack credits.`;
      return {
        headline: "No subscription.",
        detail,
        nudge: null,
        actions: "start_coach",
      };
    }
    return {
      headline: "You're not on a plan.",
      detail:
        "Coach is $29 a month for 10 evaluations, cancel anytime, 30 days money back.",
      nudge: null,
      actions: "start_coach",
    };
  }

  const discountNote = normalizeDiscountNote(profile.discountNote);
  const renewal = profile.currentPeriodEnd
    ? formatPlanDate(profile.currentPeriodEnd, now)
    : null;

  if (discountNote) {
    const detail = renewal ? `${discountNote} Renews ${renewal}.` : discountNote;
    return {
      headline: null,
      detail,
      nudge: null,
      actions: "manage",
    };
  }

  if (profile.subscriptionInterval === "month") {
    const detail = renewal
      ? `$29 a month, renews ${renewal}. Ten evaluations a month.`
      : "$29 a month. Ten evaluations a month.";
    return {
      headline: "Coach",
      detail,
      nudge:
        "Switch to annual and pay $290 instead of $348. Two months free.",
      actions: "annual_and_manage",
    };
  }

  if (profile.subscriptionInterval === "year") {
    const detail = renewal
      ? `$290 a year, renews ${renewal}. Ten evaluations a month.`
      : "$290 a year. Ten evaluations a month.";
    return {
      headline: "Coach annual",
      detail,
      nudge: null,
      actions: "manage",
    };
  }

  return {
    headline: "Coach",
    detail: "Ten evaluations a month.",
    nudge: null,
    actions: "manage",
  };
}

export type DevelopingOthersInput = {
  activeSeatTypes: MentorSeatType[];
  pendingSeatTypes: MentorSeatType[];
};

export function developingOthersCopy(
  input: DevelopingOthersInput,
): string | null {
  const { activeSeatTypes, pendingSeatTypes } = input;
  const n = activeSeatTypes.length;
  const p = pendingSeatTypes.length;
  if (n === 0 && p === 0) {
    return null;
  }

  const paidTypes = [...activeSeatTypes, ...pendingSeatTypes];
  const apprentice = paidTypes.filter((type) => type === "debrief").length;
  const colleague = paidTypes.filter((type) => type === "evaluation").length;

  const people =
    n === 1 ? "You're mentoring 1 person." : `You're mentoring ${n} people.`;

  let body: string;
  if (apprentice > 0 && colleague > 0) {
    const total = apprentice * 12 + colleague * 25;
    body = `${people} ${apprentice} Apprentice seats at $12, ${colleague} Colleague seats at $25. $${total} a month.`;
  } else {
    const seatType: MentorSeatType = apprentice > 0 ? "debrief" : "evaluation";
    const name = mentorSeatDisplayName(seatType);
    const price = seatType === "debrief" ? 12 : 25;
    body = `${people} ${name} seats, $${price} a month each.`;
  }

  if (p > 0) {
    const pendingLine =
      p === 1
        ? "1 invitation is still unaccepted and you're paying for those seats."
        : `${p} invitations are still unaccepted and you're paying for those seats.`;
    return `${body} ${pendingLine}`;
  }

  return body;
}
