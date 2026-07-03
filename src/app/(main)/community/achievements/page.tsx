// src/app/(main)/community/achievements/page.tsx
'use client';

import { useState, useEffect } from 'react';

interface Achievement {
  id: string;
  title: string;
  description: string;
  category: 'COMPETITION' | 'PUBLICATION' | 'AWARD' | 'MILESTONE';
  date: string;
}

export default function AchievementsPage() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchAchievements = async () => {
      try {
        const res = await fetch('/api/community/achievements');
        const data = await res.json();
        if (data.success) {
          setAchievements(data.achievements);
        }
      } catch (error) {
        console.error('Failed to load achievements:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAchievements();
  }, []);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'AWARD':
        return '🏆';
      case 'COMPETITION':
        return '🥇';
      case 'PUBLICATION':
        return '📰';
      case 'MILESTONE':
        return '';
      default:
        return '🎉';
    }
  };

  if (loading) {
    return (
      <div className="max-w-xl mx-auto py-12 animate-pulse space-y-6">
        {[1, 2].map(n => <div key={n} className="h-32 bg-slate-900/60 rounded-2xl" />)}
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto py-4">
      {achievements.length > 0 ? (
        <div className="relative border-l border-white/10 pl-6 ml-4 space-y-10">
          {achievements.map((ach) => (
            <div key={ach.id} className="relative group">
              {/* Timeline marker node */}
              <span className="absolute -left-10 top-1.5 flex h-7.5 w-7.5 items-center justify-center rounded-full bg-slate-950 border border-white/20 text-xs shadow group-hover:border-violet-500 transition duration-300">
                {getCategoryIcon(ach.category)}
              </span>

              {/* Achievement Card */}
              <div className="bg-slate-900/30 border border-white/5 hover:border-white/10 p-5 rounded-2xl transition duration-300 shadow-md">
                <div className="flex justify-between items-start gap-4 mb-2">
                  <h3 className="text-base font-bold text-white font-serif group-hover:text-cyan-400 transition">
                    {ach.title}
                  </h3>
                  <span className="text-[10px] text-gray-500 font-bold self-start mt-0.5">
                    {new Date(ach.date).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short'
                    })}
                  </span>
                </div>
                
                <p className="text-xs text-gray-400 leading-relaxed font-sans">
                  {ach.description}
                </p>

                <span className="inline-block mt-3 text-[9px] font-bold text-violet-400 uppercase bg-violet-600/10 px-2.5 py-0.5 border border-violet-500/20 rounded-full tracking-wider">
                  {ach.category.toLowerCase()}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-slate-900/10 border border-white/5 rounded-2xl text-gray-500 italic">
          No achievements recorded yet.
        </div>
      )}
    </div>
  );
}
