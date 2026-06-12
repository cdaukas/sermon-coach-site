"use client";

import Link from "next/link";
import { useState } from "react";
import type { SermonListItem } from "@/lib/sermons/types";

const uiFont = { fontFamily: "var(--font-ui)" };
const serifFont = { fontFamily: "var(--font-serif)" };

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(
    new Date(iso),
  );
}

function getMonthKey(iso: string): string {
  const date = new Date(iso);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function formatMonthHeader(monthKey: string): string {
  const [year, month] = monthKey.split("-").map(Number);
  const date = new Date(year, month - 1, 1);
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(date);
}

function groupSermonsByMonth(
  sermons: SermonListItem[],
): { monthKey: string; sermons: SermonListItem[] }[] {
  const groups = new Map<string, SermonListItem[]>();

  for (const sermon of sermons) {
    const monthKey = getMonthKey(sermon.created_at);
    const bucket = groups.get(monthKey) ?? [];
    bucket.push(sermon);
    groups.set(monthKey, bucket);
  }

  return [...groups.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([monthKey, groupSermons]) => ({
      monthKey,
      sermons: groupSermons.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      ),
    }));
}

type SermonListProps = {
  sermons: SermonListItem[];
};

function SermonCard({ sermon }: { sermon: SermonListItem }) {
  return (
    <li>
      <Link
        href={`/dashboard/sermons/${sermon.id}`}
        className="block rounded border px-5 py-4 no-underline transition-colors hover:border-[var(--sc-accent)]"
        style={{
          background: "var(--sc-bg)",
          borderColor: "var(--sc-rule)",
        }}
      >
        <p
          className="mb-1 text-lg font-semibold leading-snug"
          style={{ ...serifFont, color: "var(--sc-ink)" }}
        >
          {sermon.title}
        </p>
        <p className="text-[13px]" style={{ ...uiFont, color: "var(--sc-ink-soft)" }}>
          Saved {formatDate(sermon.created_at)}
        </p>
      </Link>
    </li>
  );
}

export function SermonList({ sermons }: SermonListProps) {
  const [query, setQuery] = useState("");

  if (sermons.length === 0) {
    return (
      <div className="text-center">
        <p
          className="mb-6 text-lg leading-relaxed"
          style={{ ...serifFont, color: "var(--sc-ink-soft)", fontStyle: "italic" }}
        >
          No sermons yet. Paste a manuscript to get started.
        </p>
        <Link
          href="/dashboard/sermons/new"
          className="inline-block rounded border px-7 py-3.5 text-sm font-semibold tracking-wide no-underline transition-all"
          style={{
            ...uiFont,
            background: "var(--sc-ink)",
            color: "var(--sc-bg)",
            borderColor: "var(--sc-ink)",
          }}
        >
          Submit your first sermon
        </Link>
      </div>
    );
  }

  const normalizedQuery = query.trim().toLowerCase();
  const filteredSermons =
    normalizedQuery === ""
      ? sermons
      : sermons.filter((sermon) =>
          sermon.title.toLowerCase().includes(normalizedQuery),
        );
  const groupedSermons = groupSermonsByMonth(filteredSermons);

  return (
    <div>
      <input
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search your sermons"
        aria-label="Search your sermons"
        className="mb-4 w-full rounded border px-4 py-2.5 text-[15px] outline-none transition-colors focus:border-[var(--sc-accent)] focus:ring-2 focus:ring-[var(--sc-accent)]/20"
        style={{
          ...uiFont,
          background: "var(--sc-bg)",
          borderColor: "var(--sc-rule)",
          color: "var(--sc-ink)",
        }}
      />

      {filteredSermons.length === 0 ? (
        <p className="text-[13px]" style={{ ...uiFont, color: "var(--sc-ink-soft)" }}>
          No sermons match that search.
        </p>
      ) : (
        <div className="flex flex-col gap-6">
          {groupedSermons.map(({ monthKey, sermons: monthSermons }) => (
            <section key={monthKey}>
              <p
                className="mb-3 text-[11px] font-semibold tracking-[0.16em]"
                style={{ ...uiFont, color: "var(--sc-ink-soft)" }}
              >
                {formatMonthHeader(monthKey)}
              </p>
              <ul className="flex flex-col gap-3">
                {monthSermons.map((sermon) => (
                  <SermonCard key={sermon.id} sermon={sermon} />
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
