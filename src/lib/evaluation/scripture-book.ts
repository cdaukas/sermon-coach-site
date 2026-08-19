/**
 * Derive the biblical book from a preacher-provided passage reference.
 * Used to name Simeon Trust's book-level melodic line; series titles are not a substitute.
 */

type BookEntry = {
  name: string;
  aliases: readonly string[];
};

const CANONICAL_BOOKS: readonly BookEntry[] = [
  { name: "Genesis", aliases: ["genesis", "gen", "gn"] },
  { name: "Exodus", aliases: ["exodus", "exod", "exo", "ex"] },
  { name: "Leviticus", aliases: ["leviticus", "lev", "lv"] },
  { name: "Numbers", aliases: ["numbers", "num", "nm", "nu"] },
  { name: "Deuteronomy", aliases: ["deuteronomy", "deut", "dt"] },
  { name: "Joshua", aliases: ["joshua", "josh", "jos"] },
  { name: "Judges", aliases: ["judges", "judg", "jdg", "jg"] },
  { name: "Ruth", aliases: ["ruth", "ru"] },
  { name: "1 Samuel", aliases: ["1 samuel", "1 sam", "1 sa", "1sm", "i samuel", "first samuel"] },
  { name: "2 Samuel", aliases: ["2 samuel", "2 sam", "2 sa", "2sm", "ii samuel", "second samuel"] },
  { name: "1 Kings", aliases: ["1 kings", "1 kgs", "1 ki", "i kings", "first kings"] },
  { name: "2 Kings", aliases: ["2 kings", "2 kgs", "2 ki", "ii kings", "second kings"] },
  { name: "1 Chronicles", aliases: ["1 chronicles", "1 chron", "1 chr", "1 ch", "i chronicles", "first chronicles"] },
  { name: "2 Chronicles", aliases: ["2 chronicles", "2 chron", "2 chr", "2 ch", "ii chronicles", "second chronicles"] },
  { name: "Ezra", aliases: ["ezra", "ezr"] },
  { name: "Nehemiah", aliases: ["nehemiah", "neh"] },
  { name: "Esther", aliases: ["esther", "esth", "est"] },
  { name: "Job", aliases: ["job"] },
  { name: "Psalms", aliases: ["psalms", "psalm", "ps", "psa"] },
  { name: "Proverbs", aliases: ["proverbs", "prov", "prv", "pr"] },
  { name: "Ecclesiastes", aliases: ["ecclesiastes", "eccles", "eccl", "ecc", "qoheleth"] },
  {
    name: "Song of Songs",
    aliases: [
      "song of songs",
      "song of solomon",
      "canticles",
      "canticle of canticles",
      "song",
      "sos",
      "so",
    ],
  },
  { name: "Isaiah", aliases: ["isaiah", "isa", "is"] },
  { name: "Jeremiah", aliases: ["jeremiah", "jer"] },
  { name: "Lamentations", aliases: ["lamentations", "lam"] },
  { name: "Ezekiel", aliases: ["ezekiel", "ezek", "eze"] },
  { name: "Daniel", aliases: ["daniel", "dan", "dn"] },
  { name: "Hosea", aliases: ["hosea", "hos"] },
  { name: "Joel", aliases: ["joel", "jl"] },
  { name: "Amos", aliases: ["amos", "am"] },
  { name: "Obadiah", aliases: ["obadiah", "obad", "ob"] },
  { name: "Jonah", aliases: ["jonah", "jon"] },
  { name: "Micah", aliases: ["micah", "mic"] },
  { name: "Nahum", aliases: ["nahum", "nah"] },
  { name: "Habakkuk", aliases: ["habakkuk", "hab"] },
  { name: "Zephaniah", aliases: ["zephaniah", "zeph", "zep"] },
  { name: "Haggai", aliases: ["haggai", "hag"] },
  { name: "Zechariah", aliases: ["zechariah", "zech", "zec"] },
  { name: "Malachi", aliases: ["malachi", "mal"] },
  { name: "Matthew", aliases: ["matthew", "matt", "mt"] },
  { name: "Mark", aliases: ["mark", "mk", "mrk"] },
  { name: "Luke", aliases: ["luke", "lk"] },
  { name: "John", aliases: ["john", "jn", "joh"] },
  { name: "Acts", aliases: ["acts", "act"] },
  { name: "Romans", aliases: ["romans", "rom", "ro"] },
  { name: "1 Corinthians", aliases: ["1 corinthians", "1 cor", "1 co", "i corinthians", "first corinthians"] },
  { name: "2 Corinthians", aliases: ["2 corinthians", "2 cor", "2 co", "ii corinthians", "second corinthians"] },
  { name: "Galatians", aliases: ["galatians", "gal"] },
  { name: "Ephesians", aliases: ["ephesians", "eph"] },
  { name: "Philippians", aliases: ["philippians", "phil", "php", "pp"] },
  { name: "Colossians", aliases: ["colossians", "col"] },
  { name: "1 Thessalonians", aliases: ["1 thessalonians", "1 thess", "1 th", "i thessalonians", "first thessalonians"] },
  { name: "2 Thessalonians", aliases: ["2 thessalonians", "2 thess", "2 th", "ii thessalonians", "second thessalonians"] },
  { name: "1 Timothy", aliases: ["1 timothy", "1 tim", "1 ti", "i timothy", "first timothy"] },
  { name: "2 Timothy", aliases: ["2 timothy", "2 tim", "2 ti", "ii timothy", "second timothy"] },
  { name: "Titus", aliases: ["titus", "tit"] },
  { name: "Philemon", aliases: ["philemon", "phlm", "phm"] },
  { name: "Hebrews", aliases: ["hebrews", "heb"] },
  { name: "James", aliases: ["james", "jas", "jm"] },
  { name: "1 Peter", aliases: ["1 peter", "1 pet", "1 pe", "i peter", "first peter"] },
  { name: "2 Peter", aliases: ["2 peter", "2 pet", "2 pe", "ii peter", "second peter"] },
  { name: "1 John", aliases: ["1 john", "1 jn", "1 jo", "i john", "first john"] },
  { name: "2 John", aliases: ["2 john", "2 jn", "2 jo", "ii john", "second john"] },
  { name: "3 John", aliases: ["3 john", "3 jn", "3 jo", "iii john", "third john"] },
  { name: "Jude", aliases: ["jude"] },
  { name: "Revelation", aliases: ["revelation", "rev", "re", "apocalypse"] },
];

