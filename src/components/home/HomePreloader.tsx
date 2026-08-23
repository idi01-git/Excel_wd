"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Loader from "@/components/ui/loader";

import { BOOKS } from "@/components/sections/hardback/hardback-data";
import { preloadBookAssets, preloadBookImage } from "@/components/sections/hardback/hardback-textures";
import { onCardwallSettled } from "@/lib/cardwall-events";
import { getOptimizedCardwallCoverUrl } from "@/lib/image-optimization";

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
  onPrepared?: (cards: any[]) => void;
  onComplete?: () => void;
}

export default function HomePreloader({ heroCards = [], onPrepared, onComplete }: HomePreloaderProps) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if visitor already saw the intro in this session
    const hasSeenIntro = typeof window !== 'undefined' && sessionStorage.getItem('excelsior_intro_seen');
    const introDuration = hasSeenIntro ? 0 : 450;

    let isMounted = true;
    const minDisplayPromise = new Promise((res) => setTimeout(res, introDuration));

    // 1. Critical for LCP: 3D Card chunk, fonts, and primary hero images
    const chunkPromise = import("@/components/home/Book3DCard").catch(() => {});
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
    const criticalImagePromises = targetImages.map((src: string) => preloadBookImage(src));

    // 3. Non-blocking background preloads (Shelf books & textures) — deferred
    //    until the Cardwall entrance settles. preloadBookAssets() rasterizes
    //    canvas textures on the main thread, which previously landed right in
    //    the middle of the 1.8s card swoop and caused the landing stutter.
    //    Registered module-level (no cleanup): the work must still run after
    //    this overlay unmounts.
    onCardwallSettled(() => {
      preloadBookAssets(BOOKS).catch(() => {});
      CRITICAL_IMAGE_URLS.slice(5).forEach((src) => preloadBookImage(src));
      fetch("/api/editors-shelf")
        .then((res) => res.json())
        .then((data) => {
          if (data.success && Array.isArray(data.items) && data.items.length > 0) {
            preloadBookAssets(data.items).catch(() => {});
          }
        })
        .catch(() => {});
    });

    // 4. Fallback safety timeout
    const safetyTimeout = new Promise((res) => setTimeout(res, hasSeenIntro ? 300 : 1200));

    // Await critical assets or safety timeout
    Promise.race([
      Promise.all([
        minDisplayPromise,
        chunkPromise,
        fontsPromise,
        Promise.allSettled(criticalImagePromises),
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
  }, [heroCards]);

  const handleExitComplete = () => {
    onComplete?.();
  };

  return (
    <AnimatePresence mode="wait" onExitComplete={handleExitComplete}>
      {isLoading && (
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
