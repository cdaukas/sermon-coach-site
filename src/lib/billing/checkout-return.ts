/** Set when a seat Checkout Session is created. Honored once on the success path. */
export const CHECKOUT_RETURN_COOKIE = "sc_checkout_return";

export const MENTOR_SEAT_CHECKOUT_RETURN = "/dashboard/develop";

const HOUR_SECONDS = 60 * 60;

export function checkoutReturnCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: HOUR_SECONDS,
  };
}

/** True when this request is the Stripe success return we just issued. */
export function checkoutReturnMatches(
  pathname: string,
  cookieValue: string | undefined,
): boolean {
  return Boolean(cookieValue) && cookieValue === pathname;
}
