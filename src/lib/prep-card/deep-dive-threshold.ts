/**
 * Sermons required before the first deep dive report.
 *
 * The evaluation close and the deep dive unlock bar both read this.
 * Do not copy the number into either sentence.
 */
export const DEEP_DIVE_MIN_SERMONS = 12;

/** Most sermons one report may measure. A cost cap, not a statistic. */
export const DEEP_DIVE_MAX_SERMONS = 30;

/** Newest sermons pre-selected when the picker opens. */
export const DEEP_DIVE_PRESELECT = 24;

/** Rolling quarter, counted from the last theme diagnostic. */
export const DEEP_DIVE_QUARTER_MONTHS = 3;

/**
 * Reports built from fewer than this many sermons carry the small-sample line.
 * Eighteen is the line; it is not the unlock count.
 */
export const DEEP_DIVE_SMALL_SAMPLE_BELOW = 18;

/**
 * Prose form of {@link DEEP_DIVE_MIN_SERMONS} for a sentence.
 * The unlock bar uses the numeral (`9 of 12`). The close uses this
 * so "twelve" and "12" cannot drift apart.
 */
export function deepDiveThresholdProse(language: "en" | "es"): string {
  if (DEEP_DIVE_MIN_SERMONS === 12) {
    return language === "es" ? "doce" : "twelve";
  }
  return String(DEEP_DIVE_MIN_SERMONS);
}
