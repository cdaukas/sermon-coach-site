export const UTM_COOKIE_NAME = "sc_utm";
export const UTM_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;
const UTM_VALUE_MAX_LENGTH = 200;

export type SignupUtm = {
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  landing_path: string | null;
};

const EMPTY_SIGNUP_UTM: SignupUtm = {
  utm_source: null,
  utm_medium: null,
  utm_campaign: null,
  utm_content: null,
  landing_path: null,
};

function clipUtmValue(value: string | null | undefined): string | null {
  if (value == null) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, UTM_VALUE_MAX_LENGTH);
}

export function hasUtmCookie(cookieHeader: string): boolean {
  return cookieHeader.split(";").some((part) => {
    return part.trim().startsWith(`${UTM_COOKIE_NAME}=`);
  });
}

/** First-touch payload when the URL carries any utm_ parameter. Null otherwise. */
export function signupUtmFromSearch(
  search: string,
  pathname: string,
): SignupUtm | null {
  const query = search.startsWith("?") ? search.slice(1) : search;
  const params = new URLSearchParams(query);
  let hasUtm = false;
  for (const key of params.keys()) {
    if (key.startsWith("utm_")) {
      hasUtm = true;
      break;
    }
  }
  if (!hasUtm) return null;

  return {
    utm_source: clipUtmValue(params.get("utm_source")),
    utm_medium: clipUtmValue(params.get("utm_medium")),
    utm_campaign: clipUtmValue(params.get("utm_campaign")),
    utm_content: clipUtmValue(params.get("utm_content")),
    landing_path: clipUtmValue(pathname) ?? "/",
  };
}

export function serializeUtmCookie(utm: SignupUtm): string {
  const value = encodeURIComponent(JSON.stringify(utm));
  return `${UTM_COOKIE_NAME}=${value}; Max-Age=${UTM_COOKIE_MAX_AGE_SECONDS}; Path=/; SameSite=Lax`;
}

/**
 * Cookie string to write, or null when this visit must not write.
 * An existing sc_utm cookie is never replaced.
 */
export function firstTouchUtmCookie(
  search: string,
  pathname: string,
  existingCookie: string,
): string | null {
  if (hasUtmCookie(existingCookie)) return null;
  const utm = signupUtmFromSearch(search, pathname);
  if (!utm) return null;
  return serializeUtmCookie(utm);
}

export function readSignupUtm(cookieHeader: string): SignupUtm {
  const part = cookieHeader
    .split(";")
    .map((entry) => entry.trim())
    .find((entry) => entry.startsWith(`${UTM_COOKIE_NAME}=`));
  if (!part) return { ...EMPTY_SIGNUP_UTM };

  const raw = part.slice(UTM_COOKIE_NAME.length + 1);
  let parsed: unknown;
  try {
    parsed = JSON.parse(decodeURIComponent(raw));
  } catch {
    try {
      parsed = JSON.parse(raw);
    } catch {
      return { ...EMPTY_SIGNUP_UTM };
    }
  }

  if (!parsed || typeof parsed !== "object") return { ...EMPTY_SIGNUP_UTM };
  const record = parsed as Partial<Record<keyof SignupUtm, unknown>>;

  return {
    utm_source: clipUtmValue(
      typeof record.utm_source === "string" ? record.utm_source : null,
    ),
    utm_medium: clipUtmValue(
      typeof record.utm_medium === "string" ? record.utm_medium : null,
    ),
    utm_campaign: clipUtmValue(
      typeof record.utm_campaign === "string" ? record.utm_campaign : null,
    ),
    utm_content: clipUtmValue(
      typeof record.utm_content === "string" ? record.utm_content : null,
    ),
    landing_path: clipUtmValue(
      typeof record.landing_path === "string" ? record.landing_path : null,
    ),
  };
}
