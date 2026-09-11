// src/app/(main)/editors-shelf/page.tsx
import { db } from '@/lib/db';
import { ensureSeededShelf, itemToBookData } from '@/lib/editors-shelf-helper';
import { BOOKS } from '@/components/sections/hardback/hardback-data';
import EditorsShelfClient from './EditorsShelfClient';

// Regenerate the public shelf at most once an hour; Vercel serves the cached HTML between updates.
export const revalidate = 432000;

export default async function EditorsShelfPage() {
  let initialBooks = BOOKS;

  try {
    const items = await db.editorShelfItem.findMany({
      orderBy: {
        displayOrder: 'asc',
      },
    });

    if (items && items.length > 0) {
      initialBooks = items.map(itemToBookData);
    }
  } catch (error) {
    console.error('Failed to load server-rendered shelf books:', error);
  }

  return <EditorsShelfClient initialBooks={initialBooks} />;
}
