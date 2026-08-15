'use client';

import { Eyebrow, RevealWords, FadeUp } from './primitives';

const STATS = [
  ['Est.', '2015'],
  ['Published works', '500+'],
  ['Alumni scattered', '40+'],
  ['Legacy', 'Ongoing'],
];

export default function ManifestoStrip() {
  return (
    <section className="relative w-full border-t border-border bg-background px-6 py-20 md:px-10 md:py-28">
      <div className="mx-auto max-w-5xl text-center">
        <FadeUp>
          <Eyebrow className="justify-center">Why we exist</Eyebrow>
        </FadeUp>

        <p className="mt-8 font-display text-[clamp(1.6rem,4.2vw,3.2rem)] font-normal leading-[1.2] tracking-[-0.015em] text-foreground">
          <RevealWords text="A record of our dedication — the blood, passion and ink of" />{' '}
          <em className="italic text-muted-foreground">
            <RevealWords text="seniors now rocking in their lives." delay={0.35} />
          </em>{' '}
          <RevealWords text="We continue their legacy." delay={0.55} />
        </p>

        <FadeUp delay={0.4}>
          <div className="mt-14 grid grid-cols-2 gap-y-8 border-t border-border pt-8 sm:grid-cols-4">
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
