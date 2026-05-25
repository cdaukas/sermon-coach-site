import type { ReactNode } from "react";
import type { SectionEyebrowVariant } from "./shared";
import { uiFont } from "./shared";

type SectionEyebrowProps = {
  children: ReactNode;
  variant: SectionEyebrowVariant;
};

export function SectionEyebrow({ children, variant }: SectionEyebrowProps) {
  const color =
    variant === "green" ? "var(--sc-green)" : "var(--sc-amber)";

  return (
    <p
      className="mt-14 mb-2.5 text-[11px] font-semibold uppercase tracking-[0.12em]"
      style={{ ...uiFont, color }}
    >
      {children}
    </p>
  );
}
