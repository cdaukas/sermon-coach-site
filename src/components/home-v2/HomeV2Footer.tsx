const COLUMNS = [
  {
    heading: "Product",
    links: [
      { label: "Pricing", href: "/pricing.html" },
      { label: "How It's Scored", href: "/how-its-scored.html" },
      { label: "Free Outline Check", href: "/sketch" },
      { label: "Sample sketch", href: "/sample-sketch" },
      { label: "Sample evaluation", href: "/sample-evaluation" },
    ],
  },
  {
    heading: "About",
    links: [
      { label: "Story", href: "/story.html" },
      { label: "AI and preaching", href: "/why-sermon-coach.html" },
      { label: "FAQ", href: "/faq.html" },
      { label: "Blog", href: "/blog" },
    ],
  },
  {
    heading: "Contact & legal",
    links: [
      { label: "chris@sermoncoach.com", href: "mailto:chris@sermoncoach.com" },
      { label: "Privacy", href: "/privacy.html" },
      { label: "Terms", href: "/terms.html" },
      { label: "Log in", href: "/login" },
    ],
  },
] as const;

export function HomeV2Footer() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-cols">
          {COLUMNS.map((column) => (
            <div key={column.heading} className="footer-col">
              <small>{column.heading}</small>
              <ul>
                {column.links.map((link) => (
                  <li key={link.label}>
                    <a href={link.href}>{link.label}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="footer-base">
          <span className="footer-tagline">
            Strengthen the Local Church. Train the Global Church.
          </span>
          <span>
            The Sermon Coach&trade; · Built by Dr. Christopher M. Daukas ·
            Phoenix, Arizona
          </span>
        </div>
      </div>
    </footer>
  );
}
