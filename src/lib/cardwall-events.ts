// src/lib/cardwall-events.ts
// Coordination primitive so below-the-fold heavy work (WebGL shader
// compilation, canvas texture pre-generation, background fetches) never
// lands on the main thread while the 1.8s Cardwall hero entrance is flying.

export const CARDWALL_SETTLED_EVENT = "excelsior:cardwall-settled";

/**
 * Dispatched once per Cardwall mount, when the entrance timeline fully
 * settles. Replayed entrances (client-side navigation back to the home
 * route) dispatch it again.
 */
export function markCardwallSettled(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(CARDWALL_SETTLED_EVENT));
}

/* ── Full-screen modal chrome yielding ───────────────────────────────────────
 * Any full-screen modal (Cardwall detail, gallery lightbox, …) calls these so
 * the global Navbar smoothly yields the screen — including the top-right area
 * where modal close buttons live. */

export const MODAL_CHROME_EVENT = "cardwall-modal-toggle";

export function yieldChromeToModal(): void {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.cardwallModal = "open";
  window.dispatchEvent(new CustomEvent(MODAL_CHROME_EVENT));
}

export function restoreChromeFromModal(): void {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.cardwallModal = "";
  window.dispatchEvent(new CustomEvent(MODAL_CHROME_EVENT));
}

/**
 * Runs `cb` exactly once, after the Cardwall entrance has settled.
 * All consumers mount in the same commit as the Cardwall (before the
 * entrance can settle), so the event alone is deterministic; the timeout
 * is a starvation guard for edge cases (e.g. entrance never plays).
 * Returns an unsubscribe function.
 */
export function onCardwallSettled(cb: () => void, timeoutMs = 7000): () => void {
  if (typeof window === "undefined") return () => {};

  let done = false;
  const timer = window.setTimeout(run, timeoutMs);

  function run() {
    if (done) return;
    done = true;
    window.removeEventListener(CARDWALL_SETTLED_EVENT, run);
    window.clearTimeout(timer);
    cb();
  }

  window.addEventListener(CARDWALL_SETTLED_EVENT, run);
  return () => {
    done = true;
    window.removeEventListener(CARDWALL_SETTLED_EVENT, run);
    window.clearTimeout(timer);
  };
}
