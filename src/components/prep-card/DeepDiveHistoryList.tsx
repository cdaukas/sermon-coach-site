import Link from "next/link";
import {
  formatDeepDiveHistoryDate,
  type DeepDiveHistoryEntry,
} from "@/lib/prep-card/deep-dive-history";
import { serifFont, uiFont } from "@/components/evaluation/shared";

type DeepDiveHistoryListProps = {
  entries: DeepDiveHistoryEntry[];
  /** Currently displayed report — omitted from the previous list. */
  currentId: string | null;
};

/**
 * Previous deep-dive reports. Links open frozen snapshots by id.
 */
export function DeepDiveHistoryList({
  entries,
  currentId,
}: DeepDiveHistoryListProps) {
  const previous = entries.filter((entry) => entry.id !== currentId);
  if (previous.length === 0) {
    return null;
  }

  return (
    <section className="mt-12 border-t pt-8" style={{ borderColor: "var(--sc-rule)" }}>
      <p
        className="mb-4 text-[11px] font-semibold uppercase tracking-[0.12em]"
        style={{ ...uiFont, color: "var(--sc-accent)" }}
      >
        Previous reports
      </p>
      <ul className="m-0 list-none space-y-2.5 p-0">
        {previous.map((entry) => (
          <li key={`${entry.kind}-${entry.id}`}>
            <Link
              href={entry.href}
              className="text-[16px] no-underline hover:underline"
              style={{ ...serifFont, color: "var(--sc-ink)" }}
            >
              {entry.label}
              <span style={{ color: "var(--sc-ink-soft)" }}>
                {" · "}
                {formatDeepDiveHistoryDate(entry.generatedAt)}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
