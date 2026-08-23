// src/app/(admin)/admin/roles/page.tsx
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  UserCheck,
  UserX,
  Search,
  CheckCircle2,
  Clock,
  Edit3,
  RefreshCw,
  AlertTriangle,
  Users,
  Shield,
  Layers,
  Sparkles,
  X,
  ExternalLink,
  Eye,
  BookOpen,
  MessageSquare,
  Globe,
  Mail,
  Check,
} from 'lucide-react';
import { Role, VerificationStatus, MemberSection } from '@prisma/client';
import { formatRole } from '@/lib/rbac';
import { useLenis } from 'lenis/react';

interface UserRecord {
  id: string;
  name: string;
  username: string;
  email: string;
  role: Role;
  verificationStatus: VerificationStatus;
  profilePhoto?: string | null;
  bio?: string | null;
  branch?: string | null;
  batch?: string | null;
  rollNumber?: string | null;
  socialLinks?: any;
  memberSection?: MemberSection | null;
  memberTitle?: string | null;
  createdAt: string;
  _count?: {
    publications: number;
    comments: number;
  };
}

const ALL_ROLES: Role[] = [
  Role.COORDINATOR,
  Role.TECH_LEAD,
  Role.CONTENT_LEAD,
  Role.PR_HEAD,
  Role.OPERATIONS_HEAD,
  Role.TREASURER,
  Role.MEMBER,
  Role.ALUMNI,
  Role.VISITOR,
];

const SECTIONS: { value: MemberSection | 'NONE'; label: string }[] = [
  { value: 'NONE', label: 'No Special Section' },
  { value: 'COORDINATORS', label: 'Coordinators' },
  { value: 'CORE', label: 'Core Committee' },
  { value: 'TEAM', label: 'Team Members' },
];

type TabKey = 'members' | 'alumni' | 'pending' | 'all';

