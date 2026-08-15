'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { motion, useScroll, useTransform } from 'motion/react';
import { ArrowUpRight } from 'lucide-react';
import { Eyebrow, FadeUp } from './primitives';

const TILES = [
  {
    src: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=1200&h=900&fit=crop',
    caption: 'The Old Library · After hours',
    span: 'md:col-span-5',
    ratio: 'aspect-[4/3]',
    drift: -36,
  },
  {
    src: 'https://images.unsplash.com/photo-1519791883288-dc8bd696e667?w=900&h=1200&fit=crop',
    caption: 'Midnight Manuscripts · Hour six',
    span: 'md:col-span-3 md:col-start-7 md:mt-24',
    ratio: 'aspect-[3/4]',
    drift: 52,
  },
  {
    src: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=1200&h=800&fit=crop',
    caption: 'Reading Circle · Thursdays',
    span: 'md:col-span-4 md:col-start-10 md:mt-10',
    ratio: 'aspect-[4/3]',
    drift: -20,
  },
  {
    src: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=1000&h=1200&fit=crop',
    caption: 'Monsoon Slam · Final round',
    span: 'md:col-span-4 md:col-start-2 md:-mt-10',
    ratio: 'aspect-[4/5]',
    drift: 42,
  },
  {
    src: 'https://images.unsplash.com/photo-1515621061946-eff1c2a352bd?w=1200&h=800&fit=crop',
    caption: 'Anthology Launch · Courtyard',
    span: 'md:col-span-5 md:col-start-7 md:mt-6',
    ratio: 'aspect-[16/10]',
    drift: -48,
  },
];

export default function GalleryStrip() {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  });

  return (
    <section
      ref={sectionRef}
      className="relative w-full bg-background px-6 pt-8 pb-20 md:px-10 md:pt-12 md:pb-28"
    >
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-14 flex flex-wrap items-end justify-between gap-6 md:mb-20">
          <div>
            <FadeUp>
              <Eyebrow>Fragments · The Archive</Eyebrow>
            </FadeUp>
            <FadeUp delay={0.1}>
              <h2 className="mt-5 font-display text-[clamp(2.4rem,5.5vw,4.5rem)] font-medium leading-[0.95] tracking-[-0.03em] text-foreground">
                Moments, <em className="font-normal italic">kept.</em>
              </h2>
            </FadeUp>
          </div>
          <FadeUp delay={0.15}>
            <Link
              href="/community/gallery"
              className="group inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] text-foreground transition-colors hover:text-muted-foreground"
            >
              Enter the archive
              <ArrowUpRight
                size={14}
                className="transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
              />
            </Link>
          </FadeUp>
        </div>

        {/* Asymmetric parallax grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-12 md:gap-8">
          {TILES.map((tile, i) => (
            <ParallaxTile
              key={tile.caption}
              tile={tile}
              progress={scrollYProgress}
              zDepth={i % 2}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function ParallaxTile({
  tile,
  progress,
  zDepth,
}: {
  tile: (typeof TILES)[number];
  progress: ReturnType<typeof useScroll>['scrollYProgress'];
  zDepth: number;
}) {
  const y = useTransform(
    progress,
    [0, 1],
    [zDepth === 0 ? tile.drift : -tile.drift, zDepth === 0 ? -tile.drift : tile.drift]
  );

  return (
    <motion.figure
      style={{ y, willChange: 'transform' }}
      className={`group ${tile.span}`}
    >
      <div className="overflow-hidden rounded-2xl border border-border">
        <img
          src={tile.src}
          alt={tile.caption}
          loading="lazy"
          className={`${tile.ratio} w-full transform-gpu object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.06]`}
        />
      </div>
      <figcaption className="mt-3 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
        <span>{tile.caption}</span>
        <span className="opacity-0 transition-opacity duration-500 group-hover:opacity-100">
          ↗
        </span>
      </figcaption>
    </motion.figure>
  );
}
