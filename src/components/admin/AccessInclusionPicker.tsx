// src/components/admin/AccessInclusionPicker.tsx
'use client';

import { useState } from 'react';
import { ChevronDown, Sparkles, Users, Check } from 'lucide-react';
import { ACCESS_PRESETS, INCLUSION_PRESETS } from '@/lib/event-form';

interface AccessInclusionPickerProps {
  type: 'access' | 'inclusions';
  value: string;
  onChange: (val: string) => void;
  label?: string;
  isCompetition?: boolean;
}

export default function AccessInclusionPicker({
  type,
  value,
  onChange,
  label,
  isCompetition = false,
}: AccessInclusionPickerProps) {
  const [open, setOpen] = useState(false);
  const [customMode, setCustomMode] = useState(false);

  const presets = type === 'access' ? ACCESS_PRESETS : INCLUSION_PRESETS;
  const defaultLabel = type === 'access' ? 'Target Audience / Access' : 'Event Inclusions';
  const displayLabel = label || defaultLabel;
  const isAccess = type === 'access';

  const defaultRecommendation = isAccess
    ? 'ALL STUDENTS & MEMBERS'
    : isCompetition
      ? 'PRIZE POOL & PASS'
      : 'CERTIFICATE & KIT';

  const selectPreset = (preset: string) => {
    onChange(preset);
    setOpen(false);
    setCustomMode(false);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          {isAccess ? <Users size={12} className="text-amber-500" /> : <Sparkles size={12} className="text-amber-500" />}
          <span>{displayLabel}</span>
        </label>
        <button
          type="button"
          onClick={() => {
            setCustomMode(!customMode);
            setOpen(false);
          }}
          className="font-mono text-[10px] uppercase tracking-wider text-amber-500 hover:text-amber-400 underline underline-offset-2 transition-colors"
        >
          {customMode ? 'Pick from Presets' : 'Custom Text'}
        </button>
      </div>

      {!customMode ? (
        <div className="space-y-2.5">
          {/* Dropdown trigger */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="flex w-full items-center justify-between rounded-xl border border-border bg-foreground/[0.02] p-3 text-left text-xs text-foreground focus:border-amber-400 focus:outline-none transition-colors hover:bg-foreground/[0.04]"
              aria-expanded={open}
            >
              <span className="font-medium truncate">{value || defaultRecommendation}</span>
              <ChevronDown size={14} className={`text-muted-foreground transition-transform shrink-0 ml-2 ${open ? 'rotate-180' : ''}`} />
            </button>

            {open && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
                <div className="absolute left-0 right-0 top-full z-30 mt-1.5 max-h-56 overflow-y-auto rounded-xl border border-border bg-background shadow-2xl p-1.5 space-y-1">
                  {presets.map((preset) => {
                    const isSelected = value === preset;
                    return (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => selectPreset(preset)}
                        className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs transition-colors ${
                          isSelected
                            ? 'bg-amber-400/15 text-amber-500 dark:text-amber-400 font-bold'
                            : 'text-foreground hover:bg-foreground/[0.05]'
                        }`}
                      >
                        <span className="truncate">{preset}</span>
                        {isSelected && <Check size={13} className="shrink-0 text-amber-500 ml-2" />}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* Quick preset chips */}
          <div className="flex flex-wrap gap-1.5">
            {presets.slice(0, 4).map((preset) => {
              const isSelected = value === preset;
              return (
                <button
                  key={preset}
                  type="button"
                  onClick={() => selectPreset(preset)}
                  className={`rounded-full px-2.5 py-1 font-mono text-[9px] uppercase tracking-wider transition-all border ${
                    isSelected
                      ? 'border-amber-400 bg-amber-400/15 text-amber-600 dark:text-amber-300 font-bold'
                      : 'border-border/60 bg-foreground/[0.02] text-muted-foreground hover:border-foreground/40 hover:text-foreground'
                  }`}
                >
                  {preset}
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="space-y-1">
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={isAccess ? 'e.g. 1st & 2nd Year CSE Students Only' : 'e.g. Certificate, Refreshments & Exclusive Merchandise'}
            className="w-full rounded-xl border border-border bg-foreground/[0.02] p-3 text-xs text-foreground focus:border-amber-400 focus:outline-none"
          />
          <p className="text-[10px] text-muted-foreground">
            Type custom {isAccess ? 'eligibility restriction' : 'perks and items'} for the admission coupon.
          </p>
        </div>
      )}
    </div>
  );
}
