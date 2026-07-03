// src/app/(main)/events/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

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
    <div className="w-full max-w-6xl mx-auto py-8">
      {/* Title */}
      <div className="mb-10 border-b border-gray-150 pb-6 flex justify-between items-end flex-wrap gap-4">
        <div>
          <h1 className="font-serif text-4xl text-black font-bold mb-2">Club Events</h1>
          <p className="text-gray-500 text-sm">Join workshops, slam poetry contests, literary debates, and alumni panels.</p>
        </div>
        <Link
          href="/events/winners"
          className="py-2 px-5 bg-gray-50 border border-gray-200 hover:bg-gray-100 rounded-full text-xs font-semibold text-black transition"
        >
          🏆 Competition Winners
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-100 pb-3 mb-8">
        <button
          onClick={() => setActiveTab('upcoming')}
          className={`py-1.5 px-4 text-xs uppercase tracking-wider font-semibold border-b-2 transition-all duration-200 ${
            activeTab === 'upcoming'
              ? 'text-black border-black font-bold'
              : 'text-gray-400 border-transparent hover:text-black'
          }`}
        >
          Upcoming Events
        </button>
        <button
          onClick={() => setActiveTab('past')}
          className={`py-1.5 px-4 text-xs uppercase tracking-wider font-semibold border-b-2 transition-all duration-200 ${
            activeTab === 'past'
              ? 'text-black border-black font-bold'
              : 'text-gray-400 border-transparent hover:text-black'
          }`}
        >
          Past & Archives
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3].map(n => <div key={n} className="h-96 bg-gray-50 border border-gray-200/50 rounded-2xl" />)}
        </div>
      ) : events.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <article
              key={event.id}
              className="group bg-white border border-gray-200 hover:border-gray-300 rounded-2xl overflow-hidden flex flex-col justify-between h-full hover:shadow-lg transition duration-300"
            >
              {/* Poster image */}
              <div className="relative h-48 overflow-hidden bg-gray-50 border-b border-gray-200">
                <img
                  src={event.posterImage || 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=600&h=400&fit=crop'}
                  alt={event.title}
                  className="w-full h-full object-cover group-hover:scale-103 transition duration-500"
                />
                {event.isCompetition && (
                  <span className="absolute top-3 left-3 text-[9px] font-bold bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-1 rounded-md uppercase tracking-wider">
                    Contest
                  </span>
                )}
              </div>

              {/* Body details */}
              <div className="p-6 flex-grow flex flex-col text-black">
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-2 block">
                  📅 {new Date(event.date).toLocaleDateString(undefined, {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </span>

                <h3 className="font-serif text-lg font-bold text-black mb-2 line-clamp-2 group-hover:text-black transition">
                  <Link href={`/events/${event.slug}`}>{event.title}</Link>
                </h3>
                
                <p className="text-gray-600 text-xs leading-relaxed line-clamp-3 mb-4">
                  {event.description.replace(/<[^>]*>/g, '')}
                </p>

                <div className="mt-auto space-y-2 pt-4 border-t border-gray-100 text-[11px] text-gray-500">
                  <p>📍 Venue: <strong className="text-gray-800">{event.venue}</strong></p>
                  {event.time && <p>⏰ Time: <strong className="text-gray-800">{event.time}</strong></p>}
                  {activeTab === 'upcoming' ? (
                    <p>👥 Registrations: <strong className="text-gray-800">{event._count.registrations}</strong></p>
                  ) : (
                    <p>👥 Total Participants: <strong className="text-gray-800">{event._count.registrations}</strong></p>
                  )}
                </div>
              </div>

              {/* Action Footer */}
              <div className="p-6 pt-0 mt-auto">
                <Link
                  href={`/events/${event.slug}`}
                  className={`block text-center py-2.5 rounded-full text-xs font-semibold transition ${
                    activeTab === 'upcoming'
                      ? 'bg-black hover:bg-gray-900 text-white shadow-sm'
                      : 'bg-gray-100 hover:bg-gray-200 border border-gray-250 text-black'
                  }`}
                >
                  {activeTab === 'upcoming' ? 'Register Now' : 'View Summary & Gallery'}
                </Link>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-gray-50 border border-gray-200 rounded-2xl text-gray-400 italic text-sm">
          No {activeTab} events scheduled at the moment.
        </div>
      )}
    </div>
  );
}
