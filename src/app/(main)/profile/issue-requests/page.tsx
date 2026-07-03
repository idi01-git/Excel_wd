// src/app/(main)/profile/issue-requests/page.tsx
'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';

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
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'APPROVED':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'REJECTED':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      default:
        return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto py-16 animate-pulse space-y-4">
        {[1, 2].map(n => <div key={n} className="h-20 bg-slate-900/60 rounded-xl" />)}
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-4">
      {/* Header */}
      <div className="border-b border-white/5 pb-5 mb-8">
        <h1 className="font-serif text-3xl text-white font-bold mb-1">My Book Loans</h1>
        <p className="text-gray-400 text-sm">Monitor physical book borrow requests and library checkouts.</p>
      </div>

      {requests.length > 0 ? (
        <div className="space-y-4">
          {requests.map((req) => (
            <div
              key={req.id}
              className="bg-slate-900/30 border border-white/5 p-5 rounded-2xl flex gap-4 items-center shadow-lg hover:border-white/10 transition duration-300"
            >
              {/* Cover mini */}
              <img
                src={req.book.coverImage || 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=100&h=150&fit=crop'}
                alt=""
                className="w-12 h-16 object-cover rounded border border-white/10"
              />

              <div className="flex-grow min-w-0">
                <div className="flex items-center justify-between mb-1.5 flex-wrap gap-2">
                  <h3 className="font-serif text-sm font-bold text-white truncate max-w-xs sm:max-w-md">
                    <Link href={`/community/library/${req.bookId}`} className="hover:text-cyan-400 transition">
                      {req.book.title}
                    </Link>
                  </h3>
                  
                  <span className={`text-[9px] font-bold px-2 py-0.5 border rounded uppercase ${getStatusBadge(req.status)}`}>
                    {req.status.toLowerCase()}
                  </span>
                </div>

                <p className="text-[10px] text-gray-500 mb-2">By {req.book.author}</p>
                
                <div className="text-[9px] text-gray-600 flex gap-4 flex-wrap mt-2">
                  <p>Requested: <strong>{new Date(req.requestDate).toLocaleDateString()}</strong></p>
                  {req.issueDate && <p>Issued: <strong>{new Date(req.issueDate).toLocaleDateString()}</strong></p>}
                  {req.returnDate && <p>Returned: <strong>{new Date(req.returnDate).toLocaleDateString()}</strong></p>}
                </div>

                {req.adminNote && (
                  <p className="text-[10px] bg-slate-950/40 border border-white/5 text-gray-400 p-2.5 rounded-lg italic mt-3.5">
                    Note: "{req.adminNote}"
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-slate-900/10 border border-white/5 rounded-2xl text-gray-500 italic">
          You haven't requested to borrow any books yet.
        </div>
      )}
    </div>
  );
}
