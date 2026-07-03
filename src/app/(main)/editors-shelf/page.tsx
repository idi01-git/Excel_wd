// src/app/(main)/editors-shelf/page.tsx
'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import Link from 'next/link';

interface ShelfItem {
  id: string;
  title: string;
  author: string;
  coverImage?: string | null;
  editorialNote: string;
  genre: string[];
  slug: string;
  createdAt: string;
}

export default function EditorsShelfPage() {
  const { data: session } = useSession();
  const [items, setItems] = useState<ShelfItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [modalOpen, setModalOpen] = useState<boolean>(false);

  // Form Fields
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [editorialNote, setEditorialNote] = useState('');
  const [genreInput, setGenreInput] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchItems = async () => {
    try {
      const res = await fetch('/api/editors-shelf');
      const data = await res.json();
      if (data.success) {
        setItems(data.items);
      }
    } catch (error) {
      console.error('Failed to load shelf items:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !author || !editorialNote || saving) return;

    setSaving(true);
    const genre = genreInput.split(',').map(g => g.trim()).filter(Boolean);

    try {
      const res = await fetch('/api/admin/editors-shelf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, author, coverImage, editorialNote, genre })
      });
      const data = await res.json();
      if (data.success) {
        alert('Curated recommendation added successfully!');
        setModalOpen(false);
        // Reset fields
        setTitle('');
        setAuthor('');
        setCoverImage('');
        setEditorialNote('');
        setGenreInput('');
        fetchItems();
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error('Error adding shelf item:', error);
    } finally {
      setSaving(false);
    }
  };

  const isStaff = session?.user && (session.user.role === 'MODERATOR' || session.user.role === 'ADMIN');

  return (
    <div className="w-full max-w-6xl mx-auto py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 border-b border-gray-100 pb-6">
        <div>
          <h1 className="font-serif text-4xl text-black font-bold mb-2">Editor's Shelf</h1>
          <p className="text-gray-500 text-sm">Curated reading suggestions and critical reviews recommended by the Excelsior editorial board.</p>
        </div>
        {isStaff && (
          <button
            onClick={() => setModalOpen(true)}
            className="py-2 px-5 bg-black hover:bg-gray-900 text-white text-xs font-semibold rounded-full transition shadow-sm"
          >
            + Add Recommendation
          </button>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-pulse">
          {[1, 2].map(n => <div key={n} className="h-64 bg-gray-50 border border-gray-200/50 rounded-2xl" />)}
        </div>
      ) : items.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {items.map((item) => (
            <article
              key={item.id}
              className="group bg-white border border-gray-200 hover:border-gray-300 hover:shadow-lg transition duration-300 rounded-2xl overflow-hidden flex flex-col md:flex-row h-full"
            >
              {/* Cover */}
              <div className="relative md:w-2/5 h-48 md:h-auto border-r border-gray-150 overflow-hidden">
                <img
                  src={item.coverImage || 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=400&h=600&fit=crop'}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-103 transition duration-500"
                />
              </div>

              {/* Details */}
              <div className="p-6 md:w-3/5 flex flex-col flex-grow text-black">
                <div className="flex flex-wrap gap-1.5 mb-2.5">
                  {item.genre.slice(0, 3).map(g => (
                    <span key={g} className="text-[9px] font-bold bg-gray-50 text-gray-500 border border-gray-200 px-2 py-0.5 rounded-full uppercase tracking-wider">
                      {g}
                    </span>
                  ))}
                </div>

                <h3 className="font-serif text-lg font-bold text-black mb-1 group-hover:text-black transition">
                  <Link href={`/editors-shelf/${item.slug}`}>{item.title}</Link>
                </h3>
                <p className="text-xs text-gray-400 mb-3">By {item.author}</p>
                
                <p className="text-gray-600 text-xs leading-relaxed line-clamp-3 mb-4">
                  {item.editorialNote}
                </p>

                <div className="mt-auto pt-4 border-t border-gray-100 flex justify-between items-center">
                  <span className="text-[10px] text-gray-400">
                    Added {new Date(item.createdAt).toLocaleDateString()}
                  </span>
                  <Link
                    href={`/editors-shelf/${item.slug}`}
                    className="text-xs font-semibold text-black hover:underline transition"
                  >
                    Read Note & Discuss &rarr;
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-gray-50 border border-gray-200 rounded-2xl text-gray-400 italic text-sm">
          No recommended items on the shelf yet.
        </div>
      )}

      {/* Staff Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white border border-gray-250 rounded-3xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl text-black">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3 mb-5">
              <h3 className="font-serif text-lg text-black font-bold">New Reading Recommendation</h3>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-black"></button>
            </div>
            
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Ficciones"
                  required
                  className="bg-gray-50 border border-gray-200 text-black rounded-xl p-2.5 text-xs outline-none focus:border-black transition"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Author</label>
                <input
                  type="text"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="e.g. Jorge Luis Borges"
                  required
                  className="bg-gray-50 border border-gray-200 text-black rounded-xl p-2.5 text-xs outline-none focus:border-black transition"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Cover Image URL</label>
                <input
                  type="text"
                  value={coverImage}
                  onChange={(e) => setCoverImage(e.target.value)}
                  placeholder="e.g. https://..."
                  className="bg-gray-50 border border-gray-200 text-black rounded-xl p-2.5 text-xs outline-none focus:border-black transition"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Genres (comma separated)</label>
                <input
                  type="text"
                  value={genreInput}
                  onChange={(e) => setGenreInput(e.target.value)}
                  placeholder="e.g. Fiction, Magical Realism"
                  className="bg-gray-50 border border-gray-200 text-black rounded-xl p-2.5 text-xs outline-none focus:border-black transition"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Editorial Note</label>
                <textarea
                  value={editorialNote}
                  onChange={(e) => setEditorialNote(e.target.value)}
                  placeholder="Why is this recommended? Write a critique..."
                  rows={4}
                  required
                  className="bg-gray-50 border border-gray-200 text-black rounded-xl p-2.5 text-xs outline-none focus:border-black transition"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="py-1.5 px-4 bg-transparent border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-full text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="py-1.5 px-5 bg-black text-white rounded-full text-xs font-semibold hover:bg-gray-900 transition shadow-sm"
                >
                  {saving ? 'Adding...' : 'Post Recommendation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
