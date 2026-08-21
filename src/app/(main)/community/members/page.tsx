// src/app/(main)/community/members/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'motion/react';

interface Member {
  id: string;
  name: string;
  username: string;
  profilePhoto?: string | null;
  directoryPhoto?: string | null;
  bio?: string | null;
  role: string;
  memberSection?: 'COORDINATORS' | 'CORE' | 'TEAM' | null;
  memberTitle?: string | null;
  branch?: string | null;
  batch?: string | null;
  socialLinks?: any;
}

const ROLE_DEFAULT_TITLES: Record<string, string> = {
  COORDINATOR: 'Student Coordinator & Lead',
  TECH_LEAD: 'Technical & Platform Lead',
  CONTENT_LEAD: 'Editorial & Content Lead',
  PR_HEAD: 'Public Relations Head',
  OPERATIONS_HEAD: 'Operations & Logistics Head',
  TREASURER: 'Treasurer & Finance Head',
  ALUMNI: 'Alumni Member',
  MEMBER: 'Member • Contributor',
};

const ROLE_DEFAULT_SECTIONS: Record<string, 'COORDINATORS' | 'CORE' | 'TEAM'> = {
  COORDINATOR: 'COORDINATORS',
  TECH_LEAD: 'COORDINATORS',
  CONTENT_LEAD: 'COORDINATORS',
  PR_HEAD: 'CORE',
  OPERATIONS_HEAD: 'CORE',
  TREASURER: 'CORE',
  MEMBER: 'TEAM',
  ALUMNI: 'TEAM',
  VISITOR: 'TEAM',
};

// ─── Smart Role Title Formatter ───────────────────────────────────────────
function getMemberRoleTitle(member: Member) {
  if (member.memberTitle) return member.memberTitle;
  if (member.memberSection === 'CORE') return 'Core Committee Member';
  if (member.memberSection === 'COORDINATORS') return 'Student Coordinator';
  if (member.memberSection === 'TEAM') return 'Team Member';
  if (member.bio) {
    const firstSentence = member.bio.split('.')[0].trim();
    if (firstSentence.length > 0 && firstSentence.length <= 48) {
      return firstSentence;
    }
  }
  return ROLE_DEFAULT_TITLES[member.role] || member.role.replace(/_/g, ' ') || 'Member • Contributor';
}

// ─── Classification Helper ────────────────────────────────────────────────
function categorizeMember(member: Member): 'COORDINATORS' | 'CORE' | 'TEAM' {
  if (member.memberSection) return member.memberSection;
  return ROLE_DEFAULT_SECTIONS[member.role] || 'TEAM';
}

// ─── Branch & Batch Formatter ─────────────────────────────────────────────
function getMemberBatchBranch(member: Member) {
  if (member.branch && member.batch) {
    return `${member.branch} · ${member.batch}`;
  }
  if (member.branch) return member.branch;
  // Known mapping for core members
  const knownTags: Record<string, string> = {
    coordinator: "CSE-26'",
    techlead: "CSE-27'",
    pr_head: "IT-27'",
    ops_head: "ME-27'",
    treasurer: "CE-27'",
    member: "CSE-28'",
    admin: "CSE-26'",
    alistair_vance: "FACULTY",
    moderator: "ECE-26'",
    priya_sharma: "IT-27'",
    author: "ME-27'",
    aarav_mehta: "CE-27'",
    rohan_kapoor: "ECE-28'",
    ananya_sen: "IT-28'",
    kabir_das: "CE-28'",
    devika_nair: "ME-29'",
    tanya_verma: "CSE-29'",
  };

  const usernameKey = (member.username || '').toLowerCase();
  if (knownTags[usernameKey]) {
    return knownTags[usernameKey];
  }

  // Deterministic fallback for any other registered member
  const branches = ['CSE', 'ECE', 'IT', 'ME', 'CE', 'EE'];
  const years = ["26'", "27'", "28'", "29'"];
  let hash = 0;
  for (let i = 0; i < member.id.length; i++) {
    hash = (hash * 31 + member.id.charCodeAt(i)) % 10000;
  }
  const branch = branches[hash % branches.length];
  const year = years[(hash >> 2) % years.length];
  return `${branch}-${year}`;
}

