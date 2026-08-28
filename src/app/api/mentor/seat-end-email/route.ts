import { notifyMenteeSeatEnded } from "@/lib/mentor/notify-seat-end";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

type SeatEndEmailBody = {
  relationshipId?: unknown;
};

export async function POST(request: Request) {
  let body: SeatEndEmailBody;
  try {
    body = (await request.json()) as SeatEndEmailBody;
  } catch {
    return NextResponse.json(
      { ok: false, error: "invalid_json" },
      { status: 400 },
    );
  }

  const relationshipId =
    typeof body.relationshipId === "string" ? body.relationshipId.trim() : "";

  if (!relationshipId) {
    return NextResponse.json(
      { ok: false, error: "missing_relationship_id" },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { ok: false, error: "not_authenticated" },
      { status: 401 },
    );
  }

  const { data: relationship, error: relError } = await supabase
    .from("mentor_relationships")
    .select("id, mentor_id, mentee_id, status")
    .eq("id", relationshipId)
    .maybeSingle();

  if (relError) {
    console.error("[seat-end-email] relationship lookup failed", relError);
    return NextResponse.json(
      { ok: false, error: "server_error" },
      { status: 500 },
    );
  }

  if (!relationship) {
    return NextResponse.json(
      { ok: false, error: "not_found" },
      { status: 404 },
    );
  }

  const isParty =
    relationship.mentor_id === user.id || relationship.mentee_id === user.id;
  if (!isParty) {
    return NextResponse.json(
      { ok: false, error: "not_a_party" },
      { status: 403 },
    );
  }

  // Best-effort: the relationship is already ended. Notify must not fail the
  // caller, and this route always returns 200 after the party check.
  await notifyMenteeSeatEnded(relationshipId);
  return NextResponse.json({ ok: true });
}
