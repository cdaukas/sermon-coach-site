import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
