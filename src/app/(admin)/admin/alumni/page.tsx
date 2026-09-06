// src/app/(admin)/admin/alumni/page.tsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  GraduationCap,
  Search,
  Plus,
  Edit,
  Trash2,
  CheckCircle2,
  ExternalLink,
  Mail,
  Briefcase,
  Globe,
  Share2,
  X,
  Sparkles,
  Phone,
  UserCheck,
  Lock,
  Eye,
  EyeOff,
  Filter,
} from 'lucide-react';
import { ImageCropperModal } from '@/components/ui/ImageCropperModal';
import { uploadImageBlob } from '@/lib/upload';
import { validateUploadFile, ACCEPT_MAP } from '@/lib/file-validation';
import { useLenis } from 'lenis/react';
import { formatRole } from '@/lib/rbac';
import { getOptimizedAvatarUrl } from '@/lib/image-optimization';

interface LinkedUser {
  id: string;
  userId?: string | null;
  user?: LinkedUser | null;
  name: string;
  username: string;
  role?: string;
}

interface AlumniItem {
  id: string;
  name: string;
  photo?: string | null;
  batch: string;
  branch: string;
  currentPosition?: string | null;
  excelsiorPosition?: string | null;
  message?: string | null;
  instagram?: string | null;
  linkedin?: string | null;
  email?: string | null;
  phone?: string | null;
  showSocialsToTeam?: boolean;
  createdAt: string;
}

