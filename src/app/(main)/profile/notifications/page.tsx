// src/app/(main)/profile/notifications/page.tsx
'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';

interface NotificationItem {
  id: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  entityType: string;
  entityId: string;
  targetUrl: string;
  actor?: {
    name: string;
    username: string;
    profilePhoto?: string | null;
  } | null;
  bookTitle?: string;
  message?: string | null;
}

export default function NotificationsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications');
      const data = await res.json();
      if (data.success) {
        setNotifications(data.notifications);
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    if (status === 'authenticated') {
      fetchNotifications();
    }
  }, [status]);

  const handleMarkAllRead = async () => {
    try {
      const res = await fetch('/api/notifications/read', { method: 'PATCH' });
      const data = await res.json();
      if (data.success) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      }
    } catch (error) {
      console.error('Failed to mark read:', error);
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
        return `Your publication has been approved by the editorial team and is now live.`;
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

  if (status === 'loading' || loading) {
    return (
      <div className="max-w-4xl mx-auto py-8 animate-pulse">
        <div className="h-12 bg-gray-200 dark:bg-neutral-800 rounded w-1/3 mb-4"></div>
        <div className="h-4 bg-gray-100 dark:bg-neutral-900 rounded w-1/4 mb-12"></div>
        <div className="space-y-6">
          {[1, 2, 3].map(n => (
            <div key={n} className="h-20 bg-gray-50 dark:bg-neutral-800/50 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  const filteredList = notifications.filter(n => {
    if (filter === 'unread') return !n.isRead;
    return true;
  });

  return (
    <div className="max-w-4xl mx-auto py-8">
      {/* Editorial Header */}
      <div className="flex flex-col md:flex-row gap-6 items-start md:items-end justify-between mb-8 border-b border-gray-200/80 dark:border-neutral-800 pb-8">
        <div className="flex-grow max-w-2xl">
          <h1 className="font-serif text-4xl md:text-5xl text-black dark:text-white font-bold leading-tight">Notifications</h1>
          <p className="text-gray-500 dark:text-neutral-500 text-sm font-medium mt-3">Keep up with comments, mentions, likes, and platform updates.</p>
        </div>
        {notifications.some(n => !n.isRead) && (
          <button
            onClick={handleMarkAllRead}
            className="flex-shrink-0 text-[10px] font-bold uppercase tracking-wider text-black dark:text-white border border-gray-200 dark:border-neutral-700 py-2 px-4 rounded hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors"
          >
            Mark all read
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-8 border-b border-gray-200 dark:border-neutral-800 mb-8">
        <button
          onClick={() => setFilter('all')}
          className={`pb-3 text-xs uppercase tracking-widest font-bold border-b-2 -mb-[1.5px] transition-colors ${
            filter === 'all'
              ? 'text-black dark:text-white border-black dark:border-white'
              : 'text-gray-400 dark:text-neutral-500 border-transparent hover:text-gray-800 dark:hover:text-neutral-300'
          }`}
        >
          All Updates
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`pb-3 text-xs uppercase tracking-widest font-bold border-b-2 -mb-[1.5px] transition-colors ${
            filter === 'unread'
              ? 'text-black dark:text-white border-black dark:border-white'
              : 'text-gray-400 dark:text-neutral-500 border-transparent hover:text-gray-800 dark:hover:text-neutral-300'
          }`}
        >
          Unread ({notifications.filter(n => !n.isRead).length})
        </button>
      </div>

      {/* Feed List */}
      <div>
        {filteredList.length > 0 ? (
          <ul className="divide-y divide-gray-100 dark:divide-neutral-800 border-y border-gray-100 dark:border-neutral-800">
            {filteredList.map((n) => (
              <li key={n.id}>
                <Link
                  href={n.targetUrl}
                  className={`flex items-start gap-4 py-5 px-2 transition-colors group ${
                    !n.isRead ? 'bg-gray-50 dark:bg-neutral-900/50' : 'hover:bg-gray-50/50 dark:hover:bg-neutral-800/30'
                  }`}
                >
                  {n.actor?.profilePhoto ? (
                    <img
                      src={n.actor.profilePhoto}
                      alt=""
                      className="w-10 h-10 rounded-full object-cover border border-gray-200 dark:border-neutral-700 mt-0.5"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-neutral-800 flex items-center justify-center mt-0.5">
                      <span className="text-gray-500 dark:text-neutral-400 text-sm font-bold">
                        {n.actor?.name?.charAt(0) || 'E'}
                      </span>
                    </div>
                  )}
                  
                  <div className="grow pr-4">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 group-hover:text-black dark:group-hover:text-white transition-colors">
                      {getNotificationText(n)}
                    </p>
                    {n.message && (
                      <div className="mt-2.5 p-3 rounded-lg bg-gray-100 dark:bg-neutral-800 border border-gray-200/50 dark:border-neutral-700/50 text-xs text-gray-700 dark:text-neutral-300 font-medium">
                        <span className="font-bold text-gray-900 dark:text-neutral-200 block mb-1">Editor&apos;s Note:</span>
                        {n.message}
                      </div>
                    )}
                    <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-neutral-500 mt-2.5 block">
                      {new Date(n.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  
                  {!n.isRead && (
                    <span className="h-2 w-2 bg-violet-600 dark:bg-cyan-500 rounded-full shrink-0 mt-2"></span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="py-16 text-center text-gray-500 dark:text-neutral-500 italic">
            {filter === 'unread' ? 'No unread updates.' : 'No notifications yet.'}
          </div>
        )}
      </div>
    </div>
  );
}
