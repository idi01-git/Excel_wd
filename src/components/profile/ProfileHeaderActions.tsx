'use client';

import { useState } from 'react';
import Link from 'next/link';
import { UserPlus, UserCheck, Share2, Check } from 'lucide-react';
import EditProfileModal from './EditProfileModal';

interface ProfileHeaderActionsProps {
  isOwnProfile: boolean;
  targetUserId?: string;
  initialIsFollowing?: boolean;
  onFollowChange?: (isFollowing: boolean) => void;
  currentUser: {
    name: string;
    username: string;
    bio: string | null;
    profilePhoto: string | null;
    socialLinks?: any;
    showSocialLinks?: boolean;
    email?: string;
  };
}

export default function ProfileHeaderActions({
  isOwnProfile,
  targetUserId,
  initialIsFollowing = false,
  onFollowChange,
  currentUser,
}: ProfileHeaderActionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleFollowToggle = async () => {
    if (!targetUserId || loading) return;

    const nextState = !isFollowing;
    setIsFollowing(nextState);
    if (onFollowChange) onFollowChange(nextState);

    setLoading(true);
    try {
      const method = nextState ? 'POST' : 'DELETE';
      const res = await fetch(`/api/users/${targetUserId}/follow`, { method });
      if (!res.ok) {
        // Rollback
        setIsFollowing(!nextState);
        if (onFollowChange) onFollowChange(!nextState);
      }
    } catch (err) {
      console.error('Follow toggle failed:', err);
      setIsFollowing(!nextState);
      if (onFollowChange) onFollowChange(!nextState);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (isOwnProfile) {
    return (
      <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
        <Link
          href="/workspace"
          className="py-1.5 px-3.5 sm:px-4 bg-gray-100 hover:bg-gray-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-gray-800 dark:text-neutral-200 text-xs font-bold rounded-full transition shadow-xs whitespace-nowrap"
        >
          Write Dashboard
        </Link>
        
        <button
          onClick={() => setIsOpen(true)}
          className="py-1.5 px-3.5 sm:px-4 bg-black hover:bg-gray-900 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-black text-xs font-bold rounded-full transition shadow-xs whitespace-nowrap cursor-pointer"
        >
          Edit Profile
        </button>

        <EditProfileModal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          currentUser={currentUser}
        />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
      <button
        onClick={handleFollowToggle}
        disabled={loading}
        className={`py-1.5 px-4 sm:px-5 text-xs font-bold rounded-full transition shadow-xs flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
          isFollowing
            ? 'bg-gray-100 hover:bg-red-50 hover:text-red-600 dark:bg-neutral-800 dark:hover:bg-red-950/30 dark:hover:text-red-400 text-gray-800 dark:text-neutral-200 border border-gray-200/80 dark:border-neutral-700'
            : 'bg-black hover:bg-gray-900 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-black'
        }`}
      >
        {isFollowing ? (
          <>
            <UserCheck size={14} />
            <span>Following</span>
          </>
        ) : (
          <>
            <UserPlus size={14} />
            <span>Follow</span>
          </>
        )}
      </button>

      <button
        onClick={handleShare}
        className="py-1.5 px-3 bg-gray-100 hover:bg-gray-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-gray-700 dark:text-neutral-300 text-xs font-bold rounded-full transition shadow-xs flex items-center gap-1 cursor-pointer"
        title="Share Profile"
      >
        {copied ? <Check size={13} className="text-emerald-500" /> : <Share2 size={13} />}
      </button>
    </div>
  );
}
