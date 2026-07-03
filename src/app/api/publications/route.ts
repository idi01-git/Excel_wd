// src/app/api/publications/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { PublicationStatus, PublicationCategory, InteractionType, Prisma } from '@prisma/client';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const categoryQuery = searchParams.get('category');
    const sortQuery = searchParams.get('sort') || 'latest';
    const searchQuery = searchParams.get('search');

    const whereClause: Prisma.PublicationWhereInput = {
      status: PublicationStatus.PUBLISHED
    };

    // Category mapping
    if (categoryQuery && categoryQuery.toLowerCase() !== 'all') {
      const q = categoryQuery.toUpperCase().replace(/\s+/g, '');
      let category: PublicationCategory | undefined;

      if (q === 'ARTICLE' || q === 'ARTICLES') category = PublicationCategory.ARTICLE;
      else if (q === 'STORY' || q === 'STORIES') category = PublicationCategory.STORY;
      else if (q === 'POEM' || q === 'POEMS') category = PublicationCategory.POEM;
      else if (q === 'REVIEW' || q === 'BOOKREVIEWS' || q === 'REVIEWS') category = PublicationCategory.REVIEW;

      if (category) {
        whereClause.category = category;
      }
    }

    // Search clause
    if (searchQuery) {
      const cleanSearch = searchQuery.trim();
      whereClause.OR = [
        { title: { contains: cleanSearch, mode: 'insensitive' } },
        { tags: { has: cleanSearch } }
      ];
    }

    // Sorting block
    let orderBy: Prisma.PublicationOrderByWithRelationInput = { createdAt: 'desc' };

    if (sortQuery === 'popular') {
      // Sort by interactions (likes/bookmarks count)
      orderBy = {
        interactions: {
          _count: 'desc'
        }
      };
    } else if (sortQuery === 'discussed') {
      // Sort by comments count
      orderBy = {
        comments: {
          _count: 'desc'
        }
      };
    } else if (sortQuery === 'trending') {
      // Combined score: interactions + comments
      // Prisma doesn't directly support sorting by sum of two relation counts, 
      // so we sort by interactions count as a proxy or do it in memory.
      orderBy = {
        interactions: {
          _count: 'desc'
        }
      };
    }

    const publications = await db.publication.findMany({
      where: whereClause,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            username: true,
            profilePhoto: true
          }
        },
        _count: {
          select: {
            comments: true,
            interactions: {
              where: { type: InteractionType.LIKE }
            }
          }
        }
      },
      orderBy
    });

    return NextResponse.json({ success: true, publications });
  } catch (error: any) {
    console.error('Fetch publications error:', error);
    return NextResponse.json({ error: 'Failed to fetch publications' }, { status: 500 });
  }
}
