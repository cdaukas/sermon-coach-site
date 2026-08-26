import { serifFont, uiFont } from "./fonts";
import { StaticButton } from "./StaticButton";

const NAV_ITEMS = [
  "How It Works",
  "Growth",
  "Methodology",
  "For Churches",
  "Pricing",
] as const;

export function HomeV2Header() {
  return (
    <header className="mx-auto flex max-w-[1100px] items-center justify-between px-6 py-7 max-[720px]:px-5 max-[720px]:py-5">
      <div
        className="text-[20px] font-semibold tracking-[-0.01em] max-[720px]:text-[clamp(13px,4.1vw,20px)]"
        style={{ ...serifFont, color: "var(--sc-ink)" }}
      >
        The Sermon <span style={{ color: "var(--sc-accent)" }}>Coach</span>
        &trade;
      </div>
      <nav
        className="flex items-center gap-6 max-[720px]:hidden"
        aria-hidden="true"
      >
        {NAV_ITEMS.map((label) => (
          <span
            key={label}
            className="text-[13px] font-medium"
            style={{ ...uiFont, color: "var(--sc-ink-soft)" }}
          >
            {label}
          </span>
        ))}
        <StaticButton>Start Free</StaticButton>
      </nav>
      <div className="hidden max-[720px]:block">
        <StaticButton>Start Free</StaticButton>
      </div>
    </header>
  );
}
