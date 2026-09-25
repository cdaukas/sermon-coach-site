import { serifFont } from "@/components/evaluation/shared";

export function DeepDiveLock({
  ranLine,
  prepCardLine,
}: {
  ranLine: string;
  prepCardLine: string;
}) {
  return (
    <div className="max-w-[52ch]">
      <p className="text-[18px] leading-relaxed" style={{ ...serifFont, color: "var(--sc-ink)" }}>
        {ranLine}
      </p>
      <p className="mt-4 text-[16px] leading-relaxed" style={{ ...serifFont, color: "var(--sc-ink-soft)" }}>
        {prepCardLine}
      </p>
    </div>
  );
}
