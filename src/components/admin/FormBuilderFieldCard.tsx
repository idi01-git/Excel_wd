// src/components/admin/FormBuilderFieldCard.tsx
'use client';

import { useState } from 'react';
import { ChevronDown, Copy, Plus, Trash2, GripVertical } from 'lucide-react';

export type FieldType = 'text' | 'textarea' | 'number' | 'email' | 'select' | 'multiselect' | 'checkbox';

export interface FormFieldDefinition {
  id: string;
  name: string;
  label: string;
  type: FieldType;
  required: boolean;
  options?: string[];
  /** For select/multiselect rendering on the public form. Defaults: select = single. */
  multiple?: boolean;
}

const TYPE_META: { value: FieldType; label: string; icon: string }[] = [
  { value: 'text', label: 'Short text', icon: '≡' },
  { value: 'textarea', label: 'Paragraph', icon: '¶' },
  { value: 'number', label: 'Number', icon: '#' },
  { value: 'email', label: 'Email', icon: '@' },
  { value: 'select', label: 'Single choice (radio)', icon: '◉' },
  { value: 'multiselect', label: 'Multiple choice', icon: '☑' },
  { value: 'checkbox', label: 'Yes / No toggle', icon: '⊘' },
];

/**
 * Google-Forms-style question card:
 * - Question prompt + type picker on one row
 * - Per-option rows for choice lists (no comma parsing — each option typed separately)
 * - Required toggle, duplicate and delete actions
 */
