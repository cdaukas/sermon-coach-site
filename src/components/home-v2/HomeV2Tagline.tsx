import { uiFont } from "./fonts";

export function HomeV2Tagline() {
  return (
    <div
      className="px-6 py-[18px] text-center text-[15px] font-semibold max-[720px]:px-5"
      style={{
        ...uiFont,
        background: "var(--sc-olive-soft)",
        color: "var(--sc-olive)",
      }}
    >
      Not another sermon-writing tool. A system for continuous preaching
      development.
    </div>
  );
}
