import { PrismaClient, PublicationStatus } from '@prisma/client';

const db = new PrismaClient();

async function main() {
  const [publications, shelfBooks, events] = await Promise.all([
    db.publication.findMany({ where: { status: PublicationStatus.PUBLISHED }, select: { title: true, slug: true, coverImage: true, author: { select: { name: true } } }, orderBy: { publishedAt: 'desc' }, take: 12 }),
    db.editorShelfItem.findMany({ select: { title: true, author: true, slug: true, coverImage: true, editorialNote: true }, orderBy: { displayOrder: 'asc' }, take: 12 }),
    db.event.findMany({ select: { id: true, title: true, slug: true, date: true, venue: true, posterImage: true }, orderBy: { date: 'desc' }, take: 8 }),
  ]);

  const cards = [
    ...publications.map((item) => ({ title: item.title, writer: item.author.name, description: '', href: `/publications/${item.slug}`, image: item.coverImage || '', accent: '#f3e8d2' })),
    ...shelfBooks.map((item) => ({ title: item.title, writer: item.author, description: item.editorialNote, href: `/editors-shelf/${item.slug}`, image: item.coverImage || '', accent: '#f3e8d2' })),
  ].slice(0, 24);

  const items = events.map((item) => ({ eventId: item.id, title: item.title, kind: 'Event', date: item.date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }), venue: item.venue, image: item.posterImage || '', href: `/events/${item.slug}` }));

  const settings = [
    ['home.heroCards', { cards }],
    ['home.eventsStrip', { items }],
    ['home.testimonials', { mode: 'RANDOM', pinnedIds: [] }],
  ] as const;

  for (const [key, value] of settings) {
    await db.siteSetting.upsert({ where: { key }, create: { key, value }, update: {} });
  }
  console.log(`CMS defaults ready: ${cards.length} cards and ${items.length} event rows. Existing CMS edits were preserved.`);
}

main().catch((error) => { console.error(error); process.exit(1); }).finally(async () => db.$disconnect());