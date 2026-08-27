import Link from "next/link";

const NAV_ITEMS = [
  { label: "How It's Scored", href: "/how-its-scored.html" },
  { label: "Free Outline Check", href: "/sketch" },
  { label: "Pricing", href: "/pricing.html" },
  { label: "FAQ", href: "/faq.html" },
  { label: "Story", href: "/story.html" },
] as const;

export function HomeV2Header() {
  return (
    <nav>
      <div className="container nav">
        <div className="brand">
          The Sermon <span className="brand-accent">Coach</span>&trade;
        </div>
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
    </nav>
  );
}
