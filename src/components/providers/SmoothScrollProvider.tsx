'use client';

import { ReactLenis, useLenis } from 'lenis/react';
import { ReactNode, useEffect } from 'react';

function ScrollResizeHandler() {
  const lenis = useLenis();

  useEffect(() => {
    if (!lenis) return;

    // Trigger Lenis resize when the document body dimensions change (e.g. async content load)
    const resizeObserver = new ResizeObserver(() => {
      lenis.resize();
    });

    resizeObserver.observe(document.body);

    return () => {
      resizeObserver.disconnect();
    };
  }, [lenis]);

  return null;
}

export function SmoothScrollProvider({ children }: { children: ReactNode }) {
  return (
    <ReactLenis root options={{ lerp: 0.08, duration: 1.5, smoothWheel: true }}>
      <ScrollResizeHandler />
      {children}
    </ReactLenis>
  );
}
