'use client';

import { useState } from 'react';
import Link from 'next/link';
import EditProfileModal from './EditProfileModal';

interface ProfileHeaderActionsProps {
  isOwnProfile: boolean;
  currentUser: {
    name: string;
    username: string;
    bio: string | null;
    profilePhoto: string | null;
  };
}

export default function ProfileHeaderActions({ isOwnProfile, currentUser }: ProfileHeaderActionsProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!isOwnProfile) return null;

  return (
    <div className="flex items-center gap-3">
      <Link
        href="/workspace"
        className="py-1.5 px-4 bg-gray-100 hover:bg-gray-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-gray-800 dark:text-neutral-200 text-xs font-bold rounded-full transition shadow-sm"
      >
        Write Dashboard
      </Link>
      
      <button
        onClick={() => setIsOpen(true)}
        className="py-1.5 px-4 bg-black hover:bg-gray-900 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-black text-xs font-bold rounded-full transition shadow-sm"
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
