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
        <ul className="flex flex-col gap-3">
          {filteredSermons.map((sermon) => (
            <SermonCard key={sermon.id} sermon={sermon} />
          ))}
        </ul>
      )}
    </div>
  );
}
