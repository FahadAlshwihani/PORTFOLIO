import { useEffect, useState } from 'react';

// Whether the primary input is a real, hoverable pointer (mouse/trackpad)
// vs a coarse touch pointer. Pointer-reactive effects (shader mouse
// ripples, magnet hovers) have no interaction value on touch devices, so
// components use this to skip installing global move listeners and the
// per-frame smoothing math they feed entirely on phones/tablets.
const QUERY = '(hover: hover) and (pointer: fine)';

function detect() {
  if (typeof window === 'undefined' || !window.matchMedia) return true;
  return window.matchMedia(QUERY).matches;
}

export default function usePointerCapabilities() {
  const [finePointer, setFinePointer] = useState(detect);

  useEffect(() => {
    const mq = window.matchMedia(QUERY);
    const onChange = () => setFinePointer(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return { finePointer };
}
