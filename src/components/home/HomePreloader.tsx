"use client";

import React, { useEffect, useLayoutEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Loader from "@/components/ui/loader";

import { getOptimizedCardwallCoverUrl } from "@/lib/image-optimization";
import type { BookData } from '@/components/sections/hardback/hardback-data';

// Default key assets for the home cardwall & hero showcase + 3D Library Shelf
const CRITICAL_IMAGE_URLS = [
  "https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=420&h=666&fit=crop&auto=format&q=75",
  "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=420&h=666&fit=crop&auto=format&q=75",
  "https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=420&h=666&fit=crop&auto=format&q=75",
  "https://images.unsplash.com/photo-1476275466078-4007374efbbe?w=420&h=666&fit=crop&auto=format&q=75",
  "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=420&h=666&fit=crop&auto=format&q=75",
  "/images/image.webp",
  "/images/gunaho%20ka%20devta.webp",
  "/images/night%20shelf.webp",
  "/images/Day%20shelf%202.webp",
];

interface HomePreloaderProps {
  heroCards?: any[];
  shelfBooks?: BookData[];
  onPrepared?: (cards: any[]) => void;
  onComplete?: () => void;
}

export default function HomePreloader({ heroCards = [], shelfBooks, onPrepared, onComplete }: HomePreloaderProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [skipIntro, setSkipIntro] = useState(false);

  // Run before paint on client-side navigation. Server and client initially
  // render the same markup, then returning visitors never see this overlay.
  useLayoutEffect(() => {
    try {
      if (sessionStorage.getItem('excelsior_intro_seen')) {
        setSkipIntro(true);
        onComplete?.();
      }
    } catch {}
  }, []);

  useEffect(() => {
    // Check if visitor already saw the intro in this session
    const hasSeenIntro = typeof window !== 'undefined' && sessionStorage.getItem('excelsior_intro_seen');

    // A client-side return already has the route chunks, images, and module
    // caches in this browser session. Do not re-mount the overlay or hold the
    // hero entrance behind a safety timeout.
    if (hasSeenIntro) {
      return;
    }

    const introDuration = 450;

    let isMounted = true;
    const minDisplayPromise = new Promise((res) => setTimeout(res, introDuration));

    // 1. Critical for LCP: fonts and primary hero images only. The below-fold shelf chunk loads near the shelf.
    const fontsPromise =
      typeof document !== "undefined" && document.fonts
        ? document.fonts.ready.catch(() => {})
        : Promise.resolve();

    // 2. Preload exact custom hero cards or fallback critical images
    const dynamicImgs = (heroCards || [])
      .map((c: any) => (c.image ? getOptimizedCardwallCoverUrl(c.image) : ""))
      .filter(Boolean)
      .slice(0, 6);

    const targetImages = dynamicImgs.length > 0 ? dynamicImgs : CRITICAL_IMAGE_URLS.slice(0, 5);
    const criticalImagePromises = targetImages.map(
      (src: string) =>
        new Promise<void>((resolve) => {
          const image = new Image();
          image.onload = () => resolve();
          image.onerror = () => resolve();
          image.src = src;
        })
    );

    // While the loader is visible, fetch the shelf chunk and exact five covers.
    // The cards mount behind the overlay, moving their first WebGL frame out of
    // the visitor's scroll path.
    const shelfWarmupPromise = Promise.all([
      import('@/components/home/Book3DCard'),
      import('@/components/sections/hardback/hardback-textures'),
      import('@/components/sections/hardback/hardback-data'),
    ])
      .then(([, { preloadBookAssets }, { BOOKS }]) =>
        preloadBookAssets((shelfBooks?.length ? shelfBooks : BOOKS).slice(0, 5))
      )
      .catch(() => {});

    // 3. Fallback safety timeout
    const safetyTimeout = new Promise((res) => setTimeout(res, hasSeenIntro ? 650 : 1600));

    // Await critical assets or safety timeout
    Promise.race([
      Promise.all([
        minDisplayPromise,
        fontsPromise,
        Promise.allSettled(criticalImagePromises),
        shelfWarmupPromise,
      ]),
      safetyTimeout,
    ]).then(() => {
      if (!isMounted) return;
      try {
        sessionStorage.setItem('excelsior_intro_seen', 'true');
      } catch {}
      // Unblock and start entrance animation simultaneously with the fade-out
      onComplete?.();
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, [heroCards, shelfBooks]);

  const handleExitComplete = () => {
    onComplete?.();
  };

  return (
    <AnimatePresence mode="wait" onExitComplete={handleExitComplete}>
      {isLoading && !skipIntro && (
        <motion.div
          key="home-preloader"
          initial={{ opacity: 1 }}
          exit={{
            opacity: 0,
          }}
          transition={{
            duration: 0.5,
            ease: [0.16, 1, 0.3, 1],
          }}
          className="fixed inset-0 z-100000 flex flex-col items-center justify-center bg-background px-4 select-none contain-[paint_layout]"
        >
          {/* Subtle Ambient Background Gradient Aura */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(circle 280px at 50% 50%, color-mix(in oklab, var(--foreground) 4%, transparent) 0%, transparent 70%)",
            }}
          />

          <Loader
            size="lg"
            title="Excelsior"
            subtitle="Curating the sanctuary & preparing literary archives"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
