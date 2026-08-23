import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { IssueRequestStatus } from '@prisma/client';
import { requirePermission } from '@/lib/api-auth';
import { deleteImageByUrl } from '@/lib/cloudinary';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error } = await requirePermission('MANAGE_SHELF_LIBRARY');
    if (error) return error;

    const { id } = await params;
    const book = await db.book.findUnique({
      where: { id },
      include: {
        reviews: {
          include: {
            reviewer: {
              select: {
                id: true,
                name: true,
                username: true,
                profilePhoto: true,
              },
            },
          },
        },
        issueRequests: {
          include: {
            requester: {
              select: {
                id: true,
                name: true,
                username: true,
                profilePhoto: true,
              },
            },
          },
        },
      },
    });

    if (!book) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, book });
  } catch (error: any) {
    console.error('Fetch library book error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve book' },
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
    const {
      title,
      author,
      language,
      coverImage,
      description,
      genre,
      isbn,
      pageCount,
      publishedYear,
      totalCopies,
      availabilityStatus,
      amazonLink,
      downloadLink,
      clubReview,
      editorPickType,
    } = await req.json();

    const book = await db.book.findUnique({
      where: { id },
    });

    if (!book) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }

    const genresArray = Array.isArray(genre)
      ? genre
      : typeof genre === 'string'
      ? genre.split(',').map((g: string) => g.trim()).filter(Boolean)
      : book.genre;

    const parsedTotalCopies = totalCopies
      ? parseInt(totalCopies)
      : book.totalCopies;
    const status = availabilityStatus || book.availabilityStatus;
    const bookLanguage =
      language === 'HINDI'
        ? 'HINDI'
        : language === 'ENGLISH'
        ? 'ENGLISH'
        : book.language;

    // If coverImage changed, delete old one from Cloudinary
    const nextCover = coverImage !== undefined ? (coverImage ? String(coverImage).trim() : null) : book.coverImage;
    if (nextCover !== book.coverImage && book.coverImage) {
      await deleteImageByUrl(book.coverImage);
    }

    const updated = await db.book.update({
      where: { id },
      data: {
        title: title || book.title,
        author: author || book.author,
        language: bookLanguage,
        coverImage: nextCover,
        description: description || book.description,
        genre: genresArray,
        isbn: isbn !== undefined ? isbn : book.isbn,
        pageCount: pageCount ? parseInt(pageCount) : book.pageCount,
        publishedYear: publishedYear
          ? parseInt(publishedYear)
          : book.publishedYear,
        totalCopies: parsedTotalCopies,
        availabilityStatus: status,
        amazonLink: amazonLink !== undefined ? amazonLink : book.amazonLink,
        downloadLink: downloadLink !== undefined ? downloadLink : book.downloadLink,
        clubReview: clubReview !== undefined ? clubReview : book.clubReview,
        editorPickType:
          editorPickType !== undefined ? editorPickType : book.editorPickType,
      },
    });

    return NextResponse.json({ success: true, book: updated });
  } catch (error: any) {
    console.error('Update library book error:', error);
    return NextResponse.json(
      { error: 'Failed to update book details' },
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

    const existing = await db.book.findUnique({
      where: { id },
      select: { coverImage: true },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }

    // Check active issue requests
    const activeRequests = await db.issueRequest.count({
      where: {
        bookId: id,
        status: {
          in: [IssueRequestStatus.PENDING, IssueRequestStatus.APPROVED],
        },
      },
    });

    if (activeRequests > 0) {
      return NextResponse.json(
        {
          error:
            'Cannot delete book: active issue requests or checkouts exist.',
        },
        { status: 400 }
      );
    }

    // Delete reviews first to satisfy foreign key constraints
    await db.bookReview.deleteMany({ where: { bookId: id } });
    await db.issueRequest.deleteMany({ where: { bookId: id } });
    await db.book.delete({ where: { id } });

    if (existing.coverImage) {
      await deleteImageByUrl(existing.coverImage);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete book error:', error);
    return NextResponse.json(
      { error: 'Failed to delete book' },
      { status: 500 }
    );
  }
}
