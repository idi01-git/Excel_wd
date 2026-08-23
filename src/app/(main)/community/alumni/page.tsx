// src/app/(main)/community/alumni/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'motion/react';
import {
  Search,
  Lock,
  BookOpen,
  X,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Mail,
  Phone,
  ArrowUpRight,
  Globe,
} from 'lucide-react';
import { getOptimizedAvatarUrl } from '@/lib/image-optimization';

// ─── Universal Social Media Icon Renderer ──────────────────────────────────
export function SocialIcon({
  platform,
  size = 18,
  className = '',
}: {
  platform: string;
  size?: number;
  className?: string;
}) {
  const p = platform.toLowerCase().trim();

  switch (p) {
    case 'instagram':
    case 'insta':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
        >
          <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
          <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
        </svg>
      );
    case 'linkedin':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
        >
          <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
          <rect width="4" height="12" x="2" y="9" />
          <circle cx="4" cy="4" r="2" />
        </svg>
      );
    case 'x':
    case 'twitter':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
        >
          <path d="M4 4l11.733 16h4.267l-11.733 -16z" />
          <path d="M4 20l6.768 -6.768m2.46 -2.46l6.772 -6.772" />
        </svg>
      );
    case 'facebook':
    case 'fb':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
        >
          <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
        </svg>
      );
    case 'discord':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
        >
          <path d="M18 6h0a14.5 14.5 0 0 0-4-1.5 9.8 9.8 0 0 0-.5 1.5 13.9 13.9 0 0 0-5 0 9.8 9.8 0 0 0-.5-1.5A14.5 14.5 0 0 0 4 6c-2.6 4-2.8 8-2 12a14.8 14.8 0 0 0 5 2.5c.6-.8 1.1-1.6 1.5-2.5a9.7 9.7 0 0 1-2.5-1.2c.2-.2.4-.3.6-.5a10.6 10.6 0 0 0 10.8 0c.2.2.4.3.6.5a9.7 9.7 0 0 1-2.5 1.2c.4.9.9 1.7 1.5 2.5a14.8 14.8 0 0 0 5-2.5c.8-4 .6-8-2-12z" />
          <circle cx="8.5" cy="12.5" r="1.5" />
          <circle cx="15.5" cy="12.5" r="1.5" />
        </svg>
      );
    case 'github':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
        >
          <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
          <path d="M9 18c-4.51 2-5-2-7-2" />
        </svg>
      );
    case 'youtube':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
        >
          <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
          <path d="m10 15 5-3-5-3z" />
        </svg>
      );
    case 'email':
    case 'mail':
      return <Mail size={size} strokeWidth={1.75} className={className} />;
    case 'phone':
    case 'tel':
      return <Phone size={size} strokeWidth={1.75} className={className} />;
    default:
      return <Globe size={size} strokeWidth={1.75} className={className} />;
  }
}

interface Alumnus {
  id: string;
  name: string;
  photo?: string | null;
  batch: string;
  branch: string;
  currentPosition?: string | null;
  excelsiorPosition?: string | null;
  message?: string | null;
  instagram?: string | null;
  linkedin?: string | null;
  email?: string | null;
  phone?: string | null;
  userId?: string | null;
  user?: {
    id: string;
    username: string;
    role?: string;
  } | null;
  isContactRestricted: boolean;
  isSocialRestricted?: boolean;
  showSocialsToTeam?: boolean;
}

