// src/components/social/FollowButton.tsx
'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface FollowButtonProps {
  targetUserId: string;
}

export default function FollowButton({ targetUserId }: FollowButtonProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [following, setFollowing] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  const currentUser = session?.user;
  const isSelf = currentUser ? currentUser.id === targetUserId : false;

  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    // Check if following
    const checkFollowing = async () => {
      try {
        const res = await fetch(`/api/users/${currentUser.id}/following`);
        const data = await res.json();
        if (data.success && Array.isArray(data.list)) {
          const isFollowing = data.list.some((u: any) => u.id === targetUserId);
          setFollowing(isFollowing);
        }
      } catch (error) {
        console.error('Failed checking follow status:', error);
      } finally {
        setLoading(false);
      }
    };

    checkFollowing();
  }, [targetUserId, currentUser]);

  const handleFollowToggle = async () => {
    if (!session) {
      router.push('/login');
      return;
    }

    setLoading(true);
    const method = following ? 'DELETE' : 'POST';

    try {
      const res = await fetch(`/api/users/${targetUserId}/follow`, {
        method
      });
      const data = await res.json();
      if (data.success) {
        setFollowing(!following);
      } else {
        alert(data.error || 'Failed to toggle follow status');
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
    } finally {
      setLoading(false);
    }
  };

  if (isSelf || !currentUser) return null;

  return (
    <button
      onClick={handleFollowToggle}
      disabled={loading}
      className={`py-1.5 px-4 rounded-full text-xs font-semibold tracking-wide transition duration-300 border flex items-center gap-1.5 ${
        following
          ? 'bg-violet-600/10 text-violet-400 border-violet-500/20 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20'
          : 'bg-linear-to-r from-violet-600 to-indigo-600 text-white border-transparent hover:shadow-lg hover:shadow-indigo-500/20'
      }`}
    >
      {loading ? (
        <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
      ) : following ? (
        <>
          <span> Following</span>
        </>
      ) : (
        <>
          <span>+ Follow</span>
        </>
      )}
    </button>
  );
}
