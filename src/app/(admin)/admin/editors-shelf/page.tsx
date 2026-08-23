// src/app/(admin)/admin/editors-shelf/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Edit,
  MoveUp,
  MoveDown,
  Sparkles,
  BookOpen,
  CheckCircle2,
  Camera,
  RefreshCw,
  Palette,
  Eye,
  Languages,
  ArrowUpRight,
  BookMarked,
  X,
} from 'lucide-react';
import { ImageCropperModal } from '@/components/ui/ImageCropperModal';
import { uploadImageBlob } from '@/lib/upload';
import { validateUploadFile, ACCEPT_MAP } from '@/lib/file-validation';
import { useLenis } from 'lenis/react';

interface ShelfItem {
  id: string;
  title: string;
  author: string;
  slug: string;
  coverImage?: string | null;
  editorialNote: string;
  editorialText?: string;
  categoryBadge?: string;
  leftPageHeader?: string;
  rightPageOrnament?: string;
  readButtonText?: string;
  language?: 'en' | 'hi';
  retailers?: Array<{ name: string; price: string; url: string }>;
  synopsis?: string | null;
  excerpt?: string | null;
  spineColor?: string | null;
  spineTextColor?: string | null;
  coverColor?: string | null;
  coverTextColor?: string | null;
  motif?: string | null;
  foilColor?: string | null;
  width?: number | null;
  height?: number | null;
  spineThickness?: number | null;
  readLink?: string | null;
  displayOrder: number;
}

const CLOTH_PALETTES = [
  { name: 'Midnight Navy', hex: '#182b5e' },
  { name: 'Imperial Crimson', hex: '#4a1525' },
  { name: 'Deep Scarlet', hex: '#6d1f1f' },
  { name: 'Vintage Linen', hex: '#ece0ca' },
  { name: 'Warm Cream', hex: '#f3ebe0' },
  { name: 'Forest Evergreen', hex: '#1d382b' },
  { name: 'Espresso Leather', hex: '#2b1b17' },
  { name: 'Obsidian Velvet', hex: '#14141a' },
  { name: 'Antique Goldcloth', hex: '#b8932a' },
  { name: 'Royal Plum', hex: '#351838' },
  { name: 'Teal Archive', hex: '#0f333a' },
  { name: 'Charcoal Slate', hex: '#333333' },
];

const TEXT_PALETTES = [
  { name: 'Warm Ivory', hex: '#f3ecd8' },
  { name: 'Antique Gold', hex: '#d4af37' },
  { name: 'Crimson Rust', hex: '#8b1e1a' },
  { name: 'Bright White', hex: '#ffffff' },
  { name: 'Obsidian Black', hex: '#1a1a1a' },
  { name: 'Silver Mist', hex: '#d1d5db' },
];

const FOIL_PALETTES = [
  { name: 'Gilded Gold', hex: '#e7b55f' },
  { name: 'Antique Gold', hex: '#d4af37' },
  { name: 'Crimson Foil', hex: '#8b1e1a' },
  { name: 'Warm Bronze', hex: '#c8a44a' },
  { name: 'Silver Leaf', hex: '#c0c0c0' },
  { name: 'Rose Copper', hex: '#b76e79' },
];

const MOTIFS = [
  'lattice',
  'continuum',
  'orbit',
  'steps',
  'runner',
  'fracture',
  'wave',
  'schematic',
  'windows',
  'circuit',
  'branches',
];

const BADGE_PRESETS = [
  'READ OF THE WEEK',
  'READ OF THE MONTH',
  'READ OF THE YEAR',
  "EDITOR'S CHOICE",
  'CLASSIC SELECTION',
  'SPECIAL EDITION',
  'साप्ताहिक कृति',
  'मासिक कृति',
  'CUSTOM',
];

const ORNAMENT_PRESETS = ['— § —', '— ❦ —', '— ✦ —', '— ❖ —', '— ✤ —', '— ❧ —'];

