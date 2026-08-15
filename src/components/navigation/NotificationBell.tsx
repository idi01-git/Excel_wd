// src/components/navigation/NotificationBell.tsx
'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { BellIcon, ChevronDownIcon, ChevronUpIcon } from 'lucide-react';

interface NotificationItem {
  id: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  entityType: string;
  entityId: string;
  targetUrl?: string;
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
  switch (n.type) {
    case 'LIKE':
      return `${actorName} liked your publication`;
    case 'COMMENT_REPLY':
      return n.entityType === 'PUBLICATION' 
        ? `${actorName} commented on your publication`
        : `${actorName} replied to your comment`;
    case 'MENTION':
      return `${actorName} mentioned you in a comment`;
    case 'SUBMISSION_APPROVED':
      return `Your submission has been approved and published.`;
    case 'SUBMISSION_REJECTED':
      return `Your submission requires revisions.`;
    case 'NEW_FOLLOWED_POST':
      return `${actorName} published a new piece`;
    case 'ISSUE_REQUEST_APPROVED':
      return `Your loan request for "${n.bookTitle || 'a book'}" has been approved.`;
    case 'ISSUE_REQUEST_REJECTED':
      return `Your loan request for "${n.bookTitle || 'a book'}" was rejected.`;
    default:
      return 'New update available';
  }
};

function NotificationItemRow({ n, onRead }: { n: NotificationItem; onRead: (id: string) => void }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleRowClick = () => {
    if (!n.isRead) {
      onRead(n.id);
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
    <div className="flex flex-col gap-2 p-3 border-b border-gray-100 dark:border-neutral-800 last:border-b-0 transition hover:bg-gray-50/50 dark:hover:bg-neutral-800/30">
      <div
        onClick={handleRowClick}
        className="flex gap-2.5 items-start justify-between w-full cursor-pointer"
      >
        <div className="flex gap-2.5 items-start grow min-w-0">
          {n.actor?.profilePhoto ? (
            <img
              src={n.actor.profilePhoto}
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
            <p className={`text-[11px] leading-snug transition-colors ${!n.isRead ? 'text-gray-900 dark:text-neutral-100 font-medium' : 'text-gray-400 dark:text-neutral-500'}`}>
              {getNotificationText(n)}
            </p>
            <span className="text-[9px] text-gray-400 dark:text-neutral-500 mt-0.5 block">
              {new Date(n.createdAt).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
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
              {isExpanded ? <ChevronUpIcon size={14} strokeWidth={2.5} /> : <ChevronDownIcon size={14} strokeWidth={2.5} />}
            </button>
          )}
        </div>
      </div>

      {n.message && isExpanded && (
        <div className="mt-1 ml-[38px] p-2.5 rounded bg-gray-50 dark:bg-neutral-800/50 border border-gray-150 dark:border-neutral-800 text-[10px] text-gray-600 dark:text-neutral-400 font-medium italic">
          <span className="font-bold text-gray-800 dark:text-neutral-200 not-italic block mb-0.5">Admin Note:</span>
          {n.message}
        </div>
      )}
    </div>
  );
}

export default function NotificationBell() {
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const currentUser = session?.user;

  const fetchCountAndLatest = async () => {
    if (!currentUser) return;
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
    if (!currentUser) return;
    fetchCountAndLatest();

    const interval = setInterval(fetchCountAndLatest, 30000);
    return () => clearInterval(interval);
  }, [currentUser]);

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
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
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
        body: JSON.stringify({ id })
      });
      const data = await res.json();
      if (data.success) {
        setNotifications(prev =>
          prev.map(n => (n.id === id ? { ...n, isRead: true } : n))
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Failed to mark single notification read:', error);
    }
  };

  if (!currentUser) return null;

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
          className="absolute right-0 mt-3 w-80 bg-white dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 shadow-2xl rounded-xl overflow-hidden z-200 animate-in fade-in slide-in-from-top-1 duration-200"
        >
          <div className="px-4 py-2.5 bg-gray-50 dark:bg-neutral-900/50 border-b border-gray-100 dark:border-neutral-800 flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-800 dark:text-neutral-200">Notifications</span>
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
                <NotificationItemRow key={n.id} n={n} onRead={handleMarkSingleRead} />
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
