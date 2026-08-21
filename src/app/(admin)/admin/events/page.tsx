// src/app/(admin)/admin/events/page.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Plus,
  Calendar,
  MapPin,
  Users,
  Archive,
  XCircle,
  Trash2,
  Settings,
  Search,
  X,
  ExternalLink,
  Clock,
  DollarSign,
  Trophy,
  Sparkles,
} from 'lucide-react';
import { parseEventFormConfig } from '@/lib/event-form';

interface EventItem {
  id: string;
  title: string;
  slug: string;
  date: string;
  time?: string | null;
  venue: string;
  status: 'UPCOMING' | 'PAST' | 'CANCELLED';
  posterImage?: string | null;
  coverImage?: string | null;
  isCompetition?: boolean;
  requirePayment?: boolean;
  paymentAmount?: string | null;
  customFormFields?: unknown;
  _count: {
    registrations: number;
    winners?: number;
  };
}

export default function AdminEventsPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'UPCOMING' | 'PAST' | 'CANCELLED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchEvents = async () => {
    try {
      const response = await fetch('/api/admin/events');
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to load events');
      const allEvents = data.events || [];

      // Sort by date desc
      allEvents.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setEvents(allEvents);
    } catch (error) {
      console.error('Failed to load admin events:', error);
      setFeedback({ type: 'error', text: 'Failed to load club events.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleStatusChange = async (id: string, action: 'ARCHIVE' | 'CANCEL') => {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/admin/events/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (data.success) {
        setFeedback({
          type: 'success',
          text: `Event marked as ${action === 'ARCHIVE' ? 'completed / past' : 'cancelled'}.`,
        });
        fetchEvents();
      } else {
        setFeedback({ type: 'error', text: data.error || 'Failed to update event status.' });
      }
    } catch (error) {
      console.error('Error changing event status:', error);
      setFeedback({ type: 'error', text: 'Network error updating event status.' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (
      !confirm(
        `Are you sure you want to delete "${title}"? This will permanently erase all attendee registrations, winners, galleries, and reports.`
      )
    )
      return;

    setActionLoading(id);
    try {
      const res = await fetch(`/api/admin/events/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setFeedback({ type: 'success', text: `Event "${title}" deleted.` });
        fetchEvents();
      } else {
        // If registrations exist, prompt for force deletion
        if (data.code === 'REGISTRATIONS_EXIST') {
          if (
            confirm(
              'Registrations exist! Do you want to force deletion, clearing all registered attendee records?'
            )
          ) {
            const resForce = await fetch(`/api/admin/events/${id}?force=true`, {
              method: 'DELETE',
            });
            const dataForce = await resForce.json();
            if (dataForce.success) {
              setFeedback({ type: 'success', text: `Event "${title}" force deleted.` });
              fetchEvents();
              return;
            }
          }
        }
        setFeedback({ type: 'error', text: data.error || 'Failed to delete event.' });
      }
    } catch (error) {
      console.error('Error deleting event:', error);
      setFeedback({ type: 'error', text: 'Network error deleting event.' });
    } finally {
      setActionLoading(null);
    }
  };

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      if (statusFilter !== 'ALL' && event.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          event.title.toLowerCase().includes(q) ||
          event.venue.toLowerCase().includes(q) ||
          event.slug.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [events, statusFilter, searchQuery]);

  const upcomingCount = useMemo(
    () => events.filter((e) => e.status === 'UPCOMING').length,
    [events]
  );
  const pastCount = useMemo(() => events.filter((e) => e.status === 'PAST').length, [events]);
  const cancelledCount = useMemo(
    () => events.filter((e) => e.status === 'CANCELLED').length,
    [events]
  );
  const totalRegistrations = useMemo(
    () => events.reduce((sum, e) => sum + (e._count?.registrations || 0), 0),
    [events]
  );

  return (
    <div className="w-full min-h-screen bg-neutral-50 dark:bg-[#070707] text-neutral-900 dark:text-neutral-100 selection:bg-neutral-900 selection:text-white dark:selection:bg-white dark:selection:text-neutral-950 px-4 sm:px-6 md:px-8 py-8 md:py-10 max-w-6xl mx-auto space-y-8">
      {/* SaaS Monochrome Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-2.5">
          <Link
            href="/profile"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0e0e0e] hover:bg-neutral-100 dark:hover:bg-neutral-850 text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-all shadow-xs"
          >
            <ArrowLeft size={13} />
            <span>Dashboard</span>
          </Link>
          <span className="text-neutral-300 dark:text-neutral-700 text-xs">•</span>
          <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider font-mono">
            Control Center &amp; Sessions
          </span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800/80 pb-6">
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-neutral-900 dark:text-white flex items-center gap-3 flex-wrap">
              <span>Events &amp; Sessions</span>
              <span className="text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-800">
                {events.length} Total
              </span>
              <span className="text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-800">
                {totalRegistrations} Registrations
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1">
              Schedule club sessions, manage attendee rosters, verify payments, and publish post-event podiums.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href="/events"
              target="_blank"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0e0e0e] hover:bg-neutral-100 dark:hover:bg-neutral-850 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition-all shadow-xs"
            >
              <span>Public Calendar</span>
              <ExternalLink size={11} className="text-neutral-400" />
            </Link>

            <Link
              href="/admin/events/new"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 text-xs font-medium hover:bg-neutral-800 dark:hover:bg-neutral-200 active:scale-[0.98] transition-all shadow-sm"
            >
              <Plus size={14} />
              <span>Create Event</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Feedback Alert */}
      {feedback && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-3.5 sm:p-4 rounded-xl border text-xs flex items-center justify-between gap-3 shadow-xs ${
            feedback.type === 'success'
              ? 'bg-neutral-100 dark:bg-neutral-900 border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white'
              : 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900 text-red-700 dark:text-red-300'
          }`}
        >
          <span className="font-medium">{feedback.text}</span>
          <button
            onClick={() => setFeedback(null)}
            className="p-1 text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
          >
            <X size={14} />
          </button>
        </motion.div>
      )}

      {/* Filters and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Status Filter Pills */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-white dark:bg-[#0e0e0e] border border-neutral-200 dark:border-neutral-800 overflow-x-auto w-fit shadow-xs">
          {(
            [
              { key: 'ALL', label: `All (${events.length})` },
              { key: 'UPCOMING', label: `Upcoming (${upcomingCount})` },
              { key: 'PAST', label: `Completed (${pastCount})` },
              { key: 'CANCELLED', label: `Cancelled (${cancelledCount})` },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                statusFilter === tab.key
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 font-semibold shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search by title, venue, or slug */}
        <div className="relative min-w-[240px]">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search events or venues..."
            className="w-full pl-8 pr-8 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0e0e0e] text-xs text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-neutral-400 dark:focus:border-neutral-600 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
            >
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Events Grid Container with Stable Height */}
      <div className="min-h-[50vh]">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-32 rounded-2xl border border-neutral-200 dark:border-neutral-850 bg-white/50 dark:bg-[#0a0a0a]/50 animate-pulse"
              />
            ))}
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="py-16 text-center rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0e0e0e] space-y-3">
            <Calendar size={32} className="mx-auto text-neutral-400" />
            <p className="font-serif text-lg font-bold text-neutral-900 dark:text-white">
              {searchQuery ? 'No Matching Events' : 'No Events Scheduled'}
            </p>
            <p className="text-xs text-neutral-500 max-w-sm mx-auto">
              {searchQuery
                ? 'Try a different search keyword or clear the search filter.'
                : 'Create your club’s upcoming reading session, poetry slam, or annual fest.'}
            </p>
            {!searchQuery && (
              <div className="pt-2">
                <Link
                  href="/admin/events/new"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 text-xs font-medium hover:bg-neutral-800 dark:hover:bg-neutral-200 shadow-sm"
                >
                  <Plus size={14} />
                  <span>Create First Event</span>
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredEvents.map((event) => {
              const formConfig = parseEventFormConfig(event.customFormFields, event.isCompetition);
              const isHold = event.status === 'UPCOMING' && Boolean(formConfig.isOnHold);

              return (
                <div
                  key={event.id}
                  className="group relative rounded-2xl border border-neutral-200 dark:border-neutral-800/90 bg-white dark:bg-[#0a0a0a] p-4 sm:p-5 shadow-xs hover:border-neutral-300 dark:hover:border-neutral-700 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  {/* Left: Thumbnail & Info */}
                  <div className="flex items-start sm:items-center gap-4 min-w-0 flex-1">
                    {/* Poster or Date Box */}
                    {event.posterImage || event.coverImage ? (
                      <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-xl overflow-hidden bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shrink-0">
                        <img
                          src={event.posterImage || event.coverImage || ''}
                          alt={event.title}
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    ) : (
                      <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex flex-col items-center justify-center text-center p-2 shrink-0">
                        <span className="font-mono text-[9px] uppercase tracking-wider text-neutral-500 font-bold">
                          {new Date(event.date).toLocaleDateString('en-US', { month: 'short' })}
                        </span>
                        <span className="font-serif text-lg sm:text-xl font-bold text-neutral-900 dark:text-white leading-none mt-0.5">
                          {new Date(event.date).getDate()}
                        </span>
                      </div>
                    )}

                    {/* Content Details */}
                    <div className="space-y-1.5 min-w-0 flex-1">
                      {/* Badges row */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {/* Status Badge */}
                        {isHold ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                            ON HOLD
                          </span>
                        ) : (
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase border ${
                              event.status === 'UPCOMING'
                                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50'
                                : event.status === 'PAST'
                                ? 'bg-neutral-100 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-800'
                                : 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/50'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                event.status === 'UPCOMING'
                                  ? 'bg-emerald-500'
                                  : event.status === 'PAST'
                                  ? 'bg-neutral-400'
                                  : 'bg-red-500'
                              }`}
                            />
                            {event.status.toLowerCase()}
                          </span>
                        )}

                        {/* Competition Badge */}
                        {event.isCompetition && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-900/50">
                            <Trophy size={10} />
                            COMPETITION
                          </span>
                        )}

                        {/* Paid Badge */}
                        {event.requirePayment && (
                          <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/50">
                            <DollarSign size={10} />
                            {event.paymentAmount || 'PAID'}
                          </span>
                        )}
                      </div>

                      {/* Title */}
                      <h3 className="font-serif text-base sm:text-lg font-bold text-neutral-900 dark:text-white leading-snug truncate">
                        <Link
                          href={`/admin/events/${event.id}`}
                          className="hover:underline hover:text-neutral-700 dark:hover:text-neutral-200"
                        >
                          {event.title}
                        </Link>
                      </h3>

                      {/* Date & Venue meta */}
                      <div className="flex items-center gap-3 text-xs text-neutral-500 dark:text-neutral-400 font-sans flex-wrap">
                        <span className="inline-flex items-center gap-1">
                          <Calendar size={12} className="text-neutral-400" />
                          {new Date(event.date).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>

                        {event.time && (
                          <span className="inline-flex items-center gap-1">
                            <Clock size={12} className="text-neutral-400" />
                            {event.time}
                          </span>
                        )}

                        <span className="inline-flex items-center gap-1 truncate max-w-xs">
                          <MapPin size={12} className="text-neutral-400 shrink-0" />
                          <span className="truncate">{event.venue}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Registrations & Action Buttons */}
                  <div className="flex items-center justify-between md:justify-end gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-neutral-200 dark:border-neutral-800/80">
                    {/* Attendee Count Badge Link */}
                    <Link
                      href={`/admin/events/${event.id}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-[#121212] hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs font-mono font-medium text-neutral-700 dark:text-neutral-300 transition-colors"
                      title="View Attendee Roster"
                    >
                      <Users size={13} className="text-neutral-400" />
                      <span>
                        <strong className="font-bold text-neutral-900 dark:text-white">
                          {event._count.registrations}
                        </strong>{' '}
                        Attending
                      </span>
                    </Link>

                    {/* Management Action Buttons */}
                    <div className="flex items-center gap-1.5">
                      {actionLoading === event.id ? (
                        <span className="font-mono text-[10px] uppercase text-neutral-400 animate-pulse">
                          Processing...
                        </span>
                      ) : (
                        <>
                          <Link
                            href={`/admin/events/${event.id}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0e0e0e] hover:bg-neutral-100 dark:hover:bg-neutral-850 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition-all shadow-xs"
                          >
                            <Settings size={12} />
                            <span>Manage</span>
                          </Link>

                          {event.status === 'UPCOMING' && (
                            <>
                              <button
                                onClick={() => handleStatusChange(event.id, 'ARCHIVE')}
                                className="p-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0e0e0e] hover:bg-neutral-100 dark:hover:bg-neutral-850 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
                                title="Mark event as completed / past"
                              >
                                <Archive size={13} />
                              </button>

                              <button
                                onClick={() => handleStatusChange(event.id, 'CANCEL')}
                                className="p-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0e0e0e] hover:bg-red-50 dark:hover:bg-red-950/30 text-neutral-600 dark:text-neutral-400 hover:text-red-600 transition-colors"
                                title="Cancel event"
                              >
                                <XCircle size={13} />
                              </button>
                            </>
                          )}

                          <button
                            onClick={() => handleDelete(event.id, event.title)}
                            className="p-1.5 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 transition-colors"
                            title="Delete event record"
                          >
                            <Trash2 size={13} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
