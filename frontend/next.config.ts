import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * Traces the exact files the server needs into .next/standalone, so the
   * production Docker image can run `node server.js` without node_modules.
   * Vercel ignores this setting, so turning it on costs nothing there.
   */
  output: "standalone",

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "lorem.video.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;