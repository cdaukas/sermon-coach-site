import Link from "next/link";
import type { ReactNode } from "react";
import type { ReadinessReadRow } from "@/lib/sketch/readiness-read";

type SketchListProps = {
  sketches: ReadinessReadRow[];
  header?: ReactNode;
};

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(iso));
}

function modeLabel(mode: ReadinessReadRow["mode"]): string | null {
  if (mode === "find") return "Find";
  if (mode === "press") return "Press";
  return null;
}

function buildMobileMeta(sketch: ReadinessReadRow): string {
  const segments: string[] = [];
  const passage = sketch.primary_passage?.trim() || null;
  const mode = modeLabel(sketch.mode);
  if (passage) segments.push(passage);
  if (mode) segments.push(mode);
  segments.push(formatDate(sketch.created_at));
  return segments.join(" · ");
}

function SketchRow({ sketch }: { sketch: ReadinessReadRow }) {
  const passage = sketch.primary_passage?.trim() || null;
  const workingIdea = sketch.big_idea?.trim() || null;
  const title = workingIdea || passage || "";
  const mode = modeLabel(sketch.mode);

  return (
    <li className="dashboard-sermon-row">
      <Link
        href={`/dashboard/sketches/${sketch.id}`}
        className="dashboard-sermon-row-link dashboard-sketch-row-link"
      >
        <span className="dashboard-sermon-row-title">{title}</span>
        <span className="dashboard-sermon-row-passage">{passage ?? ""}</span>
        <span className="dashboard-sermon-row-mode">{mode ?? ""}</span>
        <span className="dashboard-sermon-row-date">
          {formatDate(sketch.created_at)}
        </span>
        <span className="dashboard-sermon-row-mobile-meta">
          {buildMobileMeta(sketch)}
        </span>
      </Link>
    </li>
  );
}

export function SketchList({ sketches, header }: SketchListProps) {
  if (sketches.length === 0) {
    return header ? <>{header}</> : null;
  }

  return (
    <>
      {header}
      <ul className="dashboard-sermon-list">
        {sketches.map((sketch) => (
          <SketchRow key={sketch.id} sketch={sketch} />
        ))}
      </ul>
    </>
  );
}
