// src/app/api/workspace/drafts/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { PublicationStatus, PublicationCategory } from '@prisma/client';

// Helper: Ensure user is authorized
async function checkAuth() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return null;
  }
  return session.user;
}

export async function GET(req: Request) {
  try {
    const user = await checkAuth();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const publications = await db.publication.findMany({
      where: {
        authorId: user.id,
        alumniProfileId: null, // Don't show in coordinator's personal workspace if written for alumni
      },
      orderBy: { updatedAt: 'desc' }
    });

    return NextResponse.json({ success: true, publications });
  } catch (error: any) {
    console.error('Fetch drafts error:', error);
    return NextResponse.json({ error: 'Failed to fetch workspace items' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await checkAuth();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Default empty TipTap document JSON
    const emptyContent = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: []
        }
      ]
    };

    const count = await db.publication.count({ where: { authorId: user.id } });
    const draftTitle = `Untitled Draft #${count + 1}`;
    
    // Base slug helper
    const slugBase = draftTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const slug = `${slugBase}-${Date.now().toString().slice(-4)}`;

    const newPub = await db.publication.create({
      data: {
        title: draftTitle,
        slug,
        category: PublicationCategory.STORY,
        status: PublicationStatus.DRAFT,
        content: emptyContent,
        authorId: user.id,
        readingTime: 1
      }
    });

    return NextResponse.json({ success: true, id: newPub.id });
  } catch (error: any) {
    console.error('Create draft error:', error);
    return NextResponse.json({ error: 'Failed to create workspace item' }, { status: 500 });
  }
}
