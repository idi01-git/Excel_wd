// src/app/(main)/editors-shelf/page.tsx
'use client';

import { useEffect } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import the Hardback 3D experience to guarantee client-side canvas initialization
const Hardback = dynamic(
  () => import('@/components/sections/hardback/Hardback'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-screen bg-[#1a130a] flex items-center justify-center">
        <div className="text-center font-serif text-[#f3ecd8] opacity-70 tracking-widest uppercase text-sm">
          Opening the study…
        </div>
      </div>
    ),
  }
);

export default function EditorsShelfPage() {
  // Lock ALL scroll on html + body while on the shelf page
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;

    html.style.overflow = 'hidden';
    html.style.height = '100dvh';
    body.style.overflow = 'hidden';
    body.style.height = '100dvh';

    window.scrollTo(0, 0);

    return () => {
      html.style.overflow = '';
      html.style.height = '';
      body.style.overflow = '';
      body.style.height = '';
    };
  }, []);

  return <Hardback />;
}
