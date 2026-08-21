// src/app/(admin)/admin/gallery/page.tsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Image as ImageIcon,
  Plus,
  Trash2,
  Edit,
  Eye,
  Star,
  Upload,
  Search,
  X,
  ExternalLink,
  Check,
  Crop,
  RefreshCw,
} from 'lucide-react';
import { GalleryItemType } from '@prisma/client';
import { ImageCropperModal } from '@/components/ui/ImageCropperModal';
import { uploadImageBlob } from '@/lib/upload';
import { useLenis } from 'lenis/react';

interface GalleryItem {
  id: string;
  type: GalleryItemType;
  url: string;
  caption?: string | null;
  eventId?: string | null;
  isFeaturedOnHome: boolean;
  uploadedById?: string | null;
  createdAt: string;
}

export default function AdminGalleryPage() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterView, setFilterView] = useState<'ALL' | 'FEATURED'>('ALL');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<GalleryItem | null>(null);

  // Form Fields
  const [url, setUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [isFeaturedOnHome, setIsFeaturedOnHome] = useState(false);
  const [saving, setSaving] = useState(false);

  // Image Cropper / Editor
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

  const fetchGallery = async () => {
    try {
      const res = await fetch('/api/admin/gallery');
      const data = await res.json();
      if (data.success) {
        setItems(data.items || []);
      } else {
        setFeedback({ type: 'error', text: data.error || 'Failed to load gallery items' });
      }
    } catch (err) {
      console.error(err);
      setFeedback({ type: 'error', text: 'Network error loading gallery' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGallery();
  }, []);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (filterView === 'FEATURED' && !item.isFeaturedOnHome) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return item.caption?.toLowerCase().includes(q);
      }
      return true;
    });
  }, [items, filterView, searchQuery]);

  const featuredCount = useMemo(() => {
    return items.filter((i) => i.isFeaturedOnHome).length;
  }, [items]);

  const openCreateModal = () => {
    setEditingItem(null);
    setUrl('');
    setCaption('');
    setIsFeaturedOnHome(false);
    setIsModalOpen(true);
  };

  const openEditModal = (item: GalleryItem) => {
    setEditingItem(item);
    setUrl(item.url);
    setCaption(item.caption || '');
    setIsFeaturedOnHome(item.isFeaturedOnHome);
    setIsModalOpen(true);
  };

  // Direct upload without forcing crop — preserves full original resolution & aspect ratio
  const handleImageFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const uploadedUrl = await uploadImageBlob(
        file,
        'gallery',
        `gallery_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
      );
      setUrl(uploadedUrl);
    } catch (err: any) {
      console.error('Direct upload failed:', err);
      // Fallback to local object URL
      const localUrl = URL.createObjectURL(file);
      setUrl(localUrl);
      setFeedback({ type: 'error', text: 'Image upload failed. Please try again or use direct URL.' });
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  // Optional crop & framing complete
  const handleCropComplete = async (blob: Blob, previewUrl: string) => {
    setIsCropperOpen(false);
    setUploadingImage(true);
    try {
      const uploadedUrl = await uploadImageBlob(blob, 'gallery', `gallery_cropped_${Date.now()}.jpg`);
      setUrl(uploadedUrl);
      setFeedback({ type: 'success', text: 'Cropped image uploaded successfully.' });
    } catch (err) {
      console.error(err);
      setUrl(previewUrl);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleToggleHome = async (item: GalleryItem) => {
    const nextVal = !item.isFeaturedOnHome;
    // Optimistic UI update
    setItems((prev) =>
      prev.map((it) => (it.id === item.id ? { ...it, isFeaturedOnHome: nextVal } : it))
    );

    try {
      const res = await fetch(`/api/admin/gallery/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFeaturedOnHome: nextVal }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        // Rollback
        setItems((prev) =>
          prev.map((it) => (it.id === item.id ? { ...it, isFeaturedOnHome: !nextVal } : it))
        );
        setFeedback({ type: 'error', text: data.error || 'Failed to toggle homepage showcase.' });
      } else {
        setFeedback({
          type: 'success',
          text: nextVal
            ? 'Photograph is now featured on the homepage reel.'
            : 'Removed photograph from homepage reel.',
        });
      }
    } catch (err) {
      setFeedback({ type: 'error', text: 'Network error updating showcase status.' });
    }
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) {
      setFeedback({ type: 'error', text: 'Please upload or provide an image URL.' });
      return;
    }

    setSaving(true);
    const payload = {
      url: url.trim(),
      type: GalleryItemType.PHOTO,
      caption: caption.trim() || null,
      isFeaturedOnHome,
    };

    try {
      const targetUrl = editingItem
        ? `/api/admin/gallery/${editingItem.id}`
        : '/api/admin/gallery';
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
          text: `Successfully ${editingItem ? 'updated' : 'added'} gallery image!`,
        });
        setIsModalOpen(false);
        fetchGallery();
      } else {
        setFeedback({ type: 'error', text: data.error || 'Failed to save gallery item' });
      }
    } catch (err) {
      console.error(err);
      setFeedback({ type: 'error', text: 'Network error saving gallery item' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteItem = async (id: string, captionText?: string | null) => {
    const label = captionText ? `"${captionText}"` : 'this image';
    if (!confirm(`Are you sure you want to permanently delete ${label}?`)) return;

    try {
      const res = await fetch(`/api/admin/gallery/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setFeedback({ type: 'success', text: 'Image permanently deleted.' });
        fetchGallery();
      } else {
        setFeedback({ type: 'error', text: data.error || 'Failed to delete item.' });
      }
    } catch (err) {
      console.error(err);
      setFeedback({ type: 'error', text: 'Network error deleting gallery item.' });
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
            Visual Archive
          </span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800/80 pb-6">
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-neutral-900 dark:text-white flex items-center gap-3">
              <span>Gallery Management</span>
              <span className="text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-800">
                {items.length} Images
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1">
              Curate and publish photographs directly to the public community gallery and homepage reel.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href="/community/gallery"
              target="_blank"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0e0e0e] hover:bg-neutral-100 dark:hover:bg-neutral-850 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition-all shadow-xs"
            >
              <Eye size={13} />
              <span>Public Gallery</span>
              <ExternalLink size={11} className="text-neutral-400" />
            </Link>

            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 text-xs font-medium hover:bg-neutral-800 dark:hover:bg-neutral-200 active:scale-[0.98] transition-all shadow-sm"
            >
              <Plus size={14} />
              <span>Add Image</span>
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
          <button
            onClick={() => setFeedback(null)}
            className="p-1 text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
          >
            <X size={14} />
          </button>
        </motion.div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Filter View Pills */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-white dark:bg-[#0e0e0e] border border-neutral-200 dark:border-neutral-800 overflow-x-auto w-fit shadow-xs">
          <button
            onClick={() => setFilterView('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
              filterView === 'ALL'
                ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 font-semibold shadow-xs'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            All Images ({items.length})
          </button>

          <button
            onClick={() => setFilterView('FEATURED')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
              filterView === 'FEATURED'
                ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 font-semibold shadow-xs'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <Star size={11} className={filterView === 'FEATURED' ? 'fill-current' : ''} />
            <span>Featured on Home ({featuredCount})</span>
          </button>
        </div>

        {/* Search by caption */}
        <div className="relative min-w-[240px]">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by caption..."
            className="w-full pl-8 pr-8 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0e0e0e] text-xs text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-neutral-400 dark:focus:border-neutral-600 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
            >
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Gallery Grid Container */}
      <div className="min-h-[50vh]">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-64 rounded-2xl border border-neutral-200 dark:border-neutral-850 bg-white/50 dark:bg-[#0a0a0a]/50 animate-pulse"
              />
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="py-16 text-center rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0e0e0e] space-y-3">
            <ImageIcon size={32} className="mx-auto text-neutral-400" />
            <p className="font-serif text-lg font-bold text-neutral-900 dark:text-white">
              {searchQuery ? 'No Matching Photographs' : 'No Gallery Images Yet'}
            </p>
            <p className="text-xs text-neutral-500 max-w-sm mx-auto">
              {searchQuery
                ? 'Try a different search keyword or clear the search filter.'
                : 'Upload photos and captures from club activities, sessions, and events.'}
            </p>
            {!searchQuery && (
              <div className="pt-2">
                <button
                  onClick={openCreateModal}
                  className="px-4 py-2 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 text-xs font-medium hover:bg-neutral-800 dark:hover:bg-neutral-200 shadow-sm"
                >
                  Upload First Image
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="group relative rounded-2xl border border-neutral-200 dark:border-neutral-800/90 bg-white dark:bg-[#0a0a0a] overflow-hidden shadow-xs hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors flex flex-col justify-between"
              >
                {/* Media Image */}
                <div className="aspect-[4/3] w-full relative bg-neutral-100 dark:bg-neutral-900 overflow-hidden border-b border-neutral-200 dark:border-neutral-800">
                  <img
                    src={item.url}
                    alt={item.caption || 'Gallery photo'}
                    className="w-full h-full object-cover"
                  />

                  {/* Featured Badge */}
                  {item.isFeaturedOnHome && (
                    <div className="absolute top-2.5 right-2.5">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-neutral-950/80 dark:bg-white/90 text-white dark:text-neutral-950 text-[10px] font-mono font-bold backdrop-blur-sm shadow-xs">
                        <Star size={9} fill="currentColor" />
                        HOME
                      </span>
                    </div>
                  )}
                </div>

                {/* Caption & Actions */}
                <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-neutral-900 dark:text-white line-clamp-2">
                      {item.caption || <span className="text-neutral-400 italic">No caption provided</span>}
                    </p>
                    <span className="block font-mono text-[10px] text-neutral-400">
                      {item.createdAt
                        ? new Date(item.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })
                        : ''}
                    </span>
                  </div>

                  <div className="pt-3 border-t border-neutral-200 dark:border-neutral-800/80 flex items-center justify-between gap-2">
                    {/* Toggle Homepage Feature */}
                    <button
                      onClick={() => handleToggleHome(item)}
                      title={item.isFeaturedOnHome ? 'Remove from Homepage Reel' : 'Feature on Homepage Reel'}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                        item.isFeaturedOnHome
                          ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 font-semibold'
                          : 'border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0e0e0e] text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                      }`}
                    >
                      <Star size={11} fill={item.isFeaturedOnHome ? 'currentColor' : 'none'} />
                      <span>{item.isFeaturedOnHome ? 'Featured' : 'Feature'}</span>
                    </button>

                    {/* Edit & Delete */}
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => openEditModal(item)}
                        className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0e0e0e] hover:bg-neutral-100 dark:hover:bg-neutral-850 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
                        title="Edit image or caption"
                      >
                        <Edit size={12} />
                      </button>

                      <button
                        onClick={() => handleDeleteItem(item.id, item.caption)}
                        className="p-1.5 rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 transition-colors"
                        title="Delete image"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CREATE / EDIT MODAL */}
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
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.15 }}
              className="relative w-full max-w-lg my-auto rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0b0b0b] shadow-2xl overflow-hidden flex flex-col max-h-[88vh]"
            >
              {/* Modal Header */}
              <div className="shrink-0 p-5 md:p-6 flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0b0b0b] z-20">
                <div>
                  <h3 className="font-serif text-lg sm:text-xl font-bold text-neutral-900 dark:text-white">
                    {editingItem ? 'Edit Gallery Photograph' : 'Add Image to Gallery'}
                  </h3>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    {editingItem ? 'Update image file or caption details.' : 'Upload any resolution photo to publish in the visual archive.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800 text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-850 cursor-pointer"
                >
                  <X size={14} />
                </button>
              </div>

              <form
                id="gallery-form"
                data-lenis-prevent
                onSubmit={handleSaveItem}
                className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-5 md:p-6 space-y-4 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-neutral-300 dark:[&::-webkit-scrollbar-thumb]:bg-neutral-700 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent"
                style={{
                  scrollbarWidth: 'thin',
                  scrollbarColor: '#777777 transparent',
                }}
              >
                {/* Image Upload Area */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-mono uppercase tracking-wider text-neutral-500 font-semibold block">
                      Photograph File *
                    </label>
                    <span className="text-[10px] text-neutral-400 font-mono">
                      Any resolution supported
                    </span>
                  </div>

                  {url ? (
                    <div className="space-y-2">
                      <div className="relative max-h-64 rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center group">
                        <img
                          src={url}
                          alt="Preview"
                          className="max-h-64 w-auto object-contain rounded-lg"
                        />
                      </div>

                      {/* Online Image Editor / Cropping Action Toolbar */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          type="button"
                          onClick={() => {
                            setCropperRawSrc(url);
                            setIsCropperOpen(true);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0e0e0e] hover:bg-neutral-100 dark:hover:bg-neutral-850 text-xs font-medium text-neutral-700 dark:text-neutral-300 transition-colors shadow-xs"
                        >
                          <Crop size={13} />
                          <span>Crop &amp; Edit Framing</span>
                        </button>

                        <label
                          htmlFor="modal-replace-image"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0e0e0e] hover:bg-neutral-100 dark:hover:bg-neutral-850 text-xs font-medium text-neutral-700 dark:text-neutral-300 cursor-pointer transition-colors shadow-xs"
                        >
                          <Upload size={13} />
                          <span>Replace Image</span>
                        </label>
                        <input
                          id="modal-replace-image"
                          type="file"
                          accept="image/*"
                          onChange={handleImageFileSelect}
                          className="hidden"
                        />

                        <button
                          type="button"
                          onClick={() => setUrl('')}
                          className="px-3 py-1.5 rounded-xl border border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 text-xs font-medium transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <label
                        htmlFor="gallery-image-file"
                        className="flex flex-col items-center justify-center gap-2 p-6 rounded-xl border border-dashed border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-[#0e0e0e] hover:bg-neutral-100 dark:hover:bg-neutral-850 cursor-pointer transition-colors text-center"
                      >
                        {uploadingImage ? (
                          <RefreshCw size={20} className="animate-spin text-neutral-600 dark:text-neutral-400" />
                        ) : (
                          <Upload size={20} className="text-neutral-500" />
                        )}
                        <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
                          {uploadingImage ? 'Uploading original image...' : 'Choose image to upload (Original Resolution)'}
                        </span>
                        <span className="text-[10px] text-neutral-400">
                          Supports PNG, JPG, WebP, GIF • Native aspect ratio preserved
                        </span>
                      </label>
                      <input
                        id="gallery-image-file"
                        type="file"
                        accept="image/*"
                        onChange={handleImageFileSelect}
                        disabled={uploadingImage}
                        className="hidden"
                      />

                      <div className="flex items-center gap-2 pt-1">
                        <span className="text-[10px] font-mono text-neutral-400 uppercase shrink-0">
                          or Direct URL:
                        </span>
                        <input
                          type="url"
                          value={url}
                          onChange={(e) => setUrl(e.target.value)}
                          placeholder="https://images.unsplash.com/..."
                          className="flex-1 px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0e0e0e] text-xs text-neutral-900 dark:text-white focus:outline-none focus:border-neutral-400"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Caption / Description */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono uppercase tracking-wider text-neutral-500 font-semibold block">
                    Caption / Notes
                  </label>
                  <textarea
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="Short description of the photo, attendees, or occasion..."
                    rows={3}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0e0e0e] text-xs text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-neutral-400"
                  />
                </div>

                {/* Feature on Homepage Checkbox */}
                <div className="flex items-center gap-3 p-3.5 rounded-xl bg-neutral-50 dark:bg-[#0e0e0e] border border-neutral-200 dark:border-neutral-800">
                  <input
                    type="checkbox"
                    id="modal-featured-home"
                    checked={isFeaturedOnHome}
                    onChange={(e) => setIsFeaturedOnHome(e.target.checked)}
                    className="h-4 w-4 rounded border-neutral-300 dark:border-neutral-700 text-neutral-900 focus:ring-neutral-400"
                  />
                  <label htmlFor="modal-featured-home" className="text-xs cursor-pointer select-none">
                    <strong className="text-neutral-900 dark:text-white block font-medium">Feature on Homepage Reel</strong>
                    <span className="text-[11px] text-neutral-500">
                      Display in the rotating cinematic gallery strip on the landing page.
                    </span>
                  </label>
                </div>

                {/* Modal Footer Actions */}
                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-neutral-200 dark:border-neutral-800">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0e0e0e] hover:bg-neutral-100 dark:hover:bg-neutral-850 text-xs font-medium text-neutral-700 dark:text-neutral-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving || !url}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 text-xs font-medium hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors disabled:opacity-50 shadow-sm"
                  >
                    <Check size={13} />
                    <span>{saving ? 'Saving...' : editingItem ? 'Save Changes' : 'Publish Image'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Online Image Editor & Cropper Tool with aspect ratio switcher */}
      {cropperRawSrc && (
        <ImageCropperModal
          isOpen={isCropperOpen}
          imageSrc={cropperRawSrc}
          aspectRatio={null}
          allowRatioSelection={true}
          aspectPresetLabel="Custom / Multi-ratio"
          onCropComplete={handleCropComplete}
          onCancel={() => setIsCropperOpen(false)}
        />
      )}
    </div>
  );
}
