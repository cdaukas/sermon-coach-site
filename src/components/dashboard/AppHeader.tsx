"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/lib/auth/actions";

const uiFont = { fontFamily: "var(--font-ui)" };

const secondaryButtonClass =
  "rounded border px-4 py-2 text-[13px] font-medium no-underline transition-colors hover:border-[var(--sc-ink)]";

const secondaryButtonStyle = {
  ...uiFont,
  background: "var(--sc-panel)",
  borderColor: "var(--sc-rule)",
  color: "var(--sc-ink)",
} as const;

const primaryButtonClass =
  "rounded border px-4 py-2 text-[13px] font-semibold tracking-wide no-underline transition-all";

const primaryButtonStyle = {
  ...uiFont,
  background: "var(--sc-ink)",
  color: "var(--sc-bg)",
  borderColor: "var(--sc-ink)",
} as const;

export function AppHeader() {
  const pathname = usePathname();
  const onDashboard = pathname === "/dashboard";
  const onBuy = pathname === "/dashboard/buy";
  const onNewSermon = pathname === "/dashboard/sermons/new";
  const onSketch = pathname === "/dashboard/sketch";

  return (
    <header className="dashboard-app-header mb-10 flex flex-wrap items-center justify-between gap-4">
      <Link
        href="/dashboard"
        className="text-xl font-semibold tracking-tight no-underline"
        style={{ fontFamily: "var(--font-serif)", color: "var(--sc-ink)" }}
      >
        The Sermon{" "}
        <span style={{ color: "var(--sc-accent)" }}>Coach</span>™
      </Link>

      <nav
        className="flex flex-wrap items-center gap-2 sm:gap-3"
        aria-label="Main"
      >
        {!onDashboard ? (
          <Link
            href="/dashboard"
            className={secondaryButtonClass}
            style={secondaryButtonStyle}
          >
            Dashboard
          </Link>
        ) : null}

        {!onSketch ? (
          <Link
            href="/dashboard/sketch"
            className={secondaryButtonClass}
            style={secondaryButtonStyle}
          >
            The Sketch
          </Link>
        ) : null}

        {!onBuy ? (
          <Link
            href="/dashboard/buy"
            className={secondaryButtonClass}
            style={secondaryButtonStyle}
          >
            Buy
          </Link>
        ) : null}

        {!onNewSermon ? (
          <Link
            href="/dashboard/sermons/new"
            className={primaryButtonClass}
            style={primaryButtonStyle}
          >
            New Sermon
          </Link>
        ) : null}

        <form action={signOut}>
          <button
            type="submit"
            className="rounded px-3 py-2 text-[13px] font-medium transition-colors hover:underline"
            style={{
              ...uiFont,
              background: "transparent",
              border: "none",
              color: "var(--sc-ink-soft)",
              cursor: "pointer",
            }}
          >
            Sign out
          </button>
        </form>
      </nav>
    </header>
  );
}
