// src/components/Navbar.tsx
'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  BookOpenIcon,
  PenLineIcon,
  CalendarDaysIcon,
  UsersIcon,
  LibraryIcon,
  TrophyIcon,
  ImageIcon,
  UserIcon,
  BookMarkedIcon,
  ShieldCheckIcon,
  CalendarCogIcon,
  BookCopyIcon,
  LogOutIcon,
  MenuIcon,
  XIcon,
  ChevronDownIcon,
  GraduationCapIcon,
  Newspaper,
  PenTool,
  Feather,
  LayoutGrid,
} from 'lucide-react';
import NotificationBell from '@/components/navigation/NotificationBell';
import GlobalSearchBar from '@/components/navigation/GlobalSearchBar';
import ThemeToggle from '@/components/ThemeToggle';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
  NavigationMenuLink,
} from '@/components/ui/navigation-menu';

// ─── Nav item shape ───────────────────────────────────────────────────────────

interface NavSubItem {
  label: string;
  href: string;
  description?: string;
  icon: React.ElementType;
}

// ─── Dropdown link item ───────────────────────────────────────────────────────

function DropdownLink({ item, onClick }: { item: NavSubItem; onClick?: () => void }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onClick}
      className="flex items-start gap-3.5 p-3 rounded-xl group hover:bg-gray-50 transition-all duration-200"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gray-50 dark:bg-white/5 group-hover:bg-white dark:group-hover:bg-white/10 border border-gray-100 dark:border-white/10 group-hover:border-gray-200/80 dark:group-hover:border-white/20 text-gray-500 dark:text-neutral-400 group-hover:text-black dark:group-hover:text-white transition-all duration-200 shadow-[0_1px_2px_rgba(0,0,0,0.02)] group-hover:shadow-md group-hover:shadow-black/5 dark:shadow-none">
        <Icon size={16} strokeWidth={1.8} />
      </span>
      <div className="min-w-0">
        <p className="text-[13px] font-semibold text-gray-800 dark:text-neutral-200 group-hover:text-gray-950 dark:group-hover:text-white leading-none mb-1 transition-colors duration-200">
          {item.label}
        </p>
        {item.description && (
          <p className="text-[11.5px] text-gray-400 dark:text-neutral-500 group-hover:text-gray-500 dark:group-hover:text-neutral-400 leading-snug line-clamp-1 transition-colors duration-200">
            {item.description}
          </p>
        )}
      </div>
    </Link>
  );
}

// ─── Main Navbar ──────────────────────────────────────────────────────────────

