// src/app/(admin)/admin/page.tsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  ShieldCheck,
  Calendar,
  CalendarPlus,
  Users,
  UserPlus,
  Library,
  BookPlus,
  BookCopy,
  Layers,
  Image as ImageIcon,
  ImagePlus,
  Trophy,
  Award,
  GraduationCap,
  Sparkles,
  Search,
  ArrowRight,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  FileCheck,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  LogOut,
  RefreshCw,
  Sliders,
  Compass,
} from 'lucide-react';
import { Role, hasPermission, formatRole, isStaff, Permission } from '@/lib/rbac';

interface AdminModule {
  id: string;
  title: string;
  category: 'PEOPLE' | 'EVENTS' | 'LIBRARY' | 'MEDIA' | 'EDITORIAL';
  description: string;
  href: string;
  createHref?: string;
  createLabel?: string;
  icon: any;
  requiredPermission: Permission;
  badgeLabel?: string;
  statsKey?: string;
  statsFormatter?: (stats: any) => string;
  accentColor: string;
  gradient: string;
}

const MODULES: AdminModule[] = [
  {
    id: 'events',
    title: 'Events & Registrations',
    category: 'EVENTS',
    description: 'Create and publish events, configure registration forms, track payments, review winners, and manage gallery memories.',
    href: '/admin/events',
    createHref: '/admin/events/new',
    createLabel: '+ New Event',
    icon: Calendar,
    requiredPermission: 'VIEW_ADMIN_EVENTS',
    statsKey: 'totalEvents',
    statsFormatter: (s) => `${s?.upcomingEvents || 0} Upcoming · ${s?.totalEvents || 0} Total`,
    accentColor: '#3b82f6',
    gradient: 'from-blue-500/10 via-blue-500/5 to-transparent',
  },
  {
    id: 'roles',
    title: 'Roles & Verification Queue',
    category: 'PEOPLE',
    description: 'Verify student roll numbers and alumni affiliation requests, assign society roles, and grant wing leadership privileges.',
    href: '/admin/roles',
    icon: ShieldCheck,
    requiredPermission: 'MANAGE_ROLES',
    statsKey: 'pendingRoles',
    statsFormatter: (s) => (s?.pendingRoles > 0 ? `${s.pendingRoles} Pending Verifications` : 'Queue Clear'),
    accentColor: '#f59e0b',
    gradient: 'from-amber-500/10 via-amber-500/5 to-transparent',
  },
  {
    id: 'members',
    title: 'Team & Member Registry',
    category: 'PEOPLE',
    description: 'Curate the official society directory across Coordinators, Core Committee, and Team Members with custom titles and portraits.',
    href: '/admin/members',
    icon: Users,
    requiredPermission: 'MANAGE_MEMBERS',
    statsKey: 'totalMembers',
    statsFormatter: (s) => `${s?.totalMembers || 0} Listed Society Members`,
    accentColor: '#10b981',
    gradient: 'from-emerald-500/10 via-emerald-500/5 to-transparent',
  },
  {
    id: 'library',
    title: 'Physical Club Library',
    category: 'LIBRARY',
    description: 'Manage the physical book lending catalog, total copies, book genres, availability status, and student borrowing requests.',
    href: '/admin/library',
    createHref: '/admin/library/new',
    createLabel: '+ Add Book',
    icon: Library,
    requiredPermission: 'MANAGE_SHELF_LIBRARY',
    statsKey: 'totalLibraryBooks',
    statsFormatter: (s) => `${s?.totalLibraryBooks || 0} Volumes · ${s?.pendingBookIssues || 0} Pending Issues`,
    accentColor: '#d4af37',
    gradient: 'from-amber-400/10 via-amber-400/5 to-transparent',
  },
  {
    id: 'editors-shelf',
    title: "3D Editor's Shelf",
    category: 'LIBRARY',
    description: 'Curate clothbound hardback classics for the interactive 3D shelf, customizing spine colors, foil patterns, and excerpts.',
    href: '/admin/editors-shelf',
    icon: BookCopy,
    requiredPermission: 'MANAGE_SHELF_LIBRARY',
    statsKey: 'totalEditorShelf',
    statsFormatter: (s) => `${s?.totalEditorShelf || 0} Hardback Volumes`,
    accentColor: '#8b5cf6',
    gradient: 'from-purple-500/10 via-purple-500/5 to-transparent',
  },
  {
    id: 'cms',
    title: 'Homepage CMS & 3D Cards',
    category: 'MEDIA',
    description: 'Configure animated 3D hero cards (word counts, pages, format categories, links), event ticker strip, and alumni voices.',
    href: '/admin/cms',
    icon: Sparkles,
    requiredPermission: 'MANAGE_HOMEPAGE_CMS',
    statsFormatter: () => 'Live 3D Customizer',
    accentColor: '#ec4899',
    gradient: 'from-pink-500/10 via-pink-500/5 to-transparent',
  },
  {
    id: 'gallery',
    title: 'Society Gallery & Fragments',
    category: 'MEDIA',
    description: 'Upload high-resolution event photographs, festival captures, and memory fragments with interactive multi-aspect cropping.',
    href: '/admin/gallery',
    icon: ImageIcon,
    requiredPermission: 'MANAGE_GALLERY',
    statsKey: 'totalGallery',
    statsFormatter: (s) => `${s?.totalGallery || 0} Media Fragments`,
    accentColor: '#06b6d4',
    gradient: 'from-cyan-500/10 via-cyan-500/5 to-transparent',
  },
  {
    id: 'achievements',
    title: 'Achievements & Honors',
    category: 'MEDIA',
    description: 'Showcase inter-college literary wins, poetry championships, journal publications, and prestigious society accolades.',
    href: '/admin/achievements',
    icon: Trophy,
    requiredPermission: 'MANAGE_ACHIEVEMENTS',
    statsKey: 'totalAchievements',
    statsFormatter: (s) => `${s?.totalAchievements || 0} Accolades Recorded`,
    accentColor: '#eab308',
    gradient: 'from-yellow-500/10 via-yellow-500/5 to-transparent',
  },
  {
    id: 'alumni',
    title: 'Alumni Directory (Archivum)',
    category: 'PEOPLE',
    description: 'Curate notable alumni profiles, graduation batches, current companies/universities, and inspirational testimonials.',
    href: '/admin/alumni',
    icon: GraduationCap,
    requiredPermission: 'MANAGE_ALUMNI',
    statsKey: 'totalAlumni',
    statsFormatter: (s) => `${s?.totalAlumni || 0} Alumni Profiles`,
    accentColor: '#6366f1',
    gradient: 'from-indigo-500/10 via-indigo-500/5 to-transparent',
  },
  {
    id: 'moderation',
    title: 'Submissions Moderation Queue',
    category: 'EDITORIAL',
    description: 'Review pending articles, poetry submissions, short stories, and editorial critiques submitted by members and campus writers.',
    href: '/moderator/pending',
    icon: FileCheck,
    requiredPermission: 'MODERATE_PUBLICATIONS',
    statsKey: 'pendingSubmissions',
    statsFormatter: (s) => (s?.pendingSubmissions > 0 ? `${s.pendingSubmissions} Pending Submissions` : 'All Reviewed'),
    accentColor: '#14b8a6',
    gradient: 'from-teal-500/10 via-teal-500/5 to-transparent',
  },
];