const formatShortBranch = (branch?: string | null): string => {
  if (!branch || branch === 'null' || branch === 'undefined') return 'EE';
  const clean = branch.trim();

  // 1. Check parenthesized acronym like "Electronics ... (ECE)"
  const parenMatch = clean.match(/\(([^)]+)\)/);
  if (parenMatch && parenMatch[1]) {
    return parenMatch[1].toUpperCase().trim();
  }

  // 2. Normalize known branch full names to short codes
  const lower = clean.toLowerCase();
  if (lower.includes('information tech') || lower === 'it') return 'IT';
  if (lower.includes('computer science') || lower.includes('cse')) {
    if (lower.includes('sf')) return 'CSE-SF';
    if (lower.includes('ai')) return 'CSE-AI';
    if (lower.includes('regular') || lower.includes('cse-r')) return 'CSE-R';
    return 'CSE';
  }
  if (lower.includes('electronics') || lower === 'ece') return 'ECE';
  if (lower.includes('electrical') || lower === 'ee') return 'EE';
  if (lower.includes('mechanical') || lower === 'me') return 'ME';
  if (lower.includes('civil') || lower === 'ce') return 'CE';
  if (lower.includes('chemical') || lower === 'che') return 'CHE';
  if (lower.includes('computer application') || lower === 'mca') return 'MCA';
  if (lower.includes('business administration') || lower === 'mba') return 'MBA';
  if (lower.includes('biotech') || lower === 'bt') return 'BT';

  // 3. Fallback to clean uppercase word
  return clean.toUpperCase().replace(/\s+/g, '-').slice(0, 10);
};

const formatBylineCase = (text?: string | null): string => {
  if (!text) return 'Student';
  const clean = text.trim();
  if (!clean || clean === 'null' || clean === 'undefined') return 'Student';

  // If text already contains lowercase letters (e.g. "Graduate Assistant at Stanford"), keep user/admin input intact
  const hasLowercase = /[a-z]/.test(clean);
  const isAllCaps = clean === clean.toUpperCase() && /[A-Z]/.test(clean);

  if (!isAllCaps && hasLowercase) {
    return clean;
  }

  // If ALL CAPS (e.g. "COORDINATOR", "TECH LEAD", "PR HEAD", "OPERATIONS HEAD", "CORE TEAM")
  // Convert into proper elegant Title Case (e.g. "Coordinator", "Tech Lead", "PR Head")
  const words = clean.toLowerCase().split(/\s+/);
  const acronyms = new Set(['pr', 'it', 'ai', 'sf', 'ui', 'ux', 'ceo', 'cto', 'cfo', 'coo', 'hr', 'iiit', 'iit', 'nit']);
  const minorWords = new Set(['at', 'in', 'of', 'for', 'and', 'the', 'to', 'on', 'with', 'by']);

  return words
    .map((word, idx) => {
      if (acronyms.has(word)) return word.toUpperCase();
      if (idx > 0 && minorWords.has(word)) return word.toLowerCase();
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
};

const getPassingYear = (batch: string) => {
  if (!batch || batch === 'All') return '';
  const parts = batch.split('-');
  return parts.length > 1 ? parts[1].trim() : batch.trim();
};

const getVolume = (batch: string) => {
  if (!batch || batch === 'All') return '';
  const year = parseInt(getPassingYear(batch), 10);
  if (!isNaN(year)) {
    return Math.max(1, year - 2014);
  }
  return '';
};

// ─── Smooth Alumnus Card (Achievement Page Spring Scale Physics) ──────────
function AlumnusCard({
  alum,
  onSelect,
}: {
  alum: Alumnus;
  onSelect: () => void;
}) {
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

  const photoUrl =
    alum.photo && alum.photo.trim() !== ''
      ? getOptimizedAvatarUrl(alum.photo, 400)
      : `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(alum.name)}`;

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
      onClick={onSelect}
      className="group flex flex-col border-2 border-neutral-300 dark:border-neutral-800 p-3 bg-card dark:bg-neutral-900/50 text-card-foreground rounded-none will-change-transform transition-all duration-300 hover:border-foreground dark:hover:border-neutral-200 dark:hover:bg-neutral-900/90 select-none cursor-pointer h-full"
    >
      {/* Portrait */}
      <div className="block w-full aspect-[4/4.3] relative overflow-hidden bg-neutral-100 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800/80">
        <motion.img
          style={{ scale: imgZoom }}
          src={photoUrl}
          alt={alum.name}
          className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-[filter] duration-500 will-change-transform origin-center"
        />
      </div>

      {/* Name */}
      <div className="mt-3.5">
        <h2 className="font-serif text-[32px] lg:text-[44px] font-normal uppercase leading-[0.92] text-foreground dark:text-neutral-50 tracking-[-0.04em] mb-2.5">
          {alum.name.split(' ').map((word, i) => (
            <span key={i} className="block truncate">
              {word}
            </span>
          ))}
        </h2>
      </div>

      {/* Bottom Editorial Roster Row */}
      {(() => {
        const rawPos = (alum.currentPosition || '').trim();
        const rawBranch = (alum.branch || '').trim();

        // 1. Byline / Position formatting (Present Journey only, fallback to 'Student', Title Case consistency)
        let resolvedPosition = 'Student';
        if (rawPos && rawPos !== 'null' && rawPos !== 'undefined') {
          resolvedPosition = rawPos;
        }
        const displayPosition = formatBylineCase(resolvedPosition);

        // 2. Batch & Branch tag formatting (e.g. "IT 24'", "EE 24'", "CSE-SF 24'")
        const branchTag = formatShortBranch(rawBranch);
        const passingYear = getPassingYear(alum.batch);
        const yearTag = passingYear ? `${passingYear.slice(-2)}'` : "24'";
        const batchBranch = `${branchTag} ${yearTag}`;

        return (
          <div className="flex justify-between items-end mt-auto pt-3.5 border-t border-neutral-200/80 dark:border-neutral-800/90 gap-3">
            <span
              title={displayPosition}
              className="font-serif italic text-[13px] md:text-[14px] text-foreground/90 dark:text-neutral-200 flex-1 leading-tight line-clamp-2 wrap-break-word"
            >
              {displayPosition}
            </span>
            <div className="shrink-0 pb-0.5">
              <span className="font-mono text-[10px] uppercase tracking-[0.24em] font-medium text-muted-foreground dark:text-neutral-400 whitespace-nowrap">
                {batchBranch}
              </span>
            </div>
          </div>
        );
      })()}
    </motion.div>
  );
}

// ─── Awwwards-Level Interactive Controls ──────────────────────────────────
function CloseModalButton({ onClick }: { onClick: () => void }) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.12, rotate: 90 }}
      whileTap={{ scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 400, damping: 18 }}
      className="absolute top-6 right-6 w-10 h-10 rounded-full border border-neutral-300 dark:border-neutral-700/80 bg-neutral-100/90 dark:bg-neutral-900/90 backdrop-blur-sm flex items-center justify-center text-foreground dark:text-neutral-200 hover:bg-foreground hover:text-background dark:hover:bg-white dark:hover:text-black dark:hover:border-white hover:border-foreground transition-colors duration-200 cursor-pointer shadow-sm z-20"
      aria-label="Close detail modal"
    >
      <X size={18} strokeWidth={2} />
    </motion.button>
  );
}

