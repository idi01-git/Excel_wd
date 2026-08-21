// src/app/api/admin/editors-shelf/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requirePermission } from '@/lib/api-auth';
import { ensureSeededShelf, parseEditorialNote, serializeEditorialNote } from '@/lib/editors-shelf-helper';

export async function GET() {
  try {
    const { error } = await requirePermission('MANAGE_SHELF_LIBRARY');
    if (error) return error;

    const items = await db.editorShelfItem.findMany({
      orderBy: { displayOrder: 'asc' },
    });

    // Expand parsed metadata for editor convenience
    const expandedItems = items.map((item) => {
      const meta = parseEditorialNote(item.editorialNote);
      return {
        ...item,
        categoryBadge: meta.categoryBadge,
        leftPageHeader: meta.leftPageHeader,
        rightPageOrnament: meta.rightPageOrnament,
        readButtonText: meta.readButtonText,
        language: meta.language,
        retailers: meta.retailers,
        editorialText: meta.editorialText,
      };
    });

    return NextResponse.json({ success: true, items: expandedItems });
  } catch (error: any) {
    console.error('Fetch editor shelf items error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve editor shelf items' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const { error } = await requirePermission('MANAGE_SHELF_LIBRARY');
    if (error) return error;

    const body = await req.json();
    const {
      title,
      author,
      slug: customSlug,
      coverImage,
      editorialNote,
      editorialText,
      categoryBadge,
      leftPageHeader,
      rightPageOrnament,
      readButtonText,
      language,
      retailers,
      synopsis,
      excerpt,
      genre,
      spineColor,
      spineTextColor,
      coverColor,
      coverTextColor,
      motif,
      foilColor,
      width,
      height,
      spineThickness,
      readLink,
      displayOrder,
    } = body;

    if (!title || !author) {
      return NextResponse.json(
        { error: 'Missing required parameters (title, author)' },
        { status: 400 }
      );
    }

    const slugBase = (customSlug || title)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    let slug = slugBase;

    const existing = await db.editorShelfItem.findUnique({
      where: { slug },
    });

    if (existing) {
      slug = `${slugBase}-${Date.now().toString().slice(-4)}`;
    }

    const genresArray = Array.isArray(genre)
      ? genre
      : typeof genre === 'string'
      ? genre.split(',').map((g: string) => g.trim()).filter(Boolean)
      : [];

    const maxOrder = await db.editorShelfItem.aggregate({
      _max: { displayOrder: true },
    });
    const order =
      displayOrder !== undefined
        ? Number(displayOrder)
        : (maxOrder._max.displayOrder || 0) + 10;

    const serializedNote = serializeEditorialNote({
      editorialText: editorialText !== undefined ? editorialText : (editorialNote || synopsis || ''),
      categoryBadge: categoryBadge || (language === 'hi' ? 'READ OF THE WEEK · FEB 2025' : 'READ OF THE WEEK · FEB 2025'),
      leftPageHeader: leftPageHeader || 'FROM THE SHELF OF EXCELSIOR',
      rightPageOrnament: rightPageOrnament || '— § —',
      readButtonText: readButtonText || 'READ PUBLICATION',
      language: language || (/[ऀ-ॿ]/.test(title + author) ? 'hi' : 'en'),
      retailers: Array.isArray(retailers) ? retailers : [],
    });

    const item = await db.editorShelfItem.create({
      data: {
        title,
        author,
        slug,
        coverImage: coverImage || null,
        editorialNote: serializedNote,
        synopsis: synopsis || null,
        excerpt: excerpt || null,
        genre: genresArray,
        spineColor: spineColor || '#182b5e',
        spineTextColor: spineTextColor || '#f3ecd8',
        coverColor: coverColor || '#1c3370',
        coverTextColor: coverTextColor || '#f3ecd8',
        motif: motif || 'lattice',
        foilColor: foilColor || '#e7b55f',
        width: width ? parseFloat(width) : 1.95,
        height: height ? parseFloat(height) : 3.1,
        spineThickness: spineThickness ? parseFloat(spineThickness) : 0.42,
        readLink: readLink || '/publications',
        displayOrder: order,
      },
    });

    return NextResponse.json({ success: true, item });
  } catch (error: any) {
    console.error('Create editor shelf item error:', error);
    return NextResponse.json(
      { error: 'Failed to create curated item' },
      { status: 500 }
    );
  }
}
