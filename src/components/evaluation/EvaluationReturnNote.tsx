import { serifFont } from "./shared";

type EvaluationReturnNoteProps = {
  lines: readonly string[];
};

/**
 * Three sentences after the practical steps. Body type, no chrome.
 * Screen only: a saved PDF would freeze the monthly count.
 */
export function EvaluationReturnNote({ lines }: EvaluationReturnNoteProps) {
  if (lines.length === 0) {
    return null;
  }

  return (
    <div className="evaluation-return-note screen-only mb-10">
      {lines.map((line, index) => (
        <p
          key={index}
          className="mb-3 text-[15px] leading-relaxed last:mb-0"
          style={{ ...serifFont, color: "var(--sc-ink)" }}
        >
          {line}
        </p>
      ))}
    </div>
  );
}