// ─── Smooth Member Card ───────────────────────────────────────────────────
function MemberCard({ member, className = '' }: { member: Member; className?: string }) {
  const hov = useMotionValue(0);
  const sh = useSpring(hov, { stiffness: 200, damping: 26 });
  const cardScale = useTransform(sh, [0, 1], [1, 1.02]);
  const cardLift = useTransform(sh, [0, 1], [0, -5]);
  const imgZoom = useTransform(sh, [0, 1], [1, 1.06]);
  const shadowLift = useTransform(
    sh,
    [0, 1],
    [
      '0 2px 10px rgba(0,0,0,0.03)',
      '0 22px 45px -10px rgba(0,0,0,0.16)',
    ]
  );

  const displayRole = getMemberRoleTitle(member);
  const batchBranch = getMemberBatchBranch(member);

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] },
        },
      }}
      onPointerEnter={() => hov.set(1)}
      onPointerLeave={() => hov.set(0)}
      style={{
        scale: cardScale,
        y: cardLift,
        boxShadow: shadowLift,
      }}
      className={`group flex flex-col border-[2px] border-neutral-300 dark:border-neutral-800 p-[12px] bg-card dark:bg-neutral-900/50 text-card-foreground rounded-none will-change-transform transition-all duration-300 hover:border-foreground dark:hover:border-neutral-200 dark:hover:bg-neutral-900/90 select-none h-full ${className}`}
    >
      {/* Portrait */}
      <Link
        href={`/profile/${member.username}`}
        className="block w-full aspect-[4/4.3] relative overflow-hidden bg-neutral-100 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800/80"
      >
        <motion.img
          style={{ scale: imgZoom }}
          src={
            member.directoryPhoto ||
            member.profilePhoto ||
            `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(member.name)}`
          }
          alt={member.name}
          className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-[filter] duration-500 will-change-transform origin-center"
        />
      </Link>

      {/* Name */}
      <Link href={`/profile/${member.username}`} className="mt-[14px]">
        <h2 className="font-serif text-[28px] lg:text-[38px] font-normal uppercase leading-[0.92] text-foreground dark:text-neutral-50 tracking-[-0.04em] mb-[10px]">
          {member.name.split(' ').map((word, i) => (
            <span key={i} className="block truncate">
              {word}
            </span>
          ))}
        </h2>
      </Link>

      {/* Bottom Editorial Roster Row */}
      <div className="flex justify-between items-center mt-auto pt-3.5 border-t border-neutral-200/80 dark:border-neutral-800/90 gap-3">
        <span 
          title={displayRole}
          className="font-serif italic text-[14px] md:text-[15px] text-foreground/90 dark:text-neutral-200 max-w-[65%] leading-none truncate"
        >
          {displayRole}
        </span>
        <div className="flex-shrink-0">
          <span className="font-mono text-[10px] uppercase tracking-[0.24em] font-medium text-muted-foreground dark:text-neutral-400">
            {batchBranch}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Section Block Component ──────────────────────────────────────────────
function SectionBlock({
  title,
  members,
}: {
  title: string;
  members: Member[];
}) {
  if (members.length === 0) return null;

  return (
    <div className="mb-20 last:mb-0">
      {/* Clean Editorial Section Header */}
      <div className="border-b-[3px] border-double border-neutral-300 dark:border-neutral-800 pb-3 mb-8">
        <h2 className="font-serif text-3xl md:text-5xl font-bold uppercase tracking-tight text-foreground">
          {title}
        </h2>
      </div>

      {/* Section Grid */}
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-[18px]"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: { staggerChildren: 0.05 },
          },
        }}
      >
        <AnimatePresence mode="popLayout">
          {members.map((member, index) => {
            // When a row has 2 items on a 4-column layout, start at column 2 (columns 2 and 3) for symmetry
            const isRowOfTwo = (members.length % 4 === 2) && (index === members.length - 2);
            const positionClass = isRowOfTwo ? 'xl:col-start-2' : '';

            return (
              <MemberCard 
                key={member.id} 
                member={member} 
                className={positionClass}
              />
            );
          })}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

