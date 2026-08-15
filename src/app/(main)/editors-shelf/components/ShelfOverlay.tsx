'use client';

import { useCallback } from 'react';
import type { BookInfo } from '@/lib/three/ShelfScene';

// ─── Types ──────────────────────────────────────────────────

export interface ShelfOverlayProps {
  mode: 'browse' | 'selected' | 'inspecting';
  selectedBook: BookInfo | null;
  bookCount: number;
  nearestIndex: number;
  onNavigateTo: (index: number) => void;
  onNavigateBy: (delta: number) => void;
  onInspect: () => void;
  onExitInspect: () => void;
  onReturnToBrowse: () => void;
  onClose: () => void;
}

// ─── Component ──────────────────────────────────────────────

export default function ShelfOverlay({
  mode,
  selectedBook,
  bookCount,
  nearestIndex,
  onNavigateTo,
  onNavigateBy,
  onInspect,
  onExitInspect,
  onReturnToBrowse,
  onClose,
}: ShelfOverlayProps) {
  const dots = Array.from({ length: bookCount }, (_, i) => i);

  const handlePrev = useCallback(() => onNavigateBy(-1), [onNavigateBy]);
  const handleNext = useCallback(() => onNavigateBy(1), [onNavigateBy]);

  const activeIndex = selectedBook ? selectedBook.index : nearestIndex;

  return (
    <div className="shelf-overlay">
      {/* ── Header ─────────────────────────────── */}
      <div className="shelf-header">
        <div className="shelf-header-brand">
          <span className="shelf-header-label">Excelsior Curations</span>
          <h1 className="shelf-header-title">The Complete Shelf</h1>
        </div>

        <button className="shelf-back-btn" onClick={onClose}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5" /><path d="M12 19l-7-7 7-7" />
          </svg>
          Back
        </button>
      </div>

      {/* ── Book Info Card ─────────────────────── */}
      <div className={`shelf-book-info ${selectedBook ? 'visible' : ''}`}>
        {selectedBook && (
          <>
            <div className="shelf-book-info-number">
              Volume {String(selectedBook.index + 1).padStart(2, '0')} / {String(bookCount).padStart(2, '0')}
            </div>
            <div className="shelf-book-info-title">{selectedBook.title}</div>
            <div className="shelf-book-info-author">by {selectedBook.author}</div>
            <div className="shelf-book-info-divider" />

            {mode === 'selected' && (
              <>
                <button className="shelf-inspect-btn" onClick={onInspect}>
                  Inspect
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 3h6v6" /><path d="M10 14L21 3" /><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  </svg>
                </button>
                <button className="shelf-return-btn" onClick={onReturnToBrowse}>
                  ← Back to Shelf
                </button>
              </>
            )}

            {mode === 'inspecting' && (
              <button className="shelf-return-btn" onClick={onExitInspect}>
                ← Return to Shelf
              </button>
            )}
          </>
        )}
      </div>

      {/* ── Hint ───────────────────────────────── */}
      {mode === 'browse' && !selectedBook && (
        <span className={`shelf-hint ${nearestIndex > 0 ? 'hidden' : ''}`}>
          Drag, scroll, or use arrow keys to browse — click a book to select
        </span>
      )}

      {/* ── Bottom Navigation ──────────────────── */}
      {mode !== 'inspecting' && (
        <nav className="shelf-nav">
          <button
            className="shelf-nav-arrow"
            onClick={handlePrev}
            disabled={activeIndex <= 0}
            aria-label="Previous book"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>

          <div className="shelf-nav-dots">
            {dots.map((i) => (
              <button
                key={i}
                className={`shelf-nav-dot ${i === activeIndex ? 'active' : ''}`}
                onClick={() => onNavigateTo(i)}
                aria-label={`Go to book ${i + 1}`}
              />
            ))}
          </div>

          <button
            className="shelf-nav-arrow"
            onClick={handleNext}
            disabled={activeIndex >= bookCount - 1}
            aria-label="Next book"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </nav>
      )}
    </div>
  );
}
