'use client';

import Cardwall, { type HeroCardInput } from '@/components/sections/cardwall/Cardwall';

export default function CardwallHero({
  startEntrance = true,
  heroCards = [],
}: {
  startEntrance?: boolean;
  heroCards?: HeroCardInput[];
}) {
  return (
    <Cardwall
      heroCards={heroCards}
      startEntrance={startEntrance}
    />
  );
}