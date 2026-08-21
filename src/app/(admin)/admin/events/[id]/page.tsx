// src/app/(admin)/admin/events/[id]/page.tsx
'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { motion } from 'motion/react';
import {
  Loader2,
  Save,
  Upload,
  X,
  Eye,
  Calendar,
  ClipboardList,
  Link2,
  Award,
  QrCode,
  FileSpreadsheet,
  Plus,
  ArrowLeft,
  Users,
  CheckCircle2,
  Trash2,
  AlertCircle,
  Download,
  ExternalLink,
  Edit2,
  RotateCcw,
  Bell,
  Search,
  Filter,
  Sparkles,
} from 'lucide-react';
import { hasPermission } from '@/lib/rbac';
import { uploadImageBlob, deleteUploadedImage } from '@/lib/upload';
import FormBuilderFieldCard, { type FormFieldDefinition } from '@/components/admin/FormBuilderFieldCard';
import StandardFieldsBuilder from '@/components/admin/StandardFieldsBuilder';
import AccessInclusionPicker from '@/components/admin/AccessInclusionPicker';
import FormPreviewModal from '@/components/admin/FormPreviewModal';
import TimeWindowPicker from '@/components/admin/TimeWindowPicker';
import {
  type StandardFieldConfig,
  type EventFormConfig,
  DEFAULT_STANDARD_FIELDS,
  parseEventFormConfig,
  serializeEventFormConfig,
} from '@/lib/event-form';

type Winner = {
  id?: string;
  participantName: string;
  position: 'FIRST' | 'SECOND' | 'THIRD';
  prize?: string;
  description?: string;
  photoUrl?: string;
};

type EventData = Record<string, unknown> & {
  id: string;
  slug: string;
  status: 'UPCOMING' | 'PAST' | 'CANCELLED';
  title: string;
  description: string;
  date: string;
  time?: string;
  venue: string;
  isCompetition: boolean;
  requirePayment: boolean;
  paymentAmount?: string;
  paymentInstructions?: string;
  paymentQrImage?: string;
  maxCapacity?: number | null;
  rulebookUrl?: string;
  socialLink?: string;
  downloadUrl?: string;
  googleSheetUrl?: string;
  internalReportUrl?: string;
  externalReportUrl?: string;
  internalGalleryUrl?: string;
  externalGalleryUrl?: string;
  posterImage?: string;
  coverImage?: string;
  customFormFields?: unknown;
  winners?: Winner[];
  gallery?: { id: string; url: string }[];
  registrations?: { id: string }[];
};

type TabKey = 'basics' | 'form' | 'links' | 'post_event' | 'registrations';

const emptyWinner = (position: Winner['position']): Winner => ({
  participantName: '',
  position,
  prize: '',
  description: '',
  photoUrl: '',
});

const inputCls =
  'w-full rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0e0e0e] px-3.5 py-2.5 text-xs text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-neutral-400 dark:focus:border-neutral-600 transition-colors';
const labelCls =
  'font-mono text-[10px] uppercase tracking-wider text-neutral-500 font-semibold block mb-1';
const cardCls =
  'space-y-5 rounded-2xl border border-neutral-200 dark:border-neutral-800/90 bg-white dark:bg-[#0a0a0a] p-5 sm:p-6 shadow-xs';

function newField(): FormFieldDefinition {
  const id = Date.now().toString() + Math.random().toString(36).slice(2, 6);
  return { id, name: `field_${id.slice(-4)}`, label: '', type: 'text', required: false };
}

