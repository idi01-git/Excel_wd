// src/app/(main)/community/layout.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function CommunityLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const isActive = (path: string) => {
    return pathname === path;
  };

  return (
    <div className="w-full max-w-6xl mx-auto py-8 text-black">
      {/* Community Directory Title */}
      <div className="mb-8 border-b border-gray-150 pb-4">
        <h1 className="font-serif text-3xl text-black font-bold mb-1">Community Hub</h1>
        <p className="text-gray-500 text-sm">Meet authors, connect with alumni, explore club achievements, and browse library books.</p>
      </div>

      {/* Sub navigation Tabs (Uber pill style) */}
      <div className="flex flex-wrap gap-1 mb-8 bg-gray-50 p-1 border border-gray-200 rounded-full w-fit">
        <Link
          href="/community/members"
          className={`py-1.5 px-4.5 rounded-full text-xs font-semibold transition-all duration-200 ${
            isActive('/community/members')
              ? 'bg-black text-white shadow-sm'
              : 'text-gray-500 hover:text-black hover:bg-gray-100'
          }`}
        >
          Members
        </Link>
        <Link
          href="/community/alumni"
          className={`py-1.5 px-4.5 rounded-full text-xs font-semibold transition-all duration-200 ${
            isActive('/community/alumni')
              ? 'bg-black text-white shadow-sm'
              : 'text-gray-500 hover:text-black hover:bg-gray-100'
          }`}
        >
          Alumni
        </Link>
        <Link
          href="/community/gallery"
          className={`py-1.5 px-4.5 rounded-full text-xs font-semibold transition-all duration-200 ${
            isActive('/community/gallery')
              ? 'bg-black text-white shadow-sm'
              : 'text-gray-500 hover:text-black hover:bg-gray-100'
          }`}
        >
          Gallery
        </Link>
        <Link
          href="/community/achievements"
          className={`py-1.5 px-4.5 rounded-full text-xs font-semibold transition-all duration-200 ${
            isActive('/community/achievements')
              ? 'bg-black text-white shadow-sm'
              : 'text-gray-500 hover:text-black hover:bg-gray-100'
          }`}
        >
          Achievements
        </Link>
        <Link
          href="/community/library"
          className={`py-1.5 px-4.5 rounded-full text-xs font-semibold transition-all duration-200 ${
            isActive('/community/library') || pathname.startsWith('/community/library/')
              ? 'bg-black text-white shadow-sm'
              : 'text-gray-500 hover:text-black hover:bg-gray-100'
          }`}
        >
          Library
        </Link>
      </div>

      {/* Page view content */}
      <div className="w-full">{children}</div>
    </div>
  );
}