const ALIAS_INDEX: { alias: string; name: string }[] = CANONICAL_BOOKS.flatMap(
  (book) => book.aliases.map((alias) => ({ alias, name: book.name })),
).sort((a, b) => b.alias.length - a.alias.length);

function normalizePassage(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/^[the\s]+book\s+of\s+/i, "")
    .replace(/[.]/g, "")
    .replace(/[_/]/g, " ")
    .replace(/\s+/g, " ")
    .replace(/^first\s+/i, "1 ")
    .replace(/^second\s+/i, "2 ")
    .replace(/^third\s+/i, "3 ")
    .replace(/^i\s+/i, "1 ")
    .replace(/^ii\s+/i, "2 ")
    .replace(/^iii\s+/i, "3 ");
}

/**
 * Return the canonical book name from a passage reference, or null if none
 * can be derived. Does not guess from series titles or sermon titles.
 */
export function deriveBookFromPassage(passage: string | null | undefined): string | null {
  if (!passage?.trim()) {
    return null;
  }

  const normalized = normalizePassage(passage);
  if (!normalized) {
    return null;
  }

  for (const { alias, name } of ALIAS_INDEX) {
    if (normalized === alias) {
      return name;
    }
    if (normalized.startsWith(`${alias} `) || normalized.startsWith(`${alias}:`)) {
      return name;
    }
    // "philippians4:10" without a space before the chapter.
    if (/^\d/.test(normalized.slice(alias.length)) && normalized.startsWith(alias)) {
      return name;
    }
  }

  return null;
}
