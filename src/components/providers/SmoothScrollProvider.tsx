'use client';

import { ReactLenis, useLenis } from 'lenis/react';
import { ReactNode, useEffect } from 'react';

function ScrollResizeHandler() {
  const lenis = useLenis();

  useEffect(() => {
    if (!lenis) return;

    // Trigger Lenis resize when the document body dimensions change (e.g. async
    // content load). Debounced: lenis.resize() forces a layout read, and raw
    // ResizeObserver bursts (dynamic content, modal toggles) would otherwise
    // hammer the main thread mid-scroll.
    let timer: ReturnType<typeof setTimeout> | undefined;
    const resizeObserver = new ResizeObserver(() => {
      clearTimeout(timer);
      timer = setTimeout(() => lenis.resize(), 120);
    });

    resizeObserver.observe(document.body);

    return () => {
      clearTimeout(timer);
      resizeObserver.disconnect();
    };
  }, [lenis]);

  return null;
}

export function SmoothScrollProvider({ children }: { children: ReactNode }) {
  return (
    <ReactLenis
      root
      options={{
        // Frame-rate-independent exponential smoothing: buttery glide with a
        // fast settle, instead of duration-based easing which feels laggy on
        // fast flicks. (When `duration` is set it takes precedence over lerp,
        // so it is deliberately omitted.)
        lerp: 0.09,
        smoothWheel: true,
        wheelMultiplier: 1,
        touchMultiplier: 1.4,
      }}
    >
      <ScrollResizeHandler />
      {children}
    </ReactLenis>
  );
}
