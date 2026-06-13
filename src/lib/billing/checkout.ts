/** Coach subscription Stripe price IDs for Checkout Sessions. */
export const COACH_STRIPE_PRICE_IDS = {
  monthly: "price_1Tdz8n2Ea1b3J5pTJDPg4g4D",
  annual: "price_1TdzAO2Ea1b3J5pTp5UaMI85",
} as const;

/**
 * Retired Coach Payment Links (rollback reference only — do not wire back without review):
 *   monthly: https://buy.stripe.com/3cI28k09A8CidcUgAl04800
 *   annual:  https://buy.stripe.com/4gMcMY8G6bOuc8Q1Fr04801
 */

export type CoachCadence = keyof typeof COACH_STRIPE_PRICE_IDS;

export type CoachCheckoutParams = {
  plan: "coach";
  cadence: CoachCadence;
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

export function buildCheckoutPath(cadence: CoachCadence): string {
  return `/checkout?plan=coach&cadence=${cadence}`;
}

export function buildSignupPath(cadence: CoachCadence): string {
  return `/signup?plan=coach&cadence=${cadence}`;
}

export function buildLoginPath(cadence: CoachCadence): string {
  return `/login?plan=coach&cadence=${cadence}`;
}

export function getCoachPriceId(cadence: CoachCadence): string {
  const fromEnv =
    cadence === "monthly"
      ? process.env.STRIPE_PRICE_COACH_MONTHLY
      : process.env.STRIPE_PRICE_COACH_ANNUAL;
  return fromEnv ?? COACH_STRIPE_PRICE_IDS[cadence];
}

export function buildAuthCallbackUrl(
  siteOrigin: string,
  nextPath: string,
): string {
  return `${siteOrigin}/auth/callback?next=${encodeURIComponent(nextPath)}`;
}
