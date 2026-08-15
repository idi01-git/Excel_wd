'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, BookOpen, Clock, Check, X, Undo2, Calendar, AlertCircle, Loader2, Search, History, Sparkles } from 'lucide-react';
import { motion, AnimatePresence, LayoutGroup } from 'motion/react';

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
    approver?: {
      name: string | null;
    } | null;
    returner?: {
      name: string | null;
    } | null;
  }>;
}

interface TimelineEvent {
  id: string;
  type: 'BOOK_ADDED' | 'REQUESTED' | 'APPROVED' | 'REJECTED' | 'RETURNED';
  date: string;
  user?: { name: string; email: string; profilePhoto: string | null };
  admin?: { name: string | null } | null;
  returnerAdmin?: { name: string | null } | null;
  note?: string;
  dueDate?: string | null;
}

type FilterType = 'pending' | 'active' | 'history';

export default function StunningAdminLoansPage() {
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionError, setActionError] = useState('');

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('pending');
  const [tableDueDates, setTableDueDates] = useState<Record<string, string>>({});

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerBook, setDrawerBook] = useState<BookLog | null>(null);
  const [drawerLoading, setDrawerLoading] = useState(false);

  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [targetRejectReq, setTargetRejectReq] = useState<RequestItem | null>(null);
  const [adminNote, setAdminNote] = useState('');
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [targetApproveReq, setTargetApproveReq] = useState<RequestItem | null>(null);
  const [customDueDate, setCustomDueDate] = useState('');

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

  const openApproveModal = (req: RequestItem) => {
    setTargetApproveReq(req);
    setCustomDueDate(req.dueDate 
      ? new Date(req.dueDate).toISOString().split('T')[0]
      : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    );
    setApproveModalOpen(true);
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
        events.push({ id: `app-${req.id}`, type: 'APPROVED', date: req.issueDate, user: req.requester, note: req.adminNote || undefined, dueDate: req.dueDate, admin: req.approver });
      } else if (req.status === 'REJECTED') {
        events.push({ id: `rej-${req.id}`, type: 'REJECTED', date: req.issueDate || req.requestDate, user: req.requester, note: req.adminNote || undefined, admin: req.approver });
      }
      if (req.returnDate && req.status === 'RETURNED') {
        events.push({ id: `ret-${req.id}`, type: 'RETURNED', date: req.returnDate, user: req.requester, admin: req.approver, returnerAdmin: req.returner });
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
    if (activeFilter === 'history') return matchesSearch && req.status === 'RETURNED';
    return matchesSearch;
  });

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950 text-black dark:text-white font-sans relative overflow-x-hidden">
      
      <div className="w-full max-w-6xl mx-auto py-10 px-6 relative z-10">
        
        {/* Navigation */}
        <Link 
          href="/admin/library" 
          className="inline-flex items-center text-sm font-semibold text-gray-500 dark:text-neutral-400 hover:text-black dark:hover:text-white transition-colors gap-2 mb-8 group"
        >
          <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 flex items-center justify-center group-hover:bg-gray-200 dark:group-hover:bg-neutral-800 transition-all">
            <ArrowLeft className="w-4 h-4" />
          </div>
          <span className="tracking-wide">Back to Library Dashboard</span>
        </Link>

        {/* Header */}
        <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <h1 className="font-serif text-5xl md:text-6xl text-black dark:text-white font-bold leading-tight mb-3 flex items-center gap-4">
              Issue Requests
            </h1>
            <p className="text-gray-500 dark:text-neutral-400 text-base md:text-lg max-w-2xl">
              Manage physical book reservations and track their complete lifecycle.
            </p>
          </motion.div>
        </div>

        {actionError && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="mb-8 p-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-2xl text-sm text-red-600 dark:text-red-400 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />
            {actionError}
          </motion.div>
        )}

        {/* Filters and Search Bar */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between border-b border-gray-200 dark:border-neutral-800 pb-6 mb-8">
          
          <div className="relative w-full md:max-w-md">
            <Search className="w-5 h-5 text-gray-400 dark:text-neutral-500 absolute left-5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by book, author, or reader..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-50 dark:bg-neutral-900 text-black dark:text-white placeholder:text-gray-400 dark:placeholder:text-neutral-500 rounded-full pl-13 pr-6 py-3 text-sm outline-none transition border border-gray-200 dark:border-neutral-800 focus:border-gray-400 dark:focus:border-neutral-600"
            />
          </div>

          <div className="flex flex-wrap gap-1.5 bg-gray-50 dark:bg-neutral-900 p-1 border border-gray-200/50 dark:border-neutral-800 rounded-full w-full md:w-auto">
            <LayoutGroup id="issue-tabs">
              {(['pending', 'active', 'history'] as FilterType[]).map((tab) => {
                const count = tab === 'history' 
                  ? requests.filter(r => r.status === 'RETURNED').length 
                  : tab === 'pending'
                    ? requests.filter(r => r.status === 'PENDING').length
                    : requests.filter(r => r.status === 'APPROVED').length;

                const labels = {
                  history: "History",
                  pending: "Pending",
                  active: "Active"
                };

                return (
                  <button
                    key={tab}
                    onClick={() => setActiveFilter(tab)}
                    className={`relative py-2 px-6 rounded-full text-xs font-semibold uppercase tracking-wide transition-all outline-none flex-1 md:flex-initial text-center ${
                      activeFilter === tab
                        ? "text-white dark:text-black"
                        : "text-gray-500 dark:text-neutral-400 hover:text-black dark:hover:text-white hover:bg-gray-100/50 dark:hover:bg-neutral-800/50"
                    }`}
                  >
                    {activeFilter === tab && (
                      <motion.div
                        layoutId="active-tab-pill"
                        className="absolute inset-0 bg-black dark:bg-white rounded-full shadow-sm"
                        transition={{ type: "spring", stiffness: 260, damping: 25, mass: 1 }}
                      />
                    )}
                    <span className="relative z-10 flex items-center justify-center gap-1.5">
                      {labels[tab]} <span className="opacity-60">({count})</span>
                    </span>
                  </button>
                );
              })}
            </LayoutGroup>
          </div>
        </div>

        {/* Requests List */}
        {loading ? (
          <div className="py-20 flex justify-center">
            <Loader2 className="w-10 h-10 animate-spin text-gray-400 dark:text-neutral-600" />
          </div>
        ) : filteredRequests.length > 0 ? (
          <div className="flex flex-col gap-6">
            <AnimatePresence mode="popLayout">
              {filteredRequests.map((req, index) => {
                const isPending = req.status === 'PENDING';
                const isApproved = req.status === 'APPROVED';
                const isOverdue = isApproved && req.dueDate && new Date(req.dueDate) < new Date();
                
                return (
                  <motion.div 
                    layout
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 260, damping: 25, mass: 1, delay: index * 0.05 }}
                    key={req.id} 
                    className="group flex flex-col lg:flex-row lg:items-center gap-6 p-5 lg:p-6 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl hover:border-gray-300 dark:hover:border-neutral-700 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:hover:shadow-[0_8px_30px_rgb(255,255,255,0.02)] transition-all duration-300"
                  >
                    {/* Book Info */}
                    <div className="flex items-center gap-5 lg:w-1/3 shrink-0">
                      <div className="w-16 h-24 shrink-0 bg-gray-100 dark:bg-neutral-800 rounded-xl overflow-hidden border border-gray-200 dark:border-neutral-700">
                        {req.book.coverImage ? (
                          <img src={req.book.coverImage} alt="" className="w-full h-full object-cover group-hover:scale-105 transition duration-700 ease-out" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <BookOpen className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <button 
                          onClick={() => fetchBookLogs(req.book.id)}
                          className="font-serif text-lg font-bold text-black dark:text-white truncate hover:text-violet-600 dark:hover:text-cyan-400 transition-colors text-left"
                        >
                          {req.book.title}
                        </button>
                        <span className="text-gray-500 dark:text-neutral-400 text-sm font-medium block mt-1">
                          by {req.book.author}
                        </span>
                        
                        {/* Status Badge */}
                        <div className="mt-3">
                          {isPending && <span className="inline-block text-[10px] font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-2.5 py-1 rounded">Pending Approval</span>}
                          {isApproved && <span className="inline-block text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2.5 py-1 rounded">Active Loan</span>}
                          {req.status === 'RETURNED' && <span className="inline-block text-[10px] font-bold uppercase tracking-widest text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-neutral-800 px-2.5 py-1 rounded">Returned</span>}
                          {req.status === 'REJECTED' && <span className="inline-block text-[10px] font-bold uppercase tracking-widest text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 px-2.5 py-1 rounded">Rejected</span>}
                        </div>
                      </div>
                    </div>

                    {/* Requester Info */}
                    <div className="flex items-center gap-3 lg:w-[28%] shrink-0">
                      <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 flex items-center justify-center overflow-hidden shrink-0">
                        {req.requester.profilePhoto ? (
                          <img src={req.requester.profilePhoto} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="font-bold text-sm text-gray-500 dark:text-gray-400">
                            {req.requester.name?.charAt(0)}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] text-gray-500 dark:text-neutral-500 uppercase tracking-widest font-bold block mb-0.5">
                          {req.status === 'RETURNED' ? 'Last Returned By' : 'Requested By'}
                        </span>
                        <strong className="text-black dark:text-white block font-semibold text-sm truncate">{req.requester.name}</strong>
                      </div>
                    </div>

                    {/* Due Date & Actions */}
                    <div className="flex-1 flex flex-row items-center justify-between gap-4 w-full pt-4 lg:pt-0 border-t border-gray-150 dark:border-neutral-800/80 lg:border-t-0 lg:pl-4">
                      
                      {/* Dates */}
                      <div className="min-w-0">
                        {isPending ? (
                          <div className="flex flex-col gap-0.5">
                            <span className="text-[9px] text-gray-400 dark:text-neutral-500 uppercase tracking-widest font-bold">Requested Return</span>
                            <p className="text-xs font-semibold text-gray-800 dark:text-neutral-200">
                              {req.dueDate ? new Date(req.dueDate).toLocaleDateString() : 'No requested date'}
                            </p>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-1">
                            {req.dueDate && (
                              <p className={`text-xs font-medium ${isOverdue ? 'text-red-500 dark:text-red-400' : 'text-gray-700 dark:text-gray-300'}`}>
                                <span className={`uppercase tracking-widest text-[9px] font-bold mr-1.5 ${isOverdue ? 'text-red-500' : 'text-gray-400'}`}>Due</span> 
                                {new Date(req.dueDate).toLocaleDateString()}
                                {isOverdue && <span className="text-[10px] font-bold bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-2 py-0.5 rounded uppercase ml-2">Overdue</span>}
                              </p>
                            )}
                            <p className="text-xs text-gray-500 dark:text-neutral-500 font-medium">
                              <span className="uppercase tracking-widest text-[9px] font-bold mr-1.5 text-gray-400">Issued</span> 
                              {req.issueDate ? new Date(req.issueDate).toLocaleDateString() : 'N/A'}
                            </p>
                            {req.status === 'RETURNED' && (
                              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                                <span className="uppercase tracking-widest text-[9px] font-bold mr-1.5 text-emerald-600/70 dark:text-emerald-400/70">Returned</span> 
                                {req.returnDate ? new Date(req.returnDate).toLocaleDateString() : 'N/A'}
                              </p>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 shrink-0">
                        {actionLoading === req.id ? (
                          <div className="w-10 h-10 bg-gray-50 dark:bg-neutral-900 rounded-full border border-gray-200 dark:border-neutral-800 flex items-center justify-center">
                            <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                          </div>
                        ) : (
                          <>
                            {isPending && (
                              <>
                                <button
                                  onClick={() => openApproveModal(req)}
                                  className="w-9 h-9 flex items-center justify-center bg-black hover:bg-gray-900 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-black rounded-full transition-all duration-300 cursor-pointer shadow-sm shrink-0"
                                  title="Approve Request"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => openRejectModal(req)}
                                  className="w-9 h-9 flex items-center justify-center bg-gray-100 hover:bg-gray-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-gray-600 dark:text-gray-300 rounded-full transition-all duration-300 cursor-pointer shrink-0"
                                  title="Reject Request"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </>
                            )}
                            {isApproved && (
                              <button
                                onClick={() => handleAction(req.id, 'RETURN')}
                                className="w-9 h-9 flex items-center justify-center bg-black hover:bg-gray-900 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-black rounded-full transition-all duration-300 cursor-pointer shadow-sm shrink-0"
                                title="Return Book"
                              >
                                <Undo2 className="w-4 h-4" />
                              </button>
                            )}
                            
                            <div className="w-px h-6 bg-gray-200 dark:bg-neutral-800 mx-1"></div>

                            <button
                              onClick={() => fetchBookLogs(req.book.id)}
                              className="w-9 h-9 flex items-center justify-center bg-gray-50 hover:bg-gray-100 dark:bg-neutral-900 dark:hover:bg-neutral-850 text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white border border-gray-200 dark:border-neutral-800 rounded-full transition-all duration-300 cursor-pointer"
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
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20 bg-gray-50 dark:bg-neutral-900/50 border border-dashed border-gray-200 dark:border-neutral-800 rounded-2xl">
            <BookOpen className="w-12 h-12 text-gray-300 dark:text-neutral-700 mx-auto mb-4" />
            <h3 className="font-serif text-xl font-bold text-black dark:text-white mb-2">No Requests Found</h3>
            <p className="text-gray-500 dark:text-neutral-500 max-w-sm mx-auto text-sm">
              There are currently no book loan requests matching your filters. 
            </p>
          </motion.div>
        )}

        {/* Drawer for Timeline */}
        <AnimatePresence>
          {drawerOpen && (
            <>
              {/* Darkened Backdrop */}
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => { setDrawerOpen(false); setDrawerBook(null); }}
                className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
              />

              {/* Drawer */}
              <motion.div
                initial={{ x: '100%', opacity: 0.5 }} animate={{ x: 0, opacity: 1 }} exit={{ x: '100%', opacity: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed right-0 top-0 bottom-0 w-full max-w-lg bg-white dark:bg-neutral-950 border-l border-gray-200 dark:border-neutral-800 shadow-2xl z-50 flex flex-col"
              >
                {/* Drawer Header */}
                <div className="px-8 py-8 border-b border-gray-100 dark:border-neutral-800 flex items-center justify-between bg-gradient-to-br from-white to-gray-50/50 dark:from-neutral-900 dark:to-neutral-950 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-violet-50 dark:bg-cyan-900/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 opacity-60"></div>
                  <h3 className="font-serif text-2xl text-black dark:text-white font-bold flex items-center gap-3 relative z-10">
                    <div className="w-10 h-10 rounded-xl bg-white dark:bg-neutral-800 shadow-sm border border-gray-100 dark:border-neutral-700 flex items-center justify-center">
                      <History className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                    </div>
                    Journey Log
                  </h3>
                  <button
                    onClick={() => { setDrawerOpen(false); setDrawerBook(null); }}
                    className="relative z-10 w-10 h-10 flex items-center justify-center rounded-full bg-white dark:bg-neutral-900 hover:bg-gray-50 dark:hover:bg-neutral-800 text-gray-500 border border-gray-200 dark:border-neutral-700 transition-colors shadow-sm cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Drawer Content */}
                <div className="p-8 overflow-y-auto flex-1 custom-scrollbar bg-gray-50/30 dark:bg-neutral-950">
                  {drawerLoading ? (
                    <div className="h-full flex flex-col items-center justify-center gap-4 text-gray-400">
                      <Loader2 className="w-10 h-10 animate-spin" />
                      <span className="text-[10px] font-bold tracking-widest uppercase">Retrieving Data...</span>
                    </div>
                  ) : drawerBook ? (
                    <div className="space-y-12">
                      {/* Book Overview Card */}
                      <div className="flex gap-6 items-start relative">
                        <div className="absolute inset-0 bg-gradient-to-b from-white to-transparent dark:from-neutral-900/50 dark:to-transparent -mx-8 -mt-8 h-40 blur-xl opacity-50 pointer-events-none" />
                        <div className="w-24 h-32 bg-gray-100 dark:bg-neutral-800 rounded-xl overflow-hidden shrink-0 shadow-[0_8px_30px_rgb(0,0,0,0.12)] relative z-10">
                          {drawerBook.coverImage ? (
                            <img src={drawerBook.coverImage} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <BookOpen className="w-8 h-8 text-gray-300" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 pt-2 relative z-10">
                          <h4 className="font-serif font-bold text-black dark:text-white text-2xl truncate mb-1.5">{drawerBook.title}</h4>
                          <p className="text-sm text-gray-500 dark:text-neutral-400 truncate mb-5">by {drawerBook.author}</p>
                          <div className="inline-flex items-center gap-3 px-4 py-2 bg-white dark:bg-neutral-900 rounded-full border border-gray-200 dark:border-neutral-800 shadow-sm">
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 uppercase tracking-widest font-bold">
                              {drawerBook.totalCopies - drawerBook.issuedCopies} Available
                            </span>
                            <span className="text-gray-200 dark:text-neutral-700">|</span>
                            <span className="text-[10px] text-gray-500 dark:text-neutral-500 uppercase tracking-widest font-bold">
                              {drawerBook.totalCopies} Total
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Vertical Visual Timeline Track (Swiss Editorial Style) */}
                      <div className="relative ml-2 space-y-6 pb-8 pt-6">
                        {/* Continuous Vertical Line (Animated Slider) */}
                        <div className="absolute left-[84px] top-8 bottom-8 w-[1px] bg-neutral-100 dark:bg-neutral-900 z-0">
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: '100%' }}
                            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                            className="w-full bg-neutral-900 dark:bg-neutral-200 origin-top"
                          />
                        </div>

                        {generateTimeline(drawerBook).map((event, i, arr) => {
                          const isLatest = i === arr.length - 1;
                          const num = String(i + 1).padStart(2, '0');
                          const getStyle = (type: string) => {
                            switch(type) {
                              case 'BOOK_ADDED': return { color: 'text-violet-600 dark:text-cyan-400', border: 'border-violet-300 dark:border-cyan-800' };
                              case 'REQUESTED': return { color: 'text-amber-600 dark:text-amber-400', border: 'border-amber-300 dark:border-amber-800' };
                              case 'APPROVED': return { color: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-300 dark:border-emerald-800' };
                              case 'REJECTED': return { color: 'text-red-650 dark:text-red-400', border: 'border-red-300 dark:border-red-800' };
                              case 'RETURNED': return { color: 'text-neutral-500 dark:text-neutral-450', border: 'border-neutral-300 dark:border-neutral-700' };
                              default: return { color: 'text-neutral-450', border: 'border-neutral-200 dark:border-neutral-800' };
                            }
                          };
                          
                          const style = getStyle(event.type);

                          return (
                            <motion.div
                              initial={{ opacity: 0, y: 15 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: i * 0.1, duration: 0.5 }}
                              whileHover="hover"
                              key={event.id} 
                              className="relative flex items-start group min-h-[90px] pb-6 cursor-pointer"
                            >
                              {/* Left: Index Number (Slides left on hover) */}
                              <div className="w-[68px] text-right pr-5 pt-0.5 shrink-0 select-none">
                                <motion.span
                                  variants={{
                                    hover: { x: -4 }
                                  }}
                                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                                  className="inline-block font-serif italic font-light text-2xl text-neutral-300 dark:text-neutral-850 group-hover:text-black dark:group-hover:text-white transition-colors duration-350"
                                >
                                  {num}
                                </motion.span>
                              </div>

                              {/* Middle: Dot Anchor centered on line (Scales up on hover) */}
                              <div className="absolute left-[79px] top-3 z-10">
                                <motion.div
                                  variants={{
                                    hover: { scale: 1.35 }
                                  }}
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  transition={{ 
                                    scale: { type: 'spring', stiffness: 300, damping: 20 },
                                    default: { delay: i * 0.1 + 0.4, type: 'spring', stiffness: 200 }
                                  }}
                                  className={`w-2.5 h-2.5 rounded-full border bg-white dark:bg-neutral-950 ${style.border}`}
                                />
                                {isLatest && (
                                  <div className="absolute inset-0 rounded-full animate-ping opacity-25 bg-neutral-400 dark:bg-neutral-700 pointer-events-none" />
                                )}
                              </div>

                              {/* Right: Content details (Slides right on hover) */}
                              <motion.div 
                                variants={{
                                  hover: { x: 6 }
                                }}
                                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                                className="pl-12 pr-4 min-w-0 flex-1"
                              >
                                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-1">
                                  <h5 className="font-serif font-bold text-[17px] text-neutral-950 dark:text-white leading-tight">
                                    {event.type === 'BOOK_ADDED' && 'Book Cataloged'}
                                    {event.type === 'REQUESTED' && `Requested by ${event.user?.name}`}
                                    {event.type === 'APPROVED' && (event.admin?.name ? `Approved by ${event.admin.name}` : `Approved for ${event.user?.name}`)}
                                    {event.type === 'REJECTED' && (event.admin?.name ? `Rejected by ${event.admin.name}` : 'Request Rejected')}
                                    {event.type === 'RETURNED' && (event.returnerAdmin?.name ? `Return processed by ${event.returnerAdmin.name}` : `Returned by ${event.user?.name}`)}
                                  </h5>
                                  <span className={`text-[9px] font-bold uppercase tracking-widest font-sans select-none shrink-0 ${style.color}`}>
                                    {event.type.replace('_', ' ')}
                                  </span>
                                </div>

                                <div className="text-[10px] text-neutral-400 dark:text-neutral-500 uppercase tracking-widest font-bold font-sans mb-2">
                                  {new Date(event.date).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })} AT {new Date(event.date).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false })}
                                </div>

                                {event.dueDate && (event.type === 'REQUESTED' || event.type === 'APPROVED') && (
                                  <div className="inline-flex items-center gap-1.5 mt-1.5 text-xs text-neutral-500 dark:text-neutral-400 font-sans">
                                    <Clock className="w-3.5 h-3.5 opacity-60" />
                                    <span>
                                      {event.type === 'REQUESTED' ? 'Requested Return: ' : 'Deadline: '}
                                      <strong className="text-neutral-800 dark:text-neutral-250">{new Date(event.dueDate).toLocaleDateString()}</strong>
                                    </span>
                                  </div>
                                )}

                                {event.note && (
                                  <div className="mt-3 pl-4 border-l border-neutral-200 dark:border-neutral-800 text-sm text-neutral-600 dark:text-neutral-400 italic font-serif">
                                    "{event.note}"
                                  </div>
                                )}
                              </motion.div>

                              {/* Hover Underline Reveal (Spring scale reveal) */}
                              <motion.div 
                                variants={{
                                  hover: { scaleX: 1 }
                                }}
                                initial={{ scaleX: 0 }}
                                transition={{ type: 'spring', stiffness: 200, damping: 25 }}
                                className="absolute bottom-0 left-[112px] right-4 h-[1px] bg-neutral-200/50 dark:bg-neutral-800/30 origin-left"
                              />
                            </motion.div>
                          );
                        })}
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

        {/* Approve Confirmation Modal */}
        <AnimatePresence>
          {approveModalOpen && targetApproveReq && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="bg-white dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-3xl p-8 max-w-sm w-full shadow-2xl relative overflow-hidden"
              >
                <div className="flex justify-between items-center pb-6 mb-6 border-b border-gray-100 dark:border-neutral-800">
                  <h3 className="font-serif text-2xl text-black dark:text-white font-bold flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                      <Check className="w-5 h-5" />
                    </div>
                    Approve Loan
                  </h3>
                  <button onClick={() => setApproveModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition cursor-pointer">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-6">
                  <div className="bg-gray-50 dark:bg-neutral-900 p-4 rounded-2xl border border-gray-200 dark:border-neutral-800 text-sm text-gray-500 dark:text-gray-400 space-y-2">
                    <p>Book: <strong className="text-black dark:text-white block truncate">{targetApproveReq.book.title}</strong></p>
                    <p>Reader: <strong className="text-black dark:text-white block">{targetApproveReq.requester.name}</strong></p>
                    {targetApproveReq.dueDate && (
                      <p>Requested Return: <strong className="text-black dark:text-white block">{new Date(targetApproveReq.dueDate).toLocaleDateString()}</strong></p>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Return Deadline</label>
                    <div className="relative">
                      <Calendar className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="date"
                        value={customDueDate}
                        onChange={(e) => setCustomDueDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        className="bg-white dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 text-black dark:text-white rounded-xl pl-10 pr-4 py-3 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition w-full"
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-1">
                    {targetApproveReq.dueDate && (
                      <button
                        type="button"
                        onClick={() => setCustomDueDate(new Date(targetApproveReq.dueDate!).toISOString().split('T')[0])}
                        className="text-[11px] font-semibold px-3 py-1.5 bg-gray-150 hover:bg-gray-200 dark:bg-neutral-800 dark:hover:bg-neutral-750 text-gray-700 dark:text-gray-300 rounded-lg transition cursor-pointer"
                      >
                        Accept Requested Date
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setCustomDueDate(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])}
                      className="text-[11px] font-semibold px-3 py-1.5 bg-gray-100 hover:bg-gray-150 dark:bg-neutral-900 dark:hover:bg-neutral-850 text-gray-700 dark:text-gray-300 rounded-lg transition cursor-pointer"
                    >
                      14 Days
                    </button>
                    <button
                      type="button"
                      onClick={() => setCustomDueDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])}
                      className="text-[11px] font-semibold px-3 py-1.5 bg-gray-100 hover:bg-gray-150 dark:bg-neutral-900 dark:hover:bg-neutral-850 text-gray-700 dark:text-gray-300 rounded-lg transition cursor-pointer"
                    >
                      30 Days
                    </button>
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setApproveModalOpen(false)}
                      className="py-2.5 px-6 bg-gray-150 hover:bg-gray-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-black dark:text-white rounded-full text-xs font-semibold cursor-pointer transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        handleAction(targetApproveReq.id, 'APPROVE', customDueDate);
                        setApproveModalOpen(false);
                      }}
                      className="py-2.5 px-6 bg-black hover:bg-gray-900 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-black rounded-full text-xs font-bold transition cursor-pointer"
                    >
                      Confirm Approve
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Rejection Modal */}
        <AnimatePresence>
          {rejectModalOpen && targetRejectReq && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="bg-white dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-3xl p-8 max-w-sm w-full shadow-2xl relative overflow-hidden"
              >
                <div className="flex justify-between items-center pb-6 mb-6 border-b border-gray-100 dark:border-neutral-800">
                  <h3 className="font-serif text-2xl text-black dark:text-white font-bold flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400">
                      <X className="w-5 h-5" />
                    </div>
                    Reject Loan
                  </h3>
                  <button onClick={() => setRejectModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition cursor-pointer">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleRejectSubmit} className="space-y-6">
                  <div className="bg-gray-50 dark:bg-neutral-900 p-4 rounded-2xl border border-gray-200 dark:border-neutral-800 text-sm text-gray-500 dark:text-gray-400 space-y-2">
                    <p>Book: <strong className="text-black dark:text-white block truncate">{targetRejectReq.book.title}</strong></p>
                    <p>Reader: <strong className="text-black dark:text-white block">{targetRejectReq.requester.name}</strong></p>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Reason for Rejection</label>
                    <input
                      type="text"
                      value={adminNote}
                      onChange={(e) => setAdminNote(e.target.value)}
                      placeholder="e.g. Out of stock, reserved"
                      required
                      className="bg-white dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 text-black dark:text-white rounded-xl p-3 outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition w-full"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setRejectModalOpen(false)}
                      className="py-2.5 px-6 bg-gray-100 hover:bg-gray-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-black dark:text-white rounded-full text-xs font-semibold cursor-pointer transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="py-2.5 px-6 bg-red-600 hover:bg-red-700 text-white rounded-full text-xs font-bold transition cursor-pointer"
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
          .custom-scrollbar::-webkit-scrollbar-thumb { background-color: rgba(156, 163, 175, 0.3); border-radius: 20px; }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: rgba(156, 163, 175, 0.5); }
        `}} />
      </div>
    </div>
  );
}
