import type { ReactNode } from "react";
import { serifFont } from "./shared";

type SectionTitleProps = {
  children: ReactNode;
};

export function SectionTitle({ children }: SectionTitleProps) {
  return (
    <h2
      className="evaluation-section-title mb-7 text-[32px] font-normal tracking-tight md:text-[36px]"
      style={{ ...serifFont, color: "var(--sc-ink)" }}
    >
      {children}
    </h2>
  );
}
