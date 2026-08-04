/**
 * Passage reference normalization for passage_inventories cache keys.
 *
 * Canonical form: full English book name, space, then either:
 *   - whole chapter:           "Hebrews 3"
 *   - same-chapter range:      "Hebrews 3:1-6"
 *   - cross-chapter range:     "1 Corinthians 10:31-11:1"
 *   - single verse:            "Hebrews 3:6"
 *
 * Single-chapter books (Obadiah, Philemon, 2–3 John, Jude): a bare numeric
 * range after the book name is always verses → "2 John 1:1-13".
 *
 * Unparseable input returns { ok: false, reason } so callers can log and skip.
 * Multi-passage strings, book-only refs, and non-English book names are skips.
 */

export type NormalizePassageResult =
  | { ok: true; normalized: string }
  | { ok: false; reason: string };

/** Canonical Protestant OT + NT book names (no apocrypha). */
export const CANONICAL_BOOKS = [
  "Genesis",
  "Exodus",
  "Leviticus",
  "Numbers",
  "Deuteronomy",
  "Joshua",
  "Judges",
  "Ruth",
  "1 Samuel",
  "2 Samuel",
  "1 Kings",
  "2 Kings",
  "1 Chronicles",
  "2 Chronicles",
  "Ezra",
  "Nehemiah",
  "Esther",
  "Job",
  "Psalm",
  "Proverbs",
  "Ecclesiastes",
  "Song of Solomon",
  "Isaiah",
  "Jeremiah",
  "Lamentations",
  "Ezekiel",
  "Daniel",
  "Hosea",
  "Joel",
  "Amos",
  "Obadiah",
  "Jonah",
  "Micah",
  "Nahum",
  "Habakkuk",
  "Zephaniah",
  "Haggai",
  "Zechariah",
  "Malachi",
  "Matthew",
  "Mark",
  "Luke",
  "John",
  "Acts",
  "Romans",
  "1 Corinthians",
  "2 Corinthians",
  "Galatians",
  "Ephesians",
  "Philippians",
  "Colossians",
  "1 Thessalonians",
  "2 Thessalonians",
  "1 Timothy",
  "2 Timothy",
  "Titus",
  "Philemon",
  "Hebrews",
  "James",
  "1 Peter",
  "2 Peter",
  "1 John",
  "2 John",
  "3 John",
  "Jude",
  "Revelation",
] as const;

export type CanonicalBook = (typeof CANONICAL_BOOKS)[number];

/**
 * Locale tags for book-name aliases.
 * Only `en` is populated now. Spanish / Italian slots exist so localization
 * can add aliases without rewriting the table structure (e.g. Giudici → Judges).
 */
export type BookAliasLocale = "en" | "es" | "it";

export type BookDefinition = {
  canonical: CanonicalBook;
  /**
   * True for books that are a single chapter in the Protestant verse scheme.
   * Bare numeric ranges after the book name are verses, not chapters.
   */
  singleChapter: boolean;
  /**
   * Aliases keyed by locale. Matchers use exact lowercase keys after stripping
   * periods. Do not put non-English aliases in `en` — leave es/it empty until
   * the localization roadmap owns that expansion.
   */
  aliases: Partial<Record<BookAliasLocale, readonly string[]>>;
};

/**
 * Full book table. Canonical English names are the cache-key language.
 * `aliases.en` holds abbreviations and common English typos only.
 */
