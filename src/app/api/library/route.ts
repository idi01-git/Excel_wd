// src/app/api/library/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { BookAvailabilityStatus, Language } from '@prisma/client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const genre = searchParams.get('genre') || '';
    const language = searchParams.get('language') || '';
    const availability = searchParams.get('availability');
    const sort = searchParams.get('sort') || 'title';
    
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '200');
    const skip = (page - 1) * limit;

    const whereClause: any = {};

    // Language filter
    if (language.trim()) {
      const upperLang = language.trim().toUpperCase();
      if (upperLang === 'HINDI') {
        whereClause.language = Language.HINDI;
      } else if (upperLang === 'ENGLISH') {
        whereClause.language = Language.ENGLISH;
      }
    }

    // Search query on title, author, and description
    if (search.trim()) {
      const cleanSearch = search.trim();
      whereClause.OR = [
        { title: { contains: cleanSearch, mode: 'insensitive' } },
        { author: { contains: cleanSearch, mode: 'insensitive' } },
        { description: { contains: cleanSearch, mode: 'insensitive' } }
      ];
    }

    // Genre filter
    if (genre.trim()) {
      whereClause.genre = { has: genre.trim() };
    }

    // Availability status
    if (availability && Object.values(BookAvailabilityStatus).includes(availability as BookAvailabilityStatus)) {
      whereClause.availabilityStatus = availability as BookAvailabilityStatus;
    }

    // Define Sorting
    let orderBy: any[] = [];
    if (sort === 'newest' || sort === 'year-desc') {
      orderBy = [{ publishedYear: 'desc' }, { createdAt: 'desc' }];
    } else if (sort === 'year-asc') {
      orderBy = [{ publishedYear: 'asc' }, { createdAt: 'asc' }];
    } else if (sort === 'author' || sort === 'author-asc') {
      orderBy = [{ author: 'asc' }, { title: 'asc' }];
    } else if (sort === 'title-desc') {
      orderBy = [{ title: 'desc' }];
    } else {
      // Default: title ascending
      orderBy = [{ title: 'asc' }];
    }

    const [books, total] = await Promise.all([
      db.book.findMany({
        where: whereClause,
        include: {
          reviews: {
            select: { rating: true }
          }
        },
        orderBy,
        skip,
        take: limit
      }),
      db.book.count({ where: whereClause })
    ]);

    // Compute star rating
    let booksWithAvgRating = books.map((book) => {
      const totalReviews = book.reviews.length;
      const avgRating = totalReviews > 0
        ? parseFloat((book.reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1))
        : 0;

      return {
        ...book,
        avgRating,
        totalReviews
      };
    });

    // Rating sort
    if (sort === 'rating' || sort === 'rating-desc') {
      booksWithAvgRating.sort((a, b) => {
        if (b.avgRating !== a.avgRating) return b.avgRating - a.avgRating;
        return a.title.localeCompare(b.title);
      });
    }

    const response = NextResponse.json({
      success: true,
      books: booksWithAvgRating,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });

    response.headers.set(
      'Cache-Control',
      'public, s-maxage=30, stale-while-revalidate=180'
    );

    return response;
  } catch (error: any) {
    console.error('Fetch library books error:', error);
    return NextResponse.json({ error: 'Failed to retrieve books list' }, { status: 500 });
  }
}
