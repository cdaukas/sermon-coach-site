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
  /** Cost-clarity tag; Sketches and Growth only. */
  freeTag?: boolean;
  /** Discovery lock for non-allowlisted mentoring access. */
  locked?: boolean;
  isActive: (pathname: string) => boolean;
};

const PRIMARY_ITEMS: NavItem[] = [
  {
    href: "/dashboard",
    label: "Sermons",
    isActive: (pathname) =>
      pathname === "/dashboard" || pathname.startsWith("/dashboard/sermons"),
  },
  {
    href: "/dashboard/sketches",
    label: "Sketches",
    freeTag: true,
    isActive: (pathname) =>
      pathname === "/dashboard/sketches" ||
      pathname.startsWith("/dashboard/sketches/") ||
      pathname === "/dashboard/sketch" ||
      pathname.startsWith("/dashboard/sketch/"),
  },
  {
    href: "/dashboard/growth",
    label: "Growth",
    isActive: (pathname) => pathname.startsWith("/dashboard/growth"),
  },
];

const ACCOUNT_ITEMS: NavItem[] = [
  {
    href: "/dashboard/account",
    label: "Account",
    shortLabel: "Account",
    isActive: (pathname) => pathname.startsWith("/dashboard/account"),
  },
  {
    href: "/dashboard/buy",
    label: "Billing",
    shortLabel: "Billing",
    isActive: (pathname) => pathname.startsWith("/dashboard/buy"),
  },
];

type DashboardRailProps = {
  creditChipLabel: string;
  mentoringUiAllowed: boolean;
  growthAllowed: boolean;
};

function NavItemBadges({ item }: { item: NavItem }) {
  return (
    <>
      {item.freeTag ? (
        <span className="dashboard-rail-free-tag" aria-hidden="true">
          Free
        </span>
      ) : null}
      {item.locked ? (
        <span className="dashboard-rail-free-tag" aria-hidden="true">
          Coming soon
        </span>
      ) : null}
    </>
  );
}

function NavLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const active = item.isActive(pathname);

  if (item.locked) {
    return (
      <span
        className="dashboard-rail-link dashboard-rail-link--muted"
        style={uiFont}
        aria-label={`${item.label} (coming soon)`}
      >
        <span className="dashboard-rail-label-full">{item.label}</span>
        <span className="dashboard-rail-label-short">
          {item.shortLabel ?? item.label}
        </span>
        <NavItemBadges item={item} />
      </span>
    );
  }

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
      <NavItemBadges item={item} />
    </Link>
  );
}

export function DashboardRail({
  creditChipLabel,
  mentoringUiAllowed,
  growthAllowed,
}: DashboardRailProps) {
  const pathname = usePathname();
  const primaryItems = PRIMARY_ITEMS.filter(
    (item) => item.href !== "/dashboard/growth" || growthAllowed,
  );

  const developOthersItem: NavItem = {
    href: "/dashboard/develop",
    label: "Develop others",
    shortLabel: "Develop others",
    locked: !mentoringUiAllowed,
    isActive: (path) =>
      path.startsWith("/dashboard/develop") ||
      path.startsWith("/dashboard/mentoring"),
  };

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
        <p className="dashboard-rail-group-label" style={uiFont}>
          Your preaching
        </p>
        {primaryItems.map((item) => (
          <NavLink key={item.href} item={item} pathname={pathname} />
        ))}
        <p className="dashboard-rail-group-label" style={uiFont}>
          Developing others
        </p>
        <NavLink item={developOthersItem} pathname={pathname} />
        <div
          className="dashboard-rail-divider"
          role="presentation"
          aria-hidden="true"
        />
        {ACCOUNT_ITEMS.map((item) => (
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
