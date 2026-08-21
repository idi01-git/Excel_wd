// src/app/(admin)/admin/events/new/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  Plus,
  QrCode,
  FileSpreadsheet,
  CheckCircle2,
  Upload,
  X,
  Loader2,
  Eye,
  Calendar,
  ClipboardList,
  Link2,
  Users,
  CreditCard,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  AlertCircle,
} from 'lucide-react';
import { ImageCropperModal } from '@/components/ui/ImageCropperModal';
import FormBuilderFieldCard, { type FormFieldDefinition } from '@/components/admin/FormBuilderFieldCard';
import StandardFieldsBuilder from '@/components/admin/StandardFieldsBuilder';
import AccessInclusionPicker from '@/components/admin/AccessInclusionPicker';
import FormPreviewModal from '@/components/admin/FormPreviewModal';
import TimeWindowPicker from '@/components/admin/TimeWindowPicker';
import { uploadImageBlob, deleteUploadedImage } from '@/lib/upload';
import {
  type StandardFieldConfig,
  DEFAULT_STANDARD_FIELDS,
  serializeEventFormConfig,
} from '@/lib/event-form';

const inputCls =
  'w-full rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0e0e0e] px-3.5 py-2.5 text-xs text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-neutral-400 dark:focus:border-neutral-600 transition-colors';
const labelCls =
  'font-mono text-[10px] uppercase tracking-wider text-neutral-500 font-semibold block mb-1';
const cardCls =
  'space-y-5 rounded-2xl border border-neutral-200 dark:border-neutral-800/90 bg-white dark:bg-[#0a0a0a] p-5 sm:p-6 shadow-xs';

type TabKey = 'basics' | 'form' | 'links';

function newField(): FormFieldDefinition {
  const id = Date.now().toString() + Math.random().toString(36).slice(2, 6);
  return { id, name: `field_${id.slice(-4)}`, label: '', type: 'text', required: false };
}

