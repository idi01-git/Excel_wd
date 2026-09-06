// src/app/(workspace)/workspace/editor/[id]/page.tsx
'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'motion/react';
import { SimpleEditor } from '@/components/tiptap-templates/simple/simple-editor';
import { 
  Settings, 
  ArrowLeft, 
  Send, 
  XCircle, 
  AlertCircle, 
  Upload, 
  CheckCircle2, 
  Sparkles, 
  User, 
  GraduationCap, 
  PenTool, 
  Search, 
  Check, 
  ChevronDown,
  Trash2,
  Eye,
  Loader2,
  X,
} from 'lucide-react';
import { hasPermission } from '@/lib/rbac';
import { validateUploadFile, ACCEPT_MAP } from '@/lib/file-validation';
import { getOptimizedCoverUrl, getOptimizedAvatarUrl, getAlumniAvatarUrl } from '@/lib/image-optimization';
import { ImageCropperModal } from '@/components/ui/ImageCropperModal';

interface Publication {
  id: string;
  title: string;
  slug: string;
  coverImage?: string | null;
  category: string;
  language: string;
  tags: string[];
  status: string;
  content: any;
  rejectionNote?: string | null;
  authorName?: string | null;
  authorNote?: string | null;
  alumniProfileId?: string | null;
  alumniProfile?: {
    id: string;
    name: string;
    batch: string;
    branch?: string | null;
    photo?: string | null;
    currentPosition?: string | null;
    excelsiorPosition?: string | null;
  } | null;
}

interface AlumniItem {
  id: string;
  name: string;
  batch: string;
  branch: string;
  photo?: string | null;
  currentPosition?: string | null;
  excelsiorPosition?: string | null;
  designation?: string | null;
  company?: string | null;
}

interface ToastMessage {
  id: string;
  type: 'error' | 'success' | 'info';
  message: string;
}

// Helper to extract image URLs from TipTap JSON
const getImagesFromContent = (content: any): string[] => {
  const urls: string[] = [];
  const traverse = (node: any) => {
    if (!node) return;
    if (node.type === 'image' && node.attrs?.src) {
      urls.push(node.attrs.src);
    }
    if (node.content && Array.isArray(node.content)) {
      for (const child of node.content) {
        traverse(child);
      }
    }
  };
  traverse(content);
  return urls;
};

