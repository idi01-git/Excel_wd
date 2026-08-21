"use client";

import React, { useState, useRef, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Wordmark } from '@/components/Navbar';
import {
  ArrowRight,
  ArrowLeft,
  Camera,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  User,
  Mail,
  Lock,
  AtSign,
  Building,
  Briefcase,
  ExternalLink,
  ShieldCheck,
  Check,
  Sparkles,
  RefreshCw,
  X,
} from 'lucide-react';
import { ImageCropperModal } from '@/components/ui/ImageCropperModal';
import { uploadImageBlob } from '@/lib/upload';
import { AffiliationType } from '@/lib/registration';
import SubSelectToggle, { MenuItem } from '@/components/ui/sub-select-toggle';

// 2 Main Tabs: Campus Student (Single) and External (Sub-Toggle: Alumnus | Visitor)
const MAIN_TABS: [MenuItem, MenuItem] = [
  { label: 'Campus Student', value: 'internal' },
  { label: 'External', value: 'external' },
];

const SUB_TABS: Record<string, [MenuItem, MenuItem] | undefined> = {
  internal: undefined,
  external: [
    { label: 'Alumnus', value: 'ALUMNI' },
    { label: 'Guest Reader', value: 'VISITOR' },
  ],
};

const BRANCHES = [
  'Computer Science & Engineering',
  'Electronics & Communication Engineering',
  'Information Technology',
  'Mechanical Engineering',
  'Civil Engineering',
  'Electrical Engineering',
  'Chemical Engineering',
  'Applied Sciences & Humanities',
  'Other / Interdisciplinary',
];

const BATCHES = ['2024–2028', '2023–2027', '2022–2026', '2021–2025', '2025–2029'];
const ALUMNI_BATCHES = ['2020–2024', '2019–2023', '2018–2022', '2017–2021', '2016–2020', '2015–2019', 'Earlier Alumnus'];
const INTEREST_TAGS = ['Poetry', 'Short Fiction', 'Philosophy', 'Essays', 'Book Reviews', 'Debate', 'Visual Arts', 'Journalism'];

// Format and sanitize social handle into a safe, valid absolute URL
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

// Linear-Style Form Input with stable focus
const FormInput = ({ label, icon: Icon, required, type = 'text', value, onChange, placeholder, ...props }: any) => {
  const [show, setShow] = useState(false);
  const isPassword = type === 'password';

  return (
    <div className="space-y-1.5 w-full text-left">
      <div className="flex items-center justify-between px-1">
        <label className="font-mono text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
          {label} {required && <span className="text-amber-500">*</span>}
        </label>
      </div>
      <div className="relative group w-full">
        {Icon && (
          <Icon
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-neutral-500 group-hover:text-neutral-600 dark:group-hover:text-neutral-300 group-focus-within:text-neutral-950 dark:group-focus-within:text-white transition-colors duration-200 pointer-events-none"
          />
        )}
        <input
          type={isPassword && show ? 'text' : type}
          required={required}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`w-full h-12 ${
            Icon ? 'pl-10' : 'pl-3.5'
          } pr-10 rounded-xl border border-neutral-200/90 dark:border-neutral-800 bg-white/80 dark:bg-[#121212] text-sm text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-600 focus:border-neutral-950 dark:focus:border-white focus:bg-white dark:focus:bg-[#161616] focus:ring-2 focus:ring-neutral-950/10 dark:focus:ring-white/10 transition-all duration-200 outline-none shadow-xs hover:border-neutral-300 dark:hover:border-neutral-700`}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow(!show)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer p-1"
          >
            {show ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        )}
      </div>
    </div>
  );
};

const FormSelect = ({ label, options, value, onChange, required }: any) => (
  <div className="space-y-1.5 w-full text-left">
    <label className="font-mono text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 px-1">
      {label} {required && <span className="text-amber-500">*</span>}
    </label>
    <div className="relative group w-full">
      <select
        value={value}
        onChange={onChange}
        className="w-full h-12 pl-3.5 pr-10 rounded-xl border border-neutral-200/90 dark:border-neutral-800 bg-white/80 dark:bg-[#121212] text-sm text-neutral-900 dark:text-white focus:border-neutral-950 dark:focus:border-white focus:bg-white dark:focus:bg-[#161616] focus:ring-2 focus:ring-neutral-950/10 dark:focus:ring-white/10 transition-all duration-200 outline-none shadow-xs hover:border-neutral-300 dark:hover:border-neutral-700 appearance-none cursor-pointer"
      >
        {options.map((opt: string) => (
          <option key={opt} value={opt} className="bg-white dark:bg-[#121212] py-1 text-sm">
            {opt}
          </option>
        ))}
      </select>
      <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-40 group-hover:opacity-80 transition-opacity">
        <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
    </div>
  </div>
);