export default function AdminEditorsShelfPage() {
  const [items, setItems] = useState<ShelfItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Editor Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ShelfItem | null>(null);

  // Language Mode
  const [language, setLanguage] = useState<'en' | 'hi'>('en');

  // Form Fields (Editable for 3D Model & Open Reading Modal)
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [slug, setSlug] = useState('');

  // 2-part Badge Fields
  const [badgeType, setBadgeType] = useState('READ OF THE WEEK');
  const [customBadgeType, setCustomBadgeType] = useState('');
  const [badgePeriod, setBadgePeriod] = useState('FEB 2025');

  const [leftPageHeader, setLeftPageHeader] = useState('FROM THE SHELF OF EXCELSIOR');
  const [rightPageOrnament, setRightPageOrnament] = useState('— § —');
  const [readButtonText, setReadButtonText] = useState('READ PUBLICATION');
  const [readLink, setReadLink] = useState('/publications');
  const [synopsis, setSynopsis] = useState('');
  const [excerpt, setExcerpt] = useState('');

  // 3D Customizer Colors & Dimensions
  const [spineColor, setSpineColor] = useState('#182b5e');
  const [spineTextColor, setSpineTextColor] = useState('#f3ecd8');
  const [coverColor, setCoverColor] = useState('#1c3370');
  const [coverTextColor, setCoverTextColor] = useState('#f3ecd8');
  const [foilColor, setFoilColor] = useState('#e7b55f');
  const [motif, setMotif] = useState('lattice');
  const [width, setWidth] = useState('1.95');
  const [height, setHeight] = useState('3.10');
  const [spineThickness, setSpineThickness] = useState('0.42');
  const [coverImage, setCoverImage] = useState<string>('');

  // Image Cropper State
  const [cropperRawSrc, setCropperRawSrc] = useState<string | null>(null);
  const [isCropperOpen, setIsCropperOpen] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

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

  const getEffectiveBadge = () => {
    const typeStr = (badgeType === 'CUSTOM' ? customBadgeType : badgeType).trim().toUpperCase();
    const periodStr = badgePeriod.trim().toUpperCase();
    if (typeStr && periodStr) return `${typeStr} · ${periodStr}`;
    return typeStr || periodStr || 'READ OF THE WEEK';
  };

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/editors-shelf');
      const data = await res.json();
      if (data.success) {
        setItems(data.items || []);
      } else {
        setFeedback({ type: 'error', text: data.error || 'Failed to fetch shelf items' });
      }
    } catch (err) {
      console.error(err);
      setFeedback({ type: 'error', text: 'Network error loading shelf items' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const applyLanguageTemplate = (lang: 'en' | 'hi') => {
    setLanguage(lang);
    if (lang === 'hi') {
      if (badgeType === 'READ OF THE WEEK') {
        setBadgeType('साप्ताहिक कृति');
        setCustomBadgeType('');
      }
      if (badgePeriod === 'FEB 2025' || !badgePeriod) {
        setBadgePeriod('फरवरी २०२५');
      }
      if (!leftPageHeader) {
        setLeftPageHeader('FROM THE SHELF OF EXCELSIOR');
      }
      if (!rightPageOrnament) {
        setRightPageOrnament('— § —');
      }
      if (!readButtonText || readButtonText === 'READ PUBLICATION') {
        setReadButtonText('READ PUBLICATION');
      }
    } else {
      if (badgeType === 'साप्ताहिक कृति') {
        setBadgeType('READ OF THE WEEK');
        setCustomBadgeType('');
      }
      if (badgePeriod === 'फरवरी २०२५') {
        setBadgePeriod('FEB 2025');
      }
      if (!leftPageHeader) {
        setLeftPageHeader('FROM THE SHELF OF EXCELSIOR');
      }
      if (!rightPageOrnament) {
        setRightPageOrnament('— § —');
      }
    }
  };

  const openCreateModal = () => {
    setEditingItem(null);
    setLanguage('en');
    setTitle('');
    setAuthor('');
    setSlug('');
    setBadgeType('READ OF THE WEEK');
    setCustomBadgeType('');
    setBadgePeriod('FEB 2025');
    setLeftPageHeader('FROM THE SHELF OF EXCELSIOR');
    setRightPageOrnament('— § —');
    setReadButtonText('READ PUBLICATION');
    setSynopsis('');
    setExcerpt('');
    setReadLink('/publications');
    setSpineColor('#182b5e');
    setSpineTextColor('#f3ecd8');
    setCoverColor('#1c3370');
    setCoverTextColor('#f3ecd8');
    setFoilColor('#e7b55f');
    setMotif('lattice');
    setWidth('1.95');
    setHeight('3.10');
    setSpineThickness('0.42');
    setCoverImage('');
    setIsModalOpen(true);
  };

  const openEditModal = (item: ShelfItem) => {
    setEditingItem(item);
    const isHindi = item.language === 'hi' || /[ऀ-ॿ]/.test(item.title + item.author);
    setLanguage(item.language || (isHindi ? 'hi' : 'en'));
    setTitle(item.title);
    setAuthor(item.author);
    setSlug(item.slug);

    // Parse existing badge into Type and Period
    const rawBadge = (item.categoryBadge || (isHindi ? 'साप्ताहिक कृति · फरवरी २०२५' : 'READ OF THE WEEK · FEB 2025')).trim();
    if (rawBadge.includes('·')) {
      const [typePart, ...rest] = rawBadge.split('·');
      const cleanType = typePart.trim().toUpperCase();
      const cleanPeriod = rest.join('·').trim().toUpperCase();
      if (BADGE_PRESETS.includes(cleanType)) {
        setBadgeType(cleanType);
        setCustomBadgeType('');
      } else {
        setBadgeType('CUSTOM');
        setCustomBadgeType(cleanType);
      }
      setBadgePeriod(cleanPeriod);
    } else {
      if (BADGE_PRESETS.includes(rawBadge.toUpperCase())) {
        setBadgeType(rawBadge.toUpperCase());
        setCustomBadgeType('');
        setBadgePeriod('');
      } else {
        setBadgeType('CUSTOM');
        setCustomBadgeType(rawBadge);
        setBadgePeriod('');
      }
    }

    setLeftPageHeader(item.leftPageHeader || 'FROM THE SHELF OF EXCELSIOR');
    setRightPageOrnament(item.rightPageOrnament || '— § —');
    setReadButtonText(item.readButtonText || 'READ PUBLICATION');
    setSynopsis(item.synopsis || item.editorialText || '');
    setExcerpt(item.excerpt || '');
    setReadLink(item.readLink || '/publications');
    setSpineColor(item.spineColor || '#182b5e');
    setSpineTextColor(item.spineTextColor || '#f3ecd8');
    setCoverColor(item.coverColor || '#1c3370');
    setCoverTextColor(item.coverTextColor || '#f3ecd8');
    setFoilColor(item.foilColor || '#e7b55f');
    setMotif(item.motif || 'lattice');
    setWidth(item.width?.toString() || '1.95');
    setHeight(item.height?.toString() || '3.10');
    setSpineThickness(item.spineThickness?.toString() || '0.42');
    setCoverImage(item.coverImage || '');
    setIsModalOpen(true);
  };

  const handleCoverFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateUploadFile(file, 'COVER');
    if (!validation.valid) {
      setFeedback({ type: 'error', text: validation.error || 'Invalid cover format or size.' });
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
    setUploadingCover(true);
    try {
      const url = await uploadImageBlob(blob, 'shelf-covers', `${slug || 'book'}_cover.jpg`);
      setCoverImage(url);
      setFeedback({ type: 'success', text: 'Book cover uploaded to Cloudinary.' });
    } catch (err: any) {
      console.error(err);
      setFeedback({ type: 'error', text: err.message || 'Failed to upload cover to Cloudinary.' });
    } finally {
      setUploadingCover(false);
    }
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !author.trim()) {
      setFeedback({ type: 'error', text: 'Title and Author are mandatory.' });
      return;
    }

    const effectiveBadge = getEffectiveBadge();

    const payload = {
      title: title.trim(),
      author: author.trim(),
      slug: slug.trim() || undefined,
      coverImage: coverImage.trim() || null,
      editorialText: synopsis.trim() || `${title} by ${author}`,
      categoryBadge: effectiveBadge,
      leftPageHeader: leftPageHeader.trim() || 'FROM THE SHELF OF EXCELSIOR',
      rightPageOrnament: rightPageOrnament.trim() || '— § —',
      readButtonText: readButtonText.trim() || 'READ PUBLICATION',
      language,
      synopsis: synopsis.trim() || null,
      excerpt: excerpt.trim() || null,
      spineColor,
      spineTextColor,
      coverColor,
      coverTextColor,
      foilColor,
      motif,
      width: parseFloat(width) || 1.95,
      height: parseFloat(height) || 3.1,
      spineThickness: parseFloat(spineThickness) || 0.42,
      readLink: readLink.trim() || '/publications',
    };

    try {
      const url = editingItem
        ? `/api/admin/editors-shelf/${editingItem.id}`
        : '/api/admin/editors-shelf';
      const method = editingItem ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setFeedback({
          type: 'success',
          text: `Successfully ${editingItem ? 'updated' : 'created'} "${title}" on the 3D Shelf!`,
        });
        setIsModalOpen(false);
        fetchItems();
      } else {
        setFeedback({ type: 'error', text: data.error || 'Failed to save 3D shelf item.' });
      }
    } catch (err) {
      console.error(err);
      setFeedback({ type: 'error', text: 'Network error saving shelf item.' });
    }
  };

  const handleDeleteItem = async (id: string, itemTitle: string) => {
    if (!confirm(`Are you sure you want to remove "${itemTitle}" from the 3D Editor's Shelf?`)) return;

    try {
      const res = await fetch(`/api/admin/editors-shelf/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setFeedback({ type: 'success', text: `Removed "${itemTitle}" from shelf & cleaned Cloudinary storage.` });
        fetchItems();
      } else {
        setFeedback({ type: 'error', text: data.error || 'Failed to delete item.' });
      }
    } catch (err) {
      setFeedback({ type: 'error', text: 'Network error deleting shelf item.' });
    }
  };

  const handleReorder = async (index: number, direction: 'UP' | 'DOWN') => {
    const targetIndex = direction === 'UP' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= items.length) return;

    const newItems = [...items];
    const temp = newItems[index];
    newItems[index] = newItems[targetIndex];
    newItems[targetIndex] = temp;

    setItems(newItems);

    try {
      await fetch('/api/admin/editors-shelf/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemIds: newItems.map((it) => it.id) }),
      });
    } catch (err) {
      console.error('Reorder sync error:', err);
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
            3D Shelf Library
          </span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800/80 pb-6">
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-neutral-900 dark:text-white flex items-center gap-3">
              <span>3D Editor&apos;s Shelf</span>
              <span className="text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-800">
                {items.length} Editions
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1">
              Curate the procedural 3D clothbound editions featured on the Homepage (Top 5) &amp; Editor&apos;s Shelf 3D study.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              href="/editors-shelf"
              target="_blank"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0e0e0e] text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-850 hover:text-neutral-900 dark:hover:text-white transition-all shadow-xs"
            >
              <Eye size={13} />
              <span>Preview 3D</span>
              <ArrowUpRight size={12} className="opacity-60" />
            </Link>

            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 text-xs font-medium hover:bg-neutral-800 dark:hover:bg-neutral-200 active:scale-[0.98] transition-all shadow-sm"
            >
              <Plus size={14} />
              <span>Add 3D Edition</span>
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

      {/* Shelf Items List */}
      <div className="space-y-3">
        {loading ? (
          <div className="py-16 text-center text-xs font-mono text-neutral-500 space-y-2">
            <RefreshCw size={20} className="animate-spin mx-auto text-neutral-400" />
            <p>Loading 3D Shelf Books...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="py-16 text-center rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0e0e0e] space-y-3">
            <BookOpen size={32} className="mx-auto text-neutral-400" />
            <p className="font-serif text-lg font-bold text-neutral-900 dark:text-white">The Shelf is Empty</p>
            <p className="text-xs text-neutral-500 max-w-sm mx-auto">
              Add your first 3D clothbound book edition to feature it on the shelf.
            </p>
            <div className="flex justify-center pt-2">
              <button
                onClick={openCreateModal}
                className="px-4 py-2 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 text-xs font-medium hover:bg-neutral-800 dark:hover:bg-neutral-200"
              >
                Add First Edition
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2.5">
            {items.map((item, idx) => {
              const isHindi = item.language === 'hi' || /[ऀ-ॿ]/.test(item.title + item.author);
              const isTop5 = idx < 5;

              return (
                <div
                  key={item.id}
                  className={`p-4 sm:p-5 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs ${
                    isTop5
                      ? 'border-neutral-300 dark:border-neutral-700 bg-white dark:bg-[#0d0d0d] hover:border-neutral-400 dark:hover:border-neutral-600'
                      : 'border-neutral-200 dark:border-neutral-800/90 bg-white dark:bg-[#0a0a0a] hover:border-neutral-300 dark:hover:border-neutral-700'
                  }`}
                >
                  {/* Left: Spine color pill & details */}
                  <div className="flex items-center gap-4 min-w-0">
                    {/* Visual Spine Mini Preview */}
                    <div
                      style={{
                        backgroundColor: item.spineColor || '#182b5e',
                        color: item.spineTextColor || '#f3ecd8',
                        borderColor: item.foilColor || '#e7b55f',
                      }}
                      className="w-8 h-22 rounded shadow-sm border-r-2 flex flex-col items-center justify-between py-1 text-[8px] font-serif font-bold uppercase tracking-widest select-none shrink-0"
                    >
                      <span className="text-[8px] opacity-70">✦</span>
                      <span
                        style={{
                          writingMode: 'vertical-rl',
                          transform: 'rotate(180deg)',
                        }}
                        className="truncate max-h-14 text-[8px]"
                      >
                        {item.title}
                      </span>
                      <span className="text-[8px] opacity-70">✦</span>
                    </div>

                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-[10px] text-neutral-400 font-semibold">
                          #{idx + 1}
                        </span>
                        <h3 className="font-serif text-base sm:text-lg font-bold text-neutral-900 dark:text-white truncate">
                          {item.title}
                        </h3>
                        {isTop5 && (
                          <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 font-bold">
                            Top 5 (Home)
                          </span>
                        )}
                        <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-850 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-800">
                          {isHindi ? '🇮🇳 हिन्दी' : '🇬🇧 EN'}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">
                        by <strong className="text-neutral-800 dark:text-neutral-200 font-medium">{item.author}</strong> · Motif:{' '}
                        <span className="font-mono text-neutral-700 dark:text-neutral-300">{item.motif || 'lattice'}</span>
                        {item.coverImage && (
                          <span className="ml-2 text-emerald-600 dark:text-emerald-400 font-mono text-[10px]">
                            • Custom 3D Texture
                          </span>
                        )}
                      </p>
                      {item.excerpt && (
                        <p className="text-xs text-neutral-400 line-clamp-1 italic">
                          &ldquo;{item.excerpt}&rdquo;
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right: Actions (SaaS Button Styles) */}
                  <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                    {/* Reorder Buttons */}
                    <div className="flex items-center rounded-xl bg-neutral-100 dark:bg-neutral-900 p-1 border border-neutral-200 dark:border-neutral-800">
                      <button
                        onClick={() => handleReorder(idx, 'UP')}
                        disabled={idx === 0}
                        className="p-1.5 text-neutral-500 hover:text-neutral-900 dark:hover:text-white disabled:opacity-30 transition-colors"
                        title="Move Up on Shelf"
                      >
                        <MoveUp size={13} />
                      </button>
                      <button
                        onClick={() => handleReorder(idx, 'DOWN')}
                        disabled={idx === items.length - 1}
                        className="p-1.5 text-neutral-500 hover:text-neutral-900 dark:hover:text-white disabled:opacity-30 transition-colors"
                        title="Move Down on Shelf"
                      >
                        <MoveDown size={13} />
                      </button>
                    </div>

                    <button
                      onClick={() => openEditModal(item)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0e0e0e] hover:bg-neutral-100 dark:hover:bg-neutral-850 text-xs font-medium text-neutral-800 dark:text-neutral-200 transition-all shadow-xs"
                    >
                      <Edit size={12} />
                      <span>Customize</span>
                    </button>

                    <button
                      onClick={() => handleDeleteItem(item.id, item.title)}
                      className="p-2 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 transition-colors"
                      title="Delete Edition"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* CREATE / EDIT CUSTOMIZER MODAL (Minimalist Monochrome SaaS Style) */}
      <AnimatePresence>
        {isModalOpen && (
          <div
            data-lenis-prevent
            className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-sm p-3 sm:p-6 md:p-8 flex items-center justify-center min-h-screen"
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
              className="relative z-10 w-full max-w-5xl my-auto rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0a0a0a] text-neutral-900 dark:text-neutral-100 shadow-2xl overflow-hidden flex flex-col"
              style={{ maxHeight: '88vh', height: '88vh' }}
            >
              {/* Fixed Modal Header */}
              <div className="p-5 md:px-8 md:py-5 border-b border-neutral-200 dark:border-neutral-800/80 shrink-0 flex items-center justify-between bg-white dark:bg-[#0a0a0a] z-20">
                <div>
                  <h2 className="font-serif text-xl md:text-2xl font-bold text-neutral-900 dark:text-white">
                    {editingItem ? 'Customize 3D Clothbound Edition' : 'Create New 3D Edition'}
                  </h2>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                    Cloth cover styling, foil stamping, spine colors, and open reading page details
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="text-neutral-400 hover:text-neutral-900 dark:hover:text-white p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Form & Scrollable Body */}
              <form
                id="editors-shelf-form"
                data-lenis-prevent
                onSubmit={handleSaveItem}
                className="flex-1 flex flex-col min-h-0 overflow-hidden"
              >
                <div
                  data-lenis-prevent
                  className="flex-1 overflow-y-auto p-5 md:p-8 space-y-6 overscroll-contain [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-neutral-300 dark:[&::-webkit-scrollbar-thumb]:bg-neutral-700 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent"
                  style={{
                    maxHeight: 'calc(88vh - 145px)',
                    overflowY: 'auto',
                    scrollbarWidth: 'thin',
                    scrollbarColor: '#777777 transparent',
                  }}
                >
                  {/* Language Template Selector */}
                  <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-xs">
                      <Languages size={15} className="text-neutral-600 dark:text-neutral-400" />
                      <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                        Language Template:
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => applyLanguageTemplate('en')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                          language === 'en'
                            ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 font-semibold shadow-xs'
                            : 'bg-white dark:bg-[#0e0e0e] border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                        }`}
                      >
                        🇬🇧 English Edition
                      </button>
                      <button
                        type="button"
                        onClick={() => applyLanguageTemplate('hi')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                          language === 'hi'
                            ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 font-semibold shadow-xs'
                            : 'bg-white dark:bg-[#0e0e0e] border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                        }`}
                      >
                        🇮🇳 हिन्दी संस्करण (Hindi)
                      </button>
                    </div>
                  </div>

                  {/* 2-Column Layout: Inputs & Live Visual Spine/Cover Preview */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left 2 Cols: Form Fields */}
                    <div className="lg:col-span-2 space-y-5">
                      {/* Section 1: Book Identity */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 font-serif text-sm font-bold text-neutral-900 dark:text-white">
                          <BookMarked size={16} className="text-neutral-700 dark:text-neutral-300" />
                          <span>Book Details &amp; Metadata</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-[11px] font-medium text-neutral-600 dark:text-neutral-400">
                              Book Title *
                            </label>
                            <input
                              type="text"
                              value={title}
                              onChange={(e) => setTitle(e.target.value)}
                              placeholder={language === 'hi' ? 'उदा. निर्मला या गोदान' : 'e.g. The Great Gatsby'}
                              required
                              className="w-full rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0e0e0e] p-2.5 text-xs text-neutral-900 dark:text-white focus:border-neutral-900 dark:focus:border-white focus:outline-none font-serif text-sm transition-colors"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[11px] font-medium text-neutral-600 dark:text-neutral-400">
                              Author Name *
                            </label>
                            <input
                              type="text"
                              value={author}
                              onChange={(e) => setAuthor(e.target.value)}
                              placeholder={language === 'hi' ? 'उदा. मुंशी प्रेमचंद' : 'e.g. F. Scott Fitzgerald'}
                              required
                              className="w-full rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0e0e0e] p-2.5 text-xs text-neutral-900 dark:text-white focus:border-neutral-900 dark:focus:border-white focus:outline-none transition-colors"
                            />
                          </div>
                        </div>

                        {/* Streamlined Category / Edition Badge (2 Fields: Dropdown + Date) */}
                        <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-800 space-y-2.5">
                          <div className="flex items-center justify-between">
                            <label className="text-[11px] font-medium text-neutral-600 dark:text-neutral-400">
                              Curator Badge (Reading Panel Eyebrow)
                            </label>
                            <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-neutral-200/70 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 font-semibold">
                              {getEffectiveBadge()}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <label className="text-[10px] text-neutral-500 font-medium">
                                1. Badge Headline
                              </label>
                              <select
                                value={badgeType}
                                onChange={(e) => setBadgeType(e.target.value)}
                                className="w-full rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0e0e0e] p-2.5 text-xs text-neutral-900 dark:text-white focus:border-neutral-900 dark:focus:border-white focus:outline-none transition-colors"
                              >
                                {BADGE_PRESETS.map((b) => (
                                  <option key={b} value={b} className="bg-white dark:bg-neutral-900">
                                    {b}
                                  </option>
                                ))}
                              </select>
                              {badgeType === 'CUSTOM' && (
                                <input
                                  type="text"
                                  value={customBadgeType}
                                  onChange={(e) => setCustomBadgeType(e.target.value)}
                                  placeholder="CUSTOM BADGE (e.g. SPECIAL CURATION)"
                                  className="w-full mt-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0e0e0e] p-2 text-xs text-neutral-900 dark:text-white focus:border-neutral-900 dark:focus:border-white focus:outline-none font-mono uppercase"
                                />
                              )}
                            </div>

                            <div className="space-y-1">
                              <label className="text-[10px] text-neutral-500 font-medium">
                                2. Date / Issue Period
                              </label>
                              <input
                                type="text"
                                value={badgePeriod}
                                onChange={(e) => setBadgePeriod(e.target.value.toUpperCase())}
                                placeholder="e.g. FEB 2025, SPRING 2025"
                                className="w-full rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0e0e0e] p-2.5 text-xs text-neutral-900 dark:text-white focus:border-neutral-900 dark:focus:border-white focus:outline-none font-mono uppercase transition-colors"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Section 2: Open Book 3D Inside Pages Details */}
                      <div className="space-y-3 p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-800">
                        <div className="flex items-center gap-2 font-serif text-sm font-bold text-neutral-900 dark:text-white">
                          <BookOpen size={16} className="text-neutral-700 dark:text-neutral-300" />
                          <span>3D Open Book Spread Layout</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-[11px] font-medium text-neutral-600 dark:text-neutral-400">
                              Left Page Header (Frontispiece Eyebrow)
                            </label>
                            <input
                              type="text"
                              value={leftPageHeader}
                              onChange={(e) => setLeftPageHeader(e.target.value)}
                              placeholder="FROM THE SHELF OF EXCELSIOR"
                              className="w-full rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0e0e0e] p-2.5 text-xs text-neutral-900 dark:text-white focus:border-neutral-900 dark:focus:border-white focus:outline-none font-mono"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[11px] font-medium text-neutral-600 dark:text-neutral-400">
                              Right Page Ornament (Top Divider)
                            </label>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={rightPageOrnament}
                                onChange={(e) => setRightPageOrnament(e.target.value)}
                                placeholder="— § —"
                                className="w-full rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0e0e0e] p-2.5 text-xs text-neutral-900 dark:text-white focus:border-neutral-900 dark:focus:border-white focus:outline-none text-center font-serif"
                              />
                              <div className="flex gap-1">
                                {ORNAMENT_PRESETS.slice(0, 3).map((o) => (
                                  <button
                                    key={o}
                                    type="button"
                                    onClick={() => setRightPageOrnament(o)}
                                    className="px-2 py-1 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0e0e0e] hover:border-neutral-400 text-xs font-serif"
                                  >
                                    {o}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[11px] font-medium text-neutral-600 dark:text-neutral-400">
                            Inside Page Excerpt (Printed on Right Page &amp; Quote Callout)
                          </label>
                          <textarea
                            value={excerpt}
                            onChange={(e) => setExcerpt(e.target.value)}
                            placeholder={
                              language === 'hi'
                                ? 'उदा. "जब मनुष्य पर विपत्ति आती है, तो उसकी बुद्धि भी भ्रष्ट हो जाती है।"'
                                : '“So we beat on, boats against the current, borne back ceaselessly into the past.”'
                            }
                            rows={2}
                            className="w-full rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0e0e0e] p-2.5 text-xs text-neutral-900 dark:text-white focus:border-neutral-900 dark:focus:border-white focus:outline-none italic"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[11px] font-medium text-neutral-600 dark:text-neutral-400">
                            Book Synopsis / Description (Reading Panel)
                          </label>
                          <textarea
                            value={synopsis}
                            onChange={(e) => setSynopsis(e.target.value)}
                            placeholder="1-2 paragraphs summarizing the narrative, context, and philosophical themes..."
                            rows={3}
                            className="w-full rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0e0e0e] p-2.5 text-xs text-neutral-900 dark:text-white focus:border-neutral-900 dark:focus:border-white focus:outline-none"
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-[11px] font-medium text-neutral-600 dark:text-neutral-400">
                              Read CTA Button Label
                            </label>
                            <input
                              type="text"
                              value={readButtonText}
                              onChange={(e) => setReadButtonText(e.target.value)}
                              placeholder="READ PUBLICATION"
                              className="w-full rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0e0e0e] p-2.5 text-xs text-neutral-900 dark:text-white focus:border-neutral-900 dark:focus:border-white focus:outline-none font-mono text-[11px]"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[11px] font-medium text-neutral-600 dark:text-neutral-400">
                              Read CTA Destination URL *
                            </label>
                            <input
                              type="text"
                              value={readLink}
                              onChange={(e) => setReadLink(e.target.value)}
                              placeholder="/publications/silent-architecture or https://..."
                              required
                              className="w-full rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0e0e0e] p-2.5 text-xs text-neutral-900 dark:text-white focus:border-neutral-900 dark:focus:border-white focus:outline-none font-mono text-[11px]"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Section 3: 3D Cloth Colors & Foil Customizer */}
                      <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-800 space-y-4">
                        <div className="flex items-center gap-2 font-serif text-sm font-bold text-neutral-900 dark:text-white">
                          <Palette size={16} className="text-neutral-700 dark:text-neutral-300" />
                          <span>Clothboard &amp; Spine Color Styling</span>
                        </div>

                        {/* Spine Color */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-[11px] font-medium text-neutral-600 dark:text-neutral-400">
                              Spine Cloth Color: <span className="font-mono text-neutral-900 dark:text-white font-semibold">{spineColor}</span>
                            </label>
                            <input
                              type="color"
                              value={spineColor}
                              onChange={(e) => {
                                setSpineColor(e.target.value);
                                if (!editingItem) setCoverColor(e.target.value);
                              }}
                              className="h-6 w-8 rounded cursor-pointer bg-transparent border-0"
                            />
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {CLOTH_PALETTES.map((c) => (
                              <button
                                key={c.hex}
                                type="button"
                                onClick={() => {
                                  setSpineColor(c.hex);
                                  if (!editingItem) setCoverColor(c.hex);
                                }}
                                style={{ backgroundColor: c.hex }}
                                className={`h-6 w-6 rounded-full border-2 transition-transform ${
                                  spineColor === c.hex
                                    ? 'border-neutral-900 dark:border-white scale-110 shadow-sm'
                                    : 'border-black/15 dark:border-white/20 hover:scale-105'
                                }`}
                                title={c.name}
                              />
                            ))}
                          </div>
                        </div>

                        {/* Spine Text Color */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-[11px] font-medium text-neutral-600 dark:text-neutral-400">
                              Spine Title Color: <span className="font-mono text-neutral-900 dark:text-white font-semibold">{spineTextColor}</span>
                            </label>
                            <input
                              type="color"
                              value={spineTextColor}
                              onChange={(e) => {
                                setSpineTextColor(e.target.value);
                                if (!editingItem) setCoverTextColor(e.target.value);
                              }}
                              className="h-6 w-8 rounded cursor-pointer bg-transparent border-0"
                            />
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {TEXT_PALETTES.map((c) => (
                              <button
                                key={c.hex}
                                type="button"
                                onClick={() => {
                                  setSpineTextColor(c.hex);
                                  if (!editingItem) setCoverTextColor(c.hex);
                                }}
                                style={{ backgroundColor: c.hex }}
                                className={`h-6 w-6 rounded-full border-2 transition-transform ${
                                  spineTextColor === c.hex
                                    ? 'border-neutral-900 dark:border-white scale-110 shadow-sm'
                                    : 'border-black/15 dark:border-white/20 hover:scale-105'
                                }`}
                                title={c.name}
                              />
                            ))}
                          </div>
                        </div>

                        {/* Foil Motif & Foil Color */}
                        <div className="grid grid-cols-2 gap-4 pt-2">
                          <div className="space-y-1.5">
                            <label className="text-[11px] font-medium text-neutral-600 dark:text-neutral-400">
                              Procedural Foil Motif
                            </label>
                            <select
                              value={motif}
                              onChange={(e) => setMotif(e.target.value)}
                              className="w-full rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0e0e0e] p-2 text-xs text-neutral-900 dark:text-white focus:border-neutral-900 dark:focus:border-white focus:outline-none"
                            >
                              {MOTIFS.map((m) => (
                                <option key={m} value={m} className="bg-white dark:bg-neutral-900">
                                  {m.toUpperCase()}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[11px] font-medium text-neutral-600 dark:text-neutral-400">
                              Metallic Foil Accent
                            </label>
                            <select
                              value={foilColor}
                              onChange={(e) => setFoilColor(e.target.value)}
                              className="w-full rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0e0e0e] p-2 text-xs text-neutral-900 dark:text-white focus:border-neutral-900 dark:focus:border-white focus:outline-none"
                            >
                              {FOIL_PALETTES.map((f) => (
                                <option key={f.hex} value={f.hex} className="bg-white dark:bg-neutral-900">
                                  {f.name} ({f.hex})
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right Column: Live Spine & Cover Simulator Card */}
                    <div className="space-y-5 flex flex-col items-center">
                      <div className="w-full p-5 rounded-2xl bg-neutral-950 border border-neutral-800 text-white flex flex-col items-center space-y-4 shadow-xl">
                        <span className="font-mono text-[10px] uppercase tracking-widest text-neutral-400 font-medium flex items-center gap-1.5">
                          <Sparkles size={12} className="text-amber-400" />
                          <span>Live 3D Book Preview</span>
                        </span>

                        {/* Real-time Spine Preview Graphic */}
                        <div
                          style={{
                            backgroundColor: spineColor,
                            color: spineTextColor,
                            boxShadow: `0 10px 25px -5px ${spineColor}80, inset 0 0 14px rgba(0,0,0,0.6)`,
                            borderRight: `3px solid ${foilColor}`,
                            borderLeft: `2px solid rgba(255,255,255,0.18)`,
                          }}
                          className="w-18 h-72 rounded-md flex flex-col items-center justify-between py-2 px-1 text-center transition-all duration-300 relative overflow-hidden"
                        >
                          {/* Top Foil Band */}
                          <div style={{ color: foilColor }} className="text-[10px] font-bold">
                            ✦
                          </div>

                          {/* Vertical Spine Title */}
                          <div
                            style={{
                              writingMode: 'vertical-rl',
                              transform: 'rotate(180deg)',
                              fontFamily: language === 'hi' ? 'var(--font-rozha), serif' : 'var(--font-playfair), serif',
                            }}
                            className="font-bold text-xs uppercase tracking-widest truncate max-h-40 leading-none"
                          >
                            {title || 'Book Title'}
                          </div>

                          {/* Bottom Author & Imprint */}
                          <div className="space-y-1 flex flex-col items-center">
                            <div
                              style={{
                                writingMode: 'vertical-rl',
                                transform: 'rotate(180deg)',
                              }}
                              className="font-mono text-[8px] uppercase tracking-wider opacity-85 truncate max-h-14"
                            >
                              {author || 'Author'}
                            </div>
                            <div style={{ color: foilColor }} className="text-[9px]">
                              ✦
                            </div>
                          </div>
                        </div>

                        {/* Custom Cover Upload Box (2:3 Aspect) */}
                        <div className="w-full pt-3 border-t border-neutral-800 text-center space-y-2">
                          <label className="text-[10px] font-medium text-neutral-400 block">
                            Custom Cover Texture (2:3)
                          </label>

                          {coverImage ? (
                            <div className="relative group w-24 h-36 mx-auto rounded-lg overflow-hidden border border-neutral-800 shadow-md">
                              <img src={coverImage} alt="Cover" className="w-full h-full object-cover" />
                              <button
                                type="button"
                                onClick={() => setCoverImage('')}
                                className="absolute inset-0 bg-red-600/90 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center text-xs font-mono font-medium transition-opacity"
                              >
                                Remove
                              </button>
                            </div>
                          ) : (
                            <label
                              htmlFor="cover-upload"
                              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-medium text-white cursor-pointer inline-flex items-center gap-1.5 transition-colors border border-white/15"
                            >
                              <Camera size={13} />
                              <span>{uploadingCover ? 'Uploading...' : 'Upload Cover'}</span>
                            </label>
                          )}
                          <input
                            id="cover-upload"
                            type="file"
                            accept={ACCEPT_MAP.COVER}
                            onChange={handleCoverFileSelect}
                            className="hidden"
                          />
                          <p className="text-[10px] text-neutral-500 font-sans">
                            Composites onto the 3D model with tactile cloth texture.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Fixed Submit Footer (SaaS Buttons) */}
                <div className="p-4 md:px-8 border-t border-neutral-200 dark:border-neutral-800/80 bg-white/95 dark:bg-[#0a0a0a]/95 backdrop-blur-md shrink-0 flex items-center justify-end gap-2.5 z-20">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0e0e0e] text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-850 hover:text-neutral-900 dark:hover:text-white transition-all shadow-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 text-xs font-medium hover:bg-neutral-800 dark:hover:bg-neutral-200 active:scale-[0.98] transition-all shadow-sm"
                  >
                    <CheckCircle2 size={14} />
                    <span>{editingItem ? 'Save 3D Edition' : 'Publish to 3D Shelf'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2:3 Book Aspect Cropper */}
      {cropperRawSrc && (
        <ImageCropperModal
          isOpen={isCropperOpen}
          imageSrc={cropperRawSrc}
          aspectRatio={2 / 3}
          aspectPresetLabel="Book Cover (2:3 Portrait)"
          onCropComplete={handleCropComplete}
          onCancel={() => setIsCropperOpen(false)}
        />
      )}
    </div>
  );
}
