// src/app/unauthorized/page.tsx
'use client';

import Link from 'next/link';

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0b10] bg-[radial-gradient(circle_at_50%_0%,#151829_0%,#08090d_100%)] px-4">
      <div className="max-w-md w-full bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-8 text-center shadow-2xl">
        <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6 text-red-400 text-3xl">
          🔒
        </div>
        <h1 className="font-serif text-3xl text-white font-bold mb-3">Access Restricted</h1>
        <p className="text-gray-400 mb-8 leading-relaxed">
          You do not have the required access clearance to view this page. If you believe this is an error, please contact the administrator.
        </p>
        <div className="space-y-3">
          <Link
            href="/"
            className="block w-full py-3 px-6 bg-linear-to-r from-violet-600 to-indigo-600 text-white rounded-full font-medium hover:shadow-lg hover:shadow-indigo-500/20 transition duration-300"
          >
            Return to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
