import { lazy } from 'react';

// Silk + Lanyard between them pull in three, @react-three/fiber,
// @react-three/drei and @react-three/rapier (WASM) — by far the largest
// dependency in the app. Splitting them out of the main bundle lets the
// rest of the page parse/compile without waiting on ~1MB of 3D runtime.
//
// They ARE above the fold, so the import() is kicked off immediately
// (preloadHeroCanvases, called from Homepage on mount) — the chunk
// downloads in parallel with the main bundle instead of after it, so on
// a normal connection the canvases are ready by first paint. The Suspense
// fallbacks below only ever show on a genuinely slow first load.
export const LazySilk = lazy(() => import('../../components/ui/Silk/Silk'));
export const LazyLanyard = lazy(() => import('../../components/ui/Lanyard/Lanyard'));

let preloaded = false;
export function preloadHeroCanvases() {
  if (preloaded) return;
  preloaded = true;
  import('../../components/ui/Silk/Silk');
  import('../../components/ui/Lanyard/Lanyard');
}
