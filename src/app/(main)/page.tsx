// src/app/(main)/page.tsx
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  BookOpenIcon, 
  MapPinIcon, 
  NavigationIcon, 
  SparklesIcon, 
  ArrowRightIcon, 
  CalendarIcon, 
  LibraryIcon, 
  UsersIcon,
  SearchIcon
} from 'lucide-react';

const fadeUp = {
  initial: { opacity: 0, y: 40 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-50px" },
  transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] }
};

const staggerContainer = {
  initial: { opacity: 0 },
  whileInView: { opacity: 1 },
  viewport: { once: true, margin: "-50px" },
  transition: { staggerChildren: 0.15 }
};

const itemFadeUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] }
};

export default function RootPage() {
  const router = useRouter();
  const [category, setCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (category !== 'All') params.set('category', category);
    if (searchQuery.trim()) params.set('search', searchQuery.trim());
    router.push(`/publications?${params.toString()}`);
  };

  return (
    <div className="w-full text-black dark:text-white font-sans overflow-x-hidden">
      
      {/* ── SECTION 1: HERO BAND (WHITE) ── */}
      <section className="py-12 md:py-20 border-b border-gray-100 dark:border-white/10">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-12 items-center">
          
          {/* Left: Headline */}
          <motion.div 
            className="md:col-span-7 space-y-6"
            variants={staggerContainer}
            initial="initial"
            whileInView="whileInView"
            viewport={{ once: true, margin: "-50px" }}
          >
            <motion.h1 
              variants={itemFadeUp}
              className="font-serif text-[48px] md:text-[56px] font-bold text-black dark:text-white leading-[1.15] tracking-tight"
            >
              Go anywhere with words.
            </motion.h1>
            <motion.p 
              variants={itemFadeUp}
              className="text-gray-500 dark:text-neutral-400 text-lg md:text-xl font-medium max-w-xl leading-relaxed"
            >
              Welcome to excelsior. Constructing stories, preserving poetry, and establishing community since 2015. Read the campus heartbeat.
            </motion.p>
            <motion.div variants={itemFadeUp} className="flex flex-wrap gap-3 pt-2">
              <Link 
                href="/publications" 
                className="inline-flex items-center justify-center px-6 py-3 rounded-full text-sm font-semibold text-white dark:text-black bg-black dark:bg-white hover:bg-gray-900 dark:hover:bg-neutral-200 transition-all duration-200 shadow-sm"
              >
                Explore Publications
              </Link>
              <Link 
                href="/register" 
                className="inline-flex items-center justify-center px-6 py-3 rounded-full text-sm font-semibold text-black dark:text-white bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/10 transition-all duration-200"
              >
                Join the club
              </Link>
            </motion.div>
          </motion.div>

          {/* Right: Signature Uber-style Ride Request Card */}
          <motion.div 
            className="md:col-span-5"
            variants={fadeUp}
            initial="initial"
            whileInView="whileInView"
          >
            <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-white/10 rounded-2xl p-6 shadow-[0_4px_24px_rgba(0,0,0,0.06)] dark:shadow-none space-y-5">
              <div>
                <h3 className="text-xl font-bold text-black dark:text-white tracking-tight mb-1">
                  Start reading
                </h3>
                <p className="text-xs text-gray-400 dark:text-neutral-500">Select your destination in our literary catalog</p>
              </div>

              <form onSubmit={handleFormSubmit} className="space-y-3">
                {/* Input 1: Category */}
                <div className="bg-gray-50 dark:bg-black/40 border border-gray-200/80 dark:border-white/5 rounded-xl p-3 flex items-center gap-3">
                  <BookOpenIcon size={16} className="text-gray-400 dark:text-neutral-500 shrink-0" />
                  <div className="flex-grow">
                    <label className="block text-[10px] text-gray-400 dark:text-neutral-500 uppercase tracking-wider font-bold">Category</label>
                    <select 
                      value={category} 
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full bg-transparent text-xs text-black dark:text-white font-semibold outline-none border-none mt-0.5 cursor-pointer"
                    >
                      <option value="All">All Categories</option>
                      <option value="Articles">Articles</option>
                      <option value="Stories">Stories</option>
                      <option value="Poems">Poems</option>
                      <option value="Reviews">Reviews</option>
                    </select>
                  </div>
                </div>

                {/* Input 2: Search Query */}
                <div className="bg-gray-50 dark:bg-black/40 border border-gray-200/80 dark:border-white/5 rounded-xl p-3 flex items-center gap-3">
                  <SearchIcon size={16} className="text-gray-400 dark:text-neutral-500 shrink-0" />
                  <div className="flex-grow">
                    <label className="block text-[10px] text-gray-400 dark:text-neutral-500 uppercase tracking-wider font-bold">Search query</label>
                    <input 
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="e.g. Memory, Borges, Poetry"
                      className="w-full bg-transparent text-xs text-black dark:text-white font-semibold outline-none border-none mt-0.5 placeholder-gray-300 dark:placeholder-neutral-600"
                    />
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="w-full py-3 bg-black dark:bg-white hover:bg-gray-900 dark:hover:bg-neutral-200 text-white dark:text-black font-semibold text-sm rounded-full transition shadow-sm flex items-center justify-center gap-2"
                >
                  See publications <ArrowRightIcon size={14} />
                </button>
              </form>
            </div>
          </motion.div>

        </div>
      </section>

      {/* ── SECTION 2: EDITORIAL BAND (WHITE) ── */}
      <section className="py-16 md:py-24 max-w-6xl mx-auto border-b border-gray-100 dark:border-white/10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          {/* 4:3 Editorial illustration block */}
          <motion.div 
            variants={fadeUp}
            initial="initial"
            whileInView="whileInView"
            className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-gray-200 dark:border-white/10 shadow-sm"
          >
            <motion.img 
              initial={{ scale: 1.1 }}
              whileInView={{ scale: 1 }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              src="https://images.unsplash.com/photo-1513001900722-370f803f498d?w=800&h=600&fit=crop" 
              alt="Cozy library workspace"
              className="w-full h-full object-cover"
            />
          </motion.div>
          {/* Details */}
          <motion.div 
            variants={staggerContainer}
            initial="initial"
            whileInView="whileInView"
            className="space-y-5"
          >
            <motion.span variants={itemFadeUp} className="block text-[10px] text-gray-400 dark:text-neutral-500 uppercase tracking-wider font-bold">why excelsior</motion.span>
            <motion.h2 variants={itemFadeUp} className="font-serif text-3xl md:text-4xl text-black dark:text-white font-bold tracking-tight">
              Plan for later. Read today.
            </motion.h2>
            <motion.p variants={itemFadeUp} className="text-gray-500 dark:text-neutral-400 text-sm md:text-base leading-relaxed">
              Explore critical book reviews, literary essays, and curated suggestions prepared by our editorial board. Learn what inspires our writers and follow the threads of nested reviews and student critiques.
            </motion.p>
            <motion.div variants={itemFadeUp} className="pt-2">
              <Link 
                href="/editors-shelf" 
                className="inline-flex items-center justify-center px-5 py-2.5 rounded-full text-xs font-semibold text-black dark:text-white bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 transition shadow-sm"
              >
                Browse Editor's Shelf
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── SECTION 3: ALTERNATING POLARITY BAND (BLACK PROMO CARD) ── */}
      <section className="py-16 md:py-20 bg-black dark:bg-white text-white dark:text-black w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] px-4 md:px-0">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          
          <motion.div 
            variants={staggerContainer}
            initial="initial"
            whileInView="whileInView"
            className="space-y-5 md:pl-6"
          >
            <motion.span variants={itemFadeUp} className="block text-[10px] text-gray-450 dark:text-neutral-500 uppercase tracking-wider font-bold">join active sessions</motion.span>
            <motion.h2 variants={itemFadeUp} className="font-serif text-3xl md:text-4xl text-white dark:text-black font-bold tracking-tight leading-snug">
              Workshops, slams, and literary panels.
            </motion.h2>
            <motion.p variants={itemFadeUp} className="text-gray-400 dark:text-neutral-600 text-sm md:text-base leading-relaxed">
              Check out our upcoming events, workshops on creative writing, poetry slam contests, and guest speaker panels. Register to secure a seat, verify the countdown, and check winner podium logs.
            </motion.p>
            <motion.div variants={itemFadeUp} className="pt-2">
              <Link 
                href="/events" 
                className="inline-flex items-center justify-center px-6 py-3 rounded-full text-sm font-semibold text-black dark:text-white bg-white dark:bg-black hover:bg-gray-100 dark:hover:bg-neutral-800 transition shadow-sm"
              >
                View events schedule
              </Link>
            </motion.div>
          </motion.div>

          <motion.div 
            variants={fadeUp}
            initial="initial"
            whileInView="whileInView"
            className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-gray-800 dark:border-black/10 shadow-xl md:mr-6"
          >
            <motion.img 
              initial={{ scale: 1.1 }}
              whileInView={{ scale: 1 }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              src="https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=600&fit=crop" 
              alt="Creative panel event"
              className="w-full h-full object-cover"
            />
          </motion.div>

        </div>
      </section>

      {/* ── SECTION 4: COMMUNITY SERVICES (WHITE) ── */}
      <section className="py-16 md:py-24 max-w-6xl mx-auto">
        <motion.div 
          variants={fadeUp}
          initial="initial"
          whileInView="whileInView"
          className="text-center max-w-xl mx-auto mb-16 space-y-3"
        >
          <h2 className="font-serif text-3xl font-bold text-black dark:text-white tracking-tight">
            Connect across the ecosystem.
          </h2>
          <p className="text-gray-500 dark:text-neutral-400 text-sm leading-relaxed">
            The literary society extends beyond traditional publications. Find members, browse books, and trace society achievements.
          </p>
        </motion.div>

        <motion.div 
          variants={staggerContainer}
          initial="initial"
          whileInView="whileInView"
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          
          {/* Card 1: Members */}
          <motion.div variants={itemFadeUp} className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-white/10 rounded-2xl p-6 flex flex-col justify-between hover:-translate-y-1 hover:shadow-lg dark:hover:shadow-none transition-all duration-300">
            <div className="space-y-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 text-black dark:text-white">
                <UsersIcon size={18} />
              </span>
              <h3 className="text-lg font-bold text-black dark:text-white font-serif">Members & Authors</h3>
              <p className="text-gray-500 dark:text-neutral-400 text-xs leading-relaxed">
                Connect with active society writers, read bios, and follow their literature logs for instant new post updates.
              </p>
            </div>
            <Link href="/community/members" className="mt-6 text-xs font-semibold text-black dark:text-neutral-300 hover:dark:text-white hover:underline flex items-center gap-1">
              Browse Members &rarr;
            </Link>
          </motion.div>

          {/* Card 2: Library */}
          <motion.div variants={itemFadeUp} className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-white/10 rounded-2xl p-6 flex flex-col justify-between hover:-translate-y-1 hover:shadow-lg dark:hover:shadow-none transition-all duration-300">
            <div className="space-y-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 text-black dark:text-white">
                <LibraryIcon size={18} />
              </span>
              <h3 className="text-lg font-bold text-black dark:text-white font-serif">Society Library</h3>
              <p className="text-gray-500 dark:text-neutral-400 text-xs leading-relaxed">
                Access a catalog of physical books, read book ratings, check availability, and request borrow logs directly.
              </p>
            </div>
            <Link href="/community/library" className="mt-6 text-xs font-semibold text-black dark:text-neutral-300 hover:dark:text-white hover:underline flex items-center gap-1">
              Explore Library &rarr;
            </Link>
          </motion.div>

          {/* Card 3: Alumni */}
          <motion.div variants={itemFadeUp} className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-white/10 rounded-2xl p-6 flex flex-col justify-between hover:-translate-y-1 hover:shadow-lg dark:hover:shadow-none transition-all duration-300">
            <div className="space-y-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 text-black dark:text-white">
                <SparklesIcon size={18} />
              </span>
              <h3 className="text-lg font-bold text-black dark:text-white font-serif">Legacy & Alumni</h3>
              <p className="text-gray-500 dark:text-neutral-400 text-xs leading-relaxed">
                Learn about senior graduates, their achievements, and read helpful guidance cards for young writers.
              </p>
            </div>
            <Link href="/community/alumni" className="mt-6 text-xs font-semibold text-black dark:text-neutral-300 hover:dark:text-white hover:underline flex items-center gap-1">
              View Alumni &rarr;
            </Link>
          </motion.div>

        </motion.div>
      </section>

      {/* ── SECTION 5: APP SHOWCASE CARD ── */}
      <section className="pb-16 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          variants={fadeUp}
          initial="initial"
          whileInView="whileInView"
          className="bg-black dark:bg-white text-white dark:text-black rounded-2xl overflow-hidden relative min-h-[360px] flex items-center p-8 md:p-12 shadow-md"
        >
          <motion.div 
            initial={{ scale: 1.1, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 0.3 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="absolute inset-0 bg-cover bg-center" 
            style={{ backgroundImage: "url('https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=1200&h=600&fit=crop')" }}
          />
          <div className="relative z-10 max-w-md space-y-4">
            <span className="text-[10px] text-gray-300 dark:text-neutral-600 uppercase tracking-wider font-bold">Annual Showcase</span>
            <h2 className="text-3xl md:text-4xl font-bold font-serif leading-tight">
              excelsior 2026
            </h2>
            <p className="text-gray-350 dark:text-neutral-600 text-xs md:text-sm leading-relaxed">
              Our flagship yearbook anthology and selection of top poems, essays, and critiques. Driven by passion, presented with precision.
            </p>
            <div className="pt-2">
              <Link 
                href="/publications?sort=popular"
                className="inline-flex items-center justify-center px-5 py-2.5 bg-white dark:bg-black text-black dark:text-white hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-full text-xs font-semibold shadow-sm transition"
              >
                See popular works
              </Link>
            </div>
          </div>
        </motion.div>
      </section>

    </div>
  );
}
