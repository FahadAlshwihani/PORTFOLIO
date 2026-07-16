import { useEffect, useRef, useState } from 'react';

// Generic "is this element near the viewport" gate, shared by every
// canvas/RAF-driven component (Silk, Lanyard, LogoLoop, Terminal). Mirrors
// EndingScene's own inline IntersectionObserver pattern: a generous
// rootMargin so animations resume slightly before they're actually
// scrolled into view (no visible pop-in of a frozen frame), defaults to
// "visible" so nothing is incorrectly paused before the observer's first
// callback fires.
export default function useInViewport(ref, { rootMargin = '200px 0px', enabled = true } = {}) {
  const [inView, setInView] = useState(true);

  useEffect(() => {
    if (!enabled) {
      setInView(true);
      return undefined;
    }
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return undefined;

    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { rootMargin });
    observer.observe(el);
    return () => observer.disconnect();
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
