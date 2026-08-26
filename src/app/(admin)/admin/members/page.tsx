// src/app/(admin)/admin/members/page.tsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Users,
  Search,
  Shield,
  Award,
  Crown,
  Edit,
  Trash2,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  ChevronDown,
  UserPlus,
  Filter,
  Camera,
  Eye,
  EyeOff,
  Image as ImageIcon,
  ArrowUp,
  ArrowDown,
  ListOrdered,
} from 'lucide-react';
import { MemberSection, Role } from '@prisma/client';
import { formatRole } from '@/lib/rbac';
import { ImageCropperModal } from '@/components/ui/ImageCropperModal';
import { uploadImageBlob } from '@/lib/upload';
import { validateUploadFile, ACCEPT_MAP } from '@/lib/file-validation';
import { useLenis } from 'lenis/react';

interface MemberUser {
  id: string;
  name: string;
  username: string;
  email: string;
  role: Role;
  memberSection?: MemberSection | null;
  memberTitle?: string | null;
  branch?: string | null;
  batch?: string | null;
  rollNumber?: string | null;
  profilePhoto?: string | null;
  directoryPhoto?: string | null;
  bio?: string | null;
  socialLinks?: any;
  showSocialLinks?: boolean;
  displayOrder?: number | null;
  createdAt: string;
}

