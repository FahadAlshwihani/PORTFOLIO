import { useEffect, useRef, useState } from 'react';
import FaultyTerminal from './ui/FaultyTerminal';
import '../styles/endingScene.css';

function useReducedMotion() {
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

// The single, shared FaultyTerminal canvas behind Skills' lower half +
// Contact + Footer. Mirrors HeroSilkTransition's role at the top of the
// page, running in reverse: strongest at the very bottom (Footer),
// dissolving to nothing above Skills' own midpoint. Never render a second
// instance of this.
//
// `skills` renders first (measured via ResizeObserver so the mask/blur can
// anchor precisely to its own, content-dependent height regardless of
// viewport or language), `children` (Contact + Footer) render after it —
// both sit in the same normal-flow foreground layer, above the canvas.
export default function EndingScene({ skills, children }) {
  const wrapperRef = useRef(null);
  const skillsRef = useRef(null);
  const [isNearViewport, setIsNearViewport] = useState(true);
  const [skillsHeight, setSkillsHeight] = useState(700);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return undefined;

    const observer = new IntersectionObserver(([entry]) => setIsNearViewport(entry.isIntersecting), {
      rootMargin: '200px 0px'
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const el = skillsRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return undefined;

    const ro = new ResizeObserver(([entry]) => setSkillsHeight(entry.contentRect.height));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div className="ending-scene" ref={wrapperRef} style={{ '--skills-height': `${skillsHeight}px` }}>
      <div className="ending-scene-background" aria-hidden="true">
        <FaultyTerminal
          scale={2.6}
          gridMul={[2, 1]}
          digitSize={0.85}
          timeScale={0.24}
          pause={reducedMotion || !isNearViewport}
          scanlineIntensity={0.22}
          glitchAmount={0.35}
          flickerAmount={0.18}
          noiseAmp={1.1}
          chromaticAberration={0}
          dither={0}
          curvature={0.08}
          tint="#5227FF"
          mouseReact={!reducedMotion}
          mouseStrength={0.4}
          pageLoadAnimation={false}
          brightness={0.6}
        />
        <div className="ending-scene-blur ending-scene-blur-1" />
        <div className="ending-scene-blur ending-scene-blur-2" />
        <div className="ending-scene-blur ending-scene-blur-3" />
      </div>
      <div className="ending-scene-foreground">
        <div ref={skillsRef}>{skills}</div>
        {children}
      </div>
    </div>
  );
}