export const BOOK_DEFINITIONS: readonly BookDefinition[] = [
  { canonical: "Genesis", singleChapter: false, aliases: { en: ["gen"] } },
  {
    canonical: "Exodus",
    singleChapter: false,
    aliases: { en: ["exod", "exo", "ex"] },
  },
  { canonical: "Leviticus", singleChapter: false, aliases: { en: ["lev"] } },
  { canonical: "Numbers", singleChapter: false, aliases: { en: ["num"] } },
  {
    canonical: "Deuteronomy",
    singleChapter: false,
    aliases: { en: ["deut", "deu", "dt"] },
  },
  {
    canonical: "Joshua",
    singleChapter: false,
    aliases: { en: ["josh", "jos"] },
  },
  {
    canonical: "Judges",
    singleChapter: false,
    aliases: { en: ["judg", "jdg"] },
  },
  { canonical: "Ruth", singleChapter: false, aliases: { en: [] } },
  {
    canonical: "1 Samuel",
    singleChapter: false,
    aliases: { en: ["1 sam"] },
  },
  {
    canonical: "2 Samuel",
    singleChapter: false,
    aliases: { en: ["2 sam"] },
  },
  {
    canonical: "1 Kings",
    singleChapter: false,
    aliases: { en: ["1 kgs", "1 king"] },
  },
  {
    canonical: "2 Kings",
    singleChapter: false,
    aliases: { en: ["2 kgs", "2 king"] },
  },
  {
    canonical: "1 Chronicles",
    singleChapter: false,
    aliases: { en: ["1 chron", "1 chr"] },
  },
  {
    canonical: "2 Chronicles",
    singleChapter: false,
    aliases: { en: ["2 chron", "2 chr"] },
  },
  { canonical: "Ezra", singleChapter: false, aliases: { en: [] } },
  { canonical: "Nehemiah", singleChapter: false, aliases: { en: ["neh"] } },
  { canonical: "Esther", singleChapter: false, aliases: { en: ["est"] } },
  { canonical: "Job", singleChapter: false, aliases: { en: [] } },
  {
    canonical: "Psalm",
    singleChapter: false,
    aliases: { en: ["psalms", "ps", "pss"] },
  },
  {
    canonical: "Proverbs",
    singleChapter: false,
    aliases: { en: ["prov", "pro"] },
  },
  {
    canonical: "Ecclesiastes",
    singleChapter: false,
    aliases: { en: ["eccl", "ecc", "qoheleth"] },
  },
  {
    canonical: "Song of Solomon",
    singleChapter: false,
    aliases: {
      en: ["song of songs", "songs", "canticle of canticles", "canticles"],
    },
  },
  { canonical: "Isaiah", singleChapter: false, aliases: { en: ["isa"] } },
  { canonical: "Jeremiah", singleChapter: false, aliases: { en: ["jer"] } },
  {
    canonical: "Lamentations",
    singleChapter: false,
    aliases: { en: ["lam"] },
  },
  {
    canonical: "Ezekiel",
    singleChapter: false,
    aliases: { en: ["ezek", "eze"] },
  },
  { canonical: "Daniel", singleChapter: false, aliases: { en: ["dan"] } },
  { canonical: "Hosea", singleChapter: false, aliases: { en: ["hos"] } },
  { canonical: "Joel", singleChapter: false, aliases: { en: [] } },
  { canonical: "Amos", singleChapter: false, aliases: { en: [] } },
  {
    canonical: "Obadiah",
    singleChapter: true,
    aliases: { en: ["obad", "oba"] },
  },
  { canonical: "Jonah", singleChapter: false, aliases: { en: ["jon"] } },
  { canonical: "Micah", singleChapter: false, aliases: { en: ["mic"] } },
  { canonical: "Nahum", singleChapter: false, aliases: { en: ["nah"] } },
  { canonical: "Habakkuk", singleChapter: false, aliases: { en: ["hab"] } },
  {
    canonical: "Zephaniah",
    singleChapter: false,
    aliases: { en: ["zeph", "zep"] },
  },
  { canonical: "Haggai", singleChapter: false, aliases: { en: ["hag"] } },
  {
    canonical: "Zechariah",
    singleChapter: false,
    aliases: { en: ["zech", "zec"] },
  },
  { canonical: "Malachi", singleChapter: false, aliases: { en: ["mal"] } },
  {
    canonical: "Matthew",
    singleChapter: false,
    aliases: { en: ["matt", "mt"] },
  },
  {
    canonical: "Mark",
    singleChapter: false,
    aliases: { en: ["mk", "mrk"] },
  },
  { canonical: "Luke", singleChapter: false, aliases: { en: ["lk"] } },
  {
    canonical: "John",
    singleChapter: false,
    aliases: { en: ["jn", "jhn"] },
  },
  { canonical: "Acts", singleChapter: false, aliases: { en: [] } },
  { canonical: "Romans", singleChapter: false, aliases: { en: ["rom"] } },
  {
    canonical: "1 Corinthians",
    singleChapter: false,
    aliases: { en: ["1 cor"] },
  },
  {
    canonical: "2 Corinthians",
    singleChapter: false,
    aliases: { en: ["2 cor"] },
  },
  { canonical: "Galatians", singleChapter: false, aliases: { en: ["gal"] } },
  {
    canonical: "Ephesians",
    singleChapter: false,
    aliases: { en: ["eph", "epheisans"] },
  },
  {
    canonical: "Philippians",
    singleChapter: false,
    aliases: { en: ["phil", "phillipians", "philipians"] },
  },
  { canonical: "Colossians", singleChapter: false, aliases: { en: ["col"] } },
  {
    canonical: "1 Thessalonians",
    singleChapter: false,
    aliases: { en: ["1 thess", "1 thes"] },
  },
  {
    canonical: "2 Thessalonians",
    singleChapter: false,
    aliases: { en: ["2 thess", "2 thes"] },
  },
  {
    canonical: "1 Timothy",
    singleChapter: false,
    aliases: { en: ["1 tim"] },
  },
  {
    canonical: "2 Timothy",
    singleChapter: false,
    aliases: { en: ["2 tim"] },
  },
  { canonical: "Titus", singleChapter: false, aliases: { en: ["tit"] } },
  {
    canonical: "Philemon",
    singleChapter: true,
    aliases: { en: ["phlm", "phm"] },
  },
  { canonical: "Hebrews", singleChapter: false, aliases: { en: ["heb"] } },
  { canonical: "James", singleChapter: false, aliases: { en: ["jas"] } },
  {
    canonical: "1 Peter",
    singleChapter: false,
    aliases: { en: ["1 pet"] },
  },
  {
    canonical: "2 Peter",
    singleChapter: false,
    aliases: { en: ["2 pet"] },
  },
  {
    canonical: "1 John",
    singleChapter: false,
    aliases: { en: ["1 jn"] },
  },
  {
    canonical: "2 John",
    singleChapter: true,
    aliases: { en: ["2 jn"] },
  },
  {
    canonical: "3 John",
    singleChapter: true,
    aliases: { en: ["3 jn"] },
  },
  { canonical: "Jude", singleChapter: true, aliases: { en: [] } },
  {
    canonical: "Revelation",
    singleChapter: false,
    aliases: { en: ["rev", "revelations", "apocalypse"] },
  },
];