export default function FormBuilderFieldCard({
  field,
  index,
  onChange,
  onRemove,
  onDuplicate,
}: {
  field: FormFieldDefinition;
  index: number;
  onChange: (patch: Partial<FormFieldDefinition>) => void;
  onRemove: () => void;
  onDuplicate: () => void;
}) {
  const [typeOpen, setTypeOpen] = useState(false);
  const options = field.options ?? [];
  const typeMeta = TYPE_META.find((t) => t.value === field.type) ?? TYPE_META[0];
  const isChoice = field.type === 'select' || field.type === 'multiselect';
  const isMulti = field.type === 'multiselect';

  const setOption = (i: number, value: string) => {
    const next = [...options];
    next[i] = value;
    onChange({ options: next });
  };

  const addOption = () => onChange({ options: [...options, ''] });
  const removeOption = (i: number) => onChange({ options: options.filter((_, idx) => idx !== i) });

  const changeType = (type: FieldType) => {
    const needsOptions = type === 'select' || type === 'multiselect';
    onChange({ type, ...(needsOptions && options.length === 0 ? { options: ['', ''] } : {}) });
    setTypeOpen(false);
  };

  return (
    <div className="rounded-2xl border border-border/60 bg-card p-4 space-y-3 group/card relative">
      {/* Row 1: drag hint · question · type picker */}
      <div className="flex items-center gap-3">
        <span className="flex items-center gap-1 text-muted-foreground/40 select-none">
          <GripVertical size={14} />
          <span className="font-mono text-[10px] font-bold">{index + 1}</span>
        </span>

        <input
          type="text"
          value={field.label}
          onChange={(e) => onChange({ label: e.target.value })}
          placeholder="Untitled question"
          className="flex-1 min-w-40 border-b border-transparent bg-transparent py-1.5 text-sm font-medium text-foreground placeholder:text-muted-foreground/50 focus:border-amber-400 focus:outline-none transition-colors"
        />

        {/* Type picker */}
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => setTypeOpen((v) => !v)}
            className="flex items-center gap-1.5 rounded-full border border-border bg-foreground/[0.03] px-3 py-1.5 text-[11px] font-mono uppercase text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors"
            aria-expanded={typeOpen}
          >
            <span className="text-amber-500">{typeMeta.icon}</span>
            <span className="hidden sm:inline">{typeMeta.label}</span>
            <ChevronDown size={12} className={`transition-transform ${typeOpen ? 'rotate-180' : ''}`} />
          </button>

          {typeOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setTypeOpen(false)} />
              <div className="absolute right-0 top-full z-20 mt-1.5 w-52 overflow-hidden rounded-xl border border-border bg-background shadow-xl shadow-black/10 dark:shadow-black/50">
                {TYPE_META.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => changeType(t.value)}
                    className={`flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-xs transition-colors hover:bg-foreground/[0.05] ${
                      t.value === field.type ? 'text-foreground font-semibold' : 'text-muted-foreground'
                    }`}
                  >
                    <span className="w-4 text-center text-amber-500">{t.icon}</span>
                    {t.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Row 2: preview / options */}
      <div className="pl-8">
        {isChoice ? (
          <div className="space-y-2">
            <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground/70">
              {isMulti
                ? 'Attendee may select several options'
                : 'Attendee selects exactly one option'}
            </p>
            {options.map((opt, i) => (
              <div key={i} className="flex items-center gap-2.5">
                {isMulti ? (
                  <span className="h-4 w-4 shrink-0 rounded-[4px] border-2 border-muted-foreground/40" aria-hidden />
                ) : (
                  <span className="h-4 w-4 shrink-0 rounded-full border-2 border-muted-foreground/40" aria-hidden />
                )}
                <input
                  type="text"
                  value={opt}
                  onChange={(e) => setOption(i, e.target.value)}
                  placeholder={`Option ${i + 1}`}
                  className="flex-1 rounded-lg border border-border bg-foreground/[0.02] px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/40 focus:border-amber-400 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => removeOption(i)}
                  aria-label={`Remove option ${i + 1}`}
                  className="shrink-0 rounded-lg p-1 text-muted-foreground/50 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
            <div className="flex items-center gap-2.5">
              {isMulti ? (
                <span className="h-4 w-4 shrink-0 rounded-[4px] border-2 border-dashed border-muted-foreground/30" aria-hidden />
              ) : (
                <span className="h-4 w-4 shrink-0 rounded-full border-2 border-dashed border-muted-foreground/30" aria-hidden />
              )}
              <button
                type="button"
                onClick={addOption}
                className="rounded-lg px-1 py-1 text-[11px] font-mono uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
              >
                <Plus size={12} className="mr-1 inline" />
                Add option
              </button>
            </div>
          </div>
        ) : field.type === 'checkbox' ? (
          <label className="flex items-center gap-2.5 text-xs text-muted-foreground">
            <input type="checkbox" disabled className="rounded border-muted-foreground/40" />
            <span>Attendee sees a single Yes / No toggle</span>
          </label>
        ) : (
          <div className="max-w-sm rounded-lg border border-dashed border-muted-foreground/30 px-3 py-2 text-[11px] text-muted-foreground/70">
            {field.type === 'textarea'
              ? 'Long answer text…'
              : field.type === 'number'
                ? 'Answer must be a number'
                : field.type === 'email'
                  ? 'name@example.com'
                  : 'Short answer text…'}
          </div>
        )}
      </div>

      {/* Row 3: actions */}
      <div className="flex items-center justify-between border-t border-border/40 pt-2.5">
        <label className="flex cursor-pointer items-center gap-2 text-[11px] font-mono uppercase tracking-wider text-muted-foreground select-none">
          <input
            type="checkbox"
            checked={field.required}
            onChange={(e) => onChange({ required: e.target.checked })}
            className="rounded text-amber-500 focus:ring-amber-400"
          />
          Required
        </label>

        <div className="flex items-center gap-1 opacity-60 transition-opacity group-hover/card:opacity-100">
          <button
            type="button"
            onClick={onDuplicate}
            aria-label="Duplicate question"
            title="Duplicate"
            className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-foreground/[0.06] transition-colors"
          >
            <Copy size={14} />
          </button>
          <button
            type="button"
            onClick={onRemove}
            aria-label="Delete question"
            title="Delete"
            className="rounded-lg p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
