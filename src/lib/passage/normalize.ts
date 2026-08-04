/**
 * Passage reference normalization for passage_inventories cache keys.
 *
 * Canonical form: full English book name, space, chapter:verse range with
 * colon separators and a single hyphen for ranges, no internal spaces.
 * Example: "Hebrews 3:1-6"
 *
 * Out of scope for this branch: cross-chapter ranges, versification variants,
 * and apocrypha. Unparseable input returns null so callers can log and skip.
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

type CanonicalBook = (typeof CANONICAL_BOOKS)[number];

/**
 * Lowercase abbreviation / alternate → canonical. Longer aliases first
 * when matching so "1 corinthians" wins over bare digit patterns via full book.
 */
const BOOK_ALIASES: ReadonlyArray<readonly [string, CanonicalBook]> = [
  // Order: longer / more specific first within each family.
  ["song of solomon", "Song of Solomon"],
  ["song of songs", "Song of Solomon"],
  ["songs", "Song of Solomon"],
  ["canticle of canticles", "Song of Solomon"],
  ["canticles", "Song of Solomon"],
  ["1 thessalonians", "1 Thessalonians"],
  ["2 thessalonians", "2 Thessalonians"],
  ["1 thess", "1 Thessalonians"],
  ["2 thess", "2 Thessalonians"],
  ["1 thes", "1 Thessalonians"],
  ["2 thes", "2 Thessalonians"],
  ["1 corinthians", "1 Corinthians"],
  ["2 corinthians", "2 Corinthians"],
  ["1 cor", "1 Corinthians"],
  ["2 cor", "2 Corinthians"],
  ["1 chronicles", "1 Chronicles"],
  ["2 chronicles", "2 Chronicles"],
  ["1 chron", "1 Chronicles"],
  ["2 chron", "2 Chronicles"],
  ["1 chr", "1 Chronicles"],
  ["2 chr", "2 Chronicles"],
  ["1 samuel", "1 Samuel"],
  ["2 samuel", "2 Samuel"],
  ["1 sam", "1 Samuel"],
  ["2 sam", "2 Samuel"],
  ["1 kings", "1 Kings"],
  ["2 kings", "2 Kings"],
  ["1 kgs", "1 Kings"],
  ["2 kgs", "2 Kings"],
  ["1 king", "1 Kings"],
  ["2 king", "2 Kings"],
  ["1 timothy", "1 Timothy"],
  ["2 timothy", "2 Timothy"],
  ["1 tim", "1 Timothy"],
  ["2 tim", "2 Timothy"],
  ["1 peter", "1 Peter"],
  ["2 peter", "2 Peter"],
  ["1 pet", "1 Peter"],
  ["2 pet", "2 Peter"],
  ["1 john", "1 John"],
  ["2 john", "2 John"],
  ["3 john", "3 John"],
  ["1 jn", "1 John"],
  ["2 jn", "2 John"],
  ["3 jn", "3 John"],
  ["philippians", "Philippians"],
  ["phillipians", "Philippians"],
  ["philipians", "Philippians"],
  ["phil", "Philippians"],
  ["philemon", "Philemon"],
  ["phlm", "Philemon"],
  ["phm", "Philemon"],
  ["ephesians", "Ephesians"],
  ["epheisans", "Ephesians"],
  ["eph", "Ephesians"],
  ["hebrews", "Hebrews"],
  ["heb", "Hebrews"],
  ["genesis", "Genesis"],
  ["gen", "Genesis"],
  ["exodus", "Exodus"],
  ["exod", "Exodus"],
  ["exo", "Exodus"],
  ["ex", "Exodus"],
  ["leviticus", "Leviticus"],
  ["lev", "Leviticus"],
  ["numbers", "Numbers"],
  ["num", "Numbers"],
  ["deuteronomy", "Deuteronomy"],
  ["deut", "Deuteronomy"],
  ["deu", "Deuteronomy"],
  ["dt", "Deuteronomy"],
  ["joshua", "Joshua"],
  ["josh", "Joshua"],
  ["jos", "Joshua"],
  ["judges", "Judges"],
  ["judg", "Judges"],
  ["jdg", "Judges"],
  ["ruth", "Ruth"],
  ["ezra", "Ezra"],
  ["nehemiah", "Nehemiah"],
  ["neh", "Nehemiah"],
  ["esther", "Esther"],
  ["est", "Esther"],
  ["job", "Job"],
  ["psalm", "Psalm"],
  ["psalms", "Psalm"],
  ["ps", "Psalm"],
  ["pss", "Psalm"],
  ["proverbs", "Proverbs"],
  ["prov", "Proverbs"],
  ["pro", "Proverbs"],
  ["ecclesiastes", "Ecclesiastes"],
  ["eccl", "Ecclesiastes"],
  ["ecc", "Ecclesiastes"],
  ["qoheleth", "Ecclesiastes"],
  ["isaiah", "Isaiah"],
  ["isa", "Isaiah"],
  ["jeremiah", "Jeremiah"],
  ["jer", "Jeremiah"],
  ["lamentations", "Lamentations"],
  ["lam", "Lamentations"],
  ["ezekiel", "Ezekiel"],
  ["ezek", "Ezekiel"],
  ["eze", "Ezekiel"],
  ["daniel", "Daniel"],
  ["dan", "Daniel"],
  ["hosea", "Hosea"],
  ["hos", "Hosea"],
  ["joel", "Joel"],
  ["amos", "Amos"],
  ["obadiah", "Obadiah"],
  ["obad", "Obadiah"],
  ["oba", "Obadiah"],
  ["jonah", "Jonah"],
  ["jon", "Jonah"],
  ["micah", "Micah"],
  ["mic", "Micah"],
  ["nahum", "Nahum"],
  ["nah", "Nahum"],
  ["habakkuk", "Habakkuk"],
  ["hab", "Habakkuk"],
  ["zephaniah", "Zephaniah"],
  ["zeph", "Zephaniah"],
  ["zep", "Zephaniah"],
  ["haggai", "Haggai"],
  ["hag", "Haggai"],
  ["zechariah", "Zechariah"],
  ["zech", "Zechariah"],
  ["zec", "Zechariah"],
  ["malachi", "Malachi"],
  ["mal", "Malachi"],
  ["matthew", "Matthew"],
  ["matt", "Matthew"],
  ["mt", "Matthew"],
  ["mark", "Mark"],
  ["mk", "Mark"],
  ["mrk", "Mark"],
  ["luke", "Luke"],
  ["lk", "Luke"],
  ["john", "John"],
  ["jn", "John"],
  ["jhn", "John"],
  ["acts", "Acts"],
  ["romans", "Romans"],
  ["rom", "Romans"],
  ["galatians", "Galatians"],
  ["gal", "Galatians"],
  ["colossians", "Colossians"],
  ["col", "Colossians"],
  ["titus", "Titus"],
  ["tit", "Titus"],
  ["james", "James"],
  ["jas", "James"],
  ["jude", "Jude"],
  ["revelation", "Revelation"],
  ["revelations", "Revelation"],
  ["rev", "Revelation"],
  ["apocalypse", "Revelation"],
];