export default function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const currentUser = session?.user;
  const showModLink = currentUser?.role === 'MODERATOR' || currentUser?.role === 'ADMIN';

  useEffect(() => {
    setMobileOpen(false);
    setDropdownOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!dropdownOpen) return;
    const handler = () => setDropdownOpen(false);
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [dropdownOpen]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const isActive = (path: string) => pathname === path || pathname.startsWith(path + '/');

  // ── Nav link pill styles ──
  const navLinkClass = (active: boolean) =>
    `relative text-[13px] font-semibold tracking-wide transition-all duration-200 px-3.5 py-2 rounded-full ${
      active
        ? 'text-gray-950 dark:text-white bg-gray-50 dark:bg-white/10 border border-gray-200/50 dark:border-white/10 shadow-[0_1px_2px_rgba(0,0,0,0.02)] dark:shadow-none'
        : 'text-gray-500 dark:text-neutral-400 border border-transparent hover:text-gray-900 dark:hover:text-white hover:bg-gray-50/80 dark:hover:bg-white/5'
    }`;

  // ── Dropdown data ──
  const publicationsItems: NavSubItem[] = [
    { label: 'Articles', href: '/publications?category=Articles', icon: Newspaper, description: 'Analysis, thought pieces & reviews' },
    { label: 'Stories', href: '/publications?category=Stories', icon: PenTool, description: 'Fiction, short stories & tales' },
    { label: 'Poems', href: '/publications?category=Poems', icon: Feather, description: 'Verse, lyrical prose & rhymes' },
    { label: 'Reviews', href: '/publications?category=Reviews', icon: BookMarkedIcon, description: 'Book analysis & commentary' },
    { label: 'View All', href: '/publications', icon: LayoutGrid, description: 'Explore all published literature' },
  ];

  const communityItems: NavSubItem[] = [
    { label: 'Members', href: '/community/members', icon: UsersIcon, description: 'Meet current active members' },
    { label: 'Alumni Network', href: '/community/alumni', icon: GraduationCapIcon, description: 'Connect with senior graduates' },
    { label: 'Club Gallery', href: '/community/gallery', icon: ImageIcon, description: 'Event posters & capture memories' },
    { label: 'Goodreads Library', href: '/community/library', icon: LibraryIcon, description: 'Physical book catalog & issue logs' },
  ];

  const eventsItems: NavSubItem[] = [
    { label: 'All Events', href: '/events', icon: CalendarDaysIcon, description: 'Poetry slams, workshops & meets' },
    { label: 'Contest Winners', href: '/events/winners', icon: TrophyIcon, description: 'Celebrating club tournament achievements' },
  ];

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        scrolled
          ? 'bg-white/80 dark:bg-[#000000]/80 backdrop-blur-xl border-b border-gray-200/40 dark:border-white/10 shadow-[0_2px_8px_rgba(0,0,0,0.02)] dark:shadow-none'
          : 'bg-white/70 dark:bg-[#000000]/70 backdrop-blur-md border-b border-gray-200/20 dark:border-white/5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* ── Beautiful Serif Text Logo ── */}
          <Link href="/" className="flex items-center shrink-0">
            <span className="font-serif text-2xl font-bold tracking-tight lowercase text-black dark:text-white hover:text-gray-700 dark:hover:text-neutral-300 transition-colors">
              excelsior
            </span>
          </Link>

          {/* ── Desktop NavigationMenu ── */}
          <NavigationMenu viewport={false} className="hidden md:flex ml-4">
            <NavigationMenuList className="gap-1">

              {/* Publications — dropdown */}
              <NavigationMenuItem>
                <NavigationMenuTrigger
                  className={`${navLinkClass(isActive('/publications'))} bg-transparent! data-[state=open]:bg-gray-50 dark:data-[state=open]:bg-white/5 data-[state=open]:text-gray-950 dark:data-[state=open]:text-white data-[state=open]:border-gray-200/50 dark:data-[state=open]:border-white/10 hover:bg-gray-50! dark:hover:bg-white/5!`}
                >
                  Publications
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div className="w-80 p-2 bg-white dark:bg-neutral-900 border border-gray-200/60 dark:border-white/10 rounded-2xl shadow-2xl shadow-gray-200/50 dark:shadow-none">
                    {publicationsItems.map((item) => (
                      <DropdownLink key={item.href} item={item} />
                    ))}
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>

              {/* Shelf — simple link */}
              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <Link
                    href="/editors-shelf"
                    className={navLinkClass(isActive('/editors-shelf'))}
                  >
                    Shelf
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>

              {/* Events — dropdown */}
              <NavigationMenuItem>
                <NavigationMenuTrigger
                  className={`${navLinkClass(isActive('/events'))} bg-transparent! data-[state=open]:bg-gray-50 dark:data-[state=open]:bg-white/5 data-[state=open]:text-gray-950 dark:data-[state=open]:text-white data-[state=open]:border-gray-200/50 dark:data-[state=open]:border-white/10 hover:bg-gray-50! dark:hover:bg-white/5!`}
                >
                  Events
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div className="w-80 p-2 bg-white dark:bg-neutral-900 border border-gray-200/60 dark:border-white/10 rounded-2xl shadow-2xl shadow-gray-200/50 dark:shadow-none">
                    {eventsItems.map((item) => (
                      <DropdownLink key={item.href} item={item} />
                    ))}
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>

              {/* Community — dropdown */}
              <NavigationMenuItem>
                <NavigationMenuTrigger
                  className={`${navLinkClass(pathname.startsWith('/community'))} bg-transparent! data-[state=open]:bg-gray-50 dark:data-[state=open]:bg-white/5 data-[state=open]:text-gray-950 dark:data-[state=open]:text-white data-[state=open]:border-gray-200/50 dark:data-[state=open]:border-white/10 hover:bg-gray-50! dark:hover:bg-white/5!`}
                >
                  Community
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div className="w-80 p-2 bg-white dark:bg-neutral-900 border border-gray-200/60 dark:border-white/10 rounded-2xl shadow-2xl shadow-gray-200/50 dark:shadow-none">
                    {communityItems.map((item) => (
                      <DropdownLink key={item.href} item={item} />
                    ))}
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>

            </NavigationMenuList>
          </NavigationMenu>

          {/* ── Right side actions ── */}
          <div className="hidden md:flex items-center gap-3">

            {/* Theme Switcher */}
            <motion.div layout transition={{ type: "spring", stiffness: 350, damping: 30 }}>
              <ThemeToggle />
            </motion.div>

            {/* Search Component (Expandable) */}
            <GlobalSearchBar />

            {/* Notification bell (logged in only) */}
            {currentUser && (
              <motion.div layout transition={{ type: "spring", stiffness: 350, damping: 30 }}>
                <NotificationBell />
              </motion.div>
            )}

            {currentUser ? (
              /* Profile dropdown */
              <motion.div layout transition={{ type: "spring", stiffness: 350, damping: 30 }} className="relative" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => setDropdownOpen((v) => !v)}
                  className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full border border-gray-200 hover:border-gray-300 hover:bg-gray-50/50 transition-all duration-200"
                >
                  <img
                    src={currentUser.profilePhoto || `https://api.dicebear.com/7.x/adventurer/svg?seed=${currentUser.username}`}
                    alt={currentUser.name || 'User'}
                    className="w-6 h-6 rounded-full object-cover border border-gray-200 dark:border-white/10"
                  />
                  <span className="text-[13px] font-semibold text-gray-700 dark:text-neutral-200 max-w-[80px] truncate">{currentUser.name}</span>
                  <ChevronDownIcon
                    size={12}
                    className={`text-gray-400 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                <AnimatePresence>
                  {dropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -6, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -4, scale: 0.97 }}
                      transition={{ duration: 0.15, ease: 'easeOut' }}
                      className="absolute right-0 mt-2 w-56 bg-white dark:bg-neutral-900 border border-gray-200/80 dark:border-white/10 rounded-2xl shadow-2xl shadow-gray-200/60 dark:shadow-none py-1.5 z-50"
                    >
                      {/* User info */}
                      <div className="px-3 py-2 border-b border-gray-100 dark:border-white/5 mb-1">
                        <p className="text-[13px] font-semibold text-gray-900 dark:text-white truncate">{currentUser.name}</p>
                        <p className="text-[11px] text-gray-450 dark:text-neutral-400 truncate">@{currentUser.username}</p>
                        <span className="inline-block mt-1 px-1.5 py-0.5 bg-gray-100 dark:bg-white/10 text-black dark:text-white border border-gray-200 dark:border-white/10 text-[9px] uppercase font-bold rounded-md tracking-wide">
                          {currentUser.role}
                        </span>
                      </div>

                      {/* Workspace link is here now */}
                      <DropdownMenuLink href="/workspace" icon={PenLineIcon} label="Writer Workspace" />
                      <DropdownMenuLink href="/profile" icon={UserIcon} label="My Profile" />
                      <DropdownMenuLink href="/profile/issue-requests" icon={BookMarkedIcon} label="My Book Loans" />

                      {showModLink && (
                        <>
                          <div className="my-1.5 mx-3 h-px bg-gray-100 dark:bg-white/5" />
                          <DropdownMenuLink href="/admin/events" icon={CalendarCogIcon} label="Manage Events" />
                          {currentUser.role === 'ADMIN' && (
                            <DropdownMenuLink href="/admin/library" icon={BookCopyIcon} label="Manage Library" />
                          )}
                          <DropdownMenuLink href="/moderator/pending" icon={ShieldCheckIcon} label="Moderation Queue" />
                        </>
                      )}

                      <div className="my-1.5 mx-3 h-px bg-gray-100 dark:bg-white/5" />
                      <button
                        onClick={() => signOut({ callbackUrl: '/' })}
                        className="flex w-full items-center gap-2.5 px-3 py-2 text-[13px] font-semibold text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors rounded-lg"
                      >
                        <LogOutIcon size={14} strokeWidth={2} />
                        Log Out
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ) : (
              /* Logged out — Premium Join CTA (No Login Button) */
              <motion.div layout transition={{ type: "spring", stiffness: 350, damping: 30 }}>
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center px-5 py-2 rounded-full text-xs font-semibold text-white dark:text-black bg-black dark:bg-white hover:bg-gray-900 dark:hover:bg-neutral-200 transition-all duration-200 shadow-sm hover:shadow"
                >
                  Join
                </Link>
              </motion.div>
            )}
          </div>

          {/* ── Mobile hamburger ── */}
          <div className="md:hidden flex items-center gap-2">
            <ThemeToggle />
            <GlobalSearchBar />
            {currentUser && <NotificationBell />}
            <button
              onClick={() => setMobileOpen((v) => !v)}
              className="p-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
              aria-label="Toggle menu"
            >
              {mobileOpen ? <XIcon size={20} /> : <MenuIcon size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* ── Mobile drawer ── */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="md:hidden overflow-hidden bg-white dark:bg-[#000000] border-t border-gray-200/60 dark:border-white/10"
          >
            <div className="px-4 py-4 space-y-1">
              <MobileLink href="/publications" label="Publications" icon={BookOpenIcon} active={isActive('/publications')} />
              <MobileLink href="/editors-shelf" label="Editor's Shelf" icon={BookMarkedIcon} active={isActive('/editors-shelf')} />
              <MobileLink href="/events" label="Events" icon={CalendarDaysIcon} active={isActive('/events')} />
              <MobileLink href="/events/winners" label="Winners Hall" icon={TrophyIcon} active={isActive('/events/winners')} />
              <MobileLink href="/community/members" label="Members" icon={UsersIcon} active={isActive('/community/members')} />
              <MobileLink href="/community/library" label="Library" icon={LibraryIcon} active={isActive('/community/library')} />

              {currentUser && (
                <>
                  <div className="h-px bg-gray-100 my-2" />
                  <MobileLink href="/workspace" label="Workspace" icon={PenLineIcon} active={isActive('/workspace')} />
                  <MobileLink href="/profile" label="My Profile" icon={UserIcon} active={false} />
                  <MobileLink href="/profile/notifications" label="Notifications" icon={UsersIcon} active={false} />
                  <MobileLink href="/profile/issue-requests" label="My Book Loans" icon={BookMarkedIcon} active={false} />
                </>
              )}

              {showModLink && (
                <>
                  <div className="h-px bg-gray-100 my-2" />
                  <MobileLink href="/moderator/pending" label="Moderation" icon={ShieldCheckIcon} active={isActive('/moderator')} />
                </>
              )}

              <div className="pt-3 border-t border-gray-100 mt-3">
                {currentUser ? (
                  <button
                    onClick={() => signOut({ callbackUrl: '/' })}
                    className="flex w-full items-center gap-2 px-3 py-2.5 rounded-lg text-[13px] font-semibold text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <LogOutIcon size={15} strokeWidth={2} />
                    Log Out
                  </button>
                ) : (
                  <Link
                    href="/register"
                    className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-xs font-semibold text-white bg-gray-900 hover:bg-gray-800"
                  >
                    Join
                  </Link>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

// ─── Helper components ────────────────────────────────────────────────────────

function DropdownMenuLink({ href, icon: Icon, label }: { href: string; icon: React.ElementType; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2.5 px-3 py-2.5 text-[13px] font-semibold text-gray-600 dark:text-neutral-400 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white transition-colors rounded-xl"
    >
      <Icon size={15} strokeWidth={1.8} className="text-gray-400 dark:text-neutral-500" />
      {label}
    </Link>
  );
}

function MobileLink({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  icon: React.ElementType;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-colors ${
        active ? 'bg-gray-100 dark:bg-white/10 text-black dark:text-white' : 'text-gray-600 dark:text-neutral-400 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-black dark:hover:text-white'
      }`}
    >
      <Icon size={16} strokeWidth={1.8} className={active ? 'text-black dark:text-white' : 'text-gray-400 dark:text-neutral-500'} />
      {label}
    </Link>
  );
}
