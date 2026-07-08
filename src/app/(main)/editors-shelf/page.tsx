// src/app/(main)/editors-shelf/page.tsx
'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Book } from '@prisma/client';
import { motion, AnimatePresence } from 'motion/react';
import { useTheme } from 'next-themes';

// Helper to convert hex colors to rgba with custom opacity
const hexToRgba = (hex: string | null, opacity: number) => {
  if (!hex) return `rgba(168, 85, 247, ${opacity})`;
  const cleaned = hex.replace('#', '');
  const r = parseInt(cleaned.substring(0, 2), 16);
  const g = parseInt(cleaned.substring(2, 4), 16);
  const b = parseInt(cleaned.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

// Rotating Circular Stamp (Awwwards Style Badge)
function CircularStamp({ text = "EXCELSIOR CURATED PICK • CHOICE SELECTION • " }) {
  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ repeat: Infinity, duration: 15, ease: 'linear' }}
      className="absolute -top-8 -right-8 w-24 h-24 pointer-events-none z-30 select-none hidden sm:block"
    >
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <path
          id="stampCirclePath"
          d="M 50, 50 m -35, 0 a 35,35 0 1,1 70,0 a 35,35 0 1,1 -70,0"
          fill="none"
        />
        <text className="text-[6.5px] uppercase font-bold tracking-widest fill-neutral-500 dark:fill-neutral-400">
          <textPath href="#stampCirclePath">{text}</textPath>
        </text>
      </svg>
    </motion.div>
  );
}

// Vintage Typewriter Review Index Card (Polariod/Tape Effect)
function CuratorMemoCard({ note }: { note: string }) {
  return (
    <motion.div
      initial={{ rotate: -2, y: 10, opacity: 0 }}
      animate={{ rotate: -2, y: 0, opacity: 1 }}
      whileHover={{ rotate: 0, scale: 1.03 }}
      transition={{ type: 'spring', stiffness: 100, damping: 12 }}
      className="relative bg-[#FCFBF7] dark:bg-neutral-900 border border-neutral-250 dark:border-neutral-800 p-6 shadow-xl max-w-xs z-20 select-none font-mono text-[11px] text-neutral-600 dark:text-neutral-400"
    >
      {/* Tape Effect */}
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-20 h-4 bg-yellow-100/60 dark:bg-neutral-800/80 border border-yellow-200/20 dark:border-neutral-700/30 backdrop-blur-[2px] shadow-sm transform -rotate-1" />
      
      {/* Paper texture detail lines */}
      <div className="border-b border-dashed border-neutral-200 dark:border-neutral-800 pb-2 mb-3 flex justify-between items-center">
        <span className="uppercase tracking-widest font-bold text-[9px] text-neutral-400">BOARD MEMO</span>
        <span className="text-neutral-300">#001</span>
      </div>
      <p className="leading-relaxed italic">
        "{note.slice(0, 140)}..."
      </p>
      <div className="mt-4 pt-3 border-t border-dashed border-neutral-200 dark:border-neutral-800 flex justify-between text-[9px] text-neutral-400 uppercase font-bold tracking-wider">
        <span>CURATED BY BOARD</span>
        <span>EXC.SLF</span>
      </div>
    </motion.div>
  );
}

