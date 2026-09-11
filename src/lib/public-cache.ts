import { revalidatePath } from 'next/cache';

export function revalidatePublicContent(kind: 'home' | 'shelf' | 'events' | 'publications' | 'gallery' | 'achievements' | 'library', slug?: string) {
  const paths: Record<typeof kind, string[]> = {
    home: ['/'],
    shelf: ['/', '/editors-shelf', '/api/editors-shelf'],
    events: ['/', '/events', '/api/events'],
    publications: ['/publications', '/api/publications'],
    gallery: ['/community/gallery', '/api/community/gallery'],
    achievements: ['/community/achievements', '/api/community/achievements'],
    library: ['/community/library', '/api/library'],
  };

  for (const path of paths[kind]) revalidatePath(path);
  if (kind === 'events' && slug) {
    revalidatePath(`/events/${slug}`);
    revalidatePath(`/events/${slug}/report`);
    revalidatePath(`/events/${slug}/gallery`);
  }
}