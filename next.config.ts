import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/",
        destination: "/index.html",
      },
      {
        source: "/welcome",
        destination: "/welcome.html",
      },
    ];
  },
};

export default nextConfig;
