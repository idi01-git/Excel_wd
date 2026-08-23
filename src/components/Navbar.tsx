'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, LayoutGroup, Variants } from 'framer-motion';
import {
  ArrowUpRight,
  BookOpenIcon,
  PenLineIcon,
  UsersIcon,
  LibraryIcon,
  TrophyIcon,
  ImageIcon,
  UserIcon,
  BookMarkedIcon,
  ChevronDownIcon,
  GraduationCapIcon,
  Newspaper,
  PenTool,
  Feather,
  BellIcon,
  CompassIcon,
  LayoutDashboard as LayoutDashboardIcon,
  LogOutIcon,
  ChevronRight,
  ArrowLeft,
  type LucideIcon,
} from 'lucide-react';
import NotificationBell from '@/components/navigation/NotificationBell';
import ThemeToggle from '@/components/ThemeToggle';
import { isStaff } from '@/lib/rbac';
import { getOptimizedAvatarUrl } from '@/lib/image-optimization';

// ─── Silky Smooth Calibrated Physics ─────────────────────────────────────────
const EASE_LUXURY = [0.16, 1, 0.3, 1] as const;
const SPRING_SMOOTH = { type: 'spring', stiffness: 340, damping: 28, mass: 0.6 } as const;
const SPRING_SUB = { type: 'spring', stiffness: 420, damping: 30, mass: 0.5 } as const;
const SPRING_TAP = { type: 'spring', stiffness: 380, damping: 24 } as const;

interface NavSubItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

// ─── Wordmark (Pure semantic component, 100% hydration safe) ──────────────────

export const BRAND_LETTERS = ['E', 'x', 'c', 'e', 'l', 's', 'i', 'o', 'r'] as const;

export function Wordmark() {
  return (
    <span className="relative inline-flex items-baseline py-1 select-none">
      {/* Subtle Ambient Liquid Glow Aura */}
      <span
        className="pointer-events-none absolute -inset-x-3.5 -inset-y-1.5 rounded-full bg-foreground/4 dark:bg-white/6 opacity-0 blur-md transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:opacity-100 group-hover:scale-110"
        aria-hidden
      />

      <span
        className="relative z-10 flex items-baseline text-foreground tracking-tight"
        style={{
          fontFamily: 'var(--font-playfair), "Playfair Display", Georgia, serif',
          fontSize: '24px',
          lineHeight: 1,
          fontWeight: 500,
          letterSpacing: '-0.03em',
        }}
      >
        {BRAND_LETTERS.map((char, i) => (
          <span
            key={i}
            className="inline-block transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-y-0.5"
            style={{
              transitionDelay: `${i * 18}ms`,
            }}
          >
            {char}
          </span>
        ))}
        <span
          className="inline-block text-muted-foreground/60 transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:text-foreground group-hover:scale-135 group-hover:translate-y-[-2.5px] origin-bottom ml-[0.5px]"
          style={{
            transitionDelay: `${BRAND_LETTERS.length * 18}ms`,
          }}
        >
          .
        </span>
      </span>
    </span>
  );
}

// ─── Desktop Nav Item with Silky Magnetic Hover & Fluid Sub-Slider ───────────

