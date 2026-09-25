"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { serifFont, uiFont } from "@/components/evaluation/shared";
import { generateDeepDiveAction } from "@/lib/prep-card/deep-dive-actions";
import {
  deepDiveSelectionBlock,
  formatDeepDiveDay,
  formatDeepDiveGenreLine,
  formatDeepDiveTally,
  preselectedDeepDiveIds,
  type DeepDiveSermonOption,
  type DeepDiveThemeId,
} from "@/lib/prep-card/deep-dive-dashboard";

export function DeepDivePicker({
  themeId,
  themeLabel,
  sermons,
}: {
  themeId: DeepDiveThemeId;
  themeLabel: string;
  sermons: DeepDiveSermonOption[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(preselectedDeepDiveIds(sermons.map((sermon) => sermon.id))),
  );

  const chosen = useMemo(
    () => sermons.filter((sermon) => selected.has(sermon.id)),
    [sermons, selected],
  );
  const block = deepDiveSelectionBlock(chosen.length);
  const genreLine = formatDeepDiveGenreLine(chosen.map((sermon) => sermon.genre));

  function toggle(id: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  return (
    <div>
      <p className="mb-6">
        <Link
          href="/dashboard/deep-dive"
          className="text-[13px] font-medium no-underline hover:underline"
          style={{ ...uiFont, color: "var(--sc-accent)" }}
        >
          ← Themes
        </Link>
      </p>
      <h2
        className="mb-2 text-[28px] font-normal"
        style={{ ...serifFont, color: "var(--sc-ink)" }}
      >
        {themeLabel}
      </h2>
      <p
        className="mb-6 max-w-[48ch] text-[15px] leading-relaxed"
        style={{ ...serifFont, color: "var(--sc-ink-soft)" }}
      >
        The most recent sermons are already selected. Add or remove any you
        would not want this report to measure.
      </p>

      <div className="mb-6 max-w-[52ch]">
        <p className="m-0 text-[16px]" style={{ ...serifFont, color: "var(--sc-ink)" }}>
          {formatDeepDiveTally(chosen)}
        </p>
        {genreLine ? (
          <p className="mt-1 text-[15px]" style={{ ...serifFont, color: "var(--sc-ink-soft)" }}>
            {genreLine}
          </p>
        ) : null}
      </div>

      <ul className="m-0 max-w-[720px] list-none p-0">
        {sermons.map((sermon) => {
          const checked = selected.has(sermon.id);
          const date = formatDeepDiveDay(new Date(sermon.createdAt));
          return (
            <li key={sermon.id} className="border-b" style={{ borderColor: "var(--sc-rule)" }}>
              <label className="flex cursor-pointer items-start gap-3 py-3">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={checked}
                  onChange={() => toggle(sermon.id)}
                />
                <span className="min-w-0">
                  <span className="block text-[16px]" style={{ ...serifFont, color: "var(--sc-ink)" }}>
                    {sermon.title}
                  </span>
                  <span className="mt-0.5 block text-[13px]" style={{ ...uiFont, color: "var(--sc-ink-soft)" }}>
                    {date}
                    {sermon.passage ? ` · ${sermon.passage}` : ""}
                  </span>
                </span>
              </label>
            </li>
          );
        })}
      </ul>

      <div className="mt-6">
        <button
          type="button"
          disabled={pending || block != null}
          onClick={() => {
            setError(null);
            startTransition(async () => {
              const result = await generateDeepDiveAction({
                themeId,
                sermonIds: [...selected],
              });
              if (!result.ok) {
                setError(result.error);
                return;
              }
              router.push(result.href);
              router.refresh();
            });
          }}
          className="rounded border px-4 py-2 text-[13px] font-semibold tracking-wide disabled:opacity-60"
          style={{
            ...uiFont,
            borderColor: "var(--sc-ink)",
            background: "var(--sc-ink)",
            color: "#faf8f3",
          }}
        >
          {pending ? "Building report…" : "Build report"}
        </button>
        {block ? (
          <p className="mt-2 text-[14px]" style={{ ...serifFont, color: "var(--sc-ink-soft)" }}>
            {block}
          </p>
        ) : null}
        {error ? (
          <p className="mt-2 text-[14px]" style={{ ...uiFont, color: "var(--sc-error)" }}>
            {error}
          </p>
        ) : null}
      </div>
    </div>
  );
}
