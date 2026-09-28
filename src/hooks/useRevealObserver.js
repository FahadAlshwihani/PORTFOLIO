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

const pools = new Map(); // thresholdKey -> { observer, callbacks: Map<Element, fn> }

function getPool(threshold) {
  const key = String(threshold);
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
              if (cb) cb(entry.isIntersecting);
            }
          },
          { threshold }
        );

  pool = { observer, callbacks };
  pools.set(key, pool);
  return pool;
}

export default function useRevealObserver(threshold, onChange, { once = false } = {}) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  // Keep the latest onChange without re-subscribing the observer for it.
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;

    const pool = getPool(threshold);
    const unregister = () => {
      pool.observer?.unobserve(el);
      pool.callbacks.delete(el);
    };
    const handler = isIntersecting => {
      if (once) {
        if (!isIntersecting) return;
        setVisible(true);
        onChangeRef.current?.(true);
        unregister();
        return;
      }

      setVisible(isIntersecting);
      onChangeRef.current?.(isIntersecting);
    };

    if (!pool.observer) {
      // No IO support (very old browsers / SSR): reveal immediately, same
      // graceful degradation the per-instance version implied.
      handler(true);
      return undefined;
    }

    pool.callbacks.set(el, handler);
    pool.observer.observe(el);

    return unregister;
  }, [threshold, once]);

  return [ref, visible];
}
