// src/lib/cloudinary.ts
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/** Extract a Cloudinary public ID from a delivery URL (null for non-Cloudinary URLs). */
export function getPublicIdFromUrl(url: string): string | null {
  try {
    if (!url || !url.includes('cloudinary.com')) return null;
    const uploadIndex = url.indexOf('/upload/');
    if (uploadIndex === -1) return null;
    let afterUpload = url.substring(uploadIndex + '/upload/'.length);
    
    // Strip transformations if present (segments prior to v[0-9]+ or folder)
    const versionMatch = afterUpload.match(/(?:.*\/)?(v\d+\/.*)/);
    if (versionMatch) {
      afterUpload = versionMatch[1].replace(/^v\d+\//, '');
    } else {
      // Strip leading transformation segment if present
      const transformRegex = /^((?:[a-z]{1,4}_[a-zA-Z0-9_:.-]+,?)+\/)+/i;
      afterUpload = afterUpload.replace(transformRegex, '').replace(/^v\d+\//, '');
    }
    
    const dotIndex = afterUpload.lastIndexOf('.');
    if (dotIndex === -1) return afterUpload;
    return afterUpload.substring(0, dotIndex);
  } catch (error) {
    console.error('Error parsing publicId from URL:', error);
    return null;
  }
}

/** Best-effort destroy; resolves silently for non-Cloudinary URLs. */
export async function deleteImageByUrl(url: string): Promise<{ ok: boolean; result?: string }> {
  const publicId = getPublicIdFromUrl(url);
  if (!publicId) return { ok: true };

  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    console.warn('Cloudinary credentials missing — skipping deletion of', publicId);
    return { ok: false };
  }

  try {
    const result = await cloudinary.uploader.destroy(publicId);
    if (result.result === 'ok' || result.result === 'not found') return { ok: true, result: result.result };
    console.error('Cloudinary delete failed:', result.result);
    return { ok: false, result: result.result };
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    return { ok: false };
  }
}

export {
  getOptimizedImageUrl,
  getOptimizedAvatarUrl,
  getOptimizedCoverUrl,
  getOptimizedCardUrl,
  getOptimizedHeroUrl,
  getOptimizedThumbnailUrl,
  getOptimizedGalleryUrl,
  getOptimizedCardwallCoverUrl,
  getCloudinarySrcSet,
  getResponsiveImageProps,
  type ImageOptimizationOptions,
} from './image-optimization';



