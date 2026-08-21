import type { Metadata } from "next";
import { PublicSketchWorkspace } from "@/components/sketch/PublicSketchWorkspace";
import { createClient } from "@/lib/supabase/server";

const SHARE_TITLE = "The Sketch · An honest read on your outline";
const SHARE_DESCRIPTION =
  "Six questions about your outline, before you write a word. Free, no account.";

export const metadata: Metadata = {
  title: { absolute: "The Sketch · The Sermon Coach" },
  description:
    "Answer six questions about your sermon outline. Get an honest read on where it is solid and where it is still thin, before you write a word. No account needed.",
  alternates: { canonical: "/sketch" },
  openGraph: {
    type: "website",
    url: "/sketch",
    siteName: "The Sermon Coach",
    title: SHARE_TITLE,
    description: SHARE_DESCRIPTION,
    images: [
      {
        url: "/og/og-sketch.png",
        width: 1200,
        height: 630,
        alt: "The Sketch — The Sermon Coach",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SHARE_TITLE,
    description: SHARE_DESCRIPTION,
    images: ["/og/og-sketch.png"],
  },
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
