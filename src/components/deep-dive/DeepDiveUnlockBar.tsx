import { serifFont, uiFont } from "@/components/evaluation/shared";
import type { DeepDiveUnlock } from "@/lib/prep-card/deep-dive-dashboard";

export function DeepDiveUnlockBar({ unlock }: { unlock: DeepDiveUnlock }) {
  const empty = unlock.total - unlock.filled;
  return (
    <div className="max-w-[46ch]">
      <p
        className="text-[20px] leading-snug"
        style={{ ...serifFont, color: "var(--sc-ink)" }}
      >
        {unlock.headline}
      </p>
      <p
        className="mt-6 flex flex-wrap items-baseline gap-x-4 gap-y-2 text-[18px] tracking-[0.18em]"
        style={{ ...serifFont, color: "var(--sc-ink)" }}
      >
        <span aria-hidden="true">
          {"●".repeat(unlock.filled)}
          <span style={{ color: "var(--sc-rule)" }}>{"○".repeat(empty)}</span>
        </span>
        <span className="tracking-normal" style={{ ...uiFont, fontSize: 15 }}>
          {unlock.countLabel}
        </span>
      </p>
      <p
        className="mt-4 text-[16px] leading-relaxed"
        style={{ ...serifFont, color: "var(--sc-ink-soft)" }}
      >
        {unlock.remainder}
      </p>
    </div>
  );
}
