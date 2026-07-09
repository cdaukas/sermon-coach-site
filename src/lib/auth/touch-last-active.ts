import { createClient } from "@/lib/supabase/client";

const THROTTLE_MS = 15 * 60 * 1000;
const STORAGE_KEY = "last_active_ping";

export async function touchLastActive() {
  const now = Date.now();
  const last = Number(sessionStorage.getItem(STORAGE_KEY) || 0);
  if (now - last < THROTTLE_MS) return;

  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return;

  const { error } = await supabase.rpc("touch_last_active");
  if (!error) {
    sessionStorage.setItem(STORAGE_KEY, String(now));
  }
}
