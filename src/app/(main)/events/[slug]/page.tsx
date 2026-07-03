// src/app/(main)/events/[slug]/page.tsx
'use client';

import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Winner {
  id: string;
  participantName: string;
  position: 'FIRST' | 'SECOND' | 'THIRD' | 'CONSOLATION' | 'SPECIAL_MENTION' | 'OTHER';
  prize?: string | null;
  description?: string | null;
}

interface EventDetail {
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
  maxCapacity: number | null;
  winners: Winner[];
  report?: {
    id: string;
    title: string;
  } | null;
  _count: {
    registrations: number;
    gallery: number;
  };
}

export default function EventDetailPage() {
  const { data: session } = useSession();
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [event, setEvent] = useState<EventDetail | null>(null);
  const [registered, setRegistered] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  
  // Registration Form Modal state
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [dietary, setDietary] = useState('');

  const fetchDetail = async () => {
    try {
      const res = await fetch(`/api/events/${slug}`);
      const data = await res.json();
      if (data.success) {
        setEvent(data.event);
        setRegistered(data.userRegistered);
        
        // Pre-fill form fields if session is active
        if (session?.user) {
          setName(session.user.name || '');
          setEmail(session.user.email || '');
        }
      } else {
        router.push('/404');
      }
    } catch (error) {
      console.error('Failed to load event details:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [slug, session]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event || actionLoading) return;

    setActionLoading(true);
    try {
      const res = await fetch(`/api/events/${event.slug}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          phone,
          extraFields: dietary ? { dietary } : null
        })
      });
      const data = await res.json();
      if (data.success) {
        setRegistered(true);
        setModalOpen(false);
        fetchDetail();
      } else {
        alert(data.error || 'Registration failed');
      }
    } catch (error) {
      console.error('Error during registration:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelRegistration = async () => {
    if (!event || actionLoading || !confirm('Are you sure you want to cancel your registration?')) return;

    setActionLoading(true);
    try {
      const res = await fetch(`/api/events/${event.slug}/register`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        setRegistered(false);
        fetchDetail();
      } else {
        alert(data.error || 'Failed to cancel registration');
      }
    } catch (error) {
      console.error('Error cancelling registration:', error);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading || !event) {
    return (
      <div className="max-w-3xl mx-auto py-16 animate-pulse">
        <div className="h-8 bg-gray-150 rounded w-3/4 mb-4"></div>
        <div className="h-4 bg-gray-150 rounded w-1/4 mb-10"></div>
        <div className="h-96 bg-gray-150 rounded-2xl"></div>
      </div>
    );
  }

  const isFull = event.maxCapacity !== null && event._count.registrations >= event.maxCapacity;

  return (
    <div className="max-w-3xl mx-auto py-8 text-black">
      {/* Back link */}
      <Link href="/events" className="text-sm font-semibold text-gray-500 hover:text-black transition mb-6 block">
        &larr; Back to Events Hub
      </Link>

      {/* Main Poster */}
      <div className="relative h-80 rounded-2xl overflow-hidden border border-gray-200 shadow-sm mb-8">
        <img
          src={event.posterImage || 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=1200&h=800&fit=crop'}
          alt={event.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-transparent flex flex-col justify-end p-8">
          <div className="flex flex-wrap gap-2 mb-3">
            {event.isCompetition && (
              <span className="text-[10px] font-bold bg-amber-500/20 text-white border border-white/20 px-3 py-0.5 rounded-full uppercase tracking-wider backdrop-blur-xs">
                🏆 Competition
              </span>
            )}
            <span className={`text-[10px] font-bold px-3 py-0.5 rounded-full uppercase tracking-wider border backdrop-blur-xs ${
              event.status === 'UPCOMING'
                ? 'bg-emerald-500/20 text-white border-white/20'
                : event.status === 'PAST'
                ? 'bg-gray-500/20 text-white border-white/20'
                : 'bg-red-500/20 text-white border-white/20'
            }`}>
              {event.status.toLowerCase()}
            </span>
          </div>

          <h1 className="font-serif text-3xl md:text-4xl text-white font-bold leading-tight mb-2">
            {event.title}
          </h1>
        </div>
      </div>

      {/* Metadata Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 text-center">
          <span className="block text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-1">Date & Time</span>
          <p className="text-sm font-bold text-black">
            {new Date(event.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
          {event.time && <p className="text-xs text-gray-500 mt-0.5">{event.time}</p>}
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 text-center">
          <span className="block text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-1">Venue</span>
          <p className="text-sm font-bold text-black truncate">{event.venue}</p>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 text-center">
          <span className="block text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-1">Capacity</span>
          <p className="text-sm font-bold text-black">
            {event._count.registrations} / {event.maxCapacity !== null ? event.maxCapacity : '∞'}
          </p>
        </div>
      </div>

      {/* Description & Action */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left main: description */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 leading-relaxed text-gray-800">
            <h2 className="font-serif text-xl text-black font-semibold mb-4 border-b border-gray-150 pb-2">About the Event</h2>
            <p className="whitespace-pre-line text-sm leading-relaxed">{event.description}</p>
          </div>

          {/* Past Event details (Report, Gallery, Winners) */}
          {event.status === 'PAST' && (
            <div className="space-y-4">
              <h2 className="font-serif text-xl text-black font-semibold">Post-Event Coverage</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {event.report && (
                  <Link
                    href={`/events/${event.slug}/report`}
                    className="bg-gray-50 border border-gray-200 hover:bg-gray-100/50 p-4 rounded-2xl flex items-center justify-between transition-all duration-200"
                  >
                    <div>
                      <span className="block text-xs font-bold text-black">Editorial Summary</span>
                      <span className="text-[11px] text-gray-500">Read the long-form report</span>
                    </div>
                    <span className="text-xl"></span>
                  </Link>
                )}

                {event._count.gallery > 0 && (
                  <Link
                    href={`/events/${event.slug}/gallery`}
                    className="bg-gray-50 border border-gray-200 hover:bg-gray-100/50 p-4 rounded-2xl flex items-center justify-between transition-all duration-200"
                  >
                    <div>
                      <span className="block text-xs font-bold text-black">Photo Gallery</span>
                      <span className="text-[11px] text-gray-500">Browse {event._count.gallery} memories</span>
                    </div>
                    <span className="text-xl">🖼</span>
                  </Link>
                )}
              </div>

              {/* Winners showcase */}
              {event.isCompetition && event.winners.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-2xl p-6">
                  <h3 className="font-serif text-lg text-black font-bold mb-4 flex items-center gap-2">
                    <span>🏆 Contest Winners</span>
                  </h3>
                  <div className="divide-y divide-gray-100">
                    {event.winners.map((win) => (
                      <div key={win.id} className="py-3 flex justify-between items-center text-xs">
                        <div>
                          <strong className="text-black text-sm">{win.participantName}</strong>
                          {win.prize && <p className="text-gray-400 text-[10px] mt-0.5">Prize: {win.prize}</p>}
                        </div>
                        <span className="px-2 py-0.5 bg-gray-50 border border-gray-200 rounded-full font-bold text-gray-700 uppercase text-[9px]">
                          {win.position.replace('_', ' ')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right side: Action Reservation card */}
        <div className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
            <h3 className="text-sm font-bold text-black uppercase tracking-wider mb-4">Registration Details</h3>
            
            {event.status === 'UPCOMING' ? (
              <div className="space-y-4">
                <div className="text-xs text-gray-500 space-y-1.5">
                  <div className="flex justify-between">
                    <span>Current registrations:</span>
                    <strong className="text-black">{event._count.registrations}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Capacity limit:</span>
                    <strong className="text-black">{event.maxCapacity !== null ? event.maxCapacity : 'No Limit'}</strong>
                  </div>
                </div>

                {registered ? (
                  <div className="space-y-2 pt-2">
                    <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs text-center font-semibold">
                       You are registered!
                    </div>
                    <button
                      onClick={handleCancelRegistration}
                      disabled={actionLoading}
                      className="w-full py-2.5 bg-red-50 hover:bg-red-100 text-red-605 border border-red-200 text-xs font-semibold rounded-full transition"
                    >
                      Cancel RSVP
                    </button>
                  </div>
                ) : (
                  <div className="pt-2">
                    {isFull ? (
                      <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs text-center font-semibold">
                         Registration Closed (Full)
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          if (session) setModalOpen(true);
                          else router.push('/login');
                        }}
                        className="w-full py-2.5 bg-black hover:bg-gray-900 text-white text-xs font-semibold rounded-full transition shadow-sm"
                      >
                        Reserve Seat
                      </button>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-xs text-gray-500 text-center py-4">
                <span className="block text-2xl mb-1">⏳</span>
                This event is closed or has already concluded.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Registration Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white border border-gray-250 rounded-3xl p-6 max-w-md w-full shadow-2xl text-black">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3 mb-5">
              <h3 className="font-serif text-lg text-black font-bold">Reserve Seat</h3>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-black"></button>
            </div>

            <form onSubmit={handleRegister} className="space-y-4">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="John Doe"
                  className="bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs outline-none focus:border-black transition"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="john@example.com"
                  className="bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs outline-none focus:border-black transition"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Phone Number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +1234567890"
                  className="bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs outline-none focus:border-black transition"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Dietary / Accessibility Needs (Optional)</label>
                <input
                  type="text"
                  value={dietary}
                  onChange={(e) => setDietary(e.target.value)}
                  placeholder="e.g. Vegetarian, wheelchair access"
                  className="bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs outline-none focus:border-black transition"
                />
              </div>

              <button
                type="submit"
                disabled={actionLoading}
                className="w-full mt-4 py-3 bg-black hover:bg-gray-900 text-white text-xs font-semibold rounded-full transition shadow-sm"
              >
                {actionLoading ? 'Registering...' : 'Confirm RSVP'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