export default function EventManager() {
  const { data: session } = useSession();
  const userRole = (session?.user as any)?.role;
  const canManageEvents = hasPermission(userRole, 'MANAGE_EVENTS');
  const isTreasurer = userRole === 'TREASURER';

  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<TabKey>(isTreasurer && !canManageEvents ? 'registrations' : 'basics');
  const [event, setEvent] = useState<EventData | null>(null);
  const [access, setAccess] = useState('ALL STUDENTS & MEMBERS');
  const [inclusions, setInclusions] = useState('CERTIFICATE & KIT');
  const [isOnHold, setIsOnHold] = useState(false);
  const [holdReason, setHoldReason] = useState('');
  const [volumeIssueLabel, setVolumeIssueLabel] = useState('');
  const [passPrefix, setPassPrefix] = useState('');
  const [standardFields, setStandardFields] = useState<StandardFieldConfig>({ ...DEFAULT_STANDARD_FIELDS });
  const [fields, setFields] = useState<FormFieldDefinition[]>([]);
  const [winners, setWinners] = useState<Winner[]>([emptyWinner('FIRST'), emptyWinner('SECOND'), emptyWinner('THIRD')]);
  const [newGallery, setNewGallery] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');
  const [noticeError, setNoticeError] = useState(false);
  const [codeSuffix, setCodeSuffix] = useState('');
  const [codeDirty, setCodeDirty] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [testingWebhook, setTestingWebhook] = useState(false);
  const [webhookTestResult, setWebhookTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [registrationList, setRegistrationList] = useState<any[]>([]);
  const [loadingRegs, setLoadingRegs] = useState(false);
  const [selectedProofUrl, setSelectedProofUrl] = useState<string | null>(null);

  // Edit Participant Modal State
  const [editingReg, setEditingReg] = useState<any | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editExtraFields, setEditExtraFields] = useState<Record<string, any>>({});
  const [savingParticipant, setSavingParticipant] = useState(false);
  const [sendingReminder, setSendingReminder] = useState(false);
  const [rosterSearch, setRosterSearch] = useState('');
  const [rosterPaymentFilter, setRosterPaymentFilter] = useState<'ALL' | 'VERIFIED' | 'PENDING' | 'REFUNDED'>('ALL');

  useEffect(() => {
    void fetch(`/api/admin/events/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (!data.success) throw new Error(data.error);
        const ev = data.event as EventData;
        setEvent(ev);

        // Parse customFormFields JSON
        const formConfig = parseEventFormConfig(ev.customFormFields, ev.isCompetition);
        setAccess(formConfig.access || 'ALL STUDENTS & MEMBERS');
        setInclusions(formConfig.inclusions || (ev.isCompetition ? 'PRIZE POOL & PASS' : 'CERTIFICATE & KIT'));
        setIsOnHold(Boolean(formConfig.isOnHold));
        setHoldReason(formConfig.holdReason || '');
        setVolumeIssueLabel(formConfig.volumeIssueLabel || '');
        setPassPrefix(formConfig.passPrefix || '');
        setStandardFields(formConfig.standardFields);
        setFields(
          formConfig.fields.map((f, i) => ({
            ...f,
            id: f.id || crypto.randomUUID(),
            name: f.name || f.label.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 40) || `field_${i}`,
          }))
        );

        // Fetch registration list
        fetch(`/api/admin/events/${id}/registrations`)
          .then((r) => r.json())
          .then((regData) => {
            if (regData.success && regData.registrations) {
              setRegistrationList(regData.registrations);
            }
          })
          .catch((err) => console.warn('Failed to load registrations:', err));

        // Slug suffix extraction
        const slugStr: string = ev.slug || '';
        const codeMatch = slugStr.match(/^exc-\d{2}-\d{2}-(.+)$/);
        setCodeSuffix(codeMatch ? codeMatch[1] : slugStr);

        setWinners(ev.winners?.length ? ev.winners : [emptyWinner('FIRST'), emptyWinner('SECOND'), emptyWinner('THIRD')]);
      })
      .catch((e) => {
        setNoticeError(true);
        setNotice(e instanceof Error ? e.message : 'Could not load event.');
      });
  }, [id]);

  const update = (key: string, value: unknown) =>
    setEvent((current) => (current ? { ...current, [key]: value } : current));

  const showNotice = (message: string, isError = false) => {
    setNoticeError(isError);
    setNotice(message);
  };

  const upload = async (file: File | undefined, target: 'posterImage' | 'coverImage' | 'paymentQrImage' | 'winner' | 'gallery', index?: number) => {
    if (!file) return;
    try {
      const url = await uploadImageBlob(file, 'event-media', file.name);
      if (target === 'winner' && index !== undefined) {
        const old = winners[index]?.photoUrl;
        if (old) await deleteUploadedImage(old);
        setWinners((all) => all.map((item, i) => (i === index ? { ...item, photoUrl: url } : item)));
      } else if (target === 'gallery') {
        setNewGallery((all) => [...all, url]);
      } else {
        const old = event?.[target];
        if (typeof old === 'string' && old && old !== url) await deleteUploadedImage(old);
        if (target === 'posterImage') {
          update('posterImage', url);
          update('coverImage', url);
        } else {
          update(target, url);
        }
      }
    } catch {
      showNotice('Image upload failed.', true);
    }
  };

  const removeImage = async (target: 'posterImage' | 'coverImage' | 'paymentQrImage') => {
    if (!event) return;
    const url = event[target];
    if (typeof url === 'string' && url) await deleteUploadedImage(url);
    if (target === 'posterImage' || target === 'coverImage') {
      update('posterImage', null);
      update('coverImage', null);
    } else {
      update(target, null);
    }
  };

  const removeWinnerPhoto = async (index: number) => {
    const old = winners[index]?.photoUrl;
    setWinners((all) => all.map((x, i) => (i === index ? { ...x, photoUrl: '' } : x)));
    await deleteUploadedImage(old);
  };

  const removeStagedGallery = async (url: string) => {
    setNewGallery((all) => all.filter((u) => u !== url));
    await deleteUploadedImage(url);
  };

  const deleteGalleryItem = async (itemId: string, url: string) => {
    try {
      const res = await fetch(`/api/admin/events/${id}/gallery`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Could not delete image.');
      setEvent((current) =>
        current ? { ...current, gallery: (current.gallery || []).filter((g) => g.id !== itemId) } : current
      );
      showNotice('Image deleted.');
    } catch (error) {
      showNotice(error instanceof Error ? error.message : 'Could not delete image.', true);
    }
  };

  const mirrorPosterToCover = async (checked: boolean) => {
    const poster = String(event?.posterImage ?? '');
    const cover = String(event?.coverImage ?? '');
    if (checked && poster) {
      if (cover && cover !== poster) await deleteUploadedImage(cover);
      update('coverImage', poster);
    } else {
      update('coverImage', '');
    }
  };

  const updateField = (fieldId: string, patch: Partial<FormFieldDefinition>) => {
    setFields((all) =>
      all.map((f) => {
        if (f.id !== fieldId) return f;
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

  const duplicateField = (fieldId: string) => {
    setFields((all) => {
      const idx = all.findIndex((f) => f.id === fieldId);
      if (idx === -1) return all;
      const src = all[idx];
      const copy: FormFieldDefinition = {
        ...src,
        id: crypto.randomUUID(),
        name: `${src.name}_copy`.slice(0, 40),
        label: src.label ? `${src.label} (copy)` : '',
        options: src.options ? [...src.options] : undefined,
      };
      return [...all.slice(0, idx + 1), copy, ...all.slice(idx + 1)];
    });
  };

  const handleTestWebhook = async () => {
    if (!event) return;
    const url = String(event.googleSheetUrl || '').trim();
    if (!url) return;
    setTestingWebhook(true);
    setWebhookTestResult(null);
    try {
      const res = await fetch('/api/admin/events/test-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          webhookUrl: url,
          eventTitle: event.title || 'Event Manager Verification',
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

  const fetchRegistrations = async () => {
    setLoadingRegs(true);
    try {
      const res = await fetch(`/api/admin/events/${id}/registrations`);
      const data = await res.json();
      if (data.success && data.registrations) {
        setRegistrationList(data.registrations);
      }
    } catch (err) {
      console.error('Failed to load registrations:', err);
    } finally {
      setLoadingRegs(false);
    }
  };

  const updatePaymentStatus = async (registrationId: string, paymentStatus: 'VERIFIED' | 'FAILED' | 'REFUNDED') => {
    try {
      const res = await fetch(`/api/admin/events/${id}/registrations`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ registrationId, paymentStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setRegistrationList((prev) =>
          prev.map((r) => (r.id === registrationId ? { ...r, paymentStatus } : r))
        );
      } else {
        alert(data.error || 'Failed to update payment status');
      }
    } catch (err: any) {
      alert(err.message || 'Error updating payment');
    }
  };

  const openEditModal = (reg: any) => {
    setEditingReg(reg);
    setEditName(reg.name || '');
    setEditEmail(reg.email || '');
    setEditPhone(reg.phone || '');
    setEditExtraFields(
      typeof reg.extraFields === 'object' && reg.extraFields ? { ...reg.extraFields } : {}
    );
  };

  const handleSaveParticipant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReg) return;
    setSavingParticipant(true);
    try {
      const res = await fetch(`/api/admin/events/${id}/registrations`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registrationId: editingReg.id,
          name: editName,
          email: editEmail,
          phone: editPhone,
          extraFields: editExtraFields,
        }),
      });
      const data = await res.json();
      if (data.success && data.registration) {
        setRegistrationList((prev) =>
          prev.map((r) =>
            r.id === editingReg.id
              ? { ...r, name: editName, email: editEmail, phone: editPhone, extraFields: editExtraFields }
              : r
          )
        );
        setEditingReg(null);
      } else {
        alert(data.error || 'Failed to save participant details');
      }
    } catch (err: any) {
      alert(err.message || 'Error updating participant details');
    } finally {
      setSavingParticipant(false);
    }
  };

  const deleteRegistration = async (registrationId: string) => {
    if (!confirm('Are you sure you want to permanently remove this registration record?')) return;
    try {
      const res = await fetch(`/api/admin/events/${id}/registrations`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ registrationId }),
      });
      const data = await res.json();
      if (data.success) {
        setRegistrationList((prev) => prev.filter((r) => r.id !== registrationId));
      } else {
        alert(data.error || 'Failed to delete registration');
      }
    } catch (err: any) {
      alert(err.message || 'Error removing registration');
    }
  };

  const dispatchReminderEmails = async () => {
    const activeCount = registrationList.filter(
      (r) => r.paymentStatus !== 'CANCELLED_REFUND_PENDING' && r.paymentStatus !== 'CANCELLED'
    ).length;
    if (activeCount === 0) {
      alert('No active registrations to notify.');
      return;
    }
    if (
      !confirm(
        `Send 24-Hour Reminder emails to all ${activeCount} active registered attendees for "${event?.title}"?`
      )
    )
      return;

    setSendingReminder(true);
    try {
      const res = await fetch(`/api/admin/events/${id}/send-reminder`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success) {
        showNotice(data.message || '24-Hour Reminder emails dispatched successfully!');
      } else {
        alert(data.error || 'Failed to dispatch reminders');
      }
    } catch (err: any) {
      alert(err.message || 'Error sending reminder emails');
    } finally {
      setSendingReminder(false);
    }
  };

  const exportCsv = () => {
    if (!event || registrationList.length === 0) return;
    const customCols = fields.map((f) => f.label || f.name);
    const headers = ['Pass Code', 'Name', 'Email', 'Phone', 'Payment Status', 'Registered At', ...customCols];
    const rows = registrationList.map((r) => {
      const passCode = `${passPrefix || 'EXC-PASS'}-${event.id.substring(0, 6).toUpperCase()}-${r.id.substring(0, 6).toUpperCase()}`;
      const extras = r.extraFields || {};
      const extraVals = fields.map((f) => {
        const val = extras[f.id] ?? '';
        return `"${String(val).replace(/"/g, '""')}"`;
      });
      return [
        `"${passCode}"`,
        `"${r.name.replace(/"/g, '""')}"`,
        `"${r.email.replace(/"/g, '""')}"`,
        `"${(r.phone || '').replace(/"/g, '""')}"`,
        `"${r.paymentStatus || 'N/A'}"`,
        `"${new Date(r.registeredAt).toLocaleString()}"`,
        ...extraVals,
      ].join(',');
    });
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${event.slug || 'event'}_registrations.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const save = async () => {
    if (!event) return;

    const errs: string[] = [];
    if (!String(event.title ?? '').trim()) errs.push('Title is required.');
    if (!String(event.description ?? '').trim()) errs.push('Description is required.');
    if (!event.date) errs.push('Date is required.');
    if (!String(event.venue ?? '').trim()) errs.push('Venue is required.');
    const cap = event.maxCapacity ? Number(event.maxCapacity) : null;
    if (cap !== null && (isNaN(cap) || cap <= 0)) errs.push('Max capacity must be a positive number.');
    if (event.requirePayment && !String(event.paymentQrImage ?? '').trim()) {
      errs.push('A payment QR image is required when payment is enabled.');
    }
    if (event.requirePayment && !String(event.paymentAmount ?? '').trim()) {
      errs.push('Fee amount is required when payment is enabled.');
    }
    if (
      String(event.googleSheetUrl ?? '').trim() &&
      !/^https:\/\/(script\.google\.com|hooks\.[a-z0-9.-]+)\//.test(String(event.googleSheetUrl).trim())
    ) {
      errs.push('Google Sheet URL must be a webhook (https://script.google.com/… or https://hooks.…).');
    }
    if (codeDirty && codeSuffix.length < 3) {
      errs.push('Event code suffix must be at least 3 characters (letters, numbers, hyphens).');
    }
    for (const f of fields) {
      if (!f.label.trim()) {
        errs.push('Every registration question needs a prompt text.');
        break;
      }
      if (f.type === 'select' || f.type === 'multiselect') {
        const opts = (f.options || []).map((o) => o.trim()).filter(Boolean);
        if (opts.length < 2) {
          errs.push(`"${f.label}" is a choice list — fill in at least 2 options.`);
          break;
        }
        const dupes = opts.filter((o, i) => opts.indexOf(o) !== i);
        if (dupes.length > 0) {
          errs.push(`"${f.label}" has duplicate options: ${[...new Set(dupes)].join(', ')}.`);
          break;
        }
      }
    }
    if (errs.length > 0) {
      showNotice(errs.join(' '), true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setSaving(true);
    try {
      const serializedFormConfig = serializeEventFormConfig({
        access: access.trim() || 'ALL STUDENTS & MEMBERS',
        inclusions: inclusions.trim() || (event.isCompetition ? 'PRIZE POOL & PASS' : 'CERTIFICATE & KIT'),
        isOnHold,
        holdReason: holdReason.trim(),
        volumeIssueLabel: volumeIssueLabel.trim(),
        passPrefix: passPrefix.trim(),
        standardFields,
        fields,
      });

      const payload = {
        ...event,
        slug: codeDirty && codeSuffix.length >= 3 ? eventCode : event.slug,
        customFormFields: serializedFormConfig,
        maxCapacity: cap,
        winners: undefined,
        gallery: undefined,
      };
      const eventRes = await fetch(`/api/admin/events/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const eventData = await eventRes.json();
      if (!eventRes.ok) throw new Error(eventData.error || 'Could not save event.');

      const winRes = await fetch(`/api/admin/events/${id}/winners`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ winners: winners.filter((item) => item.participantName.trim()) }),
      });
      if (!winRes.ok) throw new Error('Event details saved, but winners could not be saved.');

      if (newGallery.length) {
        const galleryRes = await fetch(`/api/admin/events/${id}/gallery`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items: newGallery.map((url) => ({ url })) }),
        });
        if (!galleryRes.ok) throw new Error('Event details saved, but gallery could not be saved.');
        setNewGallery([]);
      }
      if (eventData.notifiedCount && eventData.notifiedCount > 0) {
        showNotice(`All changes saved. Sent update email notices to ${eventData.notifiedCount} registered participant${eventData.notifiedCount > 1 ? 's' : ''}.`);
      } else {
        showNotice('All changes saved successfully.');
      }
    } catch (error) {
      showNotice(error instanceof Error ? error.message : 'Could not save event.', true);
    } finally {
      setSaving(false);
    }
  };

  const status = async (action: 'ARCHIVE' | 'UPCOMING' | 'CANCEL') => {
    if (!event) return;
    const upcoming = event.status === 'UPCOMING' && action === 'ARCHIVE';
    const confirmMsg = upcoming
      ? 'This event is still UPCOMING. Mark it completed anyway?'
      : action === 'ARCHIVE'
        ? 'Mark this event completed?'
        : action === 'CANCEL'
          ? 'Cancel this event? Registrations will close.'
          : 'Reopen this event for registration?';
    if (!confirm(confirmMsg)) return;
    const res = await fetch(`/api/admin/events/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    });
    const data = await res.json();
    if (!res.ok) {
      showNotice(data.error || 'Could not change status.', true);
      return;
    }
    update('status', data.event.status);
    showNotice('Event status updated.');
  };

  if (!event) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        {notice ? <p className="text-sm text-red-500">{notice}</p> : <Loader2 className="animate-spin" />}
      </div>
    );
  }

  // Event code prefix
  const codePrefix = (() => {
    const d = event.date ? new Date(event.date) : new Date();
    const yy = String(d.getFullYear()).slice(-2);
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return `exc-${yy}-${mm}-`;
  })();
  const eventCode = codePrefix + (codeSuffix || '');
  const slugChanged = eventCode !== event.slug;

  const registrationCount = event.registrations?.length ?? 0;
  const maxCapNum = event.maxCapacity ? Number(event.maxCapacity) : null;
  const remainingSeats = maxCapNum !== null ? Math.max(0, maxCapNum - registrationCount) : null;

  const tabs: { id: TabKey; label: string; icon: any; count?: number }[] = [
    { id: 'basics', label: '1. Basic Entry & Logistics', icon: Calendar },
    { id: 'form', label: '2. Registration Form', icon: ClipboardList, count: fields.length },
    { id: 'links', label: '3. Payment & Links', icon: Link2 },
    { id: 'post_event', label: '4. Podium & Gallery', icon: Award },
    { id: 'registrations', label: '5. Attendees & Submissions', icon: Users, count: registrationList.length },
  ];

  return (
    <main className="w-full min-h-screen bg-neutral-50 dark:bg-[#070707] text-neutral-900 dark:text-neutral-100 selection:bg-neutral-900 selection:text-white dark:selection:bg-white dark:selection:text-neutral-950 px-4 sm:px-6 md:px-8 py-8 md:py-10 max-w-6xl mx-auto space-y-8">
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
            Event Settings &amp; Roster
          </span>
        </div>

        {/* Title and Top Actions */}
        <header className="flex flex-col gap-4 border-b border-neutral-200 dark:border-neutral-800/80 pb-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-800">
                {event.slug || eventCode}
              </span>
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase border ${
                  event.status === 'UPCOMING'
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50'
                    : event.status === 'PAST'
                    ? 'bg-neutral-100 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-800'
                    : 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/50'
                }`}
              >
                {event.status}
              </span>
              {isOnHold && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  ON HOLD
                </span>
              )}
            </div>

            <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-neutral-900 dark:text-white">
              {event.title || 'Event Settings'}
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {canManageEvents ? (
              <>
                {/* Status quick buttons */}
                <div className="flex items-center gap-1 p-1 rounded-xl bg-white dark:bg-[#0e0e0e] border border-neutral-200 dark:border-neutral-800 shadow-xs">
                  <button
                    type="button"
                    onClick={() => void status('UPCOMING')}
                    disabled={event.status === 'UPCOMING'}
                    className="px-2.5 py-1 rounded-lg font-mono text-[10px] font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white disabled:opacity-40 transition-colors"
                  >
                    Upcoming
                  </button>
                  <button
                    type="button"
                    onClick={() => void status('ARCHIVE')}
                    disabled={event.status === 'PAST'}
                    className="px-2.5 py-1 rounded-lg font-mono text-[10px] font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white disabled:opacity-40 transition-colors"
                  >
                    Completed
                  </button>
                  <button
                    type="button"
                    onClick={() => void status('CANCEL')}
                    disabled={event.status === 'CANCELLED'}
                    className="px-2.5 py-1 rounded-lg font-mono text-[10px] font-bold uppercase tracking-wider text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 disabled:opacity-40 transition-colors"
                  >
                    Cancel
                  </button>
                </div>

                {/* Preview Modal Button */}
                <button
                  type="button"
                  onClick={() => setPreviewModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0e0e0e] hover:bg-neutral-100 dark:hover:bg-neutral-850 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition-all shadow-xs"
                >
                  <Eye size={13} />
                  <span>Preview Form</span>
                </button>

                {/* Save Changes Button */}
                <button
                  type="button"
                  onClick={() => void save()}
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 text-xs font-medium hover:bg-neutral-800 dark:hover:bg-neutral-200 active:scale-[0.98] transition-all shadow-sm disabled:opacity-50"
                >
                  {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                  <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </>
            ) : (
              <>
                <span className="px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900 text-xs font-mono font-medium text-neutral-600 dark:text-neutral-400">
                  Treasurer View-Only
                </span>
                <button
                  type="button"
                  onClick={() => setPreviewModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0e0e0e] hover:bg-neutral-100 dark:hover:bg-neutral-850 text-xs font-medium text-neutral-700 dark:text-neutral-300"
                >
                  <Eye size={13} />
                  <span>Preview Form</span>
                </button>
              </>
            )}
          </div>
        </header>

        {/* Notices Alert Banner */}
        {notice && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-3.5 sm:p-4 rounded-xl border text-xs flex items-center justify-between gap-3 shadow-xs ${
              noticeError
                ? 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900 text-red-700 dark:text-red-300'
                : 'bg-neutral-100 dark:bg-neutral-900 border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white'
            }`}
          >
            <span className="font-medium">{notice}</span>
            <button
              type="button"
              onClick={() => setNotice('')}
              className="p-1 text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
            >
              <X size={14} />
            </button>
          </motion.div>
        )}

        {/* Executive Metric Tiles */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {/* 1. Date & Venue */}
          <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800/90 bg-white dark:bg-[#0a0a0a] p-4 space-y-1 shadow-xs">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
              <Calendar size={12} className="text-neutral-500" /> Date &amp; Venue
            </span>
            <p className="font-serif text-sm sm:text-base font-bold text-neutral-900 dark:text-white truncate">
              {event.date
                ? new Date(event.date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })
                : 'Date TBA'}
            </p>
            <p className="text-[11px] text-neutral-500 truncate">
              {event.venue || 'No Venue'} {event.time ? `· ${event.time}` : ''}
            </p>
          </div>

          {/* 2. Attendance */}
          <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800/90 bg-white dark:bg-[#0a0a0a] p-4 space-y-1 shadow-xs">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
              <Users size={12} className="text-neutral-500" /> Attendance
            </span>
            <p className="font-serif text-sm sm:text-base font-bold text-neutral-900 dark:text-white">
              {registrationCount} {maxCapNum !== null ? `/ ${maxCapNum} Seats` : 'Registrations'}
            </p>
            <p className="text-[11px] text-neutral-500">
              {maxCapNum !== null ? `${remainingSeats} available` : 'Open admission'}
            </p>
          </div>

          {/* 3. Tariff & Status */}
          <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800/90 bg-white dark:bg-[#0a0a0a] p-4 space-y-1 shadow-xs">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
              <QrCode size={12} className="text-neutral-500" /> Entry Tariff
            </span>
            <p className="font-serif text-sm sm:text-base font-bold text-neutral-900 dark:text-white truncate">
              {event.requirePayment && event.paymentAmount ? event.paymentAmount : 'Free Admission'}
            </p>
            <p className="text-[11px] text-neutral-500 truncate">
              {isOnHold ? 'Signups on Hold' : 'Accepting Signups'}
            </p>
          </div>

          {/* 4. Public Page Link */}
          <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800/90 bg-white dark:bg-[#0a0a0a] p-4 space-y-1 shadow-xs flex flex-col justify-between">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
              <ExternalLink size={12} className="text-neutral-500" /> Public Portal
            </span>
            <a
              href={`/events/${event.slug || eventCode}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-between w-full px-2.5 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-[#121212] hover:bg-neutral-100 dark:hover:bg-neutral-800 text-[11px] font-mono font-medium text-neutral-800 dark:text-neutral-200 transition-colors group"
            >
              <span className="truncate">/events/{event.slug || eventCode}</span>
              <ExternalLink
                size={11}
                className="text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-white transition-colors shrink-0"
              />
            </a>
          </div>
        </div>

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

                {/* Live Availability Status */}
                <div className="flex items-center gap-2 rounded-xl bg-foreground/[0.03] border border-border px-3 py-1 text-[10px] font-mono">
                  <Users size={12} className="text-amber-500" />
                  <span>
                    {maxCapNum !== null
                      ? `${registrationCount} / ${maxCapNum} Seats Booked (${remainingSeats} Left)`
                      : `${registrationCount} Registrations (Unlimited)`}
                  </span>
                </div>
              </div>

              {/* Title */}
              <div className="space-y-1">
                <label className={labelCls}>Event Title *</label>
                <input
                  type="text"
                  value={String(event.title ?? '')}
                  onChange={(e) => update('title', e.target.value)}
                  className={inputCls}
                />
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className={labelCls}>Main Description *</label>
                <textarea
                  value={String(event.description ?? '')}
                  onChange={(e) => update('description', e.target.value)}
                  rows={5}
                  className={`${inputCls} leading-relaxed`}
                />
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className={labelCls}>Date *</label>
                  <input
                    type="date"
                    value={event.date ? String(event.date).slice(0, 10) : ''}
                    onChange={(e) => update('date', e.target.value)}
                    className={`${inputCls} font-mono`}
                  />
                </div>
                <div className="space-y-1">
                  <label className={labelCls}>Time Window</label>
                  <TimeWindowPicker
                    value={String(event.time ?? '')}
                    onChange={(val) => update('time', val)}
                  />
                </div>
              </div>

              {/* Venue & Max Capacity with Availability Autofetch */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className={labelCls}>Venue *</label>
                  <input
                    type="text"
                    value={String(event.venue ?? '')}
                    onChange={(e) => update('venue', e.target.value)}
                    className={inputCls}
                  />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className={labelCls}>Max Capacity (Empty = Unlimited)</label>
                    <span className="font-mono text-[9px] text-amber-500 font-bold uppercase">
                      {maxCapNum !== null ? `${remainingSeats} Seats Left` : 'Open Admission'}
                    </span>
                  </div>
                  <input
                    type="number"
                    min={1}
                    value={String(event.maxCapacity ?? '')}
                    onChange={(e) => update('maxCapacity', e.target.value)}
                    placeholder="Unlimited"
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
                  isCompetition={event.isCompetition}
                />
              </div>

              {/* Event Code Slug */}
              <div className="space-y-1 pt-2 border-t border-border/40">
                <label className={labelCls}>Event Code (URL Slug)</label>
                <div className="flex items-stretch overflow-hidden rounded-xl border border-border bg-foreground/[0.02]">
                  <span className="flex select-none items-center border-r border-border bg-foreground/[0.04] px-3 font-mono text-xs uppercase text-muted-foreground">
                    {codePrefix.replace(/^exc/, 'EXC')}
                  </span>
                  <input
                    value={codeSuffix}
                    onChange={(e) => {
                      setCodeDirty(true);
                      setCodeSuffix(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '').replace(/(^-|-$)/g, ''));
                    }}
                    placeholder="your-code"
                    className="min-w-0 flex-1 bg-transparent px-3 py-2.5 font-mono text-xs text-foreground focus:outline-none"
                  />
                </div>
                <p className="font-mono text-[10px] text-muted-foreground">
                  Public URL: /events/{eventCode}
                  {codeDirty && slugChanged && <span className="ml-2 text-amber-500 font-bold">⚠ old link will change</span>}
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
                    placeholder={`e.g. VOL. I — ISSUE ${event.id ? event.id.substring(0, 6).toUpperCase() : '01'}`}
                    className={`${inputCls} font-mono text-xs`}
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Custom headline text shown in the top right masthead bar of the event page.
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

              {/* Event Banner & Poster Upload */}
              <div className="space-y-2 pt-2 border-t border-border/40">
                <label className={`${labelCls} block mb-1.5`}>Event Banner &amp; Poster Image (16:9)</label>
                {Boolean(event.posterImage || event.coverImage) && (
                  <div className="w-64 overflow-hidden rounded-2xl border border-border mb-2">
                    <img
                      src={String(event.posterImage || event.coverImage)}
                      alt="Event Banner"
                      className="aspect-video w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => void removeImage('posterImage')}
                      className="flex w-full items-center justify-center gap-1 border-t border-border bg-foreground/[0.03] px-2 py-1.5 text-[10px] font-mono uppercase text-red-500 hover:bg-red-500/10 transition-colors"
                    >
                      <X size={12} /> Remove
                    </button>
                  </div>
                )}
                <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-border bg-foreground/[0.03] px-3 py-2 font-mono text-[10px] font-bold uppercase hover:bg-foreground/[0.08] transition-colors">
                  <Upload size={12} />
                  <span>
                    {event.posterImage || event.coverImage ? 'Replace Banner Image' : 'Upload Banner Image'}
                  </span>
                  <input
                    hidden
                    type="file"
                    accept="image/*"
                    onChange={(e) => void upload(e.target.files?.[0], 'posterImage')}
                  />
                </label>
              </div>

              {/* Competition Toggle */}
              <div className="flex items-center gap-3 rounded-2xl border border-border/40 bg-foreground/[0.02] p-3.5">
                <input
                  type="checkbox"
                  id="isCompEdit"
                  checked={event.isCompetition}
                  onChange={(e) => update('isCompetition', e.target.checked)}
                  className="h-4 w-4 rounded border-border text-amber-500 focus:ring-amber-400"
                />
                <label htmlFor="isCompEdit" className="cursor-pointer select-none text-xs">
                  <strong className="block font-serif text-foreground">This event is a Competitive Contest</strong>
                  <span className="text-[10px] text-muted-foreground">
                    Enables Roll of Honour Podium &amp; Certificate dispatch.
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
                    onClick={() => setFields((all) => [...all, newField()])}
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

              {/* Additional Custom Questions */}
              <div className="space-y-3 pt-2">
                <label className={labelCls}>
                  Additional Event Questions ({fields.length})
                </label>

                {fields.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border/70 p-6 text-center space-y-2">
                    <p className="text-xs text-muted-foreground">
                      No additional questions added yet. Attendees will supply standard Name, Email, and Phone number.
                    </p>
                    <button
                      type="button"
                      onClick={() => setFields((all) => [...all, newField()])}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-foreground/[0.03] px-3.5 py-1.5 text-xs font-mono uppercase text-foreground hover:bg-foreground/[0.08] transition-colors"
                    >
                      <Plus size={13} />
                      <span>Add Extra Question</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {fields.map((field, idx) => (
                      <FormBuilderFieldCard
                        key={field.id}
                        field={field}
                        index={idx}
                        onChange={(patch) => updateField(field.id, patch)}
                        onRemove={() => setFields((all) => all.filter((f) => f.id !== field.id))}
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

                <div className={`px-3 py-1 rounded-full font-mono text-[10px] font-bold uppercase tracking-wider border ${
                  event.requirePayment
                    ? 'bg-amber-400/15 border-amber-400/40 text-amber-600 dark:text-amber-300'
                    : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                }`}>
                  Tariff: {event.requirePayment ? (String(event.paymentAmount ?? '') || '₹100') : 'FREE / COMPLIMENTARY'}
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-2xl border border-border/40 bg-foreground/[0.02] p-3.5">
                <input
                  type="checkbox"
                  id="reqPayEdit"
                  checked={event.requirePayment}
                  onChange={(e) => update('requirePayment', e.target.checked)}
                  className="h-4 w-4 rounded border-border text-amber-500 focus:ring-amber-400"
                />
                <label htmlFor="reqPayEdit" className="cursor-pointer select-none text-xs">
                  <strong className="block font-serif text-foreground">Require Entry Fee Payment</strong>
                  <span className="text-[10px] text-muted-foreground">
                    Displays UPI QR code during registration and requests screenshot proof.
                  </span>
                </label>
              </div>

              {event.requirePayment && (
                <div className="space-y-4 border-t border-border/40 pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className={labelCls}>Fee Amount *</label>
                      <input
                        type="text"
                        value={String(event.paymentAmount ?? '')}
                        onChange={(e) => update('paymentAmount', e.target.value)}
                        placeholder="₹150 / Team"
                        className={`${inputCls} font-mono`}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className={labelCls}>UPI QR Code Image *</label>
                      {Boolean(event.paymentQrImage) && (
                        <div className="w-32 overflow-hidden rounded-xl border border-border mb-2">
                          <img src={String(event.paymentQrImage)} alt="QR" className="aspect-square w-full object-contain bg-white p-2" />
                          <button
                            type="button"
                            onClick={() => void removeImage('paymentQrImage')}
                            className="flex w-full items-center justify-center gap-1 border-t border-border bg-foreground/[0.03] px-2 py-1 text-[9px] font-mono uppercase text-red-500 hover:bg-red-500/10 transition-colors"
                          >
                            <X size={11} /> Remove
                          </button>
                        </div>
                      )}
                      <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-border bg-foreground/[0.03] px-3 py-2 font-mono text-[10px] font-bold uppercase hover:bg-foreground/[0.08] transition-colors">
                        <Upload size={12} />
                        <span>{event.paymentQrImage ? 'Replace QR' : 'Upload QR Image'}</span>
                        <input hidden type="file" accept="image/*" onChange={(e) => void upload(e.target.files?.[0], 'paymentQrImage')} />
                      </label>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className={labelCls}>Payment Instructions *</label>
                    <textarea
                      value={String(event.paymentInstructions ?? '')}
                      onChange={(e) => update('paymentInstructions', e.target.value)}
                      rows={2}
                      className={inputCls}
                    />
                  </div>
                </div>
              )}
            </div>
              {/* Google Sheets */}
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
                      {Boolean(event.googleSheetUrl) && (
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
                        value={String(event.googleSheetUrl ?? '')}
                        onChange={(e) => {
                          update('googleSheetUrl', e.target.value);
                          setWebhookTestResult(null);
                        }}
                        placeholder="https://script.google.com/macros/s/.../exec"
                        className={`${inputCls} font-mono flex-1`}
                      />
                      <button
                        type="button"
                        onClick={handleTestWebhook}
                        disabled={testingWebhook || !event.googleSheetUrl}
                        className="px-4 py-2.5 rounded-xl border border-border bg-foreground/[0.04] hover:bg-foreground/[0.08] text-xs font-mono font-bold uppercase transition-colors disabled:opacity-40 shrink-0"
                      >
                        {testingWebhook ? 'Pinging…' : 'Verify'}
                      </button>
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      Submissions are dispatched asynchronously to your spreadsheet in real-time. Click &quot;Verify&quot; to test your live sheet connection.
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

            {/* External Links */}
            <div className={cardCls}>
              <div className="flex items-center gap-2 border-b border-border/40 pb-3">
                <Link2 size={18} className="text-amber-500" />
                <h3 className="font-serif text-lg font-bold text-foreground">
                  External Documents, Reports &amp; Media Links
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className={labelCls}>Rulebook Link</label>
                  <input
                    type="url"
                    value={String(event.rulebookUrl ?? '')}
                    onChange={(e) => update('rulebookUrl', e.target.value)}
                    placeholder="https://…"
                    className={`${inputCls} font-mono`}
                  />
                </div>
                <div className="space-y-1">
                  <label className={labelCls}>Social Coverage Link</label>
                  <input
                    type="url"
                    value={String(event.socialLink ?? '')}
                    onChange={(e) => update('socialLink', e.target.value)}
                    placeholder="https://…"
                    className={`${inputCls} font-mono`}
                  />
                </div>
                <div className="space-y-1">
                  <label className={labelCls}>Download Materials Link</label>
                  <input
                    type="url"
                    value={String(event.downloadUrl ?? '')}
                    onChange={(e) => update('downloadUrl', e.target.value)}
                    placeholder="https://…"
                    className={`${inputCls} font-mono`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-border/40">
                <div className="space-y-1">
                  <label className={labelCls}>Internal Report Drive Link</label>
                  <input
                    type="url"
                    value={String(event.internalReportUrl ?? '')}
                    onChange={(e) => update('internalReportUrl', e.target.value)}
                    placeholder="https://drive.google.com/…"
                    className={`${inputCls} font-mono`}
                  />
                </div>
                <div className="space-y-1">
                  <label className={labelCls}>External Public Report Link</label>
                  <input
                    type="url"
                    value={String(event.externalReportUrl ?? '')}
                    onChange={(e) => update('externalReportUrl', e.target.value)}
                    placeholder="https://drive.google.com/…"
                    className={`${inputCls} font-mono`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-border/40">
                <div className="space-y-1">
                  <label className={labelCls}>Internal Member Gallery Drive Link</label>
                  <input
                    type="url"
                    value={String(event.internalGalleryUrl ?? '')}
                    onChange={(e) => update('internalGalleryUrl', e.target.value)}
                    placeholder="https://drive.google.com/…"
                    className={`${inputCls} font-mono`}
                  />
                </div>
                <div className="space-y-1">
                  <label className={labelCls}>External Public Highlights Gallery Link</label>
                  <input
                    type="url"
                    value={String(event.externalGalleryUrl ?? '')}
                    onChange={(e) => update('externalGalleryUrl', e.target.value)}
                    placeholder="https://drive.google.com/…"
                    className={`${inputCls} font-mono`}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── TAB 4: POST-EVENT PODIUM & GALLERY ── */}
        {activeTab === 'post_event' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Winners */}
            <div className={cardCls}>
              <div className="flex items-center gap-2 border-b border-border/40 pb-3">
                <Award size={18} className="text-amber-500" />
                <h3 className="font-serif text-lg font-bold text-foreground">
                  Official Roll of Honour &amp; Winners Podium
                </h3>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                {winners.map((item, index) => (
                  <div key={item.position} className="space-y-2 rounded-2xl border border-border/60 bg-foreground/[0.015] p-3.5">
                    <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-amber-500">
                      {item.position} PLACE
                    </span>
                    <input
                      value={item.participantName}
                      onChange={(e) => setWinners((all) => all.map((x, i) => (i === index ? { ...x, participantName: e.target.value } : x)))}
                      placeholder="Winner name"
                      className={inputCls}
                    />
                    <input
                      value={item.prize || ''}
                      onChange={(e) => setWinners((all) => all.map((x, i) => (i === index ? { ...x, prize: e.target.value } : x)))}
                      placeholder="Prize description"
                      className={inputCls}
                    />
                    {item.photoUrl && (
                      <div className="overflow-hidden rounded-xl border border-border">
                        <img src={item.photoUrl} alt="" className="aspect-[4/3] w-full object-cover" />
                        <button
                          type="button"
                          onClick={() => void removeWinnerPhoto(index)}
                          className="flex w-full items-center justify-center gap-1 border-t border-border bg-foreground/[0.03] px-2 py-1 text-[10px] font-mono uppercase text-red-500 hover:bg-red-500/10 transition-colors"
                        >
                          <X size={11} /> Remove photo
                        </button>
                      </div>
                    )}
                    <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-border bg-foreground/[0.03] px-3 py-1.5 font-mono text-[10px] font-bold uppercase hover:bg-foreground/[0.08] transition-colors">
                      <Upload size={12} />
                      <span>{item.photoUrl ? 'Replace Photo' : 'Upload Photo'}</span>
                      <input hidden type="file" accept="image/*" onChange={(e) => void upload(e.target.files?.[0], 'winner', index)} />
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Gallery Direct Uploads */}
            <div className={cardCls}>
              <div className="flex items-center justify-between border-b border-border/40 pb-3">
                <h3 className="font-serif text-lg font-bold text-foreground">
                  Pictorial Supplement Gallery ({((event.gallery || []).length + newGallery.length)})
                </h3>
                <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-border bg-foreground/[0.03] px-3.5 py-1.5 font-mono text-[10px] font-bold uppercase hover:bg-foreground/[0.08] transition-colors">
                  <Upload size={12} />
                  <span>Upload Photos</span>
                  <input
                    hidden
                    multiple
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      Array.from(e.target.files || []).forEach((file) => void upload(file, 'gallery'));
                      e.target.value = '';
                    }}
                  />
                </label>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                {(event.gallery || []).map((item) => (
                  <div key={item.id} className="relative overflow-hidden rounded-xl border border-border group">
                    <img src={item.url} alt="" className="aspect-square w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => void deleteGalleryItem(item.id, item.url)}
                      aria-label="Delete image"
                      className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-white hover:bg-red-500 transition-colors"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
                {newGallery.map((url) => (
                  <div key={url} className="relative overflow-hidden rounded-xl border border-amber-400/60">
                    <img src={url} alt="" className="aspect-square w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => void removeStagedGallery(url)}
                      aria-label="Remove staged image"
                      className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-white hover:bg-red-500 transition-colors"
                    >
                      <X size={12} />
                    </button>
                    <span className="absolute inset-x-0 bottom-0 bg-black/60 py-0.5 text-center font-mono text-[8px] uppercase tracking-widest text-white">
                      New
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* ── TAB 5: REGISTRATIONS & ATTENDEES ── */}
        {activeTab === 'registrations' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* ── SECTION A: CANCELLED PAID REGISTRATIONS (REFUND REVIEW) ── */}
            {registrationList.some((r) => r.paymentStatus === 'CANCELLED_REFUND_PENDING') && (
              <div className="rounded-3xl border-2 border-red-500/40 bg-red-500/[0.04] p-6 space-y-4 shadow-sm">
                <div className="flex items-center justify-between border-b border-red-500/20 pb-3">
                  <div className="flex items-center gap-2">
                    <AlertCircle size={20} className="text-red-500" />
                    <div>
                      <h3 className="font-serif text-lg font-bold text-red-600 dark:text-red-400">
                        Cancelled Registrations (Refund Action Needed)
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        These users registered for a paid event, submitted payment proof, and subsequently cancelled. Review their UPI proof and issue refunds.
                      </p>
                    </div>
                  </div>
                  <span className="font-mono text-xs font-bold px-3 py-1 rounded-full bg-red-500/20 text-red-600 dark:text-red-300 border border-red-500/30">
                    {registrationList.filter((r) => r.paymentStatus === 'CANCELLED_REFUND_PENDING').length} Pending Refund
                  </span>
                </div>

                <div className="space-y-3">
                  {registrationList
                    .filter((r) => r.paymentStatus === 'CANCELLED_REFUND_PENDING')
                    .map((reg) => {
                      const passCode = `${passPrefix || 'EXC-PASS'}-${event.id.substring(0, 6).toUpperCase()}-${reg.id.substring(0, 6).toUpperCase()}`;
                      const extras = reg.extraFields || {};

                      return (
                        <div
                          key={reg.id}
                          className="rounded-2xl border border-red-500/30 bg-background p-4 space-y-3 shadow-xs"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/30 pb-3">
                            <div className="flex items-center gap-3">
                              <div className="h-9 w-9 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center font-serif font-bold text-red-600">
                                {reg.name.slice(0, 1).toUpperCase()}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="font-serif text-sm font-bold text-foreground">{reg.name}</h4>
                                  <span className="font-mono text-[9px] px-2 py-0.5 rounded-full bg-red-500/10 text-red-600 font-bold uppercase">
                                    {passCode} · CANCELLED
                                  </span>
                                </div>
                                <p className="text-xs font-sans text-muted-foreground">
                                  {reg.email} {reg.phone ? `· ${reg.phone}` : ''}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              {reg.paymentScreenshotUrl && (
                                <button
                                  type="button"
                                  onClick={() => setSelectedProofUrl(reg.paymentScreenshotUrl)}
                                  className="px-2.5 py-1 rounded-lg border border-border text-[10px] font-mono font-bold uppercase hover:bg-foreground/[0.05]"
                                >
                                  View Payment Proof
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => updatePaymentStatus(reg.id, 'REFUNDED')}
                                className="px-3 py-1 rounded-lg bg-emerald-500 text-white text-[10px] font-mono font-bold uppercase hover:bg-emerald-600 transition-colors shadow-xs"
                              >
                                Mark Refund Issued
                              </button>

                              <button
                                type="button"
                                onClick={() => deleteRegistration(reg.id)}
                                className="p-1 text-muted-foreground hover:text-red-500 transition-colors"
                                title="Dismiss / Delete Record"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </div>

                          {extras.cancelledAt && (
                            <p className="text-[10px] font-mono text-muted-foreground">
                              Cancelled at: {new Date(extras.cancelledAt).toLocaleString()}
                            </p>
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* ── SECTION B: ACTIVE ATTENDEES ROSTER ── */}
            <div className={cardCls}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Users size={20} className="text-amber-500" />
                    <h3 className="font-serif text-xl font-bold text-foreground">
                      Active Registered Attendees ({registrationList.filter((r) => r.paymentStatus !== 'CANCELLED_REFUND_PENDING').length})
                    </h3>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Manage active attendee records, edit submitted details, verify payments, and export data.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={fetchRegistrations}
                    disabled={loadingRegs}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border bg-foreground/[0.02] hover:bg-foreground/[0.06] text-xs font-mono font-bold uppercase transition-colors"
                  >
                    <Loader2 size={12} className={loadingRegs ? 'animate-spin' : 'hidden'} />
                    <span>Refresh</span>
                  </button>

                  <button
                    type="button"
                    onClick={dispatchReminderEmails}
                    disabled={sendingReminder || registrationList.length === 0}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-xs font-mono font-bold uppercase text-amber-600 dark:text-amber-400 transition-colors disabled:opacity-40"
                  >
                    <Bell size={13} className={sendingReminder ? 'animate-spin' : ''} />
                    <span>{sendingReminder ? 'Sending...' : 'Send 24h Reminder'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={exportCsv}
                    disabled={registrationList.length === 0}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-black dark:bg-white text-white dark:text-black text-xs font-mono font-bold uppercase hover:opacity-90 transition-opacity disabled:opacity-40 shadow-xs cursor-pointer"
                  >
                    <Download size={13} />
                    <span>Export CSV</span>
                  </button>
                </div>
              </div>

              {/* Real-time Search & Payment Filter Controls */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
                <div className="relative flex-1">
                  <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    value={rosterSearch}
                    onChange={(e) => setRosterSearch(e.target.value)}
                    placeholder="Search by name, email, phone, or EXC pass code..."
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-border bg-foreground/[0.02] hover:bg-foreground/[0.04] focus:bg-background text-xs font-mono text-foreground focus:outline-none focus:border-amber-400 transition-colors"
                  />
                  {rosterSearch && (
                    <button
                      type="button"
                      onClick={() => setRosterSearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>

                {event.requirePayment && (
                  <div className="flex items-center gap-1 p-1 bg-foreground/[0.03] rounded-xl border border-border/60">
                    {(['ALL', 'PENDING', 'VERIFIED', 'REFUNDED'] as const).map((filterVal) => (
                      <button
                        key={filterVal}
                        type="button"
                        onClick={() => setRosterPaymentFilter(filterVal)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold uppercase transition-all cursor-pointer ${
                          rosterPaymentFilter === filterVal
                            ? 'bg-background text-foreground shadow-2xs border border-border/60'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {filterVal}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Roster Cards / Table */}
              {loadingRegs ? (
                <div className="py-12 flex justify-center items-center">
                  <Loader2 className="animate-spin text-muted-foreground" size={24} />
                </div>
              ) : registrationList.filter((r) => r.paymentStatus !== 'CANCELLED_REFUND_PENDING').length === 0 ? (
                <div className="py-12 text-center text-muted-foreground text-sm font-sans space-y-2">
                  <Users size={32} className="mx-auto text-muted-foreground/40" />
                  <p className="font-serif text-base text-foreground">No Active Registrations</p>
                  <p className="text-xs">When attendees register for this event, their full details and form answers will appear here.</p>
                </div>
              ) : (() => {
                const filteredList = registrationList
                  .filter((r) => r.paymentStatus !== 'CANCELLED_REFUND_PENDING')
                  .filter((r) => {
                    if (rosterPaymentFilter === 'VERIFIED') return r.paymentStatus === 'VERIFIED';
                    if (rosterPaymentFilter === 'PENDING')
                      return r.paymentStatus !== 'VERIFIED' && r.paymentStatus !== 'REFUNDED';
                    if (rosterPaymentFilter === 'REFUNDED') return r.paymentStatus === 'REFUNDED';
                    return true;
                  })
                  .filter((r) => {
                    if (!rosterSearch.trim()) return true;
                    const q = rosterSearch.toLowerCase();
                    const passCode = `${passPrefix || 'EXC-PASS'}-${event.id.substring(0, 6).toUpperCase()}-${r.id.substring(0, 6).toUpperCase()}`.toLowerCase();
                    return (
                      (r.name && r.name.toLowerCase().includes(q)) ||
                      (r.email && r.email.toLowerCase().includes(q)) ||
                      (r.phone && r.phone.toLowerCase().includes(q)) ||
                      passCode.includes(q)
                    );
                  });

                if (filteredList.length === 0) {
                  return (
                    <div className="py-8 text-center text-muted-foreground text-xs font-mono">
                      No registrations match your search or filter criteria.
                    </div>
                  );
                }

                return (
                  <div className="space-y-3">
                    {filteredList.map((reg) => {
                      const passCode = `${passPrefix || 'EXC-PASS'}-${event.id.substring(0, 6).toUpperCase()}-${reg.id.substring(0, 6).toUpperCase()}`;
                      const extras = reg.extraFields || {};

                      return (
                        <div
                          key={reg.id}
                          className="rounded-2xl border border-border/70 bg-foreground/[0.015] p-4 space-y-3 hover:border-border hover:bg-foreground/[0.025] transition-all"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/30 pb-3">
                            <div className="flex items-center gap-3">
                              <div className="h-9 w-9 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center font-serif font-bold text-amber-600 dark:text-amber-400">
                                {reg.name.slice(0, 1).toUpperCase()}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="font-serif text-sm font-bold text-foreground">{reg.name}</h4>
                                  <span className="font-mono text-[9px] px-2 py-0.5 rounded-full bg-foreground/[0.05] text-muted-foreground font-bold uppercase">
                                    {passCode}
                                  </span>
                                </div>
                                <p className="text-xs font-sans text-muted-foreground">
                                  {reg.email} {reg.phone ? `· ${reg.phone}` : ''}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              {/* Edit Participant Button */}
                              <button
                                type="button"
                                onClick={() => openEditModal(reg)}
                                className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-border bg-foreground/[0.02] hover:bg-foreground/[0.06] text-[10px] font-mono font-bold uppercase transition-colors cursor-pointer"
                              >
                                <Edit2 size={11} />
                                <span>Edit</span>
                              </button>

                              {/* Payment Status Badge */}
                              {event.requirePayment && (
                                <div className="flex items-center gap-1.5">
                                  <span className={`font-mono text-[9px] font-bold px-2 py-0.5 rounded-full uppercase border ${
                                    reg.paymentStatus === 'VERIFIED'
                                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                                      : reg.paymentStatus === 'REFUNDED'
                                      ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30'
                                      : reg.paymentStatus === 'FAILED'
                                      ? 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30'
                                      : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
                                  }`}>
                                    Payment: {reg.paymentStatus || 'PENDING'}
                                  </span>

                                  {reg.paymentScreenshotUrl && (
                                    <button
                                      type="button"
                                      onClick={() => setSelectedProofUrl(reg.paymentScreenshotUrl)}
                                      className="px-2 py-0.5 rounded-lg border border-border text-[9px] font-mono font-bold uppercase hover:bg-foreground/[0.05] cursor-pointer"
                                    >
                                      Proof
                                    </button>
                                  )}

                                  {reg.paymentStatus !== 'VERIFIED' && (
                                    <button
                                      type="button"
                                      onClick={() => updatePaymentStatus(reg.id, 'VERIFIED')}
                                      className="px-2 py-0.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-[9px] font-mono font-bold uppercase hover:bg-emerald-500/25 cursor-pointer"
                                    >
                                      Verify
                                    </button>
                                  )}
                                </div>
                              )}

                              <button
                                type="button"
                                onClick={() => deleteRegistration(reg.id)}
                                className="p-1 text-muted-foreground hover:text-red-500 transition-colors cursor-pointer"
                                title="Delete Registration"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>

                          {/* Custom Question Answers */}
                          {fields.length > 0 && Object.keys(extras).length > 0 && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-1">
                              {fields.map((f) => {
                                const ans = extras[f.id];
                                if (ans === undefined || ans === null || ans === '') return null;
                                return (
                                  <div key={f.id} className="rounded-xl border border-border/40 bg-foreground/[0.02] p-2.5 text-xs">
                                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground block">
                                      {f.label || f.name}
                                    </span>
                                    <span className="font-serif text-foreground mt-0.5 block break-words">
                                      {Array.isArray(ans) ? ans.join(', ') : String(ans)}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          </motion.div>
        )}

      {/* Proof Lightbox Modal */}
      {selectedProofUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4"
          onClick={() => setSelectedProofUrl(null)}
        >
          <div
            className="relative max-w-xl max-h-[85vh] bg-white dark:bg-[#0c0c0c] p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xl space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-2">
              <span className="text-xs font-medium text-neutral-900 dark:text-white font-mono uppercase tracking-wider">
                UPI Payment Transaction Proof
              </span>
              <button
                type="button"
                onClick={() => setSelectedProofUrl(null)}
                className="p-1 rounded-lg text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            <img src={selectedProofUrl} alt="Payment Proof" className="max-h-[70vh] w-auto object-contain rounded-xl mx-auto" />
          </div>
        </div>
      )}

      {/* Edit Participant Details Modal */}
      {editingReg && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4"
          onClick={() => setEditingReg(null)}
        >
          <div
            className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white dark:bg-[#0c0c0c] p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xl space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <Edit2 size={16} className="text-neutral-900 dark:text-white" />
                <h3 className="font-serif text-lg font-bold text-neutral-900 dark:text-white">
                  Edit Attendee Record
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingReg(null)}
                className="p-1 rounded-lg text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveParticipant} className="space-y-4">
              <div className="space-y-1">
                <label className={labelCls}>Full Name *</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className={inputCls}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className={labelCls}>Email Address *</label>
                  <input
                    type="email"
                    required
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className={inputCls}
                  />
                </div>
                <div className="space-y-1">
                  <label className={labelCls}>WhatsApp / Phone</label>
                  <input
                    type="text"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className={inputCls}
                  />
                </div>
              </div>

              {/* Dynamic Custom Fields */}
              {fields.length > 0 && (
                <div className="space-y-3 border-t border-neutral-200 dark:border-neutral-800 pt-3">
                  <h4 className="font-mono text-[10px] uppercase tracking-wider text-neutral-500 font-semibold">
                    Registration Form Answers
                  </h4>
                  {fields.map((f) => (
                    <div key={f.id} className="space-y-1">
                      <label className={labelCls}>{f.label || f.name}</label>
                      <input
                        type="text"
                        value={editExtraFields[f.id] ?? ''}
                        onChange={(e) =>
                          setEditExtraFields((prev) => ({
                            ...prev,
                            [f.id]: e.target.value,
                          }))
                        }
                        className={inputCls}
                      />
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 border-t border-neutral-200 dark:border-neutral-800 pt-4">
                <button
                  type="button"
                  onClick={() => setEditingReg(null)}
                  className="px-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0e0e0e] hover:bg-neutral-100 dark:hover:bg-neutral-850 text-xs font-medium text-neutral-700 dark:text-neutral-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingParticipant}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 text-xs font-medium hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors disabled:opacity-50 shadow-sm"
                >
                  {savingParticipant ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Form Preview Modal */}
      <FormPreviewModal
        isOpen={previewModalOpen}
        onClose={() => setPreviewModalOpen(false)}
        eventTitle={String(event.title ?? '')}
        isOnHold={isOnHold}
        holdReason={holdReason}
        standardFields={standardFields}
        customFields={fields}
        requirePayment={Boolean(event.requirePayment)}
        paymentAmount={String(event.paymentAmount ?? '')}
        paymentInstructions={String(event.paymentInstructions ?? '')}
        paymentQrImage={String(event.paymentQrImage ?? '')}
      />
    </main>
  );
}
