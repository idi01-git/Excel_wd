// src/components/navigation/NotificationBell.tsx
'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BellIcon, ChevronDownIcon, ChevronUpIcon } from 'lucide-react';
import { formatRole } from '@/lib/rbac';
import { getOptimizedAvatarUrl } from '@/lib/image-optimization';

interface NotificationItem {
  id: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  entityType: string;
  entityId: string;
  targetUrl?: string;
  entityName?: string;
  actor?: {
    name: string;
    username: string;
    profilePhoto?: string | null;
  } | null;
  bookTitle?: string;
  message?: string | null;
}

const getNotificationText = (n: NotificationItem) => {
  const actorName = n.actor?.name || 'Someone';
  const name = n.entityName || n.bookTitle;

  switch (n.type) {
    case 'LIKE':
      return name ? `${actorName} liked "${name}"` : `${actorName} liked your publication`;
    case 'COMMENT_REPLY':
      if (n.entityType === 'PUBLICATION') {
        return name ? `${actorName} commented on "${name}"` : `${actorName} commented on your publication`;
      }
      return `${actorName} replied to your comment`;
    case 'MENTION':
      return `${actorName} mentioned you in a comment`;
    case 'SUBMISSION_APPROVED':
      return name ? `"${name}" was approved and published!` : `Your submission has been approved and published.`;
    case 'SUBMISSION_REJECTED':
      return name ? `"${name}" requires revisions` : `Your submission requires revisions.`;
    case 'NEW_FOLLOWED_POST':
      return `${actorName} published a new piece`;
    case 'EVENT_REGISTRATION_CONFIRMED':
      return n.message || (name ? `Your registration for "${name}" is confirmed!` : `Your event registration is confirmed.`);
    case 'EVENT_UPDATE':
      return n.message || (name ? `Update posted for "${name}"` : `An event update was posted.`);
    case 'EVENT_WINNER_ANNOUNCED':
      return name ? `Winners announced for "${name}"!` : `Event winners announced!`;
    case 'ISSUE_REQUEST_APPROVED':
      return n.message || `Your loan request for "${name || 'book'}" has been approved.`;
    case 'ISSUE_REQUEST_REJECTED':
      return n.message || `Your loan request for "${name || 'book'}" was rejected.`;
    case 'ACCOUNT_VERIFICATION_REQUEST':
      return n.message || `${actorName} submitted a membership verification request.`;
    case 'ACCOUNT_VERIFIED':
      return n.message || `Congratulations! Your Excelsior membership has been verified.`;
    case 'ACCOUNT_REJECTED':
      return n.message || `Your membership application was not approved.`;
    case 'ROLE_CHANGED':
      return n.message || `Your role was updated to ${formatRole(n.message || '')}.`;
    default:
      return n.message || 'New update available';
  }
};

