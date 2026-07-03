// src/app/(main)/publications/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import PublicationCollection, {
  type PublicationItem,
} from '@/components/animated-collection';

const categories = ['All', 'Articles', 'Stories', 'Poems', 'Reviews'];

export default function PublicationsPage() {
  const [publications, setPublications] = useState<PublicationItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [category, setCategory] = useState<string>('All');
  const [sort, setSort] = useState<string>('latest');
  const [search, setSearch] = useState<string>('');

  const fetchPublications = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        category,
        sort,
        ...(search.trim() ? { search: search.trim() } : {}),
      });
      const res = await fetch(`/api/publications?${queryParams.toString()}`);
      const data = await res.json();
      if (data.success) {
        setPublications(data.publications);
      }
    } catch (error) {
      console.error('Failed to load publications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPublications();
  }, [category, sort]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPublications();
  };

  return (
    <div className="w-full max-w-6xl mx-auto py-8">
      {/* Header and Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
          <h1 className="font-serif text-4xl md:text-5xl text-black font-bold tracking-tight mb-3">
            Publications
          </h1>
          <p className="text-gray-500 font-sans text-sm md:text-base">
            Discover creative work, stories, poems, and reviews published by excelsior members.
          </p>
        </div>
        <form
          onSubmit={handleSearchSubmit}
          className="flex max-w-md w-full bg-gray-50 border border-gray-200 rounded-full px-4 py-2 focus-within:border-black focus-within:bg-white transition-all duration-200"
        >
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search titles or tags..."
            className="w-full bg-transparent text-black text-sm outline-none px-1"
          />
          <button
            type="submit"
            className="text-xs font-semibold text-black hover:text-gray-600 transition"
          >
            Search
          </button>
        </form>
      </div>

      {/* Filter Tabs & Sort */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-10 border-b border-gray-100 pb-5">
        <div className="flex flex-wrap gap-1.5 bg-gray-50 p-1 border border-gray-200/50 rounded-full">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`relative py-1.5 px-4 rounded-full text-xs font-semibold tracking-wide transition-all outline-none ${
                category === c
                  ? 'text-white'
                  : 'text-gray-500 hover:text-black hover:bg-gray-100/50'
              }`}
            >
              {category === c && (
                <motion.div
                  layoutId="active-category"
                  className="absolute inset-0 bg-black rounded-full shadow-sm"
                  transition={{ type: "spring", stiffness: 260, damping: 25, mass: 1 }}
                />
              )}
              <span className="relative z-10">{c}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Sort:</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="bg-white border border-gray-200 text-black text-xs font-semibold rounded-full px-4 py-1.5 focus:outline-none focus:border-black transition-all duration-200 cursor-pointer"
          >
            <option value="latest">Latest</option>
            <option value="popular">Popular (Likes)</option>
            <option value="discussed">Most Discussed</option>
          </select>
        </div>
      </div>

      {/* Loading skeleton */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="bg-gray-50 border border-gray-200/50 rounded-2xl h-80 animate-pulse"
            />
          ))}
        </div>
      ) : (
        /* Animated collection view switcher */
        <PublicationCollection publications={publications} />
      )}
    </div>
  );
}
