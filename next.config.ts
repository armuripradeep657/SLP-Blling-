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
  // Isolated build dirs so builds never collide with the running servers:
  // - dev server (package.json `dev`) runs on .next-dev via NEXT_DEV_DIST
  // - E2E test servers run on .next-test via NEXT_TEST_DIST
  // - deploy (`build` script) owns the default .next — standard standalone layout
  distDir: process.env.NEXT_DEV_DIST || process.env.NEXT_TEST_DIST || ".next",
};

export default nextConfig;