function NavItem({
  id,
  label,
  href,
  items,
  active,
  hoveredNav,
  setHoveredNav,
}: {
  id: string;
  label: string;
  href?: string;
  items?: NavSubItem[];
  active: boolean;
  hoveredNav: string | null;
  setHoveredNav: (id: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [hoveredSubItem, setHoveredSubItem] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isHovered = hoveredNav === id;

  const enter = () => {
    if (timer.current) clearTimeout(timer.current);
    setHoveredNav(id);
    if (items) setOpen(true);
  };

  const leave = () => {
    timer.current = setTimeout(() => {
      if (items) {
        setOpen(false);
        setHoveredSubItem(null);
      }
    }, 140);
  };

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const content = (
    <>
      <span className="relative z-10 font-sans text-[13.5px] font-medium tracking-tight transition-colors duration-150">
        {label}
      </span>
      {items && (
        <ChevronDownIcon
          size={13}
          strokeWidth={2}
          className={`relative z-10 opacity-50 transition-transform duration-200 ease-out ${
            open ? 'rotate-180 text-foreground opacity-100' : ''
          }`}
        />
      )}

      {/* Active Route Subtle Dot */}
      {active && !hoveredNav && (
        <span className="absolute -bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-foreground/70 pointer-events-none" />
      )}

      {/* Silky Fluid Magnetic Pill Background */}
      {isHovered && (
        <motion.div
          layoutId="nav-dock-pill"
          className="absolute inset-0 z-0 rounded-full bg-foreground/6 dark:bg-white/9 shadow-xs pointer-events-none"
          transition={SPRING_SMOOTH}
        />
      )}
    </>
  );

  const btnClass = `relative flex items-center gap-1.5 px-5 py-2.5 rounded-full transition-colors duration-150 cursor-pointer ${
    active || open
      ? 'text-foreground font-semibold'
      : 'text-muted-foreground hover:text-foreground'
  }`;

  return (
    <div className="relative" onMouseEnter={enter} onMouseLeave={leave}>
      {href ? (
        <Link href={href} className={btnClass}>
          {content}
        </Link>
      ) : (
        <button onClick={enter} aria-expanded={open} className={btnClass}>
          {content}
        </button>
      )}

      {/* Refined Dropdown Menu with Bigger, More Spacious Rows & Super-Smooth Slider */}
      {items && (
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: 6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.98 }}
              transition={{ duration: 0.16, ease: EASE_LUXURY }}
              className="absolute left-1/2 top-full z-100 mt-2.5 w-64 -translate-x-1/2 origin-top"
            >
              <div className="overflow-hidden rounded-2xl border border-neutral-200/90 dark:border-neutral-800 bg-white/95 dark:bg-[#121212]/95 backdrop-blur-2xl p-2 shadow-[0_20px_45px_rgba(0,0,0,0.15)] dark:shadow-[0_20px_45px_rgba(0,0,0,0.6)] ring-1 ring-black/5 dark:ring-white/10">
                <div
                  className="relative space-y-1"
                  onMouseLeave={() => setHoveredSubItem(null)}
                >
                  {items.map((item) => {
                    const Icon = item.icon;
                    const isSubHovered = hoveredSubItem === item.href;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onMouseEnter={() => setHoveredSubItem(item.href)}
                        className="relative flex items-center justify-between rounded-xl px-3.5 py-2.5 text-[13.5px] transition-colors duration-150"
                      >
                        {/* Fluid Sub-Slider Pill that glides between dropdown options */}
                        {isSubHovered && (
                          <motion.div
                            layoutId={`subnav-pill-${id}`}
                            className="absolute inset-0 z-0 rounded-xl bg-foreground/6 dark:bg-white/8 pointer-events-none"
                            transition={SPRING_SUB}
                          />
                        )}

                        <div className="relative z-10 flex items-center gap-3">
                          <Icon
                            size={16}
                            strokeWidth={1.75}
                            className={`transition-opacity duration-150 ${
                              isSubHovered ? 'opacity-100 text-foreground' : 'opacity-70 text-muted-foreground'
                            }`}
                          />
                          <span
                            className={`transition-colors duration-150 ${
                              isSubHovered ? 'text-foreground font-medium' : 'text-muted-foreground'
                            }`}
                          >
                            {item.label}
                          </span>
                        </div>

                        <ArrowUpRight
                          size={14}
                          className={`relative z-10 transition-all duration-150 ${
                            isSubHovered
                              ? 'opacity-100 translate-x-0 translate-y-0 text-foreground'
                              : 'opacity-0 -translate-x-1 translate-y-1 text-muted-foreground'
                          }`}
                        />
                      </Link>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}

// ─── Kinetic Morph Hamburger Button (Ultra-responsive editorial design) ───────

function AnimatedHamburger({ isOpen, toggle }: { isOpen: boolean; toggle: () => void }) {
  return (
    <motion.button
      whileTap={{ scale: 0.92 }}
      onClick={toggle}
      className={`relative z-50 flex h-10 w-10 items-center justify-center rounded-full border transition-all duration-300 focus:outline-none cursor-pointer ${
        isOpen
          ? 'border-foreground/20 bg-foreground text-background shadow-md'
          : 'border-border/60 bg-background/80 backdrop-blur-md hover:bg-foreground/6 text-foreground'
      }`}
      aria-label={isOpen ? 'Close menu' : 'Open menu'}
    >
      <div className="relative h-4 w-4.5 flex flex-col justify-between items-center py-0.5 pointer-events-none">
        <motion.span
          animate={isOpen ? { rotate: 45, y: 5.5, width: '100%' } : { rotate: 0, y: 0, width: '100%' }}
          transition={{ duration: 0.28, ease: EASE_LUXURY }}
          className={`h-[1.75px] rounded-full origin-center ${isOpen ? 'bg-background' : 'bg-foreground'}`}
        />
        <motion.span
          animate={isOpen ? { opacity: 0, scaleX: 0, x: -6 } : { opacity: 1, scaleX: 1, x: 0 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className={`h-[1.75px] w-3/4 self-end rounded-full ${isOpen ? 'bg-background' : 'bg-foreground'}`}
        />
        <motion.span
          animate={isOpen ? { rotate: -45, y: -5.5, width: '100%' } : { rotate: 0, y: 0, width: '100%' }}
          transition={{ duration: 0.28, ease: EASE_LUXURY }}
          className={`h-[1.75px] rounded-full origin-center ${isOpen ? 'bg-background' : 'bg-foreground'}`}
        />
      </div>
    </motion.button>
  );
}

// ─── Signature CTA Nav Join Button ───────────────────────────────────────────

function NavJoinButton() {
  return (
    <motion.div
      whileHover={{ scale: 1.04, y: -1 }}
      whileTap={{ scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    >
      <Link
        href="/register"
        className="group relative inline-flex items-center gap-2 px-5.5 py-2.5 rounded-full bg-foreground text-background text-[13.5px] font-sans font-semibold tracking-tight overflow-hidden select-none cursor-pointer shadow-sm hover:shadow-md transition-shadow duration-300"
        aria-label="Join Excelsior"
      >
        {/* Subtle Ambient Light Sweep Shimmer on Hover */}
        <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out bg-linear-to-r from-transparent via-white/25 dark:via-white/10 to-transparent pointer-events-none" />

        {/* Text */}
        <span className="relative z-10 leading-none">
          Join Society
        </span>

        {/* Dynamic Animated Arrow (Matching Homepage Arrow Animation) */}
        <ArrowUpRight
          size={14}
          strokeWidth={2.2}
          className="relative z-10 transform-gpu transition-transform duration-300 ease-out group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:scale-110"
        />
      </Link>
    </motion.div>
  );
}

// ─── Main Navbar Component ────────────────────────────────────────────────────

export default function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hoveredNav, setHoveredNav] = useState<string | null>(null);
  const [hoveredProfileItem, setHoveredProfileItem] = useState<string | null>(null);
  const [modalChromeHidden, setModalChromeHidden] = useState(false);

  const currentUser = session?.user;
  const userRole = currentUser?.role;
  const isStaffUser = currentUser ? isStaff(userRole) : false;

  // Listen for full-screen modal open state (Cardwall detail, gallery lightbox…)
  // so this header smoothly yields the screen — including the top-right corner
  // where modal close buttons live.
  useEffect(() => {
    const checkModal = () => {
      setModalChromeHidden(document.documentElement.dataset.cardwallModal === 'open');
    };
    checkModal();
    const observer = new MutationObserver(checkModal);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-cardwall-modal'],
    });
    window.addEventListener('cardwall-modal-toggle', checkModal);
    return () => {
      observer.disconnect();
      window.removeEventListener('cardwall-modal-toggle', checkModal);
    };
  }, []);

  // Body scroll lock on mobile menu open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
    } else {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    };
  }, [mobileOpen]);

  // Route change auto-close (in useEffect to prevent hydration render side-effects)
  useEffect(() => {
    setMobileOpen(false);
    setDropdownOpen(false);
    setHoveredNav(null);
  }, [pathname]);

  useEffect(() => {
    if (!dropdownOpen) return;
    const handler = () => setDropdownOpen(false);
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [dropdownOpen]);

  useEffect(() => {
    const onScroll = () => {
      const isScrolled = window.scrollY > 15;
      setScrolled((prev) => (prev !== isScrolled ? isScrolled : prev));
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const isHome = pathname === '/';
  const isActive = (path: string) => pathname === path || pathname.startsWith(path + '/');

  // ── Curated Navigation Items ──
  const publicationsItems: NavSubItem[] = [
    { label: 'Articles', href: '/publications?category=Articles', icon: Newspaper },
    { label: 'Stories', href: '/publications?category=Stories', icon: Feather },
    { label: 'Poems', href: '/publications?category=Poems', icon: PenTool },
    { label: 'Reviews', href: '/publications?category=Reviews', icon: BookMarkedIcon },
    { label: 'All Publications', href: '/publications', icon: BookOpenIcon },
  ];

  const communityItems: NavSubItem[] = [
    { label: 'Members', href: '/community/members', icon: UsersIcon },
    { label: 'Alumni', href: '/community/alumni', icon: GraduationCapIcon },
    { label: 'Gallery', href: '/community/gallery', icon: ImageIcon },
    { label: 'Library', href: '/community/library', icon: LibraryIcon },
    { label: 'Achievements', href: '/community/achievements', icon: TrophyIcon },
  ];

  // State for drill-down mobile submenu view
  const [mobileSubmenu, setMobileSubmenu] = useState<'publications' | 'community' | null>(null);

  // Close submenu on route or toggle change
  useEffect(() => {
    if (!mobileOpen) setMobileSubmenu(null);
  }, [mobileOpen]);

  // Primary Editorial Links for Full-Screen Mobile Curtain
  const mobilePrimaryLinks = [
    {
      num: '01',
      title: 'Publications',
      subtitle: 'Articles, Stories, Poems & Reviews',
      hasSubmenu: true as const,
      submenuKey: 'publications' as const,
      items: publicationsItems,
    },
    {
      num: '02',
      title: "Editor's Shelf",
      href: '/editors-shelf',
      subtitle: 'Hand-picked Literary Gems',
      hasSubmenu: false as const,
    },
    {
      num: '03',
      title: 'Events & Slams',
      href: '/events',
      subtitle: 'Competitions & Gatherings',
      hasSubmenu: false as const,
    },
    {
      num: '04',
      title: 'Community',
      subtitle: 'Members, Alumni, Library & Gallery',
      hasSubmenu: true as const,
      submenuKey: 'community' as const,
      items: communityItems,
    },
  ];

  // Framer Motion Animation Variants for Full-Screen Menu
  const curtainVariants: Variants = {
    closed: {
      y: '-100%',
      transition: {
        duration: 0.55,
        ease: EASE_LUXURY,
        when: 'afterChildren',
      },
    },
    open: {
      y: '0%',
      transition: {
        duration: 0.6,
        ease: EASE_LUXURY,
        staggerChildren: 0.05,
        delayChildren: 0.12,
      },
    },
  };

  const textMaskVariants: Variants = {
    closed: { y: '100%', opacity: 0 },
    open: {
      y: '0%',
      opacity: 1,
      transition: { duration: 0.5, ease: EASE_LUXURY },
    },
  };

  const itemFadeVariants: Variants = {
    closed: { opacity: 0, y: 15 },
    open: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.45, ease: EASE_LUXURY },
    },
  };

  return (
    <>
      {/* ── High Z-Index Isolated Header (Stays cleanly above 3D Cardwall and canvas elements.
             Smoothly fades + slides away when a full-screen modal opens, and glides
             back down when it closes.) ── */}
      <motion.header
        initial={false}
        animate={{
          opacity: modalChromeHidden ? 0 : 1,
          y: modalChromeHidden ? -14 : 0,
        }}
        transition={{ duration: 0.32, ease: EASE_LUXURY }}
        inert={modalChromeHidden}
        className={`w-full transition-[background-color,border-color,box-shadow] duration-300 ${
          modalChromeHidden ? 'pointer-events-none' : 'z-600'
        } ${isHome ? 'fixed top-0 left-0 right-0' : 'sticky top-0'} ${
          isHome
            ? scrolled
              ? 'bg-white/90 dark:bg-[#0a0a0a]/90 backdrop-blur-2xl border-b border-neutral-200/80 dark:border-neutral-800/80 shadow-xs'
              : 'bg-transparent border-b border-transparent'
            : 'bg-white/95 dark:bg-[#0a0a0a]/95 backdrop-blur-2xl border-b border-neutral-200/80 dark:border-neutral-800/80 shadow-xs'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
          <div className="flex items-center justify-between h-16">
            {/* ── Brand — Left with Liquid Hover (Pure Link with CSS transitions) ── */}
            <Link
              href="/"
              className="group relative inline-flex items-baseline select-none py-1 active:scale-[0.97] transition-transform duration-200 ease-out cursor-pointer outline-none"
              aria-label="Excelsior Home"
            >
              <Wordmark />
            </Link>

            {/* ── Desktop Nav — Center Docked with LayoutGroup for Liquid Spring Pill Glide ── */}
            <LayoutGroup id="navbar-dock-group">
              <nav
                className="hidden md:flex items-center justify-center gap-1.5 bg-foreground/2 dark:bg-white/2 border border-border/40 px-3 py-1.5 rounded-full backdrop-blur-md"
                onMouseLeave={() => setHoveredNav(null)}
                aria-label="Primary"
              >
                <NavItem
                  id="publications"
                  label="Publications"
                  items={publicationsItems}
                  active={isActive('/publications')}
                  hoveredNav={hoveredNav}
                  setHoveredNav={setHoveredNav}
                />
                <NavItem
                  id="shelf"
                  label="Shelf"
                  href="/editors-shelf"
                  active={isActive('/editors-shelf')}
                  hoveredNav={hoveredNav}
                  setHoveredNav={setHoveredNav}
                />
                <NavItem
                  id="events"
                  label="Events"
                  href="/events"
                  active={isActive('/events')}
                  hoveredNav={hoveredNav}
                  setHoveredNav={setHoveredNav}
                />
                <NavItem
                  id="community"
                  label="Community"
                  items={communityItems}
                  active={pathname.startsWith('/community')}
                  hoveredNav={hoveredNav}
                  setHoveredNav={setHoveredNav}
                />
              </nav>
            </LayoutGroup>

            {/* ── Right side actions (Spacious & clean) ── */}
            <div className="hidden md:flex items-center justify-end gap-3.5">
              <ThemeToggle />

              {currentUser && <NotificationBell />}

              {currentUser ? (
                <div className="relative" onClick={(e) => e.stopPropagation()}>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    transition={SPRING_TAP}
                    onClick={() => setDropdownOpen((v) => !v)}
                    className="flex items-center gap-1.5 rounded-full border border-border/70 bg-background/80 p-1.5 pr-2.5 shadow-xs transition-colors hover:border-foreground/30 hover:bg-foreground/5 cursor-pointer"
                    aria-expanded={dropdownOpen}
                    aria-haspopup="true"
                    aria-label="User menu"
                  >
                    {currentUser.image ? (
                      <img
                        src={getOptimizedAvatarUrl(currentUser.image, 64)}
                        alt={currentUser.name ?? 'Avatar'}
                        className="h-7 w-7 rounded-full object-cover ring-1 ring-border/80"
                      />
                    ) : (
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-foreground text-[11px] font-bold text-background">
                        {(currentUser.name ?? currentUser.username ?? 'U')[0].toUpperCase()}
                      </div>
                    )}
                    <ChevronDownIcon
                      size={12}
                      className={`text-muted-foreground transition-transform duration-200 ${dropdownOpen ? 'rotate-180 text-foreground' : ''}`}
                    />
                  </motion.button>

                  {/* ── Editorial User Dropdown with Glassmorphic Card & Fluid Sub-Slider ── */}
                  <AnimatePresence>
                    {dropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 6, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 4, scale: 0.98 }}
                        transition={{ duration: 0.16, ease: EASE_LUXURY }}
                        className="absolute right-0 top-full z-100 mt-2.5 w-64 overflow-hidden rounded-2xl border border-neutral-200/90 dark:border-neutral-800 bg-white/95 dark:bg-[#121212]/95 backdrop-blur-2xl shadow-[0_20px_45px_rgba(0,0,0,0.15)] dark:shadow-[0_20px_45px_rgba(0,0,0,0.6)] ring-1 ring-black/5 dark:ring-white/10 p-2 origin-top-right"
                      >
                        {/* Compact User Header */}
                        <div className="px-3.5 py-3 border-b border-border/50 mb-1">
                          <div className="flex items-center gap-3">
                            {currentUser.image ? (
                              <img
                                src={getOptimizedAvatarUrl(currentUser.image, 64)}
                                alt={currentUser.name ?? 'Avatar'}
                                className="h-8 w-8 rounded-full object-cover ring-1 ring-border/80 shrink-0"
                              />
                            ) : (
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-foreground text-xs font-bold text-background">
                                {(currentUser.name ?? currentUser.username ?? 'U')[0].toUpperCase()}
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-[13.5px] font-semibold text-foreground leading-tight">
                                {currentUser.name ?? currentUser.username}
                              </p>
                              <p className="truncate text-[11px] text-muted-foreground font-mono mt-0.5">
                                @{currentUser.username}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Navigation Links with Gliding Sub-Slider */}
                        <div
                          className="relative space-y-1"
                          onMouseLeave={() => setHoveredProfileItem(null)}
                        >
                          <DropdownMenuLink
                            id="workspace"
                            href="/workspace"
                            icon={PenLineIcon}
                            label="Writer Workspace"
                            hoveredId={hoveredProfileItem}
                            setHoveredId={setHoveredProfileItem}
                            onClick={() => setDropdownOpen(false)}
                          />
                          <DropdownMenuLink
                            id="profile"
                            href="/profile"
                            icon={UserIcon}
                            label="Profile"
                            hoveredId={hoveredProfileItem}
                            setHoveredId={setHoveredProfileItem}
                            onClick={() => setDropdownOpen(false)}
                          />
                          <DropdownMenuLink
                            id="notifications"
                            href="/profile/notifications"
                            icon={BellIcon}
                            label="Notifications"
                            hoveredId={hoveredProfileItem}
                            setHoveredId={setHoveredProfileItem}
                            onClick={() => setDropdownOpen(false)}
                          />
                          <DropdownMenuLink
                            id="loans"
                            href="/profile/issue-requests"
                            icon={BookMarkedIcon}
                            label="Book Loans"
                            hoveredId={hoveredProfileItem}
                            setHoveredId={setHoveredProfileItem}
                            onClick={() => setDropdownOpen(false)}
                          />

                          {isStaffUser && (
                            <>
                              <div className="my-1 border-t border-border/40" />
                              <DropdownMenuLink
                                id="admin"
                                href="/admin"
                                icon={LayoutDashboardIcon}
                                label="Admin Console"
                                hoveredId={hoveredProfileItem}
                                setHoveredId={setHoveredProfileItem}
                                onClick={() => setDropdownOpen(false)}
                              />
                            </>
                          )}

                          <div className="my-1 border-t border-border/40" />

                          <button
                            onClick={() => signOut({ callbackUrl: '/' })}
                            onMouseEnter={() => setHoveredProfileItem('logout')}
                            className="relative flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-[13.5px] transition-colors duration-150 cursor-pointer"
                          >
                            {hoveredProfileItem === 'logout' && (
                              <motion.div
                                layoutId="profile-sub-pill"
                                className="absolute inset-0 z-0 rounded-xl bg-red-500/10 dark:bg-red-500/15 pointer-events-none"
                                transition={SPRING_SUB}
                              />
                            )}
                            <div className="relative z-10 flex items-center gap-3">
                              <LogOutIcon
                                size={16}
                                strokeWidth={1.75}
                                className={`transition-opacity duration-150 ${
                                  hoveredProfileItem === 'logout' ? 'text-red-500 opacity-100' : 'text-red-500/70 opacity-70'
                                }`}
                              />
                              <span
                                className={`transition-colors duration-150 ${
                                  hoveredProfileItem === 'logout' ? 'text-red-500 font-medium' : 'text-red-500/80'
                                }`}
                              >
                                Log out
                              </span>
                            </div>
                            <ArrowUpRight
                              size={14}
                              className={`relative z-10 text-red-500 transition-all duration-150 ${
                                hoveredProfileItem === 'logout'
                                  ? 'opacity-100 translate-x-0 translate-y-0'
                                  : 'opacity-0 -translate-x-1 translate-y-1'
                              }`}
                            />
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <NavJoinButton />
              )}
            </div>

            {/* ── Mobile Action Bar ── */}
            <div className="md:hidden flex items-center justify-end gap-2.5">
              <ThemeToggle />
              {currentUser && <NotificationBell />}
              <AnimatedHamburger isOpen={mobileOpen} toggle={() => setMobileOpen((v) => !v)} />
            </div>
          </div>
        </div>
      </motion.header>

      {/* ── Full-Screen Kinetic Curtain Mobile Navigation with Drill-Down Submenus ── */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial="closed"
            animate="open"
            exit="closed"
            variants={curtainVariants}
            className="fixed inset-0 z-550 flex flex-col justify-between bg-background/98 dark:bg-[#080808]/98 backdrop-blur-3xl pt-20 pb-8 px-6 md:hidden overflow-y-auto"
          >
            {/* ── Top Header Strip ── */}
            <motion.div
              variants={itemFadeVariants}
              className="flex items-center justify-between border-b border-border/50 pb-3.5"
            >
              {mobileSubmenu ? (
                <button
                  onClick={() => setMobileSubmenu(null)}
                  className="flex items-center gap-2 text-foreground text-xs font-semibold uppercase tracking-wider hover:opacity-80 transition-opacity cursor-pointer"
                >
                  <ArrowLeft size={14} />
                  <span>Back to Main Menu</span>
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <CompassIcon size={14} className="text-foreground animate-spin-slow" />
                  <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground/90 font-medium">
                    Index · Directory
                  </span>
                </div>
              )}
              <span className="font-mono text-[11px] tracking-widest text-muted-foreground/60">
                VOL. MMXXVI
              </span>
            </motion.div>

            {/* ── Main View vs Submenu Drill-Down View ── */}
            <div className="py-6 min-h-70 flex flex-col justify-center">
              <AnimatePresence mode="wait">
                {mobileSubmenu ? (
                  /* ── Submenu Drill-Down Options ── */
                  <motion.div
                    key={mobileSubmenu}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.24, ease: EASE_LUXURY }}
                    className="space-y-3"
                  >
                    <div className="mb-4">
                      <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground/60">
                        Section
                      </span>
                      <h2
                        className="text-3xl font-medium text-foreground tracking-tight"
                        style={{ fontFamily: 'var(--font-playfair), "Playfair Display", Georgia, serif' }}
                      >
                        {mobileSubmenu === 'publications' ? 'Publications' : 'Community'}
                      </h2>
                    </div>

                    <div className="space-y-2">
                      {(mobileSubmenu === 'publications' ? publicationsItems : communityItems).map((subItem) => {
                        const Icon = subItem.icon;
                        const active = isActive(subItem.href);
                        return (
                          <Link
                            key={subItem.href}
                            href={subItem.href}
                            onClick={() => {
                              setMobileOpen(false);
                              setMobileSubmenu(null);
                            }}
                            className={`group flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                              active
                                ? 'bg-foreground/8 border-foreground/30 text-foreground font-semibold'
                                : 'bg-foreground/2 border-border/50 text-muted-foreground hover:text-foreground hover:bg-foreground/5'
                            }`}
                          >
                            <div className="flex items-center gap-3.5">
                              <div className="p-2 rounded-xl bg-foreground/5 text-foreground">
                                <Icon size={18} strokeWidth={1.75} />
                              </div>
                              <span className="text-base font-medium tracking-tight">
                                {subItem.label}
                              </span>
                            </div>
                            <ArrowUpRight
                              size={16}
                              className="text-muted-foreground/60 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-foreground"
                            />
                          </Link>
                        );
                      })}
                    </div>
                  </motion.div>
                ) : (
                  /* ── Clean Main Menu Options ── */
                  <motion.div
                    key="main-menu"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.24, ease: EASE_LUXURY }}
                    className="space-y-4"
                  >
                    {mobilePrimaryLinks.map((item) => {
                      const active = item.href ? isActive(item.href) : false;

                      if (item.hasSubmenu) {
                        return (
                          <button
                            key={item.title}
                            onClick={() => {
                              if ('submenuKey' in item && item.submenuKey) {
                                setMobileSubmenu(item.submenuKey);
                              }
                            }}
                            className="group w-full flex flex-col py-3 border-b border-border/30 text-left transition-all cursor-pointer"
                          >
                            <div className="flex items-baseline justify-between w-full">
                              <div className="flex items-baseline gap-3.5">
                                <span className="font-mono text-xs text-muted-foreground/50 font-light">
                                  {item.num}
                                </span>
                                <span
                                  className="text-2xl sm:text-3xl font-light tracking-tight text-foreground transition-all duration-300 group-hover:translate-x-1.5"
                                  style={{ fontFamily: 'var(--font-playfair), "Playfair Display", Georgia, serif' }}
                                >
                                  {item.title}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 text-muted-foreground group-hover:text-foreground">
                                <span className="text-[11px] font-mono uppercase tracking-widest opacity-60">Explore</span>
                                <ChevronRight size={16} />
                              </div>
                            </div>
                            <span className="pl-8 text-xs text-muted-foreground/60 tracking-wide font-sans mt-1">
                              {item.subtitle}
                            </span>
                          </button>
                        );
                      }

                      return (
                        <Link
                          key={item.title}
                          href={item.href!}
                          onClick={() => setMobileOpen(false)}
                          className="group flex flex-col py-3 border-b border-border/30 transition-all"
                        >
                          <div className="flex items-baseline justify-between">
                            <div className="flex items-baseline gap-3.5">
                              <span className="font-mono text-xs text-muted-foreground/50 font-light">
                                {item.num}
                              </span>
                              <span
                                className={`text-2xl sm:text-3xl font-light tracking-tight transition-all duration-300 group-hover:translate-x-1.5 ${
                                  active ? 'text-foreground font-normal' : 'text-foreground hover:text-foreground'
                                }`}
                                style={{ fontFamily: 'var(--font-playfair), "Playfair Display", Georgia, serif' }}
                              >
                                {item.title}
                              </span>
                            </div>
                            <ArrowUpRight
                              size={18}
                              className="text-muted-foreground/40 transition-all duration-300 group-hover:text-foreground group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                            />
                          </div>
                          <span className="pl-8 text-xs text-muted-foreground/60 tracking-wide font-sans mt-1">
                            {item.subtitle}
                          </span>
                        </Link>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* ── User Profile & Mobile Footer Dock ── */}
            <motion.div
              variants={itemFadeVariants}
              className="pt-5 mt-auto border-t border-border/50 space-y-3.5"
            >
              {currentUser ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3.5 rounded-2xl bg-foreground/3 border border-border/60">
                    <div className="flex items-center gap-3">
                      {currentUser.image ? (
                        <img
                          src={getOptimizedAvatarUrl(currentUser.image, 80)}
                          alt={currentUser.name ?? 'Avatar'}
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-foreground text-sm font-bold text-background">
                          {(currentUser.name ?? currentUser.username ?? 'U')[0].toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="text-[14px] font-semibold text-foreground leading-tight">
                          {currentUser.name}
                        </p>
                        <p className="text-[11px] font-mono text-muted-foreground tracking-wide mt-0.5">
                          @{currentUser.username}
                        </p>
                      </div>
                    </div>

                    <Link
                      href="/workspace"
                      onClick={() => setMobileOpen(false)}
                      className="px-4 py-2 rounded-xl bg-foreground text-background text-xs font-semibold hover:opacity-90 active:scale-95 transition-all shadow-sm"
                    >
                      Workspace
                    </Link>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <Link
                      href="/profile"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-foreground/4 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <UserIcon size={14} />
                      Profile
                    </Link>
                    <Link
                      href="/profile/issue-requests"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-foreground/4 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <BookMarkedIcon size={14} />
                      Loans
                    </Link>
                    <button
                      onClick={() => signOut({ callbackUrl: '/' })}
                      className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-500/10 text-xs font-medium text-red-500 hover:bg-red-500/20 transition-colors cursor-pointer"
                    >
                      <LogOutIcon size={14} />
                      Log out
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-2.5">
                  <Link
                    href="/register"
                    onClick={() => setMobileOpen(false)}
                    className="group relative flex items-center justify-center gap-2 w-full py-4 rounded-full bg-foreground text-background text-xs font-semibold uppercase tracking-wider overflow-hidden active:scale-98 transition-all shadow-md"
                  >
                    {/* Ambient Light Sweep Shimmer on Hover */}
                    <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out bg-linear-to-r from-transparent via-white/25 dark:via-white/10 to-transparent pointer-events-none" />
                    <span className="relative z-10">Join Excelsior Society</span>
                    <ArrowUpRight
                      size={15}
                      className="relative z-10 transform-gpu transition-transform duration-300 ease-out group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:scale-110"
                    />
                  </Link>
                  <Link
                    href="/login"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-center py-2.5 text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors font-medium"
                  >
                    Already a member? Sign in
                  </Link>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ─── Helper Components ────────────────────────────────────────────────────────

function DropdownMenuLink({
  id,
  href,
  icon: Icon,
  label,
  hoveredId,
  setHoveredId,
  onClick,
}: {
  id: string;
  href: string;
  icon: LucideIcon;
  label: string;
  hoveredId: string | null;
  setHoveredId: (id: string | null) => void;
  onClick?: () => void;
}) {
  const isHovered = hoveredId === id;
  return (
    <Link
      href={href}
      onClick={onClick}
      onMouseEnter={() => setHoveredId(id)}
      className="relative flex items-center justify-between rounded-xl px-3.5 py-2.5 text-[13.5px] transition-colors duration-150"
    >
      {isHovered && (
        <motion.div
          layoutId="profile-sub-pill"
          className="absolute inset-0 z-0 rounded-xl bg-foreground/6 dark:bg-white/8 pointer-events-none"
          transition={SPRING_SUB}
        />
      )}

      <div className="relative z-10 flex items-center gap-3">
        <Icon
          size={16}
          strokeWidth={1.75}
          className={`transition-opacity duration-150 ${
            isHovered ? 'opacity-100 text-foreground' : 'opacity-70 text-muted-foreground'
          }`}
        />
        <span
          className={`transition-colors duration-150 ${
            isHovered ? 'text-foreground font-medium' : 'text-muted-foreground'
          }`}
        >
          {label}
        </span>
      </div>

      <ArrowUpRight
        size={14}
        className={`relative z-10 transition-all duration-150 ${
          isHovered
            ? 'opacity-100 translate-x-0 translate-y-0 text-foreground'
            : 'opacity-0 -translate-x-1 translate-y-1 text-muted-foreground'
        }`}
      />
    </Link>
  );
}
