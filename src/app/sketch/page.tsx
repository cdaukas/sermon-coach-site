import type { Metadata } from "next";
import { PublicSketchWorkspace } from "@/components/sketch/PublicSketchWorkspace";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "The Sketch",
  description:
    "Answer six questions about your sermon outline. Get an honest read on where it is solid and where it is still thin, before you write a word. No account needed.",
};

/**
 * Public Sketch — no auth, no dashboard chrome.
 * Logged-in visitors are not redirected; the page works either way.
 * Auth is read only to route the eval CTA (signed in → new sermon).
 */
export default async function PublicSketchPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div
      className="flex min-h-full flex-col"
      style={{ background: "var(--sc-bg)" }}
    >
      <div className="mx-auto w-full max-w-[1100px] px-6 py-12">
        <main
          className="rounded px-6 py-10 sm:px-8"
          style={{
            background: "var(--sc-panel)",
            border: "1px solid var(--sc-rule)",
            boxShadow: "var(--sc-shadow-lift)",
          }}
        >
          <PublicSketchWorkspace isSignedIn={user != null} />
        </main>
      </div>
    </div>
  );
}
