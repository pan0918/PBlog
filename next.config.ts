import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cloudflare-imgbed-9pz.pages.dev",
        pathname: "/file/**",
      },
      {
        protocol: "https",
        hostname: "a68b43cc.cloudflare-imgbed-9pz.pages.dev",
        pathname: "/file/**",
      },
    ],
    qualities: [75, 80, 90],
    deviceSizes: [640, 750, 828, 1080, 1200, 1600, 1920, 2048],
  },
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion'],
  },
};

export default nextConfig;
