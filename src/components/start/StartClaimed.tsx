import Link from "next/link";
import { FIRST_EVAL_PATH } from "@/lib/auth/start";

const uiFont = { fontFamily: "var(--font-ui)" };
const serifFont = { fontFamily: "var(--font-serif)" };

/** Shown once after a Sketch claim attaches the read to the new account. */
export function StartClaimed() {
  return (
    <div
      className="flex min-h-full flex-col px-6 py-10"
      style={{ background: "var(--sc-bg)" }}
    >
      <header className="mx-auto w-full max-w-[440px]">
        <Link
          href="/"
          className="inline-block text-xl font-semibold tracking-tight no-underline"
          style={{ fontFamily: "var(--font-serif)", color: "var(--sc-ink)" }}
        >
          The Sermon{" "}
          <span style={{ color: "var(--sc-accent)" }}>Coach</span>™
        </Link>
      </header>

      <main className="mx-auto flex w-full max-w-[440px] flex-1 flex-col justify-center py-10">
        <div
          className="rounded px-8 py-9"
          style={{
            background: "var(--sc-panel)",
            border: "1px solid var(--sc-rule)",
            boxShadow: "var(--sc-shadow-lift)",
          }}
        >
          <h1
            className="text-[1.35rem] font-semibold leading-snug tracking-tight"
            style={{ ...serifFont, color: "var(--sc-ink)" }}
          >
            Your read is saved to your account.
          </h1>
          <p
            className="mt-2.5 text-[14px] leading-relaxed"
            style={{ ...uiFont, color: "var(--sc-ink-soft)" }}
          >
            When you&apos;ve built this sermon, run the full text through the
            evaluation. Your first one is free.
          </p>

          <Link
            href={FIRST_EVAL_PATH}
            className="mt-7 inline-flex w-full items-center justify-center rounded border px-7 py-3.5 text-sm font-semibold tracking-wide no-underline transition-all"
            style={{
              ...uiFont,
              background: "var(--sc-ink)",
              color: "var(--sc-bg)",
              borderColor: "var(--sc-ink)",
            }}
          >
            Back to dashboard
          </Link>
        </div>
      </main>
    </div>
  );
}
