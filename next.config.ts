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
          source: "/welcome",
          destination: "/welcome.html",
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
