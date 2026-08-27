import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

const KEYS = ['home.eventsStrip', 'home.testimonials', 'home.heroCards', 'footer.links'] as const;

export async function GET() {
  try {
    const rows = await db.siteSetting.findMany({ where: { key: { in: [...KEYS] } } });
    const settings = Object.fromEntries(rows.map((row) => [row.key, row.value]));
    const testimonial = settings['home.testimonials'] as { mode?: string; pinnedIds?: string[] } | undefined;
    if (testimonial?.mode === 'RANDOM' || testimonial?.mode === 'CURATED') {
      const where = testimonial.mode === 'CURATED' ? { id: { in: testimonial.pinnedIds || [] }, message: { not: null } } : { message: { not: null } };
      const alumni = await db.alumniProfile.findMany({ where, orderBy: { createdAt: 'asc' } });
      if (testimonial.mode === 'RANDOM') { for (let index = alumni.length - 1; index > 0; index -= 1) { const swapIndex = Math.floor(Math.random() * (index + 1)); [alumni[index], alumni[swapIndex]] = [alumni[swapIndex], alumni[index]]; } }
      settings['home.testimonials'] = { ...testimonial, items: alumni.slice(0, 4).map((item) => ({ quote: item.message, name: item.name, role: [item.batch, item.currentPosition].filter(Boolean).join(' · ') })) };
    }
    const response = NextResponse.json({ success: true, settings });
    response.headers.set(
      'Cache-Control',
      'public, s-maxage=60, stale-while-revalidate=300'
    );
    return response;
  } catch (error: unknown) {
    console.error('Public site settings error:', error);
    return NextResponse.json({ error: 'Failed to retrieve site settings' }, { status: 500 });
  }
}