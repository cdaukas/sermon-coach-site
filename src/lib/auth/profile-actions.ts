"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ProfileActionResult =
  | { ok: true }
  | { ok: false; error: string };

function friendlyRpcError(message: string, fallback: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("display_name must be at most")) {
    return "Name must be at most 80 characters.";
  }
  if (lower.includes("church_name must be at most")) {
    return "Church must be at most 120 characters.";
  }
  if (lower.includes("not authenticated")) {
    return "You must be signed in.";
  }
  return fallback;
}

export async function saveProfileDetails(
  displayName: string,
  churchName: string,
): Promise<ProfileActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "You must be signed in." };
  }

  const { error } = await supabase.rpc("set_profile_details", {
    p_display_name: displayName,
    p_church_name: churchName,
  });

  if (error) {
    return {
      ok: false,
      error: friendlyRpcError(
        error.message,
        "Could not save your details. Please try again.",
      ),
    };
  }

  revalidatePath("/dashboard/account");
  revalidatePath("/dashboard/sermons/new");
  return { ok: true };
}

export async function saveNewsletterPreference(
  optedIn: boolean,
): Promise<ProfileActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "You must be signed in." };
  }

  const { error } = await supabase.rpc("set_newsletter_opted_in", {
    p_opted_in: optedIn,
  });

  if (error) {
    return {
      ok: false,
      error: "Could not update the weekly post preference. Please try again.",
    };
  }

  revalidatePath("/dashboard/account");
  return { ok: true };
}
