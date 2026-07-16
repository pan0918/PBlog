const PHOTO_BED_HOST = "cloudflare-imgbed-9pz.pages.dev";

/**
 * The photo bed can be slower than Next.js' upstream image timeout. Let the
 * browser fetch these files directly so a slow response does not become a
 * permanent `/_next/image` 500, while keeping optimization for other hosts.
 */
export function shouldBypassImageOptimizer(source: string): boolean {
  try {
    const url = new URL(source);
    return (
      url.protocol === "https:" &&
      (url.hostname === PHOTO_BED_HOST || url.hostname.endsWith(`.${PHOTO_BED_HOST}`))
    );
  } catch {
    return false;
  }
}
