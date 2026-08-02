import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "uiifoirxbqkdzppbvour.supabase.co",
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '105mb',
    },
  },
};

export default nextConfig;
