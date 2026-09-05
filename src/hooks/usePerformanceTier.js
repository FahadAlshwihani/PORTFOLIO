import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';

// Four adaptive quality tiers, cheapest to richest. Every consumer (Silk,
// Lanyard, FaultyTerminal) reads the SAME tier from this one provider, so
// the whole page settles on one consistent quality level instead of each
// canvas independently guessing and disagreeing — that's what keeps
// quality changes from ever looking like a visible per-component jump.
const TIER_ORDER = ['very-low', 'low', 'medium', 'high'];

const TIER_CONFIG = {
  high: { dpr: 2, physicsHz: 60, shaderQuality: 1, blur: 1 },
  medium: { dpr: 1.5, physicsHz: 60, shaderQuality: 0.85, blur: 0.85 },
  low: { dpr: 1, physicsHz: 30, shaderQuality: 0.6, blur: 0.6 },
  'very-low': { dpr: 0.75, physicsHz: 24, shaderQuality: 0.4, blur: 0.4 }
};

// Cheap, synchronous heuristics only — this must resolve before first
// paint's worth of canvases mount, so there's no "upgrade pop" once real
// content appears. GPU renderer string detection intentionally only ever
// pushes the score DOWN (software/old-integrated renderers) — it never
// pushes it up, so a misidentified/unknown GPU just falls back to the
// CPU-core/memory heuristics instead of over-trusting a string match.
function detectStaticTier() {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return 'high';

  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return 'very-low';

  const cores = navigator.hardwareConcurrency || 4;
  const mem = navigator.deviceMemory || 4; // Chrome/Edge only; other browsers fall back to 4 (mid-range assumption)

  let gpuPenalty = 0;
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    const dbg = gl?.getExtension('WEBGL_debug_renderer_info');
    const renderer = dbg ? String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL)) : '';
    const r = renderer.toLowerCase();
    if (/swiftshader|llvmpipe|software|microsoft basic render/.test(r)) gpuPenalty = 2;
    else if (/intel/.test(r) && !/iris\s?xe|arc\b/.test(r)) gpuPenalty = 1; // older integrated Intel (UHD/HD Graphics)
    else if (/mali-[gt]?[1-4]\d\d|adreno\s?[1-5]\d\d/.test(r)) gpuPenalty = 1; // low/mid mobile GPUs
  } catch {
    // WebGL unavailable entirely — treat as a strong low-end signal below.
    gpuPenalty = 2;
  }

  const dpr = window.devicePixelRatio || 1;
  const pixelLoad = (window.screen?.width || 1920) * (window.screen?.height || 1080) * dpr * dpr;

  let score = 0;
  score += cores >= 8 ? 2 : cores >= 4 ? 1 : 0;
  score += mem >= 8 ? 2 : mem >= 4 ? 1 : 0;
  score -= gpuPenalty;
  score -= pixelLoad > 5_000_000 ? 1 : 0; // 4K/high-DPR panels cost more to fill regardless of GPU

  if (score >= 4) return 'high';
  if (score >= 2) return 'medium';
  if (score >= 0) return 'low';
  return 'very-low';
}

function downgrade(tier) {
  const idx = TIER_ORDER.indexOf(tier);
  return TIER_ORDER[Math.max(0, idx - 1)];
}

const PerformanceTierContext = createContext(null);

export function PerformanceTierProvider({ children }) {
  const [tier, setTier] = useState(detectStaticTier);
  const [reducedMotion, setReducedMotion] = useState(
    () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  );
  const downgradedRef = useRef(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => setReducedMotion(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  // One-shot runtime refinement: sample real frame timing for ~1.2s after
  // mount. If the static heuristic guessed too high (actual FPS is poor,
  // or the main thread is visibly janky via long tasks), drop exactly one
  // tier — once. Never upgrades mid-session and never downgrades a second
  // time, so nothing after the initial settle-in window ever visibly
  // shifts quality.
  useEffect(() => {
    if (reducedMotion || downgradedRef.current) return undefined;
    let rafId;
    let frames = 0;
    let longTaskTime = 0;
    const start = performance.now();

    const po =
      typeof PerformanceObserver !== 'undefined'
        ? (() => {
            try {
              const obs = new PerformanceObserver(list => {
                for (const entry of list.getEntries()) longTaskTime += entry.duration;
              });
              obs.observe({ type: 'longtask', buffered: true });
              return obs;
            } catch {
              return null;
            }
          })()
        : null;

    const sample = now => {
      frames += 1;
      if (now - start < 1200) {
        rafId = requestAnimationFrame(sample);
        return;
      }
      const elapsedSec = (now - start) / 1000;
      const fps = frames / elapsedSec;
      const janky = longTaskTime > 250; // >250ms of long tasks inside a 1.2s window is a real sign of trouble
      if ((fps < 45 || janky) && !downgradedRef.current) {
        downgradedRef.current = true;
        setTier(current => downgrade(current));
      }
      po?.disconnect();
    };
    rafId = requestAnimationFrame(sample);

    return () => {
      cancelAnimationFrame(rafId);
      po?.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reducedMotion]);

  // Mirror the resolved tier onto <html> so purely-visual CSS (e.g. the
  // progressive backdrop-blur stacks over the animated canvases) can
  // scale itself down on weaker devices without every stylesheet needing
  // a JS bridge of its own.
  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.documentElement.dataset.perfTier = tier;
    document.documentElement.dataset.reducedMotion = reducedMotion ? 'true' : 'false';
  }, [tier, reducedMotion]);

  const value = useMemo(() => {
    const config = TIER_CONFIG[tier];
    return { tier, reducedMotion, ...config };
  }, [tier, reducedMotion]);

  return <PerformanceTierContext.Provider value={value}>{children}</PerformanceTierContext.Provider>;
}

// Consumers outside a provider (tests, storybook-style isolated renders)
// still get a sane, safe-by-default mid tier rather than crashing.
export function usePerformanceTier() {
  const ctx = useContext(PerformanceTierContext);
  return ctx || { tier: 'medium', reducedMotion: false, ...TIER_CONFIG.medium };
}
