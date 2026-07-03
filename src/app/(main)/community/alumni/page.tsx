// src/app/(main)/community/alumni/page.tsx
'use client';

import { useState, useEffect } from 'react';

interface Alumnus {
  id: string;
  name: string;
  photo?: string | null;
  batch: string;
  branch: string;
  currentPosition?: string | null;
  message?: string | null;
}

export default function AlumniDirectoryPage() {
  const [alumni, setAlumni] = useState<Alumnus[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchAlumni = async () => {
      try {
        const res = await fetch('/api/community/alumni');
        const data = await res.json();
        if (data.success) {
          setAlumni(data.alumni);
        }
      } catch (error) {
        console.error('Failed to load alumni:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAlumni();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
        {[1, 2].map(n => <div key={n} className="h-44 bg-slate-900/60 rounded-2xl" />)}
      </div>
    );
  }

  return (
    <div className="w-full">
      {alumni.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {alumni.map((alum) => (
            <div
              key={alum.id}
              className="bg-slate-900/30 border border-white/5 hover:border-white/10 p-6 rounded-2xl flex flex-col justify-between h-full shadow-lg transition duration-300"
            >
              <div>
                {/* Header */}
                <div className="flex gap-4 items-center mb-4">
                  <img
                    src={alum.photo || `https://api.dicebear.com/7.x/adventurer/svg?seed=${alum.name}`}
                    alt={alum.name}
                    className="w-14 h-14 object-cover rounded-full border border-white/10"
                  />
                  <div className="min-w-0">
                    <h3 className="text-base font-bold text-white truncate">{alum.name}</h3>
                    <p className="text-xs text-gray-500">
                      {alum.branch} &middot; Batch of {alum.batch}
                    </p>
                    {alum.currentPosition && (
                      <p className="text-xs text-cyan-400 font-semibold truncate mt-1">
                        💼 {alum.currentPosition}
                      </p>
                    )}
                  </div>
                </div>

                {/* Message to juniors */}
                {alum.message && (
                  <div className="bg-slate-950/40 border border-white/5 rounded-xl p-3.5 mt-3 relative">
                    <span className="absolute -top-3.5 left-4 text-3xl text-violet-500 font-serif">“</span>
                    <p className="text-xs text-gray-300 leading-relaxed italic pl-2 pt-1 font-sans">
                      {alum.message}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-slate-900/10 border border-white/5 rounded-2xl text-gray-500 italic">
          No alumni profiles cataloged yet.
        </div>
      )}
    </div>
  );
}
