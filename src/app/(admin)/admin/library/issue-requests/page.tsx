// src/app/(admin)/admin/library/issue-requests/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface RequestItem {
  id: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'RETURNED';
  requestDate: string;
  issueDate?: string | null;
  returnDate?: string | null;
  adminNote?: string | null;
  book: {
    title: string;
    author: string;
  };
  requester: {
    name: string;
    username: string;
    email: string;
  };
}

export default function AdminLoansPage() {
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  // Note Modal state
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState('');
  const [adminNote, setAdminNote] = useState('');

  const fetchRequests = async () => {
    try {
      const res = await fetch('/api/admin/library/issue-requests');
      const data = await res.json();
      if (data.success) {
        setRequests(data.requests);
      }
    } catch (error) {
      console.error('Failed to load issue requests:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleAction = async (id: string, action: 'APPROVE' | 'REJECT' | 'RETURN', note?: string) => {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/admin/library/issue-requests/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, adminNote: note })
      });
      const data = await res.json();
      if (data.success) {
        fetchRequests();
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error('Error executing loan action:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const openRejectModal = (id: string) => {
    setSelectedRequestId(id);
    setAdminNote('');
    setNoteModalOpen(true);
  };

  const handleRejectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setNoteModalOpen(false);
    handleAction(selectedRequestId, 'REJECT', adminNote);
  };

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

  return (
    <div className="w-full max-w-5xl mx-auto py-6">
      {/* Back button */}
      <Link href="/profile" className="text-sm font-semibold text-gray-500 hover:text-white transition mb-6 block">
        &larr; Back to Dashboard
      </Link>

      <div className="mb-8 border-b border-white/5 pb-5 flex justify-between items-end flex-wrap gap-4">
        <div>
          <h1 className="font-serif text-3xl text-white font-bold mb-1">Issue Approvals Queue</h1>
          <p className="text-gray-400 text-sm">Fulfill or return physical books requested by members.</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/admin/library"
            className="py-1.5 px-4 bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-semibold text-white rounded-full transition"
          >
            📚 Catalog List
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
          {[1, 2].map(n => <div key={n} className="h-16 bg-slate-900/60 rounded-xl" />)}
        </div>
      ) : requests.length > 0 ? (
        <div className="bg-slate-900/30 border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs text-gray-300">
              <thead>
                <tr className="bg-slate-950 border-b border-white/5 text-[10px] uppercase font-bold text-gray-500">
                  <th className="p-4 pl-6">Book / Author</th>
                  <th className="p-4">Requested By</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Date Logs</th>
                  <th className="p-4 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {requests.map((req) => (
                  <tr key={req.id} className="hover:bg-white/2 transition duration-150">
                    <td className="p-4 pl-6">
                      <strong className="text-white text-sm block">{req.book.title}</strong>
                      <span className="text-gray-500 text-[10px]">{req.book.author}</span>
                    </td>
                    <td className="p-4">
                      <strong className="text-white block">{req.requester.name}</strong>
                      <span className="text-gray-500 text-[10px]">@{req.requester.username}</span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 border rounded uppercase text-[8px] font-bold ${getStatusBadge(req.status)}`}>
                        {req.status.toLowerCase()}
                      </span>
                    </td>
                    <td className="p-4 text-gray-500 space-y-0.5">
                      <p>Req: {new Date(req.requestDate).toLocaleDateString()}</p>
                      {req.issueDate && <p>Issued: {new Date(req.issueDate).toLocaleDateString()}</p>}
                      {req.returnDate && <p>Ret: {new Date(req.returnDate).toLocaleDateString()}</p>}
                    </td>
                    <td className="p-4 pr-6 text-right">
                      {actionLoading === req.id ? (
                        <span className="text-gray-500 text-[10px]">Syncing...</span>
                      ) : (
                        <div className="flex justify-end gap-1.5">
                          {req.status === 'PENDING' && (
                            <>
                              <button
                                onClick={() => handleAction(req.id, 'APPROVE')}
                                className="py-1 px-3 bg-emerald-600/10 border border-emerald-500/25 hover:bg-emerald-600 text-emerald-400 hover:text-white rounded font-bold transition text-[10px]"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => openRejectModal(req.id)}
                                className="py-1 px-3 bg-red-600/10 border border-red-500/25 hover:bg-red-600 text-red-400 hover:text-white rounded font-bold transition text-[10px]"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          {req.status === 'APPROVED' && (
                            <button
                              onClick={() => handleAction(req.id, 'RETURN')}
                              className="py-1 px-3 bg-cyan-600/10 border border-cyan-500/25 hover:bg-cyan-600 text-cyan-400 hover:text-white rounded font-bold transition text-[10px]"
                            >
                              Mark Returned
                            </button>
                          )}
                          {req.status === 'REJECTED' && <span className="text-red-500/40">Rejected</span>}
                          {req.status === 'RETURNED' && <span className="text-emerald-500/40">Returned</span>}
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
          No loan requests have been submitted.
        </div>
      )}

      {/* Note modal (Reason for Rejection) */}
      {noteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-950 border border-white/10 rounded-2xl p-6 max-w-xs w-full shadow-2xl animate-in fade-in duration-200">
            <div className="flex justify-between items-center border-b border-white/5 pb-3 mb-5">
              <h3 className="font-serif text-base text-white font-bold">Add Rejection Note</h3>
              <button onClick={() => setNoteModalOpen(false)} className="text-gray-500 hover:text-white"></button>
            </div>

            <form onSubmit={handleRejectSubmit} className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Note / Reason</label>
                <input
                  type="text"
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  placeholder="e.g. Out of stock, library closed"
                  required
                  className="bg-slate-900 border border-white/10 text-white rounded-lg p-2 text-xs focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setNoteModalOpen(false)}
                  className="py-1.5 px-4 bg-transparent border border-white/10 text-white hover:bg-white/5 rounded-full text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-1.5 px-5 bg-red-600 text-white rounded-full text-xs font-semibold hover:shadow-lg transition"
                >
                  Confirm Reject
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