export default function AdminAlumniPage() {
  const [alumni, setAlumni] = useState<AlumniItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedBatch, setSelectedBatch] = useState<string>('ALL');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAlum, setEditingAlum] = useState<AlumniItem | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [batch, setBatch] = useState('');
  const [branch, setBranch] = useState('');
  const [currentPosition, setCurrentPosition] = useState('');
  const [excelsiorPosition, setExcelsiorPosition] = useState('');
  const [message, setMessage] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [instagram, setInstagram] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [photo, setPhoto] = useState('');
  const [showSocialsToTeam, setShowSocialsToTeam] = useState(true);
  const [saving, setSaving] = useState(false);
  const [linkedUser, setLinkedUser] = useState<LinkedUser | null>(null);
  const [userSearch, setUserSearch] = useState('');
  const [userMatches, setUserMatches] = useState<LinkedUser[]>([]);
  const [searchingUsers, setSearchingUsers] = useState(false);

  // Photo Cropper State
  const [cropperRawSrc, setCropperRawSrc] = useState<string | null>(null);
  const [isCropperOpen, setIsCropperOpen] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const lenis = useLenis();

  // Scroll lock and Lenis isolation when modal is active
  useEffect(() => {
    if (isModalOpen) {
      lenis?.stop();
      const origOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        lenis?.start();
        document.body.style.overflow = origOverflow;
      };
    }
  }, [isModalOpen, lenis]);

  useEffect(() => {
    if (!isModalOpen || userSearch.trim().length < 2) {
      setUserMatches([]);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setSearchingUsers(true);
      try {
        const params = new URLSearchParams({ q: userSearch.trim() });
        if (editingAlum?.id) params.set('profileId', editingAlum.id);
        const res = await fetch(`/api/admin/alumni/users?${params.toString()}`, { signal: controller.signal });
        const data = await res.json();
        if (res.ok && data.success) setUserMatches(data.users || []);
      } catch (err) {
        if (!(err instanceof DOMException && err.name === 'AbortError')) console.error(err);
      } finally {
        setSearchingUsers(false);
      }
    }, 250);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [isModalOpen, userSearch, editingAlum]);

  const fetchAlumni = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/alumni');
      const data = await res.json();
      if (res.ok && data.success) {
        setAlumni(data.alumni || []);
      } else {
        setFeedback({ type: 'error', text: data.error || 'Failed to load alumni records' });
      }
    } catch (err) {
      console.error(err);
      setFeedback({ type: 'error', text: 'Network error fetching alumni' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlumni();
  }, []);

  const uniqueBatches = useMemo(() => {
    const batches = Array.from(new Set(alumni.map((a) => a.batch).filter(Boolean))).sort().reverse();
    return batches;
  }, [alumni]);

  const batchCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const a of alumni) {
      if (a.batch) {
        counts[a.batch] = (counts[a.batch] || 0) + 1;
      }
    }
    return counts;
  }, [alumni]);

  const filteredAlumni = useMemo(() => {
    return alumni.filter((a) => {
      const matchesBatch = selectedBatch === 'ALL' || a.batch === selectedBatch;
      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        a.name.toLowerCase().includes(q) ||
        a.branch.toLowerCase().includes(q) ||
        (a.currentPosition && a.currentPosition.toLowerCase().includes(q)) ||
        (a.excelsiorPosition && a.excelsiorPosition.toLowerCase().includes(q));

      return matchesBatch && matchesSearch;
    });
  }, [alumni, selectedBatch, search]);

  const openCreateModal = () => {
    setEditingAlum(null);
    setName('');
    setBatch(uniqueBatches[0] || new Date().getFullYear().toString());
    setBranch('CSE');
    setCurrentPosition('');
    setExcelsiorPosition('');
    setMessage('');
    setLinkedin('');
    setInstagram('');
    setEmail('');
    setPhone('');
    setPhoto('');
    setShowSocialsToTeam(true);
    setLinkedUser(null);
    setUserSearch('');
    setIsModalOpen(true);
  };

  const openEditModal = (alum: AlumniItem) => {
    setEditingAlum(alum);
    setName(alum.name);
    setBatch(alum.batch);
    setBranch(alum.branch);
    setCurrentPosition(alum.currentPosition || '');
    setExcelsiorPosition(alum.excelsiorPosition || '');
    setMessage(alum.message || '');
    setLinkedin(alum.linkedin || '');
    setInstagram(alum.instagram || '');
    setEmail(alum.email || '');
    setPhone(alum.phone || '');
    setPhoto(alum.photo || '');
    setShowSocialsToTeam(alum.showSocialsToTeam ?? true);
    setLinkedUser(null);
    setUserSearch('');
    setIsModalOpen(true);
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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
    reader.onload = () => {
      setCropperRawSrc(reader.result as string);
      setIsCropperOpen(true);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleCropComplete = async (blob: Blob, previewUrl: string) => {
    setIsCropperOpen(false);
    setUploadingPhoto(true);
    setModalError(null);
    try {
      const url = await uploadImageBlob(blob, 'alumni-photos', `${name || 'alumni'}_photo.jpg`);
      setPhoto(url);
      setFeedback({ type: 'success', text: 'Alumni portrait uploaded to Cloudinary.' });
    } catch (err: any) {
      console.error(err);
      const errorMsg = err.message || 'Failed to upload photo. Please upload an image with size less than 10MB.';
      setModalError(errorMsg);
      setFeedback({ type: 'error', text: errorMsg });
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSaveAlum = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !batch.trim() || !branch.trim()) {
      setFeedback({ type: 'error', text: 'Name, Batch, and Branch are required.' });
      return;
    }

    setSaving(true);
    const payload = {
      name: name.trim(),
      batch: batch.trim(),
      branch: branch.trim(),
      currentPosition: currentPosition.trim() || null,
      excelsiorPosition: excelsiorPosition.trim() || null,
      message: message.trim() || null,
      linkedin: linkedin.trim() || null,
      instagram: instagram.trim() || null,
      email: email.trim() || null,
      phone: phone.trim() || null,
      showSocialsToTeam,
      photo: photo.trim() || null,
      userId: linkedUser?.id || null,
    };

    try {
      const url = editingAlum ? `/api/admin/alumni/${editingAlum.id}` : '/api/admin/alumni';
      const method = editingAlum ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setFeedback({
          type: 'success',
          text: `Successfully ${editingAlum ? 'updated' : 'added'} alumni profile for ${name}!`,
        });
        setIsModalOpen(false);
        fetchAlumni();
      } else {
        setFeedback({ type: 'error', text: data.error || 'Failed to save alumni profile' });
      }
    } catch (err) {
      console.error(err);
      setFeedback({ type: 'error', text: 'Network error saving alumni profile' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAlum = async (id: string, alumName: string) => {
    if (!confirm(`Are you sure you want to remove ${alumName} from the Alumni Directory?`)) return;

    try {
      const res = await fetch(`/api/admin/alumni/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setFeedback({ type: 'success', text: `Removed ${alumName} from directory.` });
        fetchAlumni();
      } else {
        setFeedback({ type: 'error', text: data.error || 'Failed to delete alumni profile' });
      }
    } catch (err) {
      console.error(err);
      setFeedback({ type: 'error', text: 'Network error deleting alumni profile' });
    }
  };

  return (
    <div className="w-full min-h-screen bg-neutral-50 dark:bg-[#070707] text-neutral-900 dark:text-neutral-100 selection:bg-neutral-900 selection:text-white dark:selection:bg-white dark:selection:text-neutral-950 px-4 sm:px-6 md:px-8 py-8 md:py-10 max-w-6xl mx-auto space-y-8">
      {/* SaaS Monochrome Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-2.5">
          <Link
            href="/admin/members"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0e0e0e] hover:bg-neutral-100 dark:hover:bg-neutral-850 text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-all shadow-xs"
          >
            <ArrowLeft size={13} />
            <span>Members Roster</span>
          </Link>
          <span className="text-neutral-300 dark:text-neutral-700 text-xs">•</span>
          <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider font-mono">
            Alumni Directory
          </span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800/80 pb-6">
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-neutral-900 dark:text-white flex items-center gap-3">
              <span>Alumni Heritage &amp; Directory</span>
              <span className="text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-800">
                {alumni.length} Profiles
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1">
              Maintain verified records of club graduates, career trajectories, and private guidance contacts.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href="/community/alumni"
              target="_blank"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0e0e0e] hover:bg-neutral-100 dark:hover:bg-neutral-850 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition-all shadow-xs"
            >
              <GraduationCap size={13} className="text-neutral-400" />
              <span>Public Alumni Wall</span>
              <ExternalLink size={11} className="text-neutral-400" />
            </Link>

            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 text-xs font-medium hover:bg-neutral-800 dark:hover:bg-neutral-200 active:scale-[0.98] transition-all shadow-sm cursor-pointer"
            >
              <Plus size={14} />
              <span>Add Alumni Profile</span>
            </button>
          </div>
        </div>
      </div>

      {/* Feedback Alert */}
      {feedback && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-3.5 sm:p-4 rounded-xl border text-xs flex items-center justify-between gap-3 shadow-xs ${
            feedback.type === 'success'
              ? 'bg-neutral-100 dark:bg-neutral-900 border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white'
              : 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900 text-red-700 dark:text-red-300'
          }`}
        >
          <span className="font-medium">{feedback.text}</span>
          <button onClick={() => setFeedback(null)} className="p-1 text-neutral-400 hover:text-neutral-900 dark:hover:text-white cursor-pointer">
            <X size={14} />
          </button>
        </motion.div>
      )}

      {/* Filters, Batch Selector & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Batch Filter Pills (Clean Single-Line Wrap-free) */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-white dark:bg-[#0e0e0e] border border-neutral-200 dark:border-neutral-800 overflow-x-auto max-w-full md:max-w-[55%] shadow-xs">
          <button
            onClick={() => setSelectedBatch('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
              selectedBatch === 'ALL'
                ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 shadow-xs'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            All Batches ({alumni.length})
          </button>
          {uniqueBatches.map((b) => (
            <button
              key={b}
              onClick={() => setSelectedBatch(b)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                selectedBatch === b
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              Class of {b} ({batchCounts[b] || 0})
            </button>
          ))}
        </div>

        {/* Quick Batch Dropdown + Search Input */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          {/* Direct Dropdown to Select All / Specific Batches */}
          <div className="relative">
            <select
              value={selectedBatch}
              onChange={(e) => setSelectedBatch(e.target.value)}
              className="px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0e0e0e] text-xs text-neutral-800 dark:text-neutral-200 font-medium focus:outline-none focus:border-neutral-900 dark:focus:border-white shadow-xs cursor-pointer"
            >
              <option value="ALL">All Batches ({alumni.length})</option>
              {uniqueBatches.map((b) => (
                <option key={b} value={b}>
                  Class of {b} ({batchCounts[b] || 0})
                </option>
              ))}
            </select>
          </div>

          {/* Search Input */}
          <div className="relative flex-1 md:w-64">
            <Search size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search alumni, company, role..."
              className="w-full rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0e0e0e] pl-9 pr-3.5 py-2 text-xs text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:border-neutral-900 dark:focus:border-white focus:outline-none transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Alumni Directory Grid with Stable Height and Smooth Transitions */}
      <div className="min-h-120">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-56 rounded-2xl border border-neutral-200 dark:border-neutral-850 bg-white/50 dark:bg-[#0a0a0a]/50 animate-pulse"
              />
            ))}
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {filteredAlumni.length === 0 ? (
              <motion.div
                key={`empty-${selectedBatch}-${search}`}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.15 }}
                className="py-20 text-center rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0e0e0e] space-y-3"
              >
                <GraduationCap size={32} className="mx-auto text-neutral-400" />
                <p className="font-serif text-lg font-bold text-neutral-900 dark:text-white">
                  No Alumni Records Found
                </p>
                <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                  {search
                    ? `No alumni matching "${search}". Try searching another name, batch, or company.`
                    : 'Add alumni profiles to showcase graduate career milestones and club legacy.'}
                </p>
                <div className="pt-2">
                  <button
                    onClick={openCreateModal}
                    className="px-4 py-2 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 text-xs font-medium hover:bg-neutral-800 dark:hover:bg-neutral-200 shadow-sm cursor-pointer"
                  >
                    Add Alumni Profile
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key={`grid-${selectedBatch}-${search}`}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.15 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
              >
                {filteredAlumni.map((alum) => (
                  <div
                    key={alum.id}
                    className="group relative rounded-2xl border border-neutral-200 dark:border-neutral-800/90 bg-white dark:bg-[#0a0a0a] overflow-hidden shadow-xs hover:border-neutral-300 dark:hover:border-neutral-700 transition-all p-5 flex flex-col justify-between space-y-4"
                  >
                    {/* Top: Avatar & Basics */}
                    <div className="space-y-3">
                      <div className="flex items-start gap-3.5">
                        <div className="h-11 w-11 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 overflow-hidden flex items-center justify-center font-bold text-neutral-900 dark:text-white font-serif text-base shrink-0 shadow-xs">
                          {alum.photo && alum.photo.trim() !== '' && alum.photo !== 'null' && alum.photo !== 'undefined' ? (
                            <img
                              src={getOptimizedAvatarUrl(alum.photo, 96)}
                              alt={alum.name}
                              onError={(e) => {
                                const fallback = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(alum.name || 'Alumnus')}`;
                                if (e.currentTarget.src !== fallback) {
                                  e.currentTarget.src = fallback;
                                }
                              }}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            alum.name.charAt(0).toUpperCase()
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <h3 className="font-serif text-base sm:text-lg font-bold text-neutral-900 dark:text-white leading-snug truncate">
                            {alum.name}
                          </h3>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-[10px] uppercase font-bold text-neutral-500 dark:text-neutral-400 tracking-wider">
                              Class of {alum.batch} · {alum.branch}
                            </span>
                            <span
                              className={`inline-flex items-center gap-1 text-[9px] font-mono font-medium px-2 py-0.5 rounded-full border ${
                                alum.showSocialsToTeam !== false
                                  ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50'
                                  : 'bg-neutral-100 dark:bg-neutral-900 text-neutral-500 border-neutral-200 dark:border-neutral-800'
                              }`}
                              title={alum.showSocialsToTeam !== false ? 'Socials visible to club team' : 'Socials hidden from team'}
                            >
                              {alum.showSocialsToTeam !== false ? <Eye size={9} /> : <EyeOff size={9} />}
                              <span>{alum.showSocialsToTeam !== false ? 'Team Socials' : 'Private Socials'}</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Career & Position */}
                      <div className="space-y-1.5 text-xs">
                        {alum.currentPosition && (
                          <div className="flex items-center gap-2 text-neutral-900 dark:text-white font-medium">
                            <Briefcase size={12} className="text-neutral-400 shrink-0" />
                            <span className="truncate text-xs">{alum.currentPosition}</span>
                          </div>
                        )}
                        {alum.excelsiorPosition && (
                          <div className="flex items-center gap-2 text-neutral-500 dark:text-neutral-400 text-[11px] font-mono">
                            <Sparkles size={11} className="text-neutral-400 shrink-0" />
                            <span className="truncate">Past: {alum.excelsiorPosition}</span>
                          </div>
                        )}
                      </div>

                      {/* Quote / Advice */}
                      {alum.message && (
                        <div className="p-3 rounded-xl bg-neutral-50 dark:bg-[#0e0e0e] border border-neutral-200/80 dark:border-neutral-800/80 text-xs italic text-neutral-600 dark:text-neutral-400 font-serif leading-relaxed line-clamp-3">
                          &ldquo;{alum.message}&rdquo;
                        </div>
                      )}
                    </div>

                    {/* Bottom: Social links & Actions */}
                    <div className="flex items-center justify-between pt-3 border-t border-neutral-200 dark:border-neutral-800/80 gap-2">
                      <div className="flex items-center gap-1">
                        {alum.linkedin && (
                          <a
                            href={alum.linkedin}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-850 transition-colors"
                            title="LinkedIn Profile"
                          >
                            <Globe size={13} />
                          </a>
                        )}
                        {alum.instagram && (
                          <a
                            href={alum.instagram}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-850 transition-colors"
                            title="Instagram"
                          >
                            <Share2 size={13} />
                          </a>
                        )}
                        {alum.email && (
                          <a
                            href={`mailto:${alum.email}`}
                            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-850 transition-colors"
                            title={`Email: ${alum.email} (Coordinator & Core Only)`}
                          >
                            <Mail size={13} />
                          </a>
                        )}
                        {alum.phone && (
                          <a
                            href={`tel:${alum.phone}`}
                            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-850 transition-colors"
                            title={`Phone: ${alum.phone} (Coordinator & Core Only)`}
                          >
                            <Phone size={13} />
                          </a>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => openEditModal(alum)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0e0e0e] hover:bg-neutral-100 dark:hover:bg-neutral-850 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition-all shadow-xs cursor-pointer"
                        >
                          <Edit size={12} />
                          <span>Edit</span>
                        </button>

                        <button
                          onClick={() => handleDeleteAlum(alum.id, alum.name)}
                          className="p-1.5 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 transition-colors cursor-pointer"
                          title="Delete alumni profile"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>

      {/* CREATE / EDIT ALUMNI MODAL (Monochrome SaaS Style) */}
      <AnimatePresence>
        {isModalOpen && (
          <div
            data-lenis-prevent
            className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-sm p-3 sm:p-6 flex items-center justify-center min-h-screen"
          >
            <div
              onClick={() => setIsModalOpen(false)}
              className="fixed inset-0 -z-10"
              aria-hidden="true"
            />

            <motion.div
              data-lenis-prevent
              initial={{ opacity: 0, scale: 0.97, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 12 }}
              className="relative z-10 w-full max-w-lg my-auto rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0a0a0a] text-neutral-900 dark:text-neutral-100 shadow-2xl overflow-hidden flex flex-col max-h-[88vh]"
            >
              {/* Modal Header */}
              <div className="shrink-0 p-5 md:px-6 md:py-4 border-b border-neutral-200 dark:border-neutral-800/80 flex items-center justify-between bg-white dark:bg-[#0a0a0a] z-20">
                <div>
                  <h3 className="font-serif text-lg md:text-xl font-bold text-neutral-900 dark:text-white">
                    {editingAlum ? 'Edit Alumni Profile' : 'Add Alumni Profile'}
                  </h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                    Maintain accurate alumni directory records and career milestones
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="text-neutral-400 hover:text-neutral-900 dark:hover:text-white p-1.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors cursor-pointer"
                >
                  <X size={17} />
                </button>
              </div>

              {/* Form Body - Scrollable Container with Guaranteed Lenis Isolation */}
              <form
                id="alumni-form"
                data-lenis-prevent
                onSubmit={handleSaveAlum}
                className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-5 md:p-6 space-y-4 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-neutral-300 dark:[&::-webkit-scrollbar-thumb]:bg-neutral-700 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent"
                style={{
                  scrollbarWidth: 'thin',
                  scrollbarColor: '#777777 transparent',
                }}
              >
                {/* Modal Error Alert Prompt */}
                {modalError && (
                  <div className="p-3.5 rounded-xl border border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400 text-xs flex items-center justify-between gap-3 shadow-xs">
                    <span className="font-semibold">{modalError}</span>
                    <button
                      type="button"
                      onClick={() => setModalError(null)}
                      className="p-1 text-red-500 hover:text-red-700 dark:hover:text-red-200 cursor-pointer"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}
                {/* Photo Upload with 4:4.3 Portrait Cropper */}
                <div className="flex items-center gap-4 p-3.5 rounded-2xl bg-neutral-50 dark:bg-[#0e0e0e] border border-neutral-200 dark:border-neutral-800">
                  <div className="h-14 w-14 rounded-2xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 overflow-hidden flex items-center justify-center font-bold text-neutral-400 font-serif text-xl shrink-0 shadow-xs">
                    {photo ? (
                      <img src={photo} alt="Alumni preview" className="h-full w-full object-cover" />
                    ) : (
                      <GraduationCap size={22} className="text-neutral-400" />
                    )}
                  </div>

                  <div className="space-y-1 flex-1 min-w-0">
                    <label
                      htmlFor="alumni-photo-upload"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#141414] hover:bg-neutral-100 dark:hover:bg-neutral-850 text-xs font-medium text-neutral-700 dark:text-neutral-300 cursor-pointer shadow-xs transition-colors"
                    >
                      <span>{uploadingPhoto ? 'Uploading...' : 'Upload Photo (4:4.3)'}</span>
                    </label>
                    <input
                      id="alumni-photo-upload"
                      type="file"
                      accept={ACCEPT_MAP.AVATAR}
                      onChange={handlePhotoSelect}
                      className="hidden"
                    />
                    <p className="text-[10px] text-neutral-500 dark:text-neutral-400">
                      Standard portrait crop for the public alumni wall
                    </p>
                  </div>
                </div>

                {/* Linked Account (Optional) */}
                <div className="space-y-2 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-[#0e0e0e] p-3.5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-medium text-neutral-700 dark:text-neutral-300">
                        Linked Member Account (Optional)
                      </p>
                      <p className="text-[10px] text-neutral-500">
                        Connect to an existing member account for seamless profile syncing.
                      </p>
                    </div>
                    {linkedUser && (
                      <button
                        type="button"
                        onClick={() => {
                          setLinkedUser(null);
                          setUserSearch('');
                        }}
                        className="text-[10px] font-mono uppercase text-red-600 dark:text-red-400 hover:underline cursor-pointer"
                      >
                        Unlink
                      </button>
                    )}
                  </div>

                  {linkedUser ? (
                    <div className="flex items-center justify-between rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#141414] px-3 py-2 text-xs">
                      <span className="text-neutral-900 dark:text-white flex items-center gap-1.5">
                        <UserCheck size={13} className="text-emerald-600 dark:text-emerald-400" />
                        <span className="font-medium">{linkedUser.name}</span>
                        <span className="font-mono text-neutral-500">
                          @{linkedUser.username} {linkedUser.role ? `· ${formatRole(linkedUser.role)}` : ''}
                        </span>
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setLinkedUser(null);
                          setUserSearch('');
                        }}
                        className="font-mono text-[10px] uppercase text-neutral-500 hover:text-neutral-900 dark:hover:text-white cursor-pointer"
                      >
                        Change
                      </button>
                    </div>
                  ) : (
                    <div className="relative">
                      <input
                        type="search"
                        value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
                        placeholder="Search name or username (min. 2 characters)"
                        className="w-full rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#141414] p-2.5 text-xs text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:border-neutral-900 dark:focus:border-white focus:outline-none"
                      />
                      {userSearch.trim().length >= 2 && (searchingUsers || userMatches.length > 0) && (
                        <div className="mt-1 overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#141414] shadow-lg">
                          <div className="px-3 py-1.5 text-[10px] font-mono text-neutral-500">
                            {searchingUsers ? 'Searching accounts...' : 'Select an account'}
                          </div>
                          {userMatches.map((user) => (
                            <button
                              key={user.id}
                              type="button"
                              onClick={() => {
                                setLinkedUser(user);
                                setUserSearch('');
                                setUserMatches([]);
                              }}
                              className="flex w-full items-center justify-between border-t border-neutral-200 dark:border-neutral-800 px-3 py-2 text-left text-xs hover:bg-neutral-100 dark:hover:bg-neutral-850 cursor-pointer"
                            >
                              <span className="font-medium text-neutral-900 dark:text-white">{user.name}</span>
                              <span className="font-mono text-neutral-500">
                                @{user.username} {user.role ? `· ${formatRole(user.role)}` : ''}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Full Name */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-medium text-neutral-600 dark:text-neutral-400">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Vikramaditya Singhania"
                    required
                    className="w-full rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0e0e0e] p-2.5 text-xs text-neutral-900 dark:text-white focus:border-neutral-900 dark:focus:border-white focus:outline-none transition-colors"
                  />
                </div>

                {/* Batch and Branch */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-medium text-neutral-600 dark:text-neutral-400">
                        Graduation Batch (Year) *
                      </label>
                      {uniqueBatches.length > 0 && (
                        <span className="text-[10px] text-neutral-400 font-mono">
                          e.g. {uniqueBatches[0]}
                        </span>
                      )}
                    </div>
                    <input
                      type="text"
                      list="batch-suggestions"
                      value={batch}
                      onChange={(e) => setBatch(e.target.value)}
                      placeholder="e.g. 2020-2024 or 2024"
                      required
                      className="w-full rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0e0e0e] p-2.5 text-xs text-neutral-900 dark:text-white font-mono focus:border-neutral-900 dark:focus:border-white focus:outline-none transition-colors"
                    />
                    <datalist id="batch-suggestions">
                      {uniqueBatches.map((b) => (
                        <option key={b} value={b} />
                      ))}
                    </datalist>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-medium text-neutral-600 dark:text-neutral-400">
                      Branch / Department *
                    </label>
                    <input
                      type="text"
                      value={branch}
                      onChange={(e) => setBranch(e.target.value)}
                      placeholder="e.g. Computer Science"
                      required
                      className="w-full rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0e0e0e] p-2.5 text-xs text-neutral-900 dark:text-white focus:border-neutral-900 dark:focus:border-white focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                {/* Current and Past Roles */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-medium text-neutral-600 dark:text-neutral-400">
                      Current Position &amp; Company
                    </label>
                    <input
                      type="text"
                      value={currentPosition}
                      onChange={(e) => setCurrentPosition(e.target.value)}
                      placeholder="e.g. Product Designer at Figma"
                      className="w-full rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0e0e0e] p-2.5 text-xs text-neutral-900 dark:text-white focus:border-neutral-900 dark:focus:border-white focus:outline-none transition-colors"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-medium text-neutral-600 dark:text-neutral-400">
                      Past Excelsior Role
                    </label>
                    <input
                      type="text"
                      value={excelsiorPosition}
                      onChange={(e) => setExcelsiorPosition(e.target.value)}
                      placeholder="e.g. Coordinator (2022-23)"
                      className="w-full rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0e0e0e] p-2.5 text-xs text-neutral-900 dark:text-white focus:border-neutral-900 dark:focus:border-white focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                {/* Quote / Advice */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-medium text-neutral-600 dark:text-neutral-400">
                    Message / Words to Members
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Reflections, advice, or memories from Excelsior days..."
                    rows={3}
                    className="w-full rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0e0e0e] p-2.5 text-xs text-neutral-900 dark:text-white focus:border-neutral-900 dark:focus:border-white focus:outline-none transition-colors font-serif leading-relaxed"
                  />
                </div>

                {/* Social Visibility Toggle Switch */}
                <div className="flex items-center justify-between p-3.5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-[#0e0e0e]">
                  <div className="space-y-0.5 max-w-[80%]">
                    <p className="text-xs font-medium text-neutral-900 dark:text-white flex items-center gap-1.5">
                      <Share2 size={13} className="text-neutral-500" />
                      <span>Show Socials to Club Team</span>
                    </p>
                    <p className="text-[10px] text-neutral-500">
                      When enabled, verified club members/team can see Instagram &amp; LinkedIn links.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowSocialsToTeam(!showSocialsToTeam)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      showSocialsToTeam ? 'bg-neutral-900 dark:bg-white' : 'bg-neutral-300 dark:bg-neutral-700'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white dark:bg-black shadow-md ring-0 transition duration-200 ease-in-out ${
                        showSocialsToTeam ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Social Links */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-medium text-neutral-600 dark:text-neutral-400">
                      LinkedIn URL
                    </label>
                    <input
                      type="url"
                      value={linkedin}
                      onChange={(e) => setLinkedin(e.target.value)}
                      placeholder="https://linkedin.com/in/..."
                      className="w-full rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0e0e0e] p-2.5 text-xs text-neutral-900 dark:text-white font-mono focus:border-neutral-900 dark:focus:border-white focus:outline-none transition-colors"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-medium text-neutral-600 dark:text-neutral-400">
                      Instagram Profile
                    </label>
                    <input
                      type="text"
                      value={instagram}
                      onChange={(e) => setInstagram(e.target.value)}
                      placeholder="https://instagram.com/..."
                      className="w-full rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0e0e0e] p-2.5 text-xs text-neutral-900 dark:text-white font-mono focus:border-neutral-900 dark:focus:border-white focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                {/* Private Contact Info (Coordinator & Core Committee Only) */}
                <div className="p-3.5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-[#0e0e0e] space-y-3">
                  <div className="flex items-center gap-1.5 text-xs text-neutral-700 dark:text-neutral-300 font-medium">
                    <Lock size={12} className="text-amber-600 dark:text-amber-400" />
                    <span>Private Contacts (Coordinator &amp; Core Committee Only)</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-medium text-neutral-600 dark:text-neutral-400">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@company.com"
                        className="w-full rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#141414] p-2.5 text-xs text-neutral-900 dark:text-white font-mono focus:border-neutral-900 dark:focus:border-white focus:outline-none transition-colors"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-medium text-neutral-600 dark:text-neutral-400">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="w-full rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#141414] p-2.5 text-xs text-neutral-900 dark:text-white font-mono focus:border-neutral-900 dark:focus:border-white focus:outline-none transition-colors"
                      />
                    </div>
                  </div>
                </div>
              </form>

              {/* Modal Actions - Pinned at bottom of card */}
              <div className="shrink-0 p-4 md:px-6 border-t border-neutral-200 dark:border-neutral-800/80 bg-white dark:bg-[#0a0a0a] flex items-center justify-end gap-2.5 z-20">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0e0e0e] hover:bg-neutral-100 dark:hover:bg-neutral-850 text-xs font-medium text-neutral-700 dark:text-neutral-300 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="alumni-form"
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 text-xs font-medium hover:bg-neutral-800 dark:hover:bg-neutral-200 active:scale-[0.98] transition-all shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  <CheckCircle2 size={13} />
                  <span>{saving ? 'Saving...' : editingAlum ? 'Save Changes' : 'Create Profile'}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 4:4.3 Avatar Cropper */}
      {cropperRawSrc && (
        <ImageCropperModal
          isOpen={isCropperOpen}
          imageSrc={cropperRawSrc}
          aspectRatio={4 / 4.3}
          aspectPresetLabel="Alumni Portrait (4:4.3)"
          onCropComplete={handleCropComplete}
          onCancel={() => setIsCropperOpen(false)}
        />
      )}
    </div>
  );
}
