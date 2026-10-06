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
      {
        // Avatars and report media. Without this entry next/image refuses the
        // URL outright, which is the point of the allowlist: an attacker who
        // could store any URL in avatar_url would otherwise have our server
        // fetch it. The API restricts the host it will store, too.
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;