import type { MetadataRoute } from 'next';
import { siteConfig } from '../siteConfig';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/admin', '/api/'] },
    sitemap: `${siteConfig.siteUrl}/sitemap.xml`,
  };
}
