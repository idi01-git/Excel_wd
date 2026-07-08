'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, BookOpen, Clock, Check, X, Undo2, Calendar, AlertCircle, Loader2, Search, History, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface RequestItem {
  id: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'RETURNED';
  requestDate: string;
  issueDate?: string | null;
  returnDate?: string | null;
  dueDate?: string | null;
  adminNote?: string | null;
  book: {
    id: string;
    title: string;
    author: string;
    coverImage: string | null;
  };
  requester: {
    id: string;
    name: string;
    username: string;
    email: string;
    profilePhoto: string | null;
  };
}

interface BookLog {
  id: string;
  title: string;
  author: string;
  coverImage: string | null;
  totalCopies: number;
  issuedCopies: number;
  createdAt: string;
  issueRequests: Array<{
    id: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'RETURNED';
    requestDate: string;
    issueDate: string | null;
    returnDate: string | null;
    dueDate: string | null;
    adminNote: string | null;
    requester: {
      id: string;
      name: string;
      email: string;
      profilePhoto: string | null;
    };
  }>;
}

interface TimelineEvent {
  id: string;
  type: 'BOOK_ADDED' | 'REQUESTED' | 'APPROVED' | 'REJECTED' | 'RETURNED';
  date: string;
  user?: { name: string; email: string; profilePhoto: string | null };
  note?: string;
  dueDate?: string | null;
}

type FilterType = 'all' | 'pending' | 'active';

