/** Coach subscription Stripe Payment Links — single source of truth for the app. */
export const COACH_STRIPE_CHECKOUT_URLS = {
  monthly: "https://buy.stripe.com/3cI28k09A8CidcUgAl04800",
  annual: "https://buy.stripe.com/4gMcMY8G6bOuc8Q1Fr04801",
} as const;

export type CoachCadence = keyof typeof COACH_STRIPE_CHECKOUT_URLS;

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

export function getCoachStripeCheckoutUrl(cadence: CoachCadence): string {
  return COACH_STRIPE_CHECKOUT_URLS[cadence];
}

export function buildAuthCallbackUrl(
  siteOrigin: string,
  nextPath: string,
): string {
  return `${siteOrigin}/auth/callback?next=${encodeURIComponent(nextPath)}`;
}
