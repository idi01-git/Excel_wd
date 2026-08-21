// src/app/api/admin/editors-shelf/[id]/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requirePermission } from '@/lib/api-auth';
import { parseEditorialNote, serializeEditorialNote } from '@/lib/editors-shelf-helper';
import { deleteImageByUrl } from '@/lib/cloudinary';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error } = await requirePermission('MANAGE_SHELF_LIBRARY');
    if (error) return error;

    const { id } = await params;
    const item = await db.editorShelfItem.findUnique({
      where: { id },
      include: {
        comments: true,
      },
    });

    if (!item) {
      return NextResponse.json(
        { error: 'Editor shelf item not found' },
        { status: 404 }
      );
    }

    const meta = parseEditorialNote(item.editorialNote);
    return NextResponse.json({
      success: true,
      item: {
        ...item,
        categoryBadge: meta.categoryBadge,
        leftPageHeader: meta.leftPageHeader,
        rightPageOrnament: meta.rightPageOrnament,
        readButtonText: meta.readButtonText,
        language: meta.language,
        retailers: meta.retailers,
        editorialText: meta.editorialText,
      },
    });
  } catch (error: any) {
    console.error('Fetch editor shelf item error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve item' },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error } = await requirePermission('MANAGE_SHELF_LIBRARY');
    if (error) return error;

    const { id } = await params;
    const body = await req.json();
    const {
      title,
      author,
      slug,
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

    const existing = await db.editorShelfItem.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Editor shelf item not found' },
        { status: 404 }
      );
    }

    const existingMeta = parseEditorialNote(existing.editorialNote);

    const serializedNote = serializeEditorialNote({
      editorialText: editorialText !== undefined ? editorialText : (editorialNote || synopsis || existingMeta.editorialText),
      categoryBadge: categoryBadge !== undefined ? categoryBadge : existingMeta.categoryBadge,
      leftPageHeader: leftPageHeader !== undefined ? leftPageHeader : existingMeta.leftPageHeader,
      rightPageOrnament: rightPageOrnament !== undefined ? rightPageOrnament : existingMeta.rightPageOrnament,
      readButtonText: readButtonText !== undefined ? readButtonText : existingMeta.readButtonText,
      language: language !== undefined ? language : existingMeta.language,
      retailers: retailers !== undefined ? (Array.isArray(retailers) ? retailers : []) : existingMeta.retailers,
    });

    const genresArray = Array.isArray(genre)
      ? genre
      : typeof genre === 'string'
      ? genre.split(',').map((g: string) => g.trim()).filter(Boolean)
      : existing.genre;

    // Delete old cover image from Cloudinary if replaced
    if (coverImage !== undefined && coverImage !== existing.coverImage && existing.coverImage) {
      try {
        await deleteImageByUrl(existing.coverImage);
      } catch (err) {
        console.error('Failed to delete replaced cover from Cloudinary:', err);
      }
    }

    const updated = await db.editorShelfItem.update({
      where: { id },
      data: {
        title: title || existing.title,
        author: author || existing.author,
        slug: slug || existing.slug,
        coverImage: coverImage !== undefined ? coverImage : existing.coverImage,
        editorialNote: serializedNote,
        synopsis: synopsis !== undefined ? synopsis : existing.synopsis,
        excerpt: excerpt !== undefined ? excerpt : existing.excerpt,
        genre: genresArray,
        spineColor: spineColor || existing.spineColor,
        spineTextColor: spineTextColor || existing.spineTextColor,
        coverColor: coverColor || existing.coverColor,
        coverTextColor: coverTextColor || existing.coverTextColor,
        motif: motif || existing.motif,
        foilColor: foilColor || existing.foilColor,
        width: width !== undefined ? parseFloat(width) : existing.width,
        height: height !== undefined ? parseFloat(height) : existing.height,
        spineThickness:
          spineThickness !== undefined
            ? parseFloat(spineThickness)
            : existing.spineThickness,
        readLink: readLink !== undefined ? readLink : existing.readLink,
        displayOrder:
          displayOrder !== undefined
            ? Number(displayOrder)
            : existing.displayOrder,
      },
    });

    return NextResponse.json({ success: true, item: updated });
  } catch (error: any) {
    console.error('Update editor shelf item error:', error);
    return NextResponse.json(
      { error: 'Failed to update item' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error } = await requirePermission('MANAGE_SHELF_LIBRARY');
    if (error) return error;

    const { id } = await params;

    const existing = await db.editorShelfItem.findUnique({
      where: { id },
    });

    if (existing?.coverImage) {
      try {
        await deleteImageByUrl(existing.coverImage);
      } catch (err) {
        console.error('Failed to delete book cover from Cloudinary:', err);
      }
    }

    await db.comment.deleteMany({ where: { editorShelfId: id } });
    await db.editorShelfItem.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete editor shelf item error:', error);
    return NextResponse.json(
      { error: 'Failed to delete item' },
      { status: 500 }
    );
  }
}