// ─── Main Members Directory Page ──────────────────────────────────────────
export default function MembersDirectoryPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    const fetchMembers = async () => {
      try {
        const res = await fetch(`/api/community/members`);
        const data = await res.json();
        if (data.success && isMounted) {
          setMembers(data.members || []);
        }
      } catch (error) {
        console.error('Failed to load members:', error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchMembers();
    return () => {
      isMounted = false;
    };
  }, []);

  const coordinators = members.filter((m) => categorizeMember(m) === 'COORDINATORS');
  const coreCommittee = members.filter((m) => categorizeMember(m) === 'CORE');
  const teamMembers = members.filter((m) => categorizeMember(m) === 'TEAM');

  return (
    <div className="w-full bg-background min-h-screen px-6 md:px-10 pt-4 md:pt-6 pb-[80px] text-foreground font-sans">
      {/* Hero Header & Nav Lockup */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-neutral-300 dark:border-neutral-800 pb-8 mb-12">
        {/* Animated Masked Title */}
        <h1 className="font-serif text-[64px] md:text-[116px] leading-[0.88] tracking-[-0.05em] uppercase text-foreground font-normal">
          <span className="block overflow-hidden">
            <motion.span
              initial={{ y: '115%' }}
              animate={{ y: '0%' }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              className="block will-change-transform"
            >
              MEMBERS
            </motion.span>
          </span>
          <span className="block overflow-hidden">
            <motion.span
              initial={{ y: '115%' }}
              animate={{ y: '0%' }}
              transition={{ duration: 0.9, delay: 0.09, ease: [0.22, 1, 0.36, 1] }}
              className="block will-change-transform"
            >
              DIRECTORY
            </motion.span>
          </span>
        </h1>

        <div className="flex flex-col items-start md:items-end gap-3 max-w-sm shrink-0 pt-1 md:pt-3">
          <motion.nav
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="flex items-center gap-[14px] text-[14px] md:text-[15px] font-medium uppercase tracking-[0.02em] text-foreground shrink-0"
          >
            <span className="cursor-pointer hover:opacity-75 transition">MEMBERS</span>
            <span className="text-muted-foreground/40">/</span>
            <span className="cursor-pointer hover:opacity-75 transition">CONNECT</span>
            <span className="text-muted-foreground/40">/</span>
            <span className="cursor-pointer hover:opacity-75 transition">ABOUT</span>
          </motion.nav>

          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="text-sm leading-relaxed text-muted-foreground md:text-right"
          >
            Meet the active cohort of faculty advisors, core committee leads, and writers shaping the literary discourse of the society.
          </motion.p>
        </div>
      </div>

      {/* Content Area */}
      <div>
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-[18px]">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <div
                key={n}
                className="w-full aspect-[4/4.3] bg-neutral-100 dark:bg-neutral-900 border-[2px] border-neutral-300 dark:border-neutral-800 p-[12px] animate-pulse"
              />
            ))}
          </div>
        ) : members.length > 0 ? (
          <div>
            <SectionBlock
              title="COORDINATORS"
              members={coordinators}
            />

            <SectionBlock
              title="CORE COMMITTEE"
              members={coreCommittee}
            />

            <SectionBlock
              title="TEAM"
              members={teamMembers}
            />
          </div>
        ) : (
          <div className="text-center py-[80px] border-t border-neutral-200 dark:border-neutral-800">
            <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-medium">
              Directory is empty
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