type BookLookup = {
  definition: BookDefinition;
};

/** lowercase alias / canonical → definition. Built from `en` only today. */
function buildBookLookup(): Map<string, BookLookup> {
  const map = new Map<string, BookLookup>();

  for (const definition of BOOK_DEFINITIONS) {
    const entry: BookLookup = { definition };
    map.set(definition.canonical.toLowerCase(), entry);

    // Locale slots (es, it, …) intentionally empty for this branch.
    // When filled, merge aliases here the same way without changing key shape.
    const locales: BookAliasLocale[] = ["en", "es", "it"];
    for (const locale of locales) {
      const list = definition.aliases[locale] ?? [];
      for (const alias of list) {
        const key = alias.toLowerCase().replace(/\./g, "").replace(/\s+/g, " ").trim();
        if (!key) continue;
        // Longer aliases preferred at lookup by iterating sorted keys — store all;
        // resolveBook matches exactly so collisions on different books are bugs.
        if (map.has(key) && map.get(key)!.definition.canonical !== definition.canonical) {
          throw new Error(
            `Book alias collision: "${key}" maps to both ${map.get(key)!.definition.canonical} and ${definition.canonical}`,
          );
        }
        map.set(key, entry);
      }
    }
  }

  return map;
}

const BOOK_LOOKUP = buildBookLookup();

// Pre-sorted alias keys (longest first) for prefix-free exact match over spaced names.
const ALIAS_KEYS_BY_LENGTH = [...BOOK_LOOKUP.keys()].sort(
  (a, b) => b.length - a.length,
);

function resolveBook(bookToken: string): BookDefinition | null {
  const key = bookToken
    .toLowerCase()
    .replace(/\./g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!key) return null;

  const direct = BOOK_LOOKUP.get(key);
  if (direct) return direct.definition;

  // Exact match against keys sorted longest-first (defensive if map lookup misses).
  for (const alias of ALIAS_KEYS_BY_LENGTH) {
    if (key === alias) return BOOK_LOOKUP.get(alias)!.definition;
  }
  return null;
}

function isAfterOrEqual(
  startChapter: number,
  startVerse: number,
  endChapter: number,
  endVerse: number,
): boolean {
  if (endChapter > startChapter) return true;
  if (endChapter < startChapter) return false;
  return endVerse >= startVerse;
}

/**
 * Normalize a preacher- or operator-supplied passage reference.
 */
