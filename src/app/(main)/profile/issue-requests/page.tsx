// src/app/(main)/profile/issue-requests/page.tsx
'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, BookOpen, Clock, AlertCircle } from 'lucide-react';

interface RequestItem {
  id: string;
  bookId: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'RETURNED';
  requestDate: string;
  issueDate?: string | null;
  returnDate?: string | null;
  adminNote?: string | null;
  book: {
    title: string;
    author: string;
    coverImage?: string | null;
  };
}

export default function ProfileLoansPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (status === 'authenticated') {
      const fetchLoans = async () => {
        try {
          const res = await fetch('/api/profile/issue-requests');
          const data = await res.json();
          if (data.success) {
            setRequests(data.requests);
          }
        } catch (error) {
          console.error('Failed to load borrow logs:', error);
        } finally {
          setLoading(false);
        }
      };
      fetchLoans();
    }
  }, [status]);

  const getStatusBadge = (s: string) => {
    switch (s) {
      case 'PENDING':
        return 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/30';
      case 'APPROVED':
        return 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/30';
      case 'REJECTED':
        return 'bg-red-50 text-red-600 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/30';
      case 'RETURNED':
        return 'bg-violet-50 text-violet-650 border-violet-250 dark:bg-violet-500/10 dark:text-violet-400 dark:border-violet-500/30';
      default:
        return 'bg-gray-100 text-gray-650 border-gray-250 dark:bg-neutral-800 dark:text-neutral-450 dark:border-neutral-700';
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto py-16 px-4 animate-pulse space-y-4">
        <div className="h-8 bg-gray-250 dark:bg-neutral-900/60 rounded w-1/3 mb-10"></div>
        {[1, 2, 3].map(n => <div key={n} className="h-20 bg-gray-250 dark:bg-neutral-900/60 rounded-2xl" />)}
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 text-black dark:text-white">
      {/* Back button */}
      <Link href="/profile" className="text-sm font-semibold text-gray-500 hover:text-black dark:hover:text-white transition flex items-center gap-1.5 mb-6">
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Profile</span>
      </Link>

      {/* Header */}
      <div className="border-b border-gray-200/60 dark:border-white/5 pb-5 mb-8">
        <h1 className="font-serif text-3xl text-gray-900 dark:text-white font-bold mb-1">My Book Loans</h1>
        <p className="text-gray-500 dark:text-neutral-450 text-sm font-medium">Monitor physical book borrow requests and library checkouts.</p>
      </div>

      {requests.length > 0 ? (
        <div className="space-y-4">
          {requests.map((req) => (
            <div
              key={req.id}
              className="bg-white dark:bg-neutral-900/30 border border-gray-200/80 dark:border-white/5 p-5 rounded-2xl flex gap-4 items-center shadow-sm hover:border-gray-300 dark:hover:border-neutral-750 transition duration-150"
            >
              {/* Cover mini */}
              <div className="w-12 h-18 rounded-lg overflow-hidden border border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-950 shrink-0 shadow-sm">
                <img
                  src={req.book.coverImage || 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=100&h=150&fit=crop'}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex-grow min-w-0">
                <div className="flex items-center justify-between mb-1.5 flex-wrap gap-2">
                  <h3 className="font-serif text-sm font-bold text-gray-900 dark:text-white truncate max-w-xs sm:max-w-md">
                    <Link href={`/community/library/${req.bookId}`} className="hover:text-violet-650 dark:hover:text-cyan-400 transition">
                      {req.book.title}
                    </Link>
                  </h3>
                  
                  <span className={`text-[8px] font-bold px-2 py-0.5 border rounded-full uppercase tracking-wider ${getStatusBadge(req.status)}`}>
                    {req.status.toLowerCase()}
                  </span>
                </div>

                <p className="text-[10px] text-gray-450 dark:text-neutral-500 mb-2 font-medium">By {req.book.author}</p>
                
                <div className="text-[9px] text-gray-500 flex gap-4 flex-wrap mt-2 font-medium">
                  <p>Requested: <strong className="text-gray-700 dark:text-neutral-300">{new Date(req.requestDate).toLocaleDateString()}</strong></p>
                  {req.issueDate && <p>Issued: <strong className="text-gray-700 dark:text-neutral-300">{new Date(req.issueDate).toLocaleDateString()}</strong></p>}
                  {req.returnDate && <p>Returned: <strong className="text-gray-700 dark:text-neutral-300">{new Date(req.returnDate).toLocaleDateString()}</strong></p>}
                </div>

                {req.adminNote && (
                  <div className="text-[10px] bg-red-50/50 dark:bg-red-950/10 border border-red-200/50 dark:border-red-500/20 text-red-750 dark:text-red-300 p-2.5 rounded-lg italic mt-3 flex items-start gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <span>Reason: "{req.adminNote}"</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-gray-50/50 dark:bg-neutral-900/10 border border-gray-200/80 dark:border-neutral-800 rounded-2xl text-gray-500 italic text-sm">
          You haven't requested to borrow any books yet.
        </div>
      )}
    </div>
  );
}
