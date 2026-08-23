'use client';

import React, { useState } from 'react';
import {
  getOptimizedImageUrl,
  getOptimizedAvatarUrl,
  getOptimizedCoverUrl,
  getOptimizedCardUrl,
  getOptimizedHeroUrl,
  getOptimizedThumbnailUrl,
  getOptimizedGalleryUrl,
  getResponsiveImageProps,
  type ImageOptimizationOptions,
} from '@/lib/image-optimization';

export interface OptimizedImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src: string | null | undefined;
  alt: string;
  preset?: 'avatar' | 'cover' | 'card' | 'gallery' | 'hero' | 'thumbnail' | 'custom';
  width?: number;
  height?: number;
  crop?: ImageOptimizationOptions['crop'];
  gravity?: ImageOptimizationOptions['gravity'];
  quality?: ImageOptimizationOptions['quality'];
  priority?: boolean;
  fallbackSrc?: string;
  containerClassName?: string;
}

export function OptimizedImage({
  src,
  alt,
  preset = 'custom',
  width,
  height,
  crop,
  gravity,
  quality = 'auto:good',
  priority = false,
  fallbackSrc,
  className = '',
  containerClassName = '',
  sizes,
  onError,
  onLoad,
  ...rest
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  if (!src && !fallbackSrc) {
    return null;
  }

  const activeSrc = hasError && fallbackSrc ? fallbackSrc : (src || fallbackSrc || '');

  // Determine optimized source URL and responsive srcset props based on preset or explicit dimensions
  let resolvedSrc = activeSrc;
  let responsiveProps: { src: string; srcSet?: string; sizes?: string } = { src: activeSrc };

  if (activeSrc && !activeSrc.startsWith('data:') && !activeSrc.startsWith('blob:')) {
    switch (preset) {
      case 'avatar':
        resolvedSrc = getOptimizedAvatarUrl(activeSrc, width || 160);
        break;
      case 'cover':
        responsiveProps = getResponsiveImageProps(
          activeSrc,
          width || 800,
          { crop: crop || 'limit', quality, gravity },
          sizes || '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 40vw'
        );
        resolvedSrc = responsiveProps.src;
        break;
      case 'card':
        responsiveProps = getResponsiveImageProps(
          activeSrc,
          width || 800,
          { crop: crop || 'limit', quality, gravity },
          sizes || '(max-width: 768px) 100vw, 50vw'
        );
        resolvedSrc = responsiveProps.src;
        break;
      case 'hero':
        responsiveProps = getResponsiveImageProps(
          activeSrc,
          width || 1600,
          { crop: crop || 'limit', quality, gravity },
          sizes || '100vw'
        );
        resolvedSrc = responsiveProps.src;
        break;
      case 'gallery':
        responsiveProps = getResponsiveImageProps(
          activeSrc,
          width || 1400,
          { crop: crop || 'limit', quality, gravity },
          sizes || '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw'
        );
        resolvedSrc = responsiveProps.src;
        break;
      case 'thumbnail':
        resolvedSrc = getOptimizedThumbnailUrl(activeSrc, width || 120);
        break;
      case 'custom':
      default:
        if (width || height || crop || gravity || quality) {
          resolvedSrc = getOptimizedImageUrl(activeSrc, {
            width,
            height,
            crop: crop || 'limit',
            gravity,
            quality,
          });
        }
        break;
    }
  }

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    setIsLoaded(true);
    onLoad?.(e);
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    if (!hasError && fallbackSrc && activeSrc !== fallbackSrc) {
      setHasError(true);
    }
    onError?.(e);
  };

  return (
    <img
      src={resolvedSrc}
      srcSet={responsiveProps.srcSet}
      sizes={responsiveProps.sizes || sizes}
      alt={alt}
      width={width}
      height={height}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      onLoad={handleImageLoad}
      onError={handleImageError}
      className={`transition-opacity duration-500 ease-out ${
        isLoaded ? 'opacity-100' : 'opacity-80'
      } ${className}`}
      {...rest}
    />
  );
}

export default OptimizedImage;