function NotificationItemRow({
  n,
  onRead,
  onNavigate,
}: {
  n: NotificationItem;
  onRead: (id: string) => void;
  onNavigate: (url: string) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleRowClick = () => {
    if (!n.isRead) {
      onRead(n.id);
    }
    if (n.targetUrl && n.targetUrl !== '/' && n.targetUrl !== '#') {
      onNavigate(n.targetUrl);
    }
  };

  const handleToggleExpand = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsExpanded(!isExpanded);
    if (!n.isRead) {
      onRead(n.id);
    }
  };

  return (
    <div
      onClick={handleRowClick}
      className="flex flex-col gap-2 p-3 border-b border-gray-100 dark:border-neutral-800 last:border-b-0 transition hover:bg-gray-50/50 dark:hover:bg-neutral-800/30 cursor-pointer"
    >
      <div className="flex gap-2.5 items-start justify-between w-full">
        <div className="flex gap-2.5 items-start grow min-w-0">
          {n.actor?.profilePhoto ? (
            <img
              src={getOptimizedAvatarUrl(n.actor.profilePhoto, 56)}
              alt=""
              className="w-7 h-7 rounded-full object-cover border border-gray-200 dark:border-neutral-700 mt-0.5 shrink-0"
            />
          ) : (
            <div className="w-7 h-7 rounded-full bg-gray-200 dark:bg-neutral-800 flex items-center justify-center mt-0.5 shrink-0">
              <span className="text-gray-500 dark:text-neutral-400 text-[10px] font-bold">
                {n.actor?.name?.charAt(0) || 'E'}
              </span>
            </div>
          )}
          <div className="grow min-w-0">
            <p
              className={`text-[11px] leading-snug transition-colors line-clamp-2 wrap-break-word ${
                !n.isRead
                  ? 'text-gray-900 dark:text-neutral-100 font-medium'
                  : 'text-gray-400 dark:text-neutral-500'
              }`}
              title={getNotificationText(n)}
            >
              {getNotificationText(n)}
            </p>
            <span className="text-[9px] text-gray-400 dark:text-neutral-500 mt-0.5 block">
              {new Date(n.createdAt).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
        </div>

        <div className="flex items-center shrink-0 self-center ml-2">
          {n.message && (
            <button
              type="button"
              onClick={handleToggleExpand}
              className="text-gray-500 dark:text-neutral-400 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-neutral-800 transition flex items-center p-0.5 rounded"
              aria-label="Toggle note"
            >
              {isExpanded ? (
                <ChevronUpIcon size={14} strokeWidth={2.5} />
              ) : (
                <ChevronDownIcon size={14} strokeWidth={2.5} />
              )}
            </button>
          )}
        </div>
      </div>

      {n.message && isExpanded && (
        <div className="mt-1 ml-9.5 p-2.5 rounded bg-gray-50 dark:bg-neutral-800/50 border border-gray-150 dark:border-neutral-800 text-[10px] text-gray-600 dark:text-neutral-400 font-medium italic">
          <span className="font-bold text-gray-800 dark:text-neutral-200 not-italic block mb-0.5">
            Admin Note:
          </span>
          {n.message}
        </div>
      )}
    </div>
  );
}

export default function NotificationBell() {
  const { data: session } = useSession();
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const userId = session?.user?.id;

  const fetchCountAndLatest = async () => {
    if (!userId) return;
    try {
      const res = await fetch('/api/notifications');
      const data = await res.json();
      if (data.success && Array.isArray(data.notifications)) {
        setNotifications(data.notifications.slice(0, 30));
        setUnreadCount(data.notifications.filter((n: any) => !n.isRead).length);
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  };

  useEffect(() => {
    if (!userId) return;
    fetchCountAndLatest();

    const interval = setInterval(fetchCountAndLatest, 30000);
    return () => clearInterval(interval);
  }, [userId]);

  useEffect(() => {
    if (!isOpen) return;
    const handleClose = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target && !target.isConnected) {
        return;
      }
      const dropdown = document.getElementById('notification-dropdown');
      const bellButton = document.getElementById('notification-bell-button');
      if (
        (dropdown && dropdown.contains(target)) ||
        (bellButton && bellButton.contains(target))
      ) {
        return;
      }
      setIsOpen(false);
    };
    document.addEventListener('click', handleClose);
    return () => document.removeEventListener('click', handleClose);
  }, [isOpen]);

  const handleMarkAllRead = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch('/api/notifications/read', { method: 'PATCH' });
      const data = await res.json();
      if (data.success) {
        setUnreadCount(0);
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      }
    } catch (error) {
      console.error('Failed to mark notifications read:', error);
    }
  };

  const handleMarkSingleRead = async (id: string) => {
    try {
      const res = await fetch('/api/notifications/read', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (data.success) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Failed to mark single notification read:', error);
    }
  };

  const handleNavigate = (url: string) => {
    setIsOpen(false);
    router.push(url);
  };

  if (!userId) return null;

  return (
    <div className="relative">
      <button
        id="notification-bell-button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="relative p-1.5 text-gray-500 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-full transition focus:outline-none"
        aria-label="Notifications"
      >
        <BellIcon size={16} strokeWidth={2.2} />
        {unreadCount > 0 && (
          <span className="absolute top-0.5 right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-black dark:bg-white border border-white dark:border-neutral-950 text-[9px] font-bold text-white dark:text-black">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          id="notification-dropdown"
          onClick={(e) => e.stopPropagation()}
          className="absolute right-0 mt-3 w-80 bg-white/95 dark:bg-[#121212]/95 backdrop-blur-2xl border border-neutral-200/90 dark:border-neutral-800 shadow-[0_20px_45px_rgba(0,0,0,0.15)] dark:shadow-[0_20px_45px_rgba(0,0,0,0.6)] ring-1 ring-black/5 dark:ring-white/10 rounded-2xl overflow-hidden z-100 animate-in fade-in slide-in-from-top-1 duration-200"
        >
          <div className="px-4 py-2.5 bg-neutral-50 dark:bg-neutral-900/60 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-800 dark:text-neutral-200">
              Notifications
            </span>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-[10px] font-bold text-gray-600 dark:text-neutral-400 hover:text-black dark:hover:text-white underline decoration-dotted transition"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="divide-y divide-gray-100 dark:divide-neutral-800 max-h-96 overflow-y-auto">
            {notifications.length > 0 ? (
              notifications.map((n) => (
                <NotificationItemRow
                  key={n.id}
                  n={n}
                  onRead={handleMarkSingleRead}
                  onNavigate={handleNavigate}
                />
              ))
            ) : (
              <div className="py-8 text-center text-xs text-gray-400 dark:text-neutral-500 italic">
                No notifications yet.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
