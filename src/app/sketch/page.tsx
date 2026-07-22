import type { Metadata } from "next";
import { PublicSketchWorkspace } from "@/components/sketch/PublicSketchWorkspace";

export const metadata: Metadata = {
  title: "The Sketch",
  description:
    "Answer six questions about the passage and the people you're preaching to. Get an honest read on where the sermon is solid and where it's still thin, before you write a word. No account needed.",
};

/**
 * Public Sketch — no auth, no dashboard chrome.
 * Logged-in visitors are not redirected; the page works either way.
 */
export default function PublicSketchPage() {
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
          <PublicSketchWorkspace />
        </main>
      </div>
    </div>
  );
}
