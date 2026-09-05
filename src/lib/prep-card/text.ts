/**
 * Text prep for prep-card counters.
 * Ported from scripts/sermon_parsers.py (clean + source format + structure).
 */

const FOOTNOTE_LINK = /\[\*?[a-z0-9]{1,3}\*?\]\(https?:\/\/[^)]*\)/gi;
const MD_LINK = /\[([^\]]*)\]\(https?:\/\/[^)]*\)/g;
const ESCAPED = /\\([.#*_\-!'"()[\]])/g;
const VERSE_NUM = /__\s*\d+\s*__/g;
const BOLD_ITAL = /[_*]{1,3}/g;
const FOOTNOTE_MARK = /\*\d+\*|\*\d+(?=\s|$)/g;
const ANCHOR_FOOTNOTE = /<a id="footnote-[^"]*"><\/a>/g;
const FOOTNOTE_LIST = /\n\s*\d+\.\s*<a id="footnote-[^\n]*/gm;
const FOOTNOTE_REF = /\[\s*[↑^]\s*\]\(#footnote-ref-\d+\)/g;
const FOOTNOTE_PLAIN =
  /\n\s*\d+\.\s+(?:Greek |Or |ver\.|ch\.|See |Some manuscripts|The Holy Bible)/gm;
const INLINE_FN = /\[\[[^\]]+\]\]\(#footnote-\d+\)/g;
const MD_FOOTNOTE_DEF = /^\[\^\d+\]:.*$/gm;
const MD_FOOTNOTE_REF = /\[\^\d+\]/g;

export function cleanSermonText(text: string): string {
  let t = text;
  t = t.replace(FOOTNOTE_LIST, "");
  t = t.replace(FOOTNOTE_PLAIN, "");
  t = t.replace(ANCHOR_FOOTNOTE, "");
  t = t.replace(FOOTNOTE_REF, "");
  t = t.replace(INLINE_FN, "");
  t = t.replace(MD_FOOTNOTE_DEF, "");
  t = t.replace(MD_FOOTNOTE_REF, "");
  t = t.replace(FOOTNOTE_LINK, "");
  t = t.replace(MD_LINK, "$1");
  t = t.replace(VERSE_NUM, " ");
  t = t.replace(FOOTNOTE_MARK, "");
  t = t.replace(ESCAPED, "$1");
  t = t.replace(BOLD_ITAL, "");
  t = t.replace(/[ \t]+/g, " ");
  t = t.replace(/\n{3,}/g, "\n\n");
  return t.trim();
}

export function sermonParagraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
}

export function isFlattenedTranscript(text: string): boolean {
  if (text.length < 400) {
    return false;
  }
  const newlines = (text.match(/\n/g) ?? []).length;
  return newlines <= 3 && newlines / text.length < 0.002;
}

export function detectPrepSourceFormat(
  raw: string,
  intakePath?: string | null,
): "manuscript" | "transcript" {
  if (intakePath === "youtube") {
    return "transcript";
  }
  if (isFlattenedTranscript(raw)) {
    return "transcript";
  }
  return "manuscript";
}

export function scriptureParagraphFlags(rawText: string): boolean[] {
  const rawParas = rawText.split(/\n\s*\n/).filter((p) => p.trim());
  return rawParas.map((p) => {
    const verses = (p.match(VERSE_NUM) ?? []).length;
    const notes = (p.match(FOOTNOTE_LINK) ?? []).length;
    return verses >= 2 || notes >= 3;
  });
}
