/* eslint-disable react/no-unknown-property */
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import './Silk.css';
import { forwardRef, useRef, useMemo, useLayoutEffect } from 'react';
import { Color } from 'three';
import { usePerformanceTier } from '../../../hooks/usePerformanceTier';
import useInViewport from '../../../hooks/useInViewport';
import ResumeRender from '../ResumeRender';

const hexToNormalizedRGB = hex => {
  hex = hex.replace('#', '');
  return [
    parseInt(hex.slice(0, 2), 16) / 255,
    parseInt(hex.slice(2, 4), 16) / 255,
    parseInt(hex.slice(4, 6), 16) / 255
  ];
};

const vertexShader = `
varying vec2 vUv;
varying vec3 vPosition;

void main() {
  vPosition = position;
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const fragmentShader = `
varying vec2 vUv;
varying vec3 vPosition;

uniform float uTime;
uniform vec3  uColor;
uniform float uSpeed;
uniform float uScale;
uniform float uRotation;
uniform float uNoiseIntensity;

const float e = 2.71828182845904523536;

float noise(vec2 texCoord) {
  float G = e;
  vec2  r = (G * sin(G * texCoord));
  return fract(r.x * r.y * (1.0 + texCoord.x));
}

vec2 rotateUvs(vec2 uv, float angle) {
  float c = cos(angle);
  float s = sin(angle);
  mat2  rot = mat2(c, -s, s, c);
  return rot * uv;
}

void main() {
  float rnd        = noise(gl_FragCoord.xy);
  vec2  uv         = rotateUvs(vUv * uScale, uRotation);
  vec2  tex        = uv * uScale;
  float tOffset    = uSpeed * uTime;

  tex.y += 0.03 * sin(8.0 * tex.x - tOffset);

  float pattern = 0.6 +
                  0.4 * sin(5.0 * (tex.x + tex.y +
                                   cos(3.0 * tex.x + 5.0 * tex.y) +
                                   0.02 * tOffset) +
                           sin(20.0 * (tex.x + tex.y - 0.1 * tOffset)));

  vec4 col = vec4(uColor, 1.0) * vec4(pattern) - rnd / 15.0 * uNoiseIntensity;
  col.a = 1.0;
  gl_FragColor = col;
}
`;

const SilkPlane = forwardRef(function SilkPlane({ uniforms }, ref) {
  // Selector form: re-run only when the viewport actually changes, not on
  // every unrelated R3F store update (pointer move, frame count, ...).
  const viewport = useThree(state => state.viewport);

  useLayoutEffect(() => {
    if (ref.current) {
      ref.current.scale.set(viewport.width, viewport.height, 1);
    }
  }, [ref, viewport]);

  useFrame((_, delta) => {
    ref.current.material.uniforms.uTime.value += 0.1 * delta;
  });

  return (
    <mesh ref={ref}>
      <planeGeometry args={[1, 1, 1, 1]} />
      <shaderMaterial uniforms={uniforms} vertexShader={vertexShader} fragmentShader={fragmentShader} />
    </mesh>
  );
});
SilkPlane.displayName = 'SilkPlane';

const Silk = ({ speed = 5, scale = 1, color = '#7B7481', noiseIntensity = 1.5, rotation = 0 }) => {
  const meshRef = useRef();
  const wrapperRef = useRef(null);
  const { dpr, reducedMotion } = usePerformanceTier();
  // 400px lead so the shader is already animating again before the canvas
  // itself scrolls into view — no frozen-frame pop-in.
  const inView = useInViewport(wrapperRef, { rootMargin: '400px 0px' });
  const active = inView && !reducedMotion;
  // active         -> "always" (full-rate animation)
  // idle, normal   -> "demand" (no RAF, but invalidate() can wake one frame)
  // reduced motion -> "never"  (unchanged pre-existing behaviour)
  const frameloop = active ? 'always' : reducedMotion ? 'never' : 'demand';

  const uniforms = useMemo(
    () => ({
      uSpeed: { value: speed },
      uScale: { value: scale },
      uNoiseIntensity: { value: noiseIntensity },
      uColor: { value: new Color(...hexToNormalizedRGB(color)) },
      uRotation: { value: rotation },
      uTime: { value: 0 }
    }),
    [speed, scale, noiseIntensity, color, rotation]
  );

  return (
    <div className="silk-wrapper" ref={wrapperRef}>
      {/* active  -> "always": full-rate animation while on screen.
          idle    -> "demand": R3F schedules no RAF, so an off-screen or
          reduced-motion canvas costs nothing — but unlike "never",
          invalidate() still works, so ResumeRender can force an
          immediate repaint on re-entry / resize / tab-refocus and the
          canvas never comes back blank or white. */}
      <Canvas dpr={[Math.min(1, dpr), dpr]} frameloop={frameloop}>
        <SilkPlane ref={meshRef} uniforms={uniforms} />
        <ResumeRender active={active} />
      </Canvas>
    </div>
  );
};

export default Silk;