export function normalizePassageRef(raw: string): NormalizePassageResult {
  if (typeof raw !== "string") {
    return { ok: false, reason: "not a string" };
  }

  // Strip parenthetical annotations only (not free trailing text).
  let input = raw
    .replace(/\([^)]*\)/g, " ")
    .replace(/\[[^\]]*\]/g, " ")
    .trim();
  if (!input) {
    return { ok: false, reason: "empty" };
  }

  // Book-only with no chapter/verse is not a passage.
  // Allow through to the shape matcher; if only book words match nothing numeric,
  // fall through as unparseable. Explicit early check for pure book name / bare text.
  if (/;/.test(input) || /\band\b/i.test(input)) {
    return { ok: false, reason: "multiple passages not supported" };
  }

  // Normalize en/em/minus dashes to hyphen.
  input = input
    .replace(/[\u2013\u2014\u2212]/g, "-")
    .replace(/\s+/g, " ")
    .trim();

  // Book + reference tail.
  // Cross-chapter:  10:31-11:1
  // Same-chapter:   3:1-6  |  3.1-6
  // Single verse:   3:6
  // Chapter only:   3
  // Single-chapter book verse range: 1-13 (no chapter: prefix)
  const match = input.match(
    /^((?:[123]\s*)?[A-Za-z]+(?:\s+[A-Za-z]+){0,3}?)\.?\s+(.+)$/,
  );

  if (!match) {
    // No numeric tail — e.g. "Ecclesiastes"
    if (/^(?:[123]\s*)?[A-Za-z]+(?:\s+[A-Za-z]+){0,3}\.?$/.test(input)) {
      return { ok: false, reason: "book without chapter" };
    }
    return { ok: false, reason: "unparseable reference shape" };
  }

  const bookToken = match[1].replace(/\./g, " ").replace(/\s+/g, " ").trim();
  const tail = match[2].trim();
  const definition = resolveBook(bookToken);
  if (!definition) {
    return { ok: false, reason: `unknown book: ${bookToken}` };
  }
  const book = definition.canonical;

  // --- single-chapter books: "2 John 1-13" / "Jude 1:1-25" / "Philemon 1" ---
  if (definition.singleChapter) {
    return normalizeSingleChapterBook(book, tail);
  }

  // Cross-chapter: chapter:verse-chapter:verse  (dots as colon also OK)
  const cross = tail.match(
    /^(\d+)[:.](\d+)\s*-\s*(\d+)[:.](\d+)\.?$/,
  );
  if (cross) {
    const startChapter = Number(cross[1]);
    const startVerse = Number(cross[2]);
    const endChapter = Number(cross[3]);
    const endVerse = Number(cross[4]);
    if (
      !Number.isInteger(startChapter) ||
      !Number.isInteger(startVerse) ||
      !Number.isInteger(endChapter) ||
      !Number.isInteger(endVerse) ||
      startChapter < 1 ||
      startVerse < 1 ||
      endChapter < 1 ||
      endVerse < 1
    ) {
      return { ok: false, reason: "invalid verse range" };
    }
    if (!isAfterOrEqual(startChapter, startVerse, endChapter, endVerse)) {
      return { ok: false, reason: "invalid verse range" };
    }
    if (startChapter === endChapter) {
      return {
        ok: true,
        normalized: `${book} ${startChapter}:${startVerse}-${endVerse}`,
      };
    }
    return {
      ok: true,
      normalized: `${book} ${startChapter}:${startVerse}-${endChapter}:${endVerse}`,
    };
  }

  // Same-chapter range: chapter:verse-verse  or chapter.verse-verse
  const sameChapter = tail.match(/^(\d+)[:.](\d+)\s*-\s*(\d+)\.?$/);
  if (sameChapter) {
    const chapter = Number(sameChapter[1]);
    const startVerse = Number(sameChapter[2]);
    const endVerse = Number(sameChapter[3]);
    if (
      !Number.isInteger(chapter) ||
      !Number.isInteger(startVerse) ||
      !Number.isInteger(endVerse) ||
      chapter < 1 ||
      startVerse < 1 ||
      endVerse < 1 ||
      endVerse < startVerse
    ) {
      return { ok: false, reason: "invalid verse range" };
    }
    return {
      ok: true,
      normalized: `${book} ${chapter}:${startVerse}-${endVerse}`,
    };
  }

  // Single verse: chapter:verse
  const singleVerse = tail.match(/^(\d+)[:.](\d+)\.?$/);
  if (singleVerse) {
    const chapter = Number(singleVerse[1]);
    const verse = Number(singleVerse[2]);
    if (
      !Number.isInteger(chapter) ||
      !Number.isInteger(verse) ||
      chapter < 1 ||
      verse < 1
    ) {
      return { ok: false, reason: "invalid verse range" };
    }
    return { ok: true, normalized: `${book} ${chapter}:${verse}` };
  }

  // Whole chapter: "Hebrews 3", "Heb 3" — keep as full chapter, do not invent verses.
  const wholeChapter = tail.match(/^(\d+)\.?$/);
  if (wholeChapter) {
    const chapter = Number(wholeChapter[1]);
    if (!Number.isInteger(chapter) || chapter < 1) {
      return { ok: false, reason: "invalid chapter" };
    }
    return { ok: true, normalized: `${book} ${chapter}` };
  }

  // Multi-chapter range without verses (Hebrews 3-4) — not supported.
  if (/^\d+\s*-\s*\d+\.?$/.test(tail)) {
    return { ok: false, reason: "chapter-only ranges not supported" };
  }

  return { ok: false, reason: "unparseable reference shape" };
}

