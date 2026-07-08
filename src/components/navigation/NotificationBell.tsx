// src/components/navigation/NotificationBell.tsx
'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { BellIcon, Loader2Icon } from 'lucide-react';

interface NotificationItem {
  id: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  entityType: string;
  entityId: string;
  actor?: {
    name: string;
    username: string;
    profilePhoto?: string | null;
  } | null;
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
        setNotifications(data.notifications.slice(0, 5));
        setUnreadCount(data.notifications.filter((n: any) => !n.isRead).length);
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  };

  // Poll notifications every 30 seconds
  useEffect(() => {
    if (!currentUser) return;
    fetchCountAndLatest();

    const interval = setInterval(fetchCountAndLatest, 30000);
    return () => clearInterval(interval);
  }, [currentUser]);

  // Click outside to close
  useEffect(() => {
    if (!isOpen) return;
    const handleClose = () => setIsOpen(false);
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
        return `🎉 Your submission has been approved and published!`;
      case 'SUBMISSION_REJECTED':
        return `️ Your submission requires revisions. Click to check notes.`;
      case 'NEW_FOLLOWED_POST':
        return `${actorName} published a new piece`;
      default:
        return 'New update available';
    }
  };

  if (!currentUser) return null;

  return (
    <div className="relative">
      {/* Bell Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="relative p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-full transition focus:outline-none"
        aria-label="Notifications"
      >
        <BellIcon size={16} strokeWidth={2.2} />
        {unreadCount > 0 && (
          <span className="absolute top-0.5 right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-violet-600 border border-white text-[9px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute right-0 mt-3 w-80 bg-white border border-gray-200 shadow-2xl rounded-xl overflow-hidden z-200 animate-in fade-in slide-in-from-top-1 duration-200"
        >
          {/* Header */}
          <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-800">Notifications</span>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-[10px] font-bold text-violet-600 hover:text-violet-700 transition"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* List items */}
          <div className="divide-y divide-gray-100 max-h-72 overflow-y-auto">
            {notifications.length > 0 ? (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`p-3.5 flex gap-2.5 text-xs transition hover:bg-gray-50/50 ${
                    !n.isRead ? 'bg-violet-500/5' : ''
                  }`}
                >
                  {n.actor?.profilePhoto && (
                    <img
                      src={n.actor.profilePhoto}
                      alt=""
                      className="w-7 h-7 rounded-full object-cover border border-gray-200"
                    />
                  )}
                  <div className="grow">
                    <p className="text-gray-700 leading-snug">{getNotificationText(n)}</p>
                    <span className="text-[10px] text-gray-400 mt-1 block">
                      {new Date(n.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  {!n.isRead && (
                    <span className="h-1.5 w-1.5 bg-violet-600 rounded-full self-center shrink-0"></span>
                  )}
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-gray-400 italic">
                No notifications yet.
              </div>
            )}
          </div>

          {/* Footer view all */}
          <Link
            href="/profile/notifications"
            onClick={() => setIsOpen(false)}
            className="block py-2.5 text-center text-[11px] font-semibold bg-gray-50 text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition border-t border-gray-100"
          >
            View All Notifications
          </Link>
        </div>
      )}
    </div>
  );
}
