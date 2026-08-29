// src/app/(main)/events/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowUpRight, ArrowLeft, CalendarPlus } from 'lucide-react';
import { getOptimizedCardUrl } from '@/lib/image-optimization';

interface EventItem {
  id: string;
  title: string;
  slug: string;
  description: string;
  posterImage?: string | null;
  date: string;
  time?: string | null;
  venue: string;
  status: 'UPCOMING' | 'PAST' | 'CANCELLED';
  isCompetition: boolean;
  maxCapacity?: number | null;
  _count: {
    registrations: number;
  };
}

export default function EventsHubPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  const [loading, setLoading] = useState<boolean>(true);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/events?status=${activeTab}`);
      const data = await res.json();
      if (data.success) {
        setEvents(data.events);
      }
    } catch (error) {
      console.error('Failed to load events:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [activeTab]);

  return (
    <div className="w-full text-slate-900 dark:text-slate-200 font-sans selection:bg-slate-300 dark:selection:bg-slate-700">
      
      {/* ── Museum Exhibition Header ── */}
      <section className="w-full max-w-7xl mx-auto px-6 md:px-12 pt-4 md:pt-8 pb-6 md:pb-12">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-4 md:gap-8 border-b-2 border-slate-900 dark:border-slate-500 pb-3 md:pb-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-3xl flex flex-col items-start w-full lg:pb-0"
          >
            <Link 
              href="/" 
              className="text-[11px] font-bold uppercase tracking-widest text-slate-500 hover:text-slate-900 dark:hover:text-white transition flex items-center gap-2 mb-3 md:mb-6 w-fit"
            >
              <ArrowLeft className="w-4 h-4" /> <span>Return to Base</span>
            </Link>
            <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl font-normal tracking-tight text-slate-900 dark:text-slate-100 leading-none mb-3 md:mb-6">
              Exhibitions & Encounters
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-lg md:text-xl font-light leading-relaxed max-w-2xl">
              An archive of literary symposiums, competitive debates, and curated gatherings.
            </p>
          </motion.div>

          {/* ── Strict Typographic Tab Switcher ── */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex w-full lg:w-auto gap-0 lg:gap-10"
          >
            {['upcoming', 'past'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as 'upcoming' | 'past')}
                className={`flex-1 lg:flex-none text-center lg:text-left relative text-xs font-bold uppercase tracking-[0.2em] transition-colors pb-3 ${
                  activeTab === tab ? 'text-slate-900 dark:text-white' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                }`}
              >
                <span>{tab}</span>
                {activeTab === tab && (
                  <motion.div
                    layoutId="activeMuseumTab"
                    className="absolute h-0.5 left-0 right-0 z-10 bg-background -bottom-3.5 md:-bottom-4.5 lg:bottom-0 lg:bg-slate-900 lg:dark:bg-white lg:z-0"
                  />
                )}
              </button>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Cinematic List Architecture ── */}
      <section className="w-full max-w-7xl mx-auto px-6 md:px-12 pb-32 min-h-125">
        {loading ? (
          <div className="w-full animate-pulse flex flex-col gap-12">
            {[1, 2, 3].map(n => (
              <div key={n} className="flex flex-col md:flex-row gap-8 lg:gap-16">
                <div className="w-full md:w-1/3 h-64 bg-slate-200 dark:bg-slate-800" />
                <div className="flex-1 flex flex-col justify-center gap-6">
                  <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800" />
                  <div className="h-12 w-3/4 bg-slate-200 dark:bg-slate-800" />
                  <div className="h-16 w-full bg-slate-200 dark:bg-slate-800" />
                </div>
              </div>
            ))}
          </div>
        ) : events.length > 0 ? (
          <motion.div layout className="flex flex-col">
            <AnimatePresence mode="popLayout">
              {events.map((event, index) => {
                const eventDate = new Date(event.date);
                const eventType = event.isCompetition 
                  ? 'Competition' 
                  : event.title.toLowerCase().includes('workshop') 
                    ? 'Workshop' 
                    : 'Event';
                return (
                  <motion.article
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.6, delay: index * 0.08, ease: [0.16, 1, 0.3, 1] }}
                    key={event.id}
                    className="group border-b border-slate-200 dark:border-slate-800 pb-10 mb-10 md:pb-16 md:mb-16 last:border-0 last:mb-0"
                  >
                    <Link 
                      href={`/events/${event.slug}`} 
                      className="flex flex-col md:flex-row gap-8 lg:gap-16 items-stretch"
                    >
                      {/* Cinematic Image Crop (Left) */}
                      <div className="w-full md:w-[35%] lg:w-[30%] h-75 md:h-auto min-h-60 overflow-hidden bg-slate-100 dark:bg-slate-900 relative">
                        <img 
                          src={getOptimizedCardUrl(event.posterImage || 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=1200&fit=crop', 800)} 
                          alt={event.title}
                          className="absolute inset-0 w-full h-full object-cover grayscale opacity-90 group-hover:grayscale-0 group-hover:scale-105 group-hover:opacity-100 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
                        />
                      </div>

                      {/* Clean Typography (Right) */}
                      <div className="flex-1 flex flex-col justify-center">
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                            {/* Mobile short date */}
                            <span className="md:hidden">
                              {eventDate.toLocaleDateString(undefined, {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric',
                                year: '2-digit'
                              })}
                            </span>
                            {/* Desktop full date */}
                            <span className="hidden md:inline">
                              {eventDate.toLocaleDateString(undefined, {
                                weekday: 'long',
                                month: 'long',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </span>
                          </span>
                          <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest">
                            <span className="text-slate-800 dark:text-slate-200">{eventType}</span>
                            <span className="text-slate-300 dark:text-slate-700">&bull;</span>
                            <span className="text-slate-400 dark:text-slate-500">{event.status}</span>
                          </span>
                        </div>
                        
                        <div className="flex items-start justify-between gap-6 mb-6">
                          <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl font-normal text-slate-900 dark:text-slate-100 leading-[1.1] group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors">
                            {event.title}
                          </h2>
                          <div className="shrink-0 pt-2 opacity-100 translate-x-0 md:opacity-0 md:-translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]">
                            <ArrowUpRight className="w-6 h-6 md:w-8 md:h-8 text-slate-900 dark:text-white" />
                          </div>
                        </div>

                        <p className="text-base md:text-lg text-slate-600 dark:text-slate-400 font-light leading-relaxed line-clamp-3 mb-8 max-w-2xl">
                          {event.description.replace(/<[^>]*>/g, '')}
                        </p>

                        {/* Strict Data Grid Footer with Actions */}
                        <div className="flex flex-col md:flex-row justify-between md:items-end gap-4 md:gap-6 pt-4 md:pt-6 border-t border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                          <div className="flex gap-12">
                            <div>
                              <span className="block text-slate-400 dark:text-slate-600 mb-1 text-[9px]">Time</span>
                              {event.time || 'TBA'}
                            </div>
                            <div>
                              <span className="block text-slate-400 dark:text-slate-600 mb-1 text-[9px]">Venue</span>
                              {event.venue}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4 w-full md:w-auto">
                            <button 
                              onClick={(e) => {
                                e.preventDefault();
                                window.location.href = `/events/${event.slug}${activeTab === 'past' ? '' : '#register'}`;
                              }}
                              className="flex-1 md:flex-none flex items-center justify-center px-6 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors font-bold uppercase tracking-widest text-[11px]"
                            >
                              {activeTab === 'past' ? 'View Details' : 'Register'}
                            </button>
                            {activeTab !== 'past' && (
                              <button 
                                onClick={(e) => {
                                  e.preventDefault();
                                  
                                  const dateObj = new Date(event.date);
                                  const startStr = dateObj.toISOString().replace(/[-:]|\.\d{3}/g, '');
                                  const endDateObj = new Date(dateObj.getTime() + 2 * 60 * 60 * 1000);
                                  const endStr = endDateObj.toISOString().replace(/[-:]|\.\d{3}/g, '');
                                  
                                  const icsContent = [
                                    'BEGIN:VCALENDAR',
                                    'VERSION:2.0',
                                    'BEGIN:VEVENT',
                                    `SUMMARY:${event.title}`,
                                    `DESCRIPTION:${event.description.replace(/<[^>]*>/g, '').substring(0, 300)}...`,
                                    `LOCATION:${event.venue}`,
                                    `DTSTART:${startStr}`,
                                    `DTEND:${endStr}`,
                                    'END:VEVENT',
                                    'END:VCALENDAR'
                                  ].join('\r\n');

                                  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
                                  const url = URL.createObjectURL(blob);
                                  const link = document.createElement('a');
                                  link.href = url;
                                  link.setAttribute('download', `${event.slug}.ics`);
                                  document.body.appendChild(link);
                                  link.click();
                                  document.body.removeChild(link);
                                }}
                                className="flex items-center justify-center w-10 h-10 rounded-full border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors"
                                title="Download iCalendar File"
                              >
                                <CalendarPlus className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.article>
                );
              })}
            </AnimatePresence>
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} 
            className="w-full py-40 flex flex-col items-center justify-center text-center border-t border-slate-200 dark:border-slate-800"
          >
            <h3 className="font-serif text-3xl font-normal text-slate-400 dark:text-slate-600 mb-4">The exhibition is empty</h3>
            <p className="text-slate-400 dark:text-slate-500 text-base font-light mb-8">No records found for the current selection.</p>
            
            {activeTab === 'upcoming' && (
              <button 
                onClick={() => setActiveTab('past')}
                className="px-6 py-3 border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors text-[11px] font-bold uppercase tracking-widest"
              >
                Explore Past Exhibitions
              </button>
            )}
          </motion.div>
        )}
      </section>
    </div>
  );
}
