import { InteractionType } from '@prisma/client';
import { db } from './db';

export async function resolvePublicationReference(reference: string) {
  return db.publication.findFirst({
    where: {
      OR: [{ slug: reference }, { id: reference }]
    },
    select: {
      id: true,
      slug: true,
      authorId: true
    }
  });
}

export async function togglePublicationInteraction(params: {
  publicationReference: string;
  userId: string;
  type: InteractionType;
}) {
  const publication = await resolvePublicationReference(params.publicationReference);

  if (!publication) {
    return null;
  }

  const result = await db.$transaction(async (tx) => {
    if (params.type === InteractionType.LIKE) {
      await tx.interaction.deleteMany({
        where: {
          userId: params.userId,
          publicationId: publication.id,
          type: InteractionType.DISLIKE
        }
      });

      const existingLike = await tx.interaction.findUnique({
        where: {
          userId_publicationId_type: {
            userId: params.userId,
            publicationId: publication.id,
            type: InteractionType.LIKE
          }
        }
      });

      if (existingLike) {
        await tx.interaction.delete({
          where: { id: existingLike.id }
        });
        return { active: false };
      }

      await tx.interaction.create({
        data: {
          userId: params.userId,
          publicationId: publication.id,
          type: InteractionType.LIKE
        }
      });
      return { active: true };
    }

    if (params.type === InteractionType.DISLIKE) {
      await tx.interaction.deleteMany({
        where: {
          userId: params.userId,
          publicationId: publication.id,
          type: InteractionType.LIKE
        }
      });

      const existingDislike = await tx.interaction.findUnique({
        where: {
          userId_publicationId_type: {
            userId: params.userId,
            publicationId: publication.id,
            type: InteractionType.DISLIKE
          }
        }
      });

      if (existingDislike) {
        await tx.interaction.delete({
          where: { id: existingDislike.id }
        });
        return { active: false };
      }

      await tx.interaction.create({
        data: {
          userId: params.userId,
          publicationId: publication.id,
          type: InteractionType.DISLIKE
        }
      });
      return { active: true };
    }

    const existingBookmark = await tx.interaction.findUnique({
      where: {
        userId_publicationId_type: {
          userId: params.userId,
          publicationId: publication.id,
          type: InteractionType.BOOKMARK
        }
      }
    });

    if (existingBookmark) {
      await tx.interaction.delete({
        where: { id: existingBookmark.id }
      });
      return { active: false };
    }

    await tx.interaction.create({
      data: {
        userId: params.userId,
        publicationId: publication.id,
        type: InteractionType.BOOKMARK
      }
    });
    return { active: true };
  });

  const [likes, dislikes, bookmarks] = await Promise.all([
    db.interaction.count({
      where: { publicationId: publication.id, type: InteractionType.LIKE }
    }),
    db.interaction.count({
      where: { publicationId: publication.id, type: InteractionType.DISLIKE }
    }),
    db.interaction.count({
      where: { publicationId: publication.id, type: InteractionType.BOOKMARK }
    })
  ]);

  return {
    publication,
    active: result.active,
    stats: {
      likes,
      dislikes,
      bookmarks
    }
  };
}

export async function toggleCommentVote(params: {
  commentId: string;
  userId: string;
  direction: 'upvote' | 'downvote';
}) {
  const comment = await db.comment.findUnique({
    where: { id: params.commentId },
    select: {
      id: true,
      upvotesCount: true,
      downvotesCount: true
    }
  });

  if (!comment) {
    return null;
  }

  const result = await db.$transaction(async (tx) => {
    if (params.direction === 'upvote') {
      const existingDownvote = await tx.commentDownvote.findUnique({
        where: {
          userId_commentId: {
            userId: params.userId,
            commentId: params.commentId
          }
        }
      });

      if (existingDownvote) {
        await tx.commentDownvote.delete({
          where: { id: existingDownvote.id }
        });
      }

      const existingUpvote = await tx.commentUpvote.findUnique({
        where: {
          userId_commentId: {
            userId: params.userId,
            commentId: params.commentId
          }
        }
      });

      if (existingUpvote) {
        await tx.commentUpvote.delete({
          where: { id: existingUpvote.id }
        });

        const updated = await tx.comment.update({
          where: { id: params.commentId },
          data: {
            upvotesCount: { decrement: 1 },
            downvotesCount: existingDownvote ? { decrement: 1 } : undefined
          }
        });

        return {
          active: false,
          upvotesCount: updated.upvotesCount,
          downvotesCount: updated.downvotesCount
        };
      }

      await tx.commentUpvote.create({
        data: {
          userId: params.userId,
          commentId: params.commentId
        }
      });

      const updated = await tx.comment.update({
        where: { id: params.commentId },
        data: {
          upvotesCount: { increment: 1 },
          downvotesCount: existingDownvote ? { decrement: 1 } : undefined
        }
      });

      return {
        active: true,
        upvotesCount: updated.upvotesCount,
        downvotesCount: updated.downvotesCount
      };
    }

    const existingUpvote = await tx.commentUpvote.findUnique({
      where: {
        userId_commentId: {
          userId: params.userId,
          commentId: params.commentId
        }
      }
    });

    if (existingUpvote) {
      await tx.commentUpvote.delete({
        where: { id: existingUpvote.id }
      });
    }

    const existingDownvote = await tx.commentDownvote.findUnique({
      where: {
        userId_commentId: {
          userId: params.userId,
          commentId: params.commentId
        }
      }
    });

    if (existingDownvote) {
      await tx.commentDownvote.delete({
        where: { id: existingDownvote.id }
      });

      const updated = await tx.comment.update({
        where: { id: params.commentId },
        data: {
          downvotesCount: { decrement: 1 },
          upvotesCount: existingUpvote ? { decrement: 1 } : undefined
        }
      });

      return {
        active: false,
        upvotesCount: updated.upvotesCount,
        downvotesCount: updated.downvotesCount
      };
    }

    await tx.commentDownvote.create({
      data: {
        userId: params.userId,
        commentId: params.commentId
      }
    });

    const updated = await tx.comment.update({
      where: { id: params.commentId },
      data: {
        downvotesCount: { increment: 1 },
        upvotesCount: existingUpvote ? { decrement: 1 } : undefined
      }
    });

    return {
      active: true,
      upvotesCount: updated.upvotesCount,
      downvotesCount: updated.downvotesCount
    };
  });

  return {
    ...result,
    score: result.upvotesCount - result.downvotesCount
  };
}
