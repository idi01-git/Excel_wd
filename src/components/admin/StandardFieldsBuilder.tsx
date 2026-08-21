// src/components/admin/StandardFieldsBuilder.tsx
'use client';

import { useState } from 'react';
import { User, Mail, Phone, Lock, ChevronDown, Sparkles, RotateCcw } from 'lucide-react';
import { type StandardFieldConfig, DEFAULT_STANDARD_FIELDS } from '@/lib/event-form';

interface StandardFieldsBuilderProps {
  config: StandardFieldConfig;
  onChange: (patch: Partial<StandardFieldConfig>) => void;
}

export default function StandardFieldsBuilder({
  config,
  onChange,
}: StandardFieldsBuilderProps) {
  const [expanded, setExpanded] = useState(false);

  const resetDefaults = () => {
    onChange(DEFAULT_STANDARD_FIELDS);
  };

  return (
    <div className="rounded-2xl border border-border/80 bg-foreground/[0.015] p-4 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/40 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-400/10 text-amber-500">
            <Sparkles size={15} />
          </div>
          <div>
            <h4 className="font-serif text-sm font-bold text-foreground">
              Core Mandatory Contact Fields
            </h4>
            <p className="text-[11px] text-muted-foreground">
              Pre-configured by default for all RSVP submissions.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1.5 rounded-xl border border-border bg-foreground/[0.03] px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground hover:bg-foreground/[0.06] transition-colors"
          >
            <span>{expanded ? 'Collapse Standard Fields' : 'Customize Standard Fields'}</span>
            <ChevronDown size={12} className={`transition-transform ${expanded ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {/* Summary Chips (Visible when collapsed) */}
      {!expanded ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {/* Name Field */}
          <div className="flex items-center justify-between rounded-xl border border-border/60 bg-background/50 p-2.5">
            <div className="flex items-center gap-2 min-w-0">
              <User size={13} className="text-amber-500 shrink-0" />
              <span className="text-xs font-medium text-foreground truncate">{config.nameLabel || 'Full Name'}</span>
            </div>
            <span className="inline-flex items-center gap-1 rounded-md bg-foreground/[0.06] px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
              <Lock size={9} /> Req
            </span>
          </div>

          {/* Email Field */}
          <div className="flex items-center justify-between rounded-xl border border-border/60 bg-background/50 p-2.5">
            <div className="flex items-center gap-2 min-w-0">
              <Mail size={13} className="text-amber-500 shrink-0" />
              <span className="text-xs font-medium text-foreground truncate">{config.emailLabel || 'Email Address'}</span>
            </div>
            <span className="inline-flex items-center gap-1 rounded-md bg-foreground/[0.06] px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
              <Lock size={9} /> Req
            </span>
          </div>

          {/* Phone Field */}
          <div className="flex items-center justify-between rounded-xl border border-border/60 bg-background/50 p-2.5">
            <div className="flex items-center gap-2 min-w-0">
              <Phone size={13} className="text-amber-500 shrink-0" />
              <span className="text-xs font-medium text-foreground truncate">{config.phoneLabel || 'WhatsApp / Phone'}</span>
            </div>
            <span className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider ${
              config.phoneRequired ? 'bg-amber-400/15 text-amber-600 dark:text-amber-300' : 'bg-foreground/[0.06] text-muted-foreground'
            }`}>
              {config.phoneRequired ? 'Req' : 'Opt'}
            </span>
          </div>
        </div>
      ) : (
        /* Detailed Configuration Inputs */
        <div className="space-y-4 pt-1">
          {/* 1. Full Name */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center rounded-xl border border-border/60 bg-background/60 p-3">
            <div className="md:col-span-4 flex items-center gap-2">
              <User size={14} className="text-amber-500" />
              <div>
                <strong className="block text-xs font-serif text-foreground">Name Prompt</strong>
                <span className="text-[10px] text-muted-foreground font-mono">Mandatory attendee identity</span>
              </div>
            </div>
            <div className="md:col-span-6">
              <input
                type="text"
                value={config.nameLabel}
                onChange={(e) => onChange({ nameLabel: e.target.value })}
                placeholder="Full Name"
                className="w-full rounded-lg border border-border bg-foreground/[0.02] px-3 py-1.5 text-xs text-foreground focus:border-amber-400 focus:outline-none"
              />
            </div>
            <div className="md:col-span-2 text-right">
              <span className="inline-flex items-center gap-1 rounded-md bg-foreground/[0.06] px-2 py-1 font-mono text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                <Lock size={10} /> Locked Req
              </span>
            </div>
          </div>

          {/* 2. Email Address */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center rounded-xl border border-border/60 bg-background/60 p-3">
            <div className="md:col-span-4 flex items-center gap-2">
              <Mail size={14} className="text-amber-500" />
              <div>
                <strong className="block text-xs font-serif text-foreground">Email Prompt</strong>
                <span className="text-[10px] text-muted-foreground font-mono">Ticket & confirmation dispatch</span>
              </div>
            </div>
            <div className="md:col-span-6">
              <input
                type="text"
                value={config.emailLabel}
                onChange={(e) => onChange({ emailLabel: e.target.value })}
                placeholder="Email Address"
                className="w-full rounded-lg border border-border bg-foreground/[0.02] px-3 py-1.5 text-xs text-foreground focus:border-amber-400 focus:outline-none"
              />
            </div>
            <div className="md:col-span-2 text-right">
              <span className="inline-flex items-center gap-1 rounded-md bg-foreground/[0.06] px-2 py-1 font-mono text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                <Lock size={10} /> Locked Req
              </span>
            </div>
          </div>

          {/* 3. WhatsApp / Phone Number */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center rounded-xl border border-border/60 bg-background/60 p-3">
            <div className="md:col-span-4 flex items-center gap-2">
              <Phone size={14} className="text-amber-500" />
              <div>
                <strong className="block text-xs font-serif text-foreground">Phone / WhatsApp Prompt</strong>
                <span className="text-[10px] text-muted-foreground font-mono">Coordinator SMS/chat outreach</span>
              </div>
            </div>
            <div className="md:col-span-5">
              <input
                type="text"
                value={config.phoneLabel}
                onChange={(e) => onChange({ phoneLabel: e.target.value })}
                placeholder="WhatsApp / Phone Number"
                className="w-full rounded-lg border border-border bg-foreground/[0.02] px-3 py-1.5 text-xs text-foreground focus:border-amber-400 focus:outline-none"
              />
            </div>
            <div className="md:col-span-3 flex items-center justify-end gap-2">
              <label className="flex items-center gap-2 cursor-pointer font-mono text-[10px] uppercase font-bold text-foreground select-none">
                <input
                  type="checkbox"
                  checked={config.phoneRequired}
                  onChange={(e) => onChange({ phoneRequired: e.target.checked })}
                  className="rounded border-border text-amber-500 focus:ring-amber-400"
                />
                <span>Required</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="button"
              onClick={resetDefaults}
              className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
            >
              <RotateCcw size={11} />
              <span>Reset Standard Field Defaults</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
