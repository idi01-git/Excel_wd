'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import type { HeroCardInput } from '@/components/sections/cardwall/Cardwall';

const Cardwall = dynamic(() => import('@/components/sections/cardwall/Cardwall'), {
  ssr: false,
  loading: () => null,
});

export default function CardwallHero({
  startEntrance = true,
  heroCards = [],
}: {
  startEntrance?: boolean;
  heroCards?: HeroCardInput[];
}) {
  const [cards, setCards] = useState<HeroCardInput[]>(heroCards);

  useEffect(() => {
    if (heroCards.length > 0) {
      setCards(heroCards);
      return;
    }
    fetch('/api/site-settings')
      .then((res) => res.json())
      .then((data) => {
        const saved = data.settings?.['home.heroCards']?.cards;
        if (Array.isArray(saved) && saved.length > 0) {
          setCards(saved);
        }
      })
      .catch(() => {});
  }, [heroCards]);

  return (
    <Cardwall
      heroCards={cards.length > 0 ? cards : heroCards}
      startEntrance={startEntrance}
    />
  );
}