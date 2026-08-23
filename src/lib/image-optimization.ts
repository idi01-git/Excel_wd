// src/lib/image-optimization.ts
// Client- and server-safe URL optimization utilities for Cloudinary & web assets.

export interface ImageOptimizationOptions {
  width?: number;
  height?: number;
  crop?: 'fill' | 'limit' | 'fit' | 'thumb' | 'scale' | 'pad';
  quality?: 'auto' | 'auto:good' | 'auto:best' | 'auto:eco' | 'auto:low' | number;
  format?: 'auto' | 'webp' | 'avif' | 'png' | 'jpg';
  gravity?: 'face' | 'faces' | 'center' | 'auto' | 'auto:face';
  dpr?: 'auto' | number;
  flags?: string[];
}

/**
 * Parses and replaces existing Cloudinary transformation segments with new ones.
 * Supports versioned URLs (v12345/...) and unversioned URLs.
 */
function cleanCloudinarySuffix(suffix: string): string {
  // Regex to strip any existing transformation segment immediately after /upload/
  // Matches segments like 'w_800,f_auto/' or 'c_fill,g_face,w_400/'
  const transformRegex = /^((?:[a-z]{1,4}_[a-zA-Z0-9_:.-]+,?)+\/)+/i;
  return suffix.replace(transformRegex, '');
}

/**
 * Optimizes Unsplash image URLs with modern format, crop, and dimension parameters.
 */
function getOptimizedUnsplashUrl(
  url: string,
  options: ImageOptimizationOptions
): string {
  try {
    const parsed = new URL(url);
    if (options.width) parsed.searchParams.set('w', options.width.toString());
    if (options.height) parsed.searchParams.set('h', options.height.toString());
    parsed.searchParams.set('auto', 'format');
    parsed.searchParams.set('fit', options.crop === 'fill' ? 'crop' : 'max');
    parsed.searchParams.set('q', typeof options.quality === 'number' ? options.quality.toString() : '80');
    return parsed.toString();
  } catch {
    return url;
  }
}

/**
 * Injects dynamic Cloudinary optimization transformations into delivery URLs.
 * Automatically handles Cloudinary and Unsplash URLs, while leaving SVGs and static assets safe.
 */
export function getOptimizedImageUrl(
  url: string | null | undefined,
  options: ImageOptimizationOptions = {}
): string {
  if (!url || typeof url !== 'string') {
    return '';
  }

  // Never alter SVGs or PDFs with raster transformations
  if (url.endsWith('.svg') || url.endsWith('.pdf')) {
    return url;
  }

  // Handle Unsplash image optimization
  if (url.includes('images.unsplash.com')) {
    return getOptimizedUnsplashUrl(url, options);
  }

  // If not a Cloudinary image or not an /upload/ delivery URL, return as-is
  if (!url.includes('cloudinary.com') || !url.includes('/upload/')) {
    return url;
  }

  const {
    width,
    height,
    crop = 'limit',
    quality = 'auto:good',
    format = 'auto',
    gravity,
    dpr = 'auto',
    flags,
  } = options;

  const transforms: string[] = [];

  if (format) transforms.push(`f_${format}`);
  if (quality) transforms.push(`q_${quality}`);
  if (dpr) transforms.push(`dpr_${dpr}`);
  if (width) transforms.push(`w_${Math.round(width)}`);
  if (height) transforms.push(`h_${Math.round(height)}`);
  if (width || height) transforms.push(`c_${crop}`);
  if (gravity) transforms.push(`g_${gravity}`);
  if (flags && flags.length > 0) {
    flags.forEach((f) => transforms.push(f.startsWith('fl_') ? f : `fl_${f}`));
  }

  const transformString = transforms.join(',');
  if (!transformString) return url;

  // Insert transformations right after /upload/
  const uploadIndex = url.indexOf('/upload/');
  const prefix = url.substring(0, uploadIndex + '/upload/'.length);
  const rawSuffix = url.substring(uploadIndex + '/upload/'.length);
  const cleanSuffix = cleanCloudinarySuffix(rawSuffix);

  return `${prefix}${transformString}/${cleanSuffix}`;
}

