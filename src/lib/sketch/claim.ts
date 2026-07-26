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
 * Fail-safe: never throws; never deletes staging before readiness_reads
 * insert succeeds. Returns true when a new readiness_reads row was inserted.
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

    const { data: claim, error: lookupError } = await admin
      .from("sketch_claims")
      .select("*")
      .eq("token", trimmed)
      .maybeSingle();

    if (lookupError) {
      console.error("claimSketchRead lookup failed", lookupError);
      await clearSketchClaimCookie();
      return false;
    }

    if (!claim) {
      await clearSketchClaimCookie();
      return false;
    }

    const expiresAt = claim.expires_at ? Date.parse(claim.expires_at) : NaN;
    if (!Number.isNaN(expiresAt) && expiresAt < Date.now()) {
      await clearSketchClaimCookie();
      return false;
    }

    const { error: insertError } = await admin.from("readiness_reads").insert({
      user_id: userId,
      sermon_id: null,
      primary_passage: claim.primary_passage,
      ache: claim.ache,
      big_idea: claim.big_idea,
      gospel_turn: claim.gospel_turn,
      points: claim.points,
      one_person: claim.one_person,
      ending: claim.ending,
      read_output: claim.read_output,
      prompt_version: claim.prompt_version,
      mode: claim.mode,
      status_ache: claim.status_ache,
      status_big_idea: claim.status_big_idea,
      status_gospel_turn: claim.status_gospel_turn,
      status_points: claim.status_points,
      status_one_person: claim.status_one_person,
      status_ending: claim.status_ending,
      seam_hub: claim.seam_hub,
      seam_spokes: claim.seam_spokes,
    });

    if (insertError) {
      console.error("claimSketchRead readiness_reads insert failed", insertError);
      // Leave staging row in place so a later attempt can succeed.
      return false;
    }

    const { error: deleteError } = await admin
      .from("sketch_claims")
      .delete()
      .eq("token", trimmed);

    if (deleteError) {
      console.error("claimSketchRead staging delete failed", deleteError);
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
