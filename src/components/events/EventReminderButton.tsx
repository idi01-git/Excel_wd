// src/components/events/EventReminderButton.tsx
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, Calendar, Check, Download, ExternalLink, X } from 'lucide-react';

interface EventReminderButtonProps {
  event: {
    id: string;
    title: string;
    description?: string | null;
    date: string | Date;
    time?: string | null;
    venue: string;
    slug: string;
  };
}

/**
 * Parses event date string and time string (e.g. "10:00 AM – 01:00 PM" or "14:00")
 * into a valid Date object for start time and 3 hours prior reminder.
 */
function parseEventStart(dateInput: string | Date, timeStr?: string | null): { start: Date; reminderStart: Date; end: Date } {
  const baseDate = new Date(dateInput);
  let startHour = 10;
  let startMin = 0;
  let durationHours = 3;

  if (timeStr) {
    const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)?/i);
    if (match) {
      let h = parseInt(match[1], 10);
      const m = parseInt(match[2], 10);
      const meridiem = match[3]?.toUpperCase();

      if (meridiem === 'PM' && h < 12) h += 12;
      if (meridiem === 'AM' && h === 12) h = 0;

      startHour = h;
      startMin = m;
    }
  }

  const start = new Date(baseDate);
  start.setHours(startHour, startMin, 0, 0);

  // 3 hours prior reminder time
  const reminderStart = new Date(start.getTime() - 3 * 60 * 60 * 1000);

  // Default 3 hours duration
  const end = new Date(start.getTime() + durationHours * 60 * 60 * 1000);

  return { start, reminderStart, end };
}

function formatGoogleDate(d: Date): string {
  return d.toISOString().replace(/-|:|\.\d+/g, '');
}

export default function EventReminderButton({ event }: EventReminderButtonProps) {
  const [copied, setCopied] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const { start, reminderStart, end } = parseEventStart(event.date, event.time);
  const pageUrl = typeof window !== 'undefined' ? window.location.href : `https://excelsior.in/events/${event.slug}`;

  // Google Calendar URL with 3-hour prior reminder notification
  const googleCalUrl = (() => {
    const title = encodeURIComponent(`[Reminder] ${event.title}`);
    const details = encodeURIComponent(
      `Excelsior Event: ${event.title}\n\n📍 Venue: ${event.venue}\n⏰ Scheduled Time: ${event.time || 'Check website'}\n🔗 Link: ${pageUrl}\n\n(Reminder alert scheduled 3 hours before start time)`
    );
    const location = encodeURIComponent(event.venue || 'Excelsior');
    const dates = `${formatGoogleDate(reminderStart)}/${formatGoogleDate(end)}`;
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&location=${location}&dates=${dates}`;
  })();

  // Download .ics Calendar File (with 3-hour VALARM popup alarm)
  const downloadIcs = () => {
    const dtStart = formatGoogleDate(start);
    const dtEnd = formatGoogleDate(end);
    const now = formatGoogleDate(new Date());

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Excelsior Society//Event Reminder//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:${event.id}-${Date.now()}@excelsior.in`,
      `DTSTAMP:${now}`,
      `DTSTART:${dtStart}`,
      `DTEND:${dtEnd}`,
      `SUMMARY:${event.title.replace(/,/g, '\\,')}`,
      `DESCRIPTION:${(event.description || '').replace(/\n/g, '\\n').replace(/,/g, '\\,')}\\n\\nLink: ${pageUrl}`,
      `LOCATION:${(event.venue || '').replace(/,/g, '\\,')}`,
      'STATUS:CONFIRMED',
      'BEGIN:VALARM',
      'TRIGGER:-PT3H',
      'ACTION:DISPLAY',
      `DESCRIPTION:Reminder: ${event.title} starts in 3 hours at ${event.venue}!`,
      'END:VALARM',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${event.slug || 'event'}-reminder.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
    setMenuOpen(false);
  };

  return (
    <div className="relative inline-block w-full">
      <button
        type="button"
        onClick={() => setMenuOpen(!menuOpen)}
        className="group w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-black/20 dark:border-white/20 bg-foreground/[0.03] hover:bg-foreground/[0.08] text-xs font-mono font-bold uppercase tracking-wider text-foreground transition-all cursor-pointer shadow-xs hover:border-black/40 dark:hover:border-white/40 active:scale-[0.99]"
      >
        <Bell size={14} className="text-amber-500 transition-transform group-hover:rotate-12" />
        <span>Add 3-Hour Reminder</span>
      </button>

      <AnimatePresence>
        {menuOpen && (
          <>
            {/* Backdrop */}
            <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />

            {/* Dropdown Menu */}
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.96 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="absolute right-0 bottom-full mb-2 w-full sm:w-80 rounded-2xl border border-black/15 dark:border-white/15 bg-white dark:bg-[#181818] p-4 shadow-2xl z-50 space-y-3 text-left max-w-[calc(100vw-2rem)]"
            >
              <div className="flex items-center justify-between border-b border-black/10 dark:border-white/10 pb-2.5">
                <div>
                  <span className="block font-serif text-sm font-bold text-foreground">
                    Set Event Reminder
                  </span>
                  <span className="block text-[10px] font-mono text-muted-foreground uppercase tracking-wider mt-0.5">
                    3 Hours Before Start Time
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setMenuOpen(false)}
                  className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-foreground/[0.05]"
                >
                  <X size={14} />
                </button>
              </div>

              <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed font-sans">
                Get an automatic alert on your phone/calendar 3 hours before the event begins on the scheduled date.
              </p>

              <div className="space-y-2 pt-1 font-sans">
                <a
                  href={googleCalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center justify-between w-full p-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-foreground/[0.02] hover:bg-foreground/[0.06] text-xs font-semibold text-foreground transition-all group"
                >
                  <div className="flex items-center gap-2.5">
                    <Calendar size={15} className="text-blue-500" />
                    <span>Add to Google Calendar</span>
                  </div>
                  <ExternalLink size={12} className="text-muted-foreground group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </a>

                <button
                  type="button"
                  onClick={downloadIcs}
                  className="flex items-center justify-between w-full p-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-foreground/[0.02] hover:bg-foreground/[0.06] text-xs font-semibold text-foreground transition-all text-left group cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <Download size={15} className="text-amber-500" />
                    <span>Download Apple / Outlook (.ics)</span>
                  </div>
                  {copied ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold uppercase">
                      <Check size={12} /> Added
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
                      3h Alarm
                    </span>
                  )}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