/**
 * Single-chapter books: numeric ranges are verses in chapter 1.
 * "2 John 1-13" → "2 John 1:1-13"
 * "2 John 1:1-13" → same
 * "Jude 1" (bare) → "Jude 1" (the one chapter as a whole unit)
 * "Jude 3" bare with N>1 treated as verse → "Jude 1:3"
 */
function normalizeSingleChapterBook(
  book: CanonicalBook,
  tail: string,
): NormalizePassageResult {
  // Explicit chapter:verse forms — chapter must be 1.
  const cross = tail.match(
    /^(\d+)[:.](\d+)\s*-\s*(\d+)[:.](\d+)\.?$/,
  );
  if (cross) {
    const sc = Number(cross[1]);
    const sv = Number(cross[2]);
    const ec = Number(cross[3]);
    const ev = Number(cross[4]);
    if (sc !== 1 || ec !== 1) {
      return { ok: false, reason: "invalid verse range" };
    }
    if (!isAfterOrEqual(1, sv, 1, ev)) {
      return { ok: false, reason: "invalid verse range" };
    }
    return { ok: true, normalized: `${book} 1:${sv}-${ev}` };
  }

  const sameWithChapter = tail.match(/^(\d+)[:.](\d+)\s*-\s*(\d+)\.?$/);
  if (sameWithChapter) {
    const chapter = Number(sameWithChapter[1]);
    const startVerse = Number(sameWithChapter[2]);
    const endVerse = Number(sameWithChapter[3]);
    if (chapter !== 1 || endVerse < startVerse || startVerse < 1) {
      return { ok: false, reason: "invalid verse range" };
    }
    return {
      ok: true,
      normalized: `${book} 1:${startVerse}-${endVerse}`,
    };
  }

  // Bare verse range: "1-13"
  const bareRange = tail.match(/^(\d+)\s*-\s*(\d+)\.?$/);
  if (bareRange) {
    const startVerse = Number(bareRange[1]);
    const endVerse = Number(bareRange[2]);
    if (
      !Number.isInteger(startVerse) ||
      !Number.isInteger(endVerse) ||
      startVerse < 1 ||
      endVerse < startVerse
    ) {
      return { ok: false, reason: "invalid verse range" };
    }
    return {
      ok: true,
      normalized: `${book} 1:${startVerse}-${endVerse}`,
    };
  }

  // Single verse with chapter: "1:5"
  const singleWithChapter = tail.match(/^(\d+)[:.](\d+)\.?$/);
  if (singleWithChapter) {
    const chapter = Number(singleWithChapter[1]);
    const verse = Number(singleWithChapter[2]);
    if (chapter !== 1 || verse < 1) {
      return { ok: false, reason: "invalid verse range" };
    }
    return { ok: true, normalized: `${book} 1:${verse}` };
  }

  // Bare number: "1" → whole book chapter unit "Book 1"
  // "3" → verse 3 as "Book 1:3" when N > 1
  const bareNumber = tail.match(/^(\d+)\.?$/);
  if (bareNumber) {
    const n = Number(bareNumber[1]);
    if (!Number.isInteger(n) || n < 1) {
      return { ok: false, reason: "invalid verse range" };
    }
    if (n === 1) {
      return { ok: true, normalized: `${book} 1` };
    }
    return { ok: true, normalized: `${book} 1:${n}` };
  }

  return { ok: false, reason: "unparseable reference shape" };
}
