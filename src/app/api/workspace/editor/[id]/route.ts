// src/app/api/workspace/editor/[id]/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { PublicationStatus } from '@prisma/client';
import { hasPermission } from '@/lib/rbac';

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
      where: { id },
      include: {
        alumniProfile: {
          select: {
            id: true,
            name: true,
            batch: true,
            branch: true,
            photo: true,
          }
        }
      }
    });

    if (!pub) {
      return NextResponse.json({ error: 'Publication not found' }, { status: 404 });
    }

    const canModerate = hasPermission(user.role, 'MODERATE_PUBLICATIONS');
    if (pub.authorId !== user.id && !canModerate) {
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

    const canModerate = hasPermission(user.role, 'MODERATE_PUBLICATIONS');
    if (pub.authorId !== user.id && !canModerate) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Locked check: only block if not an editorial moderator
    if (!canModerate && (pub.status === PublicationStatus.PENDING || pub.status === PublicationStatus.PUBLISHED)) {
      return NextResponse.json({ error: 'Locked: Publication is currently under review or published' }, { status: 403 });
    }

    const {
      title,
      content,
      coverImage,
      category,
      tags,
      language,
      authorName,
      authorNote,
      alumniProfileId
    } = await req.json();

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

    // Handle byline permissions & validation
    const canCustomizeByline = hasPermission(user.role, 'MODERATE_PUBLICATIONS');
    let finalAuthorName = pub.authorName;
    let finalAuthorNote = pub.authorNote;
    let finalAlumniProfileId = pub.alumniProfileId;

    if (canCustomizeByline) {
      if (authorName !== undefined) {
        finalAuthorName = authorName && typeof authorName === 'string' && authorName.trim() !== '' ? authorName.trim() : null;
      }
      if (authorNote !== undefined) {
        finalAuthorNote = authorNote && typeof authorNote === 'string' && authorNote.trim() !== '' ? authorNote.trim() : null;
      }
      if (alumniProfileId !== undefined) {
        if (alumniProfileId && typeof alumniProfileId === 'string' && alumniProfileId.trim() !== '') {
          const exists = await db.alumniProfile.findUnique({
            where: { id: alumniProfileId.trim() },
            select: { id: true, name: true }
          });
          if (exists) {
            finalAlumniProfileId = exists.id;
            if (!finalAuthorName) {
              finalAuthorName = exists.name;
            }
          } else {
            finalAlumniProfileId = null;
          }
        } else {
          finalAlumniProfileId = null;
        }
      }
    }

    const nextCover = coverImage !== undefined ? (coverImage ? String(coverImage).trim() : null) : pub.coverImage;
    if (nextCover !== pub.coverImage && pub.coverImage) {
      const { deleteImageByUrl } = await import('@/lib/cloudinary');
      await deleteImageByUrl(pub.coverImage);
    }

    let finalTags = pub.tags;
    if (tags !== undefined && Array.isArray(tags)) {
      finalTags = tags
        .map((t: any) => typeof t === 'string' ? t.trim().replace(/^#/, '') : '')
        .filter((t: string) => t.length > 0)
        .slice(0, 3);
    }

    const updatedPub = await db.publication.update({
      where: { id },
      data: {
        title: title || pub.title,
        slug,
        content: content || pub.content,
        coverImage: nextCover,
        category: category || pub.category,
        language: language || pub.language,
        tags: finalTags,
        readingTime,
        authorName: finalAuthorName,
        authorNote: finalAuthorNote,
        alumniProfileId: finalAlumniProfileId,
      },
      include: {
        alumniProfile: {
          select: {
            id: true,
            name: true,
            batch: true,
            branch: true,
            photo: true,
          }
        }
      }
    });

    return NextResponse.json({ success: true, publication: updatedPub });
  } catch (error: any) {
    console.error('Auto-save error:', error);
    return NextResponse.json({ error: 'Failed to save publication' }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await checkAuth();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const pub = await db.publication.findUnique({
      where: { id },
      include: {
        author: { select: { id: true, name: true, username: true } },
      },
    });

    if (!pub) {
      return NextResponse.json({ error: 'Publication not found' }, { status: 404 });
    }

    const canModerate = hasPermission(user.role, 'MODERATE_PUBLICATIONS');
    if (pub.authorId !== user.id && !canModerate) {
      return NextResponse.json({ error: 'Unauthorized to delete this publication' }, { status: 403 });
    }

    // 1. Delete cover image from Cloudinary if present
    if (pub.coverImage) {
      try {
        const { deleteImageByUrl } = await import('@/lib/cloudinary');
        await deleteImageByUrl(pub.coverImage);
      } catch (imgErr) {
        console.error('Failed to delete cover image on publication deletion:', imgErr);
      }
    }

    // 2. Cascade delete dependent records in a transaction
    await db.$transaction(async (tx) => {
      // Delete comments & votes
      const comments = await tx.comment.findMany({
        where: { publicationId: pub.id },
        select: { id: true }
      });
      const commentIds = comments.map((c) => c.id);

      if (commentIds.length > 0) {
        await tx.commentUpvote.deleteMany({ where: { commentId: { in: commentIds } } });
        await tx.commentDownvote.deleteMany({ where: { commentId: { in: commentIds } } });
        await tx.comment.deleteMany({ where: { publicationId: pub.id } });
      }

      // Delete interactions (likes, bookmarks, dislikes)
      await tx.interaction.deleteMany({ where: { publicationId: pub.id } });

      // Delete associated notifications
      await tx.notification.deleteMany({
        where: {
          entityType: 'PUBLICATION',
          entityId: pub.id
        }
      });

      // Delete publication
      await tx.publication.delete({ where: { id: pub.id } });

      // Record audit log
      await tx.auditLog.create({
        data: {
          actorId: user.id,
          action: 'DELETE_PUBLICATION',
          target: pub.title,
          entityType: 'PUBLICATION',
          entityId: pub.id,
          meta: {
            title: pub.title,
            slug: pub.slug,
            authorId: pub.authorId,
            authorName: pub.author.name,
            deletedByRole: user.role,
            alumniProfileId: pub.alumniProfileId,
            status: pub.status,
          }
        }
      });
    });

    return NextResponse.json({ success: true, message: 'Publication deleted successfully' });
  } catch (error: any) {
    console.error('Delete publication error:', error);
    return NextResponse.json({ error: 'Failed to delete publication' }, { status: 500 });
  }
}
