"use client";

import { useEffect, useLayoutEffect } from 'react';
import { getOptimizedCardwallCoverUrl } from '@/lib/image-optimization';
import type { BookData } from '@/components/sections/hardback/hardback-data';

const FALLBACK_HERO_IMAGES = [
  'https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=420&h=666&fit=crop&auto=format&q=75',
  'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=420&h=666&fit=crop&auto=format&q=75',
  'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=420&h=666&fit=crop&auto=format&q=75',
  'https://images.unsplash.com/photo-1476275466078-4007374efbbe?w=420&h=666&fit=crop&auto=format&q=75',
  'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=420&h=666&fit=crop&auto=format&q=75',
];

interface HomePreloaderProps {
  heroCards?: any[];
  shelfBooks?: BookData[];
  onComplete?: () => void;
}

function preloadImage(src: string) {
  return new Promise<void>((resolve) => {
    const image = new Image();
    image.onload = () => resolve();
    image.onerror = () => resolve();
    image.src = src;
  });
}

// Asset warm-up only. The one visible loader is app/(main)/loading.tsx,
// which is automatically dismissed when the route content is ready.
export default function HomePreloader({ heroCards = [], shelfBooks, onComplete }: HomePreloaderProps) {
  useLayoutEffect(() => {
    onComplete?.();
  }, []);

  useEffect(() => {
    let cancelled = false;
    const warmAssets = async () => {
      const heroImages = heroCards
        .map((card: any) => (card.image ? getOptimizedCardwallCoverUrl(card.image) : ''))
        .filter(Boolean)
        .slice(0, 6);
      const targets = heroImages.length > 0 ? heroImages : FALLBACK_HERO_IMAGES;

      const [, , { preloadBookAssets }, { BOOKS }] = await Promise.all([
        Promise.allSettled(targets.map(preloadImage)),
        import('@/components/home/Book3DCard'),
        import('@/components/sections/hardback/hardback-textures'),
        import('@/components/sections/hardback/hardback-data'),
      ]);

      if (!cancelled) {
        await preloadBookAssets((shelfBooks?.length ? shelfBooks : BOOKS).slice(0, 5));
      }
    };

    void warmAssets().catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [heroCards, shelfBooks]);

  return null;
}