function ExcelsiorArrowLink({ username }: { username: string }) {
  return (
    <motion.div
      whileHover={{ scale: 1.25 }}
      whileTap={{ scale: 0.92 }}
      transition={{ type: 'spring', stiffness: 400, damping: 18 }}
    >
      <Link
        href={`/profile/${username}`}
        className="relative w-11 h-11 md:w-12 md:h-12 rounded-full border border-neutral-300 dark:border-neutral-700/80 flex items-center justify-center bg-neutral-100/90 dark:bg-neutral-900/90 hover:bg-foreground dark:hover:bg-white hover:border-foreground dark:hover:border-white transition-all duration-300 shadow-sm overflow-hidden group shrink-0 cursor-pointer"
        title="View Excelsior Profile"
        aria-label="View Excelsior Profile"
      >
        {/* Dual Arrow Kinetic Slide Effect with Larger Arrow */}
        <div className="relative w-5 h-5 overflow-hidden">
          <ArrowUpRight
            size={20}
            strokeWidth={2.4}
            className="absolute inset-0 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-full group-hover:-translate-y-full text-foreground dark:text-neutral-200 group-hover:text-background dark:group-hover:text-black"
          />
          <ArrowUpRight
            size={20}
            strokeWidth={2.4}
            className="absolute inset-0 -translate-x-full translate-y-full transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-0 group-hover:translate-y-0 text-foreground dark:text-neutral-200 group-hover:text-background dark:group-hover:text-black"
          />
        </div>
      </Link>
    </motion.div>
  );
}

