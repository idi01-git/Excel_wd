// src/app/(main)/events/[slug]/page.tsx
'use client';

import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useLenis } from 'lenis/react';
import Link from 'next/link';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'motion/react';
import { 
  ArrowLeft, 
  CheckCircle2, 
  Award, 
  ExternalLink, 
  Download, 
  Globe,
  X,
  ChevronLeft,
  ChevronRight,
  Camera
} from 'lucide-react';
import { isStaff } from '@/lib/rbac';
import { parseEventFormConfig } from '@/lib/event-form';
import EventReminderButton from '@/components/events/EventReminderButton';
import { LoginPromptModal } from '@/components/auth/LoginPromptModal';
import { validateUploadFile, ACCEPT_MAP } from '@/lib/file-validation';
import { getOptimizedCardUrl, getOptimizedAvatarUrl } from '@/lib/image-optimization';

interface Winner {
  id: string;
  participantName: string;
  photoUrl?: string | null;
  position: 'FIRST' | 'SECOND' | 'THIRD' | 'CONSOLATION' | 'SPECIAL_MENTION' | 'OTHER';
  prize?: string | null;
  description?: string | null;
}

interface GalleryItem {
  id: string;
  type: 'PHOTO' | 'VIDEO' | 'POSTER' | 'MEMORY';
  url: string;
  caption?: string | null;
  createdAt: string;
}

// ─── Smooth Masonry Gallery Tile (Exact Spring Scale Physics from Alumni Page) ───
function GalleryTile({
  item,
  idx,
  onSelect,
}: {
  item: GalleryItem;
  idx: number;
  onSelect: () => void;
}) {
  const [loaded, setLoaded] = useState(false);
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

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        show: {
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
      className="break-inside-avoid group cursor-zoom-in border border-neutral-300 dark:border-neutral-800 p-2 bg-card dark:bg-neutral-900/50 text-card-foreground rounded-none will-change-transform transition-all duration-300 hover:border-foreground dark:hover:border-neutral-200 dark:hover:bg-neutral-900/90 select-none relative overflow-hidden"
    >
      <div className="relative overflow-hidden bg-neutral-200/60 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800/80 min-h-40">
        {!loaded && (
          <div className="absolute inset-0 bg-linear-to-r from-neutral-200 via-neutral-100 to-neutral-200 dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900 animate-pulse" />
        )}
        <motion.img
          style={{ scale: imgZoom }}
          src={item.url}
          alt={`Event photo ${idx + 1}`}
          onLoad={() => setLoaded(true)}
          className={`w-full h-auto object-cover grayscale group-hover:grayscale-0 transition-all duration-700 will-change-transform origin-center ${
            loaded ? 'opacity-100' : 'opacity-0'
          }`}
          loading="eager"
          decoding="async"
        />
      </div>
    </motion.div>
  );
}

interface EventDetail {
  id: string;
  title: string;
  slug: string;
  description: string;
  posterImage?: string | null;
  date: string;
  time?: string | null;
  venue: string;
  status: 'UPCOMING' | 'PAST' | 'CANCELLED';
  isCompetition: boolean;
  maxCapacity: number | null;
  rulebookUrl?: string | null;
  socialLink?: string | null;
  downloadUrl?: string | null;
  internalReportUrl?: string | null;
  externalReportUrl?: string | null;
  internalGalleryUrl?: string | null;
  externalGalleryUrl?: string | null;
  requirePayment: boolean;
  paymentQrImage?: string | null;
  paymentAmount?: string | null;
  paymentInstructions?: string | null;
  customFormFields?: unknown;
  winners: Winner[];
  report?: {
    id: string;
    title: string;
  } | null;
  _count: {
    registrations: number;
    gallery: number;
  };
}

