// src/app/(workspace)/workspace/editor/[id]/page.tsx
'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'motion/react';
import { SimpleEditor } from '@/components/tiptap-templates/simple/simple-editor';
import { Settings, ArrowLeft, Send, XCircle, AlertCircle } from 'lucide-react';

interface Publication {
  id: string;
  title: string;
  coverImage?: string | null;
  category: string;
  tags: string[];
  status: string;
  content: any;
  rejectionNote?: string | null;
}

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
  const [category, setCategory] = useState<string>('STORY');
  const [tagsInput, setTagsInput] = useState<string>('');
  
  const titleRef = useRef<HTMLTextAreaElement>(null);

  const fetchPublication = async () => {
    try {
      const res = await fetch(`/api/workspace/editor/${id}`);
      const data = await res.json();
      if (data.success) {
        setPub(data.publication);
        setTitle(data.publication.title);
        setCoverImage(data.publication.coverImage || '');
        setCategory(data.publication.category);
        setTagsInput(data.publication.tags.join(', '));
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
  
  // Auto-resize title textarea
  useEffect(() => {
    if (titleRef.current) {
      titleRef.current.style.height = 'auto';
      titleRef.current.style.height = titleRef.current.scrollHeight + 'px';
    }
  }, [title]);

  const handleAutoSave = async (updatedContent: any) => {
    // Converts comma tags to clean trimmed string array
    const tags = tagsInput
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);

    const payload = {
      title,
      coverImage: coverImage.trim() || null,
      category,
      tags,
      content: updatedContent
    };

    const res = await fetch(`/api/workspace/editor/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    const data = await res.json();
    if (!data.success) {
      throw new Error(data.error || 'Failed to save');
    }
  };

  const handleStatusChange = async (action: 'SUBMIT' | 'WITHDRAW' | 'RESUBMIT') => {
    setSaving(true);
    try {
      const res = await fetch(`/api/workspace/editor/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      const data = await res.json();
      if (data.success) {
        alert(
          action === 'SUBMIT' || action === 'RESUBMIT'
            ? 'Submission submitted successfully! Awaiting review.'
            : 'Submission withdrawn.'
        );
        router.push('/workspace');
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error('Failed to change status:', error);
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

  const isEditable = pub.status === 'DRAFT' || pub.status === 'REJECTED';

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-500 theme-${editorStyle}`}>
      {/* Sticky Navigation Header */}
      <div className="sticky top-0 z-40 bg-white/90 dark:bg-black/80 backdrop-blur-xl border-b border-gray-200 dark:border-white/10 px-4 md:px-6 py-3 flex items-center justify-between">
        
        {/* Left Side: Back, Status, Save State */}
        <div className="flex items-center gap-4 md:gap-6">
          <Link href="/workspace" className="text-sm font-semibold text-gray-500 hover:text-black dark:hover:text-white transition flex items-center gap-1.5">
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back</span>
          </Link>
          
          <div className="hidden sm:block h-4 w-px bg-gray-300 dark:bg-white/20"></div>
          
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
            <span className={`text-[10px] px-2 py-0.5 border rounded-full font-bold uppercase tracking-widest ${
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
            <span className="text-xs text-gray-400 font-medium">
              {saveStatus}
            </span>
          </div>
        </div>

        {/* Right Side: Settings & Actions */}
        <div className="flex items-center gap-2 md:gap-4">
          <button 
            onClick={() => setShowSettings(!showSettings)} 
            className={`p-2 rounded-full transition flex items-center gap-2 text-sm font-medium ${showSettings ? 'bg-gray-100 dark:bg-white/10 text-black dark:text-white' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-black dark:hover:text-white'}`}
          >
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">Settings</span>
          </button>

          {pub.status === 'PENDING' && (
            <button
              onClick={() => handleStatusChange('WITHDRAW')}
              disabled={saving}
              className="py-2 px-5 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-black dark:text-white text-xs font-semibold rounded-full border border-gray-200 dark:border-white/5 transition flex items-center gap-1.5"
            >
              <XCircle className="w-3.5 h-3.5" />
              Withdraw
            </button>
          )}

          {pub.status === 'DRAFT' && (
            <button
              onClick={() => handleStatusChange('SUBMIT')}
              disabled={saving}
              className="py-2 px-6 bg-black dark:bg-white hover:bg-gray-900 dark:hover:bg-neutral-100 text-white dark:text-black text-xs font-semibold rounded-full transition-all duration-200 shadow-sm flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              Submit
            </button>
          )}

          {pub.status === 'REJECTED' && (
            <button
              onClick={() => handleStatusChange('RESUBMIT')}
              disabled={saving}
              className="py-2 px-6 bg-black dark:bg-white hover:bg-gray-900 dark:hover:bg-neutral-100 text-white dark:text-black text-xs font-semibold rounded-full transition-all duration-200 shadow-sm flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              Resubmit
            </button>
          )}
        </div>
      </div>

      {/* Main Distraction-Free Canvas */}
      <div className="flex-1 w-full max-w-3xl mx-auto py-8 md:py-16 px-6">
        
        {/* Editor Revision Note */}
        {pub.status === 'REJECTED' && pub.rejectionNote && (
          <div className="mb-8 p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-500/20 rounded-xl text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <strong className="text-red-600 dark:text-red-400 block mb-1">Editor Revision Requested</strong>
              <span className="text-gray-700 dark:text-gray-300">"{pub.rejectionNote}"</span>
            </div>
          </div>
        )}

        {/* Publication Settings Drawer (Animated) */}
        <AnimatePresence>
          {showSettings && (
            <motion.div 
              initial={{ height: 0, opacity: 0, y: -10 }}
              animate={{ height: 'auto', opacity: 1, y: 0 }}
              exit={{ height: 0, opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="mb-12 overflow-hidden"
            >
              <div className="p-6 bg-gray-50 dark:bg-slate-900/40 border border-gray-200 dark:border-white/10 rounded-2xl shadow-sm">
                <h3 className="text-sm font-bold text-black dark:text-white mb-6 uppercase tracking-wider">Publication Settings</h3>
                
                {/* Style Selector */}
                <div className="mb-6 border-b border-gray-200 dark:border-white/10 pb-6">
                  <label className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold mb-3 block">Writing Style Theme</label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {/* Option 1: Broadsheet */}
                    <button
                      onClick={() => changeEditorStyle('broadsheet')}
                      className={`p-4 rounded-xl border text-left transition-all duration-200 flex flex-col justify-between h-28 ${
                        editorStyle === 'broadsheet'
                          ? 'border-black dark:border-white bg-black/5 dark:bg-white/5 text-black dark:text-white ring-1 ring-black dark:ring-white'
                          : 'border-gray-200 dark:border-white/10 text-gray-500 hover:border-gray-300 dark:hover:border-white/20'
                      }`}
                    >
                      <span className="text-xs font-bold font-serif">Broadsheet</span>
                      <span className="text-[10px] opacity-80 leading-snug">High contrast, sharp borders, structured newsroom aesthetic.</span>
                    </button>

                    {/* Option 2: Minimal */}
                    <button
                      onClick={() => changeEditorStyle('minimal')}
                      className={`p-4 rounded-xl border text-left transition-all duration-200 flex flex-col justify-between h-28 ${
                        editorStyle === 'minimal'
                          ? 'border-black dark:border-white bg-black/5 dark:bg-white/5 text-black dark:text-white ring-1 ring-black dark:ring-white'
                          : 'border-gray-200 dark:border-white/10 text-gray-500 hover:border-gray-300 dark:hover:border-white/20'
                      }`}
                    >
                      <span className="text-xs font-bold font-sans">Minimal Canvas</span>
                      <span className="text-[10px] opacity-80 leading-snug">Borderless, transparent background, pure focus layout.</span>
                    </button>

                    {/* Option 3: Scholar */}
                    <button
                      onClick={() => changeEditorStyle('scholar')}
                      className={`p-4 rounded-xl border text-left transition-all duration-200 flex flex-col justify-between h-28 ${
                        editorStyle === 'scholar'
                          ? 'border-black dark:border-white bg-black/5 dark:bg-white/5 text-black dark:text-white ring-1 ring-black dark:ring-white'
                          : 'border-gray-200 dark:border-white/10 text-gray-500 hover:border-gray-300 dark:hover:border-white/20'
                      }`}
                    >
                      <span className="text-xs font-bold font-serif text-[#2c221a] dark:text-[#e3ded5]">Cozy Scholar</span>
                      <span className="text-[10px] opacity-80 leading-snug text-[#2c221a] dark:text-[#e3ded5]">Warm sepia & slate backgrounds, reading-optimized.</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex flex-col">
                    <label className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold mb-2">Category</label>
                    <select
                      value={category}
                      onChange={(e) => {
                        setCategory(e.target.value);
                        handleAutoSave(pub.content);
                      }}
                      disabled={!isEditable}
                      className="bg-white dark:bg-slate-950/40 border border-gray-200 dark:border-white/10 text-black dark:text-white rounded-lg p-2.5 outline-none focus:border-gray-400 transition text-sm font-medium"
                    >
                      <option value="STORY">Story (Fiction)</option>
                      <option value="ARTICLE">Article (Essay/Research)</option>
                      <option value="POEM">Poem (Verse)</option>
                      <option value="REVIEW">Book Review</option>
                    </select>
                  </div>

                  <div className="flex flex-col">
                    <label className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold mb-2">Tags (comma separated)</label>
                    <input
                      type="text"
                      value={tagsInput}
                      onChange={(e) => setTagsInput(e.target.value)}
                      onBlur={() => handleAutoSave(pub.content)}
                      disabled={!isEditable}
                      placeholder="e.g. Memory, Noir, Calvino"
                      className="bg-white dark:bg-slate-950/40 border border-gray-200 dark:border-white/10 text-black dark:text-white rounded-lg p-2.5 outline-none focus:border-gray-400 transition text-sm"
                    />
                  </div>

                  <div className="flex flex-col md:col-span-2">
                    <label className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold mb-2">Cover Image URL</label>
                    <input
                      type="text"
                      value={coverImage}
                      onChange={(e) => setCoverImage(e.target.value)}
                      onBlur={() => handleAutoSave(pub.content)}
                      disabled={!isEditable}
                      placeholder="Paste image link from Unsplash..."
                      className="bg-white dark:bg-slate-950/40 border border-gray-200 dark:border-white/10 text-black dark:text-white rounded-lg p-2.5 outline-none focus:border-gray-400 transition text-sm"
                    />
                  </div>
                </div>
                
                {!isEditable && pub.status !== 'PENDING' && (
                  <p className="text-xs text-gray-500 italic mt-6">
                    🔒 Settings are locked for published documents.
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <article className="w-full">
          {/* Header */}
          <header className="mb-8">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider font-semibold text-gray-500 mb-3">
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
              className="w-full bg-transparent font-serif text-4xl md:text-5xl lg:text-6xl font-bold leading-tight focus:outline-none resize-none overflow-hidden placeholder-gray-400 dark:placeholder-gray-600 transition-colors mb-6"
            />

            {/* Author Bio Row */}
            <div className="flex items-center justify-between py-4 border-y border-gray-200/80 dark:border-white/10 mb-8">
              <div className="flex items-center gap-3">
                <img
                  src={session?.user?.image || `https://api.dicebear.com/7.x/initials/svg?seed=${session?.user?.name || 'User'}`}
                  alt={session?.user?.name || 'User'}
                  className="w-10 h-10 rounded-full object-cover border border-gray-200"
                />
                <div>
                  <span className="block text-sm font-semibold">{session?.user?.name || 'User'}</span>
                  <span className="block text-[11px] opacity-70">
                    Draft Mode &middot; Not Published
                  </span>
                </div>
              </div>
            </div>

            {/* Cover Image Rendering */}
            {coverImage.trim() && (
              <img
                src={coverImage.trim()}
                alt="Cover"
                className="w-full h-80 object-cover rounded-2xl border border-gray-200/60 dark:border-white/10 shadow-sm"
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
            />
          </div>
        </article>

      </div>
    </div>
  );
}
