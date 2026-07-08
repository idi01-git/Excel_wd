// src/app/(admin)/admin/events/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, Calendar, MapPin, Users, Archive, XCircle, Trash2, Settings } from 'lucide-react';

interface EventItem {
  id: string;
  title: string;
  slug: string;
  date: string;
  venue: string;
  status: 'UPCOMING' | 'PAST' | 'CANCELLED';
  _count: {
    registrations: number;
  };
}

export default function AdminEventsPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchEvents = async () => {
    try {
      const resUpcoming = await fetch('/api/events?status=upcoming');
      const dataUpcoming = await resUpcoming.json();
      const resPast = await fetch('/api/events?status=past');
      const dataPast = await resPast.json();

      let allEvents = [];
      if (dataUpcoming.success) allEvents.push(...dataUpcoming.events);
      if (dataPast.success) allEvents.push(...dataPast.events);
      
      // Sort by date desc
      allEvents.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      setEvents(allEvents);
    } catch (error) {
      console.error('Failed to load admin events:', error);
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
        body: JSON.stringify({ action })
      });
      const data = await res.json();
      if (data.success) {
        fetchEvents();
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error('Error changing event status:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this event? This will erase all registrations, winners, galleries, and reports.')) return;

    setActionLoading(id);
    try {
      const res = await fetch(`/api/admin/events/${id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        fetchEvents();
      } else {
        // If registrations exist, prompt for force deletion
        if (data.code === 'REGISTRATIONS_EXIST') {
          if (confirm('Registrations exist! Do you want to force deletion, clearing all registered users?')) {
            const resForce = await fetch(`/api/admin/events/${id}?force=true`, {
              method: 'DELETE'
            });
            const dataForce = await resForce.json();
            if (dataForce.success) {
              fetchEvents();
              return;
            }
          }
        }
        alert(data.error || 'Failed to delete event');
      }
    } catch (error) {
      console.error('Error deleting event:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'UPCOMING':
        return 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/30';
      case 'PAST':
        return 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-500/10 dark:text-gray-400 dark:border-white/10';
      default:
        return 'bg-red-50 text-red-600 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/30';
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 md:px-6">
      {/* Back to Dashboard */}
      <Link 
        href="/profile" 
        className="text-sm font-semibold text-gray-500 hover:text-black dark:hover:text-white transition flex items-center gap-1.5 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Dashboard</span>
      </Link>

      {/* Header section */}
      <div className="mb-8 border-b border-gray-200/80 dark:border-neutral-800 pb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-4xl text-black dark:text-white font-bold leading-tight mb-2">
            Events Manager
          </h1>
          <p className="text-gray-500 dark:text-neutral-500 text-sm font-medium">
            Schedule events, track participant lists, add reports & galleries.
          </p>
        </div>
        <Link
          href="/admin/events/new"
          className="py-2 px-6 bg-black dark:bg-white hover:bg-gray-900 dark:hover:bg-neutral-100 text-white dark:text-black text-xs font-semibold rounded-full transition-all duration-200 shadow-sm flex items-center gap-1.5 self-start md:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Event</span>
        </Link>
      </div>

      {loading ? (
        <div className="py-12 animate-pulse space-y-4">
          {[1, 2, 3].map(n => (
            <div key={n} className="h-20 bg-gray-100 dark:bg-neutral-900/60 rounded-2xl" />
          ))}
        </div>
      ) : events.length > 0 ? (
        <div className="bg-white dark:bg-neutral-900/30 border border-gray-200/80 dark:border-neutral-800 rounded-2xl overflow-hidden shadow-sm">
          {/* Header row (Desktop only) */}
          <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-4 bg-gray-50 dark:bg-neutral-900/80 border-b border-gray-200/80 dark:border-neutral-800 text-[10px] uppercase font-bold tracking-widest text-gray-500 dark:text-neutral-400">
            <div className="col-span-4">Event Title</div>
            <div className="col-span-3">Date & Venue</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-1">Registrations</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>

          {/* List items */}
          <div className="divide-y divide-gray-100 dark:divide-neutral-800">
            {events.map((event) => (
              <div 
                key={event.id} 
                className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center px-6 py-5 hover:bg-gray-50/50 dark:hover:bg-neutral-800/20 transition duration-150"
              >
                {/* Event Title */}
                <div className="col-span-1 md:col-span-4 flex items-center gap-4">
                  <div className="p-3 bg-gray-100 dark:bg-neutral-800/50 rounded-xl text-gray-500 dark:text-neutral-400 shrink-0">
                    <Calendar className="w-5 h-5 stroke-1.5" />
                  </div>
                  <div className="min-w-0">
                    <strong className="text-gray-900 dark:text-white font-semibold text-sm block truncate hover:text-violet-600 dark:hover:text-cyan-450 transition">
                      <Link href={`/admin/events/${event.id}`}>
                        {event.title}
                      </Link>
                    </strong>
                  </div>
                </div>

                {/* Date & Venue */}
                <div className="col-span-1 md:col-span-3 text-xs">
                  <span className="md:hidden text-[10px] text-gray-400 uppercase tracking-wider block mb-1">Details</span>
                  <div className="flex items-center gap-1.5 text-gray-700 dark:text-neutral-300">
                    <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span>{new Date(event.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-gray-500 dark:text-neutral-500 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span className="truncate">{event.venue}</span>
                  </div>
                </div>

                {/* Status */}
                <div className="col-span-1 md:col-span-2">
                  <span className={`inline-flex items-center gap-1.5 text-[10px] px-2.5 py-0.5 border rounded-full font-bold uppercase tracking-widest ${getStatusBadge(event.status)}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      event.status === 'UPCOMING' ? 'bg-emerald-500' : event.status === 'PAST' ? 'bg-gray-400' : 'bg-red-500'
                    }`}></span>
                    {event.status.toLowerCase()}
                  </span>
                </div>

                {/* Registrations count */}
                <div className="col-span-1 md:col-span-1 text-xs text-gray-600 dark:text-neutral-400 font-medium">
                  <span className="md:hidden text-[10px] text-gray-400 uppercase tracking-wider block mb-1">Registrations</span>
                  <div className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span>{event._count.registrations}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="col-span-1 md:col-span-2 text-right">
                  {actionLoading === event.id ? (
                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-neutral-500">Processing...</span>
                  ) : (
                    <div className="flex flex-wrap md:justify-end gap-2">
                      <Link
                        href={`/admin/events/${event.id}`}
                        className="inline-flex items-center gap-1 py-1.5 px-3 bg-gray-50 hover:bg-gray-100 dark:bg-neutral-800/50 hover:dark:bg-neutral-800 text-gray-700 dark:text-neutral-300 border border-gray-200 dark:border-white/5 rounded-full font-bold transition text-[10px] uppercase tracking-wider cursor-pointer"
                      >
                        <Settings className="w-3 h-3" />
                        <span>Manage</span>
                      </Link>
                      {event.status === 'UPCOMING' && (
                        <>
                          <button
                            onClick={() => handleStatusChange(event.id, 'ARCHIVE')}
                            className="inline-flex items-center gap-1 py-1.5 px-3 bg-violet-50 hover:bg-violet-100 dark:bg-violet-950/20 hover:dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 border border-violet-200/60 dark:border-violet-500/20 rounded-full font-bold transition text-[10px] uppercase tracking-wider cursor-pointer"
                          >
                            <Archive className="w-3 h-3" />
                            <span>Archive</span>
                          </button>
                          <button
                            onClick={() => handleStatusChange(event.id, 'CANCEL')}
                            className="inline-flex items-center gap-1 py-1.5 px-3 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 hover:dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200/60 dark:border-red-500/20 rounded-full font-bold transition text-[10px] uppercase tracking-wider cursor-pointer"
                          >
                            <XCircle className="w-3 h-3" />
                            <span>Cancel</span>
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleDelete(event.id)}
                        className="inline-flex items-center gap-1 py-1.5 px-3 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 hover:dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200/60 dark:border-red-500/20 rounded-full font-bold transition text-[10px] uppercase tracking-wider cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Delete</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-20 bg-gray-50/50 dark:bg-neutral-900/10 border border-gray-200/80 dark:border-neutral-800 rounded-2xl text-gray-400 dark:text-neutral-600 italic text-sm">
          No events scheduled.
        </div>
      )}
    </div>
  );
}
