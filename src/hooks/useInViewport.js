import { useEffect, useRef, useState } from 'react';

// Generic "is this element near the viewport" gate, shared by every
// canvas/RAF-driven component (Silk, Lanyard, LogoLoop x6, Terminal).
// A generous rootMargin so animations resume slightly before they're
// actually scrolled into view (no visible pop-in of a frozen frame);
// defaults to "visible" so nothing is incorrectly paused before the
// observer's first callback fires.
//
// One shared IntersectionObserver per distinct rootMargin string, with a
// target->callback map — so e.g. Skills' six LogoLoop marquees (all the
// same rootMargin) are watched by a single observer instead of six.

const pools = new Map(); // rootMargin -> { observer, callbacks: Map<Element, fn> }

function getPool(rootMargin) {
  let pool = pools.get(rootMargin);
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
          { rootMargin }
        );

  pool = { observer, callbacks };
  pools.set(rootMargin, pool);
  return pool;
}

export default function useInViewport(ref, { rootMargin = '200px 0px', enabled = true } = {}) {
  const [inView, setInView] = useState(true);

  useEffect(() => {
    if (!enabled) {
      setInView(true);
      return undefined;
    }
    const el = ref.current;
    if (!el) return undefined;

    const pool = getPool(rootMargin);
    if (!pool.observer) {
      setInView(true);
      return undefined;
    }

    const handler = isIntersecting =>
      setInView(prev => (prev === isIntersecting ? prev : isIntersecting));
    pool.callbacks.set(el, handler);
    pool.observer.observe(el);

    return () => {
      pool.observer.unobserve(el);
      pool.callbacks.delete(el);
    };
  }, [ref, rootMargin, enabled]);

  return inView;
}

// Ref-mirrored variant for RAF loops that read visibility inside a
// callback instead of a React dependency (e.g. LogoLoop's animate loop) —
// avoids re-subscribing the loop's own effect every time visibility flips.
export function useInViewportRef(ref, options) {
  const inView = useInViewport(ref, options);
  const inViewRef = useRef(inView);
  useEffect(() => {
    inViewRef.current = inView;
  }, [inView]);
  return inViewRef;
}
