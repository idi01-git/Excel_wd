// src/app/(main)/community/layout.tsx
'use client';

import { usePathname } from 'next/navigation';

export default function CommunityLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isCustomPaddingPage = 
    pathname.startsWith('/community/library') || 
    pathname.startsWith('/community/alumni') || 
    pathname.startsWith('/community/members');

  return (
    <div className={`w-full mx-auto text-black dark:text-neutral-200 ${isCustomPaddingPage ? '' : 'max-w-6xl py-8'}`}>
      <div className="w-full">{children}</div>
    </div>
  );
}