// ─── Automatic Platform URL Detector ──────────────────────────────────────
export function detectPlatform(url: string, explicitPlatform?: string): string {
  if (explicitPlatform && explicitPlatform.trim() !== '') {
    return explicitPlatform.toLowerCase().trim();
  }
  const u = (url || '').toLowerCase();
  if (u.includes('discord.gg') || u.includes('discord.com')) return 'discord';
  if (u.includes('instagram.com') || u.includes('instagr.am')) return 'instagram';
  if (u.includes('linkedin.com')) return 'linkedin';
  if (u.includes('twitter.com') || u.includes('x.com')) return 'x';
  if (u.includes('github.com')) return 'github';
  if (u.includes('facebook.com') || u.includes('fb.com')) return 'facebook';
  if (u.includes('youtube.com') || u.includes('youtu.be')) return 'youtube';
  if (u.startsWith('mailto:')) return 'email';
  if (u.startsWith('tel:')) return 'phone';
  return 'globe';
}

function SocialIconButton({
  href,
  platform,
  title,
  ariaLabel,
}: {
  href: string;
  platform?: string;
  title: string;
  ariaLabel: string;
}) {
  const resolvedPlatform = detectPlatform(href, platform);

  return (
    <motion.a
      href={href}
      target={href.startsWith('mailto:') || href.startsWith('tel:') ? undefined : '_blank'}
      rel="noopener noreferrer"
      whileHover={{ scale: 1.18, y: -4 }}
      whileTap={{ scale: 0.92 }}
      transition={{ type: 'spring', stiffness: 450, damping: 17 }}
      className="relative p-3 rounded-full border border-neutral-200 dark:border-neutral-800/90 hover:border-foreground dark:hover:border-white bg-neutral-50 dark:bg-neutral-900/90 text-muted-foreground dark:text-neutral-300 hover:text-background dark:hover:text-black hover:bg-foreground dark:hover:bg-white transition-colors duration-300 shadow-sm hover:shadow-xl hover:shadow-black/10 dark:hover:shadow-[0_0_20px_rgba(255,255,255,0.12)] group flex items-center justify-center cursor-pointer"
      title={title}
      aria-label={ariaLabel}
    >
      <SocialIcon platform={resolvedPlatform} size={17} className="transition-transform duration-300 group-hover:scale-110" />
    </motion.a>
  );
}