export default function WorkspaceEditorPage() {
  const { data: session } = useSession();
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [pub, setPub] = useState<Publication | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<string>('Saved');
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [editorStyle, setEditorStyle] = useState<'broadsheet' | 'minimal' | 'scholar'>('broadsheet');

  const latestContentRef = useRef<any>(null);

  const userRole = session?.user?.role;
  const canModerate = hasPermission(userRole, 'MODERATE_PUBLICATIONS');
  const canCustomizeByline = canModerate;
  const isEditable = pub?.status === 'DRAFT' || pub?.status === 'REJECTED' || (pub?.status === 'PUBLISHED' && canModerate);

  useEffect(() => {
    const savedStyle = localStorage.getItem('excelsior_editor_style') as 'broadsheet' | 'minimal' | 'scholar';
    if (savedStyle && ['broadsheet', 'minimal', 'scholar'].includes(savedStyle)) {
      setEditorStyle(savedStyle);
    }
  }, []);

  const changeEditorStyle = (style: 'broadsheet' | 'minimal' | 'scholar') => {
    setEditorStyle(style);
    localStorage.setItem('excelsior_editor_style', style);
  };

  // Form Fields
  const [title, setTitle] = useState<string>('');
  const [coverImage, setCoverImage] = useState<string>('');
  const [prevCoverImage, setPrevCoverImage] = useState<string>('');
  const [category, setCategory] = useState<string>('STORY');
  const [language, setLanguage] = useState<string>('ENGLISH');
  const [tagsInput, setTagsInput] = useState<string>('');

  // Byline / Editorial Attribution States
  const [authorMode, setAuthorMode] = useState<'SELF' | 'ALUMNI' | 'CUSTOM'>('SELF');
  const [authorName, setAuthorName] = useState<string>('');
  const [authorNote, setAuthorNote] = useState<string>('');
  const [alumniProfileId, setAlumniProfileId] = useState<string>('');
  const [alumniList, setAlumniList] = useState<AlumniItem[]>([]);
  const [alumniLoading, setAlumniLoading] = useState<boolean>(false);
  const [alumniSearch, setAlumniSearch] = useState<string>('');
  const [alumniDropdownOpen, setAlumniDropdownOpen] = useState<boolean>(false);
  const alumniPickerRef = useRef<HTMLDivElement>(null);

  // Close alumni dropdown on outside click or Escape key
  useEffect(() => {
    if (!alumniDropdownOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (alumniPickerRef.current && !alumniPickerRef.current.contains(event.target as Node)) {
        setAlumniDropdownOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setAlumniDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [alumniDropdownOpen]);
  
  // Cover Image Upload States
  const [coverUploading, setCoverUploading] = useState<boolean>(false);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [coverCropperOpen, setCoverCropperOpen] = useState<boolean>(false);
  const [coverCropSrc, setCoverCropSrc] = useState<string>('');
  const coverFileInputRef = useRef<HTMLInputElement>(null);

  // Images state for auto-cleanup
  const [prevImages, setPrevImages] = useState<string[]>([]);

  // Premium Toast System
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const handleDelete = async () => {
    if (isDeleting) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/workspace/editor/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        showToast('Publication deleted successfully.', 'success');
        setShowDeleteModal(false);
        setTimeout(() => {
          router.push('/workspace');
        }, 600);
      } else {
        showToast(data.error || 'Failed to delete publication.', 'error');
        setIsDeleting(false);
      }
    } catch (err) {
      console.error('Delete publication error:', err);
      showToast('An error occurred while deleting.', 'error');
      setIsDeleting(false);
    }
  };

  const showToast = (message: string, type: 'error' | 'success' | 'info' = 'info') => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, type, message }]);
    
    // Auto-remove after 4 seconds
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };
  
  const titleRef = useRef<HTMLTextAreaElement>(null);

  const fetchPublication = async () => {
    try {
      const res = await fetch(`/api/workspace/editor/${id}`);
      const data = await res.json();
      if (data.success) {
        setPub(data.publication);
        setTitle(data.publication.title);
        setCoverImage(data.publication.coverImage || '');
        setPrevCoverImage(data.publication.coverImage || '');
        setCategory(data.publication.category);
        setLanguage(data.publication.language || 'ENGLISH');
        setTagsInput(data.publication.tags.join(', '));
        
        // Populate Byline States
        if (data.publication.alumniProfileId) {
          setAuthorMode('ALUMNI');
          setAlumniProfileId(data.publication.alumniProfileId);
          setAuthorName(data.publication.authorName || data.publication.alumniProfile?.name || '');
          setAuthorNote(data.publication.authorNote || '');
        } else if (data.publication.authorName) {
          setAuthorMode('CUSTOM');
          setAuthorName(data.publication.authorName);
          setAuthorNote(data.publication.authorNote || '');
          setAlumniProfileId('');
        } else {
          setAuthorMode('SELF');
          setAuthorName('');
          setAuthorNote('');
          setAlumniProfileId('');
        }

        // Populate previous images for auto-cleanup
        const initialImages = getImagesFromContent(data.publication.content);
        setPrevImages(initialImages);
      } else {
        router.push('/workspace');
      }
    } catch (error) {
      console.error('Failed to load publication details:', error);
      router.push('/workspace');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPublication();
  }, [id]);

  // Load Alumni Directory for Byline Picker if Editorial Role
  useEffect(() => {
    if (canCustomizeByline) {
      setAlumniLoading(true);
      fetch('/api/community/alumni')
        .then((res) => res.json())
        .then((data) => {
          if (data.success && Array.isArray(data.alumni)) {
            setAlumniList(data.alumni);
          }
        })
        .catch((err) => console.error('Failed to load alumni for byline picker:', err))
        .finally(() => setAlumniLoading(false));
    }
  }, [canCustomizeByline]);
  
  // Auto-resize title textarea
  useEffect(() => {
    if (titleRef.current) {
      titleRef.current.style.height = 'auto';
      titleRef.current.style.height = titleRef.current.scrollHeight + 'px';
    }
  }, [title]);

  const filteredAlumni = useMemo(() => {
    const q = alumniSearch.toLowerCase().trim();
    if (!q) return alumniList;
    return alumniList.filter(
      (a) =>
        (a.name && a.name.toLowerCase().includes(q)) ||
        (a.batch && a.batch.toLowerCase().includes(q)) ||
        (a.branch && a.branch.toLowerCase().includes(q)) ||
        ((a as any).currentPosition && String((a as any).currentPosition).toLowerCase().includes(q)) ||
        ((a as any).excelsiorPosition && String((a as any).excelsiorPosition).toLowerCase().includes(q))
    );
  }, [alumniList, alumniSearch]);

  const selectedAlumnus = useMemo(() => {
    if (!alumniProfileId) return null;
    return alumniList.find((a) => a.id === alumniProfileId) || pub?.alumniProfile || null;
  }, [alumniList, alumniProfileId, pub?.alumniProfile]);

  const handleAutoSaveWithParams = async ({
    newTitle,
    newCategory,
    newLanguage,
    newCover,
    updatedContent,
    newAuthorName,
    newAuthorNote,
    newAlumniProfileId,
  }: {
    newTitle?: string;
    newCategory?: string;
    newLanguage?: string;
    newCover?: string | null;
    updatedContent?: any;
    newAuthorName?: string | null;
    newAuthorNote?: string | null;
    newAlumniProfileId?: string | null;
  }) => {
    if (!isEditable) return;

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim().replace(/^#/, ''))
      .filter((t) => t.length > 0)
      .slice(0, 3);

    const activeContent = updatedContent !== undefined ? updatedContent : (pub?.content || null);
    
    // Auto-delete removed images from Cloudinary
    if (updatedContent !== undefined) {
      const currentImages = getImagesFromContent(updatedContent);
      const deletedImages = prevImages.filter((img) => !currentImages.includes(img));
      
      if (deletedImages.length > 0) {
        await Promise.all(
          deletedImages.map(async (imgUrl) => {
            if (imgUrl.includes('cloudinary.com')) {
              try {
                await fetch('/api/uploads/delete', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ url: imgUrl }),
                });
              } catch (err) {
                console.error('Failed to delete image:', imgUrl, err);
              }
            }
          })
        );
      }
      setPrevImages(currentImages);
    }

    const currentAuthorName = newAuthorName !== undefined ? newAuthorName : (authorName.trim() || null);
    const currentAuthorNote = newAuthorNote !== undefined ? newAuthorNote : (authorNote.trim() || null);
    const currentAlumniProfileId = newAlumniProfileId !== undefined ? newAlumniProfileId : (alumniProfileId.trim() || null);

    const payload: any = {
      title: newTitle !== undefined ? newTitle : title,
      coverImage: newCover !== undefined ? newCover : (coverImage.trim() || null),
      category: newCategory !== undefined ? newCategory : category,
      language: newLanguage !== undefined ? newLanguage : language,
      tags,
      content: activeContent,
    };

    if (canCustomizeByline) {
      payload.authorName = currentAuthorName;
      payload.authorNote = currentAuthorNote;
      payload.alumniProfileId = currentAlumniProfileId;
    }

    const res = await fetch(`/api/workspace/editor/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    
    const data = await res.json();
    if (!data.success) {
      throw new Error(data.error || 'Failed to save');
    }

    setPub(data.publication);
  };

  const handleAutoSave = async (updatedContent: any) => {
    await handleAutoSaveWithParams({ updatedContent });
  };

  // Cover Image File Drag & Select Handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      handleCoverFileSelect(file);
    }
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      handleCoverFileSelect(file);
    }
  };

  const handleCoverFileSelect = (file: File) => {
    const validation = validateUploadFile(file, 'COVER');
    if (!validation.valid) {
      showToast(validation.error || 'Invalid cover image format or size.', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setCoverCropSrc(reader.result as string);
      setCoverCropperOpen(true);
    };
    reader.readAsDataURL(file);
  };

  const handleCoverCropComplete = async (croppedBlob: Blob) => {
    setCoverCropperOpen(false);
    setCoverUploading(true);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('Failed to read cropped image'));
        reader.readAsDataURL(croppedBlob);
      });

      const response = await fetch('/api/uploads/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dataUrl,
          folder: 'excelsior/publications/covers'
        })
      });

      const result = await response.json();
      if (!response.ok || !result.success || typeof result.url !== 'string') {
        throw new Error(result.error || 'Failed to upload cover image');
      }

      // Delete old cover image from Cloudinary if existed
      if (coverImage && coverImage.includes('cloudinary.com')) {
        try {
          await fetch('/api/uploads/delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: coverImage })
          });
        } catch (err) {
          console.error('Failed to clean up old cover image:', err);
        }
      }

      setCoverImage(result.url);
      setPrevCoverImage(result.url);
      await handleAutoSaveWithParams({ newCover: result.url });
      showToast('Cover image cropped and uploaded successfully.', 'success');
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Failed to upload cover image.', 'error');
    } finally {
      setCoverUploading(false);
      setCoverCropSrc('');
      if (coverFileInputRef.current) coverFileInputRef.current.value = '';
    }
  };

  const handleStatusChange = async (action: 'SUBMIT' | 'WITHDRAW' | 'RESUBMIT' | 'PUBLISH') => {
    if (action === 'SUBMIT' || action === 'RESUBMIT' || action === 'PUBLISH') {
      // Synchronously save the latest changes before validating and submitting
      if (latestContentRef.current) {
        setSaveStatus('Saving latest changes...');
        try {
          await handleAutoSaveWithParams({ updatedContent: latestContentRef.current });
          setSaveStatus('Saved');
        } catch (err) {
          console.error('Failed to save latest changes before submitting:', err);
          showToast('Failed to save latest draft changes. Please try again.', 'error');
          return;
        }
      }

      // Validate title
      if (!title || !title.trim()) {
        showToast('Please enter a title for your publication before proceeding.', 'error');
        return;
      }
      if (title.toLowerCase().trim() === 'untitled draft' || title.toLowerCase().trim().startsWith('untitled draft #')) {
        showToast('Please customize your publication title from "Untitled Draft" before proceeding.', 'error');
        return;
      }
      
      // Validate category
      if (!category) {
        showToast('Please select a category for your publication.', 'error');
        return;
      }

      // Check if content is empty (contains only a single empty paragraph)
      const activeContent = latestContentRef.current || pub?.content;
      const isContentEmpty = !activeContent || (
        Array.isArray(activeContent.content) && 
        activeContent.content.length === 1 && 
        activeContent.content[0].type === 'paragraph' && 
        (!activeContent.content[0].content || activeContent.content[0].content.length === 0)
      );
      
      if (isContentEmpty) {
        showToast('Your publication canvas is empty. Please write some content before proceeding.', 'error');
        return;
      }
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/workspace/editor/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      const data = await res.json();
      if (data.success) {
        showToast(
          action === 'PUBLISH'
            ? 'Writeup published live successfully!'
            : action === 'SUBMIT' || action === 'RESUBMIT'
            ? 'Submission submitted successfully! Awaiting review.'
            : 'Submission withdrawn.',
          'success'
        );
        setTimeout(() => {
          router.push('/workspace');
        }, 1500);
      } else {
        showToast(data.error || 'Failed to update status', 'error');
      }
    } catch (error) {
      console.error('Failed to change status:', error);
      showToast('An error occurred while updating status.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !pub) {
    return (
      <div className="max-w-3xl mx-auto py-24 px-6 animate-pulse">
        <div className="h-16 bg-gray-200 dark:bg-slate-900/60 rounded mb-8 w-3/4"></div>
        <div className="h-6 bg-gray-200 dark:bg-slate-900/60 rounded w-1/4 mb-16"></div>
        <div className="h-96 bg-gray-100 dark:bg-slate-900/40 rounded"></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-500 theme-${editorStyle}`}>
      {/* Sticky Navigation Header */}
      <div className="sticky top-0 z-40 bg-white/95 dark:bg-black/90 backdrop-blur-xl border-b border-gray-200 dark:border-white/10 px-3 sm:px-6 py-2.5 sm:py-3.5 flex items-center justify-between gap-2">
        
        {/* Left Side: Back, Status, Save State */}
        <div className="flex items-center gap-2.5 sm:gap-4 md:gap-6 min-w-0">
          <Link href="/workspace" className="inline-flex">
            <motion.div
              whileHover={{ x: -4, scale: 1.03, backgroundColor: "var(--tw-bg-opacity, 0.05)" }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
              className="text-xs sm:text-sm font-bold text-gray-500 hover:text-black dark:hover:text-white transition-colors flex items-center gap-1.5 shrink-0 px-2.5 py-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back</span>
            </motion.div>
          </Link>
          
          <div className="hidden sm:block h-4 w-px bg-gray-300 dark:bg-white/20 shrink-0"></div>
          
          <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
            <span className={`text-[9px] sm:text-[10px] px-2 py-0.5 border rounded-full font-bold uppercase tracking-wider shrink-0 ${
              pub.status === 'PUBLISHED'
                ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/30'
                : pub.status === 'PENDING'
                ? 'bg-cyan-50 text-cyan-600 border-cyan-200 dark:bg-cyan-500/10 dark:text-cyan-400 dark:border-cyan-500/30'
                : pub.status === 'REJECTED'
                ? 'bg-red-50 text-red-600 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/30'
                : 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-500/10 dark:text-gray-400 dark:border-white/10'
            }`}>
              {pub.status}
            </span>
            <span className="text-[10px] sm:text-xs text-gray-400 font-medium truncate">
              {saveStatus}
            </span>
          </div>
        </div>

        {/* Right Side: Settings & Actions */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          <motion.button 
            onClick={() => setShowSettings(!showSettings)} 
            whileHover={{ scale: 1.05, y: -1 }}
            whileTap={{ scale: 0.94 }}
            transition={{ type: "spring", stiffness: 400, damping: 25, mass: 0.5 }}
            className={`p-1.5 sm:py-2 sm:px-3 rounded-full flex items-center gap-1.5 text-xs sm:text-sm font-bold cursor-pointer transition-all duration-300 backdrop-blur-md border ${
              showSettings 
                ? 'bg-black/90 dark:bg-white/90 text-white dark:text-black border-transparent shadow-[0_4px_14px_rgba(0,0,0,0.1)]' 
                : 'bg-white/50 dark:bg-black/50 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 hover:bg-white/80 dark:hover:bg-black/80 hover:shadow-sm'
            }`}
            title="Publication Settings"
          >
            <motion.div
              animate={showSettings ? { rotate: 90 } : { rotate: 0 }}
              whileHover={{ rotate: 45 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <Settings className="w-4 h-4" />
            </motion.div>
            <span className="hidden md:inline">Settings</span>
          </motion.button>

          {pub.status === 'PENDING' && (
            <motion.button
              onClick={() => handleStatusChange('WITHDRAW')}
              disabled={saving}
              whileHover={{ scale: 1.03, y: -1.5, boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)" }}
              whileTap={{ scale: 0.96, y: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 25, mass: 0.5 }}
              className="py-1.5 sm:py-2 px-3.5 sm:px-5 bg-white/60 dark:bg-black/60 hover:bg-white dark:hover:bg-black text-gray-800 dark:text-gray-200 hover:text-black dark:hover:text-white text-xs font-bold rounded-full border border-gray-200/80 dark:border-white/10 backdrop-blur-md shadow-sm hover:shadow-md transition-all duration-300 flex items-center gap-1 cursor-pointer disabled:opacity-50"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Withdraw</span>
            </motion.button>
          )}

          {pub.status === 'DRAFT' && (
            <div className="flex items-center gap-1.5 sm:gap-2">
              {canCustomizeByline && (
                <motion.button
                  onClick={() => handleStatusChange('PUBLISH')}
                  disabled={saving}
                  whileHover={{
                    scale: 1.04,
                    y: -1.5,
                  }}
                  whileTap={{ scale: 0.96, y: 0 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25, mass: 0.5 }}
                  className="relative group overflow-hidden py-1.5 sm:py-2 px-3.5 sm:px-5 bg-linear-to-b from-emerald-500 to-emerald-600 text-white text-xs font-bold rounded-full flex items-center gap-1.5 cursor-pointer shadow-[0_4px_14px_0_rgba(16,185,129,0.39)] hover:shadow-[0_6px_20px_rgba(16,185,129,0.23)] hover:bg-[rgba(16,185,129,0.9)] disabled:opacity-50 border border-emerald-400/30 transition-all duration-300"
                  title="Publish directly to website without queue"
                >
                  <div className="absolute inset-0 bg-white/20 -translate-y-full group-hover:translate-y-full transition-transform duration-500 ease-in-out" />
                  <Sparkles className="w-3.5 h-3.5 drop-shadow-sm" />
                  <span className="drop-shadow-sm">Publish</span>
                </motion.button>
              )}
              <motion.button
                onClick={() => handleStatusChange('SUBMIT')}
                disabled={saving}
                whileHover={{
                  scale: 1.03,
                  y: -1.5,
                }}
                whileTap={{ scale: 0.96, y: 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 25, mass: 0.5 }}
                className={`relative group overflow-hidden py-1.5 sm:py-2 px-4 sm:px-6 text-xs font-bold rounded-full flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-all duration-300 ${
                  canCustomizeByline
                    ? 'bg-linear-to-b from-white to-gray-50 dark:from-neutral-800 dark:to-neutral-900 text-neutral-900 dark:text-neutral-100 border border-neutral-200 dark:border-neutral-700 shadow-sm hover:shadow-md'
                    : 'bg-linear-to-b from-neutral-800 to-black dark:from-neutral-200 dark:to-white text-white dark:text-black shadow-[0_4px_14px_0_rgba(0,0,0,0.39)] dark:shadow-[0_4px_14px_0_rgba(255,255,255,0.39)] border border-white/10 dark:border-black/10 hover:shadow-[0_6px_20px_rgba(0,0,0,0.23)] dark:hover:shadow-[0_6px_20px_rgba(255,255,255,0.23)]'
                }`}
              >
                {/* Subtle shine effect */}
                <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out" />
                <Send className="w-3.5 h-3.5 relative z-10" />
                <span className="relative z-10">{canCustomizeByline ? 'Submit to Queue' : 'Submit'}</span>
              </motion.button>
            </div>
          )}

          {pub.status === 'REJECTED' && (
            <motion.button
              onClick={() => handleStatusChange('RESUBMIT')}
              disabled={saving}
              whileHover={{
                scale: 1.03,
                y: -1.5,
              }}
              whileTap={{ scale: 0.96, y: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 25, mass: 0.5 }}
              className="relative group overflow-hidden py-1.5 sm:py-2 px-4 sm:px-6 bg-linear-to-b from-neutral-800 to-black dark:from-neutral-200 dark:to-white text-white dark:text-black text-xs font-bold rounded-full flex items-center gap-1.5 cursor-pointer shadow-[0_4px_14px_0_rgba(0,0,0,0.39)] dark:shadow-[0_4px_14px_0_rgba(255,255,255,0.39)] border border-white/10 dark:border-black/10 hover:shadow-[0_6px_20px_rgba(0,0,0,0.23)] dark:hover:shadow-[0_6px_20px_rgba(255,255,255,0.23)] disabled:opacity-50 transition-all duration-300"
            >
              <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out" />
              <Send className="w-3.5 h-3.5 relative z-10" />
              <span className="relative z-10">Resubmit</span>
            </motion.button>
          )}

          {pub.status === 'PUBLISHED' && (
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Link
                href={`/publications/${pub.slug}`}
                target="_blank"
                className="py-1.5 sm:py-2 px-3 sm:px-4 bg-white/60 dark:bg-black/60 hover:bg-white dark:hover:bg-black text-gray-800 dark:text-gray-200 hover:text-black dark:hover:text-white text-xs font-bold rounded-full border border-gray-200/80 dark:border-white/10 backdrop-blur-md shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                title="View live publication"
              >
                <Eye className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">View Live</span>
              </Link>
              <motion.button
                onClick={() => handleAutoSaveWithParams({})}
                disabled={saving}
                whileHover={{ scale: 1.03, y: -1.5 }}
                whileTap={{ scale: 0.96 }}
                transition={{ type: "spring", stiffness: 400, damping: 25, mass: 0.5 }}
                className="py-1.5 sm:py-2 px-3.5 sm:px-5 bg-black dark:bg-white text-white dark:text-black text-xs font-bold rounded-full flex items-center gap-1.5 cursor-pointer shadow-sm hover:shadow-md transition-all duration-300 disabled:opacity-50"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Save Live Changes</span>
              </motion.button>
              <motion.button
                onClick={() => setShowDeleteModal(true)}
                disabled={saving}
                whileHover={{ scale: 1.03, y: -1.5 }}
                whileTap={{ scale: 0.96 }}
                transition={{ type: "spring", stiffness: 400, damping: 25, mass: 0.5 }}
                className="p-1.5 sm:py-2 sm:px-3 bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/60 text-red-600 dark:text-red-400 text-xs font-bold rounded-full border border-red-200 dark:border-red-900/40 transition-colors flex items-center gap-1 cursor-pointer"
                title="Delete publication"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Delete</span>
              </motion.button>
            </div>
          )}
        </div>
      </div>

      {/* Main Distraction-Free Canvas */}
      <div className="flex-1 w-full max-w-3xl lg:max-w-4xl xl:max-w-5xl mx-auto py-6 sm:py-10 md:py-16 px-3.5 xs:px-5 sm:px-6 md:px-8">
        
        {/* Editor Revision Note */}
        {pub.status === 'REJECTED' && pub.rejectionNote && (
          <div className="mb-6 sm:mb-8 p-3.5 sm:p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-500/20 rounded-xl text-xs sm:text-sm flex items-start gap-2.5 sm:gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <strong className="text-red-600 dark:text-red-400 block mb-1">Editor Revision Requested</strong>
              <span className="text-gray-700 dark:text-gray-300">"{pub.rejectionNote}"</span>
            </div>
          </div>
        )}

        {/* Publication Settings Drawer (Animated) */}
        <AnimatePresence initial={false}>
          {showSettings && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ type: "spring", bounce: 0, duration: 0.4 }}
              className="overflow-hidden"
            >
              <div className="mb-8 sm:mb-12 p-4 sm:p-6 bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-sm">
                <h3 className="text-xs sm:text-sm font-bold text-neutral-950 dark:text-neutral-50 mb-4 sm:mb-6 uppercase tracking-wider">Publication Settings</h3>
                
                {/* Style Selector */}
                <div className="mb-5 sm:mb-6 border-b border-neutral-200 dark:border-neutral-800 pb-5 sm:pb-6">
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <label className="text-[10px] text-neutral-500 dark:text-neutral-400 uppercase tracking-wider font-semibold block">
                      Writing Style Theme
                    </label>
                    <span className="text-[9px] font-mono text-neutral-400 dark:text-neutral-500">
                      Editor Canvas Appearance
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Option 1: Broadsheet */}
                    <motion.button
                      type="button"
                      onClick={() => changeEditorStyle('broadsheet')}
                      whileHover={{ y: -2, scale: 1.015 }}
                      whileTap={{ scale: 0.985 }}
                      transition={{ type: "spring", stiffness: 400, damping: 25, mass: 0.5 }}
                      className={`p-3.5 sm:p-4 rounded-xl border text-left flex flex-col justify-between h-auto sm:h-28 gap-2 cursor-pointer transition-all duration-200 ${
                        editorStyle === 'broadsheet'
                          ? 'border-neutral-950 dark:border-white bg-white dark:bg-neutral-900 text-neutral-950 dark:text-white ring-1.5 ring-neutral-950 dark:ring-white shadow-sm'
                          : 'border-neutral-200 dark:border-neutral-800 bg-white/60 dark:bg-neutral-950/40 text-neutral-700 dark:text-neutral-300 hover:border-neutral-400 dark:hover:border-neutral-600 hover:bg-white dark:hover:bg-neutral-900/60'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="text-xs font-bold font-sans">Broadsheet</span>
                        {editorStyle === 'broadsheet' ? (
                          <Check className="w-3.5 h-3.5 text-neutral-950 dark:text-white shrink-0" />
                        ) : (
                          <span className="w-2.5 h-2.5 rounded-full border border-neutral-300 dark:border-neutral-700 shrink-0" />
                        )}
                      </div>
                      <span className={`text-[11px] leading-snug ${
                        editorStyle === 'broadsheet'
                          ? 'text-neutral-600 dark:text-neutral-300 font-medium'
                          : 'text-neutral-500 dark:text-neutral-400'
                      }`}>
                        High contrast, sharp borders, structured newsroom aesthetic.
                      </span>
                    </motion.button>

                    {/* Option 2: Minimal */}
                    <motion.button
                      type="button"
                      onClick={() => changeEditorStyle('minimal')}
                      whileHover={{ y: -2, scale: 1.015 }}
                      whileTap={{ scale: 0.985 }}
                      transition={{ type: "spring", stiffness: 400, damping: 25, mass: 0.5 }}
                      className={`p-3.5 sm:p-4 rounded-xl border text-left flex flex-col justify-between h-auto sm:h-28 gap-2 cursor-pointer transition-all duration-200 ${
                        editorStyle === 'minimal'
                          ? 'border-neutral-950 dark:border-white bg-white dark:bg-neutral-900 text-neutral-950 dark:text-white ring-1.5 ring-neutral-950 dark:ring-white shadow-sm'
                          : 'border-neutral-200 dark:border-neutral-800 bg-white/60 dark:bg-neutral-950/40 text-neutral-700 dark:text-neutral-300 hover:border-neutral-400 dark:hover:border-neutral-600 hover:bg-white dark:hover:bg-neutral-900/60'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="text-xs font-bold font-sans">Minimal Canvas</span>
                        {editorStyle === 'minimal' ? (
                          <Check className="w-3.5 h-3.5 text-neutral-950 dark:text-white shrink-0" />
                        ) : (
                          <span className="w-2.5 h-2.5 rounded-full border border-neutral-300 dark:border-neutral-700 shrink-0" />
                        )}
                      </div>
                      <span className={`text-[11px] leading-snug ${
                        editorStyle === 'minimal'
                          ? 'text-neutral-600 dark:text-neutral-300 font-medium'
                          : 'text-neutral-500 dark:text-neutral-400'
                      }`}>
                        Borderless, transparent background, pure focus layout.
                      </span>
                    </motion.button>

                    {/* Option 3: Scholar */}
                    <motion.button
                      type="button"
                      onClick={() => changeEditorStyle('scholar')}
                      whileHover={{ y: -2, scale: 1.015 }}
                      whileTap={{ scale: 0.985 }}
                      transition={{ type: "spring", stiffness: 400, damping: 25, mass: 0.5 }}
                      className={`p-3.5 sm:p-4 rounded-xl border text-left flex flex-col justify-between h-auto sm:h-28 gap-2 cursor-pointer transition-all duration-200 ${
                        editorStyle === 'scholar'
                          ? 'border-neutral-950 dark:border-white bg-white dark:bg-neutral-900 text-neutral-950 dark:text-white ring-1.5 ring-neutral-950 dark:ring-white shadow-sm'
                          : 'border-neutral-200 dark:border-neutral-800 bg-white/60 dark:bg-neutral-950/40 text-neutral-700 dark:text-neutral-300 hover:border-neutral-400 dark:hover:border-neutral-600 hover:bg-white dark:hover:bg-neutral-900/60'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="text-xs font-bold font-sans">Cozy Scholar</span>
                        {editorStyle === 'scholar' ? (
                          <Check className="w-3.5 h-3.5 text-neutral-950 dark:text-white shrink-0" />
                        ) : (
                          <span className="w-2.5 h-2.5 rounded-full border border-neutral-300 dark:border-neutral-700 shrink-0" />
                        )}
                      </div>
                      <span className={`text-[11px] leading-snug ${
                        editorStyle === 'scholar'
                          ? 'text-neutral-600 dark:text-neutral-300 font-medium'
                          : 'text-neutral-500 dark:text-neutral-400'
                      }`}>
                        Warm sepia & slate backgrounds, reading-optimized.
                      </span>
                    </motion.button>
                  </div>
                </div>

                {/* Editorial Attribution & Byline Section (Visible for Content Lead / Coordinator / Tech Lead) */}
                {canCustomizeByline && (
                  <div className="mb-5 sm:mb-6 border-b border-neutral-200 dark:border-neutral-800 pb-5 sm:pb-6">
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div>
                        <label className="text-[10px] text-neutral-500 dark:text-neutral-400 uppercase tracking-wider font-semibold block">
                          Editorial Attribution & Byline
                        </label>
                        <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                          Publish under your account, link an alumnus from Archivum Alumnorum, or assign a guest byline.
                        </p>
                      </div>
                      <span className="text-[9px] font-mono font-medium px-2.5 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700 shrink-0">
                        Editorial Staff
                      </span>
                    </div>

                    {/* Attribution Mode Switcher */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-4">
                      {/* Self */}
                      <motion.button
                        type="button"
                        onClick={() => {
                          if (!isEditable) return;
                          setAuthorMode('SELF');
                          setAuthorName('');
                          setAuthorNote('');
                          setAlumniProfileId('');
                          handleAutoSaveWithParams({
                            newAuthorName: null,
                            newAuthorNote: null,
                            newAlumniProfileId: null,
                          });
                        }}
                        disabled={!isEditable}
                        whileHover={isEditable ? { y: -2, scale: 1.015 } : undefined}
                        whileTap={isEditable ? { scale: 0.985 } : undefined}
                        transition={{ type: "spring", stiffness: 400, damping: 25, mass: 0.5 }}
                        className={`p-3 rounded-xl border text-left flex items-center gap-2.5 cursor-pointer transition-all duration-200 ${
                          authorMode === 'SELF'
                            ? 'border-neutral-950 dark:border-white bg-white dark:bg-neutral-900 text-neutral-950 dark:text-white font-medium ring-1.5 ring-neutral-950 dark:ring-white shadow-sm'
                            : 'border-neutral-200 dark:border-neutral-800 bg-white/60 dark:bg-neutral-950/40 text-neutral-700 dark:text-neutral-300 hover:border-neutral-400 dark:hover:border-neutral-600 hover:bg-white dark:hover:bg-neutral-900/60'
                        }`}
                      >
                        <User className="w-4 h-4 shrink-0" />
                        <div className="min-w-0">
                          <span className="text-xs font-semibold block">My Profile</span>
                          <span className="text-[10px] opacity-70 block truncate">@{session?.user?.username || 'me'}</span>
                        </div>
                      </motion.button>

                      {/* Archivum Alumnus */}
                      <motion.button
                        type="button"
                        onClick={() => {
                          if (!isEditable) return;
                          setAuthorMode('ALUMNI');
                        }}
                        disabled={!isEditable}
                        whileHover={isEditable ? { y: -2, scale: 1.015 } : undefined}
                        whileTap={isEditable ? { scale: 0.985 } : undefined}
                        transition={{ type: "spring", stiffness: 400, damping: 25, mass: 0.5 }}
                        className={`p-3 rounded-xl border text-left flex items-center gap-2.5 cursor-pointer transition-all duration-200 ${
                          authorMode === 'ALUMNI'
                            ? 'border-neutral-950 dark:border-white bg-white dark:bg-neutral-900 text-neutral-950 dark:text-white font-medium ring-1.5 ring-neutral-950 dark:ring-white shadow-sm'
                            : 'border-neutral-200 dark:border-neutral-800 bg-white/60 dark:bg-neutral-950/40 text-neutral-700 dark:text-neutral-300 hover:border-neutral-400 dark:hover:border-neutral-600 hover:bg-white dark:hover:bg-neutral-900/60'
                        }`}
                      >
                        <GraduationCap className="w-4 h-4 shrink-0" />
                        <div className="min-w-0">
                          <span className="text-xs font-semibold block">Archivum Alumnus</span>
                          <span className="text-[10px] opacity-70 block truncate">Link to Alumni Directory</span>
                        </div>
                      </motion.button>

                      {/* Custom Guest Byline */}
                      <motion.button
                        type="button"
                        onClick={() => {
                          if (!isEditable) return;
                          setAuthorMode('CUSTOM');
                          setAlumniProfileId('');
                          handleAutoSaveWithParams({ newAlumniProfileId: null });
                        }}
                        disabled={!isEditable}
                        whileHover={isEditable ? { y: -2, scale: 1.015 } : undefined}
                        whileTap={isEditable ? { scale: 0.985 } : undefined}
                        transition={{ type: "spring", stiffness: 400, damping: 25, mass: 0.5 }}
                        className={`p-3 rounded-xl border text-left flex items-center gap-2.5 cursor-pointer transition-all duration-200 ${
                          authorMode === 'CUSTOM'
                            ? 'border-neutral-950 dark:border-white bg-white dark:bg-neutral-900 text-neutral-950 dark:text-white font-medium ring-1.5 ring-neutral-950 dark:ring-white shadow-sm'
                            : 'border-neutral-200 dark:border-neutral-800 bg-white/60 dark:bg-neutral-950/40 text-neutral-700 dark:text-neutral-300 hover:border-neutral-400 dark:hover:border-neutral-600 hover:bg-white dark:hover:bg-neutral-900/60'
                        }`}
                      >
                        <PenTool className="w-4 h-4 shrink-0" />
                        <div className="min-w-0">
                          <span className="text-xs font-semibold block">Custom / Guest</span>
                          <span className="text-[10px] opacity-70 block truncate">Unregistered Author</span>
                        </div>
                      </motion.button>
                    </div>

                    {/* Mode A: Archivum Alumnus Selector */}
                    {authorMode === 'ALUMNI' && (
                      <div ref={alumniPickerRef} className="p-3.5 sm:p-4 rounded-xl bg-gray-100/70 dark:bg-white/5 border border-gray-200 dark:border-white/10 space-y-3.5">
                        <div className="flex flex-col gap-1.5 relative">
                          <label className="text-[10px] uppercase tracking-wider font-semibold text-neutral-600 dark:text-neutral-400">
                            Select Alumnus from Archivum
                          </label>

                          {/* Selected Alumnus Card Preview */}
                          {selectedAlumnus ? (
                            <div className="flex items-center justify-between p-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-xs">
                              <div className="flex items-center gap-3 min-w-0">
                                <img
                                  src={getAlumniAvatarUrl(selectedAlumnus.photo, selectedAlumnus.name, 72)}
                                  alt={selectedAlumnus.name}
                                  onError={(e) => {
                                    const fallback = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(selectedAlumnus.name || 'Alumnus')}`;
                                    if (e.currentTarget.src !== fallback) {
                                      e.currentTarget.src = fallback;
                                    }
                                  }}
                                  className="w-9 h-9 rounded-full object-cover border border-neutral-200 dark:border-neutral-700 shrink-0"
                                />
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="block text-xs font-bold text-neutral-900 dark:text-neutral-100 truncate">
                                      {selectedAlumnus.name}
                                    </span>
                                    <span className="text-[9px] font-mono font-medium px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700">
                                      Class of {selectedAlumnus.batch}
                                    </span>
                                  </div>
                                  <span className="block text-[10px] text-neutral-500 dark:text-neutral-400 font-mono truncate mt-0.5">
                                    {selectedAlumnus.branch && selectedAlumnus.branch !== 'null' ? `${selectedAlumnus.branch}` : 'Archivum Alumnus'}
                                    {selectedAlumnus.currentPosition && selectedAlumnus.currentPosition !== 'null' && selectedAlumnus.currentPosition !== 'undefined'
                                      ? ` · ${selectedAlumnus.currentPosition}`
                                      : ''}
                                  </span>
                                </div>
                              </div>
                              {isEditable && (
                                <motion.button
                                  type="button"
                                  onClick={() => setAlumniDropdownOpen((prev) => !prev)}
                                  whileHover={{ scale: 1.03 }}
                                  whileTap={{ scale: 0.96 }}
                                  transition={{ type: "spring", stiffness: 400, damping: 25, mass: 0.5 }}
                                  className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all duration-200 cursor-pointer shrink-0 ml-2 shadow-xs ${
                                    alumniDropdownOpen
                                      ? 'bg-black text-white dark:bg-white dark:text-black border-black dark:border-white'
                                      : 'bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-700'
                                  }`}
                                >
                                  {alumniDropdownOpen ? 'Close' : 'Change'}
                                </motion.button>
                              )}
                            </div>
                          ) : (
                            <motion.button
                              type="button"
                              onClick={() => setAlumniDropdownOpen((prev) => !prev)}
                              disabled={!isEditable}
                              whileHover={isEditable ? { scale: 1.01 } : undefined}
                              whileTap={isEditable ? { scale: 0.99 } : undefined}
                              transition={{ type: "spring", stiffness: 400, damping: 25, mass: 0.5 }}
                              className="w-full flex items-center justify-between p-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-600 rounded-xl text-left text-xs text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors duration-200 cursor-pointer shadow-xs"
                            >
                              <div className="flex items-center gap-2">
                                <GraduationCap className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
                                <span>{alumniLoading ? 'Loading alumni profiles...' : 'Choose an alumnus from directory...'}</span>
                              </div>
                              <ChevronDown className={`w-4 h-4 text-neutral-400 transition-transform duration-200 ${alumniDropdownOpen ? 'rotate-180 text-black dark:text-white' : ''}`} />
                            </motion.button>
                          )}

                          {/* Searchable Picker Dropdown */}
                          {alumniDropdownOpen && isEditable && (
                            <div 
                              className="p-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-xl dark:shadow-[0_20px_50px_rgba(0,0,0,0.8)] space-y-2.5 mt-1 relative z-20"
                            >
                              <div className="flex items-center gap-2">
                                <div className="relative flex-1 flex items-center">
                                  <Search className="w-3.5 h-3.5 absolute left-3 text-neutral-400 pointer-events-none" />
                                  <input
                                    type="text"
                                    value={alumniSearch}
                                    onChange={(e) => setAlumniSearch(e.target.value)}
                                    placeholder="Search by name, batch, branch, role..."
                                    className="w-full pl-8 pr-7 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg text-xs text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 outline-none focus:border-neutral-950 dark:focus:border-neutral-200 focus:ring-1 focus:ring-neutral-950 dark:focus:ring-neutral-200 transition-colors"
                                    autoFocus
                                  />
                                  {alumniSearch && (
                                    <button
                                      type="button"
                                      onClick={() => setAlumniSearch('')}
                                      className="absolute right-2.5 text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 p-0.5 rounded cursor-pointer transition-colors"
                                      title="Clear search"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>

                                <button
                                  type="button"
                                  onClick={() => setAlumniDropdownOpen(false)}
                                  className="px-3 py-2 text-xs font-semibold text-neutral-600 dark:text-neutral-300 hover:text-neutral-950 dark:hover:text-neutral-50 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer shrink-0 border border-neutral-200 dark:border-neutral-800"
                                  title="Close dropdown"
                                >
                                  Close
                                </button>
                              </div>

                              {/* Alumni Count and Reset Row */}
                              <div className="flex items-center justify-between px-1 text-[10px] text-neutral-500 dark:text-neutral-400 font-mono">
                                <span>
                                  {alumniLoading
                                    ? 'Fetching directory...'
                                    : `${filteredAlumni.length} of ${alumniList.length} ${alumniList.length === 1 ? 'alumnus' : 'alumni'} available`}
                                </span>
                                {alumniSearch && (
                                  <button
                                    type="button"
                                    onClick={() => setAlumniSearch('')}
                                    className="text-neutral-900 dark:text-neutral-100 font-semibold hover:underline cursor-pointer"
                                  >
                                    Reset filter
                                  </button>
                                )}
                              </div>

                              {/* Scrollable List Container with explicit custom scrollbar */}
                              <div className="max-h-72 overflow-y-auto space-y-1 pr-1.5 visible-scrollbar overscroll-contain touch-pan-y divide-y divide-neutral-100 dark:divide-neutral-800/40">
                                {alumniLoading ? (
                                  <div className="flex items-center justify-center py-8 gap-2 text-xs text-neutral-500 dark:text-neutral-400">
                                    <Loader2 className="w-4 h-4 animate-spin text-neutral-800 dark:text-neutral-200" />
                                    <span>Loading Archivum Directory...</span>
                                  </div>
                                ) : filteredAlumni.length === 0 ? (
                                  <div className="py-8 text-center text-xs text-neutral-400">
                                    <p className="font-medium text-neutral-600 dark:text-neutral-300">No alumni found.</p>
                                    {alumniSearch && (
                                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1">
                                        Try searching by name, graduation year, branch, or current position.
                                      </p>
                                    )}
                                  </div>
                                ) : (
                                  filteredAlumni.map((alum) => {
                                    const isSelected = alumniProfileId === alum.id;
                                    return (
                                      <motion.button
                                        key={alum.id}
                                        type="button"
                                        onClick={() => {
                                          setAlumniProfileId(alum.id);
                                          setAuthorName(alum.name);
                                          setAlumniDropdownOpen(false);
                                          handleAutoSaveWithParams({
                                            newAlumniProfileId: alum.id,
                                            newAuthorName: alum.name,
                                          });
                                        }}
                                        whileHover={{ x: 2 }}
                                        whileTap={{ scale: 0.985 }}
                                        transition={{ type: "spring", stiffness: 400, damping: 25, mass: 0.5 }}
                                        className={`w-full flex items-center justify-between p-2.5 rounded-lg text-left transition-colors duration-150 cursor-pointer ${
                                          isSelected
                                            ? 'bg-black text-white dark:bg-white dark:text-black font-medium shadow-xs'
                                            : 'hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-900 dark:text-neutral-100'
                                        }`}
                                      >
                                        <div className="flex items-center gap-3 min-w-0">
                                          <img
                                            src={getAlumniAvatarUrl(alum.photo, alum.name, 48)}
                                            alt={alum.name}
                                            onError={(e) => {
                                              const fallback = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(alum.name || 'Alumnus')}`;
                                              if (e.currentTarget.src !== fallback) {
                                                e.currentTarget.src = fallback;
                                              }
                                            }}
                                            className={`w-8 h-8 rounded-full object-cover shrink-0 border ${
                                              isSelected
                                                ? 'border-white/20 dark:border-black/20'
                                                : 'border-neutral-200 dark:border-neutral-700'
                                            }`}
                                          />
                                          <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                              <span className="text-xs font-bold truncate">{alum.name}</span>
                                              <span
                                                className={`text-[9px] font-mono px-1.5 py-0.2 rounded-sm border ${
                                                  isSelected
                                                    ? 'bg-white/15 text-white dark:bg-black/10 dark:text-black border-transparent'
                                                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700'
                                                }`}
                                              >
                                                Class of {alum.batch}
                                              </span>
                                            </div>
                                            <span
                                              className={`text-[10px] block font-mono truncate mt-0.5 ${
                                                isSelected
                                                  ? 'text-neutral-300 dark:text-neutral-600'
                                                  : 'text-neutral-500 dark:text-neutral-400'
                                              }`}
                                            >
                                              {alum.branch && alum.branch !== 'null' ? `${alum.branch}` : ''}
                                              {alum.currentPosition && alum.currentPosition !== 'null' && alum.currentPosition !== 'undefined'
                                                ? ` · ${alum.currentPosition}`
                                                : ''}
                                            </span>
                                          </div>
                                        </div>
                                        {isSelected && (
                                          <Check className="w-4 h-4 text-white dark:text-black shrink-0 ml-2" />
                                        )}
                                      </motion.button>
                                    );
                                  })
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Optional Byline Subtitle Note */}
                        <div className="flex flex-col">
                          <label className="text-[10px] text-gray-500 dark:text-neutral-400 uppercase tracking-wider font-semibold mb-1">
                            Custom Subtitle Note (Optional)
                          </label>
                          <input
                            type="text"
                            value={authorNote}
                            onChange={(e) => setAuthorNote(e.target.value)}
                            onBlur={() => handleAutoSaveWithParams({ newAuthorNote: authorNote.trim() || null })}
                            disabled={!isEditable}
                            placeholder="e.g. Former Literary Secretary · Guest Column"
                            className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 rounded-lg p-2 outline-none focus:border-neutral-950 dark:focus:border-neutral-200 focus:ring-1 focus:ring-neutral-950 dark:focus:ring-neutral-200 transition text-xs"
                          />
                        </div>
                      </div>
                    )}

                    {/* Mode B: Custom Unregistered Author */}
                    {authorMode === 'CUSTOM' && (
                      <div className="p-3.5 sm:p-4 rounded-xl bg-neutral-100 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-800 space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="flex flex-col">
                            <label className="text-[10px] text-neutral-500 dark:text-neutral-400 uppercase tracking-wider font-semibold mb-1">
                              Author Display Name *
                            </label>
                            <input
                              type="text"
                              value={authorName}
                              onChange={(e) => setAuthorName(e.target.value)}
                              onBlur={() => handleAutoSaveWithParams({ newAuthorName: authorName.trim() || null })}
                              disabled={!isEditable}
                              placeholder="e.g. Dr. Rajesh Verma '04"
                              className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 rounded-lg p-2 outline-none focus:border-neutral-950 dark:focus:border-neutral-200 focus:ring-1 focus:ring-neutral-950 dark:focus:ring-neutral-200 transition text-xs font-semibold"
                            />
                          </div>

                          <div className="flex flex-col">
                            <label className="text-[10px] text-neutral-500 dark:text-neutral-400 uppercase tracking-wider font-semibold mb-1">
                              Byline Note / Title (Optional)
                            </label>
                            <input
                              type="text"
                              value={authorNote}
                              onChange={(e) => setAuthorNote(e.target.value)}
                              onBlur={() => handleAutoSaveWithParams({ newAuthorNote: authorNote.trim() || null })}
                              disabled={!isEditable}
                              placeholder="e.g. Alumni Guest Essayist"
                              className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 rounded-lg p-2 outline-none focus:border-neutral-950 dark:focus:border-neutral-200 focus:ring-1 focus:ring-neutral-950 dark:focus:ring-neutral-200 transition text-xs"
                            />
                          </div>
                        </div>
                        <p className="text-[10px] text-neutral-400 dark:text-neutral-500">
                          ℹ️ This author name will appear prominently on the publication and in social cards, without linking to an active user account.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-6 mb-5 sm:mb-6 pb-5 sm:pb-6 border-b border-neutral-200 dark:border-neutral-800">
                  <div className="flex flex-col">
                    <label className="text-[10px] text-neutral-500 dark:text-neutral-400 uppercase tracking-wider font-semibold mb-1.5">Category</label>
                    <select
                      value={category}
                      onChange={(e) => {
                        setCategory(e.target.value);
                        handleAutoSaveWithParams({ newCategory: e.target.value });
                      }}
                      disabled={!isEditable}
                      className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 rounded-lg p-2 sm:p-2.5 outline-none focus:border-neutral-950 dark:focus:border-neutral-200 focus:ring-1 focus:ring-neutral-950 dark:focus:ring-neutral-200 transition text-xs sm:text-sm font-medium"
                    >
                      <option value="STORY">Story (Fiction)</option>
                      <option value="ARTICLE">Article (Essay/Research)</option>
                      <option value="POEM">Poem (Verse)</option>
                      <option value="REVIEW">Book Review</option>
                    </select>
                  </div>

                  <div className="flex flex-col">
                    <label className="text-[10px] text-neutral-500 dark:text-neutral-400 uppercase tracking-wider font-semibold mb-1.5">Language</label>
                    <select
                      value={language}
                      onChange={(e) => {
                        setLanguage(e.target.value);
                        handleAutoSaveWithParams({ newLanguage: e.target.value });
                      }}
                      disabled={!isEditable}
                      className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 rounded-lg p-2 sm:p-2.5 outline-none focus:border-neutral-950 dark:focus:border-neutral-200 focus:ring-1 focus:ring-neutral-950 dark:focus:ring-neutral-200 transition text-xs sm:text-sm font-medium"
                    >
                      <option value="ENGLISH">English</option>
                      <option value="HINDI">Hindi (हिंदी)</option>
                    </select>
                  </div>

                  <div className="flex flex-col">
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-[10px] text-neutral-500 dark:text-neutral-400 uppercase tracking-wider font-semibold">
                        Tags (comma separated)
                      </label>
                      <span className="text-[10px] text-neutral-400 dark:text-neutral-500 font-mono">
                        Max 3 tags
                      </span>
                    </div>
                    <input
                      type="text"
                      value={tagsInput}
                      onChange={(e) => setTagsInput(e.target.value)}
                      onBlur={() => {
                        const cleaned = tagsInput
                          .split(',')
                          .map((t) => t.trim().replace(/^#/, ''))
                          .filter((t) => t.length > 0)
                          .slice(0, 3)
                          .join(', ');
                        setTagsInput(cleaned);
                        handleAutoSaveWithParams({});
                      }}
                      disabled={!isEditable}
                      placeholder="e.g. Memory, Noir, Calvino (max 3)"
                      className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 rounded-lg p-2 sm:p-2.5 outline-none focus:border-neutral-950 dark:focus:border-neutral-200 focus:ring-1 focus:ring-neutral-950 dark:focus:ring-neutral-200 transition text-xs sm:text-sm"
                    />
                  </div>
                </div>

                <div className="flex flex-col">
                  <label className="text-[10px] text-neutral-500 dark:text-neutral-400 uppercase tracking-wider font-semibold mb-2.5 block">Cover Image</label>
                  
                  {coverImage.trim() ? (
                    <div className="relative group w-full h-44 sm:h-56 rounded-2xl overflow-hidden border border-gray-200 dark:border-white/10 shadow-sm bg-gray-50 dark:bg-slate-950/40">
                      <img
                        src={getOptimizedCoverUrl(coverImage.trim(), 600)}
                        alt="Cover Preview"
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-102"
                      />
                      {isEditable && (
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 sm:gap-3 p-2">
                          <motion.button
                            type="button"
                            onClick={() => coverFileInputRef.current?.click()}
                            whileHover={{ scale: 1.05, y: -1 }}
                            whileTap={{ scale: 0.94 }}
                            transition={{ type: "spring", stiffness: 400, damping: 25, mass: 0.5 }}
                            className="px-3.5 py-1.5 sm:px-4 sm:py-2 bg-white text-black text-xs font-semibold rounded-full hover:bg-neutral-100 shadow transition-colors flex items-center gap-1.5 cursor-pointer"
                          >
                            <Upload className="w-3.5 h-3.5" />
                            Replace Cover
                          </motion.button>
                          <motion.button
                            type="button"
                            onClick={async () => {
                              if (coverImage.includes('cloudinary.com')) {
                                try {
                                  await fetch('/api/uploads/delete', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ url: coverImage })
                                  });
                                } catch (err) {
                                  console.error('Failed to delete cover image:', err);
                                }
                              }
                              setCoverImage('');
                              setPrevCoverImage('');
                              await handleAutoSaveWithParams({ newCover: null });
                              showToast('Cover image removed.', 'info');
                            }}
                            whileHover={{ scale: 1.05, y: -1 }}
                            whileTap={{ scale: 0.94 }}
                            transition={{ type: "spring", stiffness: 400, damping: 25, mass: 0.5 }}
                            className="px-3.5 py-1.5 sm:px-4 sm:py-2 bg-red-600 text-white text-xs font-semibold rounded-full hover:bg-red-700 shadow transition-colors flex items-center gap-1.5 cursor-pointer"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            Remove
                          </motion.button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <motion.div
                      onClick={() => isEditable && coverFileInputRef.current?.click()}
                      onDragEnter={handleDrag}
                      onDragOver={handleDrag}
                      onDragLeave={handleDrag}
                      onDrop={handleDrop}
                      whileHover={isEditable ? { scale: 1.008, y: -1 } : undefined}
                      whileTap={isEditable ? { scale: 0.992 } : undefined}
                      transition={{ type: "spring", stiffness: 400, damping: 25, mass: 0.5 }}
                      className={`w-full h-36 sm:h-44 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center p-4 sm:p-6 transition-colors duration-300 text-center ${
                        dragActive 
                          ? 'border-black dark:border-white bg-black/5 dark:bg-white/5' 
                          : 'border-gray-300 dark:border-white/20 bg-white/5 hover:border-black dark:hover:border-white cursor-pointer hover:bg-black/5 dark:hover:bg-white/5'
                      }`}
                    >
                      {coverUploading ? (
                        <div className="flex flex-col items-center gap-2">
                          <div className="w-5 h-5 sm:w-6 sm:h-6 border-2 border-black dark:border-white border-t-transparent rounded-full animate-spin"></div>
                          <span className="text-xs text-gray-500 font-semibold">Uploading cover image...</span>
                        </div>
                      ) : (
                        <>
                          <div className="p-2.5 sm:p-3 bg-gray-100 dark:bg-white/5 rounded-full mb-2 sm:mb-3 text-gray-600 dark:text-gray-400">
                            <Upload className="w-4 h-4 sm:w-5 sm:h-5 stroke-1.5" />
                          </div>
                          <span className="text-xs font-semibold text-black dark:text-white mb-1">
                            {isEditable ? 'Upload Cover Image' : 'No Cover Image'}
                          </span>
                          <span className="text-[10px] text-gray-400">
                            {isEditable ? 'JPEG, PNG or WEBP up to 2MB (Recomended: 1200x630)' : 'Settings locked'}
                          </span>
                        </>
                      )}
                    </motion.div>
                  )}
                  
                  <input
                    type="file"
                    ref={coverFileInputRef}
                    className="hidden"
                    accept={ACCEPT_MAP.COVER}
                    onChange={handleFileInputChange}
                    disabled={!isEditable || coverUploading}
                  />
                </div>
                
                {!isEditable && pub?.status === 'PUBLISHED' && (
                  <p className="text-xs text-gray-500 italic mt-4 sm:mt-6">
                    🔒 Settings are locked for published documents.
                  </p>
                )}
                {isEditable && pub?.status === 'PUBLISHED' && (
                  <div className="mt-4 sm:mt-6 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2">
                    <Sparkles className="w-4 h-4 shrink-0" />
                    <span>Live Edit Mode · Changes save directly to the live publication.</span>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <article className="w-full">
          {/* Header */}
          <header className="mb-6 sm:mb-8">
            <div className="flex items-center gap-2 text-[10px] sm:text-xs uppercase tracking-wider font-semibold text-gray-500 mb-2 sm:mb-3">
              <span>{category}</span>
              <span>&middot;</span>
              <span>Editor Mode</span>
            </div>

            {/* Seamless Title Canvas */}
            <textarea
              ref={titleRef}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={() => handleAutoSave(pub.content)}
              disabled={!isEditable}
              placeholder="New Title"
              rows={1}
              className="w-full bg-transparent font-serif text-3xl xs:text-4xl sm:text-5xl md:text-6xl font-bold leading-[1.12] focus:outline-none resize-none overflow-hidden placeholder-gray-400 dark:placeholder-gray-600 transition-colors mb-4 sm:mb-6"
            />

            {/* Author Bio Row */}
            <div className="flex items-center justify-between py-3 sm:py-4 border-y border-gray-200/80 dark:border-white/10 mb-6 sm:mb-8">
              <div className="flex items-center gap-2.5 sm:gap-3">
                <img
                  src={
                    authorMode === 'ALUMNI' && selectedAlumnus
                      ? getAlumniAvatarUrl(selectedAlumnus.photo, authorName || selectedAlumnus.name, 80)
                      : authorMode === 'CUSTOM' && authorName
                      ? `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(authorName)}`
                      : session?.user?.image ? getOptimizedAvatarUrl(session.user.image, 80) : `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(session?.user?.name || 'User')}`
                  }
                  alt={authorMode === 'CUSTOM' ? (authorName || 'Author') : (session?.user?.name || 'User')}
                  onError={(e) => {
                    const fallbackName = authorMode === 'ALUMNI' && selectedAlumnus 
                      ? (authorName || selectedAlumnus.name) 
                      : (authorMode === 'CUSTOM' ? authorName : session?.user?.name) || 'User';
                    const fallback = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(fallbackName)}`;
                    if (e.currentTarget.src !== fallback) {
                      e.currentTarget.src = fallback;
                    }
                  }}
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover border border-gray-200 dark:border-neutral-700 shrink-0"
                />
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="block text-xs sm:text-sm font-semibold">
                      {authorMode === 'ALUMNI' && selectedAlumnus
                        ? (authorName || selectedAlumnus.name)
                        : authorMode === 'CUSTOM' && authorName
                        ? authorName
                        : session?.user?.name || 'User'}
                    </span>
                    {authorMode === 'ALUMNI' && selectedAlumnus && (
                      <span className="text-[9px] font-mono font-medium px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                        Alumni · Class of {selectedAlumnus.batch}
                      </span>
                    )}
                    {authorMode === 'CUSTOM' && authorNote && (
                      <span className="text-[9px] font-mono font-medium px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700">
                        {authorNote}
                      </span>
                    )}
                  </div>
                  <span className="block text-[10px] sm:text-[11px] opacity-70">
                    Draft Mode &middot; Not Published
                  </span>
                </div>
              </div>
            </div>

            {/* Cover Image Rendering */}
            {coverImage.trim() && (
              <img
                src={getOptimizedCoverUrl(coverImage.trim(), 1200)}
                alt="Cover"
                className="w-full h-48 xs:h-60 sm:h-80 object-cover rounded-xl sm:rounded-2xl border border-gray-200/60 dark:border-white/10 shadow-sm"
                onError={(e) => (e.currentTarget.style.display = 'none')}
              />
            )}
          </header>

          {/* The Distraction-Free Tiptap Editor */}
          <div className="mt-4 pb-32">
            <SimpleEditor
              initialContent={pub.content}
              onAutoSave={handleAutoSave}
              onSaveStatusChange={setSaveStatus}
              status={pub.status}
              editorStyle={editorStyle}
              onChange={(content) => { latestContentRef.current = content; }}
            />
          </div>
        </article>

      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isDeleting && setShowDeleteModal(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl max-w-md w-full p-6 shadow-2xl z-10"
            >
              <div className="flex items-center gap-3 text-red-600 dark:text-red-400 mb-3">
                <div className="p-2.5 rounded-full bg-red-100 dark:bg-red-950/60 border border-red-200 dark:border-red-800/60">
                  <Trash2 className="w-5 h-5" />
                </div>
                <h3 className="font-serif text-lg font-bold text-neutral-950 dark:text-neutral-50">
                  Delete Publication?
                </h3>
              </div>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed mb-6">
                Are you sure you want to delete <strong className="text-neutral-900 dark:text-neutral-100">"{pub.title || 'Untitled Draft'}"</strong>? This will permanently remove the publication, all reader comments, and interactions. This action cannot be undone.
              </p>
              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  disabled={isDeleting}
                  className="px-4 py-2 text-xs font-semibold rounded-full border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="px-5 py-2 text-xs font-semibold rounded-full bg-red-600 hover:bg-red-700 text-white shadow-sm flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Deleting…</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Permanently Delete</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating Toast Notification System */}
      <div className="fixed bottom-4 right-4 left-4 sm:left-auto sm:bottom-6 sm:right-6 z-50 flex flex-col gap-2.5 sm:gap-3 sm:max-w-sm pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.2 } }}
              className={`pointer-events-auto p-3.5 sm:p-4 rounded-xl shadow-lg border flex items-start gap-2.5 sm:gap-3 backdrop-blur-xl transition-all duration-300 ${
                toast.type === 'error'
                  ? 'bg-red-50/95 dark:bg-red-950/80 border-red-200 dark:border-red-500/30 text-red-800 dark:text-red-200'
                  : toast.type === 'success'
                  ? 'bg-emerald-50/95 dark:bg-emerald-950/80 border-emerald-200 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-200'
                  : 'bg-white/95 dark:bg-slate-900/90 border-gray-200 dark:border-white/10 text-slate-800 dark:text-slate-200'
              }`}
            >
              {toast.type === 'error' && <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 shrink-0 mt-0.5 text-red-500" />}
              {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 shrink-0 mt-0.5 text-emerald-500" />}
              {toast.type === 'info' && <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 shrink-0 mt-0.5 text-slate-500" />}
              
              <div className="flex-1 text-xs font-semibold pr-2 leading-relaxed">
                {toast.message}
              </div>
              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition shrink-0 cursor-pointer"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      {/* Cover Image Cropper Modal (Landscape 16:9) */}
      <ImageCropperModal
        isOpen={coverCropperOpen}
        imageSrc={coverCropSrc}
        aspectRatio={16 / 9}
        aspectPresetLabel="Landscape Cover (16:9)"
        allowRatioSelection={false}
        onCropComplete={handleCoverCropComplete}
        onCancel={() => {
          setCoverCropperOpen(false);
          setCoverCropSrc('');
          if (coverFileInputRef.current) coverFileInputRef.current.value = '';
        }}
      />
    </div>
  );
}
