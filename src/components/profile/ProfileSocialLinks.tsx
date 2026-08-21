'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Globe, Mail } from 'lucide-react';
import { cn } from '@/lib/utils';

function InstagramIcon({ size = 15, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

function LinkedinIcon({ size = 15, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect width="4" height="12" x="2" y="9" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}

function GithubIcon({ size = 15, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  );
}

function TwitterIcon({ size = 15, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

interface SocialLinkItem {
  id: string;
  name: string;
  url: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  fillBg: string;
  textColor: string;
  shadowColor: string;
}

function SpringSocialButton({ item }: { item: SocialLinkItem }) {
  const [hovered, setHovered] = useState(false);
  const Icon = item.icon;

  return (
    <motion.a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      title={item.name}
      aria-label={item.name}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      whileHover={{ scale: 1.15, y: -2 }}
      whileTap={{ scale: 0.92 }}
      transition={{ type: "spring", stiffness: 450, damping: 18 }}
      className={cn(
        "relative flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full border border-neutral-200/90 dark:border-neutral-800 bg-white/90 dark:bg-[#121212] text-neutral-600 dark:text-neutral-300 transition-colors duration-200 overflow-hidden cursor-pointer shadow-xs",
        hovered && "border-transparent"
      )}
    >
      {/* Expanding Pill Background */}
      <motion.div
        initial={false}
        animate={{
          scale: hovered ? 1 : 0,
          opacity: hovered ? 1 : 0,
        }}
        transition={{ type: "spring", stiffness: 400, damping: 20 }}
        className={cn("absolute inset-0 rounded-full", item.fillBg, item.shadowColor)}
      />

      {/* Icon */}
      <motion.div
        animate={{
          scale: hovered ? 1.05 : 1,
          color: hovered ? item.textColor : undefined,
        }}
        transition={{ type: "spring", stiffness: 400, damping: 18 }}
        className="relative z-10 flex items-center justify-center"
      >
        <Icon
          size={15}
          className={cn(
            "transition-colors duration-200",
            hovered ? item.textColor : "text-neutral-600 dark:text-neutral-300"
          )}
        />
      </motion.div>
    </motion.a>
  );
}

export interface ProfileSocialLinksProps {
  socialLinks?: any;
  showSocialLinks?: boolean;
  email?: string | null;
  showEmail?: boolean;
  // Legacy support for direct props
  instagram?: string | null;
  linkedin?: string | null;
  twitter?: string | null;
  github?: string | null;
  website?: string | null;
}

export default function ProfileSocialLinks({
  socialLinks,
  showSocialLinks = true,
  email,
  showEmail = false,
  instagram,
  linkedin,
  twitter,
  github,
  website,
}: ProfileSocialLinksProps) {
  // If user disabled social links globally, return null
  if (showSocialLinks === false) {
    return null;
  }

  // Extract from socialLinks array or fallback to direct props
  let ghUrl: string | null = github || null;
  let liUrl: string | null = linkedin || null;
  let twUrl: string | null = twitter || null;
  let igUrl: string | null = instagram || null;
  let webUrl: string | null = website || null;
  let userShowEmail = showEmail;

  if (Array.isArray(socialLinks)) {
    for (const item of socialLinks) {
      if (!item) continue;
      
      // Check for email toggle object
      if (item.platform === 'email') {
        if (item.enabled !== false && item.showEmail !== false) {
          userShowEmail = true;
        } else {
          userShowEmail = false;
        }
        continue;
      }

      // Check if individual item is disabled
      if (item.enabled === false) {
        continue;
      }

      if (!item.url) continue;
      const url = item.url.trim();
      if (!url.startsWith('http://') && !url.startsWith('https://')) continue;

      if (item.platform === 'github') ghUrl = url;
      if (item.platform === 'linkedin') liUrl = url;
      if (item.platform === 'twitter') twUrl = url;
      if (item.platform === 'instagram') igUrl = url;
      if (item.platform === 'website') webUrl = url;
    }
  } else if (socialLinks && typeof socialLinks === 'object') {
    if (socialLinks.showGithub !== false && socialLinks.github) ghUrl = socialLinks.github;
    if (socialLinks.showLinkedin !== false && socialLinks.linkedin) liUrl = socialLinks.linkedin;
    if (socialLinks.showTwitter !== false && socialLinks.twitter) twUrl = socialLinks.twitter;
    if (socialLinks.showInstagram !== false && socialLinks.instagram) igUrl = socialLinks.instagram;
    if (socialLinks.showWebsite !== false && socialLinks.website) webUrl = socialLinks.website;
    if (socialLinks.showEmail !== undefined) userShowEmail = Boolean(socialLinks.showEmail);
  }

  const items: SocialLinkItem[] = [];

  if (ghUrl) {
    items.push({
      id: 'github',
      name: 'GitHub',
      url: ghUrl,
      icon: GithubIcon,
      fillBg: 'bg-[#24292e] dark:bg-white',
      textColor: 'text-white dark:text-[#24292e]',
      shadowColor: 'shadow-[0_4px_15px_rgba(36,41,46,0.35)]',
    });
  }

  if (liUrl) {
    items.push({
      id: 'linkedin',
      name: 'LinkedIn',
      url: liUrl,
      icon: LinkedinIcon,
      fillBg: 'bg-[#0A66C2]',
      textColor: 'text-white',
      shadowColor: 'shadow-[0_4px_15px_rgba(10,102,194,0.4)]',
    });
  }

  if (twUrl) {
    items.push({
      id: 'twitter',
      name: 'X (Twitter)',
      url: twUrl,
      icon: TwitterIcon,
      fillBg: 'bg-neutral-950 dark:bg-white',
      textColor: 'text-white dark:text-neutral-950',
      shadowColor: 'shadow-[0_4px_15px_rgba(0,0,0,0.3)]',
    });
  }

  if (igUrl) {
    items.push({
      id: 'instagram',
      name: 'Instagram',
      url: igUrl,
      icon: InstagramIcon,
      fillBg: 'bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888]',
      textColor: 'text-white',
      shadowColor: 'shadow-[0_4px_15px_rgba(220,39,67,0.4)]',
    });
  }

  if (webUrl) {
    items.push({
      id: 'website',
      name: 'Website / Portfolio',
      url: webUrl,
      icon: Globe,
      fillBg: 'bg-neutral-900 dark:bg-neutral-100',
      textColor: 'text-white dark:text-neutral-950',
      shadowColor: 'shadow-[0_4px_15px_rgba(0,0,0,0.25)]',
    });
  }

  // Only show mailto if user explicitly enabled showEmail and email is provided
  if (email && userShowEmail) {
    items.push({
      id: 'email',
      name: 'Send Email',
      url: `mailto:${email}`,
      icon: Mail,
      fillBg: 'bg-gradient-to-r from-rose-500 to-red-600',
      textColor: 'text-white',
      shadowColor: 'shadow-[0_4px_15px_rgba(244,63,94,0.4)]',
    });
  }

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 shrink-0">
      {items.map((item) => (
        <SpringSocialButton key={item.id} item={item} />
      ))}
    </div>
  );
}
