'use client';

import { Eyebrow, RevealWords, FadeUp } from './primitives';

const STATS = [
  ['Est.', '2014'],
  ['Published works', '500+'],
  ['Alumni scattered', '40+'],
  ['Legacy', 'Ongoing'],
];

export default function ManifestoStrip() {
  return (
    <section className="relative w-full border-t border-border bg-background px-6 pt-16 pb-14 md:px-10 md:pt-20 md:pb-16">
      <div className="mx-auto max-w-5xl text-center">
        <FadeUp>
          <Eyebrow className="justify-center">Why we exist</Eyebrow>
        </FadeUp>

        <p className="mt-8 font-display text-[clamp(1.6rem,4vw,3rem)] font-normal leading-[1.25] tracking-[-0.02em] text-foreground">
          <RevealWords text="Pen as our sword, words as power, minds as our frontier;" />{' '}
          <em className="italic text-muted-foreground">
            <RevealWords text="we awaken, illuminate and ascend." delay={0.35} />
          </em>
          <br className="hidden md:block" />
          <span className="mt-3 block text-[clamp(1.3rem,3.2vw,2.3rem)] text-muted-foreground/80">
            <RevealWords text="Beyond the conventional —" delay={0.55} />{' '}
            <em className="font-medium italic text-foreground">
              <RevealWords text="Excelsior." delay={0.7} />
            </em>
          </span>
        </p>

        <FadeUp delay={0.4}>
          <div className="mt-12 md:mt-14 grid grid-cols-2 gap-y-8 border-y border-border py-8 md:py-10 sm:grid-cols-4">
            {STATS.map(([label, value]) => (
              <div key={label} className="flex flex-col gap-1.5">
                <span className="order-2 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                  {label}
                </span>
                <span className="order-1 font-display text-2xl font-medium tracking-tight text-foreground md:text-3xl">
                  {value}
                </span>
              </div>
            ))}
          </div>
        </FadeUp>
      </div>
    </section>
  );
}
