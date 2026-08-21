// src/components/admin/TimeWindowPicker.tsx
'use client';

import { useState, useEffect } from 'react';
import { Clock, Sparkles } from 'lucide-react';

interface TimeWindowPickerProps {
  value: string;
  onChange: (formatted: string) => void;
  className?: string;
}

/**
 * Converts 24-hour time "14:30" to 12-hour "02:30 PM"
 */
function to12Hour(time24: string): string {
  if (!time24) return '';
  const [hStr, mStr] = time24.split(':');
  let h = parseInt(hStr, 10);
  const m = mStr || '00';
  if (isNaN(h)) return '';
  const meridiem = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${String(h).padStart(2, '0')}:${m} ${meridiem}`;
}

/**
 * Converts 12-hour time "02:30 PM" to 24-hour "14:30"
 */
function to24Hour(time12: string): string {
  if (!time12) return '';
  const match = time12.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (!match) return '';
  let h = parseInt(match[1], 10);
  const m = match[2];
  const meridiem = match[3]?.toUpperCase();
  if (meridiem === 'PM' && h < 12) h += 12;
  if (meridiem === 'AM' && h === 12) h = 0;
  return `${String(h).padStart(2, '0')}:${m}`;
}

export default function TimeWindowPicker({ value, onChange, className }: TimeWindowPickerProps) {
  // Parse incoming value like "10:00 AM – 01:00 PM"
  const parseTimes = (str: string) => {
    if (!str) return { start: '', end: '' };
    const parts = str.split(/–|-/).map((s) => s.trim());
    if (parts.length === 2) {
      return { start: to24Hour(parts[0]), end: to24Hour(parts[1]) };
    }
    return { start: to24Hour(str), end: '' };
  };

  const initial = parseTimes(value);
  const [startTime, setStartTime] = useState(initial.start);
  const [endTime, setEndTime] = useState(initial.end);

  useEffect(() => {
    const p = parseTimes(value);
    setStartTime(p.start);
    setEndTime(p.end);
  }, [value]);

  const updateTimes = (newStart: string, newEnd: string) => {
    setStartTime(newStart);
    setEndTime(newEnd);
    if (!newStart && !newEnd) {
      onChange('');
      return;
    }
    const start12 = to12Hour(newStart);
    const end12 = to12Hour(newEnd);
    if (start12 && end12) {
      onChange(`${start12} – ${end12}`);
    } else {
      onChange(start12 || end12);
    }
  };

  const setPreset = (start24: string, end24: string) => {
    updateTimes(start24, end24);
  };

  return (
    <div className={`space-y-2 ${className || ''}`}>
      {/* Time inputs row — perfectly matches single input height */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <input
            type="time"
            value={startTime}
            onChange={(e) => updateTimes(e.target.value, endTime)}
            placeholder="Start"
            aria-label="Start Time"
            className="w-full rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0e0e0e] px-3 py-2 text-xs font-mono text-neutral-900 dark:text-white focus:outline-none focus:border-neutral-400 dark:focus:border-neutral-600 transition-colors shadow-2xs"
          />
        </div>

        <span className="text-xs font-mono text-neutral-400 font-medium select-none shrink-0">
          to
        </span>

        <div className="relative flex-1">
          <input
            type="time"
            value={endTime}
            onChange={(e) => updateTimes(startTime, e.target.value)}
            placeholder="End"
            aria-label="End Time"
            className="w-full rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0e0e0e] px-3 py-2 text-xs font-mono text-neutral-900 dark:text-white focus:outline-none focus:border-neutral-400 dark:focus:border-neutral-600 transition-colors shadow-2xs"
          />
        </div>
      </div>

      {/* Quick Presets — Compact inline pills */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <button
          type="button"
          onClick={() => setPreset('10:00', '13:00')}
          className={`px-2.5 py-1 rounded-lg text-[10px] font-mono transition-all cursor-pointer ${
            startTime === '10:00' && endTime === '13:00'
              ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 font-bold shadow-xs'
              : 'border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0e0e0e] hover:bg-neutral-100 dark:hover:bg-neutral-850 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
          }`}
        >
          Morning (10 AM – 1 PM)
        </button>

        <button
          type="button"
          onClick={() => setPreset('14:00', '17:00')}
          className={`px-2.5 py-1 rounded-lg text-[10px] font-mono transition-all cursor-pointer ${
            startTime === '14:00' && endTime === '17:00'
              ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 font-bold shadow-xs'
              : 'border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0e0e0e] hover:bg-neutral-100 dark:hover:bg-neutral-850 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
          }`}
        >
          Afternoon (2 PM – 5 PM)
        </button>

        <button
          type="button"
          onClick={() => setPreset('17:30', '20:30')}
          className={`px-2.5 py-1 rounded-lg text-[10px] font-mono transition-all cursor-pointer ${
            startTime === '17:30' && endTime === '20:30'
              ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 font-bold shadow-xs'
              : 'border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0e0e0e] hover:bg-neutral-100 dark:hover:bg-neutral-850 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
          }`}
        >
          Evening (5:30 PM – 8:30 PM)
        </button>
      </div>
    </div>
  );
}