// ─── Main Alumni Directory Page ───────────────────────────────────────────
export default function AlumniDirectoryPage() {
  const [alumni, setAlumni] = useState<Alumnus[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBatch, setSelectedBatch] = useState('All');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isBatchDropdownOpen, setIsBatchDropdownOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 12;

  // Reset page when filtering
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedBatch]);

  const searchParams = useSearchParams();
  const urlId = searchParams.get('id');

  useEffect(() => {
    let isMounted = true;
    const fetchAlumni = async () => {
      try {
        const res = await fetch('/api/community/alumni');
        const data = await res.json();
        if (data.success && isMounted) {
          setAlumni(data.alumni || []);
        }
      } catch (error) {
        console.error('Failed to load alumni:', error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchAlumni();
    return () => {
      isMounted = false;
    };
  }, []);

  // Auto-open modal if URL has ?id=[alumniId]
  useEffect(() => {
    if (urlId && alumni.length > 0) {
      const found = alumni.find((a) => a.id === urlId);
      if (found) {
        setActiveId(urlId);
      }
    }
  }, [urlId, alumni]);

  // Lock body scroll when overlay is open
  useEffect(() => {
    if (activeId) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [activeId]);

  // Get unique batches for filtering
  const batches = ['All', ...Array.from(new Set(alumni.map((a) => a.batch)))].sort((a, b) =>
    b.localeCompare(a)
  );

  // Filter alumni
  const filteredAlumni = alumni.filter((alum) => {
    const matchesSearch =
      alum.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alum.batch.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alum.currentPosition?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alum.excelsiorPosition?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alum.branch.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesBatch = selectedBatch === 'All' || alum.batch === selectedBatch;
    return matchesSearch && matchesBatch;
  });

  const totalPages = Math.ceil(filteredAlumni.length / ITEMS_PER_PAGE);
  const paginatedAlumni = filteredAlumni.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const activeAlum = alumni.find((a) => a.id === activeId);

  if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-background text-foreground">
        <div className="flex flex-col items-center gap-6 animate-pulse opacity-50">
          <BookOpen size={32} strokeWidth={1} />
          <div className="font-mono text-[10px] uppercase tracking-[0.3em] font-bold">
            Loading Archive...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      {/* Header */}
      <header className="relative pt-8 pb-14 px-6 md:px-12 max-w-[1600px] mx-auto flex flex-col items-center text-center">
        {/* Animated Eyebrow */}
        <div className="overflow-hidden mb-4">
          <motion.p
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: '0%', opacity: 1 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="font-mono text-[10px] uppercase tracking-[0.4em] font-medium text-muted-foreground"
          >
            Legacy Through Literature
          </motion.p>
        </div>

        {/* Animated Masked Title */}
        <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl text-foreground tracking-tighter leading-none mb-10 italic">
          <span className="inline-block overflow-hidden">
            <motion.span
              initial={{ y: '115%' }}
              animate={{ y: '0%' }}
              transition={{ duration: 0.9, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
              className="inline-block will-change-transform"
            >
              Archivum&nbsp;
            </motion.span>
          </span>
          <span className="inline-block overflow-hidden">
            <motion.span
              initial={{ y: '115%' }}
              animate={{ y: '0%' }}
              transition={{ duration: 0.9, delay: 0.16, ease: [0.22, 1, 0.36, 1] }}
              className="inline-block will-change-transform"
            >
              Alumnorum
            </motion.span>
          </span>
        </h1>

        {/* Search & Filters */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="w-full max-w-3xl flex flex-col md:flex-row items-stretch md:items-end gap-6 relative z-20"
        >
          <div className="relative w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <input
              type="text"
              placeholder="Search name or batch..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-transparent border-b border-neutral-300 dark:border-neutral-800 focus:border-foreground dark:focus:border-neutral-200 outline-none transition-colors text-sm text-foreground placeholder:text-muted-foreground font-serif italic"
            />
          </div>

          <div className="relative w-full md:w-64">
            <button
              onClick={() => setIsBatchDropdownOpen(!isBatchDropdownOpen)}
              className="flex items-center justify-between w-full px-4 py-3 bg-transparent border-b border-neutral-400 dark:border-neutral-700 focus:border-foreground dark:focus:border-neutral-200 outline-none transition-colors text-base text-foreground font-serif italic text-left hover:border-foreground dark:hover:border-neutral-200 cursor-pointer"
            >
              <span className="font-medium truncate">
                {selectedBatch === 'All'
                  ? 'All Batches'
                  : `Vol. ${getVolume(selectedBatch)} (${getPassingYear(selectedBatch)})`}
              </span>
              <ChevronDown
                size={16}
                className={`text-muted-foreground transition-transform shrink-0 ml-2 ${
                  isBatchDropdownOpen ? 'rotate-180' : ''
                }`}
              />
            </button>
            <AnimatePresence>
              {isBatchDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-20 cursor-default"
                    onClick={() => setIsBatchDropdownOpen(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: -2 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -2 }}
                    transition={{ duration: 0.15 }}
                    onWheel={(e) => e.stopPropagation()}
                    className="absolute top-full left-0 right-0 bg-card dark:bg-[#0c0c0e] border border-t-0 border-neutral-400 dark:border-neutral-700 shadow-2xl max-h-60 overflow-y-auto overscroll-contain pointer-events-auto z-30 rounded-none touch-pan-y [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-neutral-400/60 dark:[&::-webkit-scrollbar-thumb]:bg-neutral-600/60 hover:[&::-webkit-scrollbar-thumb]:bg-neutral-500"
                  >
                    {batches.map((batch) => (
                      <button
                        key={batch}
                        onClick={() => {
                          setSelectedBatch(batch);
                          setIsBatchDropdownOpen(false);
                        }}
                        className={`block w-full text-left px-4 py-3 text-sm font-serif italic transition-colors cursor-pointer ${
                          selectedBatch === batch
                            ? 'bg-neutral-950 text-white dark:bg-white dark:text-neutral-950 font-medium'
                            : 'text-muted-foreground hover:bg-neutral-100 dark:hover:bg-white/5 hover:text-foreground'
                        }`}
                      >
                        {batch === 'All'
                          ? 'All Batches'
                          : `Vol. ${getVolume(batch)} (${getPassingYear(batch)})`}
                      </button>
                    ))}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </header>

      {/* The Alumni Grid */}
      <main className="max-w-[1600px] mx-auto px-6 md:px-12 pb-32">
        {filteredAlumni.length > 0 ? (
          <>
            <motion.div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4.5 pt-8.5"
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
                {paginatedAlumni.map((alum) => (
                  <AlumnusCard
                    key={alum.id}
                    alum={alum}
                    onSelect={() => setActiveId(alum.id)}
                  />
                ))}
              </AnimatePresence>
            </motion.div>

            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-16 pt-8 border-t border-neutral-200 dark:border-neutral-800">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="w-10 h-10 flex items-center justify-center border-2 border-neutral-300 dark:border-neutral-800 disabled:opacity-30 hover:border-foreground dark:hover:border-neutral-200 transition-colors text-foreground dark:text-neutral-200 cursor-pointer disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={16} strokeWidth={2} />
                </button>

                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`w-10 h-10 flex items-center justify-center border-2 transition-colors font-serif cursor-pointer ${
                      currentPage === i + 1
                        ? 'border-foreground dark:border-white bg-foreground dark:bg-white text-background dark:text-black font-bold'
                        : 'border-neutral-300 dark:border-neutral-800 hover:border-foreground dark:hover:border-neutral-200 text-foreground dark:text-neutral-200'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}

                <button
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="w-10 h-10 flex items-center justify-center border-2 border-neutral-300 dark:border-neutral-800 disabled:opacity-30 hover:border-foreground dark:hover:border-neutral-200 transition-colors text-foreground dark:text-neutral-200 cursor-pointer disabled:cursor-not-allowed"
                >
                  <ChevronRight size={16} strokeWidth={2} />
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="py-32 text-center mt-8.5">
            <p className="font-serif italic text-2xl text-muted-foreground">
              No alumni records found for this batch.
            </p>
          </div>
        )}
      </main>

      {/* Expanded Detail Overlay */}
      <AnimatePresence>
        {activeId && activeAlum && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-1000 flex items-center justify-center bg-black/70 dark:bg-black/85 backdrop-blur-md overflow-y-auto"
            onClick={() => setActiveId(null)}
          >
            <div className="w-full max-w-2xl px-6 py-24 my-auto relative">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                transition={{ type: 'spring', stiffness: 320, damping: 28 }}
                className="bg-card dark:bg-[#0c0c0e] text-card-foreground border border-neutral-200/80 dark:border-neutral-800/90 p-10 md:p-16 rounded-2xl shadow-2xl dark:shadow-[0_30px_80px_-15px_rgba(0,0,0,0.95)] relative overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Awwwards Smooth Close Button */}
                <CloseModalButton onClick={() => setActiveId(null)} />

                {/* Profile Header */}
                <div className="relative z-10 text-center mb-10">
                  <p className="font-mono text-[10px] uppercase tracking-[0.3em] font-bold text-muted-foreground dark:text-neutral-400 mb-3">
                    {activeAlum.branch} &mdash; Class of {getPassingYear(activeAlum.batch)}
                  </p>
                  
                  <div className="inline-flex items-center justify-center gap-3">
                    <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl text-foreground dark:text-neutral-50 tracking-tighter leading-none">
                      {activeAlum.name}
                    </h2>
                    {activeAlum.user?.username && (
                      <ExcelsiorArrowLink username={activeAlum.user.username} />
                    )}
                  </div>
                </div>

                {/* Quote / Testimonial */}
                {activeAlum.message ? (
                  <div className="relative mb-12 text-center">
                    <span className="absolute -top-12 left-1/2 -translate-x-1/2 text-8xl font-serif text-foreground/5 dark:text-white/4 select-none pointer-events-none">
                      &ldquo;
                    </span>
                    <p className="relative z-10 font-serif text-xl md:text-2xl leading-relaxed text-foreground dark:text-neutral-100">
                      {activeAlum.message}
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-8 border-y border-neutral-200 dark:border-neutral-800 mb-12">
                    <p className="font-serif italic text-lg text-muted-foreground dark:text-neutral-400">
                      The pages are blank.
                    </p>
                  </div>
                )}

                {/* Roles / Positions */}
                {(() => {
                  const excelsiorMark = formatBylineCase(
                    activeAlum.excelsiorPosition &&
                    activeAlum.excelsiorPosition.trim() !== '' &&
                    activeAlum.excelsiorPosition !== 'null' &&
                    activeAlum.excelsiorPosition !== 'undefined'
                      ? activeAlum.excelsiorPosition
                      : 'Alumnus'
                  );

                  const presentJourney = formatBylineCase(
                    activeAlum.currentPosition &&
                    activeAlum.currentPosition.trim() !== '' &&
                    activeAlum.currentPosition !== 'null' &&
                    activeAlum.currentPosition !== 'undefined'
                      ? activeAlum.currentPosition
                      : 'Student'
                  );

                  return (
                    <div className="flex flex-col sm:flex-row gap-8 sm:gap-12 justify-center mb-12 text-center">
                      <div>
                        <h4 className="font-mono text-[9px] uppercase tracking-[0.3em] font-bold text-muted-foreground dark:text-neutral-400 mb-1.5">
                          Excelsior Mark
                        </h4>
                        <p className="font-serif font-bold text-base md:text-lg text-foreground dark:text-neutral-100">
                          {excelsiorMark}
                        </p>
                      </div>
                      <div>
                        <h4 className="font-mono text-[9px] uppercase tracking-[0.3em] font-bold text-muted-foreground dark:text-neutral-400 mb-1.5">
                          Present Journey
                        </h4>
                        <p className="font-serif font-bold text-base md:text-lg text-foreground dark:text-neutral-100">
                          {presentJourney}
                        </p>
                      </div>
                    </div>
                  );
                })()}

                {/* Correspondence / Universal Social Media Icons */}
                <div className="pt-8 border-t border-neutral-200 dark:border-neutral-800 text-center">
                  <h4 className="font-mono text-[9px] uppercase tracking-[0.3em] font-bold text-muted-foreground dark:text-neutral-400 mb-6">
                    Correspondence
                  </h4>

                  {(activeAlum.isContactRestricted || activeAlum.isSocialRestricted) && !activeAlum.instagram && !activeAlum.linkedin && !activeAlum.email && !activeAlum.phone ? (
                    <div className="inline-flex items-center gap-3 bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 px-6 py-4 rounded-xl max-w-md">
                      <Lock size={14} className="text-muted-foreground shrink-0" />
                      <p className="text-xs font-serif italic text-muted-foreground leading-relaxed">
                        Direct correspondence is reserved for club members.
                        {activeAlum.user?.username && ' Visit their public profile above to read published articles and stories.'}
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-wrap justify-center items-center gap-4">
                      {activeAlum.email && (
                        <SocialIconButton
                          href={`mailto:${activeAlum.email}`}
                          platform="email"
                          title={`Email: ${activeAlum.email}`}
                          ariaLabel="Email"
                        />
                      )}
                      {activeAlum.linkedin && (
                        <SocialIconButton
                          href={activeAlum.linkedin}
                          platform="linkedin"
                          title="LinkedIn"
                          ariaLabel="LinkedIn"
                        />
                      )}
                      {activeAlum.instagram && (
                        <SocialIconButton
                          href={activeAlum.instagram}
                          platform="instagram"
                          title="Instagram"
                          ariaLabel="Instagram"
                        />
                      )}
                      {activeAlum.phone && (
                        <SocialIconButton
                          href={`tel:${activeAlum.phone}`}
                          platform="phone"
                          title={`Phone: ${activeAlum.phone}`}
                          ariaLabel="Phone"
                        />
                      )}
                      {!activeAlum.email && !activeAlum.linkedin && !activeAlum.instagram && !activeAlum.phone && (
                        <span className="text-xs font-serif italic text-muted-foreground">
                          No public contacts registered.
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
