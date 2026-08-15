// src/app/(main)/community/members/page.tsx
'use client';

import { useState, useEffect } from 'react';
import FollowButton from '@/components/social/FollowButton';
import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';

interface Member {
  id: string;
  name: string;
  username: string;
  profilePhoto?: string | null;
  role: string;
}

export default function MembersDirectoryPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchMembers = async () => {
    try {
      const res = await fetch(`/api/community/members`);
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
    fetchMembers();
  }, []);

  return (
    <div className="w-full bg-[#FFFFFF] dark:bg-[#080808] min-h-screen px-10 pt-[18px] pb-[80px]">
      
      {/* Header */}
      <header className="h-[58px] flex justify-between items-start">
        <div className="font-sans font-bold tracking-wider text-xs uppercase text-[#111111] dark:text-white mt-1">
          EXCELSIOR
        </div>
        <nav className="flex items-center gap-[14px] text-[16px] font-medium uppercase tracking-[0.02em] text-[#111111] dark:text-white mt-1">
          <span className="cursor-pointer hover:opacity-75 transition">MEMBERS</span>
          <span className="text-gray-300 dark:text-neutral-700">/</span>
          <span className="cursor-pointer hover:opacity-75 transition">CONNECT</span>
          <span className="text-gray-300 dark:text-neutral-700">/</span>
          <span className="cursor-pointer hover:opacity-75 transition">ABOUT</span>
        </nav>
      </header>

      {/* Hero Heading */}
      <div className="mt-[4px]">
        <motion.h1 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="font-serif text-[64px] md:text-[116px] leading-[0.88] tracking-[-0.05em] uppercase text-[#111111] dark:text-white font-normal"
        >
          MEMBERS<br />DIRECTORY
        </motion.h1>
        
        {/* Subtitle */}
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-[18px] text-[15px] font-medium uppercase tracking-[0.02em] text-[#111111] dark:text-neutral-300"
        >
          FASHION COLLECTIVE / GLOBAL NETWORK
        </motion.p>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-[18px] mt-[34px]">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
            <div key={n} className="w-full aspect-[4/4.3] bg-[#ECECEC] dark:bg-neutral-900 border-[2px] border-[#333] dark:border-neutral-800 p-[12px] animate-pulse" />
          ))}
        </div>
      ) : members.length > 0 ? (
        
        /* Members Grid */
        <motion.div 
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-[18px] mt-[34px]"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: { staggerChildren: 0.05 }
            }
          }}
        >
          <AnimatePresence mode="popLayout">
            {members.map((member) => (
              <motion.div
                key={member.id}
                layout
                variants={{
                  hidden: { opacity: 0, y: 15 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } }
                }}
                className="group flex flex-col border-[2px] border-[#333] dark:border-neutral-800 p-[12px] bg-white dark:bg-black rounded-none shadow-none transform transition-all duration-[0.25s] ease-in-out hover:-translate-y-[3px] hover:border-black dark:hover:border-white"
              >
                {/* Portrait */}
                <Link 
                  href={`/profile/${member.username}`} 
                  className="block w-full aspect-[4/4.3] relative overflow-hidden bg-[#ECECEC] dark:bg-neutral-900 border border-[#2E2E2E] dark:border-neutral-800"
                >
                  <img 
                    src={member.profilePhoto || `https://api.dicebear.com/7.x/initials/svg?seed=${member.name}`} 
                    alt={member.name}
                    className="w-full h-full object-cover grayscale transition-transform duration-[1.2s] ease-[0.16,1,0.3,1] group-hover:scale-[1.02]" 
                  />
                </Link>

                {/* Name */}
                <Link href={`/profile/${member.username}`} className="mt-[14px]">
                  <h2 className="font-serif text-[32px] lg:text-[44px] font-normal uppercase leading-[0.92] text-[#111111] dark:text-white tracking-[-0.04em] mb-[10px]">
                    {member.name.split(' ').map((word, i) => (
                      <span key={i} className="block truncate">
                        {word}
                      </span>
                    ))}
                  </h2>
                </Link>
                
                {/* Bottom Row */}
                <div className="flex justify-between items-end mt-auto">
                  <span className="text-[15px] font-sans font-normal text-[#333] dark:text-neutral-400 max-w-[65%] leading-tight truncate">
                    {member.role}
                  </span>
                  <div className="flex-shrink-0">
                    <FollowButton targetUserId={member.id} variant="editorial" />
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      ) : (
        <div className="text-center py-[80px] border-t border-[#333] dark:border-neutral-800 mt-[34px]">
          <span className="text-xs uppercase tracking-[0.2em] text-gray-400 dark:text-neutral-600 font-medium">Directory is empty</span>
        </div>
      )}
    </div>
  );
}
