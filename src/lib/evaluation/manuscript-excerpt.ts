function normalizeForSearch(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function findQuoteIndex(manuscript: string, quote: string): number {
  const directIndex = manuscript.indexOf(quote);
  if (directIndex !== -1) {
    return directIndex;
  }

  const normalizedManuscript = normalizeForSearch(manuscript);
  const normalizedQuote = normalizeForSearch(quote);
  if (!normalizedQuote) {
    return -1;
  }

  const normalizedIndex = normalizedManuscript.indexOf(normalizedQuote);
  if (normalizedIndex === -1) {
    return -1;
  }

  // Map normalized index back to manuscript by scanning words (approximate).
  const wordsBefore = normalizedManuscript.slice(0, normalizedIndex);
  const wordOffset = wordsBefore.length > 0 ? wordsBefore.length : 0;
  return Math.min(wordOffset, manuscript.length - 1);
}

function expandToSnippet(
  manuscript: string,
  start: number,
  end: number,
  radius: number,
): string {
  const snippetStart = Math.max(0, start - radius);
  const snippetEnd = Math.min(manuscript.length, end + radius);
  let snippet = manuscript.slice(snippetStart, snippetEnd).trim();

  if (snippetStart > 0) {
    snippet = `…${snippet}`;
  }

  if (snippetEnd < manuscript.length) {
    snippet = `${snippet}…`;
  }

  return snippet;
}

/** Pulls a manuscript window around an anchored quote (or rewrite original) for coaching. */
export function extractManuscriptExcerpt(
  manuscript: string,
  quote: string,
  radius = 320,
): string | null {
  const trimmedQuote = quote.trim();
  if (!trimmedQuote) {
    return null;
  }

  const index = findQuoteIndex(manuscript, trimmedQuote);
  if (index === -1) {
    return null;
  }

  return expandToSnippet(
    manuscript,
    index,
    index + trimmedQuote.length,
    radius,
  );
}
