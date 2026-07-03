// src/app/(admin)/admin/events/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'UPCOMING':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'PAST':
        return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
      default:
        return 'bg-red-500/10 text-red-400 border-red-500/20';
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto py-6">
      <Link href="/profile" className="text-sm font-semibold text-gray-500 hover:text-white transition mb-6 block">
        &larr; Back to Dashboard
      </Link>

      <div className="mb-8 border-b border-white/5 pb-5 flex justify-between items-end flex-wrap gap-4">
        <div>
          <h1 className="font-serif text-3xl text-white font-bold mb-1">Events Manager</h1>
          <p className="text-gray-400 text-sm">Schedule events, track participant lists, add reports & galleries.</p>
        </div>
        <Link
          href="/admin/events/new"
          className="py-1.5 px-4 bg-violet-600 hover:bg-violet-700 text-xs font-semibold text-white rounded-full transition animate-pulse"
        >
           Create New Event
        </Link>
      </div>

      {loading ? (
        <div className="py-12 animate-pulse space-y-4">
          {[1, 2].map(n => <div key={n} className="h-14 bg-slate-900/60 rounded-xl" />)}
        </div>
      ) : events.length > 0 ? (
        <div className="bg-slate-900/30 border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs text-gray-300">
              <thead>
                <tr className="bg-slate-950 border-b border-white/5 text-[10px] uppercase font-bold text-gray-500">
                  <th className="p-4 pl-6">Event Title</th>
                  <th className="p-4">Date & Venue</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Registrations</th>
                  <th className="p-4 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {events.map((event) => (
                  <tr key={event.id} className="hover:bg-white/2 transition duration-150">
                    <td className="p-4 pl-6">
                      <strong className="text-white text-sm block">
                        <Link href={`/admin/events/${event.id}`} className="hover:text-cyan-400 transition">
                          {event.title}
                        </Link>
                      </strong>
                    </td>
                    <td className="p-4">
                      <p className="text-gray-300">{new Date(event.date).toLocaleDateString()}</p>
                      <p className="text-gray-500 text-[10px]">{event.venue}</p>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 border rounded uppercase text-[8px] font-bold ${getStatusColor(event.status)}`}>
                        {event.status.toLowerCase()}
                      </span>
                    </td>
                    <td className="p-4 text-gray-400 font-semibold pl-8">
                      {event._count.registrations}
                    </td>
                    <td className="p-4 pr-6 text-right">
                      {actionLoading === event.id ? (
                        <span className="text-gray-500 text-[10px]">Processing...</span>
                      ) : (
                        <div className="flex justify-end gap-1.5">
                          <Link
                            href={`/admin/events/${event.id}`}
                            className="py-1 px-2.5 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded font-semibold transition text-[10px]"
                          >
                            Manage
                          </Link>
                          {event.status === 'UPCOMING' && (
                            <>
                              <button
                                onClick={() => handleStatusChange(event.id, 'ARCHIVE')}
                                className="py-1 px-2.5 bg-violet-600/10 border border-violet-500/20 hover:bg-violet-600 text-violet-400 hover:text-white rounded font-semibold transition text-[10px]"
                              >
                                Archive
                              </button>
                              <button
                                onClick={() => handleStatusChange(event.id, 'CANCEL')}
                                className="py-1 px-2.5 bg-red-600/10 border border-red-500/20 hover:bg-red-600 text-red-400 hover:text-white rounded font-semibold transition text-[10px]"
                              >
                                Cancel
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handleDelete(event.id)}
                            className="py-1 px-2.5 bg-red-600/5 border border-red-500/20 hover:bg-red-700 text-red-400 hover:text-white rounded font-semibold transition text-[10px]"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-20 bg-slate-900/10 border border-white/5 rounded-2xl text-gray-500 italic">
          No events scheduled.
        </div>
      )}
    </div>
  );
}
