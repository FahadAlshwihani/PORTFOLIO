import { useEffect } from 'react';

// One requestAnimationFrame loop for the whole page instead of each
// animated component running its own. Components register a per-frame
// callback; the loop only actually runs while at least one callback is
// registered AND the tab is visible, and it stops itself entirely
// otherwise (no idle RAF being scheduled just to early-return).
//
// Every callback receives the same high-res timestamp and the delta (ms)
// since the previous frame, so consumers don't each have to track their
// own lastTimestamp. A consumer that needs to pause simply unregisters;
// re-registering restarts it cleanly with a fresh delta.

const callbacks = new Set();
let rafId = 0;
let lastTime = 0;

function frame(now) {
  const delta = lastTime ? now - lastTime : 0;
  lastTime = now;

  // Snapshot so a callback that unregisters mid-iteration doesn't skip
  // another callback in the same frame.
  for (const cb of Array.from(callbacks)) {
    try {
      cb(now, delta);
    } catch (err) {
      // A throwing consumer must never kill the shared loop for everyone.
      // eslint-disable-next-line no-console
      console.error('[useSharedRAF] callback error', err);
    }
  }

  if (callbacks.size > 0 && document.visibilityState !== 'hidden') {
    rafId = requestAnimationFrame(frame);
  } else {
    rafId = 0;
    lastTime = 0;
  }
}

function ensureRunning() {
  if (rafId === 0 && callbacks.size > 0 && document.visibilityState !== 'hidden') {
    lastTime = 0;
    rafId = requestAnimationFrame(frame);
  }
}

function register(cb) {
  callbacks.add(cb);
  ensureRunning();
  return () => {
    callbacks.delete(cb);
    if (callbacks.size === 0 && rafId !== 0) {
      cancelAnimationFrame(rafId);
      rafId = 0;
      lastTime = 0;
    }
  };
}

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      if (rafId !== 0) {
        cancelAnimationFrame(rafId);
        rafId = 0;
        lastTime = 0;
      }
    } else {
      ensureRunning();
    }
  });
}

// Imperative registration for non-hook callers (e.g. a class-free module
// that just needs a frame tick).
export function registerSharedFrame(cb) {
  return register(cb);
}

// Hook form: registers `callback` for the lifetime of the component while
// `active` is true. `callback` is used via a ref internally by the caller
// if they need a stable identity — here we (re)register whenever the
// identity or `active` changes, so memoize it with useCallback upstream.
export default function useSharedRAF(callback, active = true) {
  useEffect(() => {
    if (!active || typeof callback !== 'function') return undefined;
    return register(callback);
  }, [callback, active]);
}
