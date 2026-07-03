// src/app/(main)/profile/[username]/page.tsx
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { PublicationStatus } from '@prisma/client';
import ProfileHeaderActions from '@/components/profile/ProfileHeaderActions';

export default async function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const session = await getServerSession(authOptions);
  const resolvedParams = await params;
  
  const user = await db.user.findUnique({
    where: { username: resolvedParams.username.toLowerCase() },
    include: {
      publications: {
        orderBy: { updatedAt: 'desc' }
      }
    }
  });

  if (!user) {
    notFound();
  }

  const isOwnProfile = !!(session?.user && (session.user as any).id === user.id);

  const published = user.publications.filter(p => p.status === PublicationStatus.PUBLISHED);
  const drafts = user.publications.filter(p => p.status === PublicationStatus.DRAFT || p.status === PublicationStatus.REJECTED);
  const pending = user.publications.filter(p => p.status === PublicationStatus.PENDING);

  return (
    <div className="max-w-4xl mx-auto py-8">
      {/* Editorial Profile Header */}
      <div className="flex flex-col-reverse md:flex-row gap-8 items-start justify-between mb-12 border-b border-gray-200/80 dark:border-neutral-800 pb-12">
        <div className="flex-grow max-w-2xl">
          <div className="flex flex-col md:flex-row md:items-center gap-4 justify-start mb-2">
            <h1 className="font-serif text-4xl md:text-5xl text-black dark:text-white font-bold leading-tight">{user.name}</h1>
            <span className="inline-block px-2.5 py-0.5 bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-neutral-300 border border-gray-200 dark:border-neutral-700 text-[10px] uppercase font-bold rounded self-start md:self-center">
              {user.role}
            </span>
          </div>
          <p className="text-gray-500 dark:text-neutral-500 text-sm font-medium">@{user.username}</p>
          <p className="text-gray-800 dark:text-neutral-300 font-serif text-lg md:text-xl italic mt-6 leading-relaxed">
            "{user.bio || 'Reading is dreaming with open eyes.'}"
          </p>
          <div className="flex items-center gap-6 mt-8">
            <div className="text-xs text-gray-500 dark:text-neutral-500 uppercase tracking-wider font-semibold">
              Member since: {new Date(user.createdAt).toLocaleDateString(undefined, {
                month: 'long',
                year: 'numeric'
              })}
            </div>
            
            <ProfileHeaderActions
              isOwnProfile={isOwnProfile}
              currentUser={{
                name: user.name,
                username: user.username,
                bio: user.bio,
                profilePhoto: user.profilePhoto
              }}
            />
          </div>
        </div>

        <div className="flex-shrink-0 relative">
          <img
            src={user.profilePhoto && user.profilePhoto.trim() !== "" ? user.profilePhoto : `https://api.dicebear.com/7.x/initials/svg?seed=${user.name}`}
            alt={user.name}
            className="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover shadow-md border-4 border-white dark:border-[#0a0a0a]"
          />
        </div>
      </div>

      {/* Publications segment */}
      <div className="space-y-12">
        <section>
          <h2 className="font-serif text-3xl text-black dark:text-white font-bold border-b-2 border-black dark:border-white pb-4 mb-8">
            {isOwnProfile ? 'My Catalog' : 'Published Works'}
          </h2>

          {published.length > 0 ? (
            <div className="flex flex-col gap-10">
              {published.map(pub => (
                <article
                  key={pub.id}
                  className="group flex flex-col md:flex-row gap-6 md:gap-8 items-start justify-between border-b border-gray-200 dark:border-neutral-800 pb-10 last:border-0"
                >
                  <div className="flex flex-col flex-grow order-2 md:order-1">
                    <div className="mb-3">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-violet-600 dark:text-cyan-400 bg-violet-50 dark:bg-cyan-950/30 px-2 py-1 rounded">
                        {pub.category}
                      </span>
                    </div>
                    <h3 className="font-serif text-2xl font-bold text-black dark:text-white mb-3 leading-tight group-hover:text-violet-600 dark:group-hover:text-cyan-400 transition-colors">
                      <Link href={`/publications/${pub.slug}`}>{pub.title}</Link>
                    </h3>
                    <p className="text-gray-600 dark:text-neutral-400 text-sm md:text-base line-clamp-2 mb-4 leading-relaxed">
                      {'Read the full publication to discover more insights and perspectives.'}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-neutral-500 font-medium uppercase tracking-wide mt-auto">
                      <span>
                        {new Date(pub.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </span>
                      <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-neutral-600"></span>
                      <span>{pub.readingTime} min read</span>
                    </div>
                  </div>
                  
                  <Link href={`/publications/${pub.slug}`} className="block relative w-full md:w-48 lg:w-56 aspect-[3/2] overflow-hidden rounded-lg order-1 md:order-2 flex-shrink-0 border border-gray-100 dark:border-neutral-800">
                    <img
                      src={pub.coverImage || 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=800&h=450&fit=crop'}
                      alt={pub.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-700 ease-out"
                    />
                  </Link>
                </article>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center border border-dashed border-gray-300 dark:border-neutral-800 rounded-xl">
              <p className="text-gray-500 dark:text-neutral-500 font-serif italic text-lg">No published works cataloged yet.</p>
            </div>
          )}
        </section>

        {/* Private Dashboard Section for Owner */}
        {isOwnProfile && (
          <section className="pt-12 border-t-2 border-dashed border-gray-200 dark:border-neutral-800">
            <h2 className="font-serif text-2xl text-black dark:text-white font-bold mb-8">Workspace Status</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              {/* Drafts */}
              <div>
                <div className="flex items-center justify-between mb-5">
                  <h3 className="font-sans text-sm font-bold text-gray-500 dark:text-neutral-400 uppercase tracking-widest">Active Drafts</h3>
                  <span className="bg-gray-100 dark:bg-neutral-800 text-gray-800 dark:text-neutral-300 text-xs font-bold px-2.5 py-0.5 rounded-full">{drafts.length}</span>
                </div>
                {drafts.length > 0 ? (
                  <ul className="divide-y divide-gray-100 dark:divide-neutral-800 border-y border-gray-100 dark:border-neutral-800">
                    {drafts.map(d => (
                      <li key={d.id} className="py-4 flex justify-between items-center group">
                        <div className="flex flex-col max-w-[75%] pr-4">
                          <span className="text-base font-semibold text-gray-900 dark:text-gray-100 truncate group-hover:text-black dark:group-hover:text-white transition-colors">{d.title}</span>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-yellow-500"></span>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-neutral-500">Draft</span>
                            {d.status === 'REJECTED' && (
                              <>
                                <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-neutral-700"></span>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-red-500">Changes Req</span>
                              </>
                            )}
                          </div>
                        </div>
                        <Link
                          href={`/workspace/editor/${d.id}`}
                          className="flex-shrink-0 text-[11px] font-bold uppercase tracking-wider text-black dark:text-white hover:text-violet-600 dark:hover:text-cyan-400 py-1.5 px-3 rounded bg-gray-50 dark:bg-neutral-800/50 hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
                        >
                          Continue
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-400 dark:text-neutral-600 italic py-4">No drafts in progress.</p>
                )}
              </div>

              {/* Pending reviews */}
              <div>
                <div className="flex items-center justify-between mb-5">
                  <h3 className="font-sans text-sm font-bold text-gray-500 dark:text-neutral-400 uppercase tracking-widest">Pending Review</h3>
                  <span className="bg-gray-100 dark:bg-neutral-800 text-gray-800 dark:text-neutral-300 text-xs font-bold px-2.5 py-0.5 rounded-full">{pending.length}</span>
                </div>
                {pending.length > 0 ? (
                  <ul className="divide-y divide-gray-100 dark:divide-neutral-800 border-y border-gray-100 dark:border-neutral-800">
                    {pending.map(p => (
                      <li key={p.id} className="py-4 flex justify-between items-center">
                        <div className="flex flex-col max-w-[75%] pr-4">
                          <span className="text-base font-semibold text-gray-900 dark:text-gray-100 truncate">{p.title}</span>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-500"></span>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-neutral-500">In Queue</span>
                          </div>
                        </div>
                        <span className="flex-shrink-0 text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-neutral-500 py-1.5 px-3 rounded bg-gray-50 dark:bg-neutral-800/30">
                          Locked
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-400 dark:text-neutral-600 italic py-4">No pieces waiting for review.</p>
                )}
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
