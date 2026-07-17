import { FIRST_EVAL_PATH } from "@/lib/auth/start";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * Post-attribution continue: ensure acquisition_source_at is set (covers skip),
 * then send the user to the first-eval page. Does not change answered keys.
 */
export async function GET(request: Request) {
  const { origin } = new URL(request.url);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(`${origin}/login?redirectTo=${encodeURIComponent(FIRST_EVAL_PATH)}`);
  }

  await supabase.rpc("acknowledge_acquisition_prompt");

  return NextResponse.redirect(`${origin}${FIRST_EVAL_PATH}`);
}
