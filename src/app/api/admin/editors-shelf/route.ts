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

    // Slug generation
    const slugBase = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    let slug = `${slugBase}-${Date.now().toString().slice(-4)}`;

    // Collision check
    const collision = await db.editorShelfItem.findUnique({
      where: { slug }
    });

    if (collision) {
      slug = `${slugBase}-${Math.random().toString(36).substr(2, 5)}`;
    }

    const item = await db.editorShelfItem.create({
      data: {
        title,
        author,
        coverImage: coverImage || null,
        editorialNote,
        genre: Array.isArray(genre) ? genre : [genre],
        slug
      }
    });

    return NextResponse.json({ success: true, item });
  } catch (error: any) {
    console.error('Create shelf item error:', error);
    return NextResponse.json({ error: 'Failed to create curated item' }, { status: 500 });
  }
}
