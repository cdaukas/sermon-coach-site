/** Coach subscription Stripe price IDs for Checkout Sessions. */
export const COACH_STRIPE_PRICE_IDS = {
  monthly: "price_1Tdz8n2Ea1b3J5pTJDPg4g4D",
  annual: "price_1TdzAO2Ea1b3J5pTp5UaMI85",
} as const;

/** Evaluation pack Stripe price IDs for one-time Checkout Sessions. */
export const PACK_STRIPE_PRICE_IDS = {
  pack_2: "price_1ThKRT2Ea1b3J5pTr5k7ogyX",
  pack_6: "price_1ThKTR2Ea1b3J5pTH7geLyc2",
  pack_12: "price_1ThKUo2Ea1b3J5pTwjlOCQUm",
} as const;

/**
 * Mentoring seat SKUs (Apprentice $12 / Colleague $25). The seat prices live
 * only in the environment: unlike Coach and packs there is no hardcoded
 * fallback, because a fake price ID turns a missing variable into a Stripe
 * resource_missing that reads as a broken link rather than a config gap.
 */
export const MENTOR_SEAT_SKUS = ["debrief", "evaluation"] as const;

/** The environment variable carrying each seat's Stripe price ID. */
export const MENTOR_SEAT_PRICE_ENV_VARS = {
  debrief: "STRIPE_PRICE_MENTOR_DEBRIEF",
  evaluation: "STRIPE_PRICE_MENTOR_EVALUATION",
} as const;

/**
 * Retired Coach Payment Links (rollback reference only — do not wire back without review):
 *   monthly: https://buy.stripe.com/3cI28k09A8CidcUgAl04800
 *   annual:  https://buy.stripe.com/4gMcMY8G6bOuc8Q1Fr04801
 */

export type CoachCadence = keyof typeof COACH_STRIPE_PRICE_IDS;
export type PackSku = keyof typeof PACK_STRIPE_PRICE_IDS;
export type MentorSeatSku = (typeof MENTOR_SEAT_SKUS)[number];

export type CoachCheckoutParams = {
  plan: "coach";
  cadence: CoachCadence;
};

export type PackCheckoutParams = {
  pack: PackSku;
};

export type MentorSeatCheckoutParams = {
  seat: MentorSeatSku;
  quantity: number;
};

type SearchParamReader = {
  get: (key: string) => string | null;
};

export function parseCoachCheckoutParams(
  searchParams: SearchParamReader,
): CoachCheckoutParams | null {
  const plan = searchParams.get("plan");
  const cadence = searchParams.get("cadence");

  if (plan !== "coach") {
    return null;
  }

  if (cadence !== "monthly" && cadence !== "annual") {
    return null;
  }

  return { plan: "coach", cadence };
}

export function parsePackCheckoutParams(
  searchParams: SearchParamReader,
): PackCheckoutParams | null {
  const pack = searchParams.get("pack");

  if (pack !== "pack_2" && pack !== "pack_6" && pack !== "pack_12") {
    return null;
  }

  return { pack };
}

export function parseMentorSeatCheckoutParams(
  searchParams: SearchParamReader,
): MentorSeatCheckoutParams | null {
  const seat = searchParams.get("seat");
  if (seat !== "debrief" && seat !== "evaluation") {
    return null;
  }

  const rawQuantity = searchParams.get("quantity");
  let quantity = 1;
  if (rawQuantity != null && rawQuantity !== "") {
    const parsed = Number.parseInt(rawQuantity, 10);
    if (!Number.isFinite(parsed) || parsed < 1 || parsed > 20) {
      return null;
    }
    quantity = parsed;
  }

  return { seat, quantity };
}

export function buildCheckoutPath(cadence: CoachCadence): string {
  return `/checkout?plan=coach&cadence=${cadence}`;
}

export function buildSignupPath(cadence: CoachCadence): string {
  return `/signup?plan=coach&cadence=${cadence}`;
}

export function buildLoginPath(cadence: CoachCadence): string {
  return `/login?plan=coach&cadence=${cadence}`;
}

export function buildPackCheckoutPath(pack: PackSku): string {
  return `/checkout?pack=${pack}`;
}

export function buildPackSignupPath(pack: PackSku): string {
  return `/signup?pack=${pack}`;
}

export function buildPackLoginPath(pack: PackSku): string {
  return `/login?pack=${pack}`;
}

export function buildMentorSeatCheckoutPath(
  seat: MentorSeatSku,
  quantity = 1,
): string {
  const q = quantity === 1 ? "" : `&quantity=${quantity}`;
  return `/checkout?seat=${seat}${q}`;
}

export function buildMentorSeatSignupPath(
  seat: MentorSeatSku,
  quantity = 1,
): string {
  const q = quantity === 1 ? "" : `&quantity=${quantity}`;
  return `/signup?seat=${seat}${q}`;
}

export function getCoachPriceId(cadence: CoachCadence): string {
  const fromEnv =
    cadence === "monthly"
      ? process.env.STRIPE_PRICE_COACH_MONTHLY
      : process.env.STRIPE_PRICE_COACH_ANNUAL;
  return fromEnv ?? COACH_STRIPE_PRICE_IDS[cadence];
}

export function getPackPriceId(pack: PackSku): string {
  const fromEnv =
    pack === "pack_2"
      ? process.env.STRIPE_PRICE_PACK_2
      : pack === "pack_6"
        ? process.env.STRIPE_PRICE_PACK_6
        : process.env.STRIPE_PRICE_PACK_12;
  return fromEnv ?? PACK_STRIPE_PRICE_IDS[pack];
}

/**
 * Thrown when a mentoring seat price is not configured in this environment.
 * Distinguishable so the checkout route can name the missing variable instead
 * of surfacing a Stripe "No such price" for a fabricated ID.
 */
export class MentorSeatPriceNotConfiguredError extends Error {
  readonly seat: MentorSeatSku;
  readonly envVar: string;

  constructor(seat: MentorSeatSku) {
    const envVar = MENTOR_SEAT_PRICE_ENV_VARS[seat];
    super(
      `Mentor seat price is not configured for "${seat}": set ${envVar} in this environment.`,
    );
    this.name = "MentorSeatPriceNotConfiguredError";
    this.seat = seat;
    this.envVar = envVar;
  }
}

export function getMentorSeatPriceId(seat: MentorSeatSku): string {
  const fromEnv = process.env[MENTOR_SEAT_PRICE_ENV_VARS[seat]];
  if (!fromEnv) {
    throw new MentorSeatPriceNotConfiguredError(seat);
  }
  return fromEnv;
}

export function buildAuthCallbackUrl(
  siteOrigin: string,
  nextPath: string,
): string {
  return `${siteOrigin}/auth/callback?next=${encodeURIComponent(nextPath)}`;
}
