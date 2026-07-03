// src/app/(main)/community/members/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import FollowButton from '@/components/social/FollowButton';

interface Member {
  id: string;
  name: string;
  username: string;
  profilePhoto?: string | null;
  bio?: string | null;
  role: string;
  _count: {
    publications: number;
    followers: number;
  };
}

export default function MembersDirectoryPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [search, setSearch] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  const fetchMembers = async () => {
    try {
      const res = await fetch(`/api/community/members?search=${encodeURIComponent(search)}`);
      const data = await res.json();
      if (data.success) {
        setMembers(data.members);
      }
    } catch (error) {
      console.error('Failed to load members:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(fetchMembers, 300);
    return () => clearTimeout(delayDebounce);
  }, [search]);

  return (
    <div className="w-full">
      {/* Search Input */}
      <div className="mb-8 max-w-sm">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search members by name or username..."
          className="w-full bg-slate-900 border border-white/10 rounded-lg p-2.5 text-xs text-white outline-none focus:border-violet-600 transition"
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3].map(n => <div key={n} className="h-44 bg-slate-900/60 rounded-2xl" />)}
        </div>
      ) : members.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {members.map((member) => (
            <div
              key={member.id}
              className="bg-slate-900/30 border border-white/5 hover:border-white/10 p-5 rounded-2xl flex flex-col justify-between h-full shadow-lg transition duration-300"
            >
              <div>
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={member.profilePhoto || `https://api.dicebear.com/7.x/adventurer/svg?seed=${member.username}`}
                      alt={member.name}
                      className="w-12 h-12 object-cover rounded-full border border-white/10"
                    />
                    <div className="min-w-0">
                      <Link href={`/profile/${member.username}`} className="block text-sm font-semibold text-white truncate hover:text-cyan-400 transition">
                        {member.name}
                      </Link>
                      <span className="block text-[10px] text-gray-500">@{member.username}</span>
                    </div>
                  </div>
                  <span className="text-[8px] font-bold bg-violet-600/25 border border-violet-500/30 text-cyan-400 px-2 py-0.5 rounded uppercase">
                    {member.role.toLowerCase()}
                  </span>
                </div>

                {/* Bio */}
                <p className="text-xs text-gray-400 line-clamp-3 mb-4 leading-relaxed italic">
                  "{member.bio || 'Co-authoring the history of Excelsior.'}"
                </p>
              </div>

              {/* Stats & Actions */}
              <div className="pt-4 border-t border-white/5 flex items-center justify-between mt-auto">
                <div className="flex gap-4">
                  <div className="text-center">
                    <span className="block text-xs font-bold text-white">{member._count.publications}</span>
                    <span className="block text-[9px] text-gray-600 uppercase tracking-wide">Posts</span>
                  </div>
                  <div className="text-center">
                    <span className="block text-xs font-bold text-white">{member._count.followers}</span>
                    <span className="block text-[9px] text-gray-600 uppercase tracking-wide">Followers</span>
                  </div>
                </div>
                
                <FollowButton targetUserId={member.id} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-slate-900/10 border border-white/5 rounded-2xl text-gray-500 italic">
          No members matched your search.
        </div>
      )}
    </div>
  );
}
