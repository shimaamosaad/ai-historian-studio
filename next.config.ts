import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdf-to-img resolves bundled PDF.js assets through Node's createRequire().
  // Keep it external so that resolution happens at runtime instead of being
  // transformed into a Turbopack module id during the production build.
  serverExternalPackages: ["pdf-to-img"],
};

export default nextConfig;