const CATEGORIES = [
  { id: 'ALL', label: 'All Controls' },
  { id: 'EVENTS', label: 'Events' },
  { id: 'PEOPLE', label: 'Team & Roles' },
  { id: 'LIBRARY', label: 'Library & Shelf' },
  { id: 'MEDIA', label: 'Media & CMS' },
  { id: 'EDITORIAL', label: 'Editorial' },
];

export default function AdminConsoleDashboard() {
  const { data: session, status } = useSession();
  const userRole = (session?.user as any)?.role as Role | undefined;

  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Fetch real-time statistics for all modules
  const fetchOverview = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/overview');
      const data = await res.json();
      if (res.ok && data.success) {
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Failed to load overview:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  // Filter modules based on user's actual role and active category/search filter
  const accessibleModules = useMemo(() => {
    return MODULES.filter((m) => {
      // 1. Permission gate: User must hold the required permission for this tool
      const hasAccess = hasPermission(userRole, m.requiredPermission);
      if (!hasAccess) return false;

      // 2. Category filter
      if (activeCategory !== 'ALL' && m.category !== activeCategory) {
        return false;
      }

      // 3. Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = m.title.toLowerCase().includes(q);
        const matchDesc = m.description.toLowerCase().includes(q);
        const matchId = m.id.toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchId) return false;
      }

      return true;
    });
  }, [userRole, activeCategory, searchQuery]);

  return (
    <div className="min-h-screen bg-[#060608] text-neutral-100 font-sans selection:bg-white selection:text-black">
      {/* Ambient Lighting Backdrop */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-gradient-to-b from-purple-900/15 via-blue-900/10 to-transparent blur-[160px] opacity-60" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-8 sm:py-12 space-y-8">
        
        {/* Top Navigation & Console Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800/80 pb-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-neutral-400">
              <Link href="/" className="hover:text-white transition flex items-center gap-1">
                <span>← Excelsior Home</span>
              </Link>
              <span>/</span>
              <span className="text-amber-500 font-bold">Admin Console</span>
            </div>
            
            <div className="flex items-center gap-3">
              <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-white flex items-center gap-3">
                <span>Excelsior Console</span>
              </h1>
              <span className="px-3 py-1 rounded-full bg-neutral-800/90 border border-neutral-700 text-[10.5px] font-mono font-bold uppercase tracking-wider text-neutral-300">
                {formatRole(userRole) || 'Staff Access'}
              </span>
            </div>

            <p className="text-xs sm:text-sm text-neutral-400 max-w-2xl">
              Welcome to the centralized management suite. Select any control module to inspect queues, publish events, or manage society archives.
            </p>
          </div>

          {/* Quick Refresh & Return Links */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={fetchOverview}
              disabled={loading}
              className="p-2.5 rounded-2xl border border-neutral-800 bg-[#0f0f12] text-neutral-400 hover:text-white hover:border-neutral-700 transition cursor-pointer shadow-sm"
              title="Refresh Module Statistics"
            >
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            </button>
            <Link
              href="/"
              className="px-4 py-2.5 rounded-2xl border border-neutral-800 bg-[#0f0f12] text-xs font-mono font-bold text-neutral-300 hover:text-white hover:border-neutral-700 transition flex items-center gap-1.5 shadow-sm"
            >
              <span>View Website</span>
              <ExternalLink size={12} />
            </Link>
          </div>
        </div>

        {/* Toolbar: Filter Tabs + Real-Time Search */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-[#0f0f12] border border-neutral-800/80 overflow-x-auto">
            {CATEGORIES.map((cat) => {
              const isSelected = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                    isSelected
                      ? 'bg-neutral-800 text-white shadow-sm border border-neutral-700'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>

          {/* Instant Search Bar */}
          <div className="relative w-full md:w-80">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search control tools..."
              className="w-full h-11 pl-10 pr-4 rounded-2xl border border-neutral-800 bg-[#0f0f12] text-xs text-white placeholder:text-neutral-500 focus:border-neutral-600 focus:outline-none transition shadow-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white text-xs font-mono cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Dynamic Control Modules Grid */}
        <div className="space-y-4">
          {accessibleModules.length === 0 ? (
            <div className="py-24 text-center rounded-3xl border border-dashed border-neutral-800 bg-[#0b0b0e] p-8 space-y-3">
              <Sliders size={36} className="mx-auto text-neutral-600" />
              <h3 className="font-serif text-lg font-bold text-white">No matching controls found</h3>
              <p className="text-xs text-neutral-400 max-w-sm mx-auto">
                No active tools match your search criteria or permission privileges. Try adjusting your search query.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {accessibleModules.map((mod) => {
                const Icon = mod.icon;
                const statText = mod.statsFormatter ? mod.statsFormatter(stats) : null;
                const isAlertQueue =
                  (mod.id === 'roles' && stats?.pendingRoles > 0) ||
                  (mod.id === 'moderation' && stats?.pendingSubmissions > 0) ||
                  (mod.id === 'library' && stats?.pendingBookIssues > 0);

                return (
                  <motion.div
                    key={mod.id}
                    layout
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className={`group relative flex flex-col justify-between rounded-3xl border border-neutral-800/90 bg-[#0c0c10] p-6 shadow-md hover:border-neutral-700 transition-all duration-200 overflow-hidden ${
                      isAlertQueue ? 'ring-1 ring-amber-500/20' : ''
                    }`}
                  >
                    {/* Top Glow Accent */}
                    <div
                      className={`absolute top-0 right-0 left-0 h-1 bg-gradient-to-r ${mod.gradient} opacity-80`}
                      style={{ borderTopLeftRadius: '1.5rem', borderTopRightRadius: '1.5rem' }}
                    />

                    <div className="space-y-4">
                      {/* Icon & Live Status Badge */}
                      <div className="flex items-start justify-between gap-3">
                        <div
                          className="flex h-12 w-12 items-center justify-center rounded-2xl border border-neutral-800 bg-[#14141a] text-white shadow-inner group-hover:scale-105 transition-transform"
                          style={{ color: mod.accentColor }}
                        >
                          <Icon size={22} />
                        </div>

                        {statText && (
                          <span
                            className={`px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider border ${
                              isAlertQueue
                                ? 'bg-amber-500/10 text-amber-400 border-amber-500/30 animate-pulse'
                                : 'bg-neutral-800/80 text-neutral-300 border-neutral-700/80'
                            }`}
                          >
                            {statText}
                          </span>
                        )}
                      </div>

                      {/* Title & Description */}
                      <div className="space-y-1.5">
                        <h3 className="font-serif text-lg font-bold text-white group-hover:text-amber-400 transition-colors">
                          {mod.title}
                        </h3>
                        <p className="text-xs text-neutral-400 leading-relaxed line-clamp-3">
                          {mod.description}
                        </p>
                      </div>
                    </div>

                    {/* Action Dock */}
                    <div className="pt-6 mt-6 border-t border-neutral-800/60 flex items-center justify-between gap-2">
                      {mod.createHref ? (
                        <Link
                          href={mod.createHref}
                          className="px-3.5 py-1.5 rounded-xl border border-neutral-800 bg-[#121218] text-[11px] font-mono font-bold text-neutral-300 hover:text-white hover:border-neutral-700 transition"
                        >
                          {mod.createLabel || '+ Add'}
                        </Link>
                      ) : (
                        <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider">
                          Module {mod.id}
                        </span>
                      )}

                      <Link
                        href={mod.href}
                        className="px-4 py-2 rounded-xl bg-white text-black font-mono font-bold text-xs flex items-center gap-1.5 hover:bg-neutral-200 transition shadow-sm cursor-pointer group/btn"
                      >
                        <span>Open Console</span>
                        <ArrowRight size={13} className="group-hover/btn:translate-x-0.5 transition-transform" />
                      </Link>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
