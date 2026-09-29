import { useEffect, useRef, useState } from 'react';

// One shared IntersectionObserver per distinct threshold value, instead of
// one observer per Reveal instance. The site mounts dozens of Reveals
// (every eyebrow / title / subtitle / card / section); each previously
// created its own observer. Observers are cheap individually but the
// browser still has to lay out and intersect-test each one on every
// scroll-driven recalculation — collapsing them to ~3 (one per preset
// threshold in use) removes that per-instance bookkeeping.
//
// Reversible reveals keep the original semantics: visibility is exactly
// `entry.isIntersecting`. Callers may opt into `once`; those targets leave
// the shared pool after their first intersection while every other target
// continues using the same observer normally.

const pools = new Map(); // threshold/mode key -> { observer, callbacks: Map<Element, fn> }
const EXIT_THRESHOLD = 0.0001;

function getPool(threshold, resetOnExit) {
  const key = `${threshold}:${resetOnExit ? 'reset-on-exit' : 'standard'}`;
  let pool = pools.get(key);
  if (pool) return pool;

  const callbacks = new Map();
  const observer =
    typeof IntersectionObserver === 'undefined'
      ? null
      : new IntersectionObserver(
          entries => {
            for (const entry of entries) {
              const cb = callbacks.get(entry.target);
              if (cb) cb(entry);
            }
          },
          { threshold: resetOnExit ? [...new Set([EXIT_THRESHOLD, threshold])] : threshold }
        );

  pool = { observer, callbacks };
  pools.set(key, pool);
  return pool;
}

export default function useRevealObserver(threshold, onChange, { once = false, resetOnExit = false } = {}) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  // Keep the latest onChange without re-subscribing the observer for it.
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;

    const pool = getPool(threshold, resetOnExit);
    const unregister = () => {
      pool.observer?.unobserve(el);
      pool.callbacks.delete(el);
    };
    const handler = entry => {
      const { isIntersecting, intersectionRatio = isIntersecting ? 1 : 0 } = entry;
      if (once) {
        if (!isIntersecting) return;
        setVisible(true);
        onChangeRef.current?.(true);
        unregister();
        return;
      }

      // Some reveals need entrance hysteresis: wait for their normal
      // threshold on the way in, but do not hide again until they are fully
      // outside. The near-zero threshold in this opt-in pool gives us that
      // final exit callback without making tiny movements around the entrance
      // threshold flicker the element on and off.
      if (resetOnExit) {
        if (!isIntersecting || intersectionRatio < EXIT_THRESHOLD) {
          setVisible(false);
          onChangeRef.current?.(false);
        } else if (intersectionRatio >= threshold) {
          setVisible(true);
          onChangeRef.current?.(true);
        }
        return;
      }

      setVisible(isIntersecting);
      onChangeRef.current?.(isIntersecting);
    };

    if (!pool.observer) {
      // No IO support (very old browsers / SSR): reveal immediately, same
      // graceful degradation the per-instance version implied.
      handler({ isIntersecting: true, intersectionRatio: 1 });
      return undefined;
    }

    pool.callbacks.set(el, handler);
    pool.observer.observe(el);

    return unregister;
  }, [threshold, once, resetOnExit]);

  return [ref, visible];
}