export default function AdminNewEventPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabKey>('basics');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);

  // Tab 1: Basics & Logistics
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [venue, setVenue] = useState('');
  const [isCompetition, setIsCompetition] = useState(false);
  const [maxCapacity, setMaxCapacity] = useState('');
  const [codeSuffix, setCodeSuffix] = useState('');
  const [access, setAccess] = useState('ALL STUDENTS & MEMBERS');
  const [inclusions, setInclusions] = useState('CERTIFICATE & KIT');
  const [isOnHold, setIsOnHold] = useState(false);
  const [holdReason, setHoldReason] = useState('');
  const [volumeIssueLabel, setVolumeIssueLabel] = useState('');
  const [passPrefix, setPassPrefix] = useState('');

  // Poster + cover mirror
  const [usePosterAsCover, setUsePosterAsCover] = useState(false);
  const [posterImage, setPosterImage] = useState('');
  const [posterCropSrc, setPosterCropSrc] = useState<string | null>(null);
  const [cropperOpen, setCropperOpen] = useState(false);
  const [uploadingPoster, setUploadingPoster] = useState(false);

  // Tab 2: Form Builder
  const [standardFields, setStandardFields] = useState<StandardFieldConfig>({ ...DEFAULT_STANDARD_FIELDS });
  const [customFormFields, setCustomFormFields] = useState<FormFieldDefinition[]>([]);

  // Tab 3: Payment & Links
  const [requirePayment, setRequirePayment] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('₹100');
  const [paymentInstructions, setPaymentInstructions] = useState(
    'Scan the UPI QR code, complete the payment, and upload the transaction screenshot during registration.'
  );
  const [paymentQrImage, setPaymentQrImage] = useState('');
  const [qrCropSrc, setQrCropSrc] = useState<string | null>(null);
  const [qrCropperOpen, setQrCropperOpen] = useState(false);
  const [uploadingQr, setUploadingQr] = useState(false);
  const [googleSheetUrl, setGoogleSheetUrl] = useState('');
  const [rulebookUrl, setRulebookUrl] = useState('');
  const [socialLink, setSocialLink] = useState('');
  const [downloadUrl, setDownloadUrl] = useState('');
  const [testingWebhook, setTestingWebhook] = useState(false);
  const [webhookTestResult, setWebhookTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // ── Image helpers ────────────────────────────────────────────────────────

  const startPosterCrop = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setPosterCropSrc(reader.result as string);
      setCropperOpen(true);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handlePosterCrop = async (blob: Blob, previewUrl: string) => {
    setCropperOpen(false);
    setUploadingPoster(true);
    try {
      if (posterImage) await deleteUploadedImage(posterImage);
      const url = await uploadImageBlob(blob, 'event-posters', `${title || 'event'}_poster.jpg`);
      setPosterImage(url);
    } catch (err) {
      console.error(err);
      setPosterImage(previewUrl);
    } finally {
      setUploadingPoster(false);
    }
  };

  const startQrCrop = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setQrCropSrc(reader.result as string);
      setQrCropperOpen(true);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleQrCrop = async (blob: Blob, previewUrl: string) => {
    setQrCropperOpen(false);
    setUploadingQr(true);
    try {
      if (paymentQrImage) await deleteUploadedImage(paymentQrImage);
      const url = await uploadImageBlob(blob, 'event-qr', `${title || 'event'}_qr.png`);
      setPaymentQrImage(url);
    } catch (err) {
      console.error(err);
      setPaymentQrImage(previewUrl);
    } finally {
      setUploadingQr(false);
    }
  };

  const removePoster = async () => {
    await deleteUploadedImage(posterImage);
    setPosterImage('');
  };

  const removeQr = async () => {
    if (paymentQrImage) await deleteUploadedImage(paymentQrImage);
    setPaymentQrImage('');
  };

  const handleTestWebhook = async () => {
    if (!googleSheetUrl.trim()) return;
    setTestingWebhook(true);
    setWebhookTestResult(null);
    try {
      const res = await fetch('/api/admin/events/test-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          webhookUrl: googleSheetUrl.trim(),
          eventTitle: title || 'New Event Verification',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setWebhookTestResult({ success: true, message: data.message || 'Connection verified successfully!' });
      } else {
        setWebhookTestResult({ success: false, message: data.error || 'Connection failed.' });
      }
    } catch (err: any) {
      setWebhookTestResult({ success: false, message: err.message || 'Failed to connect to verification server.' });
    } finally {
      setTestingWebhook(false);
    }
  };

  // Event code prefix from the chosen date: EXC-YY-MM-
  const codePrefix = (() => {
    if (!date) return 'EXC-YY-MM-';
    const d = new Date(date);
    const yy = String(d.getFullYear()).slice(-2);
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return `EXC-${yy}-${mm}-`;
  })().toLowerCase();

  const autoCodePreview = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 40);

  // ── Field builder helpers ────────────────────────────────────────────────

  const updateField = (id: string, patch: Partial<FormFieldDefinition>) => {
    setCustomFormFields((all) =>
      all.map((f) => {
        if (f.id !== id) return f;
        const next = { ...f, ...patch };
        if (patch.label !== undefined) {
          next.name = patch.label.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 40) || f.name;
        }
        if (patch.type !== undefined && patch.type !== 'select' && patch.type !== 'multiselect') {
          delete next.options;
        }
        return next;
      })
    );
  };

  const duplicateField = (id: string) => {
    setCustomFormFields((all) => {
      const idx = all.findIndex((f) => f.id === id);
      if (idx === -1) return all;
      const src = all[idx];
      const copy: FormFieldDefinition = {
        ...src,
        id: Date.now().toString() + Math.random().toString(36).slice(2, 6),
        name: `${src.name}_copy`.slice(0, 40),
        label: src.label ? `${src.label} (copy)` : '',
        options: src.options ? [...src.options] : undefined,
      };
      return [...all.slice(0, idx + 1), copy, ...all.slice(idx + 1)];
    });
  };

  // ── Validation & submit ──────────────────────────────────────────────────

  const validate = (): string[] => {
    const errs: string[] = [];
    if (!title.trim()) errs.push('Event title is required.');
    if (!description.trim()) errs.push('Description is required.');
    if (!date) errs.push('Event date is required.');
    if (!venue.trim()) errs.push('Venue is required.');
    if (maxCapacity && (isNaN(Number(maxCapacity)) || Number(maxCapacity) <= 0)) {
      errs.push('Max capacity must be a positive number (or leave it empty for unlimited).');
    }
    if (googleSheetUrl && !/^https:\/\/(script\.google\.com|hooks\.[a-z0-9.-]+)\//.test(googleSheetUrl.trim())) {
      errs.push('Google Sheet URL must be a webhook starting with https://script.google.com/ or https://hooks.');
    }
    if (requirePayment) {
      if (!paymentAmount.trim()) errs.push('Fee amount is required when payment is enabled.');
      if (!paymentQrImage) errs.push('A UPI QR code image is required when payment is enabled.');
      if (!paymentInstructions.trim()) errs.push('Payment instructions are required when payment is enabled.');
    }
    const labels = customFormFields.map((f) => f.label.trim());
    if (labels.some((l) => !l)) {
      errs.push('Every registration question needs a prompt text.');
    }
    const dupNames = customFormFields.map((f) => f.name).filter((n, i, arr) => arr.indexOf(n) !== i);
    if (dupNames.length > 0) {
      errs.push('Two questions produced the same internal key — reword one of them.');
    }
    for (const f of customFormFields) {
      const opts = (f.options || []).map((o) => o.trim()).filter(Boolean);
      if (f.type === 'select' || f.type === 'multiselect') {
        if (opts.length < 2) {
          errs.push(`"${f.label || 'Untitled question'}" needs at least 2 filled-in options.`);
          break;
        }
        const dupes = opts.filter((o, i) => opts.indexOf(o) !== i);
        if (dupes.length > 0) {
          errs.push(`"${f.label}" has duplicate options: ${[...new Set(dupes)].join(', ')}.`);
          break;
        }
      }
    }
    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    const errs = validate();
    setErrors(errs);
    if (errs.length > 0) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setLoading(true);
    try {
      const serializedFormConfig = serializeEventFormConfig({
        access: access.trim() || 'ALL STUDENTS & MEMBERS',
        inclusions: inclusions.trim() || (isCompetition ? 'PRIZE POOL & PASS' : 'CERTIFICATE & KIT'),
        isOnHold,
        holdReason: holdReason.trim(),
        volumeIssueLabel: volumeIssueLabel.trim(),
        passPrefix: passPrefix.trim(),
        standardFields,
        fields: customFormFields,
      });

      const res = await fetch('/api/admin/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          posterImage: posterImage || null,
          coverImage: usePosterAsCover && posterImage ? posterImage : null,
          date,
          time: time || null,
          venue: venue.trim(),
          isCompetition,
          maxCapacity: maxCapacity ? parseInt(maxCapacity, 10) : null,
          rulebookUrl: rulebookUrl.trim() || null,
          socialLink: socialLink.trim() || null,
          downloadUrl: downloadUrl.trim() || null,
          slugSuffix: codeSuffix || null,
          customFormFields: serializedFormConfig,
          googleSheetUrl: googleSheetUrl.trim() || null,
          requirePayment,
          paymentAmount: requirePayment ? paymentAmount.trim() : null,
          paymentInstructions: requirePayment ? paymentInstructions.trim() : null,
          paymentQrImage: requirePayment ? paymentQrImage : null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        router.push('/admin/events');
      } else {
        setErrors([data.error || 'Failed to create event']);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (error) {
      console.error('Error creating event:', error);
      setErrors(['Network error — please try again.']);
    } finally {
      setLoading(false);
    }
  };

  const tabs: { id: TabKey; label: string; icon: any; count?: number }[] = [
    { id: 'basics', label: '1. Basic Entry & Logistics', icon: Calendar },
    { id: 'form', label: '2. Registration Form', icon: ClipboardList, count: customFormFields.length },
    { id: 'links', label: '3. Payment & Links', icon: Link2 },
  ];

  return (
    <div className="w-full min-h-screen bg-neutral-50 dark:bg-[#070707] text-neutral-900 dark:text-neutral-100 selection:bg-neutral-900 selection:text-white dark:selection:bg-white dark:selection:text-neutral-950 px-4 sm:px-6 md:px-8 py-8 md:py-10 max-w-6xl mx-auto space-y-8">
      {/* SaaS Monochrome Header */}
      <div className="space-y-4">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2.5">
          <Link
            href="/admin/events"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0e0e0e] hover:bg-neutral-100 dark:hover:bg-neutral-850 text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-all shadow-xs"
          >
            <ArrowLeft size={13} />
            <span>Events Manager</span>
          </Link>
          <span className="text-neutral-300 dark:text-neutral-700 text-xs">•</span>
          <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider font-mono">
            New Session
          </span>
        </div>

        {/* Title & Preview Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800/80 pb-6">
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-neutral-900 dark:text-white">
              Create New Event &amp; Slam
            </h1>
            <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1">
              Schedule competitions, open mics, workshops, and dynamic RSVP registrations.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setPreviewModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0e0e0e] hover:bg-neutral-100 dark:hover:bg-neutral-850 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition-all shadow-xs self-start sm:self-center"
          >
            <Eye size={13} />
            <span>Preview Form</span>
          </button>
        </div>

        {/* Error Notices Alert Banner */}
        {errors.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3.5 sm:p-4 rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 space-y-1.5 shadow-xs"
          >
            <p className="font-mono text-[10px] font-bold uppercase tracking-wider">
              Please fix the following:
            </p>
            <ul className="list-disc list-inside text-xs space-y-0.5">
              {errors.map((err) => (
                <li key={err}>{err}</li>
              ))}
            </ul>
          </motion.div>
        )}

        {/* Tab Switcher Pills */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-white dark:bg-[#0e0e0e] border border-neutral-200 dark:border-neutral-800 overflow-x-auto shadow-xs">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 font-semibold shadow-xs'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                <Icon size={13} className={isActive ? 'text-white dark:text-neutral-950' : 'text-neutral-400'} />
                <span>{tab.label}</span>
                {tab.count !== undefined && tab.count > 0 && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                      isActive
                        ? 'bg-neutral-800 text-white dark:bg-neutral-200 dark:text-neutral-950'
                        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ── TAB 1: BASIC ENTRY & LOGISTICS ── */}
        {activeTab === 'basics' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className={cardCls}>
              <div className="flex items-center justify-between border-b border-border/40 pb-3">
                <h3 className="font-serif text-lg font-bold text-foreground flex items-center gap-2">
                  <Calendar size={18} className="text-amber-500" />
                  <span>1. Event Details &amp; Logistics</span>
                </h3>
                <span className="font-mono text-[10px] uppercase text-muted-foreground">Step 1 of 3</span>
              </div>

              {/* Title */}
              <div className="space-y-1">
                <label className={labelCls}>Event Title *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  placeholder="e.g. Annual National Poetry Slam 2026"
                  className={inputCls}
                />
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className={labelCls}>Description &amp; Event Overview *</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  rows={4}
                  placeholder="Provide event overview, rounds, theme, rules, and guidelines..."
                  className={`${inputCls} leading-relaxed`}
                />
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className={labelCls}>Event Date *</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                    className={`${inputCls} font-mono`}
                  />
                </div>
                <div className="space-y-1">
                  <label className={labelCls}>Time Window</label>
                  <TimeWindowPicker value={time} onChange={setTime} />
                </div>
              </div>

              {/* Venue & Capacity with Availability Autofetch Preview */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className={labelCls}>Venue Location *</label>
                  <input
                    type="text"
                    value={venue}
                    onChange={(e) => setVenue(e.target.value)}
                    required
                    placeholder="e.g. Main Auditorium / Seminar Hall"
                    className={inputCls}
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className={labelCls}>Max Capacity (Empty = Unlimited)</label>
                    <span className="font-mono text-[9px] text-amber-500 font-bold uppercase">
                      {maxCapacity && Number(maxCapacity) > 0
                        ? `${maxCapacity} Total Seats Available`
                        : 'Unlimited / Open Admission'}
                    </span>
                  </div>
                  <input
                    type="number"
                    min={1}
                    value={maxCapacity}
                    onChange={(e) => setMaxCapacity(e.target.value)}
                    placeholder="e.g. 150"
                    className={`${inputCls} font-mono`}
                  />
                </div>
              </div>

              {/* Registration Status: Active vs On Hold */}
              <div className="rounded-2xl border border-border/80 bg-foreground/[0.02] p-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-muted-foreground block">
                      REGISTRATION STATUS
                    </span>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold uppercase ${
                        isOnHold 
                          ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30' 
                          : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                      }`}>
                        <span className={`w-2 h-2 rounded-full ${isOnHold ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
                        {isOnHold ? 'ON HOLD (REGISTRATIONS PAUSED)' : 'ACTIVE (ACCEPTING REGISTRATIONS)'}
                      </span>
                    </div>
                  </div>

                  <div className="inline-flex p-1 bg-foreground/[0.05] rounded-xl border border-border/60">
                    <button
                      type="button"
                      onClick={() => setIsOnHold(false)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase transition-all ${
                        !isOnHold
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Open
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsOnHold(true)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase transition-all ${
                        isOnHold
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Put On Hold
                    </button>
                  </div>
                </div>

                {isOnHold && (
                  <div className="pt-2 border-t border-border/40 space-y-1.5">
                    <label className="text-[10px] font-mono font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400">
                      Hold Notice / Reason (Optional, shown on public ticket)
                    </label>
                    <input
                      type="text"
                      value={holdReason}
                      onChange={(e) => setHoldReason(e.target.value)}
                      placeholder="e.g. Registrations paused temporarily for venue reconciliation"
                      className="w-full rounded-xl border border-amber-500/40 bg-amber-500/[0.04] px-3 py-2 text-xs font-serif text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                )}
              </div>

              {/* Access & Inclusions Pickers (Dropdown + Custom) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-border/40">
                <AccessInclusionPicker
                  type="access"
                  value={access}
                  onChange={setAccess}
                />
                <AccessInclusionPicker
                  type="inclusions"
                  value={inclusions}
                  onChange={setInclusions}
                  isCompetition={isCompetition}
                />
              </div>

              {/* Event Code Slug */}
              <div className="space-y-1 pt-2 border-t border-border/40">
                <label className={labelCls}>Event Code (public URL slug)</label>
                <div className="flex items-stretch overflow-hidden rounded-xl border border-border bg-foreground/[0.02] focus-within:border-amber-400">
                  <span className="flex select-none items-center border-r border-border bg-foreground/[0.04] px-3 font-mono text-xs text-muted-foreground">
                    {date ? codePrefix : 'EXC-YY-MM-'}
                  </span>
                  <input
                    type="text"
                    value={codeSuffix}
                    onChange={(e) => setCodeSuffix(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                    placeholder={autoCodePreview || 'auto-generated from title'}
                    className="min-w-0 flex-1 bg-transparent p-3 font-mono text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none"
                  />
                </div>
                <p className="text-[10px] text-muted-foreground">
                  {date
                    ? `Final code: ${codePrefix}${codeSuffix || autoCodePreview}`
                    : 'Pick a date first — the code is prefixed with the event year and month.'}
                </p>
              </div>

              {/* Masthead Volume/Issue & Pass Prefix Customization */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-border/40">
                <div className="space-y-1">
                  <label className={labelCls}>Masthead Header (Volume / Issue)</label>
                  <input
                    type="text"
                    value={volumeIssueLabel}
                    onChange={(e) => setVolumeIssueLabel(e.target.value)}
                    placeholder="e.g. VOL. I — ISSUE 04 or SPECIAL ISSUE"
                    className={`${inputCls} font-mono text-xs`}
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Header text shown in the top right masthead bar of the event page.
                  </p>
                </div>

                <div className="space-y-1">
                  <label className={labelCls}>Ticket Pass Prefix</label>
                  <input
                    type="text"
                    value={passPrefix}
                    onChange={(e) => setPassPrefix(e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, ''))}
                    placeholder="EXC-PASS"
                    className={`${inputCls} font-mono text-xs`}
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Pass serial begins with this prefix + unique participant code.
                  </p>
                </div>
              </div>

              {/* Poster / Banner upload */}
              <div className="space-y-2 pt-2 border-t border-border/40">
                <label className={`${labelCls} block`}>Event Banner &amp; Poster Image (16:9)</label>

                {posterImage ? (
                  <div className="relative w-56 overflow-hidden rounded-2xl border border-border">
                    <img src={posterImage} alt="Poster" className="aspect-video w-full object-cover" />
                    <div className="flex gap-2 p-2 bg-foreground/[0.03]">
                      <button
                        type="button"
                        onClick={() => void removePoster()}
                        className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-border px-2 py-1.5 text-[10px] font-mono uppercase text-red-500 hover:bg-red-500/10 transition-colors"
                      >
                        <X size={12} /> Remove
                      </button>
                      <label
                        htmlFor="event-poster-upload"
                        className="flex flex-1 cursor-pointer items-center justify-center gap-1 rounded-lg border border-border px-2 py-1.5 text-[10px] font-mono uppercase text-foreground hover:bg-foreground/[0.06] transition-colors"
                      >
                        <Upload size={12} /> Replace
                      </label>
                      <input
                        id="event-poster-upload"
                        type="file"
                        accept="image/*"
                        onChange={startPosterCrop}
                        className="hidden"
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <label
                      htmlFor="event-poster-upload"
                      className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-foreground/[0.06] px-3 py-2 text-xs font-mono uppercase text-foreground transition-colors hover:bg-foreground/[0.1]"
                    >
                      {uploadingPoster ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : (
                        <Upload size={13} />
                      )}
                      <span>{uploadingPoster ? 'Uploading…' : 'Upload Event Banner Image'}</span>
                    </label>
                    <input
                      id="event-poster-upload"
                      type="file"
                      accept="image/*"
                      onChange={startPosterCrop}
                      className="hidden"
                    />
                  </div>
                )}
              </div>

              {/* Competition Toggle */}
              <div className="flex items-center gap-3 rounded-2xl border border-border/40 bg-foreground/[0.02] p-3.5">
                <input
                  type="checkbox"
                  id="isComp"
                  checked={isCompetition}
                  onChange={(e) => setIsCompetition(e.target.checked)}
                  className="h-4 w-4 rounded border-border text-amber-500 focus:ring-amber-400"
                />
                <label htmlFor="isComp" className="cursor-pointer select-none text-xs">
                  <strong className="block font-serif text-foreground">This event is a Competitive Contest</strong>
                  <span className="text-[10px] text-muted-foreground">
                    Enables Winners Podium &amp; Certificate dispatch features upon completion.
                  </span>
                </label>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── TAB 2: REGISTRATION FORM BUILDER ── */}
        {activeTab === 'form' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className={cardCls}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/40 pb-4">
                <div>
                  <h3 className="font-serif text-lg font-bold text-foreground flex items-center gap-2">
                    <ClipboardList size={18} className="text-amber-500" />
                    <span>2. Registration Form Builder</span>
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Configure standard attendee identity and additional custom questions.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPreviewModalOpen(true)}
                    className="flex items-center gap-1.5 rounded-xl border border-amber-400/30 bg-amber-400/10 px-3 py-1.5 text-xs font-mono font-bold text-amber-600 dark:text-amber-300 hover:bg-amber-400/20 transition-colors"
                  >
                    <Eye size={13} />
                    <span>Preview Form</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCustomFormFields((all) => [...all, newField()])}
                    className="flex items-center gap-1.5 rounded-xl bg-foreground px-3 py-1.5 text-xs font-mono font-bold text-background transition-colors hover:bg-foreground/90"
                  >
                    <Plus size={13} />
                    <span>Add Custom Question</span>
                  </button>
                </div>
              </div>

              {/* Standard Mandatory Contact Fields */}
              <StandardFieldsBuilder
                config={standardFields}
                onChange={(patch) => setStandardFields((prev) => ({ ...prev, ...patch }))}
              />

              {/* Additional Custom Questions List */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <label className={labelCls}>
                    Additional Event Questions ({customFormFields.length})
                  </label>
                </div>

                {customFormFields.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border/70 p-6 text-center space-y-2">
                    <p className="text-xs text-muted-foreground">
                      No additional questions added yet. Attendees will supply standard Name, Email, and Phone number.
                    </p>
                    <button
                      type="button"
                      onClick={() => setCustomFormFields((all) => [...all, newField()])}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-foreground/[0.03] px-3.5 py-1.5 text-xs font-mono uppercase text-foreground hover:bg-foreground/[0.08] transition-colors"
                    >
                      <Plus size={13} />
                      <span>Add Extra Question</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {customFormFields.map((field, idx) => (
                      <FormBuilderFieldCard
                        key={field.id}
                        field={field}
                        index={idx}
                        onChange={(patch) => updateField(field.id, patch)}
                        onRemove={() => setCustomFormFields((all) => all.filter((f) => f.id !== field.id))}
                        onDuplicate={() => duplicateField(field.id)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* ── TAB 3: PAYMENT & LINKS ── */}
        {activeTab === 'links' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Payment Section with Dynamic Entry Tariff */}
            <div className={cardCls}>
              <div className="flex items-center justify-between border-b border-border/40 pb-3">
                <div className="flex items-center gap-2">
                  <QrCode size={18} className="text-amber-500" />
                  <h3 className="font-serif text-lg font-bold text-foreground">
                    Entry Tariff &amp; Payment Configuration
                  </h3>
                </div>

                {/* Real-time Entry Tariff Preview Badge */}
                <div className={`px-3 py-1 rounded-full font-mono text-[10px] font-bold uppercase tracking-wider border ${
                  requirePayment
                    ? 'bg-amber-400/15 border-amber-400/40 text-amber-600 dark:text-amber-300'
                    : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                }`}>
                  Tariff: {requirePayment ? (paymentAmount || '₹100') : 'FREE / COMPLIMENTARY'}
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-2xl border border-border/40 bg-foreground/[0.02] p-3.5">
                <input
                  type="checkbox"
                  id="requirePaymentCheck"
                  checked={requirePayment}
                  onChange={(e) => setRequirePayment(e.target.checked)}
                  className="h-4 w-4 rounded border-border text-amber-500 focus:ring-amber-400"
                />
                <label htmlFor="requirePaymentCheck" className="cursor-pointer select-none text-xs">
                  <strong className="block font-serif text-foreground">Require Entry Fee Payment</strong>
                  <span className="text-[10px] text-muted-foreground">
                    Displays UPI QR code during registration and requests screenshot proof.
                  </span>
                </label>
              </div>

              {requirePayment && (
                <div className="space-y-4 border-t border-border/40 pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className={labelCls}>Fee Amount *</label>
                      <input
                        type="text"
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(e.target.value)}
                        placeholder="₹150 / Team"
                        className={`${inputCls} font-mono`}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className={labelCls}>UPI QR Code Image * (1:1)</label>
                      {paymentQrImage ? (
                        <div className="w-32 overflow-hidden rounded-2xl border border-border">
                          <img src={paymentQrImage} alt="Payment QR" className="aspect-square w-full object-contain bg-white p-1" />
                          <div className="flex gap-1.5 border-t border-border bg-foreground/[0.03] p-1.5">
                            <button
                              type="button"
                              onClick={() => void removeQr()}
                              className="flex flex-1 items-center justify-center gap-1 rounded-lg px-1 py-1 text-[9px] font-mono uppercase text-red-500 hover:bg-red-500/10 transition-colors"
                            >
                              <X size={11} /> Remove
                            </button>
                            <label
                              htmlFor="event-qr-upload"
                              className="flex flex-1 cursor-pointer items-center justify-center gap-1 rounded-lg px-1 py-1 text-[9px] font-mono uppercase text-foreground hover:bg-foreground/[0.06] transition-colors"
                            >
                              <Upload size={11} /> Replace
                            </label>
                            <input
                              id="event-qr-upload"
                              type="file"
                              accept="image/*"
                              onChange={startQrCrop}
                              className="hidden"
                            />
                          </div>
                        </div>
                      ) : (
                        <div>
                          <label
                            htmlFor="event-qr-upload"
                            className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-foreground/[0.06] px-3 py-2 text-xs font-mono uppercase text-foreground transition-colors hover:bg-foreground/[0.1]"
                          >
                            {uploadingQr ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
                            <span>{uploadingQr ? 'Uploading…' : 'Upload QR Image'}</span>
                          </label>
                          <input
                            id="event-qr-upload"
                            type="file"
                            accept="image/*"
                            onChange={startQrCrop}
                            className="hidden"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className={labelCls}>Payment Instructions *</label>
                    <textarea
                      value={paymentInstructions}
                      onChange={(e) => setPaymentInstructions(e.target.value)}
                      rows={2}
                      placeholder="Instructions displayed next to the QR code…"
                      className={inputCls}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Google Sheets Webhook */}
            <div className={cardCls}>
              <div className="flex items-center justify-between border-b border-border/40 pb-3">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet size={18} className="text-emerald-500" />
                  <h3 className="font-serif text-lg font-bold text-foreground">
                    Google Sheets Realtime Webhook Dispatch
                  </h3>
                </div>
                {webhookTestResult && (
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-mono text-[10px] font-bold uppercase ${
                    webhookTestResult.success 
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30' 
                      : 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/30'
                  }`}>
                    {webhookTestResult.success ? '● Verified Active' : '● Verification Failed'}
                  </span>
                )}
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className={labelCls}>Google Apps Script / Webhook URL</label>
                    {googleSheetUrl.trim() && (
                      <button
                        type="button"
                        onClick={handleTestWebhook}
                        disabled={testingWebhook}
                        className="flex items-center gap-1.5 font-mono text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 hover:underline disabled:opacity-50 cursor-pointer"
                      >
                        {testingWebhook ? <Loader2 size={11} className="animate-spin" /> : <CheckCircle2 size={11} />}
                        <span>{testingWebhook ? 'Testing Connection…' : 'Test & Verify Connection'}</span>
                      </button>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={googleSheetUrl}
                      onChange={(e) => {
                        setGoogleSheetUrl(e.target.value);
                        setWebhookTestResult(null);
                      }}
                      placeholder="https://script.google.com/macros/s/.../exec"
                      className={`${inputCls} font-mono flex-1`}
                    />
                    <button
                      type="button"
                      onClick={handleTestWebhook}
                      disabled={testingWebhook || !googleSheetUrl.trim()}
                      className="px-4 py-2.5 rounded-xl border border-border bg-foreground/[0.04] hover:bg-foreground/[0.08] text-xs font-mono font-bold uppercase transition-colors disabled:opacity-40 shrink-0"
                    >
                      {testingWebhook ? 'Pinging…' : 'Verify'}
                    </button>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    Submissions are dispatched asynchronously to your spreadsheet in real-time. Click &quot;Verify&quot; to test your Apps Script endpoint before going live.
                  </p>
                </div>

                {webhookTestResult && (
                  <div className={`rounded-xl p-3 text-xs flex items-start gap-2 border ${
                    webhookTestResult.success
                      ? 'bg-emerald-500/[0.06] border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                      : 'bg-red-500/[0.06] border-red-500/30 text-red-700 dark:text-red-300'
                  }`}>
                    {webhookTestResult.success ? <CheckCircle2 size={15} className="shrink-0 mt-0.5" /> : <AlertCircle size={15} className="shrink-0 mt-0.5" />}
                    <div>
                      <p className="font-bold">{webhookTestResult.success ? 'Webhook Verified Successfully' : 'Webhook Verification Failed'}</p>
                      <p className="text-[11px] mt-0.5 opacity-90">{webhookTestResult.message}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* External Links & Materials */}
            <div className={cardCls}>
              <div className="flex items-center gap-2 border-b border-border/40 pb-3">
                <Link2 size={18} className="text-amber-500" />
                <h3 className="font-serif text-lg font-bold text-foreground">
                  External Documents &amp; Coverage Links
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className={labelCls}>Rulebook Link</label>
                  <input
                    type="url"
                    value={rulebookUrl}
                    onChange={(e) => setRulebookUrl(e.target.value)}
                    placeholder="https://…"
                    className={`${inputCls} font-mono`}
                  />
                </div>
                <div className="space-y-1">
                  <label className={labelCls}>Social Coverage Link</label>
                  <input
                    type="url"
                    value={socialLink}
                    onChange={(e) => setSocialLink(e.target.value)}
                    placeholder="https://…"
                    className={`${inputCls} font-mono`}
                  />
                </div>
                <div className="space-y-1">
                  <label className={labelCls}>Download Materials Link</label>
                  <input
                    type="url"
                    value={downloadUrl}
                    onChange={(e) => setDownloadUrl(e.target.value)}
                    placeholder="https://…"
                    className={`${inputCls} font-mono`}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Action Footer & Tab Navigation ── */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-neutral-200 dark:border-neutral-800/80 pt-6">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {activeTab !== 'basics' ? (
              <button
                type="button"
                onClick={() => setActiveTab(activeTab === 'links' ? 'form' : 'basics')}
                className="flex flex-1 sm:flex-none items-center justify-center gap-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0e0e0e] hover:bg-neutral-100 dark:hover:bg-neutral-850 px-4 py-2.5 text-xs font-medium text-neutral-700 dark:text-neutral-300 transition-colors shadow-xs"
              >
                <ChevronLeft size={14} />
                <span>Previous Tab</span>
              </button>
            ) : (
              <Link
                href="/admin/events"
                className="flex flex-1 sm:flex-none items-center justify-center rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0e0e0e] hover:bg-neutral-100 dark:hover:bg-neutral-850 px-4 py-2.5 text-xs font-medium text-neutral-600 dark:text-neutral-400 transition-colors"
              >
                Cancel
              </Link>
            )}

            {activeTab !== 'links' && (
              <button
                type="button"
                onClick={() => setActiveTab(activeTab === 'basics' ? 'form' : 'links')}
                className="flex flex-1 sm:flex-none items-center justify-center gap-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0e0e0e] hover:bg-neutral-100 dark:hover:bg-neutral-850 px-4 py-2.5 text-xs font-medium text-neutral-900 dark:text-white transition-colors shadow-xs"
              >
                <span>Next Tab</span>
                <ChevronRight size={14} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={() => setPreviewModalOpen(true)}
              className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0e0e0e] hover:bg-neutral-100 dark:hover:bg-neutral-850 px-4 py-2.5 text-xs font-medium text-neutral-700 dark:text-neutral-300 transition-colors shadow-xs"
            >
              <Eye size={13} />
              <span>Preview Form</span>
            </button>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 px-6 py-2.5 text-xs font-medium hover:bg-neutral-800 dark:hover:bg-neutral-200 active:scale-[0.98] transition-all disabled:opacity-50 shadow-sm"
            >
              <CheckCircle2 size={14} />
              <span>{loading ? 'Publishing Event…' : 'Publish Event'}</span>
            </button>
          </div>
        </div>
      </form>

      {/* Image Cropper Modals */}
      {posterCropSrc && (
        <ImageCropperModal
          isOpen={cropperOpen}
          imageSrc={posterCropSrc}
          aspectRatio={16 / 9}
          aspectPresetLabel="Event Banner (16:9)"
          onCropComplete={handlePosterCrop}
          onCancel={() => setCropperOpen(false)}
        />
      )}
      {qrCropSrc && (
        <ImageCropperModal
          isOpen={qrCropperOpen}
          imageSrc={qrCropSrc}
          aspectRatio={1}
          aspectPresetLabel="UPI QR Code (1:1)"
          onCropComplete={handleQrCrop}
          onCancel={() => setQrCropperOpen(false)}
        />
      )}

      {/* Form Preview Modal */}
      <FormPreviewModal
        isOpen={previewModalOpen}
        onClose={() => setPreviewModalOpen(false)}
        eventTitle={title}
        isOnHold={isOnHold}
        holdReason={holdReason}
        standardFields={standardFields}
        customFields={customFormFields}
        requirePayment={requirePayment}
        paymentAmount={paymentAmount}
        paymentInstructions={paymentInstructions}
        paymentQrImage={paymentQrImage}
      />
    </div>
  );
}
