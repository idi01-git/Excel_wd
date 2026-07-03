// src/app/(admin)/admin/library/new/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminNewBookPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [description, setDescription] = useState('');
  const [genre, setGenre] = useState('');
  const [isbn, setIsbn] = useState('');
  const [pageCount, setPageCount] = useState('');
  const [publishedYear, setPublishedYear] = useState('');
  const [totalCopies, setTotalCopies] = useState('1');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    try {
      const res = await fetch('/api/admin/library', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          author,
          coverImage,
          description,
          genre,
          isbn,
          pageCount,
          publishedYear,
          totalCopies
        })
      });
      const data = await res.json();
      if (data.success) {
        router.push('/admin/library');
      } else {
        alert(data.error || 'Failed to catalog book');
      }
    } catch (error) {
      console.error('Error adding book:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto py-6">
      <Link href="/admin/library" className="text-sm font-semibold text-gray-500 hover:text-white transition mb-6 block">
        &larr; Back to Catalog Manager
      </Link>

      <div className="mb-8 border-b border-white/5 pb-4">
        <h1 className="font-serif text-3xl text-white font-bold mb-1">Catalog New Book</h1>
        <p className="text-gray-400 text-xs">Add a new physical copy to the library archives.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 bg-slate-900/20 border border-white/5 p-6 rounded-2xl">
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Book Title *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="e.g. One Hundred Years of Solitude"
            className="bg-slate-950 border border-white/10 text-white rounded-lg p-2.5 text-xs outline-none focus:border-violet-600 transition"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Author *</label>
          <input
            type="text"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            required
            placeholder="e.g. Gabriel García Márquez"
            className="bg-slate-950 border border-white/10 text-white rounded-lg p-2.5 text-xs outline-none focus:border-violet-600 transition"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Cover Image URL</label>
          <input
            type="url"
            value={coverImage}
            onChange={(e) => setCoverImage(e.target.value)}
            placeholder="e.g. https://images.unsplash.com/..."
            className="bg-slate-950 border border-white/10 text-white rounded-lg p-2.5 text-xs outline-none focus:border-violet-600 transition"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Synopsis / Description *</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            rows={4}
            placeholder="Write a brief summary of the book content and themes..."
            className="bg-slate-950 border border-white/10 text-white rounded-lg p-2.5 text-xs outline-none focus:border-violet-600 transition"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Genres (comma separated)</label>
            <input
              type="text"
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              placeholder="e.g. Fiction, Magical Realism"
              className="bg-slate-950 border border-white/10 text-white rounded-lg p-2.5 text-xs outline-none focus:border-violet-600 transition"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Total Copies Owned *</label>
            <input
              type="number"
              value={totalCopies}
              onChange={(e) => setTotalCopies(e.target.value)}
              required
              min="1"
              className="bg-slate-950 border border-white/10 text-white rounded-lg p-2.5 text-xs outline-none focus:border-violet-600 transition"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">ISBN</label>
            <input
              type="text"
              value={isbn}
              onChange={(e) => setIsbn(e.target.value)}
              placeholder="ISBN code"
              className="bg-slate-950 border border-white/10 text-white rounded-lg p-2.5 text-xs outline-none focus:border-violet-600 transition"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Page Count</label>
            <input
              type="number"
              value={pageCount}
              onChange={(e) => setPageCount(e.target.value)}
              placeholder="Pages"
              className="bg-slate-950 border border-white/10 text-white rounded-lg p-2.5 text-xs outline-none focus:border-violet-600 transition"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Published Year</label>
            <input
              type="number"
              value={publishedYear}
              onChange={(e) => setPublishedYear(e.target.value)}
              placeholder="e.g. 1967"
              className="bg-slate-950 border border-white/10 text-white rounded-lg p-2.5 text-xs outline-none focus:border-violet-600 transition"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-white/5">
          <Link
            href="/admin/library"
            className="py-2 px-5 bg-transparent border border-white/10 text-white hover:bg-white/5 rounded-full text-xs font-semibold"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="py-2 px-6 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-full text-xs font-semibold hover:shadow-lg transition"
          >
            {loading ? 'Adding...' : 'Catalog Book'}
          </button>
        </div>
      </form>
    </div>
  );
}
