import type { Metadata } from "next";
import { SketchWorkspace } from "@/components/sketch/SketchWorkspace";

export const metadata: Metadata = {
  title: "The Sketch",
};

export default function SketchPage() {
  return (
    <main
      className="rounded px-6 py-10 sm:px-8"
      style={{
        background: "var(--sc-panel)",
        border: "1px solid var(--sc-rule)",
        boxShadow: "var(--sc-shadow-lift)",
      }}
    >
      <SketchWorkspace />
    </main>
  );
}
