import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';

// Helper rendered INSIDE a <Canvas> whose frameloop is "demand" while the
// canvas is idle (scrolled away / reduced motion) and "always" while it
// is actively animating.
//
// "demand" means R3F renders only when something calls invalidate(). That
// is what makes an off-screen canvas genuinely free — but it also means a
// canvas can be left showing a stale frame, or a blank/white buffer the
// browser discarded while it was idle (common after a tab switch or a
// long time off-screen). This forces a single repaint at exactly the
// moments that can happen:
//
//   - the instant the canvas becomes active again (bridges the
//     demand -> always frameloop switch so the first visible frame is
//     never the discarded buffer),
//   - on tab re-focus,
//   - on window resize (so a resize that happened while off-screen is
//     reflected the moment the canvas is looked at again).
export default function ResumeRender({ active }) {
  const invalidate = useThree((s) => s.invalidate);

  useEffect(() => {
    if (active) invalidate();
  }, [active, invalidate]);

  useEffect(() => {
    const onResize = () => invalidate();
    const onVisibility = () => {
      if (document.visibilityState === 'visible') invalidate();
    };
    window.addEventListener('resize', onResize, { passive: true });
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [invalidate]);

  return null;
}
