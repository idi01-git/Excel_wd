'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import { Mail, ArrowRight } from 'lucide-react';

const InstagramIcon = ({ size = 18 }: { size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
  </svg>
);

const LinkedinIcon = ({ size = 18 }: { size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
    <rect width="4" height="12" x="2" y="9"/>
    <circle cx="4" cy="4" r="2"/>
  </svg>
);

const MARQUEE_ITEMS = [
  'Stories',
  'Poetry',
  'Essays',
  'Discourse',
  'Critique',
  'Fiction',
  'Slams',
  'Anthology',
];

const EXPLORE_LINKS = [
  { label: 'Publications', href: '/publications' },
  { label: "Editor's Shelf", href: '/editors-shelf' },
  { label: 'Events', href: '/events' },
  { label: 'Search', href: '/search' },
];

const COMMUNITY_LINKS = [
  { label: 'Members', href: '/community/members' },
  { label: 'Library', href: '/community/library' },
  { label: 'Gallery', href: '/community/gallery' },
  { label: 'Alumni', href: '/community/alumni' },
];

export default function Footer() {
  const { data: session } = useSession();
  const [groups, setGroups] = useState([{ heading: 'Explore', links: EXPLORE_LINKS }, { heading: 'Community', links: COMMUNITY_LINKS }]);
  useEffect(() => { void fetch('/api/site-settings').then((response) => response.json()).then((data) => { const saved = data.settings?.['footer.links']; if (Array.isArray(saved?.groups) && saved.groups.length >= 2) setGroups(saved.groups); }).catch(() => {}); }, []);
  return (
    <footer className="relative mt-auto bg-foreground text-background">
      {/* Marquee */}
      <div className="overflow-hidden border-b border-background/15 py-4">
        <div className="animate-marquee flex w-max items-center whitespace-nowrap will-change-transform">
          {[0, 1].map((copy) => (
            <div
              key={copy}
              aria-hidden={copy === 1}
              className="flex items-center font-mono text-[11px] uppercase tracking-[0.32em] text-background/50"
            >
              {MARQUEE_ITEMS.map((item) => (
                <span key={`${copy}-${item}`} className="flex items-center">
                  <span className="px-6">{item}</span>
                  <span className="text-background/30">✦</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 pb-10 pt-16 md:px-10 md:pt-24">
        {/* Giant wordmark */}
        <Link
          href="/"
          className="block font-display text-[clamp(3.8rem,13vw,11rem)] font-medium leading-[0.9] tracking-[-0.04em] text-background transition-opacity duration-300 hover:opacity-80"
        >
          Excelsior<span className="italic">.</span>
        </Link>

        {/* Grid */}
        <div className="mt-14 grid grid-cols-1 gap-10 border-t border-background/15 pt-10 md:mt-20 md:grid-cols-12 md:gap-8">
          <div className="md:col-span-5 flex flex-col items-start">
            <p className="max-w-sm text-sm leading-relaxed text-background/60">
              Constructing stories, preserving poetry, and building community —
              a sanctuary for campus writers and journalists since 2015.
            </p>
            {!session && (
              <motion.div
                whileHover={{ scale: 1.04, y: -1 }}
                whileTap={{ scale: 0.96 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                className="mt-7"
              >
                <Link
                  href="/register"
                  className="group relative inline-flex items-center gap-2.5 rounded-full border border-background/40 bg-background/5 hover:bg-background hover:text-foreground px-6 py-3 font-mono text-[11px] uppercase tracking-[0.2em] text-background overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer"
                >
                  {/* Subtle Ambient Light Sweep Shimmer on Hover */}
                  <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
                  
                  <span className="relative z-10">Join the society</span>
                  
                  {/* Dynamic Animated Arrow (Matching Homepage Arrow Animation) */}
                  <ArrowRight
                    size={13}
                    className="relative z-10 transform-gpu transition-all duration-300 ease-out group-hover:translate-x-1.5 group-hover:scale-110"
                  />
                </Link>
              </motion.div>
            )}
            
            {/* Social Links */}
            <div className={`flex items-center gap-5 ${session ? 'mt-8' : 'mt-8'}`}>
              <a
                href="https://instagram.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-background/50 transition-colors hover:text-background"
                aria-label="Instagram"
              >
                <InstagramIcon size={18} />
              </a>
              <a
                href="https://linkedin.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-background/50 transition-colors hover:text-background"
                aria-label="LinkedIn"
              >
                <LinkedinIcon size={18} />
              </a>
              <a
                href="mailto:excelsior@ietlucknow.ac.in"
                className="text-background/50 transition-colors hover:text-background"
                aria-label="Email"
              >
                <Mail size={18} />
              </a>
            </div>
          </div>

          <nav className="md:col-span-3 md:col-start-7" aria-label={groups[0]?.heading || "Explore"}>
            <h4 className="font-mono text-[10px] uppercase tracking-[0.28em] text-background/40">
              Explore
            </h4>
            <ul className="mt-5 space-y-3">
              {(groups[0]?.links || EXPLORE_LINKS).map((link: { label: string; href: string }) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-background/70 transition-colors duration-200 hover:text-background"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav className="md:col-span-3" aria-label={groups[1]?.heading || "Community"}>
            <h4 className="font-mono text-[10px] uppercase tracking-[0.28em] text-background/40">
              Community
            </h4>
            <ul className="mt-5 space-y-3">
              {(groups[1]?.links || COMMUNITY_LINKS).map((link: { label: string; href: string }) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-background/70 transition-colors duration-200 hover:text-background"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* Bottom bar */}
        <div className="mt-14 flex flex-col gap-4 border-t border-background/15 pt-6 font-mono text-[10px] uppercase tracking-[0.22em] text-background/40 sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} Excelsior Literary Society</span>
          <span>
            Brought into Existence by{' '}
            <a
              href="https://www.linkedin.com/in/shivang-idi01/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-background/80 underline underline-offset-4 decoration-background/30 transition-colors hover:text-background hover:decoration-background"
            >
              Shivang
            </a>{' '}
            ❤️
          </span>
          <span>Est. 2015 · Still in print</span>
        </div>
      </div>
    </footer>
  );
}
