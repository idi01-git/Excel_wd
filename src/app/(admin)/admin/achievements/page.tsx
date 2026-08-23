// src/app/(admin)/admin/achievements/page.tsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Trophy,
  Plus,
  Trash2,
  Edit,
  CheckCircle2,
  RefreshCw,
  Calendar,
  BookOpen,
  Medal,
  Flag,
  Camera,
  X,
} from 'lucide-react';
import { AchievementCategory } from '@prisma/client';
import { ImageCropperModal } from '@/components/ui/ImageCropperModal';
import { uploadImageBlob } from '@/lib/upload';
import { validateUploadFile, ACCEPT_MAP } from '@/lib/file-validation';
import { useLenis } from 'lenis/react';

interface AchievementItem {
  id: string;
  title: string;
  description: string;
  category: AchievementCategory;
  date: string;
  image?: string | null;
  createdAt: string;
}

export default function AdminAchievementsPage() {
  const [achievements, setAchievements] = useState<AchievementItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<'ALL' | AchievementCategory>('ALL');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<AchievementItem | null>(null);

  // Form Fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<AchievementCategory>(AchievementCategory.AWARD);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [image, setImage] = useState('');
  const [saving, setSaving] = useState(false);

  // Image Cropper
  const [cropperRawSrc, setCropperRawSrc] = useState<string | null>(null);
  const [isCropperOpen, setIsCropperOpen] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

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

  const fetchAchievements = async () => {
    try {
      const res = await fetch('/api/admin/achievements');
      const data = await res.json();
      if (data.success) {
        setAchievements(data.achievements || []);
      } else {
        setFeedback({ type: 'error', text: data.error || 'Failed to load achievements' });
      }
    } catch (err) {
      console.error(err);
      setFeedback({ type: 'error', text: 'Network error loading achievements' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAchievements();
  }, []);

  const filteredAchievements = useMemo(() => {
    return achievements.filter((item) =>
      activeCategory === 'ALL' ? true : item.category === activeCategory
    );
  }, [achievements, activeCategory]);

  const openCreateModal = () => {
    setEditingItem(null);
    setTitle('');
    setDescription('');
    setCategory(AchievementCategory.AWARD);
    setDate(new Date().toISOString().split('T')[0]);
    setImage('');
    setIsModalOpen(true);
  };

  const openEditModal = (item: AchievementItem) => {
    setEditingItem(item);
    setTitle(item.title);
    setDescription(item.description);
    setCategory(item.category);
    setDate(item.date ? new Date(item.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
    setImage(item.image || '');
    setIsModalOpen(true);
  };

  const handleImageFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateUploadFile(file, 'MEDIA');
    if (!validation.valid) {
      setFeedback({ type: 'error', text: validation.error || 'Invalid image format or size.' });
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
    setUploadingImage(true);
    try {
      const uploadedUrl = await uploadImageBlob(blob, 'achievements', `achievement_${Date.now()}.jpg`);
      setImage(uploadedUrl);
      setFeedback({ type: 'success', text: 'Achievement image uploaded to Cloudinary.' });
    } catch (err: any) {
      console.error(err);
      setFeedback({ type: 'error', text: err.message || 'Failed to upload achievement image to Cloudinary.' });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSaveAchievement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      setFeedback({ type: 'error', text: 'Title and Description are mandatory.' });
      return;
    }

    setSaving(true);
    const payload = {
      title: title.trim(),
      description: description.trim(),
      category,
      date,
      image: image.trim() || null,
    };

    try {
      const targetUrl = editingItem
        ? `/api/admin/achievements/${editingItem.id}`
        : '/api/admin/achievements';
      const method = editingItem ? 'PUT' : 'POST';

      const res = await fetch(targetUrl, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setFeedback({
          type: 'success',
          text: `Successfully ${editingItem ? 'updated' : 'created'} achievement!`,
        });
        setIsModalOpen(false);
        fetchAchievements();
      } else {
        setFeedback({ type: 'error', text: data.error || 'Failed to save achievement' });
      }
    } catch (err) {
      console.error(err);
      setFeedback({ type: 'error', text: 'Network error saving achievement' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAchievement = async (id: string, itemTitle: string) => {
    if (!confirm(`Are you sure you want to delete "${itemTitle}" from achievements?`)) return;

    try {
      const res = await fetch(`/api/admin/achievements/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setFeedback({ type: 'success', text: 'Achievement removed and image cleaned.' });
        fetchAchievements();
      } else {
        setFeedback({ type: 'error', text: data.error || 'Failed to delete achievement' });
      }
    } catch (err) {
      console.error(err);
      setFeedback({ type: 'error', text: 'Network error deleting achievement' });
    }
  };

  const getCategoryIcon = (cat: AchievementCategory) => {
    switch (cat) {
      case AchievementCategory.COMPETITION:
        return <Trophy size={13} className="text-neutral-700 dark:text-neutral-300" />;
      case AchievementCategory.PUBLICATION:
        return <BookOpen size={13} className="text-neutral-700 dark:text-neutral-300" />;
      case AchievementCategory.AWARD:
        return <Medal size={13} className="text-neutral-700 dark:text-neutral-300" />;
      default:
        return <Flag size={13} className="text-neutral-700 dark:text-neutral-300" />;
    }
  };

  return (
    <div className="w-full min-h-screen bg-neutral-50 dark:bg-[#070707] text-neutral-900 dark:text-neutral-100 selection:bg-neutral-900 selection:text-white dark:selection:bg-white dark:selection:text-neutral-950 px-4 sm:px-6 md:px-8 py-8 md:py-10 max-w-6xl mx-auto space-y-8">
      {/* SaaS Monochrome Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-2.5">
          <Link
            href="/admin/events"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0e0e0e] hover:bg-neutral-100 dark:hover:bg-neutral-850 text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-all shadow-xs"
          >
            <ArrowLeft size={13} />
            <span>Admin Center</span>
          </Link>
          <span className="text-neutral-300 dark:text-neutral-700 text-xs">•</span>
          <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider font-mono">
            Honors &amp; Milestones
          </span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800/80 pb-6">
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-neutral-900 dark:text-white flex items-center gap-3">
              <span>Club Achievements</span>
              <span className="text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-800">
                {achievements.length} Records
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1">
              Document inter-college competition trophies, annual magazine releases, and society milestones.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 text-xs font-medium hover:bg-neutral-800 dark:hover:bg-neutral-200 active:scale-[0.98] transition-all shadow-sm"
            >
              <Plus size={14} />
              <span>Add Achievement</span>
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
          <button onClick={() => setFeedback(null)} className="p-1 text-neutral-400 hover:text-neutral-900 dark:hover:text-white">
            <X size={14} />
          </button>
        </motion.div>
      )}

      {/* Category Filter Pills (No Layout Shift) */}
      <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-white dark:bg-[#0e0e0e] border border-neutral-200 dark:border-neutral-800 overflow-x-auto w-fit shadow-xs">
        {(
          [
            { key: 'ALL', label: `All (${achievements.length})` },
            { key: AchievementCategory.COMPETITION, label: `Competitions (${achievements.filter((a) => a.category === AchievementCategory.COMPETITION).length})` },
            { key: AchievementCategory.AWARD, label: `Awards & Honors (${achievements.filter((a) => a.category === AchievementCategory.AWARD).length})` },
            { key: AchievementCategory.PUBLICATION, label: `Publications (${achievements.filter((a) => a.category === AchievementCategory.PUBLICATION).length})` },
            { key: AchievementCategory.MILESTONE, label: `Milestones (${achievements.filter((a) => a.category === AchievementCategory.MILESTONE).length})` },
          ] as const
        ).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveCategory(tab.key)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
              activeCategory === tab.key
                ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 shadow-xs'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Achievements Grid with Smooth Transitions and Stable Height */}
      <div className="min-h-[480px]">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-64 rounded-2xl border border-neutral-200 dark:border-neutral-850 bg-white/50 dark:bg-[#0a0a0a]/50 animate-pulse"
              />
            ))}
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {filteredAchievements.length === 0 ? (
              <motion.div
                key={`empty-${activeCategory}`}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.15 }}
                className="py-20 text-center rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0e0e0e] space-y-3"
              >
                <Trophy size={32} className="mx-auto text-neutral-400" />
                <p className="font-serif text-lg font-bold text-neutral-900 dark:text-white">
                  No {activeCategory === 'ALL' ? '' : activeCategory.charAt(0) + activeCategory.slice(1).toLowerCase() + ' '}Achievements Yet
                </p>
                <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                  Add your club&apos;s inter-college awards, literary honors, and milestone achievements.
                </p>
                <div className="pt-2">
                  <button
                    onClick={openCreateModal}
                    className="px-4 py-2 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 text-xs font-medium hover:bg-neutral-800 dark:hover:bg-neutral-200 shadow-sm"
                  >
                    Add Achievement
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key={`grid-${activeCategory}`}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.15 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
              >
                {filteredAchievements.map((item) => (
                  <div
                    key={item.id}
                    className="group relative rounded-2xl border border-neutral-200 dark:border-neutral-800/90 bg-white dark:bg-[#0a0a0a] overflow-hidden shadow-xs hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors flex flex-col justify-between"
                  >
                    {/* Image */}
                    {item.image && (
                      <div className="aspect-[16/9] w-full relative bg-neutral-100 dark:bg-neutral-900 overflow-hidden border-b border-neutral-200 dark:border-neutral-800">
                        <img
                          src={item.image}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    {/* Content */}
                    <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-900 text-[10px] font-mono uppercase font-bold text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-800">
                            {getCategoryIcon(item.category)}
                            {item.category}
                          </span>

                          <span className="font-mono text-[10px] text-neutral-400">
                            {item.date ? new Date(item.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : ''}
                          </span>
                        </div>

                        <h3 className="font-serif text-base sm:text-lg font-bold text-neutral-900 dark:text-white leading-snug">
                          {item.title}
                        </h3>

                        <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed line-clamp-3">
                          {item.description}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="pt-3 border-t border-neutral-200 dark:border-neutral-800/80 flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(item)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0e0e0e] hover:bg-neutral-100 dark:hover:bg-neutral-850 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition-all shadow-xs"
                        >
                          <Edit size={12} />
                          <span>Edit</span>
                        </button>

                        <button
                          onClick={() => handleDeleteAchievement(item.id, item.title)}
                          className="p-1.5 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 transition-colors"
                          title="Delete achievement"
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

      {/* CREATE / EDIT MODAL (Monochrome SaaS Style) */}
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
              {/* Header */}
              <div className="shrink-0 p-5 md:px-6 md:py-4 border-b border-neutral-200 dark:border-neutral-800/80 flex items-center justify-between bg-white dark:bg-[#0a0a0a] z-20">
                <div>
                  <h3 className="font-serif text-lg md:text-xl font-bold text-neutral-900 dark:text-white">
                    {editingItem ? 'Edit Achievement' : 'Add Club Achievement'}
                  </h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                    Trophies, certificates, publication issues, and milestones
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

              {/* Form Body - Scrollable with Lenis Isolation */}
              <form
                id="achievement-form"
                data-lenis-prevent
                onSubmit={handleSaveAchievement}
                className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-5 md:p-6 space-y-4 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-neutral-300 dark:[&::-webkit-scrollbar-thumb]:bg-neutral-700 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent"
                style={{
                  scrollbarWidth: 'thin',
                  scrollbarColor: '#777777 transparent',
                }}
              >
                <div className="space-y-1.5">
                  <label className="text-[11px] font-medium text-neutral-600 dark:text-neutral-400">
                    Achievement / Trophy Title *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. 1st Place — National Youth Slam 2024"
                    required
                    className="w-full rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0e0e0e] p-2.5 text-xs text-neutral-900 dark:text-white focus:border-neutral-900 dark:focus:border-white focus:outline-none transition-colors"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-medium text-neutral-600 dark:text-neutral-400">
                      Category *
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as AchievementCategory)}
                      className="w-full rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0e0e0e] p-2.5 text-xs text-neutral-900 dark:text-white focus:border-neutral-900 dark:focus:border-white focus:outline-none transition-colors"
                    >
                      <option value={AchievementCategory.COMPETITION} className="bg-white dark:bg-neutral-900">
                        Competition Win
                      </option>
                      <option value={AchievementCategory.AWARD} className="bg-white dark:bg-neutral-900">
                        Award / Honor
                      </option>
                      <option value={AchievementCategory.PUBLICATION} className="bg-white dark:bg-neutral-900">
                        Publication Release
                      </option>
                      <option value={AchievementCategory.MILESTONE} className="bg-white dark:bg-neutral-900">
                        Club Milestone
                      </option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-medium text-neutral-600 dark:text-neutral-400">
                      Date Achieved *
                    </label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      required
                      className="w-full rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0e0e0e] p-2.5 text-xs text-neutral-900 dark:text-white focus:border-neutral-900 dark:focus:border-white focus:outline-none font-mono transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-medium text-neutral-600 dark:text-neutral-400">
                    Description &amp; Highlights *
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Details about the award, organizing body, winning pieces, or participating team members..."
                    rows={3}
                    required
                    className="w-full rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0e0e0e] p-2.5 text-xs text-neutral-900 dark:text-white focus:border-neutral-900 dark:focus:border-white focus:outline-none transition-colors"
                  />
                </div>

                {/* Certificate / Trophy Photo Upload */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-medium text-neutral-600 dark:text-neutral-400">
                    Certificate / Trophy Photo (Optional, 16:9)
                  </label>

                  {image ? (
                    <div className="relative aspect-[16/9] rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900 group">
                      <img src={image} alt="Trophy" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setImage('')}
                        className="absolute inset-0 bg-red-600/90 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center text-xs font-mono font-medium transition-opacity"
                      >
                        Remove Photo
                      </button>
                    </div>
                  ) : (
                    <div>
                      <label
                        htmlFor="achievement-photo"
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0e0e0e] hover:bg-neutral-100 dark:hover:bg-neutral-850 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white cursor-pointer transition-all shadow-xs"
                      >
                        <Camera size={13} />
                        <span>{uploadingImage ? 'Uploading...' : 'Upload Certificate / Photo'}</span>
                      </label>
                      <input
                        id="achievement-photo"
                        type="file"
                        accept={ACCEPT_MAP.MEDIA}
                        onChange={handleImageFileSelect}
                        className="hidden"
                      />
                    </div>
                  )}
                </div>
              </form>

              {/* Modal Footer - Pinned at bottom */}
              <div className="shrink-0 p-4 md:px-6 border-t border-neutral-200 dark:border-neutral-800/80 bg-white dark:bg-[#0a0a0a] flex items-center justify-end gap-2.5 z-20">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0e0e0e] text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-850 hover:text-neutral-900 dark:hover:text-white transition-all shadow-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="achievement-form"
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 text-xs font-medium hover:bg-neutral-800 dark:hover:bg-neutral-200 active:scale-[0.98] transition-all shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  <CheckCircle2 size={14} />
                  <span>{saving ? 'Saving...' : 'Save Achievement'}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Image Cropper Modal */}
      {cropperRawSrc && (
        <ImageCropperModal
          isOpen={isCropperOpen}
          imageSrc={cropperRawSrc}
          aspectRatio={16 / 9}
          aspectPresetLabel="Honor Photo (16:9)"
          onCropComplete={handleCropComplete}
          onCancel={() => setIsCropperOpen(false)}
        />
      )}
    </div>
  );
}
