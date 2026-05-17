import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    allowedDevOrigins: ["100.66.182.124", "localhost:3000"],
  },
};

export default nextConfig;
