// src/app/(main)/community/gallery/page.tsx
'use client';

import { useState, useEffect } from 'react';

interface GalleryItem {
  id: string;
  type: 'PHOTO' | 'VIDEO' | 'POSTER' | 'MEMORY';
  url: string;
  caption?: string | null;
  createdAt: string;
}

export default function GalleryPage() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [filter, setFilter] = useState<string>('ALL');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchGallery = async () => {
      setLoading(true);
      try {
        const url = filter === 'ALL' ? '/api/community/gallery' : `/api/community/gallery?type=${filter}`;
        const res = await fetch(url);
        const data = await res.json();
        if (data.success) {
          setItems(data.items);
        }
      } catch (error) {
        console.error('Failed to load gallery:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchGallery();
  }, [filter]);

  return (
    <div className="w-full">
      {/* Category filters */}
      <div className="flex flex-wrap gap-2 mb-8">
        {['ALL', 'PHOTO', 'POSTER', 'MEMORY'].map((type) => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={`py-1.5 px-4 rounded-full text-xs font-semibold border transition ${
              filter === type
                ? 'bg-violet-600/10 text-violet-400 border-violet-500/30'
                : 'bg-transparent text-gray-500 border-white/5 hover:text-white hover:border-white/10'
            }`}
          >
            {type === 'ALL' ? 'All Memories' : type.toLowerCase() + 's'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3].map(n => <div key={n} className="h-64 bg-slate-900/60 rounded-2xl" />)}
        </div>
      ) : items.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {items.map((item) => (
            <div
              key={item.id}
              className="group bg-slate-900/30 border border-white/5 hover:border-white/10 rounded-2xl overflow-hidden shadow-lg transition duration-300 flex flex-col"
            >
              {/* Media image container */}
              <div className="relative h-56 overflow-hidden bg-slate-950">
                <img
                  src={item.url}
                  alt={item.caption || 'Memory'}
                  className="w-full h-full object-cover group-hover:scale-103 transition duration-500"
                />
                <span className="absolute top-3 left-3 text-[9px] font-bold bg-black/60 text-cyan-400 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  {item.type.toLowerCase()}
                </span>
              </div>

              {/* Caption details */}
              {item.caption && (
                <div className="p-4 bg-slate-900/10 flex-grow border-t border-white/5">
                  <p className="text-xs text-gray-300 font-sans leading-relaxed">
                    {item.caption}
                  </p>
                  <span className="text-[10px] text-gray-600 mt-2 block">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-slate-900/10 border border-white/5 rounded-2xl text-gray-500 italic">
          No items found in this category.
        </div>
      )}
    </div>
  );
}