// Sort aliases by length descending so longer matches win at lookup time.
const ALIAS_BY_LENGTH = [...BOOK_ALIASES].sort(
  (a, b) => b[0].length - a[0].length,
);

const CANONICAL_LOOKUP = new Map<string, CanonicalBook>(
  CANONICAL_BOOKS.map((b) => [b.toLowerCase(), b]),
);

function resolveBook(bookToken: string): CanonicalBook | null {
  const key = bookToken
    .toLowerCase()
    .replace(/\./g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!key) return null;

  const exact = CANONICAL_LOOKUP.get(key);
  if (exact) return exact;

  for (const [alias, canonical] of ALIAS_BY_LENGTH) {
    if (key === alias) return canonical;
  }
  return null;
}

/**
 * Normalize a preacher- or operator-supplied passage reference.
 * Rejects cross-chapter ranges and multi-passage strings for this branch.
 */
export function normalizePassageRef(raw: string): NormalizePassageResult {
  if (typeof raw !== "string") {
    return { ok: false, reason: "not a string" };
  }

  // Strip parenthetical annotations and trailing speaker notes: "Psalm 31 (Greg Cox)"
  let input = raw
    .replace(/\([^)]*\)/g, " ")
    .replace(/\[[^\]]*\]/g, " ")
    .trim();
  if (!input) {
    return { ok: false, reason: "empty" };
  }

  // Single-passage only: reject semicolon multi-passages and "and"/comma lists.
  if (/;/.test(input) || /\band\b/i.test(input)) {
    return { ok: false, reason: "multiple passages not supported" };
  }

  // Normalize dashes (en/em) to hyphen for parsing.
  input = input
    .replace(/[\u2013\u2014\u2212]/g, "-")
    .replace(/\s+/g, " ")
    .trim();

  // Dots used as verse separators: "Hebrews 3.1-6" → colon form for the ref tail.
  // Keep book initials with periods out by stripping periods after digit patterns later.

  // Match: optional leading number + book words, then chapter, optional verse range.
  // Examples: "Heb 3:1-6", "Hebrews 3", "2 Samuel 9:1-13", "Psalm 23"
  const match = input.match(
    /^((?:[123]\s*)?[A-Za-z]+(?:\s+[A-Za-z]+){0,3}?)\.?\s+(\d+)(?:[:.\s]+(\d+))?(?:\s*-\s*(\d+)(?:[:.](\d+))?)?\.?\s*$/,
  );

  if (!match) {
    return { ok: false, reason: "unparseable reference shape" };
  }

  const bookToken = match[1].replace(/\./g, " ").replace(/\s+/g, " ").trim();
  const book = resolveBook(bookToken);
  if (!book) {
    return { ok: false, reason: `unknown book: ${bookToken}` };
  }

  const startChapter = Number(match[2]);
  const startVerse = match[3] != null ? Number(match[3]) : null;
  const rangeSecond = match[4] != null ? Number(match[4]) : null;
  const endVerseExplicit = match[5] != null ? Number(match[5]) : null;

  if (!Number.isInteger(startChapter) || startChapter < 1) {
    return { ok: false, reason: "invalid chapter" };
  }

  // Chapter-only: "Hebrews 3" or "Jonah 4"
  if (startVerse == null && rangeSecond == null) {
    return { ok: true, normalized: `${book} ${startChapter}` };
  }

  // "Hebrews 3:1-6" → startVerse=1, rangeSecond=6 (verse end, same chapter)
  // "Hebrews 3:1-4:6" would be startVerse=1, rangeSecond=4, endVerseExplicit=6 → cross-chapter, reject
  if (startVerse != null && rangeSecond != null && endVerseExplicit != null) {
    // Form chapter:verse-chapter:verse
    if (rangeSecond !== startChapter) {
      return { ok: false, reason: "cross-chapter ranges not supported" };
    }
    if (endVerseExplicit < startVerse) {
      return { ok: false, reason: "invalid verse range" };
    }
    return {
      ok: true,
      normalized: `${book} ${startChapter}:${startVerse}-${endVerseExplicit}`,
    };
  }

  if (startVerse != null && rangeSecond != null && endVerseExplicit == null) {
    // Ambiguous in general literature: 3:1-6 almost always same-chapter verse range.
    // Cross-chapter 3:1-4 would need end chapter only without end verse — reject if
    // second number looks like a chapter continuation without verse (unsupported).
    // Convention for this branch: second number is end verse in same chapter.
    if (rangeSecond < startVerse) {
      return { ok: false, reason: "invalid verse range" };
    }
    return {
      ok: true,
      normalized: `${book} ${startChapter}:${startVerse}-${rangeSecond}`,
    };
  }

  // Single verse: "Hebrews 3:6"
  if (startVerse != null && rangeSecond == null) {
    return {
      ok: true,
      normalized: `${book} ${startChapter}:${startVerse}`,
    };
  }

  // Chapter range without verses "Hebrews 3-4" — out of scope.
  if (startVerse == null && rangeSecond != null) {
    return { ok: false, reason: "chapter-only ranges not supported" };
  }

  return { ok: false, reason: "unparseable reference shape" };
}
