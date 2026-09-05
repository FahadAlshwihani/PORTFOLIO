import Silk from '../../components/ui/Silk/Silk';
import './HeroSilkTransition.css';

// The one and only Silk canvas on the page — Hero no longer renders its
// own copy. This wrapper is taller than Hero's own box (100svh + a bleed
// amount) and sits behind both Hero and About as a sibling, so Silk can
// visually continue past Hero's boundary into the top of About without
// Hero's own overflow:hidden (needed for the Lanyard) clipping it, and
// without Hero itself growing or About moving. The fade/blur dissolve
// into black lives entirely in CSS (heroSilkTransition.css) using
// mask-image + backdrop-filter layering — no second canvas, no JS
// per-frame cost beyond what Silk was already doing.
export default function HeroSilkTransition() {
  return (
    <div className="hero-silk-region" aria-hidden="true">
      <Silk speed={9} scale={1.2} color="#3d1a6e" noiseIntensity={1.2} rotation={0.5} />
      {/* Two progressive backdrop-blur bands (was three) — each re-blurs
          the animated Silk canvas every frame it renders. */}
      <div className="hero-silk-blur-band hero-silk-blur-band-1" />
      <div className="hero-silk-blur-band hero-silk-blur-band-2" />
    </div>
  );
}
