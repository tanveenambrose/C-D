import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Increase the maximum response body size for the proxy download route
  // This is needed to stream large video files through Vercel without hitting the 4.5MB Edge limit
  experimental: {
    serverActions: {
      bodySizeLimit: '500mb',
    },
  },
};

export default nextConfig;
