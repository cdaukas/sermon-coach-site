import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const SKETCH_CLAIM_COOKIE = "sketch_claim";

/** Set when a claim inserts a readiness_reads row — lets /start show confirmation
 *  after /auth/confirm already consumed the staging token. */
export const SKETCH_CLAIM_OK_COOKIE = "sketch_claim_ok";

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true,
  sameSite: "lax" as const,
  path: "/",
};

const CLAIM_OK_MAX_AGE_SECONDS = 60 * 10;

/** Resolve claim token: httpOnly cookie first, then ?claim= query param. */
export function resolveSketchClaimToken(
  cookieToken: string | undefined | null,
  claimParam: string | undefined | null,
): string | null {
  const fromCookie = cookieToken?.trim();
  if (fromCookie) return fromCookie;
  const fromParam = claimParam?.trim();
  if (fromParam) return fromParam;
  return null;
}

/** Extract ?claim= from a next path such as `/start?claim=<token>`. */
export function claimTokenFromNextPath(nextPath: string): string | null {
  try {
    const url = new URL(nextPath, "https://placeholder.local");
    return url.searchParams.get("claim")?.trim() || null;
  } catch {
    return null;
  }
}

export function sketchClaimCookieOptions(maxAge: number) {
  return { ...COOKIE_OPTIONS, maxAge };
}

export async function clearSketchClaimCookie(): Promise<void> {
  try {
    const jar = await cookies();
    jar.set(SKETCH_CLAIM_COOKIE, "", sketchClaimCookieOptions(0));
  } catch (err) {
    console.error("clearSketchClaimCookie failed", err);
  }
}

export async function markSketchClaimOkCookie(): Promise<void> {
  try {
    const jar = await cookies();
    jar.set(
      SKETCH_CLAIM_OK_COOKIE,
      "1",
      sketchClaimCookieOptions(CLAIM_OK_MAX_AGE_SECONDS),
    );
  } catch (err) {
    console.error("markSketchClaimOkCookie failed", err);
  }
}

export async function clearSketchClaimOkCookie(): Promise<void> {
  try {
    const jar = await cookies();
    jar.set(SKETCH_CLAIM_OK_COOKIE, "", sketchClaimCookieOptions(0));
  } catch (err) {
    console.error("clearSketchClaimOkCookie failed", err);
  }
}

/**
 * Copy a staged anonymous Sketch read onto the signed-in user.
 * Fail-safe: never throws. Attach is serialized in claim_sketch_read
 * (SELECT … FOR UPDATE → insert → delete staging). Returns true when a
 * new readiness_reads row was inserted.
 */
export async function claimSketchRead(
  userId: string,
  token: string,
): Promise<boolean> {
  try {
    const trimmed = token.trim();
    if (!userId || !trimmed) {
      await clearSketchClaimCookie();
      return false;
    }

    const admin = createAdminClient();
    const { data: inserted, error: claimError } = await admin.rpc(
      "claim_sketch_read",
      { p_user_id: userId, p_token: trimmed },
    );

    if (claimError) {
      console.error("claimSketchRead rpc failed", claimError);
      await clearSketchClaimCookie();
      return false;
    }

    if (!inserted) {
      await clearSketchClaimCookie();
      return false;
    }

    try {
      const supabase = await createClient();
      const { data: profile } = await supabase
        .from("profiles")
        .select("acquisition_source_at")
        .eq("id", userId)
        .maybeSingle();

      if (profile?.acquisition_source_at == null) {
        const { error: attrError } = await supabase.rpc(
          "set_acquisition_source",
          { p_source: "sketch", p_detail: null },
        );
        if (attrError) {
          console.error("claimSketchRead set_acquisition_source failed", attrError);
        }
      }
    } catch (attrErr) {
      console.error("claimSketchRead attribution threw", attrErr);
    }

    await clearSketchClaimCookie();
    await markSketchClaimOkCookie();
    return true;
  } catch (err) {
    console.error("claimSketchRead threw", err);
    return false;
  }
}