// 3D Physical Book Pedestal Component
function PhysicalBook({ src, title, themeColor, disableGlow = false }: { src: string; title: string; themeColor: string | null; disableGlow?: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [shineX, setShineX] = useState(50);
  const [shineY, setShineY] = useState(50);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const xc = x / rect.width - 0.5;
    const yc = y / rect.height - 0.5;

    // Smooth subtle 3D rotational tilt
    setRotateY(xc * 22);
    setRotateX(-yc * 22);

    setShineX((x / rect.width) * 100);
    setShineY((y / rect.height) * 100);
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
    setShineX(50);
    setShineY(50);
  };

  const shadowColor = themeColor || '#c084fc';

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative w-full aspect-2/3 select-none"
      style={{ perspective: '1500px' }}
    >
      <motion.div
        className="w-full h-full relative preserve-3d transition-transform duration-350 ease-out"
        style={{
          transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`,
        }}
      >
        {/* Glowing aura pedestal background */}
        {!disableGlow && (
          <div 
            className="absolute inset-4 -z-10 rounded-2xl blur-3xl opacity-50 dark:opacity-30 transition-all duration-350"
            style={{
              backgroundColor: shadowColor,
              boxShadow: `0 35px 70px ${hexToRgba(shadowColor, 0.45)}`,
              transform: `translateZ(-25px) translateY(12px)`
            }}
          />
        )}

        {/* Outer Frame Spine Border */}
        <div className="absolute inset-0 bg-neutral-950 rounded-2xl p-px overflow-hidden shadow-2xl">
          {/* Main Book Cover */}
          <img
            src={src}
            alt={title}
            className="w-full h-full object-cover rounded-2xl relative z-10"
          />

          {/* Dynamic Light Sheen Overlay */}
          <div
            className="absolute inset-0 pointer-events-none z-20 transition-opacity duration-300"
            style={{
              background: `radial-gradient(circle at ${shineX}% ${shineY}%, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0) 55%)`,
            }}
          />

          {/* Physical Book Spine Gradient */}
          <div className="absolute top-0 left-0 w-[6%] h-full bg-linear-to-r from-black/45 via-white/10 to-transparent pointer-events-none z-20" />
          
          {/* Paper lines edge detail */}
          <div className="absolute top-0 right-0 w-[2px] h-full bg-white/20 z-20" />
        </div>
      </motion.div>
    </div>
  );
}

// Magazine Sleeve Component (Vinyl slide out concept)
function MagazineSleeve({ src, title, issueYear, darkTheme = false }: { src: string; title: string; issueYear: number; darkTheme?: boolean }) {
  return (
    <div className="relative w-full group cursor-pointer select-none">
      <div className={`relative aspect-3/4 overflow-hidden rounded-2xl border transition-all ${
        darkTheme 
          ? 'bg-neutral-950 border-neutral-850' 
          : 'bg-[#FCFBF7] dark:bg-neutral-950 border-neutral-250 dark:border-neutral-850 shadow-lg'
      } flex items-end`}>
        
        {/* Slide-out item */}
        <motion.div 
          className="absolute w-[88%] h-[88%] left-[6%] top-[6%] rounded-xl overflow-hidden transition-all duration-500 ease-out z-10"
          style={{ transformOrigin: 'bottom center' }}
          whileHover={{ y: -45, scale: 1.02 }}
        >
          <img
            src={src}
            alt={title}
            className="w-full h-full object-cover shadow-2xl"
          />
        </motion.div>

        {/* Sleeve front jacket */}
        <div className={`absolute inset-x-0 bottom-0 h-[48%] border-t p-6 z-20 flex flex-col justify-end transition-colors ${
          darkTheme 
            ? 'bg-linear-to-t from-neutral-950 to-neutral-900 border-neutral-800' 
            : 'bg-linear-to-t from-[#FCFBF7] via-[#FCFBF7]/95 to-[#FCFBF7]/85 dark:from-neutral-950 dark:via-neutral-950/95 dark:to-neutral-950/85 border-neutral-200 dark:border-neutral-800'
        }`}>
          <span className="text-[9px] uppercase tracking-[0.25em] text-neutral-400 font-extrabold mb-1">Issue Print</span>
          <h4 className={`font-serif text-lg font-bold line-clamp-1 ${darkTheme ? 'text-white' : 'text-neutral-900 dark:text-white'}`}>{title}</h4>
          <div className={`flex justify-between items-center mt-3 pt-3 border-t ${darkTheme ? 'border-neutral-800/80' : 'border-neutral-200 dark:border-neutral-800/80'}`}>
            <span className="text-[10px] text-neutral-500 font-bold">{issueYear} Release</span>
            <span className={`text-[10px] font-bold transition-colors flex items-center gap-1 ${darkTheme ? 'text-white group-hover:text-purple-400' : 'text-neutral-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400'}`}>
              Browse <span>&rarr;</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function EditorsShelfPage() {
  const { data: session } = useSession();
  const { resolvedTheme } = useTheme();
  const [items, setItems] = useState<Book[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [mounted, setMounted] = useState(false);

  // Active navigation marker for the sticky sidebar index
  const [activeSection, setActiveSection] = useState('weekly');

  // Form Fields
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [editorialNote, setEditorialNote] = useState('');
  const [genreInput, setGenreInput] = useState('');
  const [pickType, setPickType] = useState('WEEK');
  const [saving, setSaving] = useState(false);

  const fetchItems = async () => {
    try {
      const res = await fetch('/api/editors-shelf');
      const data = await res.json();
      if (data.success) {
        setItems(data.items);
      }
    } catch (error) {
      console.error('Failed to load shelf items:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    fetchItems();

    // Intersection observer to track section visibility for the sticky index
    const observerOptions = {
      root: null,
      rootMargin: '-20% 0px -60% 0px',
      threshold: 0
    };

    const handleIntersection = (entries: IntersectionObserverEntry[]) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    };

    const observer = new IntersectionObserver(handleIntersection, observerOptions);
    const sections = ['weekly', 'monthly', 'magazines', 'archives'];
    sections.forEach(id => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [loading]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !author || !editorialNote || saving) return;

    setSaving(true);
    const genre = genreInput.split(',').map(g => g.trim()).filter(Boolean);

    try {
      const res = await fetch('/api/admin/editors-shelf', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-pick-type': pickType
        },
        body: JSON.stringify({ title, author, coverImage, editorialNote, genre })
      });
      const data = await res.json();
      if (data.success) {
        alert('Curated recommendation added successfully!');
        setModalOpen(false);
        // Reset fields
        setTitle('');
        setAuthor('');
        setCoverImage('');
        setEditorialNote('');
        setGenreInput('');
        setPickType('WEEK');
        fetchItems();
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error('Error adding shelf item:', error);
    } finally {
      setSaving(false);
    }
  };

  const isStaff = session?.user && (session.user.role === 'MODERATOR' || session.user.role === 'ADMIN');

  const readOfTheWeek = items.find(i => i.editorPickType === 'WEEK');
  const readOfTheMonth = items.find(i => i.editorPickType === 'MONTH');
  const magazines = items.filter(i => i.editorPickType === 'MAGAZINE');
  const archives = items.filter(i => i.editorPickType === 'ARCHIVE' || !i.editorPickType);

  // Prevent SSR mismatch on theme resolution
  if (!mounted) return null;

  // Auto resolve layout mode (Light/Dark themes)
  const isDarkTheme = resolvedTheme === 'dark';

  return (
    <div className={`relative w-full min-h-screen transition-colors duration-500 bg-[#FCFBF7] dark:bg-[#070707] text-[#1f1f1f] dark:text-[#f2f2f2]`}>
      
      {/* 🎞️ Awwwards Film Grain Noise Overlay */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.02] z-50 bg-repeat" 
        style={{
          backgroundImage: `url("data:image/svg+xml;utf8,<svg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'><filter id='noiseFilter'><feTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23noiseFilter)'/></svg>")`
        }}
      />

      {/* Ambient pedestal spotlights behind book covers (Dark Mode Only) */}
      {isDarkTheme && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40 z-0">
          <div className="absolute top-[20%] left-[20%] w-[45vw] h-[45vw] rounded-full blur-[200px] bg-linear-to-tr from-purple-950 to-indigo-950 opacity-40" />
          <div className="absolute bottom-[20%] right-[20%] w-[45vw] h-[45vw] rounded-full blur-[200px] bg-linear-to-br from-cyan-950 to-blue-950 opacity-40" />
        </div>
      )}

      {/* Decorative vertical gridlines (Brutalist style) */}
      <div className={`absolute inset-y-0 left-6 right-6 pointer-events-none border-x ${isDarkTheme ? 'border-neutral-900' : 'border-neutral-200/40'} max-w-7xl mx-auto z-0`} />

      <div className="w-full max-w-7xl mx-auto px-6 py-20 md:py-32 relative z-10">
        
        {/* Upper Meta-Index Header */}
        <div className={`border-b ${isDarkTheme ? 'border-neutral-900' : 'border-neutral-250'} pb-12 mb-24 flex flex-col md:flex-row justify-between items-start md:items-end gap-8`}>
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-[9px] font-bold uppercase tracking-[0.25em] text-neutral-400">Excelsior Curations</span>
              <span className="text-neutral-400">•</span>
              <span className="text-[9px] uppercase tracking-wider font-bold text-neutral-500">Board Shelf 1.2</span>
            </div>
            <h1 className="font-serif text-5xl md:text-8xl font-black tracking-tighter leading-none uppercase">
              The <span className="italic font-light text-neutral-400 dark:text-neutral-500">Curated</span> Shelf
            </h1>
          </div>
          {isStaff && (
            <button
              onClick={() => setModalOpen(true)}
              className={`py-4 px-8 text-xs font-bold uppercase tracking-widest border transition-all ${
                isDarkTheme 
                  ? 'bg-white text-neutral-950 border-white hover:opacity-85' 
                  : 'bg-neutral-900 text-white border-neutral-900 hover:bg-transparent hover:text-neutral-900'
              }`}
            >
              + Create Entry
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-40">
            <div className={`w-12 h-12 border-2 border-t-transparent rounded-full animate-spin ${isDarkTheme ? 'border-white' : 'border-neutral-900'}`} />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
            
            {/* LEFT COLUMN: Sticky Index Tracker (Awwwards Style Sidebar) */}
            <aside className="lg:col-span-3 lg:sticky lg:top-24 hidden lg:block border-r border-neutral-200/50 dark:border-neutral-800/40 pr-8">
              <div className="flex flex-col gap-8">
                <div>
                  <span className="text-[9px] font-extrabold uppercase tracking-widest text-neutral-400">Shelf Directory</span>
                </div>
                
                {/* Index Links */}
                <nav className="flex flex-col gap-5 text-sm font-semibold uppercase tracking-wider">
                  <a
                    href="#weekly"
                    className={`flex items-center justify-between group transition-colors ${activeSection === 'weekly' ? 'text-purple-600 dark:text-purple-400' : 'text-neutral-400 hover:text-neutral-900 dark:hover:text-white'}`}
                  >
                    <span>01 / Read of Week</span>
                    <span className={`text-[10px] opacity-0 group-hover:opacity-100 transition-opacity ${activeSection === 'weekly' ? 'opacity-100' : ''}`}>&rarr;</span>
                  </a>
                  <a
                    href="#monthly"
                    className={`flex items-center justify-between group transition-colors ${activeSection === 'monthly' ? 'text-purple-600 dark:text-purple-400' : 'text-neutral-400 hover:text-neutral-900 dark:hover:text-white'}`}
                  >
                    <span>02 / Read of Month</span>
                    <span className={`text-[10px] opacity-0 group-hover:opacity-100 transition-opacity ${activeSection === 'monthly' ? 'opacity-100' : ''}`}>&rarr;</span>
                  </a>
                  <a
                    href="#magazines"
                    className={`flex items-center justify-between group transition-colors ${activeSection === 'magazines' ? 'text-purple-600 dark:text-purple-400' : 'text-neutral-400 hover:text-neutral-900 dark:hover:text-white'}`}
                  >
                    <span>03 / Print Stand</span>
                    <span className={`text-[10px] opacity-0 group-hover:opacity-100 transition-opacity ${activeSection === 'magazines' ? 'opacity-100' : ''}`}>&rarr;</span>
                  </a>
                  <a
                    href="#archives"
                    className={`flex items-center justify-between group transition-colors ${activeSection === 'archives' ? 'text-purple-600 dark:text-purple-400' : 'text-neutral-400 hover:text-neutral-900 dark:hover:text-white'}`}
                  >
                    <span>04 / The Archive</span>
                    <span className={`text-[10px] opacity-0 group-hover:opacity-100 transition-opacity ${activeSection === 'archives' ? 'opacity-100' : ''}`}>&rarr;</span>
                  </a>
                </nav>

                <div className={`pt-6 border-t ${isDarkTheme ? 'border-neutral-900' : 'border-neutral-200'} text-[10px] text-neutral-400 font-mono flex flex-col gap-2`}>
                  <span>EXC.VOL01.SLF</span>
                  <span>INDEXED: {items.length} TITLES</span>
                </div>
              </div>
            </aside>

            {/* RIGHT COLUMN: Content Stream */}
            <div className="lg:col-span-9 space-y-40">
              
              {/* SECTION 01: Read of the Week */}
              <section id="weekly" className="scroll-mt-24 space-y-12">
                {readOfTheWeek ? (
                  <div className="relative grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-16 items-center">
                    {/* Cover element */}
                    <div className="md:col-span-5 relative">
                      <div className="w-[85%] sm:w-[65%] md:w-full mx-auto relative">
                        <Link href={`/editors-shelf/book/${readOfTheWeek.id}`} className="block">
                          <PhysicalBook
                            src={readOfTheWeek.coverImage || 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=800&h=1200&fit=crop'}
                            title={readOfTheWeek.title}
                            themeColor={readOfTheWeek.themeColor}
                            disableGlow={!isDarkTheme}
                          />
                        </Link>
                        {/* Interactive Rotating stamp choice badge */}
                        <CircularStamp text="EXCELSIOR CURATED LITERARY PICK • CHOICE SELECTION • " />
                      </div>
                    </div>

                    {/* Metadata review content */}
                    <div className="md:col-span-7 flex flex-col items-start relative">
                      {/* Floating review index card */}
                      <div className="absolute -top-16 right-0 transform translate-x-4 translate-y-[-20%] hidden xl:block">
                        <CuratorMemoCard note={readOfTheWeek.clubReview || readOfTheWeek.description} />
                      </div>

                      <span className="text-[10px] font-extrabold uppercase tracking-[0.25em] text-purple-600 dark:text-purple-400 mb-4 block">
                        Weekly Pick
                      </span>
                      <h2 className="font-serif text-4xl md:text-5xl font-black uppercase tracking-tight mb-2 leading-none">
                        {readOfTheWeek.title}
                      </h2>
                      <p className="text-md font-semibold text-neutral-500 dark:text-neutral-450 italic mb-6">By {readOfTheWeek.author}</p>
                      
                      <div className={`border-l-2 pl-6 py-2 mb-8 ${isDarkTheme ? 'border-white' : 'border-neutral-900 dark:border-white'}`}>
                        <p className="font-serif text-base leading-relaxed text-neutral-600 dark:text-neutral-350">
                          {readOfTheWeek.clubReview || readOfTheWeek.description}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-4">
                        <Link 
                          href={`/editors-shelf/book/${readOfTheWeek.id}`}
                          className={`py-3.5 px-8 font-bold text-xs uppercase tracking-widest border transition-all ${
                            isDarkTheme 
                              ? 'bg-white text-neutral-950 border-white hover:opacity-90' 
                              : 'bg-neutral-900 text-white border-neutral-900 hover:bg-transparent hover:text-neutral-900'
                          }`}
                        >
                          Analyze Selection
                        </Link>
                        <span className="text-xs text-neutral-400 dark:text-neutral-500 font-mono">
                          Page Count: {readOfTheWeek.pageCount || "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-neutral-450 dark:text-neutral-500 italic text-sm">No weekly pick featured.</p>
                )}
              </section>

              {/* SECTION 02: Read of the Month */}
              <section id="monthly" className={`scroll-mt-24 pt-32 border-t ${isDarkTheme ? 'border-neutral-900' : 'border-neutral-250'} space-y-12`}>
                {readOfTheMonth ? (
                  <div className="relative grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-16 items-center">
                    {/* Metadata review content (Left) */}
                    <div className="md:col-span-7 flex flex-col items-start relative order-2 md:order-1">
                      {/* Floating review index card */}
                      <div className="absolute -top-16 left-0 transform translate-x-[-10%] translate-y-[-20%] hidden xl:block">
                        <CuratorMemoCard note={readOfTheMonth.clubReview || readOfTheMonth.description} />
                      </div>

                      <span className="text-[10px] font-extrabold uppercase tracking-[0.25em] text-cyan-600 dark:text-cyan-400 mb-4 block">
                        Monthly Spotlight
                      </span>
                      <h2 className="font-serif text-4xl md:text-5xl font-black uppercase tracking-tight mb-2 leading-none">
                        {readOfTheMonth.title}
                      </h2>
                      <p className="text-md font-semibold text-neutral-500 dark:text-neutral-450 italic mb-6">By {readOfTheMonth.author}</p>
                      
                      <div className={`border-l-2 pl-6 py-2 mb-8 ${isDarkTheme ? 'border-white' : 'border-neutral-900 dark:border-white'}`}>
                        <p className="font-serif text-base leading-relaxed text-neutral-600 dark:text-neutral-350">
                          {readOfTheMonth.clubReview || readOfTheMonth.description}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-4">
                        <Link 
                          href={`/editors-shelf/book/${readOfTheMonth.id}`}
                          className={`py-3.5 px-8 font-bold text-xs uppercase tracking-widest border transition-all ${
                            isDarkTheme 
                              ? 'bg-transparent border-white text-white hover:bg-white hover:text-neutral-950' 
                              : 'bg-transparent border-neutral-900 text-neutral-900 hover:bg-neutral-900 hover:text-white dark:border-white dark:text-white dark:hover:bg-white dark:hover:text-neutral-950'
                          }`}
                        >
                          Analyze Selection
                        </Link>
                        <span className="text-xs text-neutral-400 dark:text-neutral-500 font-mono">
                          Published: {readOfTheMonth.publishedYear || "N/A"}
                        </span>
                      </div>
                    </div>

                    {/* Cover element (Right) */}
                    <div className="md:col-span-5 relative order-1 md:order-2">
                      <div className="w-[85%] sm:w-[65%] md:w-full mx-auto relative">
                        <Link href={`/editors-shelf/book/${readOfTheMonth.id}`} className="block">
                          <PhysicalBook
                            src={readOfTheMonth.coverImage || 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=800&h=1200&fit=crop'}
                            title={readOfTheMonth.title}
                            themeColor={readOfTheMonth.themeColor}
                            disableGlow={!isDarkTheme}
                          />
                        </Link>
                        <CircularStamp text="EXCELSIOR MONTHLY CHOICE • BOARD SELECTION • " />
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-neutral-450 dark:text-neutral-500 italic text-sm">No monthly spotlight featured.</p>
                )}
              </section>

              {/* SECTION 03: Magazine prints */}
              <section id="magazines" className={`scroll-mt-24 pt-32 border-t ${isDarkTheme ? 'border-neutral-900' : 'border-neutral-250'} space-y-12`}>
                <div className="flex justify-between items-end">
                  <div>
                    <span className="text-[9px] font-bold uppercase tracking-[0.25em] text-neutral-400 block mb-2">Excelsior Press</span>
                    <h3 className="font-serif text-3xl md:text-5xl font-black uppercase">Magazine Stand</h3>
                  </div>
                </div>

                {magazines.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                    {magazines.map((mag) => (
                      <Link key={mag.id} href={`/editors-shelf/book/${mag.id}`}>
                        <MagazineSleeve
                          src={mag.coverImage || 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=800&h=1200&fit=crop'}
                          title={mag.title}
                          issueYear={new Date(mag.createdAt).getFullYear()}
                          darkTheme={isDarkTheme}
                        />
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-neutral-450 dark:text-neutral-500 italic text-sm">No magazine entries currently published.</p>
                )}
              </section>

              {/* SECTION 04: Archives */}
              <section id="archives" className={`scroll-mt-24 pt-32 border-t ${isDarkTheme ? 'border-neutral-900' : 'border-neutral-250'} space-y-12`}>
                <h3 className="font-serif text-3xl md:text-5xl font-black uppercase">Shelf Archives</h3>

                {archives.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-8">
                    {archives.map((item) => (
                      <Link key={item.id} href={`/editors-shelf/book/${item.id}`} className="group block">
                        <div className={`relative w-full aspect-2/3 rounded-2xl overflow-hidden mb-4 border transition-all duration-300 group-hover:-translate-y-2 group-hover:shadow-xl ${
                          isDarkTheme 
                            ? 'bg-neutral-900 border-neutral-850' 
                            : 'bg-[#FCFBF7] dark:bg-neutral-900 border-neutral-250 dark:border-neutral-800'
                        }`}>
                          <img
                            src={item.coverImage || 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=800&h=1200&fit=crop'}
                            alt={item.title}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <span className="py-2 px-5 bg-white text-black text-[10px] font-bold uppercase tracking-widest">
                              Browse review
                            </span>
                          </div>
                        </div>
                        <h4 className="font-serif text-base font-bold truncate group-hover:underline decoration-2 underline-offset-4">{item.title}</h4>
                        <p className="text-xs text-neutral-500 dark:text-neutral-450 mt-1 truncate">By {item.author}</p>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-neutral-450 dark:text-neutral-500 italic text-sm">The archive is currently empty.</p>
                )}
              </section>

            </div>

          </div>
        )}
      </div>

      {/* Creator Modal */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            
            {/* Modal Body */}
            <motion.div 
              initial={{ scale: 0.95, y: 30, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 30, opacity: 0 }}
              transition={{ type: 'spring', damping: 22, stiffness: 260 }}
              className="relative bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-900 p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl text-neutral-900 dark:text-white rounded-none"
            >
              <div className="flex justify-between items-center border-b border-neutral-100 dark:border-neutral-900 pb-4 mb-6">
                <h3 className="font-serif text-xl font-bold uppercase tracking-wider">Create Recommendation</h3>
                <button 
                  onClick={() => setModalOpen(false)} 
                  className="text-neutral-400 hover:text-black dark:hover:text-white text-2xl transition"
                >
                  &times;
                </button>
              </div>
              
              <form onSubmit={handleCreate} className="space-y-5">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold">Pick Type</label>
                  <select 
                    value={pickType} 
                    onChange={(e) => setPickType(e.target.value)}
                    className="bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-black dark:text-white p-3 text-xs outline-none focus:border-neutral-900 dark:focus:border-white transition"
                  >
                    <option value="WEEK">Read of the Week</option>
                    <option value="MONTH">Read of the Month</option>
                    <option value="MAGAZINE">Magazine</option>
                    <option value="ARCHIVE">General Archive</option>
                  </select>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold">Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    className="bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-black dark:text-white p-3 text-xs outline-none focus:border-neutral-900 dark:focus:border-white transition"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold">Author</label>
                  <input
                    type="text"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    required
                    className="bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-black dark:text-white p-3 text-xs outline-none focus:border-neutral-900 dark:focus:border-white transition"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold">Cover Image URL</label>
                  <input
                    type="text"
                    value={coverImage}
                    onChange={(e) => setCoverImage(e.target.value)}
                    className="bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-black dark:text-white p-3 text-xs outline-none focus:border-neutral-900 dark:focus:border-white transition"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold">Genres (comma separated)</label>
                  <input
                    type="text"
                    value={genreInput}
                    onChange={(e) => setGenreInput(e.target.value)}
                    className="bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-black dark:text-white p-3 text-xs outline-none focus:border-neutral-900 dark:focus:border-white transition"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold">Club Review / Note</label>
                  <textarea
                    value={editorialNote}
                    onChange={(e) => setEditorialNote(e.target.value)}
                    rows={4}
                    required
                    className="bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-black dark:text-white p-3 text-xs outline-none focus:border-neutral-900 dark:focus:border-white transition resize-none"
                  />
                </div>

                <div className="flex justify-end gap-4 pt-6 border-t border-neutral-100 dark:border-neutral-900">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="py-2 px-5 bg-transparent text-neutral-500 hover:text-black dark:hover:text-white font-bold text-xs uppercase tracking-widest transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="py-3 px-8 bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 font-bold text-xs uppercase tracking-widest hover:opacity-80 transition"
                  >
                    {saving ? 'Creating...' : 'Create Entry'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
