"use server";

import { notifyMenteeSeatEnded } from "@/lib/mentor/notify-seat-end";
import type { EndMentorRelationshipResult } from "@/lib/mentor/relationships";
import { createClient } from "@/lib/supabase/server";

function parseEndResult(data: unknown): EndMentorRelationshipResult | null {
  if (!data || typeof data !== "object") {
    return null;
  }

  const row = data as Record<string, unknown>;
  if (row.ok === true) {
    return {
      ok: true,
      error_code: null,
      relationship_id:
        typeof row.relationship_id === "string" ? row.relationship_id : "",
      ended_at: typeof row.ended_at === "string" ? row.ended_at : "",
      released_count:
        typeof row.released_count === "number" ? row.released_count : 0,
    };
  }

  if (row.ok === false) {
    return {
      ok: false,
      error_code:
        typeof row.error_code === "string" ? row.error_code : "unknown",
    };
  }

  return null;
}

/**
 * Ends an active relationship, then notifies the mentee.
 * Notify errors are swallowed; the RPC result is what the client sees.
 */
export async function endMentorRelationshipAction(
  relationshipId: string,
): Promise<EndMentorRelationshipResult> {
  const id = relationshipId.trim();
  if (!id) {
    return { ok: false, error_code: "not_found" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("end_mentor_relationship", {
    p_relationship_id: id,
  });

  if (error) {
    return { ok: false, error_code: "unknown" };
  }

  const result = parseEndResult(data);
  if (!result) {
    return { ok: false, error_code: "unknown" };
  }

  if (result.ok === true) {
    const notifyId =
      result.relationship_id.length > 0 ? result.relationship_id : id;
    console.error("[seat-end-email] rpc ok, notifying", {
      relationshipId: notifyId,
    });
    try {
      await notifyMenteeSeatEnded(notifyId);
    } catch (notifyError) {
      console.error(
        "[seat-end-email] notify failed after end; termination stands",
        {
          relationshipId: id,
          error:
            notifyError instanceof Error
              ? notifyError.message
              : String(notifyError),
        },
      );
    }
  }

  return result;
}
