import { useEffect, useState } from 'react';

// Single implementation of the prefers-reduced-motion subscription that
// was copy-pasted (identically) into Contact, Projects, Terminal and
// EndingScene. Same behaviour: seeded synchronously so the first render
// is already correct, and it stays live if the OS setting is toggled
// while the page is open.
//
// (usePerformanceTier tracks the same query for its own tier logic;
// that one is intentionally left in place — it needs the value before
// the provider renders — but every plain consumer should use this.)
export default function useReducedMotion() {
  const [reduced, setReduced] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return reduced;
}
