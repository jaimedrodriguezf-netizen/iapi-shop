import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  allowedDevOrigins: [
    process.env.NEXT_PUBLIC_DEV_ORIGIN ?? "localhost:3000",
    process.env.NEXT_PUBLIC_TAILSCALE_ORIGIN,
  ].filter((o): o is string => Boolean(o)),
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
    ],
  },
  async headers() {
    const isDev = process.env.NODE_ENV === "development";

    // Production CSP: strict, blocks everything not explicitly allowed.
    // Development CSP: relaxed, allows Next.js devtools, HMR WebSockets, and overlay iframes.
    const cspValue = isDev
      ? [
          "default-src 'self'",
          "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://challenges.cloudflare.com",
          "style-src 'self' 'unsafe-inline'",
          "img-src 'self' https: data: blob:",
          "font-src 'self'",
          // ws: needed for HMR, http://localhost:* for Next.js dev server
          "connect-src 'self' https://*.supabase.co wss://*.supabase.co ws:",
          // Next.js 16 devtools use iframes — allow all ancestors in dev
          "frame-ancestors *",
          "base-uri 'self'",
          "form-action 'self'",
          "object-src 'none'",
        ].join("; ")
      : [
          "default-src 'self'",
          // 'unsafe-inline' required by Next.js inline scripts; 'unsafe-eval' removed: it allows arbitrary code execution via eval()/new Function() which is a critical CSP bypass.
          "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com",
          "style-src 'self' 'unsafe-inline'",
          "img-src 'self' https: data: blob:",
          "font-src 'self'",
          "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
          "frame-ancestors 'none'",
          "base-uri 'self'",
          "form-action 'self'",
          "object-src 'none'",
        ].join("; ");

    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "Content-Security-Policy",
            value: cspValue,
          },
        ],
      },
    ];
  },
};

export default nextConfig;
