import { serifFont, uiFont } from "./fonts";

export function HomeV2Footer() {
  return (
    <footer
      className="border-t px-6 py-9 max-[720px]:px-5"
      style={{ borderColor: "var(--sc-rule)" }}
    >
      <div
        className="mx-auto flex max-w-[1100px] items-center justify-between gap-4 text-[12px] max-[720px]:flex-col max-[720px]:items-start"
        style={{ ...uiFont, color: "var(--sc-ink-soft)" }}
      >
        <span>The Sermon Coach&trade; · Built by Dr. Christopher M. Daukas</span>
        <span
          className="text-[16px] font-semibold tracking-[-0.01em]"
          style={{ ...serifFont, color: "var(--sc-ink)" }}
        >
          Strengthen the Local Church. Train the Global Church.
        </span>
      </div>
    </footer>
  );
}
