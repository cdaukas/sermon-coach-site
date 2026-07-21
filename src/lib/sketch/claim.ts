import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const SKETCH_CLAIM_COOKIE = "sketch_claim";

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true,
  sameSite: "lax" as const,
  path: "/",
};

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

/**
 * Copy a staged anonymous Sketch read onto the signed-in user.
 * Idempotent and fail-safe: never throws; never deletes staging before
 * readiness_reads insert succeeds.
 */
export async function claimSketchRead(
  userId: string,
  token: string,
): Promise<void> {
  try {
    const trimmed = token.trim();
    if (!userId || !trimmed) {
      await clearSketchClaimCookie();
      return;
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
      return;
    }

    if (!claim) {
      await clearSketchClaimCookie();
      return;
    }

    const expiresAt = claim.expires_at ? Date.parse(claim.expires_at) : NaN;
    if (!Number.isNaN(expiresAt) && expiresAt < Date.now()) {
      await clearSketchClaimCookie();
      return;
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
      return;
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
  } catch (err) {
    console.error("claimSketchRead threw", err);
  }
}
