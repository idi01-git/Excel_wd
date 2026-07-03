// src/app/(main)/events/[slug]/gallery/page.tsx
'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';

interface GalleryItem {
  id: string;
  type: 'PHOTO' | 'VIDEO' | 'POSTER' | 'MEMORY';
  url: string;
  caption?: string | null;
  createdAt: string;
}

interface EventSummary {
  id: string;
  title: string;
}

export default function EventGalleryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [items, setItems] = useState<GalleryItem[]>([]);
  const [event, setEvent] = useState<EventSummary | null>(null);
  const [filter, setFilter] = useState<string>('ALL');
  const [loading, setLoading] = useState<boolean>(true);
  
  // Lightbox State
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  useEffect(() => {
    const fetchGallery = async () => {
      setLoading(true);
      try {
        const url = filter === 'ALL' 
          ? `/api/events/${slug}/gallery` 
          : `/api/events/${slug}/gallery?type=${filter}`;
        const res = await fetch(url);
        const data = await res.json();
        if (data.success) {
          setItems(data.items);
          setEvent(data.event);
        } else {
          router.push(`/events/${slug}`);
        }
      } catch (error) {
        console.error('Failed to load event gallery:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchGallery();
  }, [slug, filter]);

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
  };

  const closeLightbox = () => {
    setLightboxIndex(null);
  };

  const nextSlide = () => {
    if (lightboxIndex !== null) {
      setLightboxIndex((lightboxIndex + 1) % items.length);
    }
  };

  const prevSlide = () => {
    if (lightboxIndex !== null) {
      setLightboxIndex((lightboxIndex - 1 + items.length) % items.length);
    }
  };

  if (loading || !event) {
    return (
      <div className="max-w-4xl mx-auto py-16 animate-pulse">
        <div className="h-8 bg-slate-900/60 rounded w-1/3 mb-10"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(n => <div key={n} className="h-56 bg-slate-900/60 rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-4">
      {/* Back link */}
      <Link href={`/events/${slug}`} className="text-sm font-semibold text-gray-500 hover:text-white transition mb-6 block">
        &larr; Back to Event: {event.title}
      </Link>

      {/* Header */}
      <div className="mb-8">
        <h1 className="font-serif text-3xl text-white font-bold mb-2">{event.title} - Gallery</h1>
        <p className="text-gray-400 text-sm">Visual summaries and posters captured during the event.</p>
      </div>

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
            {type === 'ALL' ? 'All Images' : type.toLowerCase() + 's'}
          </button>
        ))}
      </div>

      {/* Gallery Grid */}
      {items.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {items.map((item, index) => (
            <div
              key={item.id}
              onClick={() => openLightbox(index)}
              className="group bg-slate-900/30 border border-white/5 hover:border-white/10 rounded-2xl overflow-hidden shadow-lg transition duration-300 flex flex-col cursor-pointer"
            >
              <div className="relative h-52 overflow-hidden bg-slate-950">
                <img
                  src={item.url}
                  alt={item.caption || 'Gallery Image'}
                  className="w-full h-full object-cover group-hover:scale-103 transition duration-500"
                />
                <span className="absolute top-3 left-3 text-[9px] font-bold bg-black/60 text-cyan-400 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  {item.type.toLowerCase()}
                </span>
              </div>
              {item.caption && (
                <div className="p-3 bg-slate-900/10 border-t border-white/5">
                  <p className="text-xs text-gray-300 truncate">{item.caption}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-slate-900/10 border border-white/5 rounded-2xl text-gray-500 italic">
          No media records uploaded yet in this category.
        </div>
      )}

      {/* Lightbox Modal overlay */}
      {lightboxIndex !== null && (
        <div
          onClick={closeLightbox}
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 animate-in fade-in duration-300"
        >
          {/* Close button */}
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 text-gray-400 hover:text-white text-3xl font-bold focus:outline-none"
          >
            
          </button>

          {/* Previous Arrow */}
          <button
            onClick={(e) => { e.stopPropagation(); prevSlide(); }}
            className="absolute left-4 text-gray-400 hover:text-white text-3xl font-bold focus:outline-none"
          >
            ‹
          </button>

          {/* Slide container */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-3xl max-h-[80vh] flex flex-col items-center justify-center"
          >
            <img
              src={items[lightboxIndex].url}
              alt=""
              className="max-w-full max-h-[70vh] object-contain rounded-lg border border-white/10"
            />
            {items[lightboxIndex].caption && (
              <p className="text-sm text-gray-300 font-sans mt-4 text-center bg-slate-950/80 px-4 py-2 rounded-lg border border-white/5">
                {items[lightboxIndex].caption}
              </p>
            )}
          </div>

          {/* Next Arrow */}
          <button
            onClick={(e) => { e.stopPropagation(); nextSlide(); }}
            className="absolute right-4 text-gray-400 hover:text-white text-3xl font-bold focus:outline-none"
          >
            ›
          </button>
        </div>
      )}
    </div>
  );
}
