// src/lib/prefetch.ts

const prefetchedUrls = new Set<string>();

/**
 * Creates a debounced hover prefetch handler.
 * Only triggers the fetch if the user stays hovered for >= thresholdMs (default 65ms),
 * preventing unwanted network requests when quickly moving the cursor across cards.
 */
export function createHoverPrefetch(url: string, thresholdMs = 65) {
  let timer: ReturnType<typeof setTimeout> | null = null;

  const onMouseEnter = () => {
    if (!url || prefetchedUrls.has(url)) return;

    timer = setTimeout(() => {
      prefetchedUrls.add(url);
      fetch(url, { priority: 'low' }).catch(() => {
        // If prefetch fails silently, remove so it can be retried on demand
        prefetchedUrls.delete(url);
      });
    }, thresholdMs);
  };

  const onMouseLeave = () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  };

  return { onMouseEnter, onMouseLeave };
}
