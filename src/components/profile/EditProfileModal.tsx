'use client';

import React, { useState, useRef, useEffect, useMemo, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, Loader2, Camera, Check, ExternalLink, ShieldCheck, AlertCircle, Info } from 'lucide-react';
import { useLenis } from 'lenis/react';
import { ImageCropperModal } from '@/components/ui/ImageCropperModal';
import { validateUploadFile, ACCEPT_MAP } from '@/lib/file-validation';
import { validateUsername } from '@/lib/registration';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: {
    name: string;
    username: string;
    bio: string | null;
    profilePhoto: string | null;
    socialLinks?: any;
    showSocialLinks?: boolean;
    email?: string;
  };
}

function formatSocialUrl(platform: string, input: string): { url: string; handle: string; isValid: boolean } {
  const clean = input.trim().replace(/^@/, '');
  if (!clean) return { url: '', handle: '', isValid: false };

  switch (platform) {
    case 'github': {
      const match = clean.match(/github\.com\/([a-zA-Z0-9_-]+)/);
      const handle = match ? match[1] : clean.replace(/[^a-zA-Z0-9_-]/g, '');
      return { url: `https://github.com/${handle}`, handle: `@${handle}`, isValid: handle.length > 0 };
    }
    case 'linkedin': {
      const match = clean.match(/linkedin\.com\/in\/([a-zA-Z0-9_-]+)/);
      const handle = match ? match[1] : clean.replace(/[^a-zA-Z0-9_-]/g, '');
      return { url: `https://linkedin.com/in/${handle}`, handle: `in/${handle}`, isValid: handle.length > 0 };
    }
    case 'twitter': {
      const match = clean.match(/(?:twitter|x)\.com\/([a-zA-Z0-9_]+)/);
      const handle = match ? match[1] : clean.replace(/[^a-zA-Z0-9_]/g, '');
      return { url: `https://x.com/${handle}`, handle: `@${handle}`, isValid: handle.length > 0 };
    }
    case 'instagram': {
      const match = clean.match(/instagram\.com\/([a-zA-Z0-9_.]+)/);
      const handle = match ? match[1] : clean.replace(/[^a-zA-Z0-9_.]/g, '');
      return { url: `https://instagram.com/${handle}`, handle: `@${handle}`, isValid: handle.length > 0 };
    }
    case 'website': {
      const hasProto = /^https?:\/\//i.test(clean);
      const url = hasProto ? clean : `https://${clean}`;
      const isValid = /^https?:\/\/[a-zA-Z0-9-]+\.[a-zA-Z]{2,}/.test(url);
      return { url, handle: clean.replace(/^https?:\/\//, ''), isValid };
    }
    default:
      return { url: clean, handle: clean, isValid: true };
  }
}

export default function EditProfileModal({ isOpen, onClose, currentUser }: EditProfileModalProps) {
  const router = useRouter();
  const { update } = useSession();
  const lenis = useLenis();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Stop Lenis background scrolling when modal is active
  useEffect(() => {
    if (isOpen) {
      lenis?.stop();
      document.body.style.overflow = 'hidden';
    } else {
      lenis?.start();
      document.body.style.overflow = '';
    }
    return () => {
      lenis?.start();
      document.body.style.overflow = '';
    };
  }, [isOpen, lenis]);

  const [name, setName] = useState(currentUser.name || '');
  const [username, setUsername] = useState(currentUser.username || '');
  const [bio, setBio] = useState(currentUser.bio || '');
  const [profilePhoto, setProfilePhoto] = useState<string | null>(currentUser.profilePhoto);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentUser.profilePhoto);

  // Photo Cropper State
  const [rawImageSrc, setRawImageSrc] = useState<string | null>(null);
  const [isCropperOpen, setIsCropperOpen] = useState(false);

  // Social Links state parsing
  const initialSocials = currentUser.socialLinks;
  
  const getInitialValue = (platform: string) => {
    if (Array.isArray(initialSocials)) {
      const found = initialSocials.find((s: any) => s.platform === platform);
      return {
        handle: found?.handle || found?.url || '',
        enabled: found?.enabled !== false,
      };
    } else if (initialSocials && typeof initialSocials === 'object') {
      const keyMap: Record<string, string> = {
        github: 'showGithub',
        linkedin: 'showLinkedin',
        twitter: 'showTwitter',
        instagram: 'showInstagram',
        website: 'showWebsite',
      };
      return {
        handle: initialSocials[platform] || '',
        enabled: initialSocials[keyMap[platform]] !== false,
      };
    }
    return { handle: '', enabled: true };
  };

  const ghInit = getInitialValue('github');
  const liInit = getInitialValue('linkedin');
  const twInit = getInitialValue('twitter');
  const igInit = getInitialValue('instagram');
  const webInit = getInitialValue('website');

  const [githubInput, setGithubInput] = useState(ghInit.handle);
  const [showGithub, setShowGithub] = useState(ghInit.enabled);

  const [linkedinInput, setLinkedinInput] = useState(liInit.handle);
  const [showLinkedin, setShowLinkedin] = useState(liInit.enabled);

  const [twitterInput, setTwitterInput] = useState(twInit.handle);
  const [showTwitter, setShowTwitter] = useState(twInit.enabled);

  const [instagramInput, setInstagramInput] = useState(igInit.handle);
  const [showInstagram, setShowInstagram] = useState(igInit.enabled);

  const [websiteInput, setWebsiteInput] = useState(webInit.handle);
  const [showWebsite, setShowWebsite] = useState(webInit.enabled);

  const [showSocialLinks, setShowSocialLinks] = useState(currentUser.showSocialLinks !== false);
  const [showEmail, setShowEmail] = useState(
    Array.isArray(initialSocials)
      ? Boolean(initialSocials.find((s: any) => s.platform === 'email')?.showEmail || initialSocials.find((s: any) => s.platform === 'email')?.enabled !== false)
      : Boolean(initialSocials?.showEmail)
  );

  const usernameValidation = useMemo(() => validateUsername(username), [username]);

  const [usernameStatus, setUsernameStatus] = useState<{
    checking: boolean;
    available: boolean | null;
    message: string | null;
  }>({
    checking: false,
    available: null,
    message: null,
  });

  useEffect(() => {
    const clean = username.trim().toLowerCase();
    if (!clean || clean === currentUser.username.toLowerCase()) {
      setUsernameStatus({ checking: false, available: null, message: null });
      return;
    }

    const validation = validateUsername(clean);
    if (!validation.valid) {
      setUsernameStatus({
        checking: false,
        available: false,
        message: validation.error || 'Invalid username',
      });
      return;
    }

    setUsernameStatus({
      checking: true,
      available: null,
      message: 'Checking availability...',
    });

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/auth/check-username?username=${encodeURIComponent(clean)}`);
        const data = await res.json();
        if (data.available) {
          setUsernameStatus({
            checking: false,
            available: true,
            message: `@${clean} is available`,
          });
        } else {
          setUsernameStatus({
            checking: false,
            available: false,
            message: data.error || 'Username is already taken',
          });
        }
      } catch {
        setUsernameStatus({
          checking: false,
          available: null,
          message: null,
        });
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [username, currentUser.username]);

  const [showUsernameTooltip, setShowUsernameTooltip] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);

    const validation = validateUploadFile(file, 'AVATAR');
    if (!validation.valid) {
      setError(validation.error || 'Invalid photo format or size.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setRawImageSrc(reader.result as string);
      setIsCropperOpen(true);
    };
    reader.onerror = () => {
      setError('Failed to read image file.');
    };
    reader.readAsDataURL(file);

    // Reset input value so user can pick the same file again if desired
    e.target.value = '';
  };

  const handleCropComplete = (croppedBlob: Blob, croppedUrl: string) => {
    setIsCropperOpen(false);
    setPreviewUrl(croppedUrl);

    // Convert blob to base64 for API update
    const reader = new FileReader();
    reader.onloadend = () => {
      setProfilePhoto(reader.result as string);
    };
    reader.readAsDataURL(croppedBlob);
    setError(null);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!name.trim()) {
      setError('Name is required.');
      scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const userValid = validateUsername(username);
    if (!userValid.valid) {
      setError(userValid.error || 'Invalid username format.');
      scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Build verified social links array with individual enabled states
      const socialLinks: any[] = [];
      
      const gh = formatSocialUrl('github', githubInput);
      if (gh.isValid) {
        socialLinks.push({ platform: 'github', url: gh.url, handle: gh.handle, enabled: showGithub });
      }

      const li = formatSocialUrl('linkedin', linkedinInput);
      if (li.isValid) {
        socialLinks.push({ platform: 'linkedin', url: li.url, handle: li.handle, enabled: showLinkedin });
      }

      const tw = formatSocialUrl('twitter', twitterInput);
      if (tw.isValid) {
        socialLinks.push({ platform: 'twitter', url: tw.url, handle: tw.handle, enabled: showTwitter });
      }

      const ig = formatSocialUrl('instagram', instagramInput);
      if (ig.isValid) {
        socialLinks.push({ platform: 'instagram', url: ig.url, handle: ig.handle, enabled: showInstagram });
      }

      const web = formatSocialUrl('website', websiteInput);
      if (web.isValid) {
        socialLinks.push({ platform: 'website', url: web.url, handle: web.handle, enabled: showWebsite });
      }

      // Email mailto toggle
      socialLinks.push({ platform: 'email', showEmail, enabled: showEmail });

      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          username: username.trim().toLowerCase(),
          bio: bio.trim(),
          profilePhoto,
          socialLinks,
          showSocialLinks,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update profile');
      }

      // Update session cookie with new details
      await update({
        name: name.trim(),
        username: username.trim().toLowerCase(),
        profilePhoto: data.user.profilePhoto,
      });

      onClose();
      
      const newUsername = username.trim().toLowerCase();
      if (newUsername !== currentUser.username.toLowerCase()) {
        window.location.href = `/profile/${newUsername}`;
      } else {
        router.refresh();
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
      scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div
        data-lenis-prevent
        className="fixed inset-0 z-1000 flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto"
      >
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity" 
          onClick={loading ? undefined : onClose}
        />

        {/* Modal Form Card */}
        <form
          onSubmit={handleSubmit}
          data-lenis-prevent
          className="relative z-10 w-full max-w-xl max-h-[88vh] flex flex-col rounded-3xl bg-white dark:bg-[#0c0c0c] border border-neutral-200/90 dark:border-neutral-800 shadow-2xl overflow-hidden"
        >
          {/* Fixed Header */}
          <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-900 px-6 py-4 shrink-0 bg-white/95 dark:bg-[#0c0c0c]/95 backdrop-blur-sm">
            <div>
              <h3 className="font-serif text-lg sm:text-xl font-bold text-neutral-900 dark:text-white">Edit Author Profile</h3>
              <p className="text-xs text-neutral-500 font-mono">Byline, verified social icons &amp; visibility</p>
            </div>
            <button 
              type="button"
              onClick={onClose}
              disabled={loading}
              className="p-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800 text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          {/* Smooth Scrollable Body */}
          <div
            ref={scrollContainerRef}
            data-lenis-prevent
            className="flex-1 overflow-y-auto overscroll-contain p-6 space-y-6"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            {error && (
              <div className="rounded-2xl bg-red-500/10 border border-red-500/20 p-3.5 text-xs font-mono text-red-600 dark:text-red-400 flex items-center gap-2">
                <AlertCircle size={15} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Photo Upload Area with 1:1 Cropper integration */}
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-neutral-50 dark:bg-[#141414] border border-neutral-200/80 dark:border-neutral-800/80">
              <div className="group relative h-18 w-18 overflow-hidden rounded-full border border-neutral-200 dark:border-neutral-800 shadow-inner bg-neutral-100 dark:bg-neutral-900 shrink-0 flex items-center justify-center">
                {previewUrl ? (
                  <img 
                    src={previewUrl} 
                    alt="Profile preview" 
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="text-neutral-400">
                    <Camera size={24} />
                  </div>
                )}
                
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loading}
                  className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-full cursor-pointer"
                  title="Crop and upload portrait"
                >
                  <Upload size={16} className="text-white" />
                </button>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-neutral-900 dark:text-white">Profile Portrait (1:1 Crop)</span>
                  <span className="text-[10px] font-mono text-neutral-400">Max 2MB</span>
                </div>
                <p className="text-[11px] text-neutral-500 truncate mt-0.5">Interactive pan, zoom, and rotate cropper</p>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loading}
                  className="mt-2 text-xs font-mono font-bold text-neutral-800 dark:text-neutral-200 hover:underline cursor-pointer"
                >
                  Change Avatar...
                </button>
                <input 
                  ref={fileInputRef}
                  type="file" 
                  accept={ACCEPT_MAP.AVATAR} 
                  onChange={handleFileChange} 
                  className="hidden" 
                />
              </div>
            </div>

            {/* Account Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="font-mono text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl border border-neutral-200/90 dark:border-neutral-800 bg-white/80 dark:bg-[#121212] text-sm text-neutral-900 dark:text-white focus:border-neutral-950 dark:focus:border-white focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <label className="font-mono text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                    Username
                  </label>
                  <div className="relative inline-flex items-center">
                    <motion.button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowUsernameTooltip((prev) => !prev);
                      }}
                      onMouseEnter={() => setShowUsernameTooltip(true)}
                      onMouseLeave={() => setShowUsernameTooltip(false)}
                      whileHover={{ scale: 1.15 }}
                      whileTap={{ scale: 0.85 }}
                      className="p-0.5 rounded-full text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer focus:outline-none"
                      aria-label="Username format info"
                    >
                      <Info size={11.5} />
                    </motion.button>

                    <AnimatePresence>
                      {showUsernameTooltip && (
                        <motion.div
                          initial={{ opacity: 0, y: 4, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 2, scale: 0.97 }}
                          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                          className="absolute -right-2 bottom-full mb-2 z-50 w-52 p-2.5 rounded-xl bg-neutral-950/95 dark:bg-[#161618]/95 backdrop-blur-xl text-white shadow-xl border border-white/10 pointer-events-none text-left"
                        >
                          <div className="flex items-center gap-1.5 text-emerald-400 font-mono text-[9.5px] font-bold uppercase tracking-wider mb-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
                            <span>Requirement</span>
                          </div>
                          <p className="text-[11px] font-medium text-neutral-200 leading-snug">
                            3–20 characters (lowercase letters, numbers &amp; underscores)
                          </p>
                          <div className="absolute right-3 top-full w-0 h-0 border-x-[5px] border-x-transparent border-t-[5px] border-t-neutral-950 dark:border-t-[#161618]" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
                <input
                  type="text"
                  required
                  minLength={3}
                  maxLength={20}
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  className="w-full h-11 px-3.5 rounded-xl border border-neutral-200/90 dark:border-neutral-800 bg-white/80 dark:bg-[#121212] text-sm text-neutral-900 dark:text-white focus:border-neutral-950 dark:focus:border-white focus:outline-none"
                />
                <div className="text-[10.5px] font-mono min-h-4 flex items-center">
                  {usernameStatus.checking ? (
                    <span className="text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5">
                      <Loader2 size={11} className="animate-spin text-purple-600 dark:text-purple-400 shrink-0" />
                      <span>Checking availability...</span>
                    </span>
                  ) : usernameStatus.available === true ? (
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
                      <Check size={12} className="shrink-0" />
                      <span>{usernameStatus.message}</span>
                    </span>
                  ) : usernameStatus.available === false ? (
                    <span className="text-red-500 dark:text-red-400 font-semibold flex items-center gap-1.5">
                      <X size={12} className="shrink-0" />
                      <span>{usernameStatus.message}</span>
                    </span>
                  ) : null}
                </div>
              </div>
            </div>

            {/* Bio */}
            <div className="space-y-1.5">
              <label className="font-mono text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                Author Bio / Byline
              </label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell other readers about yourself..."
                className="w-full p-3.5 rounded-xl border border-neutral-200/90 dark:border-neutral-800 bg-white/80 dark:bg-[#121212] text-sm text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:border-neutral-950 dark:focus:border-white focus:outline-none resize-none"
              />
            </div>

            {/* Social Links Editor with Individual Toggle Controls */}
            <div className="space-y-4 pt-3 border-t border-neutral-100 dark:border-neutral-900">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-emerald-500" />
                  <span>Verified Social Icons &amp; Toggles</span>
                </span>
                <span className="text-[10px] font-mono text-neutral-400">Enable/disable individually</span>
              </div>

              <div className="space-y-3.5">
                {/* GitHub */}
                <div className="p-3 rounded-2xl bg-neutral-50/80 dark:bg-[#141414] border border-neutral-200/70 dark:border-neutral-800/70 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                      <span>GitHub</span>
                      {formatSocialUrl('github', githubInput).isValid && (
                        <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                          <Check size={11} /> Verified
                        </span>
                      )}
                    </span>
                    <label className="flex items-center gap-1.5 text-[11px] font-mono font-medium text-neutral-500 cursor-pointer">
                      <span>{showGithub ? 'Visible' : 'Hidden'}</span>
                      <input
                        type="checkbox"
                        checked={showGithub}
                        onChange={(e) => setShowGithub(e.target.checked)}
                        className="w-4 h-4 rounded accent-neutral-950 dark:accent-white cursor-pointer"
                      />
                    </label>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      value={githubInput}
                      onChange={(e) => setGithubInput(e.target.value)}
                      placeholder="GitHub username (e.g. shaurya)"
                      className={`w-full h-10 px-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#101010] text-xs text-neutral-900 dark:text-white focus:outline-none ${
                        !showGithub ? 'opacity-50' : ''
                      }`}
                    />
                  </div>
                  {formatSocialUrl('github', githubInput).isValid && (
                    <div className="flex items-center justify-between px-1">
                      <a
                        href={formatSocialUrl('github', githubInput).url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 truncate"
                      >
                        <ExternalLink size={9} />
                        <span>{formatSocialUrl('github', githubInput).url}</span>
                      </a>
                      <span className="text-[9px] font-mono text-neutral-400">Click to verify link</span>
                    </div>
                  )}
                </div>

                {/* LinkedIn */}
                <div className="p-3 rounded-2xl bg-neutral-50/80 dark:bg-[#141414] border border-neutral-200/70 dark:border-neutral-800/70 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                      <span>LinkedIn</span>
                      {formatSocialUrl('linkedin', linkedinInput).isValid && (
                        <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                          <Check size={11} /> Verified
                        </span>
                      )}
                    </span>
                    <label className="flex items-center gap-1.5 text-[11px] font-mono font-medium text-neutral-500 cursor-pointer">
                      <span>{showLinkedin ? 'Visible' : 'Hidden'}</span>
                      <input
                        type="checkbox"
                        checked={showLinkedin}
                        onChange={(e) => setShowLinkedin(e.target.checked)}
                        className="w-4 h-4 rounded accent-neutral-950 dark:accent-white cursor-pointer"
                      />
                    </label>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      value={linkedinInput}
                      onChange={(e) => setLinkedinInput(e.target.value)}
                      placeholder="LinkedIn handle (e.g. shaurya)"
                      className={`w-full h-10 px-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#101010] text-xs text-neutral-900 dark:text-white focus:outline-none ${
                        !showLinkedin ? 'opacity-50' : ''
                      }`}
                    />
                  </div>
                  {formatSocialUrl('linkedin', linkedinInput).isValid && (
                    <div className="flex items-center justify-between px-1">
                      <a
                        href={formatSocialUrl('linkedin', linkedinInput).url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 truncate"
                      >
                        <ExternalLink size={9} />
                        <span>{formatSocialUrl('linkedin', linkedinInput).url}</span>
                      </a>
                      <span className="text-[9px] font-mono text-neutral-400">Click to verify link</span>
                    </div>
                  )}
                </div>

                {/* Twitter / X */}
                <div className="p-3 rounded-2xl bg-neutral-50/80 dark:bg-[#141414] border border-neutral-200/70 dark:border-neutral-800/70 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                      <span>Twitter / X</span>
                      {formatSocialUrl('twitter', twitterInput).isValid && (
                        <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                          <Check size={11} /> Verified
                        </span>
                      )}
                    </span>
                    <label className="flex items-center gap-1.5 text-[11px] font-mono font-medium text-neutral-500 cursor-pointer">
                      <span>{showTwitter ? 'Visible' : 'Hidden'}</span>
                      <input
                        type="checkbox"
                        checked={showTwitter}
                        onChange={(e) => setShowTwitter(e.target.checked)}
                        className="w-4 h-4 rounded accent-neutral-950 dark:accent-white cursor-pointer"
                      />
                    </label>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      value={twitterInput}
                      onChange={(e) => setTwitterInput(e.target.value)}
                      placeholder="Twitter / X handle (@handle)"
                      className={`w-full h-10 px-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#101010] text-xs text-neutral-900 dark:text-white focus:outline-none ${
                        !showTwitter ? 'opacity-50' : ''
                      }`}
                    />
                  </div>
                  {formatSocialUrl('twitter', twitterInput).isValid && (
                    <div className="flex items-center justify-between px-1">
                      <a
                        href={formatSocialUrl('twitter', twitterInput).url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 truncate"
                      >
                        <ExternalLink size={9} />
                        <span>{formatSocialUrl('twitter', twitterInput).url}</span>
                      </a>
                      <span className="text-[9px] font-mono text-neutral-400">Click to verify link</span>
                    </div>
                  )}
                </div>

                {/* Instagram */}
                <div className="p-3 rounded-2xl bg-neutral-50/80 dark:bg-[#141414] border border-neutral-200/70 dark:border-neutral-800/70 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                      <span>Instagram</span>
                      {formatSocialUrl('instagram', instagramInput).isValid && (
                        <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                          <Check size={11} /> Verified
                        </span>
                      )}
                    </span>
                    <label className="flex items-center gap-1.5 text-[11px] font-mono font-medium text-neutral-500 cursor-pointer">
                      <span>{showInstagram ? 'Visible' : 'Hidden'}</span>
                      <input
                        type="checkbox"
                        checked={showInstagram}
                        onChange={(e) => setShowInstagram(e.target.checked)}
                        className="w-4 h-4 rounded accent-neutral-950 dark:accent-white cursor-pointer"
                      />
                    </label>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      value={instagramInput}
                      onChange={(e) => setInstagramInput(e.target.value)}
                      placeholder="Instagram handle (@handle)"
                      className={`w-full h-10 px-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#101010] text-xs text-neutral-900 dark:text-white focus:outline-none ${
                        !showInstagram ? 'opacity-50' : ''
                      }`}
                    />
                  </div>
                  {formatSocialUrl('instagram', instagramInput).isValid && (
                    <div className="flex items-center justify-between px-1">
                      <a
                        href={formatSocialUrl('instagram', instagramInput).url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 truncate"
                      >
                        <ExternalLink size={9} />
                        <span>{formatSocialUrl('instagram', instagramInput).url}</span>
                      </a>
                      <span className="text-[9px] font-mono text-neutral-400">Click to verify link</span>
                    </div>
                  )}
                </div>

                {/* Website */}
                <div className="p-3 rounded-2xl bg-neutral-50/80 dark:bg-[#141414] border border-neutral-200/70 dark:border-neutral-800/70 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                      <span>Website / Portfolio</span>
                      {formatSocialUrl('website', websiteInput).isValid && (
                        <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                          <Check size={11} /> Verified
                        </span>
                      )}
                    </span>
                    <label className="flex items-center gap-1.5 text-[11px] font-mono font-medium text-neutral-500 cursor-pointer">
                      <span>{showWebsite ? 'Visible' : 'Hidden'}</span>
                      <input
                        type="checkbox"
                        checked={showWebsite}
                        onChange={(e) => setShowWebsite(e.target.checked)}
                        className="w-4 h-4 rounded accent-neutral-950 dark:accent-white cursor-pointer"
                      />
                    </label>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      value={websiteInput}
                      onChange={(e) => setWebsiteInput(e.target.value)}
                      placeholder="https://yourportfolio.com"
                      className={`w-full h-10 px-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#101010] text-xs text-neutral-900 dark:text-white focus:outline-none ${
                        !showWebsite ? 'opacity-50' : ''
                      }`}
                    />
                  </div>
                  {formatSocialUrl('website', websiteInput).isValid && (
                    <div className="flex items-center justify-between px-1">
                      <a
                        href={formatSocialUrl('website', websiteInput).url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 truncate"
                      >
                        <ExternalLink size={9} />
                        <span>{formatSocialUrl('website', websiteInput).url}</span>
                      </a>
                      <span className="text-[9px] font-mono text-neutral-400">Click to verify link</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Global Visibility & Mailto Controls */}
              <div className="space-y-2.5 pt-2">
                <label className="flex items-center justify-between p-3.5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-[#141414] cursor-pointer">
                  <div>
                    <span className="text-xs font-bold text-neutral-900 dark:text-white block">
                      Mailto Contact Button
                    </span>
                    <span className="text-[10.5px] text-neutral-500">
                      Allow visitors to contact you directly via email ({currentUser.email || 'your account email'})
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={showEmail}
                    onChange={(e) => setShowEmail(e.target.checked)}
                    className="w-4 h-4 rounded accent-neutral-950 dark:accent-white cursor-pointer shrink-0 ml-3"
                  />
                </label>

                <label className="flex items-center justify-between p-3.5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-[#141414] cursor-pointer">
                  <div>
                    <span className="text-xs font-bold text-neutral-900 dark:text-white block">
                      Master Social Visibility
                    </span>
                    <span className="text-[10.5px] text-neutral-500">
                      Master toggle to show or hide all social media icons from your public profile
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={showSocialLinks}
                    onChange={(e) => setShowSocialLinks(e.target.checked)}
                    className="w-4 h-4 rounded accent-neutral-950 dark:accent-white cursor-pointer shrink-0 ml-3"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Fixed Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-neutral-100 dark:border-neutral-900 bg-neutral-50/90 dark:bg-[#0e0e0e]/90 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-bold text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              onClick={(e) => {
                // Ensure submit fires whether triggered by form or button click
                handleSubmit(e);
              }}
              className="px-6 py-2.5 rounded-xl bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 text-xs font-bold shadow-md hover:shadow-lg transition cursor-pointer flex items-center gap-2 disabled:opacity-50"
            >
              {loading && <Loader2 size={13} className="animate-spin" />}
              <span>{loading ? 'Saving Changes...' : 'Save Profile'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Circular Profile Photo Cropper Modal */}
      {isCropperOpen && rawImageSrc && (
        <ImageCropperModal
          isOpen={isCropperOpen}
          imageSrc={rawImageSrc}
          aspectRatio={1}
          cropShape="round"
          circular={true}
          aspectPresetLabel="Profile Photo"
          allowRatioSelection={false}
          onCropComplete={handleCropComplete}
          onCancel={() => {
            setIsCropperOpen(false);
            setRawImageSrc(null);
          }}
        />
      )}
    </>
  );
}
