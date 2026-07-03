// src/app/(main)/search/page.tsx
'use client';

import { useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';

interface SearchResultItem {
  id: string;
  title?: string;
  name?: string;
  username?: string;
  slug?: string;
  coverImage?: string | null;
  profilePhoto?: string | null;
  photo?: string | null;
  role?: string;
  category?: string;
  currentPosition?: string | null;
  readingTime?: number;
  tags?: string[];
  bio?: string | null;
  batch?: string;
  branch?: string;
  message?: string | null;
}

function SearchResultsContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';

  const [loading, setLoading] = useState<boolean>(true);
  const [results, setResults] = useState<{
    publications: SearchResultItem[];
    users: SearchResultItem[];
    alumni: SearchResultItem[];
  }>({ publications: [], users: [], alumni: [] });

  useEffect(() => {
    const fetchResults = async () => {
      if (!query.trim()) {
        setResults({ publications: [], users: [], alumni: [] });
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        if (data.success) {
          setResults({
            publications: data.publications || [],
            users: data.users || [],
            alumni: data.alumni || []
          });
        }
      } catch (error) {
        console.error('Failed to load search results:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [query]);

  if (loading) {
    return (
      <div className="py-12 animate-pulse">
        <div className="h-8 bg-slate-900/60 rounded w-1/4 mb-4"></div>
        <div className="h-4 bg-slate-900/60 rounded w-1/2 mb-10"></div>
        <div className="space-y-6">
          <div className="h-48 bg-slate-900/60 rounded-xl"></div>
          <div className="h-48 bg-slate-900/60 rounded-xl"></div>
        </div>
      </div>
    );
  }

  const totalResults = results.publications.length + results.users.length + results.alumni.length;

  return (
    <div className="w-full py-4">
      {/* Header */}
      <div className="border-b border-white/5 pb-5 mb-8">
        <h1 className="font-serif text-3xl text-white font-bold mb-1">Search Results</h1>
        <p className="text-gray-400 text-sm">
          Found {totalResults} matches for <strong className="text-cyan-400">"{query}"</strong>
        </p>
      </div>

      {totalResults > 0 ? (
        <div className="space-y-12">
          {/* Publications Section */}
          {results.publications.length > 0 && (
            <div>
              <h2 className="font-serif text-xl text-white font-semibold mb-6 flex items-center gap-2">
                <span>📚 Publications</span>
                <span className="text-xs bg-white/5 border border-white/5 px-2 py-0.5 rounded-full text-gray-500">
                  {results.publications.length}
                </span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {results.publications.map((pub) => (
                  <div key={pub.id} className="bg-slate-900/30 border border-white/5 hover:border-white/10 p-5 rounded-2xl flex gap-4 transition duration-300">
                    <img
                      src={pub.coverImage || 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=400&h=300&fit=crop'}
                      alt=""
                      className="w-24 h-24 object-cover rounded-xl border border-white/10"
                    />
                    <div className="flex flex-col flex-grow min-w-0">
                      <span className="text-[10px] text-violet-400 font-bold uppercase tracking-wider mb-1">{pub.category}</span>
                      <h3 className="font-serif text-base font-bold text-white mb-1.5 truncate">
                        <Link href={`/publications/${pub.slug}`} className="hover:text-cyan-400 transition">{pub.title}</Link>
                      </h3>
                      <p className="text-xs text-gray-500 mt-auto">
                        {pub.readingTime} min read &middot; By {pub.name || 'Author'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Members Section */}
          {results.users.length > 0 && (
            <div>
              <h2 className="font-serif text-xl text-white font-semibold mb-6 flex items-center gap-2">
                <span>👤 Members & Authors</span>
                <span className="text-xs bg-white/5 border border-white/5 px-2 py-0.5 rounded-full text-gray-500">
                  {results.users.length}
                </span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {results.users.map((user) => (
                  <Link
                    key={user.id}
                    href={`/profile/${user.username}`}
                    className="bg-slate-900/30 border border-white/5 hover:border-white/10 p-5 rounded-2xl flex items-center gap-4 transition duration-300"
                  >
                    <img
                      src={user.profilePhoto || `https://api.dicebear.com/7.x/adventurer/svg?seed=${user.username}`}
                      alt=""
                      className="w-14 h-14 object-cover rounded-full border border-white/10"
                    />
                    <div className="min-w-0 flex-grow">
                      <div className="flex items-center gap-2">
                        <h3 className="font-serif text-base font-bold text-white truncate">{user.name}</h3>
                        <span className="text-[9px] px-1.5 py-0.5 bg-violet-600/20 border border-violet-500/30 text-cyan-400 font-bold rounded uppercase">
                          {user.role}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">@{user.username}</p>
                      <p className="text-xs text-gray-400 mt-2 truncate italic">"{user.bio || 'Preserving stories...'}"</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Alumni Section */}
          {results.alumni.length > 0 && (
            <div>
              <h2 className="font-serif text-xl text-white font-semibold mb-6 flex items-center gap-2">
                <span>🎓 Alumni Directory</span>
                <span className="text-xs bg-white/5 border border-white/5 px-2 py-0.5 rounded-full text-gray-500">
                  {results.alumni.length}
                </span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {results.alumni.map((alum) => (
                  <div key={alum.id} className="bg-slate-900/30 border border-white/5 hover:border-white/10 p-5 rounded-2xl flex gap-4 transition duration-300">
                    <img
                      src={alum.photo || `https://api.dicebear.com/7.x/adventurer/svg?seed=${alum.name}`}
                      alt=""
                      className="w-14 h-14 object-cover rounded-full border border-white/10"
                    />
                    <div className="min-w-0 flex-grow">
                      <h3 className="font-serif text-base font-bold text-white">{alum.name}</h3>
                      <p className="text-xs text-gray-500">
                        {alum.branch} &middot; Batch of {alum.batch}
                      </p>
                      <p className="text-xs text-gray-400 mt-2">
                        💼 Current: <strong className="text-gray-300">{alum.currentPosition || 'Professional'}</strong>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      ) : (
        <div className="text-center py-20 bg-slate-900/10 border border-white/5 rounded-2xl">
          <p className="text-lg text-gray-400 font-serif">No matches found for "{query}"</p>
          <p className="text-sm text-gray-600 mt-1">Try spelling usernames or titles differently.</p>
        </div>
      )}
    </div>
  );
}

export default function SearchResultsPage() {
  return (
    <Suspense fallback={<div className="py-12 animate-pulse"><div className="h-8 bg-slate-900/60 rounded w-1/4 mb-4"></div><div className="h-4 bg-slate-900/60 rounded w-1/2 mb-10"></div></div>}>
      <SearchResultsContent />
    </Suspense>
  );
}
