import { Suspense } from 'react';
import { LazyLanyard } from './heroCanvases';
import Terminal from './Terminal';
import './HeroSection.css';

// Silk itself now renders in HeroSilkTransition (see Homepage.jsx) — a
// sibling positioned behind both Hero and About, so its canvas can bleed
// past this section's own overflow:hidden (which stays in place for the
// Lanyard) into the top of About. Hero's own box/height is unchanged.
export default function HeroSection() {
  return (
    <div className="hero-section">
      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <defs>
          <filter id="glass-distort" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.65 0.65"
              numOctaves="3"
              seed="2"
              result="noise"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              scale="6"
              xChannelSelector="R"
              yChannelSelector="G"
              result="distorted"
            />
            <feGaussianBlur in="distorted" stdDeviation="0.4" result="blurred" />
            <feComposite in="blurred" in2="SourceGraphic" operator="atop" />
          </filter>
        </defs>
      </svg>
      <div className="hero-overlay">
        <div className="hero-text-shield" />
        <div className="hero-glass-text">
          <Terminal />
        </div>
        <div className="hero-lanyard">
          <Suspense fallback={null}>
            <LazyLanyard
              position={[0, 0, 22]}
              gravity={[0, -40, 0]}
              frontImage="/ME.jpeg"
              imageFit="cover"
            />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
