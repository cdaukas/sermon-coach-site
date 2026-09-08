/**
 * Genre caveat for agency / Christ-theme counts.
 * Print the genre mix; never adjust the number.
 */

export type PrepGenre =
  | "gospel_narrative"
  | "acts"
  | "epistle"
  | "ot_narrative"
  | "wisdom"
  | "prophecy"
  | "apocalyptic"
  | "law"
  | "unknown";

const BOOK_GENRE: Record<string, PrepGenre> = {
  genesis: "ot_narrative",
  exodus: "ot_narrative",
  leviticus: "law",
  numbers: "ot_narrative",
  deuteronomy: "law",
  joshua: "ot_narrative",
  judges: "ot_narrative",
  ruth: "ot_narrative",
  "1 samuel": "ot_narrative",
  "2 samuel": "ot_narrative",
  "1 kings": "ot_narrative",
  "2 kings": "ot_narrative",
  "1 chronicles": "ot_narrative",
  "2 chronicles": "ot_narrative",
  ezra: "ot_narrative",
  nehemiah: "ot_narrative",
  esther: "ot_narrative",
  job: "wisdom",
  psalm: "wisdom",
  psalms: "wisdom",
  proverb: "wisdom",
  proverbs: "wisdom",
  ecclesiastes: "wisdom",
  "song of solomon": "wisdom",
  "song of songs": "wisdom",
  isaiah: "prophecy",
  jeremiah: "prophecy",
  lamentations: "prophecy",
  ezekiel: "prophecy",
  daniel: "apocalyptic",
  hosea: "prophecy",
  joel: "prophecy",
  amos: "prophecy",
  obadiah: "prophecy",
  jonah: "ot_narrative",
  micah: "prophecy",
  nahum: "prophecy",
  habakkuk: "prophecy",
  zephaniah: "prophecy",
  haggai: "prophecy",
  zechariah: "prophecy",
  malachi: "prophecy",
  matthew: "gospel_narrative",
  mark: "gospel_narrative",
  luke: "gospel_narrative",
  john: "gospel_narrative",
  acts: "acts",
  romans: "epistle",
  "1 corinthians": "epistle",
  "2 corinthians": "epistle",
  galatians: "epistle",
  ephesians: "epistle",
  philippians: "epistle",
  colossians: "epistle",
  "1 thessalonians": "epistle",
  "2 thessalonians": "epistle",
  "1 timothy": "epistle",
  "2 timothy": "epistle",
  titus: "epistle",
  philemon: "epistle",
  hebrews: "epistle",
  james: "epistle",
  "1 peter": "epistle",
  "2 peter": "epistle",
  "1 john": "epistle",
  "2 john": "epistle",
  "3 john": "epistle",
  jude: "epistle",
  revelation: "apocalyptic",
};

const BOOK_ALIASES: Array<[RegExp, string]> = [
  [/^gen(?:esis)?\b/i, "genesis"],
  [/^ex(?:od(?:us)?)?\b/i, "exodus"],
  [/^lev(?:iticus)?\b/i, "leviticus"],
  [/^num(?:bers)?\b/i, "numbers"],
  [/^deut(?:eronomy)?\b/i, "deuteronomy"],
  [/^josh(?:ua)?\b/i, "joshua"],
  [/^judg(?:es)?\b/i, "judges"],
  [/^ruth\b/i, "ruth"],
  [/^1\s*sam(?:uel)?\b/i, "1 samuel"],
  [/^2\s*sam(?:uel)?\b/i, "2 samuel"],
  [/^1\s*k(?:in)?gs?\b/i, "1 kings"],
  [/^2\s*k(?:in)?gs?\b/i, "2 kings"],
  [/^1\s*chr(?:on(?:icles)?)?\b/i, "1 chronicles"],
  [/^2\s*chr(?:on(?:icles)?)?\b/i, "2 chronicles"],
  [/^ezra\b/i, "ezra"],
  [/^neh(?:emiah)?\b/i, "nehemiah"],
  [/^esth(?:er)?\b/i, "esther"],
  [/^job\b/i, "job"],
  [/^ps(?:alm|alms)?\b/i, "psalms"],
  [/^prov(?:erbs?)?\b/i, "proverbs"],
  [/^eccl?(?:esiastes)?\b/i, "ecclesiastes"],
  [/^song(?:\s+of\s+(?:solomon|songs))?\b/i, "song of songs"],
  [/^isa(?:iah)?\b/i, "isaiah"],
  [/^jer(?:emiah)?\b/i, "jeremiah"],
  [/^lam(?:entations)?\b/i, "lamentations"],
  [/^ezek(?:iel)?\b/i, "ezekiel"],
  [/^dan(?:iel)?\b/i, "daniel"],
  [/^hos(?:ea)?\b/i, "hosea"],
  [/^joel\b/i, "joel"],
  [/^amos\b/i, "amos"],
  [/^obad(?:iah)?\b/i, "obadiah"],
  [/^jonah\b/i, "jonah"],
  [/^mic(?:ah)?\b/i, "micah"],
  [/^nah(?:um)?\b/i, "nahum"],
  [/^hab(?:akkuk)?\b/i, "habakkuk"],
  [/^zeph(?:aniah)?\b/i, "zephaniah"],
  [/^hag(?:gai)?\b/i, "haggai"],
  [/^zech(?:ariah)?\b/i, "zechariah"],
  [/^mal(?:achi)?\b/i, "malachi"],
  [/^matt?(?:hew)?\b/i, "matthew"],
  [/^(?:mk|mark)\b/i, "mark"],
  [/^(?:lk|luke)\b/i, "luke"],
  [/^(?:jn|john)\b/i, "john"],
  [/^(?:ac|acts)\b/i, "acts"],
  [/^rom(?:ans)?\b/i, "romans"],
  [/^1\s*cor(?:inthians)?\b/i, "1 corinthians"],
  [/^2\s*cor(?:inthians)?\b/i, "2 corinthians"],
  [/^gal(?:atians)?\b/i, "galatians"],
  [/^eph(?:esians)?\b/i, "ephesians"],
  [/^phil(?:ippians)?\b/i, "philippians"],
  [/^col(?:ossians)?\b/i, "colossians"],
  [/^1\s*thess(?:alonians)?\b/i, "1 thessalonians"],
  [/^2\s*thess(?:alonians)?\b/i, "2 thessalonians"],
  [/^1\s*tim(?:othy)?\b/i, "1 timothy"],
  [/^2\s*tim(?:othy)?\b/i, "2 timothy"],
  [/^tit(?:us)?\b/i, "titus"],
  [/^philem(?:on)?\b/i, "philemon"],
  [/^heb(?:rews)?\b/i, "hebrews"],
  [/^(?:jas|james)\b/i, "james"],
  [/^1\s*pet(?:er)?\b/i, "1 peter"],
  [/^2\s*pet(?:er)?\b/i, "2 peter"],
  [/^1\s*(?:jn|john)\b/i, "1 john"],
  [/^2\s*(?:jn|john)\b/i, "2 john"],
  [/^3\s*(?:jn|john)\b/i, "3 john"],
  [/^jude\b/i, "jude"],
  [/^rev(?:elation)?\b/i, "revelation"],
];

