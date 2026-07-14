import Silk from './ui/Silk';
import Lanyard from './ui/Lanyard';
import Terminal from './ui/Terminal';
import '../styles/herosection.css';

export default function HeroSection() {
  return (
    <div className="hero-section">
      <Silk
        speed={9}
        scale={1.2}
        color="#3d1a6e"
        noiseIntensity={1.2}
        rotation={0.5}
      />
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
          <Lanyard
            position={[0, 0, 22]}
            gravity={[0, -40, 0]}
            frontImage="/ME.jpeg"
            imageFit="cover"
          />
        </div>
      </div>
    </div>
  );
}
