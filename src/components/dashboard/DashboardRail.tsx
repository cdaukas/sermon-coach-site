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

const CORE_ITEMS: NavItem[] = [
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
  growthAllowed: boolean;
  prepCardAllowed?: boolean;
  /** Resolved deep-dive href (movement or current theme diagnostic). */
  deepDiveHref?: string | null;
  teamAccount?: boolean;
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
  growthAllowed,
  prepCardAllowed = false,
  deepDiveHref = null,
  teamAccount = false,
}: DashboardRailProps) {
  const pathname = usePathname();

  const growthItems: NavItem[] = [];
  if (growthAllowed) {
    growthItems.push({
      href: "/dashboard/growth",
      label: "Trend",
      isActive: (path) => path.startsWith("/dashboard/growth"),
    });
  }
  if (prepCardAllowed && deepDiveHref) {
    growthItems.push({
      href: deepDiveHref,
      label: "Deep dive",
      shortLabel: "Deep dive",
      isActive: (path) =>
        path === deepDiveHref || path.startsWith(`${deepDiveHref}/`),
    });
  }
  if (prepCardAllowed) {
    growthItems.push({
      href: "/dashboard/prep-card",
      label: "Prep card",
      shortLabel: "Prep card",
      isActive: (path) => path.startsWith("/dashboard/prep-card"),
    });
  }

  const developLabel = teamAccount ? "Team" : "Mentoring";
  const developOthersItem: NavItem = {
    href: "/dashboard/develop",
    label: developLabel,
    shortLabel: developLabel,
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
        {CORE_ITEMS.map((item) => (
          <NavLink key={item.href} item={item} pathname={pathname} />
        ))}
        {growthItems.length > 0 ? (
          <>
            <p className="dashboard-rail-group-label" style={uiFont}>
              Growth
            </p>
            {growthItems.map((item) => (
              <NavLink
                key={`growth-${item.label}-${item.href}`}
                item={item}
                pathname={pathname}
              />
            ))}
          </>
        ) : null}
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
