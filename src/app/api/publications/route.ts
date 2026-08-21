// src/app/api/publications/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { PublicationStatus, PublicationCategory, InteractionType, Prisma } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
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
      orderBy = {
        interactions: {
          _count: 'desc'
        }
      };
    } else if (sortQuery === 'discussed') {
      orderBy = {
        comments: {
          _count: 'desc'
        }
      };
    } else if (sortQuery === 'trending') {
      orderBy = {
        interactions: {
          _count: 'desc'
        }
      };
    }

    const limit = Math.max(1, parseInt(searchParams.get('limit') || '5', 10));
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const skip = (page - 1) * limit;

    const [total, publicationsRaw] = await Promise.all([
      db.publication.count({ where: whereClause }),
      db.publication.findMany({
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
          alumniProfile: {
            select: {
              id: true,
              name: true,
              batch: true,
              branch: true,
              photo: true,
            }
          },
          _count: {
            select: {
              comments: true,
              interactions: {
                where: { type: InteractionType.LIKE }
              }
            }
          },
          ...(userId ? {
            interactions: {
              where: {
                userId: userId,
                type: { in: [InteractionType.LIKE, InteractionType.BOOKMARK] }
              },
              select: {
                id: true,
                type: true
              }
            }
          } : {})
        },
        orderBy,
        take: limit,
        skip: skip,
      })
    ]);

    const publications = publicationsRaw.map(pub => {
      const { interactions, ...rest } = pub as any;
      return {
        ...rest,
        hasLiked: interactions ? interactions.some((i: any) => i.type === 'LIKE') : false,
        hasBookmarked: interactions ? interactions.some((i: any) => i.type === 'BOOKMARK') : false
      };
    });

    const hasMore = skip + publicationsRaw.length < total;

    return NextResponse.json({
      success: true,
      publications,
      total,
      page,
      hasMore,
      limit
    });
  } catch (error: any) {
    console.error('Fetch publications error:', error);
    return NextResponse.json({ error: 'Failed to fetch publications' }, { status: 500 });
  }
}
