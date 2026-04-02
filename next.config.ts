import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Increase the maximum response body size for the proxy download route
  // This is needed to stream large video files through Vercel without hitting the 4.5MB Edge limit
  experimental: {
    serverActions: {
      bodySizeLimit: '500mb',
    },
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'require-corp',
          },
        ],
      },
    ];
  },
  webpack: (config) => {
    // Disable symlinks to prevent Next.js from resolving X:\ back to the original D:\ path
    // This fixes the 404 error when running from a subst virtual drive
    config.resolve.symlinks = false;
    return config;
  },
};

export default nextConfig;
