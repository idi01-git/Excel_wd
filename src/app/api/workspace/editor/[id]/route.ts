// src/app/api/workspace/editor/[id]/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { PublicationStatus } from '@prisma/client';

async function checkAuth() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) return null;
  return session.user;
}

// Recurse TipTap JSON to calculate word count
function countWordsFromTipTapJSON(node: any): number {
  if (!node) return 0;
  let count = 0;
  if (node.type === 'text' && typeof node.text === 'string') {
    count += node.text.trim().split(/\s+/).filter(Boolean).length;
  }
  if (node.content && Array.isArray(node.content)) {
    for (const child of node.content) {
      count += countWordsFromTipTapJSON(child);
    }
  }
  return count;
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await checkAuth();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const pub = await db.publication.findUnique({
      where: { id }
    });

    if (!pub) {
      return NextResponse.json({ error: 'Publication not found' }, { status: 404 });
    }

    if (pub.authorId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    return NextResponse.json({ success: true, publication: pub });
  } catch (error: any) {
    console.error('Fetch editor error:', error);
    return NextResponse.json({ error: 'Failed to fetch publication' }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await checkAuth();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const pub = await db.publication.findUnique({
      where: { id }
    });

    if (!pub) {
      return NextResponse.json({ error: 'Publication not found' }, { status: 404 });
    }

    if (pub.authorId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Locked check: strictly check status === DRAFT or REJECTED
    if (pub.status === PublicationStatus.PENDING || pub.status === PublicationStatus.PUBLISHED) {
      return NextResponse.json({ error: 'Locked: Publication is currently under review or published' }, { status: 403 });
    }

    const { title, content, coverImage, category, tags } = await req.json();

    // Recalculate word count and reading time
    const words = countWordsFromTipTapJSON(content);
    const readingTime = Math.max(1, Math.round(words / 200));

    // Slug generation
    const slugBase = (title || pub.title).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    let slug = pub.slug;
    
    // If title changed, update slug
    if (title && title !== pub.title) {
      slug = `${slugBase}-${Date.now().toString().slice(-4)}`;
      // Check collision
      const collision = await db.publication.findFirst({
        where: { slug, id: { not: pub.id } }
      });
      if (collision) {
        slug = `${slugBase}-${Math.random().toString(36).substr(2, 5)}`;
      }
    }

    const updatedPub = await db.publication.update({
      where: { id },
      data: {
        title: title || pub.title,
        slug,
        content: content || pub.content,
        coverImage: coverImage !== undefined ? coverImage : pub.coverImage,
        category: category || pub.category,
        tags: tags || pub.tags,
        readingTime
      }
    });

    return NextResponse.json({ success: true, publication: updatedPub });
  } catch (error: any) {
    console.error('Auto-save error:', error);
    return NextResponse.json({ error: 'Failed to save publication' }, { status: 500 });
  }
}
