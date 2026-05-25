import Link from "next/link";
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

export function SermonList({ sermons }: SermonListProps) {
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

  return (
    <ul className="flex flex-col gap-3">
      {sermons.map((sermon) => (
        <li key={sermon.id}>
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
      ))}
    </ul>
  );
}
