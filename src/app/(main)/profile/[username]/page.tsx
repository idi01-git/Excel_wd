import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { PublicationStatus } from '@prisma/client';
import ProfileHeaderActions from '@/components/profile/ProfileHeaderActions';
import ProfileSocialLinks from '@/components/profile/ProfileSocialLinks';
import AuthorCatalogue from '@/components/profile/AuthorCatalogue';
import WorkspaceDashboard from '@/components/profile/WorkspaceDashboard';
import { FadeUp, RevealWords } from '@/components/home/primitives';
import { formatRole } from '@/lib/rbac';
import { getOptimizedAvatarUrl } from '@/lib/image-optimization';

export default async function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const session = await getServerSession(authOptions);
  const resolvedParams = await params;
  
  const user = await db.user.findUnique({
    where: { username: resolvedParams.username.toLowerCase() },
    include: {
      alumniProfile: true,
      publications: {
        where: { alumniProfileId: null },
        include: {
          _count: { select: { interactions: true, comments: true } }
        },
        orderBy: { updatedAt: 'desc' }
      },
      bookReviews: {
        include: {
          book: true
        },
        orderBy: { createdAt: 'desc' }
      },
      comments: {
        where: { isDeleted: false },
        include: {
          publication: true,
          editorShelf: true
        },
        orderBy: { createdAt: 'desc' }
      }
    }
  });

  if (!user) {
    notFound();
  }

  const isOwnProfile = !!(session?.user && (session.user as any).id === user.id);
  const currentUserId = (session?.user as any)?.id;

  let isFollowing = false;
  if (currentUserId && !isOwnProfile) {
    const followRecord = await db.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: currentUserId,
          followingId: user.id
        }
      }
    });
    isFollowing = !!followRecord;
  }

  const [followersCount, followingCount] = await Promise.all([
    db.follow.count({ where: { followingId: user.id } }),
    db.follow.count({ where: { followerId: user.id } }),
  ]);

  // Fetch Liked Publications
  const likedInteractions = await db.interaction.findMany({
    where: { userId: user.id, type: 'LIKE' },
    include: {
      publication: {
        include: {
          author: true,
          _count: { select: { interactions: true, comments: true } }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
  const liked = likedInteractions.map(i => i.publication).filter(Boolean);

  let bookmarks: any[] = [];
  if (isOwnProfile) {
    const bookmarkedInteractions = await db.interaction.findMany({
      where: { userId: user.id, type: 'BOOKMARK' },
      include: {
        publication: {
          include: {
            author: true,
            _count: { select: { interactions: true, comments: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    bookmarks = bookmarkedInteractions.map(i => i.publication).filter(Boolean);
  }

  const published = user.publications.filter(p => p.status === PublicationStatus.PUBLISHED);
  const drafts = user.publications.filter(p => p.status === PublicationStatus.DRAFT || p.status === PublicationStatus.REJECTED);
  const pending = user.publications.filter(p => p.status === PublicationStatus.PENDING);

  // Shorthand Batch string formatting (e.g. Batch: CSE-SF 28')
  // Only display for internal campus students & alumni with branch/batch records (hidden for external visitors)
  const rawBranch = (user.alumniProfile?.branch || user.branch || '').toUpperCase().trim();
  const rawBatch = (user.alumniProfile?.batch || user.batch || '').trim();

  let batchDisplay: string | null = null;
  if (rawBranch || rawBatch) {
    const branchMap: Record<string, string> = {
      'CSE-SF': 'CSE-SF',
      'CSE-AI': 'CSE-AI',
      'CSE-R': 'CSE-R',
      'COMPUTER SCIENCE ENGINEERING SF (CSE-SF)': 'CSE-SF',
      'COMPUTER SCIENCE ENGINEERING AI (CSE-AI)': 'CSE-AI',
      'COMPUTER SCIENCE ENGINEERING REGULAR (CSE-R)': 'CSE-R',
      'COMPUTER SCIENCE & ENGINEERING': 'CSE-R',
      'COMPUTER SCIENCE': 'CSE-R',
      'CSE': 'CSE-R',
      'ELECTRONICS AND COMMUNICATION ENGINEERING (ECE)': 'ECE',
      'ELECTRONICS & COMMUNICATION ENGINEERING': 'ECE',
      'ELECTRONICS': 'ECE',
      'ECE': 'ECE',
      'ELECTRICAL ENGINEERING (EE)': 'EE',
      'ELECTRICAL ENGINEERING': 'EE',
      'ELECTRICAL': 'EE',
      'EE': 'EE',
      'MECHANICAL ENGINEERING (ME)': 'ME',
      'MECHANICAL ENGINEERING': 'ME',
      'MECHANICAL': 'ME',
      'ME': 'ME',
      'CIVIL ENGINEERING (CE)': 'CE',
      'CIVIL ENGINEERING': 'CE',
      'CIVIL': 'CE',
      'CE': 'CE',
      'CHEMICAL ENGINEERING (CHE)': 'CHE',
      'CHEMICAL ENGINEERING': 'CHE',
      'CHEMICAL': 'CHE',
      'CHE': 'CHE',
      'MASTER IN COMPUTER APPLICATION (MCA)': 'MCA',
      'MASTER IN COMPUTER APPLICATION': 'MCA',
      'MCA': 'MCA',
      'MASTER IN BUSINESS ADMINISTRATION (MBA)': 'MBA',
      'MASTER IN BUSINESS ADMINISTRATION': 'MBA',
      'MBA': 'MBA',
      'BIOTECHNOLOGY': 'BT',
      'BIOTECH': 'BT',
    };
    const branch = branchMap[rawBranch] || rawBranch;

    let passoutYear = '';
    if (rawBatch) {
      const match = rawBatch.match(/(\d{2,4})$/);
      if (match) {
        passoutYear = ` ${match[1].slice(-2)}'`;
      } else {
        passoutYear = ` ${rawBatch}`;
      }
    }
    batchDisplay = branch ? `Batch: ${branch}${passoutYear}` : `Batch: ${rawBatch}`;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8 py-6 sm:py-10">
      {/* Editorial Profile Header */}
      <div className="mb-6 sm:mb-8 border-b border-gray-200/80 dark:border-neutral-800 pb-5 sm:pb-7">
        {/* Top Section: Balanced Profile Picture + Responsive Name & Metrics in 2 Clean Rows */}
        <FadeUp delay={0.05} y={16}>
          <div className="flex flex-row items-center gap-3.5 sm:gap-6 md:gap-8">
            {/* Balanced Profile Avatar (15% scaled down) */}
            <div className="shrink-0 relative">
              <img
                src={user.profilePhoto && user.profilePhoto.trim() !== "" ? getOptimizedAvatarUrl(user.profilePhoto, 320) : `https://api.dicebear.com/7.x/initials/svg?seed=${user.name}`}
                alt={user.name}
                className="w-28 h-28 sm:w-32 sm:h-32 md:w-36 md:h-36 lg:w-40 lg:h-40 rounded-full object-cover shadow-md border-4 border-white dark:border-[#0a0a0a]"
              />
            </div>

            {/* Identity & Metrics in exactly 2 rows */}
            <div className="grow min-w-0 flex-col justify-center gap-1 sm:gap-2">
              {/* Row 1: Responsive Fluid Name & Role Badge */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
                <h1 className="font-serif text-[clamp(1.6rem,5.5vw,3.25rem)] text-black dark:text-white font-bold leading-[1.08] tracking-tight wrap-break-word">
                  {user.name}
                </h1>
                <span className="inline-block px-2.5 py-0.5 bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-neutral-300 border border-gray-200 dark:border-neutral-700 text-[10px] uppercase font-bold rounded shrink-0">
                  {formatRole(user.role, user)}
                </span>
              </div>

              {/* Row 2: @handle • Followers • Following */}
              <div className="flex flex-wrap items-center gap-x-2.5 sm:gap-x-3 gap-y-0.5 text-xs sm:text-sm font-medium text-gray-500 dark:text-neutral-400">
                <span className="text-gray-700 dark:text-neutral-300 font-semibold">@{user.username}</span>
                <span className="text-gray-300 dark:text-neutral-700">•</span>
                <span><strong className="text-black dark:text-white font-bold">{followersCount}</strong> Followers</span>
                <span className="text-gray-300 dark:text-neutral-700">•</span>
                <span><strong className="text-black dark:text-white font-bold">{followingCount}</strong> Following</span>
              </div>
            </div>
          </div>
        </FadeUp>

        {/* Bio Quote */}
        <FadeUp delay={0.12} y={12}>
          <p className="text-gray-800 dark:text-neutral-300 font-serif text-base sm:text-lg md:text-xl italic mt-4 sm:mt-5 leading-relaxed">
            "{user.bio || 'Reading is dreaming with open eyes.'}"
          </p>

          {/* Batch Indicator placed just below bio (rendered only for campus students & alumni) */}
          {batchDisplay && (
            <div className="mt-2.5 sm:mt-3">
              <span className="inline-block text-[11px] sm:text-xs font-semibold text-gray-600 dark:text-neutral-400 bg-gray-100 dark:bg-neutral-800/80 px-2.5 py-1 rounded-full border border-gray-200/60 dark:border-neutral-700/60">
                {batchDisplay}
              </span>
            </div>
          )}
        </FadeUp>

        {/* Action Row: Social Media Icons on Left, Action Buttons on Right (Compact & Tight) */}
        <FadeUp delay={0.18} y={12}>
          <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4 mt-4 sm:mt-5">
            {/* Social Media Links with Verified Auto-Formatting & Privacy Toggles */}
            <ProfileSocialLinks
              socialLinks={user.socialLinks}
              showSocialLinks={user.showSocialLinks}
              email={user.email}
              instagram={user.alumniProfile?.instagram}
              linkedin={user.alumniProfile?.linkedin}
            />
            
            <ProfileHeaderActions
              isOwnProfile={isOwnProfile}
              targetUserId={user.id}
              initialIsFollowing={isFollowing}
              currentUser={{
                name: user.name,
                username: user.username,
                bio: user.bio,
                profilePhoto: user.profilePhoto,
                socialLinks: user.socialLinks,
                showSocialLinks: user.showSocialLinks,
                email: user.email,
              }}
            />
          </div>
        </FadeUp>
      </div>

      {/* Publications segment */}
      <FadeUp delay={0.22} y={16}>
        <div className="space-y-10 sm:space-y-12">
          <AuthorCatalogue 
            initialPublications={published} 
            bookReviews={user.bookReviews}
            comments={user.comments}
            liked={liked}
            bookmarks={bookmarks}
            isOwnProfile={isOwnProfile} 
          />

          {/* Private Dashboard Section for Owner */}
          {isOwnProfile && (
            <WorkspaceDashboard drafts={drafts} pending={pending} />
          )}
        </div>
      </FadeUp>
    </div>
  );
}
