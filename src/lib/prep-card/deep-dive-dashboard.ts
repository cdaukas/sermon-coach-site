import { themeDisplayName, type MovementThemeId } from "@/lib/movement/themes";
import type { PrepGenre } from "./genre";
import { prepGenreLabel } from "./genre";
import {
  DEEP_DIVE_MAX_SERMONS,
  DEEP_DIVE_MIN_SERMONS,
  DEEP_DIVE_PRESELECT,
  DEEP_DIVE_QUARTER_MONTHS,
  DEEP_DIVE_SMALL_SAMPLE_BELOW,
  deepDiveThresholdProse,
} from "./deep-dive-threshold";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

const COUNT_WORDS = [
  "zero",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
  "eleven",
  "twelve",
] as const;

export type DeepDiveThemeId = "ask" | "christ";

export type DeepDiveChoice = {
  format: "manuscript" | "transcript";
  genre: PrepGenre;
};

export type DeepDiveSermonOption = DeepDiveChoice & {
  id: string;
  title: string;
  createdAt: string;
  passage: string | null;
};

/**
 * Add calendar months in UTC, clamping the day when the target month is shorter.
 */
export function addUtcMonths(date: Date, months: number): Date {
  const day = date.getUTCDate();
  const target = new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth() + months,
      1,
      date.getUTCHours(),
      date.getUTCMinutes(),
      date.getUTCSeconds(),
      date.getUTCMilliseconds(),
    ),
  );
  const lastDay = new Date(
    Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0),
  ).getUTCDate();
  target.setUTCDate(Math.min(day, lastDay));
  return target;
}

/** "14 September", with the year when it is not the year of `now`. */
export function formatDeepDiveDay(date: Date, now: Date = new Date()): string {
  const day = `${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]}`;
  if (date.getUTCFullYear() === now.getUTCFullYear()) {
    return day;
  }
  return `${day} ${date.getUTCFullYear()}`;
}

export function deepDiveThemeLabel(
  themeId: DeepDiveThemeId | null | undefined,
): string {
  const id: MovementThemeId = themeId === "christ" ? "christ" : "ask";
  return themeDisplayName(id);
}

export function deepDiveOpensAt(generatedAt: Date): Date {
  return addUtcMonths(generatedAt, DEEP_DIVE_QUARTER_MONTHS);
}

/** Locked until the rolling quarter from the last theme diagnostic has elapsed. */
export function isDeepDiveQuarterLocked(
  generatedAt: Date | null,
  now: Date,
): boolean {
  if (!generatedAt) {
    return false;
  }
  return now.getTime() < deepDiveOpensAt(generatedAt).getTime();
}

export function deepDiveLockLines(params: {
  themeId: DeepDiveThemeId | null | undefined;
  generatedAt: Date;
  now?: Date;
}): { ranLine: string; prepCardLine: string; opensAt: Date } {
  const now = params.now ?? new Date();
  const opensAt = deepDiveOpensAt(params.generatedAt);
  const theme = deepDiveThemeLabel(params.themeId);
  const ranOn = formatDeepDiveDay(params.generatedAt, now);
  const opensOn = formatDeepDiveDay(opensAt, now);
  return {
    ranLine: `You ran ${theme} on ${ranOn}. Your next deep dive opens ${opensOn}.`,
    prepCardLine:
      "Your prep card is always available and updates whenever you want it.",
    opensAt,
  };
}

function capitalizedCount(n: number): string {
  const word = COUNT_WORDS[n];
  if (!word) {
    return String(n);
  }
  return word.charAt(0).toUpperCase() + word.slice(1);
}

export type DeepDiveUnlock = {
  headline: string;
  filled: number;
  total: number;
  countLabel: string;
  remainder: string;
};

export function deepDiveUnlock(eligible: number): DeepDiveUnlock | null {
  if (eligible >= DEEP_DIVE_MIN_SERMONS) {
    return null;
  }
  const more = DEEP_DIVE_MIN_SERMONS - Math.max(0, eligible);
  return {
    headline: `Your first deep dive opens at ${deepDiveThresholdProse("en")} sermons.`,
    filled: Math.max(0, eligible),
    total: DEEP_DIVE_MIN_SERMONS,
    countLabel: `${Math.max(0, eligible)} of ${DEEP_DIVE_MIN_SERMONS}`,
    remainder: `${capitalizedCount(more)} more and you can run your first report.`,
  };
}

export function preselectedDeepDiveIds(
  idsNewestFirst: readonly string[],
): string[] {
  return idsNewestFirst.slice(0, DEEP_DIVE_PRESELECT);
}

/** Why the generate button is disabled. Null when the selection can run. */
export function deepDiveSelectionBlock(count: number): string | null {
  if (count < DEEP_DIVE_MIN_SERMONS) {
    return `Select at least ${DEEP_DIVE_MIN_SERMONS} sermons.`;
  }
  if (count > DEEP_DIVE_MAX_SERMONS) {
    return `Select at most ${DEEP_DIVE_MAX_SERMONS} sermons.`;
  }
  return null;
}

function tallyNoun(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

export function formatDeepDiveTally(selected: readonly DeepDiveChoice[]): string {
  const manuscripts = selected.filter((row) => row.format === "manuscript").length;
  const transcripts = selected.length - manuscripts;
  const head = `${selected.length} selected`;
  if (manuscripts > 0 && transcripts > 0) {
    return `${head} · ${tallyNoun(manuscripts, "manuscript", "manuscripts")}, ${tallyNoun(transcripts, "transcript", "transcripts")}`;
  }
  if (transcripts > 0) {
    return `${head} · ${tallyNoun(transcripts, "transcript", "transcripts")}`;
  }
  return `${head} · ${tallyNoun(manuscripts, "manuscript", "manuscripts")}`;
}

/** Top two labelled genres. Null when nothing has a passage we can name. */
export function formatDeepDiveGenreLine(
  genres: readonly PrepGenre[],
): string | null {
  const counts = new Map<PrepGenre, number>();
  for (const genre of genres) {
    if (genre === "unknown") {
      continue;
    }
    counts.set(genre, (counts.get(genre) ?? 0) + 1);
  }
  if (counts.size === 0) {
    return null;
  }
  const ranked = [...counts.entries()].sort(
    (a, b) => b[1] - a[1] || a[0].localeCompare(b[0]),
  );
  const mix = ranked
    .slice(0, 2)
    .map(([genre, count]) => `${prepGenreLabel(genre)} (${count})`)
    .join(" and ");
  return `Mostly ${mix}`;
}

/**
 * Under the report header when the sample is still thin.
 * Uses the unlock word when the sample is exactly that count.
 */
export function deepDiveSmallSampleLine(sampleSize: number): string | null {
  if (sampleSize >= DEEP_DIVE_SMALL_SAMPLE_BELOW) {
    return null;
  }
  const count =
    sampleSize === DEEP_DIVE_MIN_SERMONS
      ? deepDiveThresholdProse("en")
      : String(sampleSize);
  const word = sampleSize === 1 ? "sermon" : "sermons";
  return `Built from ${count} ${word}. Counts move a lot at this size, and a measure that looks weak may need another quarter before they become more concrete.`;
}