export default function AdminMembersPage() {
  const lenis = useLenis();
  const [members, setMembers] = useState<MemberUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'ALL' | MemberSection>('ALL');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Edit Modal State
  const [editingMember, setEditingMember] = useState<MemberUser | null>(null);
  const [editSection, setEditSection] = useState<MemberSection>(MemberSection.TEAM);
  const [editTitle, setEditTitle] = useState('');
  const [editBranch, setEditBranch] = useState('');
  const [editBatch, setEditBatch] = useState('');
  const [editDirectoryPhoto, setEditDirectoryPhoto] = useState<string | null>(null);
  const [editShowSocialLinks, setEditShowSocialLinks] = useState(true);
  const [editDisplayOrder, setEditDisplayOrder] = useState<number>(0);
  const [modalError, setModalError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Cropper State
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [selectedImageSrc, setSelectedImageSrc] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Scroll lock when modal is open
  useEffect(() => {
    if (editingMember) {
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
  }, [editingMember, lenis]);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/members');
      const data = await res.json();
      if (data.success) {
        setMembers(data.members || []);
      } else {
        setFeedback({ type: 'error', text: data.error || 'Failed to load members' });
      }
    } catch (err) {
      console.error(err);
      setFeedback({ type: 'error', text: 'Network error loading members' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const filteredMembers = useMemo(() => {
    return members
      .filter((m) => {
        const matchesTab =
          activeTab === 'ALL'
            ? true
            : m.memberSection === activeTab || (!m.memberSection && activeTab === MemberSection.TEAM);

        const q = search.toLowerCase().trim();
        const matchesSearch =
          !q ||
          m.name.toLowerCase().includes(q) ||
          m.username.toLowerCase().includes(q) ||
          m.email.toLowerCase().includes(q) ||
          (m.rollNumber && m.rollNumber.toLowerCase().includes(q)) ||
          (m.memberTitle && m.memberTitle.toLowerCase().includes(q)) ||
          (m.branch && m.branch.toLowerCase().includes(q));

        return matchesTab && matchesSearch;
      })
      .sort((a, b) => {
        if (activeTab === 'ALL') {
          const secOrder: Record<string, number> = {
            [MemberSection.COORDINATORS]: 1,
            [MemberSection.CORE]: 2,
            [MemberSection.TEAM]: 3,
          };
          const secA = a.memberSection ? secOrder[a.memberSection] || 4 : 4;
          const secB = b.memberSection ? secOrder[b.memberSection] || 4 : 4;
          if (secA !== secB) return secA - secB;
        }
        return (a.displayOrder ?? 0) - (b.displayOrder ?? 0);
      });
  }, [members, activeTab, search]);

  const handleMove = async (memberId: string, direction: 'up' | 'down') => {
    const list = [...filteredMembers];
    const currentIndex = list.findIndex((m) => m.id === memberId);
    if (currentIndex === -1) return;

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= list.length) return;

    // Swap items in current view
    const updatedList = [...list];
    const [movedItem] = updatedList.splice(currentIndex, 1);
    updatedList.splice(targetIndex, 0, movedItem);

    // Optimistically assign displayOrder indices
    const updatedIds = updatedList.map((m) => m.id);
    const idToOrder = new Map(updatedIds.map((id, idx) => [id, idx * 10]));

    setMembers((prev) =>
      [...prev].map((m) => (idToOrder.has(m.id) ? { ...m, displayOrder: idToOrder.get(m.id)! } : m))
    );

    try {
      const res = await fetch('/api/admin/members/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberIds: updatedIds }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setFeedback({ type: 'error', text: data.error || 'Failed to save reordered position' });
        fetchMembers();
      }
    } catch (err) {
      console.error(err);
      setFeedback({ type: 'error', text: 'Network error saving order' });
      fetchMembers();
    }
  };

  const openEdit = (m: MemberUser) => {
    setEditingMember(m);
    setEditSection(m.memberSection || MemberSection.TEAM);
    setEditTitle(m.memberTitle || '');
    setEditBranch(m.branch || '');
    setEditBatch(m.batch || '');
    setEditDirectoryPhoto(m.directoryPhoto || null);
    setEditShowSocialLinks(m.showSocialLinks !== false);
    setEditDisplayOrder(m.displayOrder ?? 0);
    setModalError(null);
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setModalError(null);
      const validation = validateUploadFile(file, 'AVATAR');
      if (!validation.valid) {
        const errorMsg = validation.error || 'Please upload an image with size less than 10MB.';
        setModalError(errorMsg);
        setFeedback({ type: 'error', text: errorMsg });
        e.target.value = '';
        return;
      }

      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setSelectedImageSrc(reader.result?.toString() || null);
        setCropModalOpen(true);
      });
      reader.readAsDataURL(file);
      e.target.value = '';
    }
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    setUploadingPhoto(true);
    setModalError(null);
    try {
      const uploadedUrl = await uploadImageBlob(croppedBlob, 'members-directory');
      setEditDirectoryPhoto(uploadedUrl);
      setCropModalOpen(false);
    } catch (error: any) {
      console.error('Failed to upload directory photo:', error);
      const errorMsg = error.message || 'Failed to upload photo. Please upload an image with size less than 10MB.';
      setModalError(errorMsg);
      setFeedback({ type: 'error', text: errorMsg });
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSaveMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/members/${editingMember.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberSection: editSection,
          memberTitle: editTitle,
          branch: editBranch,
          batch: editBatch,
          directoryPhoto: editDirectoryPhoto,
          showSocialLinks: editShowSocialLinks,
          displayOrder: editDisplayOrder,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setFeedback({
          type: 'success',
          text: `Updated member profile for ${editingMember.name}`,
        });
        setEditingMember(null);
        fetchMembers();
      } else {
        setFeedback({ type: 'error', text: data.error || 'Failed to update member' });
      }
    } catch (err) {
      console.error(err);
      setFeedback({ type: 'error', text: 'Network error updating member' });
    } finally {
      setSaving(false);
    }
  };

  const getSectionBadge = (section?: MemberSection | null) => {
    switch (section) {
      case MemberSection.COORDINATORS:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-400/10 text-amber-500 border border-amber-400/20">
            <Crown size={11} />
            COORDINATOR
          </span>
        );
      case MemberSection.CORE:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-400/10 text-purple-400 border border-purple-400/20">
            <Award size={11} />
            CORE COMMITTEE
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-400/10 text-blue-400 border border-blue-400/20">
            <Users size={11} />
            TEAM MEMBER
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-amber-400 selection:text-neutral-950 px-4 md:px-8 py-10 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/roles"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-foreground/[0.04] hover:bg-foreground/[0.08] text-xs font-mono text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={13} />
            <span>Role Management</span>
          </Link>
          <span className="text-muted-foreground/40 font-mono text-xs">/</span>
          <span className="font-mono text-xs text-amber-500 font-bold uppercase tracking-wider">
            Members Directory Curation
          </span>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
          <div>
            <h1 className="font-serif text-3xl md:text-4xl font-bold tracking-tight text-foreground">
              Society &amp; Editorial Roster
            </h1>
            <p className="text-muted-foreground text-xs md:text-sm mt-1">
              Curate official directory portraits, section categories, custom club titles, and social media visibility for the public Members Directory.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchMembers}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-border bg-foreground/[0.02] hover:bg-foreground/[0.05] text-xs font-mono text-muted-foreground hover:text-foreground transition-colors"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>
            <Link
              href="/community/members"
              target="_blank"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-foreground text-background text-xs font-mono font-bold hover:opacity-90 transition-opacity"
            >
              <Eye size={13} />
              <span>View Public Directory</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Feedback Toast */}
      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`p-4 rounded-2xl text-xs font-mono flex items-center justify-between border ${
              feedback.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                : 'bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400'
            }`}
          >
            <span>{feedback.text}</span>
            <button
              onClick={() => setFeedback(null)}
              className="hover:opacity-70 font-bold px-2 py-0.5"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controls & Tab Filter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Section Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-foreground/[0.03] border border-border overflow-x-auto">
          <button
            onClick={() => setActiveTab('ALL')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-mono transition-colors cursor-pointer ${
              activeTab === 'ALL'
                ? 'bg-foreground text-background font-bold shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            ALL ({members.length})
          </button>
          <button
            onClick={() => setActiveTab(MemberSection.COORDINATORS)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-mono transition-colors cursor-pointer ${
              activeTab === MemberSection.COORDINATORS
                ? 'bg-amber-400 text-neutral-950 font-bold shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            COORDINATORS ({members.filter((m) => m.memberSection === MemberSection.COORDINATORS).length})
          </button>
          <button
            onClick={() => setActiveTab(MemberSection.CORE)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-mono transition-colors cursor-pointer ${
              activeTab === MemberSection.CORE
                ? 'bg-purple-500 text-white font-bold shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            CORE ({members.filter((m) => m.memberSection === MemberSection.CORE).length})
          </button>
          <button
            onClick={() => setActiveTab(MemberSection.TEAM)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-mono transition-colors cursor-pointer ${
              activeTab === MemberSection.TEAM
                ? 'bg-blue-500 text-white font-bold shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            TEAM ({members.filter((m) => !m.memberSection || m.memberSection === MemberSection.TEAM).length})
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search
            size={14}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, roll, title..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-border bg-foreground/[0.02] text-xs text-foreground placeholder:text-muted-foreground focus:border-amber-400 focus:outline-none transition-colors"
          />
        </div>
      </div>

      {/* Members List Cards */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-20 rounded-2xl bg-foreground/[0.02] border border-border/50 animate-pulse"
            />
          ))}
        </div>
      ) : filteredMembers.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-border rounded-3xl space-y-3">
          <Users size={32} className="mx-auto text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground font-mono">No club members matched your query.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredMembers.map((member, index) => (
            <motion.div
              key={member.id}
              layout
              className="p-4 md:p-5 rounded-2xl border border-border bg-card hover:border-foreground/20 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              {/* Left Identity Info */}
              <div className="flex items-center gap-4 min-w-0">
                <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-foreground/[0.04] border border-border shrink-0">
                  <img
                    src={
                      member.directoryPhoto ||
                      member.profilePhoto ||
                      `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(member.name)}`
                    }
                    alt={member.name}
                    className="w-full h-full object-cover"
                  />
                  {member.directoryPhoto && (
                    <div className="absolute bottom-0 right-0 p-0.5 bg-amber-400 text-neutral-950 rounded-tl">
                      <Sparkles size={8} />
                    </div>
                  )}
                </div>

                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-serif text-base font-bold text-foreground truncate">
                      {member.name}
                    </h3>
                    <span className="font-mono text-xs text-muted-foreground">
                      @{member.username}
                    </span>
                    {getSectionBadge(member.memberSection)}
                    {member.role && member.role !== Role.MEMBER && member.role !== Role.VISITOR && (
                      <span className="inline-block px-2 py-0.5 rounded-full text-[9.5px] font-mono font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                        {formatRole(member.role)}
                      </span>
                    )}
                    {member.showSocialLinks === false && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-mono font-medium bg-neutral-500/10 text-neutral-400 border border-neutral-500/20">
                        <EyeOff size={9} /> Socials Hidden
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap font-sans">
                    {member.memberTitle && (
                      <span className="font-medium text-amber-500 font-serif">
                        &ldquo;{member.memberTitle}&rdquo;
                      </span>
                    )}
                    {member.branch && <span>Branch: {member.branch}</span>}
                    {member.batch && <span>Batch: {member.batch}</span>}
                    {member.rollNumber && (
                      <span className="font-mono text-[10px]">
                        Roll: {member.rollNumber}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Actions */}
              <div className="flex items-center gap-2.5 self-end md:self-center shrink-0">
                {/* Reorder and Rank Control */}
                <div className="flex items-center gap-0.5 bg-foreground/[0.03] border border-border/80 rounded-xl p-0.5">
                  <button
                    type="button"
                    title="Move Up in Roster"
                    disabled={index === 0}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMove(member.id, 'up');
                    }}
                    className="p-1.5 rounded-lg hover:bg-foreground/[0.08] text-muted-foreground hover:text-foreground disabled:opacity-20 disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed transition-colors"
                  >
                    <ArrowUp size={12} />
                  </button>

                  <span
                    className="font-mono text-[10px] font-bold px-1.5 min-w-[28px] text-center text-foreground/80"
                    title={`Roster position #${index + 1} (Order value: ${member.displayOrder ?? 0})`}
                  >
                    #{index + 1}
                  </span>

                  <button
                    type="button"
                    title="Move Down in Roster"
                    disabled={index === filteredMembers.length - 1}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMove(member.id, 'down');
                    }}
                    className="p-1.5 rounded-lg hover:bg-foreground/[0.08] text-muted-foreground hover:text-foreground disabled:opacity-20 disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed transition-colors"
                  >
                    <ArrowDown size={12} />
                  </button>
                </div>

                <button
                  onClick={() => openEdit(member)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-foreground/[0.04] hover:bg-foreground/[0.08] text-xs font-mono text-foreground transition-colors cursor-pointer"
                >
                  <Edit size={13} />
                  <span>Edit Position &amp; Photo</span>
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Edit Member Modal */}
      <AnimatePresence>
        {editingMember && (
          <div
            data-lenis-prevent
            className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingMember(null)}
              className="fixed inset-0 bg-black/80 backdrop-blur-md"
            />

            <motion.div
              data-lenis-prevent
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              className="relative z-10 w-full max-w-lg rounded-3xl border border-border bg-card shadow-2xl text-foreground flex flex-col max-h-[90vh] overflow-hidden"
            >
              {/* Pinned Header */}
              <div className="flex items-center justify-between border-b border-border/50 px-6 py-4 shrink-0 bg-card">
                <div>
                  <h3 className="font-serif text-xl font-bold text-foreground">
                    Curate Member Profile
                  </h3>
                  <p className="text-[11px] text-muted-foreground font-mono">
                    @{editingMember.username} · {editingMember.email}
                  </p>
                </div>
                <button
                  onClick={() => setEditingMember(null)}
                  className="text-muted-foreground hover:text-foreground font-bold text-sm cursor-pointer p-1"
                >
                  ✕
                </button>
              </div>

              {/* Scrollable Form Body */}
              <form
                onSubmit={handleSaveMember}
                className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-6 space-y-5"
                data-lenis-prevent
              >
                {/* Modal Error Alert Prompt */}
                {modalError && (
                  <div className="p-3.5 rounded-xl border border-red-500/30 bg-red-500/10 text-red-500 text-xs flex items-center justify-between gap-3 shadow-xs">
                    <span className="font-semibold">{modalError}</span>
                    <button
                      type="button"
                      onClick={() => setModalError(null)}
                      className="p-1 text-red-400 hover:text-red-600 dark:hover:text-red-200 cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                )}
                {/* Official Directory Photo Uploader */}
                <div className="rounded-2xl border border-border bg-foreground/[0.02] p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-foreground">Official Directory Portrait</p>
                      <p className="text-[10px] text-muted-foreground">
                        Admin-curated high-res photo for the public Members Directory (4:4.3 ratio).
                      </p>
                    </div>
                    {editDirectoryPhoto && (
                      <button
                        type="button"
                        onClick={() => setEditDirectoryPhoto(null)}
                        className="text-[10px] font-mono text-red-500 hover:underline cursor-pointer"
                      >
                        Remove Photo
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="relative w-16 h-[70px] rounded-xl overflow-hidden bg-neutral-900 border border-border shrink-0">
                      <img
                        src={
                          editDirectoryPhoto ||
                          editingMember.profilePhoto ||
                          `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(editingMember.name)}`
                        }
                        alt="Directory preview"
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="space-y-1">
                      <label
                        htmlFor="member-photo-upload"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-foreground/[0.04] hover:bg-foreground/[0.08] text-xs font-mono text-foreground cursor-pointer transition-colors"
                      >
                        <Camera size={13} />
                        <span>{uploadingPhoto ? 'Uploading...' : 'Upload & Crop Portrait'}</span>
                      </label>
                      <input
                        id="member-photo-upload"
                        type="file"
                        accept={ACCEPT_MAP.AVATAR}
                        onChange={handlePhotoSelect}
                        className="hidden"
                      />
                      <p className="text-[10px] text-muted-foreground">
                        Uses standard 4:4.3 crop to maintain symmetrical directory grid
                      </p>
                    </div>
                  </div>
                </div>

                {/* Section Classification */}
                <div className="space-y-1">
                  <label className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                    Club Section Classification *
                  </label>
                  <select
                    value={editSection}
                    onChange={(e) => setEditSection(e.target.value as MemberSection)}
                    className="w-full rounded-xl border border-border bg-foreground/[0.02] p-2.5 text-xs text-foreground focus:border-amber-400 focus:outline-none"
                  >
                    <option value={MemberSection.COORDINATORS} className="bg-card">
                      COORDINATORS (Leadership)
                    </option>
                    <option value={MemberSection.CORE} className="bg-card">
                      CORE COMMITTEE (Heads &amp; Leads)
                    </option>
                    <option value={MemberSection.TEAM} className="bg-card">
                      TEAM MEMBERS (Active Club Members)
                    </option>
                  </select>
                </div>

                {/* Custom Title */}
                <div className="space-y-1">
                  <label className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                    Custom Editorial / Club Title
                  </label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    maxLength={60}
                    placeholder="e.g. Lead Designer, Editorial Head, Webmaster"
                    className="w-full rounded-xl border border-border bg-foreground/[0.02] p-2.5 text-xs text-foreground focus:border-amber-400 focus:outline-none"
                  />
                </div>

                {/* Display Position / Order */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                      Display Position / Order (Priority)
                    </label>
                    <span className="text-[10px] text-amber-500 font-mono">
                      Lower numbers appear first (e.g. 0, 1, 2...)
                    </span>
                  </div>
                  <input
                    type="number"
                    value={editDisplayOrder}
                    onChange={(e) => setEditDisplayOrder(parseInt(e.target.value, 10) || 0)}
                    min={0}
                    className="w-full rounded-xl border border-border bg-foreground/[0.02] p-2.5 text-xs text-foreground focus:border-amber-400 focus:outline-none font-mono"
                  />
                </div>

                {/* Branch & Batch */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                      Branch
                    </label>
                    <input
                      type="text"
                      value={editBranch}
                      onChange={(e) => setEditBranch(e.target.value)}
                      placeholder="e.g. CSE"
                      className="w-full rounded-xl border border-border bg-foreground/[0.02] p-2.5 text-xs text-foreground focus:border-amber-400 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                      Batch
                    </label>
                    <input
                      type="text"
                      value={editBatch}
                      onChange={(e) => setEditBatch(e.target.value)}
                      placeholder="e.g. 2026"
                      className="w-full rounded-xl border border-border bg-foreground/[0.02] p-2.5 text-xs text-foreground focus:border-amber-400 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Social Media Visibility Toggle Switch */}
                <div className="flex items-center justify-between rounded-2xl border border-border bg-foreground/[0.02] p-4">
                  <div className="space-y-0.5">
                    <p className="text-xs font-semibold text-foreground">Show Social Media Links</p>
                    <p className="text-[10px] text-muted-foreground">
                      Display member's attached LinkedIn, GitHub, or Instagram links on their public directory card.
                    </p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={editShowSocialLinks}
                    onClick={() => setEditShowSocialLinks(!editShowSocialLinks)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      editShowSocialLinks ? 'bg-emerald-500' : 'bg-neutral-600 dark:bg-neutral-800'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                        editShowSocialLinks ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </form>

              {/* Pinned Footer */}
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border/50 bg-card shrink-0">
                <button
                  type="button"
                  onClick={() => setEditingMember(null)}
                  className="px-4 py-2 rounded-xl border border-border text-xs font-mono uppercase text-muted-foreground hover:bg-foreground/[0.04] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveMember}
                  disabled={saving}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-amber-400 text-neutral-950 text-xs font-mono font-bold uppercase tracking-wider hover:bg-amber-300 active:scale-98 transition-all disabled:opacity-50 cursor-pointer"
                >
                  <CheckCircle2 size={14} />
                  <span>{saving ? 'Saving...' : 'Save Profile'}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Image Cropper Modal for Official Member Directory Photo */}
      {cropModalOpen && selectedImageSrc && (
        <ImageCropperModal
          isOpen={cropModalOpen}
          imageSrc={selectedImageSrc}
          aspectRatio={4 / 4.3}
          aspectPresetLabel="Member Portrait (4:4.3)"
          onCropComplete={handleCropComplete}
          onCancel={() => {
            setCropModalOpen(false);
            setSelectedImageSrc(null);
          }}
        />
      )}
    </div>
  );
}
