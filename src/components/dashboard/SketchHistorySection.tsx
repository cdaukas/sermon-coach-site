"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SketchReportView } from "@/components/sketch/SketchReportView";
import type { ReadinessReadRow } from "@/lib/sketch/readiness-read";
import { statusMapFromRow } from "@/lib/sketch/readiness-read";

const uiFont = { fontFamily: "var(--font-ui)" };
const serifFont = { fontFamily: "var(--font-serif)" };

export type SketchHistoryListItem = {
  id: string;
  primary_passage: string | null;
  created_at: string;
};

type SketchHistorySectionProps = {
  items: SketchHistoryListItem[];
  /** Full rows keyed by id — loaded server-side so view needs no extra fetch. */
  readsById: Record<string, ReadinessReadRow>;
};

function formatSketchDate(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(iso));
}

function rowLabel(item: SketchHistoryListItem): string {
  const passage = item.primary_passage?.trim() || "Untitled passage";
  return `${passage} · ${formatSketchDate(item.created_at)}`;
}

export function SketchHistorySection({
  items,
  readsById,
}: SketchHistorySectionProps) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = useMemo(
    () => (selectedId ? readsById[selectedId] ?? null : null),
    [readsById, selectedId],
  );

  if (selected) {
    return (
      <section className="mt-14 border-t pt-10" style={{ borderColor: "var(--sc-rule)" }}>
        <button
          type="button"
          onClick={() => setSelectedId(null)}
          className="mb-6 text-[13px] font-medium transition-colors hover:underline"
          style={{
            ...uiFont,
            background: "none",
            border: "none",
            padding: 0,
            color: "var(--sc-accent)",
            cursor: "pointer",
          }}
        >
          ← Your sketches
        </button>
        <SketchReportView
          intake={{
            primary_passage: selected.primary_passage ?? "",
            // outline_form is not stored on readiness_reads; header-only default.
            outline_form: "manuscript",
            ache: selected.ache,
            big_idea: selected.big_idea,
            gospel_turn: selected.gospel_turn,
            points: selected.points,
            one_person: selected.one_person,
            ending: selected.ending,
          }}
          read={selected.read_output}
          status={statusMapFromRow(selected)}
          isSignedIn
          onStartAnother={() => {
            router.push("/dashboard/sketch");
          }}
        />
      </section>
    );
  }

  return (
    <section className="mt-14 border-t pt-10" style={{ borderColor: "var(--sc-rule)" }}>
      <h2
        className="mb-5 text-[22px] font-semibold tracking-tight"
        style={{ ...serifFont, color: "var(--sc-ink)" }}
      >
        Your sketches
      </h2>

      {items.length === 0 ? (
        <p
          className="text-[14px] leading-relaxed"
          style={{ ...uiFont, color: "var(--sc-ink-soft)" }}
        >
          No saved sketches yet.{" "}
          <Link
            href="/dashboard/sketch"
            className="font-medium no-underline hover:underline"
            style={{ color: "var(--sc-accent)" }}
          >
            Run The Sketch →
          </Link>
        </p>
      ) : (
        <ul className="m-0 list-none p-0">
          {items.map((item) => (
            <li
              key={item.id}
              className="border-t"
              style={{ borderColor: "var(--sc-rule)" }}
            >
              <button
                type="button"
                onClick={() => setSelectedId(item.id)}
                className="flex w-full items-center justify-between gap-4 py-4 text-left transition-colors hover:bg-[var(--sc-bg)]"
                style={{
                  ...uiFont,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--sc-ink)",
                }}
              >
                <span className="text-[15px] leading-snug">{rowLabel(item)}</span>
                <span
                  className="shrink-0 text-[13px]"
                  style={{ color: "var(--sc-ink-soft)" }}
                  aria-hidden
                >
                  →
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
