// src/app/(admin)/admin/library/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

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
    <div className="w-full max-w-5xl mx-auto py-6">
      <Link href="/profile" className="text-sm font-semibold text-gray-500 hover:text-white transition mb-6 block">
        &larr; Back to Dashboard
      </Link>

      <div className="mb-8 border-b border-white/5 pb-5 flex justify-between items-end flex-wrap gap-4">
        <div>
          <h1 className="font-serif text-3xl text-white font-bold mb-1">Library Catalog Manager</h1>
          <p className="text-gray-400 text-sm">Add, update, or remove physical books from the club catalog.</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/admin/library/issue-requests"
            className="py-1.5 px-4 bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-semibold text-white rounded-full transition"
          >
            📋 Loan Requests Queue
          </Link>
          <Link
            href="/admin/library/new"
            className="py-1.5 px-4 bg-violet-600 hover:bg-violet-700 text-xs font-semibold text-white rounded-full transition"
          >
             Catalog New Book
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="py-12 animate-pulse space-y-4">
          {[1, 2].map(n => <div key={n} className="h-14 bg-slate-900/60 rounded-xl" />)}
        </div>
      ) : books.length > 0 ? (
        <div className="bg-slate-900/30 border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
          <table className="w-full text-left border-collapse text-xs text-gray-300">
            <thead>
              <tr className="bg-slate-950 border-b border-white/5 text-[10px] uppercase font-bold text-gray-500">
                <th className="p-4 pl-6">Book Detail</th>
                <th className="p-4">Availability</th>
                <th className="p-4">Copies (Total/Issued)</th>
                <th className="p-4 pr-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {books.map((book) => (
                <tr key={book.id} className="hover:bg-white/2 transition duration-150">
                  <td className="p-4 pl-6">
                    <strong className="text-white text-sm block">{book.title}</strong>
                    <span className="text-gray-500 text-[10px]">By {book.author}</span>
                  </td>
                  <td className="p-4">
                    <span className="text-[10px] text-gray-400 capitalize">{book.availabilityStatus.toLowerCase()}</span>
                  </td>
                  <td className="p-4 text-gray-400">
                    {book.totalCopies} copies ({book.issuedCopies} checked out)
                  </td>
                  <td className="p-4 pr-6 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleDelete(book.id)}
                        className="py-1 px-3 bg-red-600/10 border border-red-500/25 hover:bg-red-600 text-red-400 hover:text-white rounded font-semibold transition text-[10px]"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-20 bg-slate-900/10 border border-white/5 rounded-2xl text-gray-500 italic">
          No books have been cataloged yet.
        </div>
      )}
    </div>
  );
}
