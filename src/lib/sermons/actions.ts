"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { CreateSermonInput, CreateSermonResult } from "./types";

function validateInput({ title, content }: CreateSermonInput): string | null {
  if (!title.trim()) {
    return "Title is required.";
  }

  if (!content.trim()) {
    return "Manuscript is required.";
  }

  return null;
}

export async function createSermon(
  input: CreateSermonInput,
): Promise<CreateSermonResult> {
  const title = input.title.trim();
  const content = input.content.trim();
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
    .insert({ user_id: user.id, title })
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

  redirect(`/dashboard/sermons/${sermon.id}`);
}
