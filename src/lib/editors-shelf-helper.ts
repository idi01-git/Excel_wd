// src/lib/editors-shelf-helper.ts
import { db } from '@/lib/db';
import { BOOKS, type BookData } from '@/components/sections/hardback/hardback-data';

export interface ExtraShelfMetadata {
  categoryBadge?: string;
  leftPageHeader?: string;
  rightPageOrnament?: string;
  readButtonText?: string;
  language?: 'en' | 'hi';
  retailers?: Array<{ name: string; price: string; url: string }>;
  editorialText?: string;
}

/**
 * Parses the editorialNote string which may contain JSON serialized extra metadata
 */
export function parseEditorialNote(noteStr?: string | null): {
  editorialText: string;
  categoryBadge: string;
  leftPageHeader: string;
  rightPageOrnament: string;
  readButtonText: string;
  language: 'en' | 'hi';
  retailers: Array<{ name: string; price: string; url: string }>;
} {
  if (!noteStr) {
    return {
      editorialText: '',
      categoryBadge: 'READ OF THE WEEK · FEB 2025',
      leftPageHeader: 'FROM THE SHELF OF EXCELSIOR',
      rightPageOrnament: '— § —',
      readButtonText: 'READ PUBLICATION',
      language: 'en',
      retailers: [],
    };
  }

  if (noteStr.startsWith('{') && noteStr.endsWith('}')) {
    try {
      const parsed = JSON.parse(noteStr) as ExtraShelfMetadata;
      return {
        editorialText: parsed.editorialText || '',
        categoryBadge: parsed.categoryBadge || 'READ OF THE WEEK · FEB 2025',
        leftPageHeader: parsed.leftPageHeader || 'FROM THE SHELF OF EXCELSIOR',
        rightPageOrnament: parsed.rightPageOrnament || '— § —',
        readButtonText: parsed.readButtonText || 'READ PUBLICATION',
        language: parsed.language || (/[ऀ-ॿ]/.test(parsed.editorialText || '') ? 'hi' : 'en'),
        retailers: Array.isArray(parsed.retailers) ? parsed.retailers : [],
      };
    } catch {
      // Fall through to plain text
    }
  }

  const isHindi = /[ऀ-ॿ]/.test(noteStr);
  return {
    editorialText: noteStr,
    categoryBadge: isHindi ? 'साप्ताहिक कृति · फरवरी २०२५' : 'READ OF THE WEEK · FEB 2025',
    leftPageHeader: 'FROM THE SHELF OF EXCELSIOR',
    rightPageOrnament: '— § —',
    readButtonText: 'READ PUBLICATION',
    language: isHindi ? 'hi' : 'en',
    retailers: [],
  };
}

/**
 * Serializes extra metadata and editorial text into a stored string
 */
export function serializeEditorialNote(input: {
  editorialText: string;
  categoryBadge?: string;
  leftPageHeader?: string;
  rightPageOrnament?: string;
  readButtonText?: string;
  language?: 'en' | 'hi';
  retailers?: Array<{ name: string; price: string; url: string }>;
}): string {
  return JSON.stringify({
    editorialText: input.editorialText || '',
    categoryBadge: input.categoryBadge || 'READ OF THE WEEK · FEB 2025',
    leftPageHeader: input.leftPageHeader || 'FROM THE SHELF OF EXCELSIOR',
    rightPageOrnament: input.rightPageOrnament || '— § —',
    readButtonText: input.readButtonText || 'READ PUBLICATION',
    language: input.language || 'en',
    retailers: input.retailers || [],
  });
}

/**
 * Ensures all 12 reference books from hardback-data.ts exist in the database.
 */
export async function ensureSeededShelf(forceSync = false) {
  for (let i = 0; i < BOOKS.length; i++) {
    const b = BOOKS[i];
    const existing = await db.editorShelfItem.findUnique({
      where: { slug: b.id },
    });

    if (!existing || forceSync) {
      const isHindi = /[ऀ-ॿ]/.test(b.title + b.author);
      const serializedNote = serializeEditorialNote({
        editorialText: b.synopsis || '',
        categoryBadge: isHindi ? 'READ OF THE WEEK · FEB 2025' : 'READ OF THE WEEK · FEB 2025',
        leftPageHeader: 'FROM THE SHELF OF EXCELSIOR',
        rightPageOrnament: '— § —',
        readButtonText: 'READ PUBLICATION',
        language: isHindi ? 'hi' : 'en',
        retailers: b.retailers || [],
      });

      await db.editorShelfItem.upsert({
        where: { slug: b.id },
        update: forceSync
          ? {
              title: b.title,
              author: b.author,
              coverImage: b.coverImage || null,
              synopsis: b.synopsis || null,
              excerpt: b.excerpt || null,
              spineColor: b.spineColor,
              spineTextColor: b.spineTextColor,
              coverColor: b.coverColor,
              coverTextColor: b.coverTextColor,
              motif: b.motif,
              foilColor: b.foilColor,
              width: b.width,
              height: b.height,
              spineThickness: b.spineThickness,
              readLink: b.retailers?.[0]?.url || '/publications',
            }
          : {},
        create: {
          title: b.title,
          author: b.author,
          slug: b.id,
          coverImage: b.coverImage || null,
          editorialNote: serializedNote,
          synopsis: b.synopsis || null,
          excerpt: b.excerpt || null,
          genre: isHindi ? ['Classic Literature', 'Hindi Novel'] : ['Strategy', 'Non-Fiction'],
          spineColor: b.spineColor || '#182b5e',
          spineTextColor: b.spineTextColor || '#f3ecd8',
          coverColor: b.coverColor || '#1c3370',
          coverTextColor: b.coverTextColor || '#f3ecd8',
          motif: b.motif || 'lattice',
          foilColor: b.foilColor || '#e7b55f',
          width: b.width || 2.0,
          height: b.height || 3.1,
          spineThickness: b.spineThickness || 0.42,
          readLink: b.retailers?.[0]?.url || '/publications',
          displayOrder: i * 10,
        },
      });
    }
  }
}

/**
 * Converts a database EditorShelfItem to full 3D BookData
 */
export function itemToBookData(item: any): BookData {
  const meta = parseEditorialNote(item.editorialNote);
  return {
    id: item.slug || item.id,
    title: item.title,
    author: item.author,
    spineColor: item.spineColor || '#182b5e',
    spineTextColor: item.spineTextColor || '#f3ecd8',
    coverColor: item.coverColor || '#1c3370',
    coverTextColor: item.coverTextColor || '#f3ecd8',
    coverImage: item.coverImage || undefined,
    motif: item.motif || 'lattice',
    foilColor: item.foilColor || '#e7b55f',
    synopsis: item.synopsis || meta.editorialText || '',
    excerpt: item.excerpt || '',
    retailers: meta.retailers && meta.retailers.length > 0
      ? meta.retailers
      : item.readLink
      ? [{ name: 'Read Online', price: 'Free', url: item.readLink }]
      : [],
    width: item.width || 2.0,
    height: item.height || 3.1,
    spineThickness: item.spineThickness || 0.42,
    categoryBadge: meta.categoryBadge,
    leftPageHeader: meta.leftPageHeader,
    rightPageOrnament: meta.rightPageOrnament,
    readButtonText: meta.readButtonText,
    readLink: item.readLink || '/publications',
    language: meta.language,
  };
}
