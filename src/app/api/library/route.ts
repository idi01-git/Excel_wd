// src/app/api/library/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { BookAvailabilityStatus } from '@prisma/client';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const genre = searchParams.get('genre') || '';
    const availability = searchParams.get('availability');
    const sort = searchParams.get('sort') || 'title'; // 'title', 'newest', 'rating'
    
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const skip = (page - 1) * limit;

    const whereClause: any = {};

    // Search query on title and author
    if (search.trim()) {
      const cleanSearch = search.trim();
      whereClause.OR = [
        { title: { contains: cleanSearch, mode: 'insensitive' } },
        { author: { contains: cleanSearch, mode: 'insensitive' } }
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
    let orderBy: any = {};
    if (sort === 'newest') {
      orderBy = { createdAt: 'desc' };
    } else if (sort === 'title') {
      orderBy = { title: 'asc' };
    }

    let books = await db.book.findMany({
      where: whereClause,
      include: {
        reviews: {
          select: { rating: true }
        }
      },
      orderBy,
      skip,
      take: limit
    });

    const total = await db.book.count({ where: whereClause });

    // Map stars average rating
    const booksWithAvgRating = books.map((book) => {
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

    // Custom sorting for rating since average rating is computed dynamically
    if (sort === 'rating') {
      booksWithAvgRating.sort((a, b) => b.avgRating - a.avgRating);
    }

    return NextResponse.json({
      success: true,
      books: booksWithAvgRating,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error: any) {
    console.error('Fetch library books error:', error);
    return NextResponse.json({ error: 'Failed to retrieve books list' }, { status: 500 });
  }
}
