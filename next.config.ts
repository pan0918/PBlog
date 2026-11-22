import type { NextConfig } from "next";
import { siteConfig } from "./siteConfig";

const { imageHost, mediaProxyOrigin } = siteConfig.assetCdn;

// A cross-origin image-bed domain (see siteConfig.assetCdn) must be allowed for next/image too.
const imageBedHosts = [imageHost]
  .filter((host) => /^https:\/\//.test(host))
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
  // Serve image-bed media (images and audio) through the site's own domain:
  // from mainland China Vercel's edge is far faster than Cloudflare's free
  // network. Vercel caches the proxied responses using the image bed's
  // Cache-Control headers.
  async rewrites() {
    if (!mediaProxyOrigin) return [];
    return [{ source: "/media/:path*", destination: `${mediaProxyOrigin.replace(/\/+$/, "")}/:path*` }];
  },
  async headers() {
    if (!mediaProxyOrigin) return [];
    return [{ source: "/media/:path*", headers: [{ key: "x-vercel-enable-rewrite-caching", value: "1" }] }];
  },
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion'],
  },
};

export default nextConfig;
