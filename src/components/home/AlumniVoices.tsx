'use client';

import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowLeft } from 'lucide-react';
import { Eyebrow, FadeUp, EASE } from './primitives';

const VOICES = [
  {
    quote:
      'Excelsior taught me that a sentence can be a home. I edited my first novel with their red ink still living in my margins.',
    name: 'Aarav Mehta',
    role: 'Class of 2019 · Editor-at-Large',
  },
  {
    quote:
      'I arrived with a notebook and a nervousness. I left with a voice — and eleven people who still read every draft I dare to send.',
    name: 'Sana Qureshi',
    role: 'Class of 2021 · Published Poet',
  },
  {
    quote:
      'The slams were brutal and the workshops were tender. That exact combination is the reason I report for a living now.',
    name: 'Devika Rao',
    role: 'Class of 2017 · Senior Correspondent',
  },
  {
    quote:
      'Every reading circle felt like a small conspiracy against mediocrity. I have been chasing that standard ever since.',
    name: 'Kabir Anand',
    role: 'Class of 2022 · Screenwriter',
  },
];

const DURATION = 7000;

export default function AlumniVoices() {
  const [index, setIndex] = useState(0);
  const [voices, setVoices] = useState(VOICES);
  useEffect(() => {
    void fetch('/api/site-settings')
      .then((response) => response.json())
      .then((data) => {
        const items = data.settings?.['home.testimonials']?.items;
        if (Array.isArray(items) && items.length) setVoices(items);
      })
      .catch(() => {});
  }, []);

  const go = useCallback(
    (dir: 1 | -1) =>
      setIndex((prev) => (prev + dir + voices.length) % voices.length),
    [voices.length]
  );

  useEffect(() => {
    const timer = setTimeout(() => go(1), DURATION);
    return () => clearTimeout(timer);
  }, [index, go]);

  const current = voices[index] || voices[0];

  return (
    <section className="relative w-full overflow-hidden border-y border-border bg-background px-6 pt-16 pb-16 md:px-10 md:pt-24 md:pb-20">
      {/* Ghost numeral */}
      <AnimatePresence mode="wait">
        <motion.span
          key={index}
          aria-hidden
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: EASE }}
          className="pointer-events-none absolute -right-4 top-8 select-none font-display text-[clamp(10rem,28vw,24rem)] font-medium leading-none tracking-[-0.05em] text-foreground/[0.045] md:top-2"
        >
          {String(index + 1).padStart(2, '0')}
        </motion.span>
      </AnimatePresence>

      <div className="relative mx-auto max-w-7xl">
        <FadeUp>
          <Eyebrow>Alumni · Voices</Eyebrow>
        </FadeUp>

        {/* Quote */}
        <div className="mt-10 min-h-[240px] md:mt-14 md:min-h-[300px]">
          <AnimatePresence mode="wait">
            <motion.blockquote
              key={index}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -26 }}
              transition={{ duration: 0.75, ease: EASE }}
            >
              <p className="max-w-5xl font-display text-[clamp(1.7rem,4.6vw,3.9rem)] font-normal leading-[1.15] tracking-[-0.02em] text-foreground">
                <span className="mr-1 text-muted-foreground/50">“</span>
                {current.quote}
                <span className="ml-1 text-muted-foreground/50">”</span>
              </p>
              <footer className="mt-8 flex items-center gap-4">
                <span className="h-px w-10 bg-foreground/40" />
                <div>
                  <div className="font-display text-lg italic text-foreground">
                    {current.name}
                  </div>
                  <div className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                    {current.role}
                  </div>
                </div>
              </footer>
            </motion.blockquote>
          </AnimatePresence>
        </div>

        {/* Controls */}
        <div className="mt-12 flex items-center justify-between md:mt-16">
          <div className="flex items-center gap-4">
            <span className="font-mono text-[11px] tracking-[0.2em] text-foreground">
              {String(index + 1).padStart(2, '0')}
            </span>
            <div className="relative h-px w-28 overflow-hidden bg-border sm:w-44">
              <motion.div
                key={index}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: DURATION / 1000, ease: 'linear' }}
                className="absolute inset-0 origin-left bg-foreground"
              />
            </div>
            <span className="font-mono text-[11px] tracking-[0.2em] text-muted-foreground">
              {String(voices.length).padStart(2, '0')}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.06, y: -1 }}
              whileTap={{ scale: 0.94 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              onClick={() => go(-1)}
              aria-label="Previous testimonial"
              className="group relative flex h-11 w-11 items-center justify-center rounded-full border border-border bg-foreground/[0.02] text-foreground shadow-xs transition-colors duration-200 hover:border-foreground hover:bg-foreground hover:text-background cursor-pointer"
            >
              <ArrowLeft size={16} className="transition-transform duration-200 group-hover:-translate-x-0.5" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.06, y: -1 }}
              whileTap={{ scale: 0.94 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              onClick={() => go(1)}
              aria-label="Next testimonial"
              className="group relative flex h-11 w-11 items-center justify-center rounded-full border border-border bg-foreground/[0.02] text-foreground shadow-xs transition-colors duration-200 hover:border-foreground hover:bg-foreground hover:text-background cursor-pointer"
            >
              <ArrowLeft size={16} className="rotate-180 transition-transform duration-200 group-hover:translate-x-0.5" />
            </motion.button>
          </div>
        </div>
      </div>
    </section>
  );
}
