// src/app/(main)/community/alumni/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useSession } from 'next-auth/react';
import { Search, Lock, BookOpen, X, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { Book } from '@/components/ui/book';

interface Alumnus {
  id: string;
  name: string;
  photo?: string | null;
  batch: string;
  branch: string;
  currentPosition?: string | null;
  excelsiorPosition?: string | null;
  message?: string | null;
  instagram?: string | null;
  linkedin?: string | null;
  email?: string | null;
  phone?: string | null;
  isContactRestricted: boolean;
}

const getPassingYear = (batch: string) => {
  if (!batch || batch === 'All') return '';
  const parts = batch.split('-');
  return parts.length > 1 ? parts[1].trim() : batch.trim();
};

const getVolume = (batch: string) => {
  if (!batch || batch === 'All') return '';
  const year = parseInt(getPassingYear(batch), 10);
  if (!isNaN(year)) {
    return Math.max(1, year - 2014);
  }
  return '';
};

export default function AlumniDirectoryPage() {
  const { data: session } = useSession();
  const [alumni, setAlumni] = useState<Alumnus[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBatch, setSelectedBatch] = useState('All');
  const [isBatchDropdownOpen, setIsBatchDropdownOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 12;

  // Reset to first page on search or batch change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedBatch]);

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

  // Lock body scroll when overlay is open
  useEffect(() => {
    if (activeId) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [activeId]);

  // Get unique batches for filtering
  const batches = ['All', ...Array.from(new Set(alumni.map(a => a.batch)))].sort((a, b) => b.localeCompare(a));

  // Filter alumni
  const filteredAlumni = alumni.filter(alum => {
    const matchesSearch =
      alum.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alum.batch.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alum.currentPosition?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alum.excelsiorPosition?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alum.branch.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesBatch = selectedBatch === 'All' || alum.batch === selectedBatch;
    return matchesSearch && matchesBatch;
  });

  const totalPages = Math.ceil(filteredAlumni.length / ITEMS_PER_PAGE);
  const paginatedAlumni = filteredAlumni.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-[#faf9f6] dark:bg-[#0a0a0a]">
        <div className="flex flex-col items-center gap-6 animate-pulse opacity-50 text-black dark:text-white">
          <BookOpen size={32} strokeWidth={1} />
          <div className="text-[10px] uppercase tracking-[0.3em] font-bold">Stocking the Library...</div>
        </div>
      </div>
    );
  }

  const activeAlum = alumni.find(a => a.id === activeId);

  return (
    <div className="min-h-screen bg-[#faf9f6] dark:bg-[#0a0a0a] font-sans selection:bg-black selection:text-white dark:selection:bg-white dark:selection:text-black">
      
      {/* Header */}
      <header className="relative pt-8 pb-16 px-6 md:px-12 max-w-[1600px] mx-auto flex flex-col items-center text-center">
        <motion.p 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="text-[10px] uppercase tracking-[0.4em] font-medium text-gray-400 dark:text-gray-500 mb-6"
        >
          Legacy Through Literature
        </motion.p>
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 0.1, ease: "easeOut" }}
          className="font-serif text-5xl md:text-7xl lg:text-8xl text-black dark:text-white tracking-tighter leading-none mb-12 italic"
        >
          Archivum Alumnorum
        </motion.h1>
        
        {/* Search & Filters */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.4 }}
          className="w-full max-w-3xl flex flex-col md:flex-row items-stretch md:items-end gap-6 relative z-20"
        >
          <div className="relative w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search name or batch..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-transparent border-b border-gray-300 dark:border-white/10 focus:border-black dark:focus:border-white outline-none transition-colors text-sm text-black dark:text-white placeholder:text-gray-400 font-serif italic"
            />
          </div>

          <div className="relative w-full md:w-64">
            <button
              onClick={() => setIsBatchDropdownOpen(!isBatchDropdownOpen)}
              className="flex items-center justify-between w-full px-4 py-3 bg-transparent border-b border-gray-400 dark:border-white/30 focus:border-black dark:focus:border-white outline-none transition-colors text-base text-black dark:text-white font-serif italic text-left hover:border-gray-800 dark:hover:border-gray-200"
            >
              <span className="font-medium truncate">
                {selectedBatch === 'All' ? 'All Batches' : `Vol. ${getVolume(selectedBatch)} (${getPassingYear(selectedBatch)})`}
              </span>
              <ChevronDown size={16} className={`text-gray-400 transition-transform flex-shrink-0 ml-2 ${isBatchDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
              {isBatchDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute top-full left-0 right-0 mt-1 bg-[#faf9f6] dark:bg-[#111111] border border-gray-200 dark:border-white/10 shadow-2xl max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-white/20"
                >
                  {batches.map((batch) => (
                    <button
                      key={batch}
                      onClick={() => { setSelectedBatch(batch); setIsBatchDropdownOpen(false); }}
                      className={`block w-full text-left px-4 py-3 text-sm font-serif italic transition-colors ${
                        selectedBatch === batch 
                          ? 'bg-gray-100 dark:bg-white/10 text-black dark:text-white' 
                          : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-black dark:hover:text-white'
                      }`}
                    >
                      {batch === 'All' ? 'All Batches' : `Vol. ${getVolume(batch)} (${getPassingYear(batch)})`}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </header>

      {/* The Alumni Grid */}
      <main className="max-w-[1600px] mx-auto px-6 md:px-12 pb-32">
        {filteredAlumni.length > 0 ? (
          <>
            <motion.div 
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-[18px] pt-[34px]"
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: { staggerChildren: 0.05 }
                }
              }}
            >
            <AnimatePresence mode="popLayout">
              {paginatedAlumni.map((alum) => {
                const photoUrl = alum.photo && alum.photo.trim() !== "" 
                  ? alum.photo 
                  : `https://api.dicebear.com/7.x/initials/svg?seed=${alum.name}&backgroundColor=111111&textColor=ffffff`;

                return (
                  <motion.div
                    key={alum.id}
                    layout
                    variants={{
                      hidden: { opacity: 0, y: 15 },
                      visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } }
                    }}
                    className="group flex flex-col border-[2px] border-[#333] dark:border-neutral-800 p-[12px] bg-white dark:bg-black rounded-none shadow-none transform transition-all duration-[0.25s] ease-in-out hover:-translate-y-[3px] hover:border-black dark:hover:border-white cursor-pointer"
                    onClick={() => setActiveId(alum.id)}
                  >
                    {/* Portrait */}
                    <div className="block w-full aspect-[4/4.3] relative overflow-hidden bg-[#ECECEC] dark:bg-neutral-900 border border-[#2E2E2E] dark:border-neutral-800">
                      <img 
                        src={photoUrl} 
                        alt={alum.name}
                        className="w-full h-full object-cover grayscale transition-transform duration-[1.2s] ease-[0.16,1,0.3,1] group-hover:scale-[1.02]" 
                      />
                    </div>

                    {/* Name */}
                    <div className="mt-[14px]">
                      <h2 className="font-serif text-[32px] lg:text-[44px] font-normal uppercase leading-[0.92] text-[#111111] dark:text-white tracking-[-0.04em] mb-[10px]">
                        {alum.name.split(' ').map((word, i) => (
                          <span key={i} className="block truncate">
                            {word}
                          </span>
                        ))}
                      </h2>
                    </div>
                    
                    {/* Bottom Row */}
                    <div className="flex justify-between items-end mt-auto">
                      <span className="text-[15px] font-sans font-normal text-[#333] dark:text-neutral-400 max-w-[65%] leading-tight truncate">
                        {alum.currentPosition || alum.branch}
                      </span>
                      <div className="flex-shrink-0">
                        <span className="text-[12px] font-serif italic text-neutral-500 uppercase tracking-widest">
                          Batch {getPassingYear(alum.batch)}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
          
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-16 pt-8 border-t border-gray-200 dark:border-neutral-800">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="w-10 h-10 flex items-center justify-center border-2 border-[#333] dark:border-neutral-800 disabled:opacity-30 hover:border-black dark:hover:border-white transition-colors text-black dark:text-white"
              >
                <ChevronLeft size={16} strokeWidth={2} />
              </button>
              
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`w-10 h-10 flex items-center justify-center border-2 transition-colors font-serif ${
                    currentPage === i + 1 
                      ? 'border-black bg-black text-white dark:border-white dark:bg-white dark:text-black' 
                      : 'border-[#333] dark:border-neutral-800 hover:border-black dark:hover:border-white text-black dark:text-white'
                  }`}
                >
                  {i + 1}
                </button>
              ))}

              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="w-10 h-10 flex items-center justify-center border-2 border-[#333] dark:border-neutral-800 disabled:opacity-30 hover:border-black dark:hover:border-white transition-colors text-black dark:text-white"
              >
                <ChevronRight size={16} strokeWidth={2} />
              </button>
            </div>
          )}
          </>
        ) : (
          <div className="py-32 text-center mt-[34px]">
            <p className="font-serif italic text-2xl text-neutral-400 dark:text-neutral-500">No alumni records found for this batch.</p>
          </div>
        )}
      </main>

      {/* Expanded Book Content Overlay */}
      <AnimatePresence>
        {activeId && activeAlum && (
          <motion.div 
            initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
            animate={{ opacity: 1, backdropFilter: "blur(24px)" }}
            exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 overflow-y-auto"
          >
            <button 
              onClick={() => setActiveId(null)}
              className="fixed top-8 right-8 p-4 bg-white/10 hover:bg-white hover:text-black rounded-full transition-all text-white z-50"
            >
              <X size={20} strokeWidth={1.5} />
            </button>

            <div className="w-full max-w-2xl px-6 py-24 my-auto relative">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.6, ease: "easeOut" }}
                className="bg-[#faf9f6] dark:bg-[#111111] p-10 md:p-16 rounded-sm shadow-2xl relative"
              >
                {/* Paper Texture Overlay */}
                <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/old-wall.png')] pointer-events-none mix-blend-multiply dark:mix-blend-overlay" />

                <div className="relative z-10 text-center mb-12">
                  <p className="text-[10px] uppercase tracking-[0.4em] font-bold text-gray-500 mb-4">
                    {activeAlum.branch} &mdash; Class of {getPassingYear(activeAlum.batch)}
                  </p>
                  <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl text-black dark:text-white tracking-tighter leading-none">
                    {activeAlum.name}
                  </h2>
                </div>

                {activeAlum.message ? (
                  <div className="relative mb-12 text-center">
                    <span className="absolute -top-12 left-1/2 -translate-x-1/2 text-8xl font-serif text-black/5 dark:text-white/5 select-none pointer-events-none">"</span>
                    <p className="relative z-10 font-serif text-xl md:text-2xl leading-relaxed text-gray-800 dark:text-gray-300">
                      {activeAlum.message}
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-8 border-y border-gray-200 dark:border-white/10 mb-12">
                    <p className="font-serif italic text-lg text-gray-400">The pages are blank.</p>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-8 justify-center mb-12 text-center">
                  {activeAlum.excelsiorPosition && (
                    <div>
                      <h4 className="text-[9px] uppercase tracking-[0.3em] font-bold text-gray-400 mb-2">Excelsior Mark</h4>
                      <p className="font-serif italic text-xl text-black dark:text-white">{activeAlum.excelsiorPosition}</p>
                    </div>
                  )}
                  {activeAlum.currentPosition && (
                    <div>
                      <h4 className="text-[9px] uppercase tracking-[0.3em] font-bold text-gray-400 mb-2">Present Journey</h4>
                      <p className="text-sm font-bold uppercase tracking-widest text-black dark:text-white">{activeAlum.currentPosition}</p>
                    </div>
                  )}
                </div>

                <div className="pt-8 border-t border-gray-200 dark:border-white/10 text-center">
                  <h4 className="text-[9px] uppercase tracking-[0.3em] font-bold text-gray-400 mb-6">Correspondence</h4>
                  
                  {activeAlum.isContactRestricted ? (
                    <div className="inline-flex items-center gap-3 bg-gray-100 dark:bg-white/5 px-6 py-4 rounded-sm">
                      <Lock size={14} className="text-gray-500 shrink-0" />
                      <p className="text-xs font-serif italic text-gray-500">
                        Sealed. Moderators only.
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-wrap justify-center gap-6">
                      {activeAlum.email && (
                        <a href={`mailto:${activeAlum.email}`} className="text-[10px] uppercase tracking-[0.2em] font-bold text-black dark:text-white hover:opacity-50 transition-colors pb-1 border-b border-black dark:border-white">
                          Email
                        </a>
                      )}
                      {activeAlum.linkedin && (
                        <a href={activeAlum.linkedin} target="_blank" rel="noopener noreferrer" className="text-[10px] uppercase tracking-[0.2em] font-bold text-black dark:text-white hover:opacity-50 transition-colors pb-1 border-b border-black dark:border-white">
                          LinkedIn
                        </a>
                      )}
                      {activeAlum.instagram && (
                        <a href={activeAlum.instagram} target="_blank" rel="noopener noreferrer" className="text-[10px] uppercase tracking-[0.2em] font-bold text-black dark:text-white hover:opacity-50 transition-colors pb-1 border-b border-black dark:border-white">
                          Instagram
                        </a>
                      )}
                      {activeAlum.phone && (
                        <a href={`tel:${activeAlum.phone}`} className="text-[10px] uppercase tracking-[0.2em] font-bold text-black dark:text-white hover:opacity-50 transition-colors pb-1 border-b border-black dark:border-white">
                          Phone
                        </a>
                      )}
                    </div>
                  )}
                </div>

              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

