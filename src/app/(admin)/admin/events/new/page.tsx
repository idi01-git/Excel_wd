// src/app/(admin)/admin/events/new/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminNewEventPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [posterImage, setPosterImage] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [venue, setVenue] = useState('');
  const [isCompetition, setIsCompetition] = useState(false);
  const [maxCapacity, setMaxCapacity] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    try {
      const res = await fetch('/api/admin/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          posterImage,
          date,
          time,
          venue,
          isCompetition,
          maxCapacity: maxCapacity ? parseInt(maxCapacity) : null
        })
      });
      const data = await res.json();
      if (data.success) {
        router.push('/admin/events');
      } else {
        alert(data.error || 'Failed to create event');
      }
    } catch (error) {
      console.error('Error creating event:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto py-6">
      <Link href="/admin/events" className="text-sm font-semibold text-gray-500 hover:text-white transition mb-6 block">
        &larr; Back to Events Manager
      </Link>

      <div className="mb-8 border-b border-white/5 pb-4">
        <h1 className="font-serif text-3xl text-white font-bold mb-1">Create New Event</h1>
        <p className="text-gray-400 text-xs">Schedule a new literary meeting, workshop, or contest.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 bg-slate-900/20 border border-white/5 p-6 rounded-2xl">
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Event Title *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="e.g. Annual Poetry Slam 2026"
            className="bg-slate-950 border border-white/10 text-white rounded-lg p-2.5 text-xs outline-none focus:border-violet-600 transition"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Description / Details *</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            rows={5}
            placeholder="Details about activities, instructions for registration, rules..."
            className="bg-slate-950 border border-white/10 text-white rounded-lg p-2.5 text-xs outline-none focus:border-violet-600 transition"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Poster Image URL</label>
          <input
            type="url"
            value={posterImage}
            onChange={(e) => setPosterImage(e.target.value)}
            placeholder="e.g. https://images.unsplash.com/..."
            className="bg-slate-950 border border-white/10 text-white rounded-lg p-2.5 text-xs outline-none focus:border-violet-600 transition"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Date *</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="bg-slate-950 border border-white/10 text-white rounded-lg p-2.5 text-xs outline-none focus:border-violet-600 transition"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Time (e.g. 3:00 PM - 5:00 PM)</label>
            <input
              type="text"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              placeholder="e.g. 4:00 PM - 6:00 PM"
              className="bg-slate-950 border border-white/10 text-white rounded-lg p-2.5 text-xs outline-none focus:border-violet-600 transition"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Venue *</label>
            <input
              type="text"
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              required
              placeholder="e.g. Seminar Hall, IET"
              className="bg-slate-950 border border-white/10 text-white rounded-lg p-2.5 text-xs outline-none focus:border-violet-600 transition"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Max Capacity (Empty = Unlimited)</label>
            <input
              type="number"
              value={maxCapacity}
              onChange={(e) => setMaxCapacity(e.target.value)}
              placeholder="e.g. 50"
              className="bg-slate-950 border border-white/10 text-white rounded-lg p-2.5 text-xs outline-none focus:border-violet-600 transition"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 py-2">
          <input
            type="checkbox"
            id="isComp"
            checked={isCompetition}
            onChange={(e) => setIsCompetition(e.target.checked)}
            className="w-4 h-4 rounded border-white/10 bg-slate-950 text-violet-600 focus:ring-violet-600"
          />
          <label htmlFor="isComp" className="text-xs text-gray-300 font-semibold cursor-pointer">
            This event is a competition (enables Winners Board uploads)
          </label>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-white/5">
          <Link
            href="/admin/events"
            className="py-2 px-5 bg-transparent border border-white/10 text-white hover:bg-white/5 rounded-full text-xs font-semibold"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="py-2 px-6 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-full text-xs font-semibold hover:shadow-lg transition"
          >
            {loading ? 'Scheduling...' : 'Schedule Event'}
          </button>
        </div>
      </form>
    </div>
  );
}
