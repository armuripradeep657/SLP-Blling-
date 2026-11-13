import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // Hide the Next.js dev-tools "N" badge that overlays the app UI
  devIndicators: false,
  // E2E tests run an ISOLATED server (own port + own SQLite) alongside the
  // live app — this gives that server its own build dir so the .next/dev
  // lock never conflicts with the owner's running app.
  ...(process.env.NEXT_TEST_DIST ? { distDir: process.env.NEXT_TEST_DIST } : {}),
};

export default nextConfig;
