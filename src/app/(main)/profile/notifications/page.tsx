// src/app/(main)/profile/notifications/page.tsx
'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { RevealButton } from '@/components/ui/RevealButton';

interface NotificationItem {
  id: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  entityType: string;
  entityId: string;
  targetUrl: string;
  entityName?: string;
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
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const fetchNotifications = useCallback(
    async (pageNum: number, activeFilter: 'all' | 'unread', isLoadMore = false) => {
      if (isLoadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      try {
        const queryParams = new URLSearchParams({
          page: String(pageNum),
          limit: '10',
          ...(activeFilter === 'unread' ? { unreadOnly: 'true' } : {}),
        });

        const res = await fetch(`/api/notifications?${queryParams.toString()}`);
        const data = await res.json();
        if (data.success && Array.isArray(data.notifications)) {
          if (isLoadMore) {
            setNotifications((prev) => [...prev, ...data.notifications]);
          } else {
            setNotifications(data.notifications);
          }
          setHasMore(Boolean(data.hasMore));
        }
      } catch (error) {
        console.error('Failed to load notifications:', error);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    []
  );

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    if (status === 'authenticated') {
      setPage(1);
      fetchNotifications(1, filter, false);
    }
  }, [status, filter, fetchNotifications, router]);

  const handleLoadMore = () => {
    if (loadingMore || !hasMore) return;
    const nextPage = page + 1;
    setPage(nextPage);
    fetchNotifications(nextPage, filter, true);
  };

  const handleFilterChange = (newFilter: 'all' | 'unread') => {
    if (newFilter === filter) return;
    setFilter(newFilter);
    setPage(1);
    fetchNotifications(1, newFilter, false);
  };

  const handleMarkAllRead = async () => {
    try {
      const res = await fetch('/api/notifications/read', { method: 'PATCH' });
      const data = await res.json();
      if (data.success) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      }
    } catch (error) {
      console.error('Failed to mark read:', error);
    }
  };

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
        return name ? `"${name}" was approved and published!` : `Your publication has been approved and published.`;
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
        return n.message || `Your role was updated.`;
      default:
        return n.message || 'New update available';
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="max-w-4xl mx-auto py-8 animate-pulse">
        <div className="h-12 bg-gray-200 dark:bg-neutral-800 rounded w-1/3 mb-4"></div>
        <div className="h-4 bg-gray-100 dark:bg-neutral-900 rounded w-1/4 mb-12"></div>
        <div className="space-y-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-20 bg-gray-50 dark:bg-neutral-800/50 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8">
      {/* Editorial Header */}
      <div className="flex flex-col md:flex-row gap-6 items-start md:items-end justify-between mb-8 border-b border-gray-200/80 dark:border-neutral-800 pb-8">
        <div className="grow max-w-2xl">
          <h1 className="font-serif text-4xl md:text-5xl text-black dark:text-white font-bold leading-tight">Notifications</h1>
          <p className="text-gray-500 dark:text-neutral-500 text-sm font-medium mt-3">Keep up with comments, mentions, likes, and platform updates.</p>
        </div>
        {notifications.some((n) => !n.isRead) && (
          <button
            onClick={handleMarkAllRead}
            className="shrink-0 text-[10px] font-bold uppercase tracking-wider text-black dark:text-white border border-gray-200 dark:border-neutral-700 py-2 px-4 rounded hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors"
          >
            Mark all read
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-8 border-b border-gray-200 dark:border-neutral-800 mb-8">
        <button
          onClick={() => handleFilterChange('all')}
          className={`pb-3 text-xs uppercase tracking-widest font-bold border-b-2 mb-[-1.5px] transition-colors ${
            filter === 'all'
              ? 'text-black dark:text-white border-black dark:border-white'
              : 'text-gray-400 dark:text-neutral-500 border-transparent hover:text-gray-800 dark:hover:text-neutral-300'
          }`}
        >
          All Updates
        </button>
        <button
          onClick={() => handleFilterChange('unread')}
          className={`pb-3 text-xs uppercase tracking-widest font-bold border-b-2 mb-[-1.5px] transition-colors ${
            filter === 'unread'
              ? 'text-black dark:text-white border-black dark:border-white'
              : 'text-gray-400 dark:text-neutral-500 border-transparent hover:text-gray-800 dark:hover:text-neutral-300'
          }`}
        >
          Unread ({notifications.filter((n) => !n.isRead).length})
        </button>
      </div>

      {/* Feed List */}
      <div>
        {notifications.length > 0 ? (
          <>
            <ul className="divide-y divide-gray-100 dark:divide-neutral-800 border-y border-gray-100 dark:border-neutral-800">
              {notifications.map((n) => (
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

            {hasMore && (
              <div className="flex justify-center pt-8 pb-4">
                <RevealButton
                  label="Show more"
                  onClick={handleLoadMore}
                  loading={loadingMore}
                />
              </div>
            )}
          </>
        ) : (
          <div className="py-16 text-center text-gray-500 dark:text-neutral-500 italic">
            {filter === 'unread' ? 'No unread updates.' : 'No notifications yet.'}
          </div>
        )}
      </div>
    </div>
  );
}
