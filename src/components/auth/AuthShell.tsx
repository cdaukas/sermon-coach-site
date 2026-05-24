import type { ReactNode } from "react";
import Link from "next/link";

type AuthShellProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
};

export function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
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
          The Sermon <span style={{ color: "var(--sc-accent)" }}>&amp;</span>{" "}
          Coach
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
          <div className="mb-7 text-center">
            <p
              className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em]"
              style={{
                fontFamily: "var(--font-ui)",
                color: "var(--sc-accent)",
              }}
            >
              Account
            </p>
            <h1
              className="text-[28px] font-semibold leading-tight tracking-tight"
              style={{ fontFamily: "var(--font-serif)", color: "var(--sc-ink)" }}
            >
              {title}
            </h1>
            {subtitle ? (
              <p
                className="mt-3 text-base leading-relaxed"
                style={{
                  fontFamily: "var(--font-serif)",
                  color: "var(--sc-ink-soft)",
                  fontStyle: "italic",
                }}
              >
                {subtitle}
              </p>
            ) : null}
          </div>

          {children}
        </div>

        {footer ? (
          <div
            className="mt-6 text-center text-[13px] leading-relaxed"
            style={{ fontFamily: "var(--font-ui)", color: "var(--sc-ink-soft)" }}
          >
            {footer}
          </div>
        ) : null}
      </main>
    </div>
  );
}
