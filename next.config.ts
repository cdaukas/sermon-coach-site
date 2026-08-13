import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        // Bare /signup bookmarks → /start. Keep /signup?plan=… and /signup?pack=…
        // on the signup page for checkout flows.
        source: "/signup",
        missing: [
          { type: "query", key: "plan" },
          { type: "query", key: "pack" },
        ],
        destination: "/start",
        statusCode: 301,
      },
      // Extensionless marketing bookmarks → canonical .html URLs (301, not rewrite).
      { source: "/pricing", destination: "/pricing.html", statusCode: 301 },
      { source: "/faq", destination: "/faq.html", statusCode: 301 },
      { source: "/story", destination: "/story.html", statusCode: 301 },
      { source: "/terms", destination: "/terms.html", statusCode: 301 },
      { source: "/privacy", destination: "/privacy.html", statusCode: 301 },
      {
        source: "/how-its-scored",
        destination: "/how-its-scored.html",
        statusCode: 301,
      },
      // Orphaned post-payment page from pre-Checkout migration; keep file on disk.
      { source: "/welcome", destination: "/dashboard", statusCode: 301 },
      { source: "/welcome.html", destination: "/dashboard", statusCode: 301 },
      // Retired static sample HTML → live DB-backed samples.
      {
        source: "/sermon-evaluation-hebrews-10.html",
        destination: "/sample-evaluation",
        statusCode: 301,
      },
      {
        source: "/sermon-evaluation-hebrews-12.html",
        destination: "/sample-evaluation",
        statusCode: 301,
      },
      {
        source: "/sermon-evaluation-2-corinthians-11.html",
        destination: "/sample-evaluation",
        statusCode: 301,
      },
      {
        source: "/sermon-sketch-hebrews-3.html",
        destination: "/sample-sketch",
        statusCode: 301,
      },
      {
        source: "/sermon-debrief-hebrews-3.html",
        destination: "/sample-evaluation",
        statusCode: 301,
      },
    ];
  },
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: "/",
          destination: "/index.html",
        },
        {
          source: "/blog",
          destination: "/blog/index.html",
        },
        {
          source: "/blog/:slug((?!.*\\..*$).*)",
          destination: "/blog/:slug.html",
        },
      ],
    };
  },
};

export default nextConfig;
