// src/components/navigation/GlobalSearchBar.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { SearchIcon, XIcon, Loader2Icon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatRole } from '@/lib/rbac';

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
}

export default function GlobalSearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState<string>('');
  const [results, setResults] = useState<{
    publications: SearchResultItem[];
    users: SearchResultItem[];
    alumni: SearchResultItem[];
  }>({ publications: [], users: [], alumni: [] });
  const [loading, setLoading] = useState<boolean>(false);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown and search input on click outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        if (!query.trim()) {
          setIsExpanded(false);
        }
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, [query]);

  // Debounced autocomplete search API call
  useEffect(() => {
    if (!query.trim()) {
      setResults({ publications: [], users: [], alumni: [] });
      setIsOpen(false);
      return;
    }

    const delayDebounce = setTimeout(async () => {
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
          setIsOpen(true);
        }
      } catch (error) {
        console.error('Search autocomplete failed:', error);
      } finally {
        setLoading(false);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(delayDebounce);
  }, [query]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setIsOpen(false);
    setIsExpanded(false);
    router.push(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  const handleIconClick = () => {
    if (!isExpanded) {
      setIsExpanded(true);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    } else if (query.trim()) {
      // If expanded and has query, perform search
      setIsOpen(false);
      setIsExpanded(false);
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const handleClear = () => {
    setQuery('');
    setResults({ publications: [], users: [], alumni: [] });
    setIsOpen(false);
    setIsExpanded(false);
  };

  const hasResults = results.publications.length > 0 || results.users.length > 0 || results.alumni.length > 0;

  return (
    <div ref={containerRef} className="relative flex items-center justify-end">
      
      {/* Search Input Box */}
      <motion.form 
        layout
        transition={{ type: "spring", stiffness: 350, damping: 30 }}
        initial={{ borderRadius: 999 }}
        onSubmit={handleSubmit} 
        className={`flex items-center bg-gray-50 dark:bg-white/5 border border-gray-200/80 dark:border-white/10 rounded-full overflow-hidden ${
          isExpanded ? 'px-3 py-1.5 shadow-sm dark:shadow-none' : 'p-0 border-transparent hover:border-gray-200 dark:hover:border-white/20 hover:bg-gray-100 dark:hover:bg-white/10 cursor-pointer'
        }`}
        style={{
           width: isExpanded ? '250px' : '36px',
           height: isExpanded ? '36px' : '36px'
        }}
        onClick={() => {
           if (!isExpanded) {
             setIsExpanded(true);
             setTimeout(() => inputRef.current?.focus(), 100);
           }
        }}
      >
        <motion.div layout="position" transition={{ type: "spring", stiffness: 350, damping: 30 }} className="flex items-center justify-center shrink-0 w-9 h-full">
          <SearchIcon size={15} strokeWidth={2.2} className="text-gray-500 dark:text-neutral-400" />
        </motion.div>
        
        <AnimatePresence>
          {isExpanded && (
            <motion.div 
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ type: "spring", stiffness: 350, damping: 30 }}
              className="flex items-center flex-1 overflow-hidden"
            >
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => { if (query.trim()) setIsOpen(true); }}
                placeholder="Search..."
                className="w-full bg-transparent text-gray-800 dark:text-white text-[13px] outline-none mr-1 placeholder-gray-400 dark:placeholder-neutral-500"
              />
              <button 
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (query.trim()) {
                    handleClear();
                  } else {
                    setIsExpanded(false);
                    setIsOpen(false);
                  }
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition p-1 shrink-0 rounded-full hover:bg-gray-200 dark:hover:bg-white/10"
              >
                <XIcon size={12} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.form>

      {/* Autocomplete Dropdown overlay */}
      <AnimatePresence>
        {isExpanded && isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="absolute right-0 top-full mt-2 w-72 md:w-80 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-white/10 shadow-2xl dark:shadow-none rounded-xl overflow-hidden z-200 py-2 max-h-[350px] overflow-y-auto"
          >
          {loading ? (
            <div className="p-4 text-center text-xs text-gray-500 flex justify-center gap-2 items-center">
              <Loader2Icon size={14} className="animate-spin text-gray-400" />
              <span>Searching...</span>
            </div>
          ) : hasResults ? (
            <div className="space-y-4">
              
              {/* Publications */}
              {results.publications.length > 0 && (
                <div>
                  <span className="block px-4 py-1 text-[10px] uppercase font-bold text-gray-400 dark:text-neutral-500 tracking-wider">Publications</span>
                  <div className="mt-1">
                    {results.publications.map((pub) => (
                      <Link
                        key={pub.id}
                        href={`/publications/${pub.slug}`}
                        onClick={() => { setIsOpen(false); setIsExpanded(false); }}
                        className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 dark:hover:bg-white/5 transition"
                      >
                        <img
                          src={pub.coverImage || 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=100&h=100&fit=crop'}
                          alt=""
                          className="w-8 h-8 object-cover rounded border border-gray-200 dark:border-white/10"
                        />
                        <div className="grow min-w-0">
                          <span className="block text-xs font-semibold text-gray-800 dark:text-white truncate">{pub.title}</span>
                          <span className="block text-[10px] text-gray-500 dark:text-neutral-400 capitalize">{pub.category?.toLowerCase()}</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Members */}
              {results.users.length > 0 && (
                <div>
                  <span className="block px-4 py-1 text-[10px] uppercase font-bold text-gray-400 dark:text-neutral-500 tracking-wider">Members & Authors</span>
                  <div className="mt-1">
                    {results.users.map((user) => (
                      <Link
                        key={user.id}
                        href={`/profile/${user.username}`}
                        onClick={() => { setIsOpen(false); setIsExpanded(false); }}
                        className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 dark:hover:bg-white/5 transition"
                      >
                        <img
                          src={user.profilePhoto || `https://api.dicebear.com/7.x/adventurer/svg?seed=${user.username}`}
                          alt=""
                          className="w-8 h-8 object-cover rounded-full border border-gray-200 dark:border-white/10"
                        />
                        <div className="grow min-w-0">
                          <span className="block text-xs font-semibold text-gray-800 dark:text-white truncate">{user.name}</span>
                          <span className="block text-[10px] text-gray-500 dark:text-neutral-400">@{user.username} &middot; {formatRole(user.role)}</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Alumni */}
              {results.alumni.length > 0 && (
                <div>
                  <span className="block px-4 py-1 text-[10px] uppercase font-bold text-gray-400 dark:text-neutral-500 tracking-wider">Alumni</span>
                  <div className="mt-1">
                    {results.alumni.map((alum) => (
                      <Link
                        key={alum.id}
                        href="/community/alumni"
                        onClick={() => { setIsOpen(false); setIsExpanded(false); }}
                        className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 dark:hover:bg-white/5 transition"
                      >
                        <img
                          src={alum.photo || `https://api.dicebear.com/7.x/adventurer/svg?seed=${alum.name}`}
                          alt=""
                          className="w-8 h-8 object-cover rounded-full border border-gray-200 dark:border-white/10"
                        />
                        <div className="grow min-w-0">
                          <span className="block text-xs font-semibold text-gray-800 dark:text-white truncate">{alum.name}</span>
                          <span className="block text-[10px] text-gray-500 dark:text-neutral-400 truncate">{alum.currentPosition || 'Alumnus'}</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

            </div>
          ) : (
            <div className="p-4 text-center text-xs text-gray-500 dark:text-neutral-500 italic">
              No results found for "{query}"
            </div>
          )}
        </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
