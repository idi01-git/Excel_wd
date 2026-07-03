// src/app/(workspace)/workspace/editor/[id]/page.tsx
'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import TipTapEditor from '@/components/workspace/TipTapEditor';

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

  // Form Fields
  const [title, setTitle] = useState<string>('');
  const [coverImage, setCoverImage] = useState<string>('');
  const [category, setCategory] = useState<string>('STORY');
  const [tagsInput, setTagsInput] = useState<string>('');

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
      <div className="max-w-4xl mx-auto py-12 animate-pulse">
        <div className="h-6 bg-slate-900/60 rounded w-1/4 mb-10"></div>
        <div className="h-12 bg-slate-900/60 rounded mb-4"></div>
        <div className="h-96 bg-slate-900/60 rounded"></div>
      </div>
    );
  }

  const isEditable = pub.status === 'DRAFT' || pub.status === 'REJECTED';

  return (
    <div className="max-w-4xl mx-auto py-4">
      {/* Navigation Header */}
      <div className="flex justify-between items-center mb-6">
        <Link href="/workspace" className="text-sm font-semibold text-gray-500 hover:text-white transition">
          &larr; Back to Workspace
        </Link>
        <span className={`text-xs px-3 py-1 border rounded-full font-bold uppercase ${
          pub.status === 'PUBLISHED'
            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
            : pub.status === 'PENDING'
            ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
            : pub.status === 'REJECTED'
            ? 'bg-red-500/10 text-red-400 border-red-500/30'
            : 'bg-gray-500/10 text-gray-400 border-white/10'
        }`}>
          Status: {pub.status}
        </span>
      </div>

      {pub.status === 'REJECTED' && pub.rejectionNote && (
        <div className="mb-6 p-4 bg-red-950/20 border border-red-500/20 rounded-xl text-sm">
          <strong className="text-red-400 block mb-1">️ Editor Revision Requested</strong>
          <span className="text-gray-300">"{pub.rejectionNote}"</span>
        </div>
      )}

      {/* Editor Main Content Wrapper */}
      <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-6 shadow-2xl space-y-6">
        {/* Title Input */}
        <div className="form-group">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={!isEditable}
            placeholder="Title of your work"
            className="w-full bg-transparent text-white font-serif text-3xl font-bold border-b border-white/10 pb-2 focus:outline-none focus:border-violet-600 outline-none transition"
          />
        </div>

        {/* Metadata section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex flex-col">
            <label className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold mb-2">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              disabled={!isEditable}
              className="bg-slate-950/40 border border-white/10 text-white rounded-lg p-2.5 outline-none focus:border-violet-600 transition text-sm font-semibold"
            >
              <option value="STORY">Story (Fiction)</option>
              <option value="ARTICLE">Article (Essay/Research)</option>
              <option value="POEM">Poem (Verse)</option>
              <option value="REVIEW">Book Review</option>
            </select>
          </div>

          <div className="flex flex-col md:col-span-2">
            <label className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold mb-2">Tags (comma separated)</label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              disabled={!isEditable}
              placeholder="e.g. Memory, Noir, Calvino"
              className="bg-slate-950/40 border border-white/10 text-white rounded-lg p-2.5 outline-none focus:border-violet-600 transition text-sm"
            />
          </div>
        </div>

        <div className="flex flex-col">
          <label className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold mb-2">Cover Image URL</label>
          <input
            type="text"
            value={coverImage}
            onChange={(e) => setCoverImage(e.target.value)}
            disabled={!isEditable}
            placeholder="Paste image link from Unsplash..."
            className="bg-slate-950/40 border border-white/10 text-white rounded-lg p-2.5 outline-none focus:border-violet-600 transition text-sm"
          />
          {coverImage.trim() && (
            <img
              src={coverImage.trim()}
              alt="Cover preview"
              className="mt-3 max-h-40 w-full object-cover rounded-xl border border-white/10"
              onError={(e) => (e.currentTarget.style.display = 'none')}
            />
          )}
        </div>

        {/* TipTap Rich Editor */}
        <div className="pt-4">
          <TipTapEditor
            initialContent={pub.content}
            onAutoSave={handleAutoSave}
            status={pub.status}
          />
        </div>

        {/* Action Controls */}
        <div className="flex justify-end gap-3 pt-6 border-t border-white/10">
          {pub.status === 'PENDING' && (
            <button
              onClick={() => handleStatusChange('WITHDRAW')}
              disabled={saving}
              className="py-2 px-6 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-full border border-white/5 transition"
            >
              Withdraw Submission
            </button>
          )}

          {pub.status === 'DRAFT' && (
            <button
              onClick={() => handleStatusChange('SUBMIT')}
              disabled={saving}
              className="py-2 px-6 bg-gradient-to-r from-violet-600 to-indigo-600 hover:shadow-lg hover:shadow-indigo-500/20 text-white text-xs font-semibold rounded-full transition"
            >
              Submit for Review
            </button>
          )}

          {pub.status === 'REJECTED' && (
            <button
              onClick={() => handleStatusChange('RESUBMIT')}
              disabled={saving}
              className="py-2 px-6 bg-gradient-to-r from-violet-600 to-indigo-600 hover:shadow-lg hover:shadow-indigo-500/20 text-white text-xs font-semibold rounded-full transition"
            >
              Resubmit with Revisions
            </button>
          )}

          {!isEditable && pub.status !== 'PENDING' && (
            <span className="text-xs text-gray-500 italic flex items-center">
              🔒 Locked: Published pages cannot be modified online.
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
