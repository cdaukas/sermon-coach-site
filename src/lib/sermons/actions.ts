"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  DELETE_IN_PROGRESS_MESSAGE,
  DELETE_PUBLIC_SAMPLE_MESSAGE,
} from "./messages";
import type {
  CreateSermonInput,
  CreateSermonResult,
  SermonWriteResult,
} from "./types";

function normalizePrimaryPassage(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function validateInput({ title, content }: CreateSermonInput): string | null {
  if (!title.trim()) {
    return "Title is required.";
  }

  if (!content.trim()) {
    return "Manuscript is required.";
  }

  return null;
}

function revalidateSermonSurfaces(sermonId: string): void {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/growth");
  revalidatePath(`/dashboard/sermons/${sermonId}`);
}

async function versionIdsForSermon(
  supabase: Awaited<ReturnType<typeof createClient>>,
  sermonId: string,
): Promise<string[]> {
  const { data, error } = await supabase
    .from("sermon_versions")
    .select("id")
    .eq("sermon_id", sermonId);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => row.id);
}

export async function createSermon(
  input: CreateSermonInput,
): Promise<CreateSermonResult> {
  const title = input.title.trim();
  const content = input.content.trim();
  const primaryPassage = normalizePrimaryPassage(input.primaryPassage);
  const validationError = validateInput({ title, content });

  if (validationError) {
    return { ok: false, error: validationError };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "You must be signed in to save a sermon." };
  }

  const { data: sermon, error: sermonError } = await supabase
    .from("sermons")
    .insert({ user_id: user.id, title, primary_passage: primaryPassage })
    .select("id")
    .single();

  if (sermonError || !sermon) {
    return {
      ok: false,
      error: sermonError?.message ?? "Failed to save sermon.",
    };
  }

  const { error: versionError } = await supabase.from("sermon_versions").insert({
    sermon_id: sermon.id,
    content,
    version_number: 1,
  });

  if (versionError) {
    await supabase.from("sermons").delete().eq("id", sermon.id);
    return { ok: false, error: versionError.message };
  }

  return { ok: true, sermonId: sermon.id };
}

/**
 * Classroom restriction is unenforced: student seats are not modeled
 * (zero classroom profiles; plan_tier does not identify a student seat).
 * sermons_update_own already limits this write to the sermon owner.
 */
export async function toggleGrowthExclusion(
  sermonId: string,
  excluded: boolean,
): Promise<SermonWriteResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "You must be signed in." };
  }

  const { data, error } = await supabase
    .from("sermons")
    .update({ excluded_from_growth: excluded })
    .eq("id", sermonId)
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .select("id")
    .maybeSingle();

  if (error) {
    return { ok: false, error: error.message };
  }

  if (!data) {
    return { ok: false, error: "Sermon not found." };
  }

  revalidateSermonSurfaces(sermonId);
  return { ok: true };
}

/**
 * Classroom restriction is unenforced: student seats are not modeled
 * (zero classroom profiles; plan_tier does not identify a student seat).
 * sermons_update_own already limits this write to the sermon owner.
 */
export async function deleteSermon(
  sermonId: string,
): Promise<SermonWriteResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "You must be signed in." };
  }

  const versionIds = await versionIdsForSermon(supabase, sermonId);

  if (versionIds.length > 0) {
    const { count: inFlight, error: inFlightError } = await supabase
      .from("sermon_evaluations")
      .select("id", { count: "exact", head: true })
      .in("sermon_version_id", versionIds)
      .in("status", ["pending", "running"]);

    if (inFlightError) {
      return { ok: false, error: inFlightError.message };
    }

    if ((inFlight ?? 0) > 0) {
      return { ok: false, error: DELETE_IN_PROGRESS_MESSAGE };
    }

    const { count: publicSample, error: sampleError } = await supabase
      .from("sermon_evaluations")
      .select("id", { count: "exact", head: true })
      .in("sermon_version_id", versionIds)
      .eq("is_public_sample", true);

    if (sampleError) {
      return { ok: false, error: sampleError.message };
    }

    if ((publicSample ?? 0) > 0) {
      return { ok: false, error: DELETE_PUBLIC_SAMPLE_MESSAGE };
    }
  }

  const { data, error } = await supabase
    .from("sermons")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", sermonId)
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .select("id")
    .maybeSingle();

  if (error) {
    return { ok: false, error: error.message };
  }

  if (!data) {
    return { ok: false, error: "Sermon not found." };
  }

  revalidateSermonSurfaces(sermonId);
  return { ok: true };
}

/**
 * Classroom restriction is unenforced: student seats are not modeled
 * (zero classroom profiles; plan_tier does not identify a student seat).
 * sermons_update_own already limits this write to the sermon owner.
 */
export async function restoreSermon(
  sermonId: string,
): Promise<SermonWriteResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "You must be signed in." };
  }

  const { data, error } = await supabase
    .from("sermons")
    .update({ deleted_at: null })
    .eq("id", sermonId)
    .eq("user_id", user.id)
    .not("deleted_at", "is", null)
    .select("id")
    .maybeSingle();

  if (error) {
    return { ok: false, error: error.message };
  }

  if (!data) {
    return { ok: false, error: "Sermon not found." };
  }

  revalidateSermonSurfaces(sermonId);
  return { ok: true };
}
