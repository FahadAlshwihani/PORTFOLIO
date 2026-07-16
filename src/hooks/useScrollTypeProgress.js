import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

let pluginRegistered = false;
function ensurePlugin() {
  if (!pluginRegistered && typeof window !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);
    pluginRegistered = true;
  }
}

// Maps scroll position directly to a character count via a scrubbed
// ScrollTrigger — `self.progress` is the single source of truth, so
// `visibleChars = round(total * progress)` is deterministic and instantly
// reversible with no timers, timeouts, or replayed animation involved.
// React only re-renders when the rounded character count actually
// changes, not on every sub-pixel scroll tick.
export default function useScrollTypeProgress(triggerRef, total, { start = 'top 80%', disabled = false } = {}) {
  const [visibleChars, setVisibleChars] = useState(disabled ? total : 0);
  const lastRef = useRef(disabled ? total : 0);

  useEffect(() => {
    if (disabled) {
      lastRef.current = total;
      setVisibleChars(total);
      return undefined;
    }
    const el = triggerRef.current;
    if (!el || total <= 0) return undefined;

    ensurePlugin();

    const applyProgress = progress => {
      const next = Math.round(total * progress);
      if (next !== lastRef.current) {
        lastRef.current = next;
        setVisibleChars(next);
      }
    };

    // `end` is tied to the actual bottom of the page (`document.body`),
    // not to this section's own bottom edge or a guessed pixel distance.
    // Tying it to this section's own bottom would create a feedback loop
    // (revealing more content grows the section, which moves the
    // goalpost that controls how much gets revealed) — and a fixed
    // guessed distance risks exceeding however much real scroll room
    // actually exists after this section (bounded by whatever follows
    // it, e.g. the Footer), permanently stalling the reveal before 100%.
    // Completion is reached exactly when the user reaches the true
    // bottom of the page — which can never be exceeded by definition.
    const st = ScrollTrigger.create({
      trigger: el,
      start,
      endTrigger: document.body,
      end: 'bottom bottom',
      scrub: true,
      onUpdate: self => applyProgress(self.progress),
      onRefresh: self => applyProgress(self.progress)
    });

    applyProgress(st.progress);

    return () => st.kill();
  }, [triggerRef, total, start, disabled]);

  return visibleChars;
}
