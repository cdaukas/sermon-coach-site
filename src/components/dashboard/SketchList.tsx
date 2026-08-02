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

function buildMobileMeta(sketch: ReadinessReadRow): string {
  const segments: string[] = [];
  const passage = sketch.primary_passage?.trim() || null;
  if (passage) segments.push(passage);
  segments.push(formatDate(sketch.created_at));
  return segments.join(" · ");
}

function SketchRow({ sketch }: { sketch: ReadinessReadRow }) {
  const passage = sketch.primary_passage?.trim() || null;
  const workingIdea = sketch.big_idea?.trim() || null;
  const title = workingIdea || passage || "";

  return (
    <li className="dashboard-sermon-row">
      <Link
        href={`/dashboard/sketches/${sketch.id}`}
        className="dashboard-sermon-row-link dashboard-sketch-row-link"
      >
        <span
          className="dashboard-sermon-row-title"
          title={title || undefined}
        >
          {title}
        </span>
        <span className="dashboard-sermon-row-passage">{passage ?? ""}</span>
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