export default function AdminRolesPage() {
  const lenis = useLenis();
  const [activeTab, setActiveTab] = useState<TabKey>('members');
  const [pendingUsers, setPendingUsers] = useState<UserRecord[]>([]);
  const [allUsers, setAllUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Grouped user lists for quick role management
  const memberUsers = useMemo(() => {
    return allUsers.filter(
      (u) => u.role !== Role.ALUMNI && u.role !== Role.VISITOR
    );
  }, [allUsers]);

  const alumniUsers = useMemo(() => {
    return allUsers.filter((u) => u.role === Role.ALUMNI);
  }, [allUsers]);

  const displayedUsers = useMemo(() => {
    if (activeTab === 'pending') return pendingUsers;
    if (activeTab === 'members') return memberUsers;
    if (activeTab === 'alumni') return alumniUsers;
    return allUsers;
  }, [activeTab, pendingUsers, memberUsers, alumniUsers, allUsers]);

  // Modal states
  const [rejectModalUser, setRejectModalUser] = useState<UserRecord | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [detailModalUser, setDetailModalUser] = useState<UserRecord | null>(null);
  const [editRole, setEditRole] = useState<Role>(Role.MEMBER);
  const [editSection, setEditSection] = useState<MemberSection | 'NONE'>('NONE');
  const [editTitle, setEditTitle] = useState('');

  // Lock scroll when modals are open
  useEffect(() => {
    if (rejectModalUser || detailModalUser) {
      lenis?.stop();
      document.body.style.overflow = 'hidden';
    } else {
      lenis?.start();
      document.body.style.overflow = '';
    }
    return () => {
      lenis?.start();
      document.body.style.overflow = '';
    };
  }, [rejectModalUser, detailModalUser, lenis]);

  // Fetch Users
  const fetchUsers = useCallback(async (query = searchQuery) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/roles?search=${encodeURIComponent(query.trim())}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setPendingUsers(data.pending || []);
        setAllUsers(data.all || []);
      } else {
        setFeedbackMessage({ type: 'error', text: data.error || 'Failed to load users' });
      }
    } catch (err) {
      console.error(err);
      setFeedbackMessage({ type: 'error', text: 'Network error loading user records' });
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  // Debounced search
  useEffect(() => {
    const handler = setTimeout(() => {
      fetchUsers(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery, fetchUsers]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers(searchQuery);
  };

  // Quick Approval Handler
  const handleApprove = async (user: UserRecord, role: Role) => {
    setActionLoading(user.id);
    setFeedbackMessage(null);
    try {
      const res = await fetch(`/api/admin/roles/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          verificationStatus: 'VERIFIED',
          role: role,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setFeedbackMessage({
          type: 'success',
          text: `Verified ${user.name} as ${formatRole(role)}!`,
        });
        fetchUsers();
      } else {
        setFeedbackMessage({
          type: 'error',
          text: data.error || 'Failed to approve application',
        });
      }
    } catch (err) {
      console.error(err);
      setFeedbackMessage({ type: 'error', text: 'Network error approving applicant' });
    } finally {
      setActionLoading(null);
    }
  };

  // Rejection Execution Handler
  const handleConfirmReject = async () => {
    if (!rejectModalUser) return;
    setActionLoading(rejectModalUser.id);
    setFeedbackMessage(null);
    try {
      const res = await fetch(`/api/admin/roles/${rejectModalUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          verificationStatus: 'REJECTED',
          role: 'VISITOR',
          rejectionReason: rejectionReason.trim() || 'Roll verification could not be matched.',
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setFeedbackMessage({
          type: 'success',
          text: `Application for ${rejectModalUser.name} rejected and notified.`,
        });
        setRejectModalUser(null);
        setRejectionReason('');
        fetchUsers();
      } else {
        setFeedbackMessage({
          type: 'error',
          text: data.error || 'Failed to reject applicant',
        });
      }
    } catch (err) {
      console.error(err);
      setFeedbackMessage({ type: 'error', text: 'Network error rejecting applicant' });
    } finally {
      setActionLoading(null);
    }
  };

  // Open User Detail & Role Management Drawer
  const openDetailModal = (user: UserRecord) => {
    setDetailModalUser(user);
    setEditRole(user.role);
    setEditSection(user.memberSection || 'NONE');
    
    // Auto-suggest alumni byline (e.g. IT 24' Alumnus) if not already set
    if (user.role === 'ALUMNI' && !user.memberTitle) {
      const b = user.branch || '';
      const y = user.batch ? ` ${user.batch.slice(-2)}'` : '';
      setEditTitle(b ? `${b}${y} Alumnus` : 'Alumnus');
    } else {
      setEditTitle(user.memberTitle || '');
    }
  };

  // Save User Role & Attribute Customizations
  const handleSaveUserCustoms = async () => {
    if (!detailModalUser) return;
    setActionLoading(detailModalUser.id);
    setFeedbackMessage(null);
    try {
      const res = await fetch(`/api/admin/roles/${detailModalUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: editRole,
          memberSection: editSection === 'NONE' ? null : editSection,
          memberTitle: editTitle.trim() || null,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setFeedbackMessage({
          type: 'success',
          text: `Updated role and directory attributes for ${detailModalUser.name}!`,
        });
        setDetailModalUser(null);
        fetchUsers();
      } else {
        setFeedbackMessage({
          type: 'error',
          text: data.error || 'Failed to update user',
        });
      }
    } catch (err) {
      console.error(err);
      setFeedbackMessage({ type: 'error', text: 'Network error saving changes' });
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-[#080808] text-neutral-900 dark:text-neutral-100 p-4 sm:p-8 md:p-12 font-sans selection:bg-neutral-900 selection:text-white dark:selection:bg-white dark:selection:text-neutral-950">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-neutral-500">
              <Link href="/admin" className="hover:text-neutral-900 dark:hover:text-white transition flex items-center gap-1">
                <ArrowLeft size={13} />
                <span>Admin Suite</span>
              </Link>
              <span>/</span>
              <span>Society Governance</span>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white flex items-center gap-2.5">
              <Shield size={24} className="text-amber-500" />
              <span>Roles &amp; Member Registry</span>
            </h1>
            <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
              Review affiliation applications, verify roll numbers, inspect member bylines, and manage society leadership.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchUsers(searchQuery)}
              disabled={loading}
              className="p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#121212] text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition shadow-xs cursor-pointer"
              title="Refresh Registry"
            >
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Feedback Alert */}
        <AnimatePresence>
          {feedbackMessage && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className={`p-4 rounded-2xl flex items-center justify-between gap-3 text-xs font-mono ${
                feedbackMessage.type === 'success'
                  ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                  : 'bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400'
              }`}
            >
              <span>{feedbackMessage.text}</span>
              <button
                onClick={() => setFeedbackMessage(null)}
                className="text-neutral-400 hover:text-neutral-900 dark:hover:text-white cursor-pointer"
              >
                <X size={14} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Search & Tabs Toolbar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Tabs */}
          <div className="flex flex-wrap items-center p-1 rounded-2xl bg-neutral-200/60 dark:bg-[#141414] border border-neutral-200/80 dark:border-neutral-800 gap-1 w-full sm:w-auto">
            <button
              onClick={() => setActiveTab('members')}
              className={`px-4 py-2 rounded-xl text-xs font-bold font-mono uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'members'
                  ? 'bg-white dark:bg-[#222222] text-neutral-950 dark:text-white shadow-xs'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <Users size={14} className="text-emerald-500" />
              <span>Club Members ({memberUsers.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('alumni')}
              className={`px-4 py-2 rounded-xl text-xs font-bold font-mono uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'alumni'
                  ? 'bg-white dark:bg-[#222222] text-neutral-950 dark:text-white shadow-xs'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <Sparkles size={14} className="text-purple-500" />
              <span>Alumni ({alumniUsers.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('pending')}
              className={`px-4 py-2 rounded-xl text-xs font-bold font-mono uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'pending'
                  ? 'bg-white dark:bg-[#222222] text-neutral-950 dark:text-white shadow-xs'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <Clock size={14} className="text-amber-500" />
              <span>Pending ({pendingUsers.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 rounded-xl text-xs font-bold font-mono uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'all'
                  ? 'bg-white dark:bg-[#222222] text-neutral-950 dark:text-white shadow-xs'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <Layers size={14} />
              <span>All ({allUsers.length})</span>
            </button>
          </div>

          {/* Interactive Search Bar Form */}
          <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-80 flex items-center">
            <Search
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"
            />
            <input
              type="text"
              placeholder="Search by name, roll, @user..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-11 pl-10 pr-20 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#121212] text-xs text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:border-neutral-950 dark:focus:border-white focus:outline-none shadow-xs"
            />
            <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    fetchUsers('');
                  }}
                  className="p-1 rounded-lg text-neutral-400 hover:text-neutral-900 dark:hover:text-white cursor-pointer"
                >
                  <X size={13} />
                </button>
              )}
              <button
                type="submit"
                className="px-2.5 py-1 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-[11px] font-mono font-bold hover:opacity-90 transition cursor-pointer"
              >
                Find
              </button>
            </div>
          </form>
        </div>

        {/* TAB 1: Pending Queue */}
        {activeTab === 'pending' && (
          <div className="space-y-4">
            {loading ? (
              <div className="py-20 text-center text-xs font-mono text-neutral-500">
                Loading verification requests...
              </div>
            ) : pendingUsers.length === 0 ? (
              <div className="py-20 text-center rounded-3xl border border-dashed border-neutral-300 dark:border-neutral-800 bg-white/40 dark:bg-[#0e0e0e]/40 p-8 space-y-2">
                <CheckCircle2 size={32} className="mx-auto text-emerald-500/60" />
                <h3 className="font-serif text-lg font-bold text-neutral-900 dark:text-white">
                  Queue is clear
                </h3>
                <p className="text-xs text-neutral-500">
                  There are currently no pending membership or alumni verification requests.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pendingUsers.map((user) => (
                  <div
                    key={user.id}
                    className="p-5 rounded-3xl border border-neutral-200/90 dark:border-neutral-800 bg-white/80 dark:bg-[#0f0f0f] shadow-xs space-y-4 hover:border-neutral-300 dark:hover:border-neutral-700 transition"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        {user.profilePhoto ? (
                          <img
                            src={user.profilePhoto}
                            alt={user.name}
                            className="w-12 h-12 rounded-full object-cover border border-neutral-200 dark:border-neutral-800"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center font-serif font-bold text-base">
                            {user.name[0]}
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/profile/${user.username}`}
                              target="_blank"
                              className="font-serif text-base font-bold text-neutral-900 dark:text-white hover:underline flex items-center gap-1"
                            >
                              <span>{user.name}</span>
                              <ExternalLink size={11} className="text-neutral-400" />
                            </Link>
                          </div>
                          <p className="text-xs font-mono text-neutral-500">
                            @{user.username} · {user.email}
                          </p>
                        </div>
                      </div>

                      <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                        {user.role}
                      </span>
                    </div>

                    {/* Academic info */}
                    <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-[#151515] border border-neutral-200/60 dark:border-neutral-800/60 grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="font-mono text-[10px] text-neutral-400 block uppercase">Roll / Record</span>
                        <strong className="text-neutral-900 dark:text-white font-mono">{user.rollNumber || 'Not Stated'}</strong>
                      </div>
                      <div>
                        <span className="font-mono text-[10px] text-neutral-400 block uppercase">Batch &amp; Branch</span>
                        <strong className="text-neutral-900 dark:text-white font-mono truncate block">
                          {user.batch || '—'} · {user.branch || '—'}
                        </strong>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between gap-3 pt-2 border-t border-neutral-100 dark:border-neutral-900">
                      <button
                        onClick={() => setRejectModalUser(user)}
                        disabled={actionLoading === user.id}
                        className="px-3.5 py-1.5 rounded-xl border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-mono font-bold hover:bg-red-500/10 transition cursor-pointer"
                      >
                        Reject
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openDetailModal(user)}
                          className="px-3.5 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800 text-xs font-mono text-neutral-600 dark:text-neutral-300 hover:text-neutral-950 dark:hover:text-white transition cursor-pointer"
                        >
                          Details...
                        </button>
                        <button
                          onClick={() => handleApprove(user, user.role === Role.ALUMNI ? Role.ALUMNI : Role.MEMBER)}
                          disabled={actionLoading === user.id}
                          className="px-4 py-1.5 rounded-xl bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 text-xs font-mono font-bold hover:opacity-90 transition shadow-sm cursor-pointer"
                        >
                          Approve
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: All Users Table */}
        {activeTab === 'all' && (
          <div className="rounded-3xl border border-neutral-200/90 dark:border-neutral-800 bg-white dark:bg-[#0e0e0e] overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-[#121212] font-mono text-[10px] uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                    <th className="px-6 py-4">User</th>
                    <th className="px-4 py-4">Academic Credentials</th>
                    <th className="px-4 py-4">Role</th>
                    <th className="px-4 py-4">Section / Wing</th>
                    <th className="px-4 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="py-20 text-center text-neutral-500 font-mono">
                        Loading member registry...
                      </td>
                    </tr>
                  ) : displayedUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-20 text-center text-neutral-500 font-mono">
                        No users found in this section.
                      </td>
                    </tr>
                  ) : (
                    displayedUsers.map((u) => (
                      <tr
                        key={u.id}
                        className="hover:bg-neutral-50/80 dark:hover:bg-neutral-900/40 transition-colors"
                      >
                        {/* Name & Direct Profile Link */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {u.profilePhoto ? (
                              <img
                                src={u.profilePhoto}
                                alt={u.name}
                                className="h-9 w-9 rounded-full object-cover border border-neutral-200 dark:border-neutral-800"
                              />
                            ) : (
                              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-serif text-xs font-bold">
                                {u.name[0]}
                              </div>
                            )}
                            <div>
                              <Link
                                href={`/profile/${u.username}`}
                                target="_blank"
                                className="font-serif font-bold text-neutral-900 dark:text-white hover:underline flex items-center gap-1 group"
                              >
                                <span>{u.name}</span>
                                <ExternalLink size={11} className="text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                              </Link>
                              <p className="font-mono text-[10.5px] text-neutral-500">
                                @{u.username} · {u.email}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Academic Roll & Batch */}
                        <td className="px-4 py-4 font-mono">
                          <span className="font-bold text-neutral-900 dark:text-white">
                            {u.rollNumber || '—'}
                          </span>
                          <span className="text-[10px] text-neutral-500 block truncate max-w-45">
                            {u.branch || '—'} {u.batch ? `(${u.batch})` : ''}
                          </span>
                        </td>

                        {/* Role */}
                        <td className="px-4 py-4">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[9.5px] font-bold uppercase tracking-wider ${
                              u.role === Role.COORDINATOR
                                ? 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
                                : u.role === Role.TECH_LEAD
                                ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                                : u.role === Role.CONTENT_LEAD
                                ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20'
                                : u.role === Role.PR_HEAD
                                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                                : u.role === Role.OPERATIONS_HEAD
                                ? 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20'
                                : u.role === Role.TREASURER
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                                : u.role === Role.MEMBER
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                                : u.role === Role.ALUMNI
                                ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20'
                                : 'bg-neutral-100 dark:bg-neutral-850 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-800'
                            }`}
                          >
                            {formatRole(u.role, u)}
                          </span>
                        </td>

                        {/* Section */}
                        <td className="px-4 py-4 font-mono text-[10.5px]">
                          {u.memberSection ? (
                            <span className="text-neutral-900 dark:text-white font-medium block">
                              {u.memberSection}
                            </span>
                          ) : (
                            <span className="text-neutral-400 dark:text-neutral-600">—</span>
                          )}
                          {u.memberTitle && (
                            <span className="text-amber-500 block text-[10px] font-serif italic truncate max-w-35">
                              &ldquo;{u.memberTitle}&rdquo;
                            </span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="px-4 py-4 font-mono text-[10.5px]">
                          {u.verificationStatus === 'VERIFIED' ? (
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                              <CheckCircle2 size={12} /> VERIFIED
                            </span>
                          ) : u.verificationStatus === 'PENDING' ? (
                            <span className="text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1">
                              <Clock size={12} /> PENDING
                            </span>
                          ) : (
                            <span className="text-neutral-500 font-medium">
                              {u.verificationStatus}
                            </span>
                          )}
                        </td>

                        {/* Action buttons */}
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openDetailModal(u)}
                              className="px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#141414] text-xs font-mono font-bold text-neutral-700 dark:text-neutral-300 hover:text-neutral-950 dark:hover:text-white hover:border-neutral-300 dark:hover:border-neutral-700 transition cursor-pointer flex items-center gap-1.5 shadow-xs"
                            >
                              <Eye size={13} />
                              <span>Details &amp; Role</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* MEMBER DETAILS & ROLE MANAGEMENT MODAL */}
      <AnimatePresence>
        {detailModalUser && (
          <div
            data-lenis-prevent
            className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDetailModalUser(null)}
              className="fixed inset-0 bg-black/80 backdrop-blur-md"
            />
            
            <motion.div
              data-lenis-prevent
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              className="relative z-10 w-full max-w-xl rounded-3xl border border-neutral-200/90 dark:border-neutral-800 bg-white dark:bg-[#0e0e0e] p-6 sm:p-8 shadow-2xl space-y-6 text-neutral-900 dark:text-neutral-100 max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-900 pb-4">
                <div className="flex items-center gap-3">
                  {detailModalUser.profilePhoto ? (
                    <img
                      src={detailModalUser.profilePhoto}
                      alt={detailModalUser.name}
                      className="w-14 h-14 rounded-full object-cover border border-neutral-200 dark:border-neutral-800"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center font-serif font-bold text-xl">
                      {detailModalUser.name[0]}
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-serif text-xl font-bold text-neutral-900 dark:text-white">
                        {detailModalUser.name}
                      </h3>
                      <Link
                        href={`/profile/${detailModalUser.username}`}
                        target="_blank"
                        className="text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition"
                        title="View Public Profile"
                      >
                        <ExternalLink size={14} />
                      </Link>
                    </div>
                    <p className="text-xs font-mono text-neutral-500">
                      @{detailModalUser.username} · {detailModalUser.email}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setDetailModalUser(null)}
                  className="p-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800 text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Bio & Academic Record */}
              <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-[#141414] border border-neutral-200/70 dark:border-neutral-800/70 space-y-3 text-xs">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <span className="font-mono text-[10px] text-neutral-400 block uppercase">Roll Number</span>
                    <strong className="text-neutral-900 dark:text-white font-mono">{detailModalUser.rollNumber || 'Not Stated'}</strong>
                  </div>
                  <div>
                    <span className="font-mono text-[10px] text-neutral-400 block uppercase">Batch</span>
                    <strong className="text-neutral-900 dark:text-white font-mono">{detailModalUser.batch || '—'}</strong>
                  </div>
                  <div>
                    <span className="font-mono text-[10px] text-neutral-400 block uppercase">Branch</span>
                    <strong className="text-neutral-900 dark:text-white font-mono truncate block">{detailModalUser.branch || '—'}</strong>
                  </div>
                </div>

                {detailModalUser.bio && (
                  <div className="pt-2 border-t border-neutral-200/60 dark:border-neutral-800/60">
                    <span className="font-mono text-[10px] text-neutral-400 block uppercase">
                      {detailModalUser.role === 'ALUMNI' ? 'Message to Club / Verification Note' : 'Byline Bio'}
                    </span>
                    <p className="text-neutral-700 dark:text-neutral-300 italic mt-0.5">&ldquo;{detailModalUser.bio}&rdquo;</p>
                  </div>
                )}
              </div>

              {/* Linked Social Accounts Verification & Inspection */}
              {detailModalUser.socialLinks && (
                <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-[#141414] border border-neutral-200/70 dark:border-neutral-800/70 space-y-2">
                  <span className="font-mono text-[10px] text-neutral-400 block uppercase">
                    Linked Author Handles (Click to Verify)
                  </span>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {Array.isArray(detailModalUser.socialLinks) ? (
                      detailModalUser.socialLinks
                        .filter((s: any) => s && s.url)
                        .map((link: any, idx: number) => (
                          <a
                            key={idx}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#181818] text-xs font-mono text-neutral-800 dark:text-neutral-200 hover:text-emerald-500 hover:border-emerald-500/40 flex items-center gap-1.5 transition shadow-xs"
                          >
                            <ExternalLink size={11} />
                            <span className="font-bold capitalize">{link.platform}:</span>
                            <span className="truncate max-w-35">{link.handle || link.url}</span>
                          </a>
                        ))
                    ) : (
                      <span className="text-xs text-neutral-500">No external links attached.</span>
                    )}
                  </div>
                </div>
              )}

              {/* Role & Leadership Controls */}
              <div className="space-y-4 pt-2">
                <h4 className="font-mono text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5">
                  <Shield size={14} className="text-amber-500" />
                  <span>Assign Role &amp; Society Wing</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Role Selector */}
                  <div className="space-y-1.5">
                    <label className="font-mono text-[10.5px] uppercase font-bold text-neutral-400">Society Role</label>
                    <select
                      value={editRole}
                      onChange={(e) => {
                        const newRole = e.target.value as Role;
                        setEditRole(newRole);
                        if (newRole === 'ALUMNI') {
                          if (!editTitle && detailModalUser) {
                            const b = detailModalUser.branch || '';
                            const y = detailModalUser.batch ? ` ${detailModalUser.batch.slice(-2)}'` : '';
                            setEditTitle(b ? `${b}${y} Alumnus` : 'Alumnus');
                          }
                        }
                      }}
                      className="w-full h-11 px-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-[#141414] text-xs font-mono font-bold text-neutral-900 dark:text-white focus:border-neutral-950 dark:focus:border-white focus:outline-none"
                    >
                      {ALL_ROLES.map((r) => (
                        <option key={r} value={r}>
                          {formatRole(r)}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Section Selector */}
                  <div className="space-y-1.5">
                    <label className="font-mono text-[10.5px] uppercase font-bold text-neutral-400">Directory Section</label>
                    <select
                      value={editSection}
                      onChange={(e) => setEditSection(e.target.value as any)}
                      className="w-full h-11 px-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-[#141414] text-xs font-mono font-bold text-neutral-900 dark:text-white focus:border-neutral-950 dark:focus:border-white focus:outline-none"
                    >
                      {SECTIONS.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Member Title / Wing */}
                <div className="space-y-1.5">
                  <label className="font-mono text-[10.5px] uppercase font-bold text-neutral-400">Assigned Title or Wing</label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    placeholder="e.g. Lead Technical Architect, Chief Editor"
                    className="w-full h-11 px-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-[#141414] text-xs text-neutral-900 dark:text-white focus:border-neutral-950 dark:focus:border-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-3 pt-4 border-t border-neutral-100 dark:border-neutral-900">
                <Link
                  href={`/profile/${detailModalUser.username}`}
                  target="_blank"
                  className="px-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 text-xs font-mono font-bold text-neutral-700 dark:text-neutral-300 hover:text-neutral-950 dark:hover:text-white transition flex items-center gap-1.5"
                >
                  <ExternalLink size={13} />
                  <span>Public Profile</span>
                </Link>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setDetailModalUser(null)}
                    className="px-4 py-2 text-xs font-mono font-bold text-neutral-500 hover:text-neutral-900 dark:hover:text-white cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveUserCustoms}
                    disabled={actionLoading === detailModalUser.id}
                    className="px-5 py-2 rounded-xl bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 text-xs font-mono font-bold shadow-md hover:shadow-lg transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Check size={14} />
                    <span>{actionLoading === detailModalUser.id ? 'Saving...' : 'Save Role Changes'}</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* REJECTION REASON MODAL */}
      <AnimatePresence>
        {rejectModalUser && (
          <div
            data-lenis-prevent
            className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setRejectModalUser(null)}
              className="fixed inset-0 bg-black/70 backdrop-blur-xs"
            />
            <motion.div
              data-lenis-prevent
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              className="relative z-10 w-full max-w-md rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0e0e0e] p-6 shadow-2xl space-y-4 text-neutral-900 dark:text-white"
            >
              <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-3">
                <h3 className="font-serif text-lg font-bold text-neutral-900 dark:text-white">
                  Reject Application for {rejectModalUser.name}
                </h3>
                <button
                  onClick={() => setRejectModalUser(null)}
                  className="text-neutral-400 hover:text-neutral-900 dark:hover:text-white font-bold cursor-pointer p-1"
                >
                  <X size={15} />
                </button>
              </div>

              <div className="space-y-3">
                <p className="text-xs text-neutral-500 leading-relaxed">
                  Provide a brief note explaining why this application was rejected (e.g. invalid roll number, incorrect department).
                </p>
                <textarea
                  rows={3}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Reason for rejection (sent to user)..."
                  className="w-full p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-[#141414] text-xs text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:border-neutral-950 dark:focus:border-white focus:outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-200 dark:border-neutral-800">
                <button
                  onClick={() => setRejectModalUser(null)}
                  className="px-4 py-2 text-xs font-mono text-neutral-500 hover:text-neutral-900 dark:hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmReject}
                  disabled={actionLoading === rejectModalUser.id}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-mono font-bold transition shadow-xs cursor-pointer disabled:opacity-50"
                >
                  Confirm Rejection
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
