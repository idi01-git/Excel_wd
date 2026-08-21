"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Loader from "@/components/ui/loader";

import { BOOKS } from "@/components/sections/hardback/hardback-data";
import { preloadBookAssets, preloadBookImage } from "@/components/sections/hardback/hardback-textures";

// Default key assets for the home cardwall & hero showcase + 3D Library Shelf
const CRITICAL_IMAGE_URLS = [
  "https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=800&h=1200&fit=crop",
  "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=800&h=1200&fit=crop",
  "https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=800&h=1200&fit=crop",
  "https://images.unsplash.com/photo-1476275466078-4007374efbbe?w=800&h=1200&fit=crop",
  "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&h=1200&fit=crop",
  "/images/image.png",
  "/images/gunaho%20ka%20devta.png",
  "/images/night%20shelf.png",
  "/images/Day%20shelf%202.png",
];

interface HomePreloaderProps {
  onPrepared?: (cards: any[]) => void;
  onComplete?: () => void;
}

export default function HomePreloader({ onPrepared, onComplete }: HomePreloaderProps) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Lock scroll during preloading
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    let isMounted = true;
    const minDisplayPromise = new Promise((res) => setTimeout(res, 1200));

    // 1. Preload 3D Card React chunk and all 12 curated 3D books textures and cover images
    const chunkPromise = import("@/components/home/Book3DCard").catch(() => {});
    const defaultBooksPromise = preloadBookAssets(BOOKS);

    const imagePromises = CRITICAL_IMAGE_URLS.map((src) => {
      return preloadBookImage(src);
    });

    // 2. Fetch site settings to preload any dynamic hero card images
    const settingsPromise = fetch("/api/site-settings")
      .then((res) => res.json())
      .then((data) => {
        const cards = data.settings?.["home.heroCards"]?.cards;
        if (Array.isArray(cards) && cards.length > 0) {
          if (isMounted) onPrepared?.(cards);
          const dynamicImgs = cards
            .map((c: any) => c.image)
            .filter(Boolean)
            .slice(0, 6);
          return Promise.allSettled(
            dynamicImgs.map((src: string) => preloadBookImage(src))
          );
        }
      })
      .catch(() => {});

    // 3. Pre-fetch and preload Editor's Shelf 3D models & items
    const shelfPromise = fetch("/api/editors-shelf")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.items) && data.items.length > 0) {
          return preloadBookAssets(data.items);
        }
      })
      .catch(() => {});

    // 4. Wait for document fonts
    const fontsPromise =
      typeof document !== "undefined" && document.fonts
        ? document.fonts.ready.catch(() => {})
        : Promise.resolve();

    // 5. Fallback maximum timeout (safety guard)
    const safetyTimeout = new Promise((res) => setTimeout(res, 3500));

    // Await all assets or safety timeout, combined with minimum pleasant duration
    Promise.race([
      Promise.all([
        minDisplayPromise,
        chunkPromise,
        fontsPromise,
        settingsPromise,
        shelfPromise,
        defaultBooksPromise,
        Promise.allSettled(imagePromises),
      ]),
      safetyTimeout,
    ]).then(() => {
      if (!isMounted) return;
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  const handleExitComplete = () => {
    document.body.style.overflow = "";
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
            scale: 1.03,
            filter: "blur(8px)",
          }}
          transition={{
            duration: 0.75,
            ease: [0.16, 1, 0.3, 1],
          }}
          className="fixed inset-0 z-[100000] flex flex-col items-center justify-center bg-background px-4 select-none"
        >
          {/* Subtle Ambient Background Gradient Aura */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-foreground/[0.03] dark:bg-white/[0.04] blur-[120px]" />
          </div>

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
