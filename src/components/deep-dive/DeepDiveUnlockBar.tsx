import { serifFont } from "@/components/evaluation/shared";
import { deepDiveEmptyLine } from "@/lib/prep-card/deep-dive-dashboard";

export function DeepDiveUnlockBar({ sermonCount }: { sermonCount: number }) {
  return (
    <p
      className="max-w-[46ch] text-[20px] leading-snug"
      style={{ ...serifFont, color: "var(--sc-ink)" }}
      role="status"
    >
      {deepDiveEmptyLine(sermonCount)}
    </p>
  );
}