export default function StunningAdminLoansPage() {
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionError, setActionError] = useState('');

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [tableDueDates, setTableDueDates] = useState<Record<string, string>>({});

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerBook, setDrawerBook] = useState<BookLog | null>(null);
  const [drawerLoading, setDrawerLoading] = useState(false);

  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [targetRejectReq, setTargetRejectReq] = useState<RequestItem | null>(null);
  const [adminNote, setAdminNote] = useState('');

  const fetchRequests = async () => {
    try {
      const res = await fetch('/api/admin/library/issue-requests');
      const data = await res.json();
      if (data.success) {
        setRequests(data.requests);
        
        const datesMap: Record<string, string> = {};
        data.requests.forEach((req: RequestItem) => {
          if (req.status === 'PENDING') {
            datesMap[req.id] = req.dueDate 
              ? new Date(req.dueDate).toISOString().split('T')[0]
              : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          }
        });
        setTableDueDates(datesMap);
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

  const handleAction = async (id: string, action: 'APPROVE' | 'REJECT' | 'RETURN', customDate?: string, note?: string) => {
    setActionLoading(id);
    setActionError('');
    try {
      const body: any = { action, adminNote: note };
      if (action === 'APPROVE' && customDate) {
        body.dueDate = customDate;
      }
      
      const res = await fetch(`/api/admin/library/issue-requests/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (data.success) {
        fetchRequests();
        if (drawerOpen && drawerBook) {
          fetchBookLogs(drawerBook.id);
        }
      } else {
        setActionError(data.error || 'Failed to update request status');
      }
    } catch (error) {
      console.error('Error executing loan action:', error);
      setActionError('Network error occurred');
    } finally {
      setActionLoading(null);
    }
  };

  const openRejectModal = (req: RequestItem) => {
    setTargetRejectReq(req);
    setAdminNote('');
    setRejectModalOpen(true);
  };

  const handleRejectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetRejectReq) return;
    setRejectModalOpen(false);
    handleAction(targetRejectReq.id, 'REJECT', undefined, adminNote);
  };

  const fetchBookLogs = async (bookId: string) => {
    setDrawerLoading(true);
    setDrawerOpen(true);
    try {
      const res = await fetch('/api/admin/library/logs');
      const data = await res.json();
      if (data.success) {
        const found = data.books.find((b: BookLog) => b.id === bookId);
        if (found) {
          setDrawerBook(found);
        }
      }
    } catch (error) {
      console.error('Error fetching book logs:', error);
    } finally {
      setDrawerLoading(false);
    }
  };

  const generateTimeline = (book: BookLog): TimelineEvent[] => {
    const events: TimelineEvent[] = [];
    events.push({ id: `added-${book.id}`, type: 'BOOK_ADDED', date: book.createdAt, note: 'Book was added to catalog' });

    book.issueRequests.forEach((req) => {
      if (req.requestDate) events.push({ id: `req-${req.id}`, type: 'REQUESTED', date: req.requestDate, user: req.requester, dueDate: req.dueDate });
      if (req.issueDate && (req.status === 'APPROVED' || req.status === 'RETURNED')) {
        events.push({ id: `app-${req.id}`, type: 'APPROVED', date: req.issueDate, user: req.requester, note: req.adminNote || undefined, dueDate: req.dueDate });
      } else if (req.status === 'REJECTED') {
        events.push({ id: `rej-${req.id}`, type: 'REJECTED', date: req.issueDate || req.requestDate, user: req.requester, note: req.adminNote || undefined });
      }
      if (req.returnDate && req.status === 'RETURNED') {
        events.push({ id: `ret-${req.id}`, type: 'RETURNED', date: req.returnDate, user: req.requester });
      }
    });

    return events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  const filteredRequests = requests.filter(req => {
    const matchesSearch = req.book.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          req.book.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          req.requester.name.toLowerCase().includes(searchQuery.toLowerCase());
    if (activeFilter === 'pending') return matchesSearch && req.status === 'PENDING';
    if (activeFilter === 'active') return matchesSearch && req.status === 'APPROVED';
    return matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white selection:bg-indigo-500/30 font-sans relative overflow-x-hidden">
      
      {/* Premium Ambient Background Effects */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] rounded-full bg-violet-600/10 blur-[100px] pointer-events-none" />

      <div className="w-full max-w-6xl mx-auto py-10 px-6 relative z-10">
        
        {/* Navigation */}
        <Link 
          href="/admin/library" 
          className="inline-flex items-center text-sm font-semibold text-gray-400 hover:text-white transition-colors flex items-center gap-2 mb-8 group"
        >
          <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-white/10 transition-all">
            <ArrowLeft className="w-4 h-4" />
          </div>
          <span className="tracking-wide">Back to Library Dashboard</span>
        </Link>

        {/* Spectacular Header */}
        <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <h1 className="font-serif text-5xl md:text-6xl font-black leading-tight mb-3 text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-gray-400 flex items-center gap-4">
              Issue Requests
              <Sparkles className="w-8 h-8 text-indigo-400 hidden md:block" />
            </h1>
            <p className="text-gray-400 text-base md:text-lg max-w-2xl font-light">
              Manage physical book reservations and track their complete lifecycle.
            </p>
          </motion.div>
        </div>

        {actionError && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="mb-8 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-sm text-red-200 flex items-center gap-3 backdrop-blur-md shadow-lg shadow-red-500/5">
            <AlertCircle className="w-5 h-5 shrink-0 text-red-400" />
            {actionError}
          </motion.div>
        )}

        {/* Filters and Search Bar - Premium Glassmorphism */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
          className="flex flex-col md:flex-row gap-4 items-center justify-between mb-8 p-2 bg-white/[0.02] border border-white/5 rounded-3xl backdrop-blur-xl shadow-2xl"
        >
          <div className="relative w-full md:max-w-md">
            <Search className="w-5 h-5 text-gray-500 absolute left-5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by book, author, or reader..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent text-white placeholder:text-gray-500 rounded-full pl-13 pr-6 py-4 text-sm outline-none transition focus:bg-white/5 border border-transparent focus:border-white/10"
            />
          </div>

          <div className="flex bg-black/40 p-1.5 rounded-full border border-white/5 text-xs font-bold uppercase tracking-wider w-full md:w-auto">
            {(['all', 'pending', 'active'] as FilterType[]).map((tab) => {
              const count = tab === 'all' 
                ? requests.length 
                : tab === 'pending'
                  ? requests.filter(r => r.status === 'PENDING').length
                  : requests.filter(r => r.status === 'APPROVED').length;

              return (
                <button
                  key={tab}
                  onClick={() => setActiveFilter(tab)}
                  className={`flex-1 md:flex-initial md:px-8 py-3 rounded-full text-center transition-all duration-300 cursor-pointer ${
                    activeFilter === tab 
                      ? 'bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/25' 
                      : 'text-gray-500 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {tab} <span className="ml-1 opacity-70">({count})</span>
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Requests List */}
        {loading ? (
          <div className="py-20 flex justify-center">
            <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
          </div>
        ) : filteredRequests.length > 0 ? (
          <div className="grid gap-4">
            <AnimatePresence>
              {filteredRequests.map((req, index) => {
                const isPending = req.status === 'PENDING';
                const isApproved = req.status === 'APPROVED';
                const isOverdue = isApproved && req.dueDate && new Date(req.dueDate) < new Date();
                
                return (
                  <motion.div 
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: index * 0.05 }}
                    key={req.id} 
                    className="group relative bg-white/[0.03] border border-white/10 hover:border-indigo-500/30 rounded-3xl p-5 md:p-6 transition-all duration-300 hover:bg-white/[0.05] shadow-lg overflow-hidden flex flex-col md:flex-row md:items-center gap-6"
                  >
                    {/* Glowing highlight on hover */}
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/0 via-indigo-500/0 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                    {/* Book Info */}
                    <div className="flex items-center gap-5 md:w-1/3 shrink-0">
                      <div className="w-16 h-24 shrink-0 bg-black/50 rounded-xl overflow-hidden border border-white/10 shadow-2xl relative group-hover:shadow-indigo-500/20 transition-all duration-500">
                        {req.book.coverImage ? (
                          <img src={req.book.coverImage} alt="" className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <BookOpen className="w-6 h-6 text-gray-600" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <button 
                          onClick={() => fetchBookLogs(req.book.id)}
                          className="text-white font-bold text-lg block truncate hover:text-indigo-400 transition-colors text-left"
                        >
                          {req.book.title}
                        </button>
                        <span className="text-gray-400 text-sm font-medium block mt-1">
                          by {req.book.author}
                        </span>
                        
                        {/* Status Badge */}
                        <div className="mt-3">
                          {isPending && <span className="inline-flex px-3 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-[0_0_15px_rgba(245,158,11,0.15)]">Pending Approval</span>}
                          {isApproved && <span className="inline-flex px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-[0_0_15px_rgba(16,185,129,0.15)]">Active Loan</span>}
                          {req.status === 'RETURNED' && <span className="inline-flex px-3 py-1 bg-white/5 text-gray-400 border border-white/10 rounded-full text-[10px] font-bold uppercase tracking-widest">Returned</span>}
                          {req.status === 'REJECTED' && <span className="inline-flex px-3 py-1 bg-red-500/10 text-red-400 border border-red-500/20 rounded-full text-[10px] font-bold uppercase tracking-widest">Rejected</span>}
                        </div>
                      </div>
                    </div>

                    {/* Requester Info */}
                    <div className="flex items-center gap-4 md:w-1/4 shrink-0 bg-black/20 p-4 rounded-2xl border border-white/5">
                      <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center overflow-hidden shrink-0 border border-indigo-500/30">
                        {req.requester.profilePhoto ? (
                          <img src={req.requester.profilePhoto} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="font-bold text-sm text-indigo-300">
                            {req.requester.name?.charAt(0)}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold block mb-0.5">Requested By</span>
                        <strong className="text-white block font-semibold text-sm truncate">{req.requester.name}</strong>
                      </div>
                    </div>

                    {/* Due Date & Actions */}
                    <div className="flex-1 flex flex-col md:flex-row items-center justify-between gap-6 md:pl-4">
                      
                      {/* Dates */}
                      <div className="w-full md:w-auto">
                        {isPending ? (
                          <div className="flex flex-col gap-2">
                            <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Return Deadline</span>
                            <div className="relative">
                              <Calendar className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                              <input
                                type="date"
                                value={tableDueDates[req.id] || ''}
                                onChange={(e) => setTableDueDates(prev => ({ ...prev, [req.id]: e.target.value }))}
                                min={new Date().toISOString().split('T')[0]}
                                className="bg-black/40 border border-white/10 text-white text-sm rounded-xl pl-10 pr-4 py-2.5 outline-none focus:border-indigo-500 focus:bg-white/5 transition shadow-inner w-full md:w-40"
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-1.5">
                            {req.dueDate && (
                              <div className={`flex items-center gap-2 text-sm font-medium ${isOverdue ? 'text-red-400' : 'text-gray-300'}`}>
                                <Clock className={`w-4 h-4 ${isOverdue ? 'text-red-500 animate-pulse' : 'text-indigo-400'}`} />
                                Due: {new Date(req.dueDate).toLocaleDateString()} {isOverdue && <span className="text-[10px] font-bold bg-red-500/20 px-2 py-0.5 rounded uppercase ml-1">Overdue</span>}
                              </div>
                            )}
                            <p className="text-xs text-gray-500 font-medium">Issued: {req.issueDate ? new Date(req.issueDate).toLocaleDateString() : 'N/A'}</p>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                        {actionLoading === req.id ? (
                          <div className="px-6 py-3 bg-white/5 rounded-full border border-white/10 flex items-center justify-center">
                            <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
                          </div>
                        ) : (
                          <>
                            {isPending && (
                              <>
                                <button
                                  onClick={() => handleAction(req.id, 'APPROVE', tableDueDates[req.id])}
                                  className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-white border border-emerald-500/30 hover:border-transparent rounded-full transition-all duration-300 shadow-[0_0_15px_rgba(16,185,129,0.1)] hover:shadow-[0_0_25px_rgba(16,185,129,0.4)] cursor-pointer"
                                >
                                  <Check className="w-4 h-4 font-bold" />
                                  <span className="text-sm font-bold tracking-wide">Approve</span>
                                </button>
                                <button
                                  onClick={() => openRejectModal(req)}
                                  className="w-10 h-10 flex items-center justify-center bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/30 hover:border-transparent rounded-full transition-all duration-300 cursor-pointer"
                                  title="Reject Request"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </>
                            )}
                            {isApproved && (
                              <button
                                onClick={() => handleAction(req.id, 'RETURN')}
                                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-500/10 hover:bg-indigo-500 text-indigo-400 hover:text-white border border-indigo-500/30 hover:border-transparent rounded-full transition-all duration-300 shadow-[0_0_15px_rgba(99,102,241,0.1)] hover:shadow-[0_0_25px_rgba(99,102,241,0.4)] cursor-pointer"
                              >
                                <Undo2 className="w-4 h-4" />
                                <span className="text-sm font-bold tracking-wide">Return Book</span>
                              </button>
                            )}
                            
                            <div className="w-px h-8 bg-white/10 mx-1 hidden md:block"></div>

                            <button
                              onClick={() => fetchBookLogs(req.book.id)}
                              className="w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-white/15 text-gray-400 hover:text-white border border-white/10 rounded-full transition-all duration-300 cursor-pointer"
                              title="View History Timeline"
                            >
                              <History className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>

                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-32 bg-white/[0.02] border border-dashed border-white/10 rounded-3xl backdrop-blur-sm">
            <BookOpen className="w-16 h-16 text-gray-600 mx-auto mb-6 opacity-50" />
            <h3 className="text-2xl font-bold text-white mb-3">No Requests Found</h3>
            <p className="text-gray-500 max-w-sm mx-auto">
              There are currently no book loan requests matching your filters. 
            </p>
          </motion.div>
        )}

        {/* Spectacular Slide-over Drawer for Timeline */}
        <AnimatePresence>
          {drawerOpen && (
            <>
              {/* Darkened Backdrop */}
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => { setDrawerOpen(false); setDrawerBook(null); }}
                className="fixed inset-0 bg-black/80 backdrop-blur-md z-40"
              />

              {/* Drawer */}
              <motion.div
                initial={{ x: '100%', opacity: 0.5 }} animate={{ x: 0, opacity: 1 }} exit={{ x: '100%', opacity: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed right-0 top-0 bottom-0 w-full max-w-lg bg-[#0a0a0a]/90 backdrop-blur-3xl border-l border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] z-50 flex flex-col"
              >
                {/* Drawer Header */}
                <div className="px-8 py-6 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
                  <h3 className="font-serif text-2xl text-white font-bold flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.2)]">
                      <History className="w-5 h-5 text-indigo-400" />
                    </div>
                    Journey Log
                  </h3>
                  <button
                    onClick={() => { setDrawerOpen(false); setDrawerBook(null); }}
                    className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-white/10 transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Drawer Content */}
                <div className="p-8 overflow-y-auto flex-1 custom-scrollbar">
                  {drawerLoading ? (
                    <div className="h-full flex flex-col items-center justify-center gap-4 text-indigo-400">
                      <Loader2 className="w-10 h-10 animate-spin" />
                      <span className="text-sm font-bold tracking-widest uppercase">Retrieving Data...</span>
                    </div>
                  ) : drawerBook ? (
                    <div className="space-y-10">
                      {/* Book Overview Card */}
                      <div className="flex gap-6 p-6 bg-gradient-to-br from-white/5 to-transparent rounded-3xl border border-white/10 items-center relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-[50px]" />
                        <div className="w-16 h-24 bg-black/50 rounded-xl overflow-hidden shrink-0 border border-white/20 shadow-xl z-10">
                          {drawerBook.coverImage ? (
                            <img src={drawerBook.coverImage} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <BookOpen className="w-6 h-6 text-gray-500" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 z-10">
                          <h4 className="font-bold text-white text-xl truncate mb-1">{drawerBook.title}</h4>
                          <p className="text-sm text-gray-400 truncate mb-4">by {drawerBook.author}</p>
                          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/10 backdrop-blur-sm">
                            <span className="text-[10px] text-emerald-400 uppercase tracking-widest font-bold">
                              {drawerBook.totalCopies - drawerBook.issuedCopies} Available
                            </span>
                            <span className="text-gray-600">/</span>
                            <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">
                              {drawerBook.totalCopies} Total
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Visual Timeline Track */}
                      <div className="relative pl-6">
                        {/* Glowing Line */}
                        <div className="absolute left-[27px] top-6 bottom-6 w-0.5 bg-gradient-to-b from-indigo-500/50 via-purple-500/30 to-white/5 rounded-full" />

                        <div className="space-y-8">
                          {generateTimeline(drawerBook).map((event, i) => {
                            const getStyle = (type: string) => {
                              switch(type) {
                                case 'BOOK_ADDED': return { color: 'text-indigo-400', bg: 'bg-indigo-500/20', border: 'border-indigo-500/30', glow: 'shadow-[0_0_20px_rgba(99,102,241,0.3)]' };
                                case 'REQUESTED': return { color: 'text-amber-400', bg: 'bg-amber-500/20', border: 'border-amber-500/30', glow: 'shadow-[0_0_20px_rgba(245,158,11,0.3)]' };
                                case 'APPROVED': return { color: 'text-emerald-400', bg: 'bg-emerald-500/20', border: 'border-emerald-500/30', glow: 'shadow-[0_0_20px_rgba(16,185,129,0.3)]' };
                                case 'REJECTED': return { color: 'text-red-400', bg: 'bg-red-500/20', border: 'border-red-500/30', glow: 'shadow-[0_0_20px_rgba(239,68,68,0.3)]' };
                                case 'RETURNED': return { color: 'text-blue-400', bg: 'bg-blue-500/20', border: 'border-blue-500/30', glow: 'shadow-[0_0_20px_rgba(59,130,246,0.3)]' };
                                default: return { color: 'text-gray-400', bg: 'bg-white/10', border: 'border-white/20', glow: '' };
                              }
                            };
                            
                            const style = getStyle(event.type);

                            return (
                              <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1, duration: 0.4 }}
                                key={event.id} 
                                className="relative flex gap-6 group"
                              >
                                {/* Glowing Dot */}
                                <div className={`absolute -left-[20px] top-1.5 w-10 h-10 rounded-full flex items-center justify-center ${style.bg} ${style.border} ${style.glow} border backdrop-blur-sm z-10 shrink-0 transition-transform duration-300 group-hover:scale-110`}>
                                  <div className={style.color}>
                                    {event.type === 'BOOK_ADDED' && <BookOpen className="w-4 h-4" />}
                                    {event.type === 'REQUESTED' && <Clock className="w-4 h-4" />}
                                    {event.type === 'APPROVED' && <Check className="w-4 h-4" />}
                                    {event.type === 'REJECTED' && <X className="w-4 h-4" />}
                                    {event.type === 'RETURNED' && <Undo2 className="w-4 h-4" />}
                                  </div>
                                </div>

                                {/* Event Card */}
                                <div className="flex-1 ml-6 bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 hover:border-white/10 rounded-2xl p-5 transition-all duration-300">
                                  <div className="flex flex-col mb-3">
                                    <h5 className="font-bold text-sm text-white flex items-center gap-2">
                                      {event.type === 'BOOK_ADDED' && 'Book Cataloged'}
                                      {event.type === 'REQUESTED' && `Requested by ${event.user?.name}`}
                                      {event.type === 'APPROVED' && `Approved for ${event.user?.name}`}
                                      {event.type === 'REJECTED' && 'Request Rejected'}
                                      {event.type === 'RETURNED' && `Returned by ${event.user?.name}`}
                                    </h5>
                                    <span className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold mt-1">
                                      {new Date(event.date).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                  </div>

                                  {event.dueDate && (event.type === 'REQUESTED' || event.type === 'APPROVED') && (
                                    <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 bg-black/30 rounded-lg border border-white/5 text-xs text-gray-300">
                                      <Clock className="w-3.5 h-3.5 text-gray-400" />
                                      {event.type === 'REQUESTED' ? 'Requested Return:' : 'Deadline:'} <strong className="text-white">{new Date(event.dueDate).toLocaleDateString()}</strong>
                                    </div>
                                  )}

                                  {event.note && (
                                    <div className="mt-4 p-3 bg-red-500/5 rounded-xl border-l-2 border-l-red-500 border-y border-r border-red-500/10 text-sm text-gray-400 italic">
                                      "{event.note}"
                                    </div>
                                  )}
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-20 text-gray-500 italic">
                      No logs available.
                    </div>
                  )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Stunning Rejection Modal */}
        <AnimatePresence>
          {rejectModalOpen && targetRejectReq && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-lg p-4">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="bg-[#0a0a0a] border border-white/10 rounded-3xl p-8 max-w-sm w-full shadow-2xl relative overflow-hidden"
              >
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-red-500 to-rose-500" />
                
                <div className="flex justify-between items-center pb-6 mb-6 border-b border-white/5">
                  <h3 className="font-serif text-2xl text-white font-bold flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
                      <X className="w-5 h-5" />
                    </div>
                    Reject Loan
                  </h3>
                  <button onClick={() => setRejectModalOpen(false)} className="text-gray-500 hover:text-white transition cursor-pointer">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleRejectSubmit} className="space-y-6">
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/5 text-sm text-gray-400 space-y-2">
                    <p>Book: <strong className="text-white block truncate">{targetRejectReq.book.title}</strong></p>
                    <p>Reader: <strong className="text-white block">{targetRejectReq.requester.name}</strong></p>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Reason for Rejection</label>
                    <input
                      type="text"
                      value={adminNote}
                      onChange={(e) => setAdminNote(e.target.value)}
                      placeholder="e.g. Out of stock, reserved"
                      required
                      className="bg-black/50 border border-white/10 text-white rounded-xl p-3 outline-none focus:border-red-500 focus:bg-red-500/5 transition w-full shadow-inner"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setRejectModalOpen(false)}
                      className="py-2.5 px-6 bg-white/5 hover:bg-white/10 text-white rounded-full text-xs font-semibold border border-white/10 cursor-pointer transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="py-2.5 px-6 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white rounded-full text-xs font-bold shadow-[0_0_15px_rgba(225,29,72,0.3)] transition cursor-pointer"
                    >
                      Confirm Reject
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
        
        <style dangerouslySetInnerHTML={{__html: `
          .custom-scrollbar::-webkit-scrollbar { width: 6px; }
          .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
          .custom-scrollbar::-webkit-scrollbar-thumb { background-color: rgba(255, 255, 255, 0.1); border-radius: 20px; }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: rgba(255, 255, 255, 0.2); }
        `}} />
      </div>
    </div>
  );
}
