"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/lib/auth/actions";

const uiFont = {
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
} as const;

const serifFont = { fontFamily: "var(--font-serif)" } as const;

type NavItem = {
  href: string;
  label: string;
  shortLabel?: string;
  isActive: (pathname: string) => boolean;
};

const NAV_ITEMS: NavItem[] = [
  {
    href: "/dashboard",
    label: "Sermons",
    isActive: (pathname) =>
      pathname === "/dashboard" || pathname.startsWith("/dashboard/sermons"),
  },
  {
    href: "/dashboard/growth",
    label: "Growth",
    isActive: (pathname) => pathname.startsWith("/dashboard/growth"),
  },
  {
    href: "/dashboard/buy",
    label: "Plan and credits",
    shortLabel: "Plan",
    isActive: (pathname) => pathname.startsWith("/dashboard/buy"),
  },
];

type DashboardRailProps = {
  creditChipLabel: string;
};

function NavLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const active = item.isActive(pathname);

  return (
    <Link
      href={item.href}
      className={`dashboard-rail-link${active ? " is-active" : ""}`}
      style={uiFont}
      aria-current={active ? "page" : undefined}
      aria-label={item.label}
    >
      <span className="dashboard-rail-label-full">{item.label}</span>
      <span className="dashboard-rail-label-short">
        {item.shortLabel ?? item.label}
      </span>
    </Link>
  );
}

export function DashboardRail({ creditChipLabel }: DashboardRailProps) {
  const pathname = usePathname();
  const primaryItems = NAV_ITEMS.filter((item) => item.href !== "/dashboard/buy");
  const accountItems = NAV_ITEMS.filter((item) => item.href === "/dashboard/buy");

  return (
    <aside className="dashboard-rail" aria-label="Dashboard">
      <Link
        href="/dashboard"
        className="dashboard-rail-wordmark"
        style={serifFont}
      >
        The Sermon{" "}
        <span style={{ color: "#a67c2e" }}>Coach</span>
        <sup className="dashboard-rail-tm">™</sup>
      </Link>

      <nav className="dashboard-rail-nav" aria-label="Main">
        {primaryItems.map((item) => (
          <NavLink key={item.href} item={item} pathname={pathname} />
        ))}
        <p className="dashboard-rail-group-label" style={uiFont}>
          Account
        </p>
        {accountItems.map((item) => (
          <NavLink key={item.href} item={item} pathname={pathname} />
        ))}
      </nav>

      <div className="dashboard-rail-actions">
        <Link
          href="/dashboard/buy"
          className="dashboard-rail-credit-chip"
          style={uiFont}
        >
          {creditChipLabel}
        </Link>
        <form action={signOut} className="dashboard-rail-sign-out-form">
          <button
            type="submit"
            className="dashboard-rail-sign-out"
            style={uiFont}
          >
            Sign out
          </button>
        </form>
      </div>
    </aside>
  );
}
