import { useEffect, useState } from 'react';

// True once the page has actually been scrolled away from the very top.
// Seeded from the current scroll position so a reload at a restored
// scroll offset is correctly "already scrolled".
//
// The hero canvases use this to stay unconditionally active while the
// page is still at the top (i.e. the hero is definitely the thing on
// screen), instead of trusting an IntersectionObserver callback that
// hasn't necessarily fired yet on first paint — which is what could
// briefly hide the card/background right after load. Once the user
// scrolls, normal viewport gating takes over and the listener detaches.
export default function useHasScrolled() {
  const [scrolled, setScrolled] = useState(
    () => typeof window !== 'undefined' && window.scrollY > 0
  );

  useEffect(() => {
    if (scrolled) return undefined;
    const onScroll = () => {
      if (window.scrollY > 0) setScrolled(true);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [scrolled]);

  return scrolled;
}
