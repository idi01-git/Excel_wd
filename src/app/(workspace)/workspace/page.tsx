// src/app/(workspace)/workspace/page.tsx
'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Publication {
  id: string;
  title: string;
  slug: string;
  category: string;
  status: string;
  updatedAt: string;
  rejectionNote?: string | null;
}

export default function WorkspaceDashboardPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [pubs, setPubs] = useState<Publication[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>('DRAFT');

  const fetchWorkspaceItems = async () => {
    try {
      const res = await fetch('/api/workspace/drafts');
      const data = await res.json();
      if (data.success) {
        setPubs(data.publications);
      }
    } catch (error) {
      console.error('Failed to load workspace items:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkspaceItems();
  }, []);

  const handleCreateDraft = async () => {
    try {
      const res = await fetch('/api/workspace/drafts', {
        method: 'POST'
      });
      const data = await res.json();
      if (data.success) {
        router.push(`/workspace/editor/${data.id}`);
      }
    } catch (error) {
      console.error('Failed to create draft:', error);
    }
  };

  if (loading) {
    return (
      <div className="py-12 animate-pulse">
        <div className="h-8 bg-slate-900/60 rounded w-1/4 mb-4"></div>
        <div className="h-4 bg-slate-900/60 rounded w-1/2 mb-10"></div>
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map(n => <div key={n} className="h-20 bg-slate-900/60 rounded-xl" />)}
        </div>
      </div>
    );
  }

  const drafts = pubs.filter(p => p.status === 'DRAFT');
  const pending = pubs.filter(p => p.status === 'PENDING');
  const published = pubs.filter(p => p.status === 'PUBLISHED');
  const rejected = pubs.filter(p => p.status === 'REJECTED');

  const getActiveList = () => {
    if (activeTab === 'DRAFT') return drafts;
    if (activeTab === 'PENDING') return pending;
    if (activeTab === 'PUBLISHED') return published;
    return rejected;
  };

  const activeList = getActiveList();

  return (
    <div className="w-full py-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 border-b border-white/5 pb-6">
        <div>
          <h1 className="font-serif text-3xl text-white font-bold mb-1">Writer Workspace</h1>
          <p className="text-gray-400 text-sm">Draft new pieces, review editor notes, and submit creations for review.</p>
        </div>
        <button
          onClick={handleCreateDraft}
          className="py-2.5 px-6 bg-gradient-to-r from-violet-600 to-indigo-600 hover:shadow-lg hover:shadow-indigo-500/20 text-white text-sm font-semibold rounded-full transition"
        >
           Write New Piece
        </button>
      </div>

      {/* Analytics stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-5 text-center shadow">
          <span className="block text-2xl font-bold text-white mb-0.5">{pubs.length}</span>
          <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">Total Submissions</span>
        </div>
        <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-5 text-center shadow">
          <span className="block text-2xl font-bold text-emerald-400 mb-0.5">{published.length}</span>
          <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">Published Works</span>
        </div>
        <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-5 text-center shadow">
          <span className="block text-2xl font-bold text-cyan-400 mb-0.5">{pending.length}</span>
          <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">Awaiting Review</span>
        </div>
        <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-5 text-center shadow">
          <span className="block text-2xl font-bold text-red-400 mb-0.5">{rejected.length}</span>
          <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">Revision Requests</span>
        </div>
      </div>

      {/* Workspace Tabs */}
      <div className="flex gap-2 border-b border-white/5 pb-3 mb-6">
        <button
          onClick={() => setActiveTab('DRAFT')}
          className={`py-1.5 px-4 text-sm font-semibold border-b-2 transition ${
            activeTab === 'DRAFT'
              ? 'text-white border-violet-500'
              : 'text-gray-500 border-transparent hover:text-gray-300'
          }`}
        >
          Drafts ({drafts.length})
        </button>
        <button
          onClick={() => setActiveTab('PENDING')}
          className={`py-1.5 px-4 text-sm font-semibold border-b-2 transition ${
            activeTab === 'PENDING'
              ? 'text-white border-violet-500'
              : 'text-gray-500 border-transparent hover:text-gray-300'
          }`}
        >
          Pending Review ({pending.length})
        </button>
        <button
          onClick={() => setActiveTab('PUBLISHED')}
          className={`py-1.5 px-4 text-sm font-semibold border-b-2 transition ${
            activeTab === 'PUBLISHED'
              ? 'text-white border-violet-500'
              : 'text-gray-500 border-transparent hover:text-gray-300'
          }`}
        >
          Published ({published.length})
        </button>
        <button
          onClick={() => setActiveTab('REJECTED')}
          className={`py-1.5 px-4 text-sm font-semibold border-b-2 transition ${
            activeTab === 'REJECTED'
              ? 'text-white border-violet-500'
              : 'text-gray-500 border-transparent hover:text-gray-300'
          }`}
        >
          Revision Requests ({rejected.length})
        </button>
      </div>

      {/* Tab contents list */}
      <div className="bg-slate-900/10 border border-white/5 rounded-2xl overflow-hidden shadow-xl">
        {activeList.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-950/40 border-b border-white/5 text-left text-xs text-gray-500 uppercase font-semibold tracking-wider">
                  <th className="p-4 pl-6">Title</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Last Updated</th>
                  <th className="p-4 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm text-gray-300">
                {activeList.map((p) => (
                  <tr key={p.id} className="hover:bg-white/2 transition duration-200">
                    <td className="p-4 pl-6">
                      <div className="flex flex-col">
                        <span className="font-semibold text-white">{p.title}</span>
                        {p.status === 'REJECTED' && p.rejectionNote && (
                          <span className="text-xs text-yellow-400/80 mt-1 bg-yellow-400/5 border border-yellow-400/10 rounded px-2.5 py-1 inline-block max-w-lg">
                            ️ Editorial Note: "{p.rejectionNote}"
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 capitalize">{p.category.toLowerCase()}</td>
                    <td className="p-4 text-gray-500">
                      {new Date(p.updatedAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </td>
                    <td className="p-4 pr-6 text-right">
                      {p.status === 'PUBLISHED' ? (
                        <Link
                          href={`/publications/${p.slug}`}
                          className="py-1 px-4 border border-violet-500 text-violet-400 rounded-full hover:bg-violet-600 hover:text-white transition text-xs font-semibold"
                        >
                          View Live
                        </Link>
                      ) : (
                        <Link
                          href={`/workspace/editor/${p.id}`}
                          className="py-1 px-4 bg-white/5 border border-white/10 text-white rounded-full hover:bg-violet-600 hover:border-violet-500 transition text-xs font-semibold"
                        >
                          Edit Draft
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-gray-500 italic">
            No submissions in this category. Click write above to start drafting!
          </div>
        )}
      </div>
    </div>
  );
}
