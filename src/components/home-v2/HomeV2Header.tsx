"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { track } from "@vercel/analytics";

const NAV_ITEMS = [
  { label: "How It's Scored", href: "/how-its-scored.html" },
  { label: "Sketch — Free", href: "/sketch" },
  { label: "Blog", href: "/blog" },
  { label: "Mentoring", href: "/mentoring" },
  { label: "Pricing", href: "/pricing.html" },
  { label: "FAQ", href: "/faq.html" },
  { label: "Story", href: "/story.html" },
] as const;

export function HomeV2Header() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  return (
    <nav>
      <div className={`container nav${isOpen ? " is-open" : ""}`}>
        <Link href="/" className="brand">
          The Sermon <span className="brand-accent">Coach</span>&trade;
        </Link>

        <button
          type="button"
          className="navtoggle"
          aria-label="Menu"
          aria-expanded={isOpen}
          aria-controls="nav-menu"
          onClick={() => setIsOpen((open) => !open)}
        >
          <span className="navtoggle-bar" />
          <span className="navtoggle-bar" />
          <span className="navtoggle-bar" />
        </button>

        {/* display:contents on desktop, so brand | links | actions still lay
            out as three flex children. Becomes the dropdown panel at ≤720px. */}
        <div className="navmenu" id="nav-menu">
          <div className="navlinks">
            {NAV_ITEMS.map((item) => {
              const active = item.href === "/mentoring" && pathname === "/mentoring";
              return (
                <a
                  key={item.label}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  onClick={
                    item.href === "/mentoring"
                      ? () => {
                          track("nav_mentoring_click");
                        }
                      : undefined
                  }
                >
                  {item.label}
                </a>
              );
            })}
          </div>
          <div className="navactions">
            <Link href="/login" className="navlogin">
              Log in
            </Link>
            <Link href="/start" className="btn">
              Start free
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
