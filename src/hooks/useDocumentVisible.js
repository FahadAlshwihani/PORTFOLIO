import { useEffect, useRef, useState } from 'react';

// "Is the tab currently visible" — used by animation loops to stop doing
// work when the page is backgrounded (another tab, minimized window).
// Defaults to visible so nothing is wrongly paused before the first event.
export default function useDocumentVisible() {
  const [visible, setVisible] = useState(
    () => typeof document === 'undefined' || document.visibilityState !== 'hidden'
  );

  useEffect(() => {
    const onChange = () => setVisible(document.visibilityState !== 'hidden');
    document.addEventListener('visibilitychange', onChange);
    return () => document.removeEventListener('visibilitychange', onChange);
  }, []);

  return visible;
}

// Ref-mirrored variant for loops that read the flag inside a callback
// rather than as an effect dependency — avoids re-subscribing the loop
// every time visibility flips.
export function useDocumentVisibleRef() {
  const visible = useDocumentVisible();
  const ref = useRef(visible);
  useEffect(() => {
    ref.current = visible;
  }, [visible]);
  return ref;
}
