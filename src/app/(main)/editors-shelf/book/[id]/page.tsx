import { db } from '@/lib/db';
import { notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import BookDetailClient from './BookDetailClient';

export default async function BookDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const session = await getServerSession(authOptions);

  const book = await db.book.findUnique({
    where: { id: resolvedParams.id },
    include: {
      reviews: {
        include: {
          reviewer: true
        },
        orderBy: {
          upvotesCount: 'desc'
        }
      }
    }
  });

  if (!book) {
    notFound();
  }

  // Pass user info to client for interacting (reviewing, endorsing)
  const user = session?.user ? { id: (session.user as any).id, name: session.user.name, image: session.user.image } : null;

  return (
    <BookDetailClient 
      book={book} 
      reviews={book.reviews} 
      user={user} 
    />
  );
}
