// src/app/(admin)/admin/library/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, ClipboardList, Trash2, BookOpen, Edit } from 'lucide-react';

interface BookItem {
  id: string;
  title: string;
  author: string;
  totalCopies: number;
  issuedCopies: number;
  availabilityStatus: string;
}

export default function AdminLibraryListPage() {
  const [books, setBooks] = useState<BookItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBooks = async () => {
    try {
      const res = await fetch('/api/library');
      const data = await res.json();
      if (data.success) {
        setBooks(data.books);
      }
    } catch (error) {
      console.error('Failed to load books catalog:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this book? This will wipe reviews.')) return;

    try {
      const res = await fetch(`/api/admin/library/${id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        fetchBooks();
      } else {
        alert(data.error || 'Failed to delete book');
      }
    } catch (error) {
      console.error('Error deleting book:', error);
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
            Library Catalog Manager
          </h1>
          <p className="text-gray-500 dark:text-neutral-500 text-sm font-medium">
            Add, update, or remove physical books from the club catalog.
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/admin/library/issue-requests"
            className="py-2 px-5 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-black dark:text-white text-xs font-semibold rounded-full border border-gray-200 dark:border-white/5 transition flex items-center gap-1.5"
          >
            <ClipboardList className="w-3.5 h-3.5" />
            <span>Loan Requests</span>
          </Link>
          <Link
            href="/admin/library/new"
            className="py-2 px-6 bg-black dark:bg-white hover:bg-gray-900 dark:hover:bg-neutral-100 text-white dark:text-black text-xs font-semibold rounded-full transition-all duration-200 shadow-sm flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Book</span>
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="py-12 animate-pulse space-y-4">
          {[1, 2, 3].map(n => (
            <div key={n} className="h-20 bg-gray-100 dark:bg-neutral-900/60 rounded-2xl" />
          ))}
        </div>
      ) : books.length > 0 ? (
        <div className="bg-white dark:bg-neutral-900/30 border border-gray-200/80 dark:border-neutral-800 rounded-2xl overflow-hidden shadow-sm">
          {/* Header row (Desktop only) */}
          <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-4 bg-gray-50 dark:bg-neutral-900/80 border-b border-gray-200/80 dark:border-neutral-800 text-[10px] uppercase font-bold tracking-widest text-gray-500 dark:text-neutral-400">
            <div className="col-span-6">Book Detail</div>
            <div className="col-span-2">Availability</div>
            <div className="col-span-2">Copies (Total/Issued)</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>
          {/* List items */}
          <div className="divide-y divide-gray-100 dark:divide-neutral-800">
            {books.map((book) => (
              <div 
                key={book.id} 
                className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center px-6 py-5 hover:bg-gray-50/50 dark:hover:bg-neutral-800/20 transition duration-150"
              >
                {/* Book Details */}
                <div className="col-span-1 md:col-span-6 flex items-center gap-4">
                  <div className="p-3 bg-gray-100 dark:bg-neutral-800/50 rounded-xl text-gray-500 dark:text-neutral-400 shrink-0">
                    <BookOpen className="w-5 h-5 stroke-1.5" />
                  </div>
                  <div className="min-w-0">
                    <strong className="text-gray-900 dark:text-white font-semibold text-sm block truncate">
                      {book.title}
                    </strong>
                    <span className="text-gray-500 dark:text-neutral-500 text-[10px] font-medium block mt-0.5">
                      By {book.author}
                    </span>
                  </div>
                </div>
                
                {/* Availability */}
                <div className="col-span-1 md:col-span-2">
                  <span className={`inline-flex items-center gap-1.5 text-[10px] px-2.5 py-0.5 border rounded-full font-bold uppercase tracking-widest ${
                    book.availabilityStatus.toUpperCase() === 'AVAILABLE'
                      ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/30'
                      : 'bg-cyan-50 text-cyan-600 border-cyan-200 dark:bg-cyan-500/10 dark:text-cyan-400 dark:border-cyan-500/30'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      book.availabilityStatus.toUpperCase() === 'AVAILABLE' ? 'bg-emerald-500' : 'bg-cyan-500'
                    }`}></span>
                    {book.availabilityStatus.toLowerCase()}
                  </span>
                </div>

                {/* Copies */}
                <div className="col-span-1 md:col-span-2 text-xs text-gray-600 dark:text-neutral-400 font-medium">
                  <span className="md:hidden text-[10px] text-gray-400 uppercase tracking-wider block mb-1">Copies</span>
                  <span>{book.totalCopies} total</span>
                  <span className="mx-1 text-gray-300 dark:text-neutral-700">|</span>
                  <span className="text-gray-400">{book.issuedCopies} issued</span>
                </div>

                {/* Actions */}
                <div className="col-span-1 md:col-span-2 text-right flex justify-end gap-2">
                  <Link
                    href={`/admin/library/edit/${book.id}`}
                    className="w-8 h-8 flex items-center justify-center bg-gray-50 hover:bg-indigo-50 dark:bg-neutral-800 hover:dark:bg-indigo-500/10 text-gray-400 hover:text-indigo-600 dark:text-neutral-500 dark:hover:text-indigo-400 border border-gray-200 dark:border-neutral-700 hover:border-indigo-200 dark:hover:border-indigo-500/30 rounded-full transition-all cursor-pointer shadow-sm group"
                    title="Edit Book"
                  >
                    <Edit className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                  </Link>
                  <button
                    onClick={() => handleDelete(book.id)}
                    className="w-8 h-8 flex items-center justify-center bg-gray-50 hover:bg-red-50 dark:bg-neutral-800 hover:dark:bg-red-500/10 text-gray-400 hover:text-red-600 dark:text-neutral-500 dark:hover:text-red-400 border border-gray-200 dark:border-neutral-700 hover:border-red-200 dark:hover:border-red-500/30 rounded-full transition-all cursor-pointer shadow-sm group"
                    title="Delete Book"
                  >
                    <Trash2 className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-20 bg-gray-50/50 dark:bg-neutral-900/10 border border-gray-200/80 dark:border-neutral-800 rounded-2xl text-gray-400 dark:text-neutral-600 italic text-sm">
          No books have been cataloged yet.
        </div>
      )}
    </div>
  );
}
