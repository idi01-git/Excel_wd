// src/app/(main)/events/winners/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface WinnerItem {
  id: string;
  participantName: string;
  position: 'FIRST' | 'SECOND' | 'THIRD' | 'CONSOLATION' | 'SPECIAL_MENTION' | 'OTHER';
  prize?: string | null;
  description?: string | null;
  event: {
    title: string;
    slug: string;
    date: string;
  };
}

export default function WinnersShowcasePage() {
  const [winners, setWinners] = useState<WinnerItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters
  const [yearFilter, setYearFilter] = useState<string>('');
  const [eventFilter, setEventFilter] = useState<string>('');
  const [eventsList, setEventsList] = useState<{ title: string; slug: string }[]>([]);

  useEffect(() => {
    const fetchWinners = async () => {
      setLoading(true);
      try {
        let queryStr = '?';
        if (yearFilter) queryStr += `year=${yearFilter}&`;
        if (eventFilter) queryStr += `eventSlug=${eventFilter}&`;

        const res = await fetch(`/api/events/winners${queryStr}`);
        const data = await res.json();
        if (data.success) {
          setWinners(data.winners);
        }
      } catch (error) {
        console.error('Failed to load winners:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchWinners();
  }, [yearFilter, eventFilter]);

  // Load events list for filter dropdown once
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await fetch('/api/events?status=past');
        const data = await res.json();
        if (data.success) {
          setEventsList(data.events.map((e: any) => ({ title: e.title, slug: e.slug })));
        }
      } catch (error) {
        console.error('Failed to load events filter list:', error);
      }
    };
    fetchEvents();
  }, []);

  const getPositionLabel = (pos: string) => {
    return pos.replace('_', ' ').toLowerCase();
  };

  const getBadgeColor = (pos: string) => {
    switch (pos) {
      case 'FIRST':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'SECOND':
        return 'bg-slate-300/10 text-slate-300 border-slate-300/20';
      case 'THIRD':
        return 'bg-amber-700/10 text-amber-600 border-amber-700/20';
      default:
        return 'bg-violet-600/10 text-violet-400 border-violet-500/20';
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto py-4">
      {/* Back link */}
      <Link href="/events" className="text-sm font-semibold text-gray-500 hover:text-white transition mb-6 block">
        &larr; Back to Events Hub
      </Link>

      {/* Title */}
      <div className="mb-8 border-b border-white/5 pb-5">
        <h1 className="font-serif text-3xl text-white font-bold mb-1">Competition Showcase</h1>
        <p className="text-gray-400 text-sm">Honoring the club members who placed in tournament poetry slams and writing contests.</p>
      </div>

      {/* Filter Row */}
      <div className="flex flex-wrap gap-4 mb-8 bg-slate-900/20 border border-white/5 p-4 rounded-xl">
        <div className="flex flex-col gap-1.5 min-w-[120px]">
          <label className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Filter Year</label>
          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            className="bg-slate-950 border border-white/10 text-white text-xs rounded-lg p-2 focus:outline-none focus:border-violet-600 transition"
          >
            <option value="">All Years</option>
            <option value="2026">2026</option>
            <option value="2025">2025</option>
            <option value="2024">2024</option>
          </select>
        </div>

        <div className="flex flex-col gap-1.5 flex-grow max-w-xs">
          <label className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Filter Contest</label>
          <select
            value={eventFilter}
            onChange={(e) => setEventFilter(e.target.value)}
            className="bg-slate-950 border border-white/10 text-white text-xs rounded-lg p-2 focus:outline-none focus:border-violet-600 transition w-full truncate"
          >
            <option value="">All Competitions</option>
            {eventsList.map((e) => (
              <option key={e.slug} value={e.slug}>{e.title}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Winners listing Table */}
      {loading ? (
        <div className="py-12 animate-pulse space-y-4">
          {[1, 2, 3].map(n => <div key={n} className="h-12 bg-slate-900/60 rounded-xl" />)}
        </div>
      ) : winners.length > 0 ? (
        <div className="bg-slate-900/30 border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs text-gray-300">
              <thead>
                <tr className="bg-slate-950 border-b border-white/5 text-[10px] uppercase font-bold text-gray-500">
                  <th className="p-4 pl-6">Participant</th>
                  <th className="p-4">Rank / Position</th>
                  <th className="p-4">Contest Event</th>
                  <th className="p-4">Awarded Date</th>
                  <th className="p-4 pr-6 text-right">Prize</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {winners.map((win) => (
                  <tr key={win.id} className="hover:bg-white/2 transition duration-200">
                    <td className="p-4 pl-6 font-semibold text-white text-sm">{win.participantName}</td>
                    <td className="p-4 capitalize">
                      <span className={`px-2.5 py-0.5 border rounded-full font-bold tracking-wide uppercase text-[9px] ${getBadgeColor(win.position)}`}>
                        {getPositionLabel(win.position)}
                      </span>
                    </td>
                    <td className="p-4">
                      <Link href={`/events/${win.event.slug}`} className="hover:text-cyan-400 font-semibold transition">
                        {win.event.title}
                      </Link>
                    </td>
                    <td className="p-4 text-gray-500">
                      {new Date(win.event.date).toLocaleDateString(undefined, {
                        month: 'short',
                        year: 'numeric'
                      })}
                    </td>
                    <td className="p-4 pr-6 text-right font-medium text-amber-400">{win.prize || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-20 bg-slate-900/10 border border-white/5 rounded-2xl text-gray-500 italic">
          No winners matched your selection.
        </div>
      )}
    </div>
  );
}