/**
 * Generates a responsive srcset string for Cloudinary images.
 */
export function getCloudinarySrcSet(
  url: string | null | undefined,
  widths: number[] = [320, 480, 640, 800, 1080, 1200, 1600],
  options: Omit<ImageOptimizationOptions, 'width'> = {}
): string {
  if (!url || !url.includes('cloudinary.com') || url.endsWith('.svg') || url.endsWith('.pdf')) {
    return '';
  }

  return widths
    .map((w) => {
      const optimizedUrl = getOptimizedImageUrl(url, { ...options, width: w });
      return `${optimizedUrl} ${w}w`;
    })
    .join(', ');
}

/**
 * Returns comprehensive responsive image props for native <img> or picture elements.
 */
export function getResponsiveImageProps(
  url: string | null | undefined,
  baseWidth: number,
  options: ImageOptimizationOptions = {},
  sizes = '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw'
) {
  const isCloudinary = Boolean(url && url.includes('cloudinary.com') && !url.endsWith('.svg'));
  const src = getOptimizedImageUrl(url, { ...options, width: baseWidth });

  if (!isCloudinary) {
    return { src, sizes: undefined, srcSet: undefined };
  }

  // Derive responsive srcset steps relative to baseWidth
  const steps = [
    Math.round(baseWidth * 0.5),
    Math.round(baseWidth * 0.75),
    baseWidth,
    Math.round(baseWidth * 1.5),
    Math.round(baseWidth * 2),
  ].filter((w, i, arr) => w >= 160 && w <= 2400 && arr.indexOf(w) === i);

  const srcSet = getCloudinarySrcSet(url, steps, options);

  return {
    src,
    srcSet: srcSet || undefined,
    sizes: srcSet ? sizes : undefined,
  };
}

/** Pre-configured helper for 1:1 avatars (profile, alumni, members) */
export function getOptimizedAvatarUrl(url: string | null | undefined, size = 160): string {
  return getOptimizedImageUrl(url, {
    width: size,
    height: size,
    crop: 'fill',
    quality: 'auto:good',
    format: 'auto',
    dpr: 'auto',
  });
}

/** Pre-configured helper for book and publication covers */
export function getOptimizedCoverUrl(url: string | null | undefined, width = 800): string {
  return getOptimizedImageUrl(url, {
    width,
    crop: 'limit',
    quality: 'auto:good',
    format: 'auto',
    dpr: 'auto',
  });
}

/** Pre-configured helper for event banners & homepage cards */
export function getOptimizedCardUrl(url: string | null | undefined, width = 800): string {
  return getOptimizedImageUrl(url, {
    width,
    crop: 'limit',
    quality: 'auto:good',
    format: 'auto',
    dpr: 'auto',
  });
}

/** Pre-configured helper for hero section wide visual assets */
export function getOptimizedHeroUrl(url: string | null | undefined, width = 1600): string {
  return getOptimizedImageUrl(url, {
    width,
    crop: 'limit',
    quality: 'auto:good',
    format: 'auto',
    dpr: 'auto',
  });
}

/** Pre-configured helper for small thumbnails, table previews, and filmstrips */
export function getOptimizedThumbnailUrl(url: string | null | undefined, size = 120): string {
  return getOptimizedImageUrl(url, {
    width: size,
    height: size,
    crop: 'thumb',
    gravity: 'auto',
    quality: 'auto',
    format: 'auto',
    dpr: 'auto',
  });
}

/** Pre-configured helper for the 3D Cardwall hero cards (210×333, cover-cropped) */
export function getOptimizedCardwallCoverUrl(url: string | null | undefined): string {
  return getOptimizedImageUrl(url, {
    width: 420,
    height: 666,
    crop: 'fill',
    quality: 'auto',
    format: 'auto',
  });
}

/** Pre-configured helper for full-screen gallery displays */
export function getOptimizedGalleryUrl(url: string | null | undefined, width = 1600): string {
  return getOptimizedImageUrl(url, {
    width,
    crop: 'limit',
    quality: 'auto:good',
    format: 'auto',
    dpr: 'auto',
  });
}

