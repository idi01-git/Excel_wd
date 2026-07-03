// src/app/(main)/profile/page.tsx
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';

export default async function OwnProfileRedirectPage() {
  const session = await getServerSession(authOptions);
  if (session?.user?.id) {
    const user = await db.user.findUnique({
      where: { id: (session.user as any).id },
      select: { username: true }
    });
    if (user) {
      redirect(`/profile/${user.username}`);
    }
  }
  redirect('/login');
}
