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
  isActive: (pathname: string) => boolean;
};

const PRIMARY_NAV: NavItem[] = [
  {
    href: "/dashboard",
    label: "Sermons",
    isActive: (pathname) =>
      pathname === "/dashboard" || pathname.startsWith("/dashboard/sermons"),
  },
  {
    href: "/dashboard/sketch",
    label: "Sketches",
    isActive: (pathname) =>
      pathname === "/dashboard/sketch" ||
      pathname.startsWith("/dashboard/sketch/"),
  },
  {
    href: "/dashboard/growth",
    label: "Growth",
    isActive: (pathname) => pathname.startsWith("/dashboard/growth"),
  },
];

const ACCOUNT_NAV: NavItem[] = [
  {
    href: "/dashboard/buy",
    label: "Plan and credits",
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
    >
      {item.label}
    </Link>
  );
}

export function DashboardRail({ creditChipLabel }: DashboardRailProps) {
  const pathname = usePathname();

  return (
    <aside className="dashboard-rail" aria-label="Dashboard">
      <Link href="/dashboard" className="dashboard-rail-wordmark" style={serifFont}>
        The Sermon{" "}
        <span style={{ color: "#a67c2e" }}>Coach</span>
        <sup className="dashboard-rail-tm">™</sup>
      </Link>

      <nav className="dashboard-rail-nav" aria-label="Main">
        <div className="dashboard-rail-nav-group">
          {PRIMARY_NAV.map((item) => (
            <NavLink key={item.href} item={item} pathname={pathname} />
          ))}
        </div>

        <div className="dashboard-rail-nav-group">
          <p className="dashboard-rail-group-label" style={uiFont}>
            Account
          </p>
          {ACCOUNT_NAV.map((item) => (
            <NavLink key={item.href} item={item} pathname={pathname} />
          ))}
        </div>
      </nav>

      <div className="dashboard-rail-footer">
        <Link
          href="/dashboard/buy"
          className="dashboard-rail-credit-chip"
          style={uiFont}
        >
          {creditChipLabel}
        </Link>
        <form action={signOut}>
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
