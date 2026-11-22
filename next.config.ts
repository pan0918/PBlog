import type { NextConfig } from "next";
import { siteConfig } from "./siteConfig";

// Custom image-bed domain (see siteConfig.assetCdn) must be allowed for next/image too.
const imageBedHosts = [siteConfig.assetCdn.imageHost]
  .filter(Boolean)
  .map((host) => ({ protocol: "https" as const, hostname: new URL(host).hostname, pathname: "/file/**" }));

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
      {
        protocol: "https",
        hostname: "p3.music.126.net",
      },
      {
        protocol: "https",
        hostname: "p4.music.126.net",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      ...imageBedHosts,
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
