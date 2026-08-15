'use client';

import dynamic from 'next/dynamic';

const Cardwall = dynamic(
  () => import('@/components/sections/cardwall/Cardwall'),
  {
    ssr: false,
    loading: () => (
      <div className="relative h-screen w-full overflow-hidden bg-background flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-foreground/20 border-t-foreground animate-spin" />
      </div>
    ),
  }
);

export default function CardwallHero() {
  return <Cardwall />;
}