export function normalizeBookName(raw: string): string | null {
  const trimmed = raw.trim().toLowerCase().replace(/\./g, "");
  if (!trimmed) {
    return null;
  }
  for (const [re, book] of BOOK_ALIASES) {
    if (re.test(trimmed)) {
      return book;
    }
  }
  return null;
}

/** Parse the leading book from a primary_passage string. */
export function bookFromPrimaryPassage(
  passage: string | null | undefined,
): string | null {
  if (!passage || !passage.trim()) {
    return null;
  }
  const text = passage.trim();
  // Numbered books first: "1 Corinthians 13:1"
  const numbered = text.match(/^(\d\s*[A-Za-z][A-Za-z]+)/);
  if (numbered?.[1]) {
    return normalizeBookName(numbered[1]);
  }
  const plain = text.match(/^([A-Za-z][A-Za-z]+(?:\s+[A-Za-z]+)?)/);
  if (plain?.[1]) {
    return normalizeBookName(plain[1]);
  }
  return null;
}

export function genreForBook(book: string | null): PrepGenre {
  if (!book) {
    return "unknown";
  }
  return BOOK_GENRE[book] ?? "unknown";
}

export function genreForPassage(passage: string | null | undefined): PrepGenre {
  return genreForBook(bookFromPrimaryPassage(passage));
}

const GENRE_LABEL: Record<PrepGenre, string> = {
  gospel_narrative: "gospel narrative",
  acts: "Acts",
  epistle: "epistles",
  ot_narrative: "Old Testament narrative",
  wisdom: "wisdom literature",
  prophecy: "prophecy",
  apocalyptic: "apocalyptic",
  law: "law",
  unknown: "unlabelled passages",
};

/**
 * One face line under Christ-theme counts. Never adjusts the number.
 * Returns null when there is nothing useful to say.
 */
export function prepGenreCaveat(params: {
  passages: Array<string | null | undefined>;
  sampleSize: number;
}): string | null {
  const counts = new Map<PrepGenre, number>();
  let labelled = 0;
  for (const passage of params.passages) {
    const genre = genreForPassage(passage);
    if (genre === "unknown") {
      continue;
    }
    labelled += 1;
    counts.set(genre, (counts.get(genre) ?? 0) + 1);
  }
  if (labelled === 0) {
    return null;
  }

  const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  const top = ranked.slice(0, 2);
  const mix = top
    .map(([genre, n]) => `${GENRE_LABEL[genre]} (${n})`)
    .join(" and ");

  const dominant = top[0]?.[0];
  let relative = "";
  if (dominant === "wisdom") {
    relative =
      " Wisdom literature runs about a third of what gospel narrative runs, and that is the text, not you.";
  } else if (dominant === "gospel_narrative" || dominant === "acts") {
    relative =
      " Gospel narrative and Acts run higher on Christ-agency counts than wisdom or OT narrative, and that is the text, not you.";
  } else if (dominant === "epistle") {
    relative =
      " Epistles sit mid-pack on Christ density; wisdom runs lower and gospel narrative higher, and that is the text, not you.";
  } else {
    relative =
      " This number moves with the book, and that is the text, not you.";
  }

  return `These ${params.sampleSize} sermons were mostly ${mix}.${relative}`;
}
