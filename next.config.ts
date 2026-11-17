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
  // v39 security hardening: hardening headers on every response. The CSP is
  // self-only (the app talks exclusively to its own origin); inline styles
  // and scripts stay allowed because Next.js injects both — see
  // README-HTTPS.md for the full security model.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(self), microphone=(), geolocation=(), payment=(), usb=()",
          },
          {
            key: "Content-Security-Policy",
            value:
              "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self'; media-src 'self' blob:; object-src 'none'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
