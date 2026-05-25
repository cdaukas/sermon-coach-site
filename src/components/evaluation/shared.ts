export const serifFont = { fontFamily: "var(--font-serif)" };
export const uiFont = { fontFamily: "var(--font-ui)" };

export type SectionEyebrowVariant = "green" | "amber";

const BEAT_COLORS: { match: RegExp; color: string }[] = [
  { match: /diagnostic/i, color: "#6b7a8f" },
  { match: /teaching/i, color: "#a8a59a" },
  { match: /reverent/i, color: "#5a4a6b" },
  { match: /pastoral/i, color: "#7a8f6b" },
  { match: /convicting/i, color: "#a04848" },
  { match: /climactic/i, color: "#4a7c59" },
  { match: /awe/i, color: "#6b4a7a" },
  { match: /tender/i, color: "#6b4a4a" },
  { match: /doxological/i, color: "#c9892e" },
  { match: /declarative/i, color: "#4a6584" },
];

export function beatBackgroundColor(register: string): string {
  const normalized = register.toLowerCase();
  for (const { match, color } of BEAT_COLORS) {
    if (match.test(normalized)) return color;
  }
  return "#6b7a8f";
}

export function beatHasMismatch(register: string): boolean {
  return register.toLowerCase().includes("mismatch");
}

export function textSupportTone(
  textSupport: "strong" | "yes" | "partial" | "mismatch" | string,
): "match" | "partial" {
  if (textSupport === "partial" || textSupport === "mismatch") return "partial";
  return "match";
}

export function textSupportLabel(
  textSupport: "strong" | "yes" | "partial" | "mismatch",
): string {
  switch (textSupport) {
    case "strong":
      return "✓ Strong";
    case "partial":
      return "⚠ Partial";
    case "mismatch":
      return "⚠ Mismatch";
    default:
      return "✓";
  }
}

export function formatLengthMinutes(minutes: number): string {
  return `~${minutes} minutes`;
}
