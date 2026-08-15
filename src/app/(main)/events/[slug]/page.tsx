// src/app/(main)/events/[slug]/page.tsx
'use client';

import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  CheckCircle2, 
  Award, 
  ExternalLink, 
  Download, 
  FileText, 
  Globe 
} from 'lucide-react';

interface Winner {
  id: string;
  participantName: string;
  photoUrl?: string | null;
  position: 'FIRST' | 'SECOND' | 'THIRD' | 'CONSOLATION' | 'SPECIAL_MENTION' | 'OTHER';
  prize?: string | null;
  description?: string | null;
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
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  
  // Registration Form Modal state
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [dietary, setDietary] = useState('');

  const fetchDetail = async () => {
    try {
      const res = await fetch(`/api/events/${slug}`);
      const data = await res.json();
      if (data.success) {
        setEvent(data.event);
        setRegistered(data.userRegistered);
        if (session?.user) {
          setName(session.user.name || '');
          setEmail(session.user.email || '');
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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event || actionLoading) return;

    setActionLoading(true);
    try {
      const res = await fetch(`/api/events/${event.slug}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, extraFields: dietary ? { dietary } : null })
      });
      const data = await res.json();
      if (data.success) {
        setRegistered(true);
        setModalOpen(false);
        fetchDetail();
      } else {
        alert(data.error || 'Registration failed');
      }
    } catch (error) {
      console.error('Error during registration:', error);
    } finally {
      setActionLoading(false);
    }
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

  const isFull = event.maxCapacity !== null && event._count.registrations >= event.maxCapacity;
  const eventDate = new Date(event.date);
  const eventType = event.isCompetition 
    ? 'Competition' 
    : event.title.toLowerCase().includes('workshop') 
      ? 'Workshop' 
      : 'Event';

  return (
    <main className="w-full min-h-screen bg-white dark:bg-[#111] text-black dark:text-[#eee] font-serif selection:bg-black selection:text-white dark:selection:bg-white dark:selection:text-black transition-colors duration-300">
      
      {/* Newspaper Masthead Navigation */}
      <div className="w-full border-b border-black dark:border-[#eee] py-3 px-4 md:px-8 flex justify-between items-center sticky top-0 z-40 bg-white dark:bg-[#111]">
        <Link 
          href="/events" 
          className="text-xs uppercase tracking-widest font-sans font-bold hover:underline underline-offset-4 flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" /> <span>THE DAILY ARCHIVE</span>
        </Link>
        <div className="text-xs uppercase tracking-widest font-sans font-bold text-right hidden md:block">
          VOL. I — ISSUE {event.id.substring(0,6)}
        </div>
      </div>

      <div className="w-full max-w-screen-2xl mx-auto px-4 md:px-8 py-8 md:py-12">
        
        {/* Newspaper Headline Block */}
        <div className="border-b-[4px] md:border-b-[6px] border-double border-black dark:border-[#eee] pb-8 mb-8 text-center flex flex-col items-center">
          <div className="text-[10px] md:text-xs font-sans font-bold uppercase tracking-[0.3em] mb-6 flex items-center gap-4">
            <span className="w-8 md:w-16 h-[1px] bg-black dark:bg-[#eee]" />
            {eventType} / {event.status}
            <span className="w-8 md:w-16 h-[1px] bg-black dark:bg-[#eee]" />
          </div>
          <h1 className="font-serif text-5xl md:text-7xl lg:text-[7rem] font-bold uppercase tracking-tighter leading-[0.9] max-w-5xl mx-auto">
            {event.title}
          </h1>
        </div>

        {/* Newspaper Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          
          {/* Left Column - Article Content (8 cols) */}
          <div className="lg:col-span-8 flex flex-col lg:border-r border-black dark:border-[#eee] lg:pr-12">
            
            {/* Article Info Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 border-t border-b border-black dark:border-[#eee] py-4 mb-10 font-sans">
              <div className="px-4 border-r border-black dark:border-[#eee]">
                <span className="block text-[10px] font-bold uppercase tracking-widest mb-1 opacity-60">DATE</span>
                <span className="text-sm font-bold uppercase">{eventDate.toLocaleDateString(undefined, { month: 'short', day: '2-digit', year: 'numeric' })}</span>
              </div>
              <div className="px-4 border-black dark:border-[#eee] md:border-r">
                <span className="block text-[10px] font-bold uppercase tracking-widest mb-1 opacity-60">TIME</span>
                <span className="text-sm font-bold uppercase">{event.time || 'TBA'}</span>
              </div>
              <div className="px-4 border-t border-black dark:border-[#eee] md:border-t-0 md:border-r pt-4 md:pt-0 mt-4 md:mt-0">
                <span className="block text-[10px] font-bold uppercase tracking-widest mb-1 opacity-60">LOCATION</span>
                <span className="text-sm font-bold uppercase">{event.venue}</span>
              </div>
              <div className="px-4 border-t border-l border-black dark:border-[#eee] md:border-t-0 md:border-l-0 pt-4 md:pt-0 mt-4 md:mt-0">
                <span className="block text-[10px] font-bold uppercase tracking-widest mb-1 opacity-60">CAPACITY</span>
                <span className="text-sm font-bold uppercase">{event.maxCapacity || 'NO LIMIT'}</span>
              </div>
            </div>

            {/* Article Body & Poster */}
            <div className="flex flex-col lg:flex-row gap-8 mb-12 border-b border-black dark:border-[#eee] pb-12">
              
              {/* Dropped Image left alignment style */}
              <div className="w-full lg:w-1/2 flex flex-col">
                <img 
                  src={event.posterImage || 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&fit=crop'} 
                  alt={event.title}
                  className="w-full h-auto grayscale border border-black dark:border-[#eee] p-1 shadow-sm"
                />
                <div className="text-[10px] font-sans uppercase tracking-widest mt-3 border-b border-black dark:border-[#eee] pb-2 text-center md:text-left">
                  FIG 1. — OFFICIAL EXHIBITION POSTER
                </div>
              </div>
              
              {/* Prose Content */}
              <div className="w-full lg:w-1/2">
                <h3 className="font-sans text-xl font-bold uppercase tracking-tighter mb-6 border-b-[3px] border-double border-black dark:border-[#eee] pb-2">THE DETAILS</h3>
                <p className="text-lg md:text-xl leading-relaxed font-serif first-letter:text-7xl first-letter:font-bold first-letter:float-left first-letter:mr-3 first-letter:mt-1 whitespace-pre-line text-justify">
                  {event.description}
                </p>
              </div>
            </div>

            {/* Classifieds / Appendices */}
            {(event.rulebookUrl || event.socialLink || event.downloadUrl) && (
              <div className="mb-12 border-b-[3px] border-double border-black dark:border-[#eee] pb-12">
                <h3 className="font-sans text-xl font-bold uppercase tracking-tighter mb-6 text-center border-y border-black dark:border-[#eee] py-2">CLASSIFIEDS & ATTACHMENTS</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {event.rulebookUrl && (
                    <a href={event.rulebookUrl} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center justify-center text-center p-6 border border-black dark:border-[#eee] hover:bg-black hover:text-white dark:hover:bg-[#eee] dark:hover:text-[#111] transition-colors group">
                      <FileText className="w-6 h-6 mb-3" />
                      <span className="block font-sans text-lg font-bold uppercase mb-1">Rulebook</span>
                      <span className="block text-[10px] font-sans uppercase tracking-widest opacity-60">READ PDF</span>
                    </a>
                  )}
                  {event.socialLink && (
                    <a href={event.socialLink} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center justify-center text-center p-6 border border-black dark:border-[#eee] hover:bg-black hover:text-white dark:hover:bg-[#eee] dark:hover:text-[#111] transition-colors group">
                      <Globe className="w-6 h-6 mb-3" />
                      <span className="block font-sans text-lg font-bold uppercase mb-1">Updates</span>
                      <span className="block text-[10px] font-sans uppercase tracking-widest opacity-60">EXTERNAL LINK</span>
                    </a>
                  )}
                  {event.downloadUrl && (
                    <a href={event.downloadUrl} download className="flex flex-col items-center justify-center text-center p-6 border border-black dark:border-[#eee] hover:bg-black hover:text-white dark:hover:bg-[#eee] dark:hover:text-[#111] transition-colors group">
                      <Download className="w-6 h-6 mb-3" />
                      <span className="block font-sans text-lg font-bold uppercase mb-1">Poster File</span>
                      <span className="block text-[10px] font-sans uppercase tracking-widest opacity-60">DOWNLOAD ITEM</span>
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Social Page (Winners) */}
            {event.winners && event.winners.length > 0 && (
              <div className="mb-12">
                <h3 className="font-sans text-xl font-bold uppercase tracking-tighter mb-6 text-center border-y border-black dark:border-[#eee] py-2">THE SOCIAL REGISTER</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                  {event.winners.map((win) => (
                    <div key={win.id} className="flex flex-col items-center text-center pb-6 border-b border-black/20 dark:border-gray-200/20">
                      <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-black dark:border-[#eee] p-1 mb-4">
                        {win.photoUrl ? (
                          <img src={win.photoUrl} alt={win.participantName} className="w-full h-full rounded-full object-cover grayscale" />
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

            {/* Archived Reports */}
            {event.status === 'PAST' && (event.report || event._count.gallery > 0) && (
              <div className="border-t-[3px] border-double border-black dark:border-[#eee] pt-8">
                <h3 className="font-sans text-xl font-bold uppercase tracking-tighter mb-6">ARCHIVES & RECORDS</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {event.report && (
                    <Link href={`/events/${event.slug}/report`} className="flex items-center justify-between p-4 border border-black dark:border-[#eee] hover:bg-black hover:text-white dark:hover:bg-[#eee] dark:hover:text-[#111] transition-colors font-sans group">
                      <div>
                        <span className="block text-[10px] font-bold uppercase tracking-widest opacity-70 mb-1">DOCUMENTATION</span>
                        <span className="block text-lg font-bold uppercase">Event Report</span>
                      </div>
                      <ExternalLink className="w-5 h-5" />
                    </Link>
                  )}
                  {event._count.gallery > 0 && (
                    <Link href={`/events/${event.slug}/gallery`} className="flex items-center justify-between p-4 border border-black dark:border-[#eee] hover:bg-black hover:text-white dark:hover:bg-[#eee] dark:hover:text-[#111] transition-colors font-sans group">
                      <div>
                        <span className="block text-[10px] font-bold uppercase tracking-widest opacity-70 mb-1">VISUALS</span>
                        <span className="block text-lg font-bold uppercase">Photo Gallery ({event._count.gallery})</span>
                      </div>
                      <ExternalLink className="w-5 h-5" />
                    </Link>
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
              
              <div className="space-y-6 mb-8 font-sans">
                <div className="flex justify-between items-end border-b border-black dark:border-[#eee] pb-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">ID NUM</span>
                  <span className="font-bold text-lg">{event.id.substring(0,8)}</span>
                </div>
                <div className="flex justify-between items-end border-b border-black dark:border-[#eee] pb-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">STATE</span>
                  <span className={`font-bold text-lg ${event.status === 'UPCOMING' ? '' : 'opacity-60 line-through'}`}>{event.status}</span>
                </div>
                <div className="flex justify-between items-end border-b border-black dark:border-[#eee] pb-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">RSVP'D</span>
                  <span className="font-bold text-lg">{event._count.registrations} CONFIRMED</span>
                </div>
                <div className="flex justify-between items-end border-b border-black dark:border-[#eee] pb-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">LIMIT</span>
                  <span className="font-bold text-lg">{event.maxCapacity || 'UNLIMITED'}</span>
                </div>
              </div>

              {/* Action Area */}
              <div>
                {event.status === 'UPCOMING' ? (
                  registered ? (
                    <div className="space-y-4 font-sans">
                      <div className="flex items-center justify-center gap-2 py-4 border-2 border-black dark:border-[#eee] bg-gray-100 dark:bg-zinc-800 text-center text-[10px] font-bold uppercase tracking-widest">
                        <CheckCircle2 className="w-4 h-4" /> COUPON REDEEMED
                      </div>
                      <button 
                        onClick={handleCancelRegistration} 
                        disabled={actionLoading} 
                        className="w-full py-4 text-[10px] font-bold uppercase tracking-widest hover:underline underline-offset-4"
                      >
                        CANCEL RESERVATION
                      </button>
                    </div>
                  ) : isFull ? (
                    <div className="py-4 border-2 border-black dark:border-[#eee] font-sans text-center text-[10px] font-bold uppercase tracking-widest bg-gray-100 dark:bg-zinc-800">
                      NO COUPONS LEFT
                    </div>
                  ) : (
                    <button
                      onClick={() => session ? setModalOpen(true) : router.push('/login')}
                      className="w-full py-5 bg-black dark:bg-[#eee] text-white dark:text-black font-sans font-bold uppercase tracking-[0.2em] text-sm hover:opacity-80 transition-opacity border-2 border-black dark:border-[#eee]"
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
            </div>

          </div>
        </div>
      </div>

      {/* Newspaper Registration Modal Overlay */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-white/90 dark:bg-black/90 backdrop-blur-sm" 
              onClick={() => setModalOpen(false)} 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-xl bg-white dark:bg-[#111] border-4 border-double border-black dark:border-[#eee] p-8 md:p-12 shadow-2xl"
            >
              
              <div className="text-center mb-8 border-b border-black dark:border-[#eee] pb-6">
                <h3 className="font-serif text-4xl md:text-5xl font-bold uppercase mb-2">RSVP FORM</h3>
                <p className="text-[10px] font-sans font-bold uppercase tracking-[0.2em]">{event.title}</p>
              </div>

              <form onSubmit={handleRegister} className="space-y-6 font-sans">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest">FULL NAME *</label>
                  <input 
                    type="text" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    required 
                    className="w-full bg-transparent border-b-2 border-dashed border-black dark:border-[#eee] px-2 py-3 text-lg font-serif focus:outline-none focus:border-solid transition-colors placeholder:text-gray-400 dark:placeholder:text-gray-600 rounded-none" 
                    placeholder="E.G. JOHN DOE"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest">EMAIL ADDRESS *</label>
                  <input 
                    type="email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    required 
                    className="w-full bg-transparent border-b-2 border-dashed border-black dark:border-[#eee] px-2 py-3 text-lg font-serif focus:outline-none focus:border-solid transition-colors placeholder:text-gray-400 dark:placeholder:text-gray-600 rounded-none"
                    placeholder="E.G. JOHN@EXAMPLE.COM" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest">TELEPHONE NUMBER</label>
                  <input 
                    type="tel" 
                    value={phone} 
                    onChange={(e) => setPhone(e.target.value)} 
                    className="w-full bg-transparent border-b-2 border-dashed border-black dark:border-[#eee] px-2 py-3 text-lg font-serif focus:outline-none focus:border-solid transition-colors placeholder:text-gray-400 dark:placeholder:text-gray-600 rounded-none" 
                    placeholder="OPTIONAL"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest">SPECIAL REQUIREMENTS</label>
                  <input 
                    type="text" 
                    value={dietary} 
                    onChange={(e) => setDietary(e.target.value)} 
                    className="w-full bg-transparent border-b-2 border-dashed border-black dark:border-[#eee] px-2 py-3 text-lg font-serif focus:outline-none focus:border-solid transition-colors placeholder:text-gray-400 dark:placeholder:text-gray-600 rounded-none" 
                    placeholder="DIETARY, ETC."
                  />
                </div>

                <div className="pt-8 flex flex-col md:flex-row gap-4 justify-between items-center">
                  <button 
                    type="button" 
                    onClick={() => setModalOpen(false)} 
                    className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest hover:underline underline-offset-4"
                  >
                    DISCARD
                  </button>
                  <button 
                    type="submit" 
                    disabled={actionLoading} 
                    className="w-full md:w-auto bg-black dark:bg-[#eee] text-white dark:text-black px-10 py-4 font-bold uppercase tracking-[0.2em] text-xs hover:opacity-80 transition-opacity"
                  >
                    {actionLoading ? 'SUBMITTING...' : 'CONFIRM RSVP'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
}
