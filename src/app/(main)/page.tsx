// src/app/(main)/page.tsx
import { db } from '@/lib/db';
import HomeClientWrapper from '@/components/home/HomeClientWrapper';
import type { HeroCardInput } from '@/components/sections/cardwall/Cardwall';
import { itemToBookData } from '@/lib/editors-shelf-helper';
import type { BookData } from '@/components/sections/hardback/hardback-data';

export const revalidate = 60;

const KEYS = ['home.eventsStrip', 'home.testimonials', 'home.heroCards'] as const;

export default async function RootPage() {
  let heroCards: HeroCardInput[] = [];
  let eventsItems: any[] | undefined = undefined;
  let testimonialsItems: any[] | undefined = undefined;
  let shelfBooks: BookData[] | undefined = undefined;
  let totalLibraryCount: number = 62;

  try {
    const [rows, shelfItems, libraryCount] = await Promise.all([
      db.siteSetting.findMany({ where: { key: { in: [...KEYS] } } }).catch(() => []),
      db.editorShelfItem.findMany({ orderBy: { displayOrder: 'asc' } }).catch(() => []),
      db.book.count().catch(() => 62),
    ]);

    totalLibraryCount = libraryCount || 62;

    if (shelfItems && shelfItems.length > 0) {
      shelfBooks = shelfItems.map(itemToBookData);
    }

    const settings = Object.fromEntries(rows.map((row) => [row.key, row.value]));

    const cards = (settings['home.heroCards'] as any)?.cards;
    if (Array.isArray(cards) && cards.length > 0) {
      heroCards = cards;
    }

    let events = (settings['home.eventsStrip'] as any)?.items;
    if (!Array.isArray(events) || events.length === 0) {
      const dbEvents = await db.event
        .findMany({
          where: { status: { not: 'CANCELLED' } },
          orderBy: { date: 'desc' },
          take: 8,
        })
        .catch(() => []);

      if (dbEvents.length > 0) {
        events = dbEvents.map((e) => ({
          title: e.title,
          kind: e.isCompetition ? 'Competition' : 'Event',
          date: new Date(e.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          venue: e.venue,
          image: e.coverImage || e.posterImage || '',
          href: `/events/${e.slug}`,
        }));
      }
    }

    if (Array.isArray(events) && events.length > 0) {
      eventsItems = events.slice(0, 8).map((item: any, index: number) => ({
        index: String(index + 1).padStart(2, '0'),
        title: item.title,
        kind: item.kind,
        date: item.date,
        venue: item.venue,
        image: item.image,
        href: item.href || '/events',
      }));
    } else {
      eventsItems = [];
    }

    const testimonial = settings['home.testimonials'] as { mode?: string; pinnedIds?: string[]; items?: any[] } | undefined;
    if (testimonial?.mode === 'RANDOM' || testimonial?.mode === 'CURATED') {
      const where = testimonial.mode === 'CURATED' ? { id: { in: testimonial.pinnedIds || [] }, message: { not: null } } : { message: { not: null } };
      const alumni = await db.alumniProfile.findMany({ where, orderBy: { createdAt: 'asc' } }).catch(() => []);
      if (testimonial.mode === 'RANDOM') {
        for (let index = alumni.length - 1; index > 0; index -= 1) {
          const swapIndex = Math.floor(Math.random() * (index + 1));
          [alumni[index], alumni[swapIndex]] = [alumni[swapIndex], alumni[index]];
        }
      }
      testimonialsItems = alumni.slice(0, 4).map((item) => ({
        quote: item.message,
        name: item.name,
        role: [item.batch, item.currentPosition].filter(Boolean).join(' · '),
      }));
    } else if (Array.isArray(testimonial?.items) && testimonial.items.length > 0) {
      testimonialsItems = testimonial.items;
    }
  } catch (error) {
    console.error('Error loading initial site data on server:', error);
  }

  return (
    <HomeClientWrapper
      initialHeroCards={heroCards}
      initialEvents={eventsItems}
      initialTestimonials={testimonialsItems}
      initialShelfBooks={shelfBooks}
      initialLibraryCount={totalLibraryCount}
    />
  );
}
