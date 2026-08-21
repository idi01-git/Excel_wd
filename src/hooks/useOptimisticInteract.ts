'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export type InteractionAction = 'LIKE' | 'DISLIKE' | 'BOOKMARK';
export type InteractionState = { liked: boolean; disliked: boolean; bookmarked: boolean };
export type InteractionCounts = { likes: number; dislikes: number; bookmarks: number };

const DEBOUNCE_MS = 2500;

export function useOptimisticInteract(
  slug: string,
  initial: InteractionState & { counts: InteractionCounts },
  onUnauthenticated?: () => void,
) {
  const initialKey = JSON.stringify(initial);
  const [state, setState] = useState<InteractionState>({ liked: initial.liked, disliked: initial.disliked, bookmarked: initial.bookmarked });
  const [counts, setCounts] = useState(initial.counts);
  const [error, setError] = useState<string | null>(null);
  const stateRef = useRef(state);
  const countsRef = useRef(counts);
  const serverRef = useRef({ state, counts });
  const dirtyRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flushRef = useRef<((useBeacon?: boolean) => Promise<void>) | undefined>(undefined);

  const apply = useCallback((nextState: InteractionState, nextCounts: InteractionCounts) => {
    stateRef.current = nextState;
    countsRef.current = nextCounts;
    setState(nextState);
    setCounts(nextCounts);
  }, []);

  const flush = useCallback(async (useBeacon = false) => {
    if (!dirtyRef.current || !slug) return;
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
    const sentState = { ...stateRef.current };
    dirtyRef.current = false;
    const payload = JSON.stringify(sentState);

    if (useBeacon && typeof navigator !== 'undefined' && navigator.sendBeacon) {
      navigator.sendBeacon(`/api/publications/${slug}/interact`, new Blob([payload], { type: 'application/json' }));
      return;
    }

    try {
      const response = await fetch(`/api/publications/${slug}/interact`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: payload, keepalive: true,
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error('sync failed');
      serverRef.current = { state: sentState, counts: data.counts };
      setCounts(data.counts);
      countsRef.current = data.counts;
      if (JSON.stringify(stateRef.current) !== JSON.stringify(sentState)) {
        dirtyRef.current = true;
        timerRef.current = setTimeout(() => void flushRef.current?.(), DEBOUNCE_MS);
      }
    } catch {
      dirtyRef.current = false;
      apply(serverRef.current.state, serverRef.current.counts);
      setError("Couldn't sync your interaction — please try again.");
    }
  }, [apply, slug]);

  useEffect(() => { flushRef.current = flush; }, [flush]);

  const interact = useCallback((action: InteractionAction) => {
    if (!slug) { onUnauthenticated?.(); return; }
    const current = stateRef.current;
    const next = { ...current };
    const nextCounts = { ...countsRef.current };
    if (action === 'LIKE') {
      next.liked = !current.liked;
      nextCounts.likes = Math.max(0, nextCounts.likes + (next.liked ? 1 : -1));
      if (current.disliked) { next.disliked = false; nextCounts.dislikes = Math.max(0, nextCounts.dislikes - 1); }
    } else if (action === 'DISLIKE') {
      next.disliked = !current.disliked;
      nextCounts.dislikes = Math.max(0, nextCounts.dislikes + (next.disliked ? 1 : -1));
      if (current.liked) { next.liked = false; nextCounts.likes = Math.max(0, nextCounts.likes - 1); }
    } else {
      next.bookmarked = !current.bookmarked;
      nextCounts.bookmarks = Math.max(0, nextCounts.bookmarks + (next.bookmarked ? 1 : -1));
    }
    apply(next, nextCounts);
    dirtyRef.current = true;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => void flushRef.current?.(), DEBOUNCE_MS);
  }, [apply, onUnauthenticated, slug]);

  const initialLiked = initial.liked;
  const initialDisliked = initial.disliked;
  const initialBookmarked = initial.bookmarked;
  const initialLikes = initial.counts?.likes ?? 0;
  const initialDislikes = initial.counts?.dislikes ?? 0;
  const initialBookmarks = initial.counts?.bookmarks ?? 0;

  useEffect(() => {
    if (dirtyRef.current) return;
    const snapshot = {
      state: { liked: initialLiked, disliked: initialDisliked, bookmarked: initialBookmarked },
      counts: { likes: initialLikes, dislikes: initialDislikes, bookmarks: initialBookmarks },
    };
    serverRef.current = snapshot;
    apply(snapshot.state, snapshot.counts);
  }, [apply, initialLiked, initialDisliked, initialBookmarked, initialLikes, initialDislikes, initialBookmarks, slug]);

  useEffect(() => {
    const leave = () => void flush(true);
    window.addEventListener('beforeunload', leave);
    return () => { window.removeEventListener('beforeunload', leave); void flush(true); };
  }, [flush]);

  return { state, counts, interact, error, clearError: () => setError(null) };
}