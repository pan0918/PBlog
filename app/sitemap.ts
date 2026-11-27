import type { MetadataRoute } from 'next';
import { siteConfig } from '../siteConfig';
import { getAllPosts } from '../lib/posts';

export const revalidate = 3600;

const STATIC_PATHS = ['/', '/timeline', '/moments', '/projects', '/photowall', '/music', '/friends', '/chatter', '/about'];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteConfig.siteUrl;
  const posts = await getAllPosts();
  return [
    ...STATIC_PATHS.map((path) => ({ url: `${base}${path === '/' ? '' : path}` })),
    ...posts.map((post) => ({
      url: `${base}/posts/${post.slug.split('/').map(encodeURIComponent).join('/')}`,
      lastModified: new Date(post.date),
    })),
  ];
}
