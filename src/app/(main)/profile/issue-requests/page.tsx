// src/app/(main)/profile/issue-requests/page.tsx
'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, AlertCircle, Calendar } from 'lucide-react';
import { motion } from 'motion/react';

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
        return 'bg-gray-100 text-gray-600 border-gray-250 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700';
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4 animate-pulse space-y-6">
        <div className="h-4 bg-gray-200 dark:bg-neutral-900 w-24 mb-6 rounded"></div>
        <div className="h-10 bg-gray-200 dark:bg-neutral-900 w-1/3 mb-10 rounded"></div>
        {[1, 2].map(n => (
          <div key={n} className="h-40 bg-gray-200 dark:bg-neutral-900 rounded-2xl border border-gray-200 dark:border-neutral-800" />
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 text-black dark:text-white font-sans">
      {/* Back button */}
      <Link 
        href="/profile" 
        className="text-sm font-semibold text-gray-500 hover:text-black dark:hover:text-white transition flex items-center gap-1.5 mb-6 w-fit"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Profile</span>
      </Link>

      {/* Header */}
      <div className="border-b border-gray-200/80 dark:border-neutral-800 pb-5 mb-8">
        <h1 className="font-serif text-3xl text-gray-900 dark:text-white font-bold mb-1">My Book Loans</h1>
        <p className="text-gray-500 dark:text-neutral-500 text-sm font-medium">Monitor physical book borrow requests and library checkouts.</p>
      </div>

      {requests.length > 0 ? (
        <div className="flex flex-col gap-6">
          {requests.map((req) => (
            <motion.div
              key={req.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="flex flex-col sm:flex-row gap-5 items-start p-5 rounded-2xl border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm"
            >
              {/* Cover Mini */}
              <div className="shrink-0 w-20 sm:w-24 aspect-[2/3] rounded-md overflow-hidden border border-gray-100 dark:border-neutral-800">
                <img
                  src={req.book.coverImage || 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=100&h=150&fit=crop'}
                  alt={req.book.title}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Info & Metadata */}
              <div className="flex flex-col flex-grow w-full">
                <div className="flex justify-between items-start mb-1 flex-wrap gap-2">
                  <h4 className="font-serif font-bold text-lg text-black dark:text-white line-clamp-1 hover:text-violet-600 dark:hover:text-cyan-400 transition cursor-pointer">
                    <Link href={`/community/library/${req.bookId}`}>
                      {req.book.title}
                    </Link>
                  </h4>
                  
                  {/* Status Badge */}
                  <span className={`text-[9px] font-bold px-2.5 py-0.5 border rounded-full uppercase tracking-wider shrink-0 ${getStatusBadge(req.status)}`}>
                    {req.status}
                  </span>
                </div>
                
                <p className="text-xs text-gray-500 dark:text-neutral-400 mb-4">by {req.book.author}</p>

                {/* Dates log */}
                <div className="text-xs text-gray-700 dark:text-neutral-300 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-auto pt-4 border-t border-gray-100 dark:border-neutral-800/60 w-full">
                  <span className="flex items-center gap-1.5 font-medium">
                    <Calendar size={14} className="text-gray-400 shrink-0" /> 
                    Requested: {new Date(req.requestDate).toLocaleDateString()}
                  </span>
                  {req.issueDate && (
                    <span className="flex items-center gap-1.5 font-medium">
                      <Calendar size={14} className="text-gray-400 shrink-0" /> 
                      Issued: {new Date(req.issueDate).toLocaleDateString()}
                    </span>
                  )}
                  {req.returnDate && (
                    <span className="flex items-center gap-1.5 font-medium">
                      <Calendar size={14} className="text-gray-400 shrink-0" /> 
                      Returned: {new Date(req.returnDate).toLocaleDateString()}
                    </span>
                  )}
                </div>

                {req.adminNote && (
                  <div className="text-xs bg-red-50/50 dark:bg-red-950/10 border border-red-200/50 dark:border-red-500/20 text-red-750 dark:text-red-300 p-2.5 rounded-lg italic mt-3 flex items-start gap-1.5 font-medium">
                    <AlertCircle size={14} className="shrink-0 mt-0.5" />
                    <span>Reason: "{req.adminNote}"</span>
                  </div>
                )}
              </div>
            </motion.div>
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
