import { uiFont } from "./fonts";

type StaticButtonProps = {
  children: string;
  variant?: "primary" | "accent";
};

/** Visual CTA only — not interactive. */
export function StaticButton({
  children,
  variant = "primary",
}: StaticButtonProps) {
  const isAccent = variant === "accent";
  return (
    <span
      className="inline-block rounded px-[28px] py-[14px] text-[14px] font-semibold tracking-[0.02em]"
      style={{
        ...uiFont,
        background: isAccent ? "var(--sc-accent)" : "var(--sc-ink)",
        color: isAccent ? "var(--sc-panel)" : "var(--sc-bg)",
        border: `1px solid ${isAccent ? "var(--sc-accent)" : "var(--sc-ink)"}`,
      }}
    >
      {children}
    </span>
  );
}
