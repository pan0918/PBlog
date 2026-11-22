import { siteConfig } from '../../siteConfig';

// Image and music delivery. Both are stored in the image bed, which lives on
// *.pages.dev (slow and often DNS-polluted in mainland China) and streams
// every file from HuggingFace on each request. Once it is bound to our own
// domain, URLs are rewritten here; when Cloudflare Image Transformations is
// enabled, images are also resized to the displayed size, converted to
// AVIF/WebP and cached at the edge. With an empty config every helper returns
// the original URL, so nothing changes.

export type AssetCdnConfig = typeof siteConfig.assetCdn;

export interface ResponsiveImage {
  src: string;
  srcSet?: string;
  sizes?: string;
}

// Shared width ladder: fewer distinct widths means more edge-cache hits and
// fewer unique transformations (the free plan includes 5,000 per month).
const WIDTH_LADDER = [64, 128, 256, 384, 640, 960, 1280, 1920, 2560];
const DEFAULT_QUALITY = 75;

const trimSlash = (value: string) => value.replace(/\/+$/, '');

function parseUrl(value: string): URL | null {
  if (!/^https?:\/\//i.test(value)) return null;
  try {
    return new URL(value);
  } catch {
    return null;
  }
}

function moveToHost(url: URL, origins: Set<string>, host: string): string {
  if (!host || !origins.has(url.origin)) return url.href;
  return `${host}${url.pathname}${url.search}`;
}

const isNeteaseImage = (url: URL) => url.hostname.endsWith('.music.126.net');
const isUnsplashImage = (url: URL) => url.hostname === 'images.unsplash.com';

export function createAssetCdn(config: AssetCdnConfig) {
  const imageHost = trimSlash(config.imageHost);
  const imageTransformHost = trimSlash(config.imageTransformHost);
  const imageBedOrigins = new Set([...config.imageOrigins.map(trimSlash), ...(imageHost ? [imageHost] : [])]);
  const isImageBedUrl = (url: URL) => imageBedOrigins.has(url.origin);

  /** Moves image-bed URLs (images and audio) onto the custom domain, unchanged otherwise. */
  function toCdnAssetUrl(value: string): string {
    const url = parseUrl(value);
    return url ? moveToHost(url, imageBedOrigins, imageHost) : value;
  }

  /** Whether `resizeImageUrl` returns a different file per width for this source. */
  function canResizeImage(value: string): boolean {
    const url = parseUrl(value);
    if (!url) return false;
    if (isImageBedUrl(url)) return Boolean(imageTransformHost);
    return isNeteaseImage(url) || isUnsplashImage(url);
  }

  /** URL of `value` scaled down to at most `width` pixels wide, when the host supports it. */
  function resizeImageUrl(value: string, width: number, quality = DEFAULT_QUALITY): string {
    const url = parseUrl(value);
    if (!url) return value;

    if (isImageBedUrl(url)) {
      const source = moveToHost(url, imageBedOrigins, imageHost);
      if (!imageTransformHost) return source;
      const options = `width=${width},quality=${quality},format=auto,fit=scale-down`;
      // Sources on the same zone can fall back to the original file when a
      // transformation fails (for example after the monthly free quota is used).
      if (source.startsWith(`${imageTransformHost}/`)) {
        return `${imageTransformHost}/cdn-cgi/image/${options},onerror=redirect${source.slice(imageTransformHost.length)}`;
      }
      return `${imageTransformHost}/cdn-cgi/image/${options}/${source}`;
    }

    if (isNeteaseImage(url)) {
      // NetEase's image CDN resizes natively (covers are square).
      url.searchParams.set('param', `${width}y${width}`);
      return url.href;
    }

    if (isUnsplashImage(url)) {
      url.searchParams.set('w', String(width));
      url.searchParams.set('q', String(quality));
      url.searchParams.set('auto', 'format');
      return url.href;
    }

    return value;
  }

  /**
   * `src`/`srcSet`/`sizes` for an image whose rendered width follows the layout.
   * `sizes` must describe the rendered width so the browser downloads (and
   * decodes) only what it needs; `minWidth` drops candidates it would never pick.
   */
  function responsiveImage(
    value: string,
    options: { sizes: string; maxWidth: number; minWidth?: number; quality?: number },
  ): ResponsiveImage {
    if (!canResizeImage(value)) return { src: toCdnAssetUrl(value) };
    const quality = options.quality ?? DEFAULT_QUALITY;
    const minWidth = options.minWidth ?? 256;
    const widths = WIDTH_LADDER.filter((width) => width >= minWidth && width <= options.maxWidth);
    if (widths.length === 0) widths.push(WIDTH_LADDER.find((width) => width >= options.maxWidth) ?? WIDTH_LADDER[WIDTH_LADDER.length - 1]);
    return {
      src: resizeImageUrl(value, widths[widths.length - 1], quality),
      srcSet: widths.map((width) => `${resizeImageUrl(value, width, quality)} ${width}w`).join(', '),
      sizes: options.sizes,
    };
  }

  /** `src`/`srcSet` for an image rendered at a fixed CSS width (avatars, small covers). */
  function fixedImage(value: string, cssWidth: number, quality = DEFAULT_QUALITY): ResponsiveImage {
    if (!canResizeImage(value)) return { src: toCdnAssetUrl(value) };
    const snap = (width: number) => WIDTH_LADDER.find((step) => step >= width) ?? WIDTH_LADDER[WIDTH_LADDER.length - 1];
    const oneX = resizeImageUrl(value, snap(cssWidth), quality);
    const twoX = resizeImageUrl(value, snap(cssWidth * 2), quality);
    return { src: twoX, srcSet: `${oneX} 1x, ${twoX} 2x` };
  }

  /** Origins worth a <link rel="preconnect"> because most media comes from them. */
  function getPreconnectOrigins(): string[] {
    return [...new Set([imageHost, imageTransformHost].filter(Boolean))];
  }

  return { toCdnAssetUrl, canResizeImage, resizeImageUrl, responsiveImage, fixedImage, getPreconnectOrigins };
}

export const {
  toCdnAssetUrl,
  canResizeImage,
  resizeImageUrl,
  responsiveImage,
  fixedImage,
  getPreconnectOrigins,
} = createAssetCdn(siteConfig.assetCdn);
