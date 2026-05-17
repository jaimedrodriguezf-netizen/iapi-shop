import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // @ts-ignore - allowedDevOrigins is suggested by Next.js logs for HMR but might not be in all type definitions
  allowedDevOrigins: ["100.66.182.124", "localhost:3000"],
};

export default nextConfig;