// 6-Digit Email OTP Confirmation Modal
interface OtpModalProps {
  isOpen: boolean;
  email: string;
  name: string;
  onVerified: () => void;
  onCancel: () => void;
}

function OtpConfirmationModal({ isOpen, email, name, onVerified, onCancel }: OtpModalProps) {
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [devCode, setDevCode] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(60);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!isOpen) return;
    inputRefs.current[0]?.focus();
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen]);

  const handleDigitChange = (index: number, val: string) => {
    const char = val.slice(-1).replace(/[^0-9]/g, '');
    const newDigits = [...digits];
    newDigits[index] = char;
    setDigits(newDigits);
    setError('');

    if (char && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // If 6th digit entered, auto-verify
    if (char && index === 5 && newDigits.every((d) => d !== '')) {
      submitOtp(newDigits.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').trim().replace(/[^0-9]/g, '').slice(0, 6);
    if (pasted.length === 6) {
      const arr = pasted.split('');
      setDigits(arr);
      submitOtp(pasted);
    }
  };

  const submitOtp = async (codeToSubmit?: string) => {
    const code = codeToSubmit || digits.join('');
    if (code.length !== 6) {
      setError('Please enter all 6 digits.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || 'Invalid or expired code.');
        setLoading(false);
        return;
      }

      onVerified();
    } catch (err) {
      setError('Network error validating code.');
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setError('');
    setResendCooldown(60);
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name }),
      });
      const data = await res.json();
      if (data.devCode) setDevCode(data.devCode);
    } catch (err) {
      setError('Failed to resend code.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Frosted Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onCancel}
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
      />

      {/* Modal Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 16 }}
        transition={{ type: 'spring', damping: 26, stiffness: 320 }}
        className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0c0c0c] p-6 sm:p-8 text-neutral-900 dark:text-neutral-100 shadow-2xl space-y-6"
      >
        <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-900 pb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} className="text-emerald-500" />
            <span className="font-mono text-[11px] uppercase tracking-widest font-bold text-neutral-400">
              Email Verification
            </span>
          </div>
          <button
            onClick={onCancel}
            className="p-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800 text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
          >
            <X size={15} />
          </button>
        </div>

        <div className="text-center space-y-2">
          <h3 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white">
            Verify Your Email
          </h3>
          <p className="text-xs text-neutral-500 leading-relaxed max-w-xs mx-auto">
            We sent a 6-digit confirmation code to <strong className="text-neutral-900 dark:text-white font-mono">{email}</strong>
          </p>
        </div>

        {/* 6 Digit Input Group */}
        <div className="space-y-4" onPaste={handlePaste}>
          <div className="flex justify-center gap-2 sm:gap-3">
            {digits.map((d, i) => (
              <input
                key={i}
                ref={(el) => {
                  inputRefs.current[i] = el;
                }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={d}
                onChange={(e) => handleDigitChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                className="w-11 h-13 sm:w-12 sm:h-14 text-center font-mono text-xl font-bold rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/80 dark:bg-[#141414] text-neutral-900 dark:text-white focus:border-neutral-950 dark:focus:border-white focus:bg-white dark:focus:bg-[#181818] focus:ring-2 focus:ring-neutral-950/10 dark:focus:ring-white/10 outline-none transition-all"
              />
            ))}
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-mono text-center flex items-center justify-center gap-2">
              <AlertCircle size={14} />
              <span>{error}</span>
            </div>
          )}

          {devCode && (
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-[11px] font-mono text-center">
              Dev Mode Code: <strong>{devCode}</strong>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => submitOtp()}
            disabled={loading || digits.some((d) => d === '')}
            className="w-full h-12 rounded-xl bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all cursor-pointer disabled:opacity-50"
          >
            <span>{loading ? 'Confirming Code...' : 'Verify & Proceed'}</span>
            {!loading && <Check size={15} />}
          </button>

          <div className="text-center">
            <button
              type="button"
              onClick={handleResend}
              disabled={resendCooldown > 0}
              className="text-xs font-mono text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors disabled:opacity-40 cursor-pointer"
            >
              {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend verification code'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function RegisterPage() {
  // SubSelectToggle State: Campus Student vs External (Alumnus | Visitor)
  const [activeMainTab, setActiveMainTab] = useState<MenuItem>(MAIN_TABS[0]);
  const [activeSubTab, setActiveSubTab] = useState<MenuItem>({ label: 'Campus Student', value: 'STUDENT' });

  // Resolve active persona
  const affiliation: AffiliationType =
    activeMainTab.value === 'internal'
      ? 'STUDENT'
      : (activeSubTab.value as AffiliationType) || 'ALUMNI';

  // 3-Level Step State
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Step 1: Account Credentials
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Email OTP Verification State
  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);

  // Step 2: Academic / Persona Record & Bio
  const [rollNumber, setRollNumber] = useState('');
  const [branch, setBranch] = useState(BRANCHES[0]);
  const [batch, setBatch] = useState(BATCHES[0]);
  const [alumniBatch, setAlumniBatch] = useState(ALUMNI_BATCHES[0]);
  const [alumniDegree, setAlumniDegree] = useState(BRANCHES[0]);
  const [alumniOrganization, setAlumniOrganization] = useState('');
  const [alumniDesignation, setAlumniDesignation] = useState('');
  const [bio, setBio] = useState('');
  const [selectedInterests, setSelectedInterests] = useState<string[]>(['Poetry', 'Essays']);

  // Step 3: Verified Social Handles & Profile Portrait
  const [githubInput, setGithubInput] = useState('');
  const [showGithub, setShowGithub] = useState(true);

  const [linkedinInput, setLinkedinInput] = useState('');
  const [showLinkedin, setShowLinkedin] = useState(true);

  const [twitterInput, setTwitterInput] = useState('');
  const [showTwitter, setShowTwitter] = useState(true);

  const [instagramInput, setInstagramInput] = useState('');
  const [showInstagram, setShowInstagram] = useState(true);

  const [websiteInput, setWebsiteInput] = useState('');
  const [showWebsite, setShowWebsite] = useState(true);

  const [showDirectMail, setShowDirectMail] = useState(false);

  const [croppedImageBlob, setCroppedImageBlob] = useState<Blob | null>(null);
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState<string>('');

  // UI State
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [requiresApproval, setRequiresApproval] = useState(false);

  // Photo Cropper State
  const [rawImageSrc, setRawImageSrc] = useState<string | null>(null);
  const [isCropperOpen, setIsCropperOpen] = useState(false);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');

    if (file.size > 2 * 1024 * 1024) {
      setError('Image must be under 2MB. Please select a smaller photo.');
      e.target.value = '';
      return;
    }

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (PNG, JPG, WebP)');
      e.target.value = '';
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

    // Reset input value so user can re-select same file
    e.target.value = '';
  };

  const handleCropComplete = (croppedBlob: Blob, croppedUrl: string) => {
    setIsCropperOpen(false);
    setCroppedImageBlob(croppedBlob);
    setPreviewPhotoUrl(croppedUrl);
    setError('');
  };

  // Step 1 Submit -> Triggers OTP Email Dispatch
  const handleProceedToStep2 = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name.trim() || !username.trim() || !email.trim() || !password) {
      setError('Please complete all account fields.');
      return;
    }
    if (username.length < 3) {
      setError('Username must be at least 3 characters.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    // If already verified email previously, proceed directly
    if (isEmailVerified) {
      setStep(2);
      return;
    }

    setSendingOtp(true);
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to send verification code.');
        setSendingOtp(false);
        return;
      }

      setIsOtpModalOpen(true);
    } catch (err) {
      setError('Failed to dispatch email verification.');
    } finally {
      setSendingOtp(false);
    }
  };

  const handleOtpVerified = () => {
    setIsEmailVerified(true);
    setIsOtpModalOpen(false);
    setStep(2);
  };

  const handleProceedToStep3 = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (affiliation === 'STUDENT' && !rollNumber.trim()) {
      setError('University Roll Number is required for campus students.');
      return;
    }
    setStep(3);
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // 1. Upload to Cloudinary strictly upon final submit
      let uploadedPhotoUrl: string | null = null;
      if (croppedImageBlob) {
        try {
          uploadedPhotoUrl = await uploadImageBlob(croppedImageBlob, 'profile_photos');
        } catch (uploadErr) {
          console.error('Photo upload failed:', uploadErr);
        }
      }

      // 2. Build verified social links array with individual visibility flags
      const socialLinks: any[] = [];
      const gh = formatSocialUrl('github', githubInput);
      if (gh.isValid) socialLinks.push({ platform: 'github', url: gh.url, handle: gh.handle, enabled: showGithub });

      const li = formatSocialUrl('linkedin', linkedinInput);
      if (li.isValid) socialLinks.push({ platform: 'linkedin', url: li.url, handle: li.handle, enabled: showLinkedin });

      const tw = formatSocialUrl('twitter', twitterInput);
      if (tw.isValid) socialLinks.push({ platform: 'twitter', url: tw.url, handle: tw.handle, enabled: showTwitter });

      const ig = formatSocialUrl('instagram', instagramInput);
      if (ig.isValid) socialLinks.push({ platform: 'instagram', url: ig.url, handle: ig.handle, enabled: showInstagram });

      const web = formatSocialUrl('website', websiteInput);
      if (web.isValid) socialLinks.push({ platform: 'website', url: web.url, handle: web.handle, enabled: showWebsite });

      if (showDirectMail) {
        socialLinks.push({ platform: 'email', showEmail: true, enabled: true });
      }

      // 3. Dispatch registration
      const payload = {
        name: name.trim(),
        username: username.toLowerCase().trim(),
        email: email.toLowerCase().trim(),
        password,
        affiliation,
        profilePhoto: uploadedPhotoUrl || null,
        rollNumber: rollNumber.trim() || null,
        branch: affiliation === 'ALUMNI' ? alumniDegree : branch,
        batch: affiliation === 'ALUMNI' ? alumniBatch : batch,
        alumniBatch: affiliation === 'ALUMNI' ? alumniBatch : null,
        alumniDegree: affiliation === 'ALUMNI' ? alumniDegree : null,
        alumniOrganization: alumniOrganization.trim() || null,
        alumniDesignation: alumniDesignation.trim() || null,
        bio: bio.trim() || null,
        readingInterests: selectedInterests,
        socialLinks,
      };

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || 'Failed to create account.');
        setLoading(false);
        return;
      }

      setRequiresApproval(data.requiresApproval);
      setStep(4); // Welcome screen
      await signIn('credentials', {
        username: username.toLowerCase().trim(),
        password,
        redirect: false,
      });
    } catch (err) {
      setError('An error occurred during registration.');
      setLoading(false);
    }
  };

  const STEPS_META = [
    { num: 1, label: 'Identity', title: 'Join the Society', subtitle: 'join the Cult today.' },
    { num: 2, label: 'Credentials', title: 'Academic Record', subtitle: `Provide your ${affiliation === 'STUDENT' ? 'Student' : activeSubTab.label} details.` },
    { num: 3, label: 'Byline & Socials', title: 'Profile & Byline', subtitle: 'Add verified social handles and an author portrait.' },
  ];

  return (
    <div className="min-h-screen relative flex flex-col justify-center items-center py-12 sm:py-16 px-4 sm:px-6 md:px-8 overflow-hidden bg-neutral-50 dark:bg-[#030303] text-neutral-900 dark:text-neutral-100 selection:bg-neutral-900 selection:text-white dark:selection:bg-white dark:selection:text-neutral-950">
      {/* Ambient Lighting Backdrop */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] sm:w-[900px] h-[500px] rounded-full bg-neutral-200/50 dark:bg-neutral-800/20 blur-[140px] opacity-60 dark:opacity-40" />
      </div>

      {/* Main Container */}
      <div className="w-full max-w-xl sm:max-w-2xl relative z-10 space-y-6">
        
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center space-y-2">
          <Link
            href="/"
            className="hover:opacity-80 transition-opacity"
          >
            <Wordmark />
          </Link>
          <motion.div
            key={step}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-1"
          >
            <h1 className="text-3xl sm:text-4xl font-bold text-neutral-900 dark:text-white tracking-tight">
              {step <= 3 ? STEPS_META[step - 1].title : 'Welcome to Excelsior'}
            </h1>
            <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
              {step <= 3 ? STEPS_META[step - 1].subtitle : 'Your author profile has been created successfully.'}
            </p>
          </motion.div>
        </div>

        {/* Modal Card */}
        <div className="bg-white/85 dark:bg-[#0c0c0c]/90 backdrop-blur-3xl border border-neutral-200/90 dark:border-neutral-800/90 rounded-[2.5rem] p-6 sm:p-10 md:p-12 shadow-[0_25px_80px_-15px_rgba(0,0,0,0.1)] dark:shadow-[0_25px_80px_-15px_rgba(0,0,0,0.7)] space-y-7">
          
          {/* 3-Level Progress Indicator */}
          {step <= 3 && (
            <div className="space-y-3 pb-2 border-b border-neutral-100 dark:border-neutral-900">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10.5px] uppercase tracking-widest font-bold text-neutral-400 dark:text-neutral-500">
                  Level 0{step} of 03
                </span>
                <span className="text-xs font-bold text-neutral-900 dark:text-white">
                  {STEPS_META[step - 1].label}
                </span>
              </div>

              {/* 3 Segmented Connected Progress Bars */}
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3].map((num) => (
                  <div
                    key={num}
                    className="relative h-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden"
                  >
                    <motion.div
                      className="absolute inset-0 bg-neutral-950 dark:bg-white rounded-full"
                      initial={false}
                      animate={{
                        scaleX: step >= num ? 1 : 0,
                      }}
                      style={{ originX: 0 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Error Notice */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-mono flex items-center gap-3">
                  <AlertCircle size={15} className="shrink-0" />
                  <span>{error}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            
            {/* LEVEL 1: Persona Affiliation & Account Info */}
            {step === 1 && (
              <motion.form
                key="step1"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
                onSubmit={handleProceedToStep2}
                className="space-y-6"
              >
                {/* Persona Switcher: Campus Student vs External (Alumnus | Guest) */}
                <div>
                  <SubSelectToggle
                    tabs={MAIN_TABS}
                    subTabs={SUB_TABS}
                    activeMainTab={activeMainTab}
                    setActiveMainTab={setActiveMainTab}
                    activeSubTab={activeSubTab}
                    setActiveSubTab={setActiveSubTab}
                  />
                </div>

                {/* Account Fields (2-Column Grid) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormInput
                    label="Full Name"
                    icon={User}
                    required
                    value={name}
                    onChange={(e: any) => setName(e.target.value)}
                    placeholder="e.g. Maya Lin"
                  />
                  <FormInput
                    label="Username"
                    icon={AtSign}
                    required
                    value={username}
                    onChange={(e: any) => setUsername(e.target.value.toLowerCase())}
                    placeholder="e.g. mayalin"
                  />
                </div>

                <FormInput
                  label="Email Address"
                  type="email"
                  icon={Mail}
                  required
                  value={email}
                  onChange={(e: any) => {
                    setEmail(e.target.value);
                    setIsEmailVerified(false);
                  }}
                  placeholder="maya@college.edu or personal email"
                />

                <FormInput
                  label="Password"
                  type="password"
                  icon={Lock}
                  required
                  value={password}
                  onChange={(e: any) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />

                {/* Level 1 CTA */}
                <div className="pt-2">
                  <motion.button
                    type="submit"
                    disabled={sendingOtp}
                    whileHover={{ scale: 1.015 }}
                    whileTap={{ scale: 0.985 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    className="w-full h-14 rounded-2xl bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 font-bold text-sm flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-shadow cursor-pointer disabled:opacity-50"
                  >
                    <span>{sendingOtp ? 'Sending Verification Code...' : 'Verify Email & Continue'}</span>
                    {!sendingOtp && <ArrowRight size={16} />}
                  </motion.button>
                </div>
                
                <div className="text-center pt-1">
                  <span className="text-xs text-neutral-500 font-medium">Already have an account? </span>
                  <Link href="/login" className="text-xs font-bold text-neutral-900 dark:text-white hover:underline underline-offset-4">
                    Log In
                  </Link>
                </div>
              </motion.form>
            )}

            {/* LEVEL 2: Academic Record / Persona Details & Author Bio */}
            {step === 2 && (
              <motion.form
                key="step2"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
                onSubmit={handleProceedToStep3}
                className="space-y-6"
              >
                {/* Back Navigation Bar */}
                <div className="flex items-center justify-between pb-1">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white transition-all cursor-pointer"
                      title="Back to Step 1"
                    >
                      <ArrowLeft size={16} />
                    </button>
                    <div>
                      <h3 className="font-serif text-lg sm:text-xl font-bold text-neutral-900 dark:text-white">
                        {affiliation === 'STUDENT' ? 'Campus Student' : activeSubTab.label} Record
                      </h3>
                      <p className="text-xs text-neutral-500">Provide academic details and your author byline.</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                    {affiliation}
                  </span>
                </div>

                {/* Persona Dynamic Fields */}
                {affiliation === 'STUDENT' && (
                  <>
                    <FormInput
                      label="University Roll Number"
                      required
                      value={rollNumber}
                      onChange={(e: any) => setRollNumber(e.target.value.toUpperCase())}
                      placeholder="e.g. 22BCSE104"
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormSelect label="Branch / Department" options={BRANCHES} value={branch} onChange={(e: any) => setBranch(e.target.value)} />
                      <FormSelect label="Batch Year" options={BATCHES} value={batch} onChange={(e: any) => setBatch(e.target.value)} />
                    </div>
                  </>
                )}

                {affiliation === 'ALUMNI' && (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormSelect label="Graduation Batch" options={ALUMNI_BATCHES} value={alumniBatch} onChange={(e: any) => setAlumniBatch(e.target.value)} />
                      <FormSelect label="Degree / Department" options={BRANCHES} value={alumniDegree} onChange={(e: any) => setAlumniDegree(e.target.value)} />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormInput label="Current Company / University" icon={Building} value={alumniOrganization} onChange={(e: any) => setAlumniOrganization(e.target.value)} placeholder="e.g. Google, Oxford" />
                      <FormInput label="Role / Designation" icon={Briefcase} value={alumniDesignation} onChange={(e: any) => setAlumniDesignation(e.target.value)} placeholder="e.g. Staff Engineer" />
                    </div>
                    <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-[#141414] border border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500">
                      <span>💡 If your record exists in </span>
                      <strong className="text-neutral-900 dark:text-white font-serif">Archivum Alumnorum</strong>
                      <span>, your published works will be automatically linked.</span>
                    </div>
                  </>
                )}

                {affiliation === 'VISITOR' && (
                  <div className="space-y-2">
                    <label className="text-[10.5px] font-mono font-bold uppercase tracking-widest text-neutral-500 block">
                      Literary &amp; Reading Interests
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {INTEREST_TAGS.map((tag) => (
                        <button
                          type="button"
                          key={tag}
                          onClick={() =>
                            setSelectedInterests((prev) =>
                              prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
                            )
                          }
                          className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                            selectedInterests.includes(tag)
                              ? 'bg-neutral-950 text-white dark:bg-white dark:text-neutral-950 shadow-sm scale-[1.02]'
                              : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                          }`}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Common Field: Author Bio */}
                <div className="space-y-1.5">
                  <label className="font-mono text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 px-1">
                    Author Bio / Byline (Optional)
                  </label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell other readers about your literary background, writing style, or studies..."
                    className="w-full p-3.5 rounded-xl border border-neutral-200/90 dark:border-neutral-800 bg-white/80 dark:bg-[#121212] text-sm text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:border-neutral-950 dark:focus:border-white focus:ring-2 focus:ring-neutral-950/10 dark:focus:ring-white/10 transition-all outline-none resize-none min-h-[85px]"
                  />
                </div>

                {/* Level 2 CTA */}
                <div className="pt-2">
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.015 }}
                    whileTap={{ scale: 0.985 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    className="w-full h-14 rounded-2xl bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 font-bold text-sm flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-shadow cursor-pointer"
                  >
                    <span>Continue to Step 3</span>
                    <ArrowRight size={16} />
                  </motion.button>
                </div>
              </motion.form>
            )}

            {/* LEVEL 3: Verified Social Handles & 1:1 Portrait */}
            {step === 3 && (
              <motion.form
                key="step3"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
                onSubmit={handleFinalSubmit}
                className="space-y-6"
              >
                {/* Back Navigation */}
                <div className="flex items-center justify-between pb-1">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white transition-all cursor-pointer"
                      title="Back to Step 2"
                    >
                      <ArrowLeft size={16} />
                    </button>
                    <div>
                      <h3 className="font-serif text-lg sm:text-xl font-bold text-neutral-900 dark:text-white">
                        Author Byline &amp; Socials
                      </h3>
                      <p className="text-xs text-neutral-500">Verified links &amp; 1:1 portrait for your public profile.</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <ShieldCheck size={14} />
                    <span>Safe Handles</span>
                  </span>
                </div>

                {/* Compact 1:1 Portrait Picker */}
                <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-2xl bg-neutral-50/80 dark:bg-[#141414]/80 border border-neutral-200/70 dark:border-neutral-800/70">
                  <div className="relative shrink-0 group">
                    <div className="h-20 w-20 overflow-hidden rounded-full border-2 border-dashed border-neutral-300 dark:border-neutral-700 p-1 group-hover:border-neutral-500 transition-all flex items-center justify-center bg-white dark:bg-[#0e0e0e] shadow-sm">
                      {previewPhotoUrl ? (
                        <img
                          src={previewPhotoUrl}
                          alt="Profile preview"
                          className="h-full w-full object-cover rounded-full"
                        />
                      ) : (
                        <div className="text-neutral-400 flex flex-col items-center justify-center">
                          <User size={28} />
                        </div>
                      )}
                    </div>
                    
                    <label className="absolute -bottom-1 -right-1 p-2 rounded-full bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 shadow-md cursor-pointer hover:scale-110 active:scale-95 transition-transform">
                      <Camera size={13} />
                      <input type="file" accept="image/*" onChange={handlePhotoSelect} className="hidden" />
                    </label>
                  </div>

                  <div className="flex-1 text-center sm:text-left space-y-1">
                    <h4 className="text-xs font-bold text-neutral-900 dark:text-white">Profile Portrait (1:1 Square)</h4>
                    <p className="text-[11px] text-neutral-500">
                      {previewPhotoUrl
                        ? 'Portrait cropped & ready for submission.'
                        : 'Upload a 1:1 square photo (Max 2MB). Crop and frame before publishing.'}
                    </p>
                    <div className="pt-1">
                      <label className="inline-flex items-center gap-1 px-3 py-1 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0e0e0e] text-[11px] font-mono font-bold text-neutral-800 dark:text-neutral-200 hover:text-neutral-950 dark:hover:text-white cursor-pointer transition shadow-xs">
                        <Camera size={11} />
                        <span>{previewPhotoUrl ? 'Crop Again' : 'Upload Photo'}</span>
                        <input type="file" accept="image/*" onChange={handlePhotoSelect} className="hidden" />
                      </label>
                    </div>
                  </div>
                </div>

                {/* Verified Social Handles (Auto-formatting, clickable tests & individual toggles) */}
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between px-1">
                    <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                      Linked Author Accounts
                    </span>
                    <span className="text-[10px] font-mono text-neutral-400">Click preview to test link</span>
                  </div>

                  <div className="space-y-3">
                    {/* GitHub */}
                    <div className="p-3 rounded-2xl bg-neutral-50/80 dark:bg-[#141414] border border-neutral-200/70 dark:border-neutral-800/70 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200">GitHub</span>
                        <label className="flex items-center gap-1.5 text-[11px] font-mono text-neutral-500 cursor-pointer">
                          <span>{showGithub ? 'Visible' : 'Hidden'}</span>
                          <input
                            type="checkbox"
                            checked={showGithub}
                            onChange={(e) => setShowGithub(e.target.checked)}
                            className="w-3.5 h-3.5 rounded accent-neutral-950 dark:accent-white cursor-pointer"
                          />
                        </label>
                      </div>
                      <div className="relative">
                        <input
                          type="text"
                          value={githubInput}
                          onChange={(e) => setGithubInput(e.target.value)}
                          placeholder="GitHub username (e.g. mayalin)"
                          className={`w-full h-10 pl-3 pr-8 rounded-xl border border-neutral-200/90 dark:border-neutral-800 bg-white dark:bg-[#101010] text-xs text-neutral-900 dark:text-white focus:outline-none ${
                            !showGithub ? 'opacity-50' : ''
                          }`}
                        />
                        {formatSocialUrl('github', githubInput).isValid && (
                          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 text-emerald-500">
                            <Check size={14} />
                          </div>
                        )}
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
                    <div className="p-3 rounded-2xl bg-neutral-50/80 dark:bg-[#141414] border border-neutral-200/70 dark:border-neutral-800/70 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200">LinkedIn</span>
                        <label className="flex items-center gap-1.5 text-[11px] font-mono text-neutral-500 cursor-pointer">
                          <span>{showLinkedin ? 'Visible' : 'Hidden'}</span>
                          <input
                            type="checkbox"
                            checked={showLinkedin}
                            onChange={(e) => setShowLinkedin(e.target.checked)}
                            className="w-3.5 h-3.5 rounded accent-neutral-950 dark:accent-white cursor-pointer"
                          />
                        </label>
                      </div>
                      <div className="relative">
                        <input
                          type="text"
                          value={linkedinInput}
                          onChange={(e) => setLinkedinInput(e.target.value)}
                          placeholder="LinkedIn handle (e.g. mayalin)"
                          className={`w-full h-10 pl-3 pr-8 rounded-xl border border-neutral-200/90 dark:border-neutral-800 bg-white dark:bg-[#101010] text-xs text-neutral-900 dark:text-white focus:outline-none ${
                            !showLinkedin ? 'opacity-50' : ''
                          }`}
                        />
                        {formatSocialUrl('linkedin', linkedinInput).isValid && (
                          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 text-emerald-500">
                            <Check size={14} />
                          </div>
                        )}
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
                    <div className="p-3 rounded-2xl bg-neutral-50/80 dark:bg-[#141414] border border-neutral-200/70 dark:border-neutral-800/70 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200">Twitter / X</span>
                        <label className="flex items-center gap-1.5 text-[11px] font-mono text-neutral-500 cursor-pointer">
                          <span>{showTwitter ? 'Visible' : 'Hidden'}</span>
                          <input
                            type="checkbox"
                            checked={showTwitter}
                            onChange={(e) => setShowTwitter(e.target.checked)}
                            className="w-3.5 h-3.5 rounded accent-neutral-950 dark:accent-white cursor-pointer"
                          />
                        </label>
                      </div>
                      <div className="relative">
                        <input
                          type="text"
                          value={twitterInput}
                          onChange={(e) => setTwitterInput(e.target.value)}
                          placeholder="Twitter / X (@handle)"
                          className={`w-full h-10 pl-3 pr-8 rounded-xl border border-neutral-200/90 dark:border-neutral-800 bg-white dark:bg-[#101010] text-xs text-neutral-900 dark:text-white focus:outline-none ${
                            !showTwitter ? 'opacity-50' : ''
                          }`}
                        />
                        {formatSocialUrl('twitter', twitterInput).isValid && (
                          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 text-emerald-500">
                            <Check size={14} />
                          </div>
                        )}
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
                    <div className="p-3 rounded-2xl bg-neutral-50/80 dark:bg-[#141414] border border-neutral-200/70 dark:border-neutral-800/70 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200">Instagram</span>
                        <label className="flex items-center gap-1.5 text-[11px] font-mono text-neutral-500 cursor-pointer">
                          <span>{showInstagram ? 'Visible' : 'Hidden'}</span>
                          <input
                            type="checkbox"
                            checked={showInstagram}
                            onChange={(e) => setShowInstagram(e.target.checked)}
                            className="w-3.5 h-3.5 rounded accent-neutral-950 dark:accent-white cursor-pointer"
                          />
                        </label>
                      </div>
                      <div className="relative">
                        <input
                          type="text"
                          value={instagramInput}
                          onChange={(e) => setInstagramInput(e.target.value)}
                          placeholder="Instagram (@handle)"
                          className={`w-full h-10 pl-3 pr-8 rounded-xl border border-neutral-200/90 dark:border-neutral-800 bg-white dark:bg-[#101010] text-xs text-neutral-900 dark:text-white focus:outline-none ${
                            !showInstagram ? 'opacity-50' : ''
                          }`}
                        />
                        {formatSocialUrl('instagram', instagramInput).isValid && (
                          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 text-emerald-500">
                            <Check size={14} />
                          </div>
                        )}
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

                    {/* Personal Website */}
                    <div className="p-3 rounded-2xl bg-neutral-50/80 dark:bg-[#141414] border border-neutral-200/70 dark:border-neutral-800/70 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200">Website / Portfolio</span>
                        <label className="flex items-center gap-1.5 text-[11px] font-mono text-neutral-500 cursor-pointer">
                          <span>{showWebsite ? 'Visible' : 'Hidden'}</span>
                          <input
                            type="checkbox"
                            checked={showWebsite}
                            onChange={(e) => setShowWebsite(e.target.checked)}
                            className="w-3.5 h-3.5 rounded accent-neutral-950 dark:accent-white cursor-pointer"
                          />
                        </label>
                      </div>
                      <div className="relative">
                        <input
                          type="text"
                          value={websiteInput}
                          onChange={(e) => setWebsiteInput(e.target.value)}
                          placeholder="Website (https://...)"
                          className={`w-full h-10 pl-3 pr-8 rounded-xl border border-neutral-200/90 dark:border-neutral-800 bg-white dark:bg-[#101010] text-xs text-neutral-900 dark:text-white focus:outline-none ${
                            !showWebsite ? 'opacity-50' : ''
                          }`}
                        />
                        {formatSocialUrl('website', websiteInput).isValid && (
                          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 text-emerald-500">
                            <Check size={14} />
                          </div>
                        )}
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

                  {/* Direct Mail Option */}
                  <div className="pt-2">
                    <label className="flex items-center justify-between p-3.5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/90 dark:bg-[#141414] cursor-pointer">
                      <div>
                        <span className="text-xs font-bold text-neutral-900 dark:text-white block">
                          Enable Direct Mail Contact Button
                        </span>
                        <span className="text-[10.5px] text-neutral-500">
                          Show a direct mailto contact icon on your public profile
                        </span>
                      </div>
                      <input
                        type="checkbox"
                        checked={showDirectMail}
                        onChange={(e) => setShowDirectMail(e.target.checked)}
                        className="w-4 h-4 rounded accent-neutral-950 dark:accent-white cursor-pointer shrink-0 ml-3"
                      />
                    </label>
                  </div>
                </div>

                {/* Final Submit CTA */}
                <div className="pt-2">
                  <motion.button
                    type="submit"
                    disabled={loading}
                    whileHover={{ scale: 1.015 }}
                    whileTap={{ scale: 0.985 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    className="w-full h-14 rounded-2xl bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 font-bold text-sm flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-shadow cursor-pointer disabled:opacity-50"
                  >
                    <span>{loading ? 'Finalizing Profile...' : 'Complete Registration'}</span>
                    {!loading && <CheckCircle2 size={16} />}
                  </motion.button>
                </div>
              </motion.form>
            )}

            {/* LEVEL 4: Welcome & Instant Access */}
            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-6 space-y-6"
              >
                <div className="w-20 h-20 mx-auto rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center shadow-lg">
                  <CheckCircle2 size={40} />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl sm:text-3xl font-serif font-bold text-neutral-900 dark:text-white">
                    Welcome to Excelsior, {name}!
                  </h2>
                  <p className="text-xs sm:text-sm text-neutral-500 font-medium max-w-sm mx-auto">
                    {requiresApproval 
                      ? "Your account has been established. You can start reading, writing drafts, and participating in campus literary events right now!" 
                      : "You're all set to read, publish, and engage with the campus literary society."}
                  </p>
                </div>
                <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
                  <Link
                    href="/workspace"
                    className="px-8 py-3.5 rounded-2xl bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 font-bold text-xs uppercase tracking-wider shadow-lg hover:opacity-90 transition text-center"
                  >
                    Enter Workspace
                  </Link>
                  <Link
                    href="/"
                    className="px-8 py-3.5 rounded-2xl border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 font-bold text-xs uppercase tracking-wider hover:bg-neutral-100 dark:hover:bg-neutral-900 transition text-center"
                  >
                    Explore Homepage
                  </Link>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>

      {/* 6-Digit Email OTP Modal */}
      {isOtpModalOpen && (
        <OtpConfirmationModal
          isOpen={isOtpModalOpen}
          email={email}
          name={name}
          onVerified={handleOtpVerified}
          onCancel={() => setIsOtpModalOpen(false)}
        />
      )}

      {/* Strict 1:1 Square Portrait Cropper Modal */}
      {isCropperOpen && rawImageSrc && (
        <ImageCropperModal
          isOpen={isCropperOpen}
          imageSrc={rawImageSrc}
          aspectRatio={1}
          aspectPresetLabel="Square (1:1)"
          allowRatioSelection={false}
          onCropComplete={handleCropComplete}
          onCancel={() => {
            setIsCropperOpen(false);
            setRawImageSrc(null);
          }}
        />
      )}
    </div>
  );
}
