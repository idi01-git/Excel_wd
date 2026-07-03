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
        return `🎉 Your publication has been approved by the editorial team and is now live!`;
      case 'SUBMISSION_REJECTED':
        return `️ Your submission requires revisions. Click to review feedback notes.`;
      case 'NEW_FOLLOWED_POST':
        return `${actorName} published a new piece`;
      default:
        return 'New update available';
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="max-w-3xl mx-auto py-12 animate-pulse">
        <div className="h-8 bg-slate-900/60 rounded w-1/4 mb-10"></div>
        <div className="space-y-4">
          {[1, 2, 3].map(n => (
            <div key={n} className="h-16 bg-slate-900/60 rounded-xl" />
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
    <div className="max-w-3xl mx-auto py-4">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-white/5 pb-5 mb-8">
        <div>
          <h1 className="font-serif text-3xl text-white font-bold mb-1">Notifications</h1>
          <p className="text-gray-400 text-sm">Keep up with comments, mentions, likes, and followers.</p>
        </div>
        {notifications.some(n => !n.isRead) && (
          <button
            onClick={handleMarkAllRead}
            className="py-2 px-4 bg-white/5 border border-white/10 text-white hover:bg-violet-600 hover:border-violet-500 rounded-full text-xs font-semibold transition"
          >
            Mark all read
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-white/5 pb-3 mb-6">
        <button
          onClick={() => setFilter('all')}
          className={`py-1.5 px-4 text-xs uppercase tracking-wider font-semibold border-b-2 transition ${
            filter === 'all'
              ? 'text-white border-violet-500'
              : 'text-gray-500 border-transparent hover:text-gray-300'
          }`}
        >
          All Updates
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`py-1.5 px-4 text-xs uppercase tracking-wider font-semibold border-b-2 transition ${
            filter === 'unread'
              ? 'text-white border-violet-500'
              : 'text-gray-500 border-transparent hover:text-gray-300'
          }`}
        >
          Unread ({notifications.filter(n => !n.isRead).length})
        </button>
      </div>

      {/* Feed List */}
      <div className="space-y-3">
        {filteredList.length > 0 ? (
          filteredList.map((n) => (
            <Link
              key={n.id}
              href={n.targetUrl}
              className={`block bg-slate-900/30 border hover:border-white/10 transition duration-300 rounded-xl p-4 flex gap-4 items-center shadow ${
                !n.isRead ? 'border-violet-500/20 bg-violet-600/2' : 'border-white/5'
              }`}
            >
              {n.actor?.profilePhoto && (
                <img
                  src={n.actor.profilePhoto}
                  alt=""
                  className="w-10 h-10 rounded-full object-cover border border-white/10"
                />
              )}
              <div className="flex-grow">
                <p className="text-sm text-gray-200 leading-snug">{getNotificationText(n)}</p>
                <span className="text-[11px] text-gray-500 mt-1 block">
                  {new Date(n.createdAt).toLocaleDateString(undefined, {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
              {!n.isRead && (
                <span className="h-2 w-2 bg-violet-500 rounded-full flex-shrink-0"></span>
              )}
            </Link>
          ))
        ) : (
          <div className="p-12 text-center text-gray-500 italic bg-slate-900/10 border border-white/5 rounded-xl">
            {filter === 'unread' ? 'No unread updates.' : 'No notifications yet.'}
          </div>
        )}
      </div>
    </div>
  );
}
