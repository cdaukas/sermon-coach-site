"use client";

import { useState } from "react";
import Link from "next/link";

const NAV_ITEMS = [
  { label: "How It's Scored", href: "/how-its-scored.html" },
  { label: "Free Outline Check", href: "/sketch" },
  { label: "Blog", href: "/blog" },
  { label: "Pricing", href: "/pricing.html" },
  { label: "FAQ", href: "/faq.html" },
  { label: "Story", href: "/story.html" },
] as const;

export function HomeV2Header() {
  const [isOpen, setIsOpen] = useState(false);

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
            {NAV_ITEMS.map((item) => (
              <a key={item.label} href={item.href}>
                {item.label}
              </a>
            ))}
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
