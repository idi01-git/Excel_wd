// src/app/api/admin/editors-shelf/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const role = session?.user?.role;

    if (!session || (role !== 'MODERATOR' && role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Forbidden: Staff access only' }, { status: 403 });
    }

    const { title, author, coverImage, editorialNote, genre } = await req.json();

    if (!title || !author || !editorialNote) {
      return NextResponse.json({ error: 'Missing required parameters (title, author, note)' }, { status: 400 });
    }

    // No slug generation needed for Book, we use id

    const item = await db.book.create({
      data: {
        title,
        author,
        coverImage: coverImage || null,
        description: editorialNote, // Mapping editorial note to description temporarily or clubReview
        clubReview: editorialNote,
        genre: Array.isArray(genre) ? genre : [genre],
        editorPickType: req.headers.get('x-pick-type') || 'WEEK'
      }
    });

    return NextResponse.json({ success: true, item });
  } catch (error: any) {
    console.error('Create shelf item error:', error);
    return NextResponse.json({ error: 'Failed to create curated item' }, { status: 500 });
  }
}
