// src/components/admin/FormPreviewModal.tsx
'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Smartphone, Monitor, QrCode, CheckCircle2, AlertCircle } from 'lucide-react';
import { type FormFieldDefinition } from '@/components/admin/FormBuilderFieldCard';
import { type StandardFieldConfig } from '@/lib/event-form';

interface FormPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventTitle: string;
  isOnHold?: boolean;
  holdReason?: string;
  standardFields: StandardFieldConfig;
  customFields: FormFieldDefinition[];
  requirePayment: boolean;
  paymentAmount?: string;
  paymentInstructions?: string;
  paymentQrImage?: string;
}

export default function FormPreviewModal({
  isOpen,
  onClose,
  eventTitle,
  isOnHold,
  holdReason,
  standardFields,
  customFields,
  requirePayment,
  paymentAmount,
  paymentInstructions,
  paymentQrImage,
}: FormPreviewModalProps) {
  const [deviceMode, setDeviceMode] = useState<'desktop' | 'mobile'>('desktop');
  const [testAnswers, setTestAnswers] = useState<Record<string, any>>({});
  const [testName, setTestName] = useState('John Doe');
  const [testEmail, setTestEmail] = useState('john.doe@example.com');
  const [testPhone, setTestPhone] = useState('+91 98765 43210');

  useEffect(() => {
    if (isOpen) {
      const origBodyOverflow = document.body.style.overflow;
      const origHtmlOverflow = document.documentElement.style.overflow;
      const origBodyTouch = document.body.style.touchAction;

      document.documentElement.classList.add('overflow-hidden');
      document.body.classList.add('overflow-hidden');
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';

      return () => {
        document.documentElement.classList.remove('overflow-hidden');
        document.body.classList.remove('overflow-hidden');
        document.body.style.overflow = origBodyOverflow || '';
        document.documentElement.style.overflow = origHtmlOverflow || '';
        document.body.style.touchAction = origBodyTouch || '';
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const toggleMulti = (fieldId: string, option: string, checked: boolean) => {
    const list = Array.isArray(testAnswers[fieldId]) ? testAnswers[fieldId] : [];
    setTestAnswers((all) => ({
      ...all,
      [fieldId]: checked ? [...list, option] : list.filter((o: string) => o !== option),
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overscroll-contain">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-neutral-950/80 backdrop-blur-md"
      />

      {/* Main Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 15 }}
        className="relative z-10 flex flex-col w-full max-w-4xl max-h-[92vh] rounded-3xl border border-border bg-background shadow-2xl overflow-hidden overscroll-contain"
      >
        {/* Top Control Bar */}
        <div className="flex items-center justify-between border-b border-border/80 bg-foreground/[0.02] px-5 py-3.5 shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-serif text-sm font-bold text-foreground">
              Registration Form Interactive Preview
            </span>
            <span className="hidden sm:inline-block rounded-full bg-amber-400/10 px-2.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              Live Testing
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Device Switcher */}
            <div className="flex items-center rounded-xl border border-border bg-foreground/[0.03] p-0.5">
              <button
                type="button"
                onClick={() => setDeviceMode('desktop')}
                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-mono text-[10px] font-bold uppercase transition-colors ${
                  deviceMode === 'desktop'
                    ? 'bg-foreground text-background shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Monitor size={12} />
                <span className="hidden xs:inline">Desktop</span>
              </button>
              <button
                type="button"
                onClick={() => setDeviceMode('mobile')}
                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-mono text-[10px] font-bold uppercase transition-colors ${
                  deviceMode === 'mobile'
                    ? 'bg-foreground text-background shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Smartphone size={12} />
                <span className="hidden xs:inline">Mobile (375px)</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-xl p-1.5 text-muted-foreground hover:bg-foreground/[0.06] hover:text-foreground transition-colors"
              aria-label="Close preview"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Scrollable Viewport area with visible styled scrollbar */}
        <div 
          className="flex-1 overflow-y-auto bg-neutral-100 dark:bg-neutral-900/60 p-4 sm:p-8 flex justify-center items-start overscroll-contain"
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(120, 120, 120, 0.4) transparent',
          }}
        >
          <div
            className={`transition-all duration-300 w-full ${
              deviceMode === 'mobile'
                ? 'max-w-[390px] border-4 border-neutral-800 dark:border-neutral-700 rounded-[38px] shadow-2xl overflow-hidden bg-white dark:bg-[#111] p-5 my-2'
                : 'max-w-xl bg-white dark:bg-[#111] border-4 border-double border-black dark:border-[#eee] p-6 sm:p-10 shadow-xl'
            }`}
          >
            {/* Mobile Notch Bar if mobile mode */}
            {deviceMode === 'mobile' && (
              <div className="flex justify-center mb-4">
                <div className="h-4 w-28 bg-neutral-800 dark:bg-neutral-700 rounded-full" />
              </div>
            )}

            {/* RSVP Modal Newspaper Header */}
            <div className="text-center mb-6 sm:mb-8 border-b border-black dark:border-[#eee] pb-5">
              <h3 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold uppercase tracking-tight text-black dark:text-[#eee] mb-1.5">
                RSVP FORM
              </h3>
              <p className="text-[10px] font-sans font-bold uppercase tracking-[0.2em] text-neutral-600 dark:text-neutral-400 line-clamp-1">
                {eventTitle || 'Untitled Event'}
              </p>
            </div>

            {isOnHold && (
              <div className="mb-6 border-2 border-black dark:border-[#eee] bg-neutral-100 dark:bg-neutral-900 p-3.5 text-center">
                <span className="font-sans text-xs font-bold uppercase tracking-[0.2em] text-black dark:text-[#eee] block">
                  REGISTRATIONS ON HOLD
                </span>
                {holdReason && (
                  <p className="text-[10px] font-sans font-bold uppercase tracking-widest text-neutral-600 dark:text-neutral-400 mt-1.5">
                    {holdReason}
                  </p>
                )}
              </div>
            )}

            {/* Interactive Preview Form */}
            <form onSubmit={(e) => e.preventDefault()} className="space-y-5 font-sans text-left">
              {/* 1. Full Name */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-black dark:text-[#eee] flex items-center justify-between">
                  <span>
                    {standardFields.nameLabel || 'FULL NAME'}
                    {standardFields.nameRequired && <span className="text-red-500 ml-0.5">*</span>}
                  </span>
                  <span className="font-mono text-[8px] text-neutral-400 uppercase">Core</span>
                </label>
                <input
                  type="text"
                  value={testName}
                  onChange={(e) => setTestName(e.target.value)}
                  placeholder={standardFields.namePlaceholder || 'E.G. JOHN DOE'}
                  className="w-full bg-transparent border-b-2 border-dashed border-black dark:border-[#eee] px-2 py-2 text-base sm:text-lg font-serif focus:outline-none focus:border-solid transition-colors placeholder:text-gray-400 dark:placeholder:text-gray-600 rounded-none text-black dark:text-[#eee]"
                />
              </div>

              {/* 2. Email Address */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-black dark:text-[#eee] flex items-center justify-between">
                  <span>
                    {standardFields.emailLabel || 'EMAIL ADDRESS'}
                    {standardFields.emailRequired && <span className="text-red-500 ml-0.5">*</span>}
                  </span>
                  <span className="font-mono text-[8px] text-neutral-400 uppercase">Core</span>
                </label>
                <input
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder={standardFields.emailPlaceholder || 'E.G. JOHN@EXAMPLE.COM'}
                  className="w-full bg-transparent border-b-2 border-dashed border-black dark:border-[#eee] px-2 py-2 text-base sm:text-lg font-serif focus:outline-none focus:border-solid transition-colors placeholder:text-gray-400 dark:placeholder:text-gray-600 rounded-none text-black dark:text-[#eee]"
                />
              </div>

              {/* 3. WhatsApp / Phone Number */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-700 dark:text-neutral-300 flex items-center justify-between">
                  <span>
                    {standardFields.phoneLabel || 'WHATSAPP / PHONE'}
                    {standardFields.phoneRequired && <span className="text-red-500 ml-0.5">*</span>}
                  </span>
                  <span className="font-mono text-[8px] text-neutral-400 uppercase">
                    {standardFields.phoneRequired ? 'Mandatory' : 'Optional'}
                  </span>
                </label>
                <input
                  type="tel"
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                  placeholder={standardFields.phonePlaceholder || '+91 98765 43210'}
                  className="w-full bg-transparent border-b-2 border-dashed border-black dark:border-[#eee] px-2 py-2 text-base sm:text-lg font-serif focus:outline-none focus:border-solid transition-colors placeholder:text-gray-400 dark:placeholder:text-gray-600 rounded-none text-black dark:text-[#eee]"
                />
              </div>

              {/* 4. Custom Questions */}
              {customFields.map((field) => {
                const current = testAnswers[field.id];
                const isChoice = field.type === 'select' || field.type === 'multiselect';

                return (
                  <div key={field.id} className="space-y-1.5 pt-2 border-t border-black/10 dark:border-white/10">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-black dark:text-[#eee] flex items-center justify-between">
                      <span>
                        {field.label || 'UNTITLED QUESTION'}
                        {field.required && <span className="text-red-500 ml-0.5">*</span>}
                      </span>
                      {field.type === 'multiselect' && (
                        <span className="font-mono text-[8px] text-neutral-500 lowercase tracking-normal">
                          (pick any)
                        </span>
                      )}
                    </label>

                    {field.type === 'textarea' ? (
                      <textarea
                        rows={3}
                        value={String(current || '')}
                        onChange={(e) => setTestAnswers((all) => ({ ...all, [field.id]: e.target.value }))}
                        placeholder="Attendee answers here…"
                        className="w-full bg-transparent border-b-2 border-dashed border-black dark:border-[#eee] px-2 py-2 text-sm sm:text-base font-serif focus:outline-none focus:border-solid transition-colors text-black dark:text-[#eee]"
                      />
                    ) : isChoice ? (
                      field.type === 'select' ? (
                        <select
                          value={String(current || '')}
                          onChange={(e) => setTestAnswers((all) => ({ ...all, [field.id]: e.target.value }))}
                          className="w-full bg-transparent border-b-2 border-dashed border-black dark:border-[#eee] px-2 py-2 text-sm sm:text-base font-serif focus:outline-none text-black dark:text-[#eee]"
                        >
                          <option value="" disabled hidden className="text-muted-foreground bg-white dark:bg-neutral-900">
                            Choose an option…
                          </option>
                          {(field.options || []).map((opt) => (
                            <option key={opt} value={opt} className="text-black bg-white dark:bg-neutral-900 dark:text-white">
                              {opt}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div className="space-y-1.5 pt-1">
                          {(field.options || []).map((opt) => (
                            <label key={opt} className="flex cursor-pointer items-center gap-2.5 py-1 text-xs sm:text-sm font-sans text-black dark:text-[#eee]">
                              <input
                                type="checkbox"
                                checked={Array.isArray(current) && current.includes(opt)}
                                onChange={(e) => toggleMulti(field.id, opt, e.target.checked)}
                                className="h-4 w-4 accent-black dark:accent-white"
                              />
                              <span className="font-serif text-sm sm:text-base">{opt}</span>
                            </label>
                          ))}
                        </div>
                      )
                    ) : field.type === 'checkbox' ? (
                      <label className="flex items-center gap-2.5 text-xs sm:text-sm text-black dark:text-[#eee] cursor-pointer pt-1">
                        <input
                          type="checkbox"
                          checked={Boolean(current)}
                          onChange={(e) => setTestAnswers((all) => ({ ...all, [field.id]: e.target.checked }))}
                          className="h-4 w-4 accent-black dark:accent-white"
                        />
                        <span className="font-serif text-sm sm:text-base">{field.label || 'Confirm yes / no'}</span>
                      </label>
                    ) : (
                      <input
                        type={field.type === 'number' ? 'number' : field.type === 'email' ? 'email' : 'text'}
                        value={String(current || '')}
                        onChange={(e) => setTestAnswers((all) => ({ ...all, [field.id]: e.target.value }))}
                        placeholder="Type answer here…"
                        className="w-full bg-transparent border-b-2 border-dashed border-black dark:border-[#eee] px-2 py-2 text-sm sm:text-base font-serif focus:outline-none focus:border-solid transition-colors text-black dark:text-[#eee]"
                      />
                    )}
                  </div>
                );
              })}

              {/* 5. Payment Details Preview */}
              {requirePayment ? (
                <div className="space-y-3 border-y border-dashed border-black dark:border-[#eee] py-4 my-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-black dark:text-[#eee]">
                      Payment &middot; {paymentAmount || '₹100'}
                    </span>
                    <span className="font-mono text-[9px] uppercase tracking-wider text-amber-600 dark:text-amber-400 font-bold">
                      QR Required
                    </span>
                  </div>

                  {paymentInstructions && (
                    <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                      {paymentInstructions}
                    </p>
                  )}

                  {paymentQrImage ? (
                    <div className="flex justify-center p-2">
                      <img
                        src={paymentQrImage}
                        alt="Payment QR"
                        className="h-36 w-36 sm:h-44 sm:w-44 object-contain border border-black p-1 dark:border-[#eee] bg-white"
                      />
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center p-4 border border-dashed border-neutral-300 dark:border-neutral-700 text-center gap-1.5">
                      <QrCode size={28} className="text-neutral-400" />
                      <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-500">
                        UPI QR Code image will display here
                      </span>
                    </div>
                  )}

                  <div className="pt-2">
                    <label className="flex items-center justify-center gap-2 border border-black px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest dark:border-[#eee] cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-black dark:text-[#eee]">
                      <span>Mockup Upload Screenshot</span>
                    </label>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between rounded-none border border-black/10 dark:border-white/10 bg-emerald-500/[0.04] p-3 text-xs">
                  <span className="font-serif font-bold text-emerald-600 dark:text-emerald-400">
                    Complimentary Admission (Free RSVP)
                  </span>
                  <span className="font-mono text-[9px] uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-bold">
                    No Entry Tariff
                  </span>
                </div>
              )}

              {/* 6. Form Footer Actions */}
              <div className="pt-6 flex flex-col sm:flex-row gap-3 justify-between items-center border-t border-black/10 dark:border-white/10">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto px-4 py-3 text-[10px] font-bold uppercase tracking-widest hover:underline underline-offset-4 text-neutral-600 dark:text-neutral-400 text-center"
                >
                  Close Preview
                </button>
                <button
                  type="button"
                  onClick={() => alert('This is a live interactive preview for creator inspection.')}
                  className="w-full sm:w-auto bg-black dark:bg-[#eee] text-white dark:text-black px-8 py-3.5 font-bold uppercase tracking-[0.2em] text-xs hover:opacity-80 transition-opacity text-center cursor-pointer shadow-md"
                >
                  CONFIRM RSVP
                </button>
              </div>
            </form>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
