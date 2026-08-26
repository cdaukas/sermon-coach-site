const NAV_ITEMS = [
  "How It Works",
  "Growth",
  "Methodology",
  "For Churches",
  "Pricing",
] as const;

export function HomeV2Header() {
  return (
    <nav>
      <div className="container nav">
        <div className="brand">
          The Sermon <span className="brand-accent">Coach</span>&trade;
        </div>
        <div className="navlinks" aria-hidden="true">
          {NAV_ITEMS.map((label) => (
            <span key={label}>{label}</span>
          ))}
        </div>
        <span className="btn">Start Free</span>
      </div>
    </nav>
  );
}