export default function EventDetailPage() {
  const { data: session } = useSession();
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [event, setEvent] = useState<EventDetail | null>(null);
  const [registered, setRegistered] = useState<boolean>(false);
  const [registrationDetails, setRegistrationDetails] = useState<{ id: string; paymentStatus?: string } | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const lenis = useLenis();
  
  // Registration Form Modal state
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [answers, setAnswers] = useState<Record<string, string | boolean | string[]>>({});
  // Payment proof — held locally until form submit
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreviewUrl, setProofPreviewUrl] = useState<string | null>(null);
  const [proofError, setProofError] = useState<string>('');
  const [proofUploading, setProofUploading] = useState(false);

  // Newspaper Flip Gallery state
  const [galleryOpen, setGalleryOpen] = useState<boolean>(false);
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [galleryLoading, setGalleryLoading] = useState<boolean>(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [driveDownloadUrl, setDriveDownloadUrl] = useState<string>('');
  const [isExcelsiorMember, setIsExcelsiorMember] = useState<boolean>(false);

  const toggleGallery = async () => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    if (!galleryOpen && galleryItems.length === 0) {
      setGalleryLoading(true);
      try {
        const res = await fetch(`/api/events/${slug}/gallery`);
        const data = await res.json();
        if (data.success && data.items) {
          setGalleryItems(data.items);
          if (data.driveDownloadUrl) setDriveDownloadUrl(data.driveDownloadUrl);
          setIsExcelsiorMember(Boolean(data.isExcelsiorMember));
          await Promise.allSettled(
            data.items.map((it: GalleryItem) => {
              const img = new Image();
              img.src = it.url;
              return img.decode().catch(() => {});
            })
          );
        }
      } catch (err) {
        console.error('Failed to load gallery items:', err);
      } finally {
        setGalleryLoading(false);
      }
    }
    setGalleryOpen((prev) => !prev);
  };

  const fetchDetail = async () => {
    try {
      const res = await fetch(`/api/events/${slug}`);
      const data = await res.json();
      if (data.success) {
        setEvent(data.event);
        setRegistered(data.userRegistered);
        setRegistrationDetails(data.registrationDetails || null);
        if (session?.user) {
          setName((prev) => prev || session.user.name || '');
          setEmail((prev) => prev || session.user.email || '');
        }

        if (data.event._count?.gallery > 0) {
          fetch(`/api/events/${slug}/gallery`)
            .then((r) => r.json())
            .then((gData) => {
              if (gData.success && gData.items) {
                setGalleryItems(gData.items);
                if (gData.driveDownloadUrl) setDriveDownloadUrl(gData.driveDownloadUrl);
                setIsExcelsiorMember(Boolean(gData.isExcelsiorMember));
                gData.items.forEach((it: GalleryItem) => {
                  const img = new Image();
                  img.src = it.url;
                });
              }
            })
            .catch(() => {});
        }
      } else {
        router.push('/404');
      }
    } catch (error) {
      console.error('Failed to load event details:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [slug, session]);

  // Lock background smooth scroll & html/body scroll when RSVP modal is open
  useEffect(() => {
    if (modalOpen) {
      lenis?.stop();
      const origBodyOverflow = document.body.style.overflow;
      const origHtmlOverflow = document.documentElement.style.overflow;

      document.documentElement.classList.add('overflow-hidden');
      document.body.classList.add('overflow-hidden');
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';

      return () => {
        lenis?.start();
        document.documentElement.classList.remove('overflow-hidden');
        document.body.classList.remove('overflow-hidden');
        document.body.style.overflow = origBodyOverflow || '';
        document.documentElement.style.overflow = origHtmlOverflow || '';
      };
    }
  }, [modalOpen, lenis]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event || actionLoading) return;

    // Upload proof on submit (not eagerly on file pick)
    let uploadedProofUrl = '';
    if (event.requirePayment && proofFile) {
      setProofUploading(true);
      try {
        const fd = new FormData();
        fd.append('file', proofFile, proofFile.name);
        fd.append('folder', 'event-payment-proofs');
        const uploadRes = await fetch('/api/upload', { method: 'POST', body: fd });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok || !uploadData.url) {
          alert(uploadData.error || 'Failed to upload payment proof. Please try again.');
          return;
        }
        uploadedProofUrl = uploadData.url;
      } catch (err) {
        alert('Failed to upload payment proof. Please check your connection.');
        return;
      } finally {
        setProofUploading(false);
      }
    }

    setActionLoading(true);
    try {
      const res = await fetch(`/api/events/${event.slug}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name, 
          email, 
          phone, 
          extraFields: answers,
          paymentScreenshotUrl: uploadedProofUrl || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setRegistered(true);
        if (data.registration) setRegistrationDetails(data.registration);
        setModalOpen(false);
        // Reset proof state
        setProofFile(null);
        setProofPreviewUrl(null);
        fetchDetail();
        const refLine = data.ticketRef ? `\n\nYour ticket reference: ${data.ticketRef}` : '';
        const paymentLine = data.paymentStatus === 'PENDING'
          ? '\nYour payment is pending verification — we will email you once approved.'
          : '';
        if (data.ticketRef) {
          alert(`Registration confirmed.${refLine}${paymentLine}`);
        }
      } else {
        alert(data.error || 'Registration failed');
      }
    } catch (error) {
      console.error('Error during registration:', error);
    } finally {
      setActionLoading(false);
    }
  };

  /** Handle proof file selection — validate and preview locally, no Cloudinary upload yet. */
  const handleProofFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateUploadFile(file, 'PAYMENT_PROOF');
    if (!validation.valid) {
      setProofError(validation.error || 'Invalid file format or size.');
      e.target.value = '';
      return;
    }

    setProofError('');
    setProofFile(file);
    if (file.type === 'application/pdf') {
      setProofPreviewUrl(null); // PDFs have no image preview
    } else {
      const url = URL.createObjectURL(file);
      setProofPreviewUrl(url);
    }
  };

  const handleRemoveProof = () => {
    if (proofPreviewUrl) URL.revokeObjectURL(proofPreviewUrl);
    setProofFile(null);
    setProofPreviewUrl(null);
    setProofError('');
  };

  const handleCancelRegistration = async () => {
    if (!event || actionLoading || !confirm('Are you sure you want to cancel your registration?')) return;

    setActionLoading(true);
    try {
      const res = await fetch(`/api/events/${event.slug}/register`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setRegistered(false);
        fetchDetail();
      } else {
        alert(data.error || 'Failed to cancel registration');
      }
    } catch (error) {
      console.error('Error cancelling registration:', error);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading || !event) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-white dark:bg-[#111] font-serif text-black dark:text-[#eee]">
        <div className="flex flex-col items-center gap-6">
          <div className="w-12 h-12 border-t-2 border-b-2 border-black dark:border-white animate-spin"></div>
          <p className="tracking-[0.2em] uppercase text-xs font-sans font-bold">PRINTING PRESS</p>
        </div>
      </div>
    );
  }

  const registrationOpen = event.status === 'UPCOMING' && new Date(event.date).getTime() > Date.now();
  const isFull = event.maxCapacity !== null && event._count.registrations >= event.maxCapacity;
  const remainingSeats = event.maxCapacity !== null ? Math.max(0, event.maxCapacity - event._count.registrations) : null;
  const formConfig = parseEventFormConfig(event.customFormFields, event.isCompetition);
  const eventDate = new Date(event.date);
  const eventType = event.isCompetition 
    ? 'Competition' 
    : event.title.toLowerCase().includes('workshop') 
      ? 'Workshop' 
      : 'Event';

  return (
    <main className="w-full min-h-screen bg-white dark:bg-[#111] text-black dark:text-[#eee] font-serif selection:bg-black selection:text-white dark:selection:bg-white dark:selection:text-black transition-colors duration-300">
      
      {/* Newspaper Masthead Navigation */}
      <div className="w-full border-b border-black dark:border-[#eee] py-3.5 px-4 md:px-8 flex justify-between items-center bg-transparent">
        {galleryOpen ? (
          <button 
            onClick={() => setGalleryOpen(false)} 
            className="text-xs uppercase tracking-widest font-sans font-bold hover:underline underline-offset-4 flex items-center gap-2 cursor-pointer text-left"
          >
            <ArrowLeft className="w-4 h-4" /> <span>FOLD / RETURN TO EVENT DISPATCH</span>
          </button>
        ) : (
          <Link 
            href="/events" 
            className="text-xs uppercase tracking-widest font-sans font-bold hover:underline underline-offset-4 flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> <span>THE DAILY ARCHIVE</span>
          </Link>
        )}
        <div className="text-xs uppercase tracking-widest font-sans font-bold text-right hidden md:block">
          {galleryOpen ? 'PICTORIAL SUPPLEMENT · VOL. I' : (formConfig.volumeIssueLabel || `VOL. I — ISSUE ${event.id.substring(0, 6).toUpperCase()}`)}
        </div>
      </div>

      <div className="w-full max-w-screen-2xl mx-auto px-4 md:px-8 py-8 md:py-12" style={{ perspective: 1800 }}>
        
        {/* Newspaper Headline Block */}
        <div className="border-b-4 md:border-b-[6px] border-double border-black dark:border-[#eee] pb-8 mb-8 text-center flex flex-col items-center">
          <div className="text-[10px] md:text-xs font-sans font-bold uppercase tracking-[0.3em] mb-6 flex items-center gap-4">
            <span className="w-8 md:w-16 h-px bg-black dark:bg-[#eee]" />
            {eventType} / {galleryOpen ? 'PICTORIAL ARCHIVES' : event.status}
            <span className="w-8 md:w-16 h-px bg-black dark:bg-[#eee]" />
          </div>
          <h1 className="font-serif text-5xl md:text-7xl lg:text-[7rem] font-bold uppercase tracking-tighter leading-[0.9] max-w-5xl mx-auto">
            {event.title}
          </h1>
          {galleryOpen && (
            <p className="mt-4 font-mono text-xs uppercase tracking-[0.25em] text-neutral-600 dark:text-neutral-400">
              Photographic Supplement & Archival Visual Records
            </p>
          )}
        </div>

        {/* 3D Vertical Newspaper Flip Transition */}
        <AnimatePresence mode="wait" initial={false}>
          {!galleryOpen ? (
            /* FRONT FACE: Main Event Editorial Story & Coupon Ticket */
            <motion.div
              key="event-overview"
              initial={{ opacity: 0, rotateX: 45, y: -20, scale: 0.98 }}
              animate={{ opacity: 1, rotateX: 0, y: 0, scale: 1 }}
              exit={{ opacity: 0, rotateX: -45, y: 20, scale: 0.98 }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              style={{ transformOrigin: 'top center', backfaceVisibility: 'hidden' }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start"
            >
              {/* Left Column - Article Content (8 cols) */}
              <div className="lg:col-span-8 flex flex-col lg:border-r border-black dark:border-[#eee] lg:pr-12">
                
                {/* Article Info Bar */}
                <div className="border-y-2 border-black dark:border-[#eee] py-4 mb-8 font-sans">
                  {/* Row 1: Date & Time */}
                  <div className="grid grid-cols-2 gap-x-6 pb-3.5 border-b border-black/15 dark:border-white/15">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-neutral-500 dark:text-neutral-400 mb-1">
                        DATE
                      </span>
                      <span className="text-sm sm:text-base md:text-lg font-bold uppercase tracking-tight text-foreground">
                        {eventDate.toLocaleDateString(undefined, { month: 'short', day: '2-digit', year: 'numeric' })}
                      </span>
                    </div>

                    <div className="flex flex-col border-l border-black/15 dark:border-white/15 pl-4 sm:pl-6">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-neutral-500 dark:text-neutral-400 mb-1">
                        TIME
                      </span>
                      <span className="text-sm sm:text-base md:text-lg font-bold uppercase tracking-tight text-foreground">
                        {event.time || 'TBA'}
                      </span>
                    </div>
                  </div>

                  {/* Row 2: Location & Capacity */}
                  <div className="grid grid-cols-2 gap-x-6 pt-3.5">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-neutral-500 dark:text-neutral-400 mb-1">
                        LOCATION
                      </span>
                      <span className="text-sm sm:text-base md:text-lg font-bold uppercase tracking-tight leading-snug text-foreground">
                        {event.venue}
                      </span>
                    </div>

                    <div className="flex flex-col border-l border-black/15 dark:border-white/15 pl-4 sm:pl-6">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-neutral-500 dark:text-neutral-400 mb-1">
                        CAPACITY
                      </span>
                      <span className="text-sm sm:text-base md:text-lg font-bold uppercase tracking-tight text-foreground">
                        {event.maxCapacity ? `${event.maxCapacity} SEATS` : 'UNLIMITED'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Article Body */}
                <div className="mb-12 border-b border-black dark:border-[#eee] pb-12">
                  <h3 className="font-sans text-xl font-bold uppercase tracking-tighter mb-6 border-b-[3px] border-double border-black dark:border-[#eee] pb-2">THE DISPATCH & DETAILS</h3>
                  
                  <div className="flow-root">
                    <figure className="w-full md:w-[48%] lg:w-[45%] float-none md:float-left md:mr-8 mb-6 flex flex-col">
                      <img 
                        src={getOptimizedCardUrl(event.posterImage || 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&fit=crop', 800)} 
                        alt={event.title}
                        className="w-full h-auto grayscale border border-black dark:border-[#eee] p-1 shadow-sm"
                      />
                      <figcaption className="text-[10px] font-sans uppercase tracking-widest mt-2.5 border-b border-black dark:border-[#eee] pb-1.5 text-center md:text-left opacity-75">
                        FIG 1. — OFFICIAL EXHIBITION POSTER
                      </figcaption>
                    </figure>
                    
                    <div className="space-y-6 text-lg md:text-xl leading-relaxed font-serif text-left">
                      {event.description.split('\n\n').map((paragraph, i) => (
                        <p 
                          key={i} 
                          className={i === 0 ? "first-letter:text-7xl first-letter:font-bold first-letter:float-left first-letter:mr-3.5 first-letter:mt-1 first-letter:font-serif first-letter:leading-none" : ""}
                        >
                          {paragraph}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Classifieds / Appendices */}
                {(event.rulebookUrl || event.socialLink || event.downloadUrl) && (
                  <div className="mb-12 border-b-[3px] border-double border-black dark:border-[#eee] pb-12">
                    <h3 className="font-sans text-xl font-bold uppercase tracking-tighter mb-6 text-center border-y border-black dark:border-[#eee] py-2">CLASSIFIEDS & ATTACHMENTS</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {event.rulebookUrl && (
                        <a href={event.rulebookUrl} target="_blank" rel="noopener noreferrer" className="p-4 border border-black dark:border-[#eee] hover:bg-black hover:text-white dark:hover:bg-[#eee] dark:hover:text-[#111] transition-colors font-sans flex flex-col justify-between group">
                          <div>
                            <span className="block text-[10px] font-bold uppercase tracking-widest opacity-70 mb-1">OFFICIAL NOTICE</span>
                            <span className="block font-bold uppercase text-sm">Rules & Guidelines</span>
                          </div>
                          <ExternalLink className="w-4 h-4 mt-4 self-end" />
                        </a>
                      )}
                      {event.downloadUrl ? (
                        <a href={event.downloadUrl} target="_blank" rel="noopener noreferrer" className="p-4 border border-black dark:border-[#eee] hover:bg-black hover:text-white dark:hover:bg-[#eee] dark:hover:text-[#111] transition-colors font-sans flex flex-col justify-between group">
                          <div>
                            <span className="block text-[10px] font-bold uppercase tracking-widest opacity-70 mb-1">ARCHIVE</span>
                            <span className="block font-bold uppercase text-sm">Download Materials</span>
                          </div>
                          <Download className="w-4 h-4 mt-4 self-end" />
                        </a>
                      ) : (
                        <div className="p-4 border border-dashed border-black/40 dark:border-[#eee]/40 opacity-55 font-sans flex flex-col justify-between">
                          <div>
                            <span className="block text-[10px] font-bold uppercase tracking-widest opacity-70 mb-1">ARCHIVE</span>
                            <span className="block font-bold uppercase text-sm">Download Materials</span>
                          </div>
                          <span className="mt-4 self-end text-[10px] font-bold uppercase tracking-widest">Not attached</span>
                        </div>
                      )}
                      {event.socialLink && (
                        <a href={event.socialLink} target="_blank" rel="noopener noreferrer" className="p-4 border border-black dark:border-[#eee] hover:bg-black hover:text-white dark:hover:bg-[#eee] dark:hover:text-[#111] transition-colors font-sans flex flex-col justify-between group">
                          <div>
                            <span className="block text-[10px] font-bold uppercase tracking-widest opacity-70 mb-1">BROADCAST</span>
                            <span className="block font-bold uppercase text-sm">Social Coverage</span>
                          </div>
                          <Globe className="w-4 h-4 mt-4 self-end" />
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {/* Competition Winners */}
                {event.isCompetition && event.winners && event.winners.length > 0 && (
                  <div className="mb-12 border-b-[3px] border-double border-black dark:border-[#eee] pb-12">
                    <h3 className="font-sans text-xl font-bold uppercase tracking-tighter mb-8 text-center flex items-center justify-center gap-2">
                      <Award className="w-5 h-5" /> <span>OFFICIAL ROLL OF HONOUR</span> <Award className="w-5 h-5" />
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {event.winners.map((win) => (
                        <div key={win.id} className="border border-black dark:border-[#eee] p-5 text-center flex flex-col items-center">
                          <div className="w-20 h-20 mb-4 border border-black dark:border-[#eee] p-1 bg-white dark:bg-[#111]">
                            {win.photoUrl ? (
                              <img src={getOptimizedAvatarUrl(win.photoUrl, 160)} alt={win.participantName} className="w-full h-full rounded-full object-cover grayscale" />
                            ) : (
                              <div className="w-full h-full rounded-full flex items-center justify-center bg-gray-100 dark:bg-zinc-900 font-serif text-3xl">
                                {win.participantName.charAt(0)}
                              </div>
                            )}
                          </div>
                          <span className="block text-[10px] font-sans font-bold uppercase tracking-[0.2em] mb-1">{win.position.replace('_', ' ')}</span>
                          <span className="block font-serif text-2xl font-bold mb-1">{win.participantName}</span>
                          {win.prize && <span className="block text-xs font-sans italic opacity-70 uppercase tracking-widest">{win.prize}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Archived Reports & Documents */}
                {event.status === 'PAST' && (
                  <div className="border-t-[3px] border-double border-black dark:border-[#eee] pt-8">
                    <h3 className="font-sans text-xl font-bold uppercase tracking-tighter mb-6">ARCHIVES & RECORDS</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {(() => {
                        const userRole = (session?.user as any)?.role;
                        const isTeamMember = userRole ? isStaff(userRole) : false;

                        const teamUrl =
                          event.internalReportUrl ||
                          `/admin/events/${event.id}` ||
                          `#team-report`;
                        const publicUrl =
                          event.externalReportUrl ||
                          event.socialLink ||
                          `#viewer-report`;

                        const targetUrl = isTeamMember ? teamUrl : publicUrl;
                        const isExternal =
                          targetUrl.startsWith('http://') ||
                          targetUrl.startsWith('https://') ||
                          targetUrl.startsWith('//');

                        return (
                          <a
                            href={targetUrl}
                            target={isExternal ? '_blank' : '_self'}
                            rel={isExternal ? 'noopener noreferrer' : undefined}
                            className="flex items-center justify-between p-4 border border-black dark:border-[#eee] hover:bg-black hover:text-white dark:hover:bg-[#eee] dark:hover:text-[#111] transition-colors font-sans group cursor-pointer"
                            title={
                              isTeamMember
                                ? 'Executive & Team Documentation'
                                : 'Public & Volunteer Documentation'
                            }
                          >
                            <div>
                              <span className="block text-[10px] font-bold uppercase tracking-widest opacity-70 mb-1">
                                {isTeamMember
                                  ? 'INTERNAL · TEAM ACCESS'
                                  : 'DOCUMENTATION · REPORT'}
                              </span>
                              <span className="block text-lg font-bold uppercase">
                                Event Report
                              </span>
                            </div>
                            <ExternalLink className="w-5 h-5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                          </a>
                        );
                      })()}

                      {event._count.gallery > 0 && (
                        <button
                          onClick={toggleGallery}
                          className="flex items-center justify-between p-4 border border-black dark:border-[#eee] hover:bg-black hover:text-white dark:hover:bg-[#eee] dark:hover:text-[#111] transition-colors font-sans group text-left cursor-pointer"
                        >
                          <div>
                            <span className="block text-[10px] font-bold uppercase tracking-widest opacity-70 mb-1">
                              PICTORIAL SUPPLEMENT
                            </span>
                            <span className="block text-lg font-bold uppercase">
                              Photo Gallery ({event._count.gallery})
                            </span>
                          </div>
                          <Camera className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        </button>
                      )}
                    </div>
                  </div>
                )}

              </div>

              {/* Right Column - Coupon Ticket (4 cols) */}
              <div className="lg:col-span-4 sticky top-20">
                
                {/* Newspaper Cutout Coupon Ticket */}
                <div className="w-full border-2 border-dashed border-black dark:border-[#eee] p-6 bg-white dark:bg-[#111] relative">
                  <div className="absolute -top-3 -right-3 bg-white dark:bg-[#111] p-1 px-2 border border-black dark:border-[#eee]">
                    <span className="text-[10px] font-sans font-bold uppercase">✂️ CUT HERE</span>
                  </div>
                  
                  <div className="text-center font-serif text-3xl font-bold uppercase mb-6 mt-2 border-b-[3px] border-double border-black dark:border-[#eee] pb-4">
                    ADMISSION COUPON
                  </div>
                  
                  {/* Dynamic Ticket Metadata Fields */}
                  <div className="space-y-4 mb-6 font-sans">
                    {/* Event Code */}
                    <div className="flex justify-between items-end border-b border-black dark:border-[#eee] pb-2">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 dark:text-neutral-400">EVENT CODE</span>
                      <span className="font-mono font-bold text-xs uppercase tracking-wider text-right">
                        {event.slug.toUpperCase()}
                      </span>
                    </div>

                    {/* 1. Dynamic Entry Tariff */}
                    <div className="flex justify-between items-end border-b border-black dark:border-[#eee] pb-2">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 dark:text-neutral-400">ENTRY TARIFF</span>
                      <span className={`font-bold text-base uppercase ${
                        event.requirePayment && event.paymentAmount
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-emerald-600 dark:text-emerald-400'
                      }`}>
                        {event.requirePayment && event.paymentAmount ? event.paymentAmount : 'FREE / COMPLIMENTARY'}
                      </span>
                    </div>

                    {/* 2. Dynamic Access / Target Audience */}
                    <div className="flex justify-between items-end border-b border-black dark:border-[#eee] pb-2">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 dark:text-neutral-400">ACCESS</span>
                      <span className="font-bold text-sm uppercase text-right max-w-50 truncate" title={formConfig.access}>
                        {formConfig.access || 'ALL STUDENTS & MEMBERS'}
                      </span>
                    </div>

                    {/* 3. Dynamic Availability Autofetch */}
                    <div className="flex justify-between items-end border-b border-black dark:border-[#eee] pb-2">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 dark:text-neutral-400">AVAILABILITY</span>
                      <span className={`font-bold text-sm uppercase text-right ${formConfig.isOnHold ? 'text-amber-600 dark:text-amber-400' : ''}`}>
                        {!registrationOpen
                          ? 'OFFER CLOSED'
                          : formConfig.isOnHold
                            ? 'ON HOLD / PAUSED'
                            : isFull
                              ? 'CAPACITY FULL'
                              : remainingSeats !== null
                                ? `${remainingSeats} SEATS LEFT`
                                : 'OPEN ADMISSION'}
                      </span>
                    </div>

                    {/* 4. Dynamic Inclusions */}
                    <div className="flex justify-between items-end border-b border-black dark:border-[#eee] pb-2">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 dark:text-neutral-400">INCLUSIONS</span>
                      <span className="font-bold text-sm uppercase text-right max-w-50 truncate" title={formConfig.inclusions}>
                        {formConfig.inclusions || (event.isCompetition ? 'PRIZE POOL & PASS' : 'CERTIFICATE & KIT')}
                      </span>
                    </div>
                  </div>

                  {/* Action Area */}
                  <div className="mb-5">
                    {registrationOpen ? (
                      registered ? (
                        <div className="space-y-3 font-sans">
                          {/* Granular ticket status based on paymentStatus */}
                          {registrationDetails?.paymentStatus === 'CANCELLED_REFUND_PENDING' ? (
                            <div className="flex items-center justify-center gap-2 py-3.5 border-2 border-dashed border-amber-500/80 dark:border-amber-400/80 bg-amber-50 dark:bg-amber-950/20 text-center text-xs font-bold uppercase tracking-widest text-amber-700 dark:text-amber-300">
                              REFUND WAITING
                            </div>
                          ) : registrationDetails?.paymentStatus === 'PENDING' && event.requirePayment ? (
                            <div className="flex items-center justify-center gap-2 py-3.5 border-2 border-black dark:border-[#eee] bg-neutral-100 dark:bg-neutral-900 text-center text-xs font-bold uppercase tracking-widest text-neutral-600 dark:text-neutral-300">
                              REDEEM PENDING
                            </div>
                          ) : (
                            <div className="flex items-center justify-center gap-2 py-3.5 border-2 border-black dark:border-[#eee] bg-neutral-100 dark:bg-neutral-900 text-center text-xs font-bold uppercase tracking-widest">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> COUPON REDEEMED
                            </div>
                          )}
                          {registrationDetails?.paymentStatus !== 'CANCELLED_REFUND_PENDING' && (
                            <button 
                              onClick={handleCancelRegistration} 
                              disabled={actionLoading} 
                              className="w-full py-2 text-[10px] font-bold uppercase tracking-widest text-neutral-500 hover:text-black dark:hover:text-white underline underline-offset-4"
                            >
                              CANCEL RESERVATION
                            </button>
                          )}
                        </div>
                      ) : formConfig.isOnHold ? (
                        <div className="space-y-2 font-sans">
                          <div className="py-3.5 border-2 border-dashed border-amber-500/80 dark:border-amber-400/80 text-center text-xs font-bold uppercase tracking-[0.18em] bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300">
                            REGISTRATIONS ON HOLD
                          </div>
                          {formConfig.holdReason && (
                            <p className="text-[10px] text-center text-neutral-500 dark:text-neutral-400 italic">
                              &ldquo;{formConfig.holdReason}&rdquo;
                            </p>
                          )}
                        </div>
                      ) : isFull ? (
                        <div className="py-4 border-2 border-black dark:border-[#eee] font-sans text-center text-[10px] font-bold uppercase tracking-widest bg-gray-100 dark:bg-zinc-800">
                          NO COUPONS LEFT
                        </div>
                      ) : (
                        <button
                          onClick={() => session ? setModalOpen(true) : setShowLoginModal(true)}
                          className="w-full py-4 bg-black dark:bg-[#eee] text-white dark:text-black font-sans font-bold uppercase tracking-[0.2em] text-xs md:text-sm hover:opacity-80 transition-opacity border-2 border-black dark:border-[#eee] shadow-sm cursor-pointer"
                        >
                          REDEEM COUPON
                        </button>
                      )
                    ) : (
                      <div className="py-4 font-sans text-center text-xs font-bold uppercase tracking-[0.2em] border border-black dark:border-[#eee] opacity-60">
                        EXPIRED OFFER
                      </div>
                    )}


                  </div>

                  {/* Vintage Ticket Barcode & Serial */}
                  <div className="pt-3.5 border-t border-dashed border-black dark:border-[#eee] flex flex-col items-center gap-1.5 opacity-70 select-none">
                    <div className="flex gap-0.75 h-6 items-center">
                      <span className="w-0.5 h-full bg-black dark:bg-[#eee]" />
                      <span className="w-0.5 h-full bg-black dark:bg-[#eee]" />
                      <span className="w-px h-full bg-black dark:bg-[#eee]" />
                      <span className="w-0.75 h-full bg-black dark:bg-[#eee]" />
                      <span className="w-px h-full bg-black dark:bg-[#eee]" />
                      <span className="w-0.5 h-full bg-black dark:bg-[#eee]" />
                      <span className="w-1 h-full bg-black dark:bg-[#eee]" />
                      <span className="w-px h-full bg-black dark:bg-[#eee]" />
                      <span className="w-0.5 h-full bg-black dark:bg-[#eee]" />
                      <span className="w-px h-full bg-black dark:bg-[#eee]" />
                      <span className="w-0.75 h-full bg-black dark:bg-[#eee]" />
                      <span className="w-0.5 h-full bg-black dark:bg-[#eee]" />
                      <span className="w-px h-full bg-black dark:bg-[#eee]" />
                      <span className="w-1 h-full bg-black dark:bg-[#eee]" />
                      <span className="w-0.5 h-full bg-black dark:bg-[#eee]" />
                      <span className="w-px h-full bg-black dark:bg-[#eee]" />
                      <span className="w-0.75 h-full bg-black dark:bg-[#eee]" />
                      <span className="w-px h-full bg-black dark:bg-[#eee]" />
                      <span className="w-0.5 h-full bg-black dark:bg-[#eee]" />
                    </div>
                    <span className="text-[9px] font-mono tracking-[0.25em] uppercase text-center font-bold">
                      {registrationDetails
                        ? `${(formConfig.passPrefix || 'EXC-PASS').toUpperCase()}-${event.slug.replace(/^exc-/, '').toUpperCase()}-${registrationDetails.id.substring(0, 6).toUpperCase()}`
                        : `${(formConfig.passPrefix || 'EXC-PASS').toUpperCase()}-${event.slug.replace(/^exc-/, '').toUpperCase()}-XXXXXX`}
                    </span>
                  </div>
                </div>

              </div>
            </motion.div>
          ) : (
            /* REVERSE FACE: Broadsheet Pictorial Masonry Grid */
            <motion.div
              key="event-gallery"
              initial={{ opacity: 0, rotateX: -45, y: -20, scale: 0.98 }}
              animate={{ opacity: 1, rotateX: 0, y: 0, scale: 1 }}
              exit={{ opacity: 0, rotateX: 45, y: 20, scale: 0.98 }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              style={{ transformOrigin: 'top center', backfaceVisibility: 'hidden' }}
              className="w-full flex flex-col"
            >
              {galleryLoading ? (
                <div className="py-28 text-center font-serif text-xl animate-pulse opacity-70">
                  Opening broadsheet archive...
                </div>
              ) : galleryItems.length === 0 ? (
                <div className="py-20 text-center text-base font-sans opacity-70 border border-dashed border-black dark:border-[#eee] p-12">
                  No photographs uploaded for this event edition.
                </div>
              ) : (
                <>
                  <motion.div 
                    initial="hidden"
                    animate="show"
                    variants={{
                      hidden: { opacity: 0 },
                      show: {
                        opacity: 1,
                        transition: { staggerChildren: 0.05, delayChildren: 0.08 }
                      }
                    }}
                    className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6"
                  >
                    {galleryItems.map((item, idx) => (
                      <GalleryTile
                        key={item.id}
                        item={item}
                        idx={idx}
                        onSelect={() => setLightboxIndex(idx)}
                      />
                    ))}
                  </motion.div>

                  <div className="mt-14 pt-8 border-t-[3px] border-double border-black dark:border-[#eee] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex flex-col justify-center gap-1 min-w-0">
                      <span className="text-xs font-mono uppercase tracking-[0.2em] font-semibold opacity-75">
                        ARCHIVAL RESOLUTION &middot; {galleryItems.length} PHOTOGRAPHS
                      </span>
                      <p className="text-[11px] font-sans text-neutral-600 dark:text-neutral-400">
                        {isExcelsiorMember 
                          ? 'Internal uncompressed raw resolution archive on Google Drive'
                          : 'Curated public edition photo highlights and memories on Google Drive'}
                      </p>
                    </div>

                    <a
                      href={driveDownloadUrl || (isExcelsiorMember ? (event.internalGalleryUrl || 'https://drive.google.com/drive/folders/excelsior-members-full-archive') : (event.externalGalleryUrl || 'https://drive.google.com/drive/folders/excelsior-public-highlights-gallery'))}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-black text-white dark:bg-[#eee] dark:text-[#111] font-sans text-xs font-bold uppercase tracking-[0.24em] hover:bg-neutral-800 dark:hover:bg-white transition-colors cursor-pointer select-none shrink-0 self-start sm:self-auto"
                    >
                      <Download size={16} />
                      <span>{isExcelsiorMember ? 'Download Member Drive' : 'Download Public Drive'}</span>
                    </a>
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Lightbox Preview Modal */}
      <AnimatePresence>
        {lightboxIndex !== null && galleryItems[lightboxIndex] && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightboxIndex(null)}
            className="fixed inset-0 z-1000 bg-black/95 backdrop-blur-md flex items-center justify-center p-4 md:p-8"
          >
            <button
              onClick={() => setLightboxIndex(null)}
              className="absolute top-6 right-6 p-3 text-white/80 hover:text-white border border-white/20 rounded-full hover:bg-white/10 transition cursor-pointer z-50"
              aria-label="Close image"
            >
              <X size={22} />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIndex(
                  (lightboxIndex - 1 + galleryItems.length) % galleryItems.length
                );
              }}
              className="absolute left-6 top-1/2 -translate-y-1/2 p-3 text-white/80 hover:text-white border border-white/20 rounded-full hover:bg-white/10 transition cursor-pointer z-50"
              aria-label="Previous image"
            >
              <ChevronLeft size={24} />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIndex((lightboxIndex + 1) % galleryItems.length);
              }}
              className="absolute right-6 top-1/2 -translate-y-1/2 p-3 text-white/80 hover:text-white border border-white/20 rounded-full hover:bg-white/10 transition cursor-pointer z-50"
              aria-label="Next image"
            >
              <ChevronRight size={24} />
            </button>

            <div
              onClick={(e) => e.stopPropagation()}
              className="max-w-4xl max-h-[85vh] flex flex-col items-center select-none"
            >
              <img
                src={galleryItems[lightboxIndex].url}
                alt="Enlarged photo"
                className="max-h-[80vh] w-auto object-contain border border-white/20 shadow-2xl"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Newspaper Registration Modal Overlay — Vintage Dope Style with Desktop Scrollbar & Lenis Isolation */}
      <AnimatePresence>
        {modalOpen && (
          <div 
            data-lenis-prevent
            className="fixed inset-0 z-1000 flex items-center justify-center p-3 sm:p-6 md:p-10"
          >
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="fixed inset-0 bg-black/80 dark:bg-black/85 backdrop-blur-sm" 
              onClick={() => setModalOpen(false)} 
            />
            {/* Modal Card with native vertical scrollbar */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              data-lenis-prevent
              className="relative z-10 w-full max-w-xl max-h-[85vh] overflow-y-auto overscroll-contain bg-white dark:bg-[#111] border-4 border-double border-black dark:border-[#eee] p-6 sm:p-10 md:p-12 shadow-2xl [&::-webkit-scrollbar]:w-2.5 [&::-webkit-scrollbar-thumb]:bg-neutral-400 dark:[&::-webkit-scrollbar-thumb]:bg-neutral-600 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-neutral-100 dark:[&::-webkit-scrollbar-track]:bg-neutral-900"
              style={{
                scrollbarWidth: 'auto',
                scrollbarColor: '#777777 transparent',
              }}
            >
                
                <div className="text-center mb-8 border-b border-black dark:border-[#eee] pb-6 relative">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="absolute right-0 top-0 p-1 text-neutral-400 hover:text-black dark:hover:text-white transition-colors cursor-pointer"
                    aria-label="Close form"
                  >
                    <X size={18} />
                  </button>
                  <h3 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold uppercase tracking-tight text-black dark:text-[#eee] mb-1.5">
                    RSVP FORM
                  </h3>
                  <p className="text-[10px] font-sans font-bold uppercase tracking-[0.2em] text-neutral-600 dark:text-neutral-400 line-clamp-1">
                    {event.title}
                  </p>
                </div>

                <form onSubmit={handleRegister} className="space-y-6 font-sans">
                  {/* 1. Full Name */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-black dark:text-[#eee] flex items-center justify-between">
                      <span>
                        {(formConfig.standardFields.nameLabel || 'FULL NAME').toUpperCase()}
                        {formConfig.standardFields.nameRequired && <span className="text-red-500 ml-0.5">*</span>}
                      </span>
                    </label>
                    <input 
                      type="text" 
                      value={name} 
                      onChange={(e) => setName(e.target.value)} 
                      required={formConfig.standardFields.nameRequired} 
                      className="w-full bg-transparent border-b-2 border-dashed border-black dark:border-[#eee] px-2 py-3 text-base sm:text-lg font-serif focus:outline-none focus:border-solid transition-colors placeholder:text-gray-400 dark:placeholder:text-gray-600 rounded-none text-black dark:text-[#eee]" 
                      placeholder={(formConfig.standardFields.namePlaceholder || 'E.G. JOHN DOE').toUpperCase()}
                    />
                  </div>

                  {/* 2. Email Address */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-black dark:text-[#eee] flex items-center justify-between">
                      <span>
                        {(formConfig.standardFields.emailLabel || 'EMAIL ADDRESS').toUpperCase()}
                        {formConfig.standardFields.emailRequired && <span className="text-red-500 ml-0.5">*</span>}
                      </span>
                    </label>
                    <input 
                      type="email" 
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)} 
                      required={formConfig.standardFields.emailRequired} 
                      className="w-full bg-transparent border-b-2 border-dashed border-black dark:border-[#eee] px-2 py-3 text-base sm:text-lg font-serif focus:outline-none focus:border-solid transition-colors placeholder:text-gray-400 dark:placeholder:text-gray-600 rounded-none text-black dark:text-[#eee]"
                      placeholder={(formConfig.standardFields.emailPlaceholder || 'E.G. JOHN@EXAMPLE.COM').toUpperCase()} 
                    />
                  </div>

                  {/* 3. WhatsApp / Phone */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-black dark:text-[#eee] flex items-center justify-between">
                      <span>
                        {(formConfig.standardFields.phoneLabel || 'WHATSAPP / PHONE').toUpperCase()}
                        {formConfig.standardFields.phoneRequired && <span className="text-red-500 ml-0.5">*</span>}
                      </span>
                    </label>
                    <input 
                      type="tel" 
                      value={phone} 
                      onChange={(e) => setPhone(e.target.value)} 
                      required={formConfig.standardFields.phoneRequired}
                      className="w-full bg-transparent border-b-2 border-dashed border-black dark:border-[#eee] px-2 py-3 text-base sm:text-lg font-serif focus:outline-none focus:border-solid transition-colors placeholder:text-gray-400 dark:placeholder:text-gray-600 rounded-none text-black dark:text-[#eee]" 
                      placeholder={formConfig.standardFields.phonePlaceholder || '+91 98765 43210'} 
                    />
                  </div>

                  {/* Additional Custom Fields */}
                  {(formConfig.fields || []).map((field) => {
                    const current = answers[field.id];
                    const toggleMulti = (option: string, checked: boolean) => {
                      const list = Array.isArray(current) ? current : [];
                      setAnswers((all) => ({
                        ...all,
                        [field.id]: checked ? [...list, option] : list.filter((o) => o !== option),
                      }));
                    };
                    const isChoice = field.type === 'select' || field.type === 'multiselect';
                    return (
                      <div key={field.id} className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-black dark:text-[#eee] flex items-center justify-between">
                          <span>
                            {field.label.toUpperCase()}{field.required ? ' *' : ''}
                          </span>
                          {field.type === 'multiselect' && <span className="ml-2 font-mono text-[9px] normal-case tracking-normal text-neutral-500">(pick any)</span>}
                        </label>
                        {field.type === 'textarea' ? (
                          <textarea 
                            required={field.required} 
                            value={String(current || '')} 
                            onChange={(e) => setAnswers((all) => ({ ...all, [field.id]: e.target.value }))} 
                            rows={3}
                            placeholder="Type response…"
                            className="w-full bg-transparent border-b-2 border-dashed border-black dark:border-[#eee] px-2 py-3 text-base sm:text-lg font-serif focus:outline-none focus:border-solid transition-colors text-black dark:text-[#eee]" 
                          />
                        ) : isChoice ? (
                          field.type === 'select' ? (
                            <select 
                              required={field.required} 
                              value={String(current || '')} 
                              onChange={(e) => setAnswers((all) => ({ ...all, [field.id]: e.target.value }))} 
                              className="w-full bg-transparent border-b-2 border-dashed border-black dark:border-[#eee] px-2 py-3 text-base sm:text-lg font-serif focus:outline-none text-black dark:text-[#eee]"
                            >
                              <option value="" disabled hidden className="text-muted-foreground bg-white dark:bg-neutral-900">
                                Choose an option…
                              </option>
                              {(field.options || []).map((option) => (
                                <option key={option} value={option} className="text-black bg-white dark:bg-neutral-900 dark:text-white">
                                  {option}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <div className="space-y-1.5 pt-1">
                              {(field.options || []).map((option) => (
                                <label key={option} className="flex cursor-pointer items-center gap-3 py-1 text-sm font-sans text-black dark:text-[#eee]">
                                  <input 
                                    type="checkbox" 
                                    checked={Array.isArray(current) && current.includes(option)} 
                                    onChange={(e) => toggleMulti(option, e.target.checked)} 
                                    className="h-4 w-4 accent-black dark:accent-white" 
                                  />
                                  <span className="font-serif text-base sm:text-lg">{option}</span>
                                </label>
                              ))}
                            </div>
                          )
                        ) : field.type === 'checkbox' ? (
                          <label className="flex gap-3 text-sm items-center cursor-pointer text-black dark:text-[#eee] py-1">
                            <input 
                              type="checkbox" 
                              checked={Boolean(current)} 
                              onChange={(e) => setAnswers((all) => ({ ...all, [field.id]: e.target.checked }))} 
                              className="h-4 w-4 accent-black dark:accent-white" 
                            />
                            <span className="font-serif text-base sm:text-lg">{field.label}</span>
                          </label>
                        ) : (
                          <input 
                            required={field.required} 
                            type={field.type === 'number' ? 'number' : 'text'} 
                            value={String(current || '')} 
                            onChange={(e) => setAnswers((all) => ({ ...all, [field.id]: e.target.value }))} 
                            className="w-full bg-transparent border-b-2 border-dashed border-black dark:border-[#eee] px-2 py-3 text-base sm:text-lg font-serif focus:outline-none focus:border-solid transition-colors text-black dark:text-[#eee]" 
                          />
                        )}
                      </div>
                    );
                  })}

                  {/* Payment Box */}
                  {event.requirePayment && (
                    <div className="space-y-4 border-y border-dashed border-black dark:border-[#eee] py-6">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-black dark:text-[#eee]">
                          Payment {event.paymentAmount ? `· ${event.paymentAmount}` : ''}
                        </span>
                        <span className="font-mono text-[9px] uppercase tracking-wider text-black dark:text-white font-bold border border-black dark:border-white px-2 py-0.5">
                          Verification Required
                        </span>
                      </div>
                      {event.paymentInstructions && (
                        <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed font-sans">
                          {event.paymentInstructions}
                        </p>
                      )}
                      {event.paymentQrImage && (
                        <div className="flex justify-center p-2">
                          <img 
                            src={event.paymentQrImage} 
                            alt="Payment QR code" 
                            className="h-44 w-44 object-contain border border-black p-1 dark:border-[#eee] bg-white shadow-sm"
                          />
                        </div>
                      )}
                      {/* Proof file — local preview, upload happens on submit */}
                      {proofFile ? (
                        <div className="border-2 border-black dark:border-[#eee] p-3 space-y-2">
                          <div className="flex items-start gap-3">
                            {proofPreviewUrl ? (
                              <img
                                src={proofPreviewUrl}
                                alt="Payment proof preview"
                                className="w-20 h-20 object-cover border border-black dark:border-[#eee] shrink-0"
                              />
                            ) : (
                              <div className="w-20 h-20 flex items-center justify-center border border-black dark:border-[#eee] shrink-0 bg-neutral-100 dark:bg-neutral-800">
                                <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-center leading-tight px-1">PDF<br/>FILE</span>
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-0.5">PROOF ATTACHED ✓</p>
                              <p className="text-[10px] font-sans text-neutral-600 dark:text-neutral-400 truncate">{proofFile.name}</p>
                              <p className="text-[9px] font-mono text-neutral-400 dark:text-neutral-500">{(proofFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                            </div>
                            <button
                              type="button"
                              onClick={handleRemoveProof}
                              className="shrink-0 p-1 text-neutral-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                              aria-label="Remove proof"
                            >
                              <X size={16} />
                            </button>
                          </div>
                          <p className="text-[9px] font-mono text-neutral-400 dark:text-neutral-500 italic">Will be uploaded on submission</p>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center cursor-pointer border-2 border-dashed border-black dark:border-[#eee] px-4 py-5 gap-1.5 hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-black dark:text-[#eee]">Upload Payment Proof *</span>
                          <span className="text-[9px] font-mono text-neutral-500 dark:text-neutral-400">Image or PDF · max 5 MB</span>
                          <input
                            hidden
                            required
                            type="file"
                            accept={ACCEPT_MAP.PAYMENT_PROOF}
                            onChange={handleProofFileChange}
                          />
                        </label>
                      )}
                      {proofError && (
                        <p className="text-[10px] font-sans font-bold text-red-600 dark:text-red-400">{proofError}</p>
                      )}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="pt-8 pb-4 flex flex-col sm:flex-row gap-4 justify-between items-center border-t border-black/15 dark:border-white/15">
                    <button 
                      type="button" 
                      onClick={() => setModalOpen(false)} 
                      className="w-full sm:w-auto px-6 py-4 text-[10px] font-bold uppercase tracking-widest hover:underline underline-offset-4 cursor-pointer text-neutral-600 dark:text-neutral-400 text-center"
                    >
                      DISCARD
                    </button>
                    <button 
                      type="submit" 
                      disabled={actionLoading || proofUploading} 
                      className="w-full sm:w-auto bg-black dark:bg-[#eee] text-white dark:text-black px-10 py-4 font-bold uppercase tracking-[0.2em] text-xs hover:opacity-80 transition-opacity disabled:opacity-50 cursor-pointer shadow-sm text-center"
                    >
                      {proofUploading ? 'UPLOADING PROOF...' : actionLoading ? 'SUBMITTING...' : 'CONFIRM RSVP'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
        )}
      </AnimatePresence>

      {/* Luxury Login Prompt Modal */}
      <LoginPromptModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        action="register for this event"
      />
    </main>
  );
}
