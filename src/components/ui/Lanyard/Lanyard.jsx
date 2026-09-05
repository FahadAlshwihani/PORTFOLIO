/* eslint-disable react/no-unknown-property */
'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, useTexture, Environment, Lightformer } from '@react-three/drei';
import { BallCollider, CuboidCollider, Physics, RigidBody, interactionGroups, useRopeJoint, useSphericalJoint } from '@react-three/rapier';

// replace with your own imports, see the usage snippet for details
import * as THREE from 'three';
import cardGLB from '../../../assets/models/lanyard/card.glb';
import { usePerformanceTier } from '../../../hooks/usePerformanceTier';
import useInViewport from '../../../hooks/useInViewport';
import './Lanyard.css';

// Strap smoothing is visual-only and must never extrapolate after a
// throttled Safari frame. Normal 60/120 Hz frames pass through unchanged.
const MAX_ROPE_VISUAL_DELTA = 1 / 60;
const isFiniteVector = (value) => value
    && Number.isFinite(value.x)
    && Number.isFinite(value.y)
    && Number.isFinite(value.z)
    && (value.w === undefined || Number.isFinite(value.w));

// The card model's front face is UV-mapped to the LEFT half of the texture
// atlas and the back face to the RIGHT half (measured from card.glb). Each
// custom image is composited into its own half so the two faces render
// independently, aspect-preserving (no stretching).
const FRONT_UV_RECT = { x: 0, y: 0, w: 0.5, h: 0.755 };
const BACK_UV_RECT = { x: 0.5, y: 0, w: 0.5, h: 0.757 };

/* ── Woven-strap rendering ─────────────────────────────────────────────
   The rope is no longer a MeshLine ribbon (a camera-facing flat spline —
   exactly what read as "a curved line"). Each of the lanyard's two strands
   is real extruded geometry: a flat, rounded-edge elliptical cross-section
   swept along the physics curve using parallel-transport frames (Frenet
   frames flip at inflection points; parallel transport doesn't), so the
   strap has genuine width, thickness and volume, and lights correctly from
   every viewing angle. The mesh topology (index buffer, attribute sizes)
   is built exactly once; every frame only rewrites positions/normals in
   place — no per-frame allocation, no geometry rebuilds. */

// Cross-section half-extents, in world units, scaled by the lanyardWidth
// prop. Width ≫ thickness is what makes it read as woven strap rather
// than shoelace: sized against this scene's ~7.8-unit visible height so
// the full ~0.11-unit width lands in real-lanyard proportion to the card.
const STRAP_HALF_WIDTH = 0.055;
const STRAP_HALF_THICK = 0.016;
const STRAP_RINGS_DESKTOP = 36;
const STRAP_RINGS_MOBILE = 22;
const STRAP_RADIAL_DESKTOP = 10;
const STRAP_RADIAL_MOBILE = 8;

const Z_AXIS = new THREE.Vector3(0, 0, 1);
// Scratch vectors reused across every strand and frame (single-threaded).
const _sTan = new THREE.Vector3();
const _sNor = new THREE.Vector3();
const _sBin = new THREE.Vector3();

function createStrapGeometry(rings, radial) {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(rings * radial * 3), 3));
    geo.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(rings * radial * 3), 3));
    const index = [];
    for (let i = 0; i < rings - 1; i += 1) {
        for (let k = 0; k < radial; k += 1) {
            const a = i * radial + k;
            const b = i * radial + ((k + 1) % radial);
            const c = (i + 1) * radial + k;
            const d = (i + 1) * radial + ((k + 1) % radial);
            index.push(a, c, b, b, c, d);
        }
    }
    geo.setIndex(index);
    // Reused every frame to sample the spline without allocating.
    geo.userData.ringPoints = Array.from({ length: rings }, () => new THREE.Vector3());
    return geo;
}

// Sweeps the strap cross-section along `curve` (param 0 = anchor end,
// 1 = card end) and writes positions + analytically-correct ellipse
// normals straight into the geometry's buffers. `twist` is the torsion
// angle at the card end, in radians; it falls off quadratically toward
// the anchor, so a badge rotation visibly winds the strap near the clasp
// and dissipates on the way up — how torsion actually propagates through
// fabric held at the far end.
function updateStrapGeometry(geo, curve, radial, halfWidth, halfThick, twist) {
    const pts = geo.userData.ringPoints;
    const rings = pts.length;
    for (let i = 0; i < rings; i += 1) curve.getPoint(i / (rings - 1), pts[i]);

    const pos = geo.attributes.position.array;
    const nor = geo.attributes.normal.array;

    for (let i = 0; i < rings; i += 1) {
        _sTan.subVectors(pts[Math.min(rings - 1, i + 1)], pts[Math.max(0, i - 1)]);
        if (_sTan.lengthSq() < 1e-10) _sTan.set(0, 1, 0);
        else _sTan.normalize();

        if (i === 0) {
            // Seed frame: flat side facing the camera, as closely as the
            // first tangent allows.
            _sNor.crossVectors(_sTan, Z_AXIS);
            if (_sNor.lengthSq() < 1e-6) _sNor.set(1, 0, 0);
            else _sNor.normalize();
        } else {
            // Parallel transport: strip the new tangent's component out of
            // the previous ring's normal — minimal rotation, no flipping.
            _sNor.addScaledVector(_sTan, -_sNor.dot(_sTan));
            if (_sNor.lengthSq() < 1e-6) _sNor.crossVectors(_sTan, Z_AXIS).normalize();
            else _sNor.normalize();
        }
        _sBin.crossVectors(_sTan, _sNor);

        const s = i / (rings - 1);
        const theta = twist * s * s;
        const p = pts[i];

        for (let k = 0; k < radial; k += 1) {
            const phi = (k / radial) * Math.PI * 2 + theta;
            const cosPhi = Math.cos(phi);
            const sinPhi = Math.sin(phi);
            const o = (i * radial + k) * 3;

            pos[o] = p.x + _sNor.x * cosPhi * halfWidth + _sBin.x * sinPhi * halfThick;
            pos[o + 1] = p.y + _sNor.y * cosPhi * halfWidth + _sBin.y * sinPhi * halfThick;
            pos[o + 2] = p.z + _sNor.z * cosPhi * halfWidth + _sBin.z * sinPhi * halfThick;

            // Outward normal of an ellipse is (cos/a, sin/b), not the
            // radial direction — using the radial direction would shade
            // the flat faces as if the strap were a round cord.
            let nx = cosPhi / halfWidth;
            let ny = sinPhi / halfThick;
            const invLen = 1 / Math.hypot(nx, ny);
            nx *= invLen;
            ny *= invLen;
            nor[o] = _sNor.x * nx + _sBin.x * ny;
            nor[o + 1] = _sNor.y * nx + _sBin.y * ny;
            nor[o + 2] = _sNor.z * nx + _sBin.z * ny;
        }
    }

    geo.attributes.position.needsUpdate = true;
    geo.attributes.normal.needsUpdate = true;
}

// Laptop-range card scale/offset (see HeroSection.css's matching "Laptop
// 1201px–1920px" bracket for the terminal-side half of this fix): this
// used to be two flat steps in updateScene below (3.45 up to 1600px, then
// a jump to 3.75) while the terminal's own font-size clamp kept growing
// continuously with `vw` across that same span — so the terminal grew
// relative to the card the wider a "laptop" screen got, even though
// neither piece individually "changed". Replaced with a continuous ramp
// across the whole 1200–1920 range instead, mirroring the terminal's
// clamp() fix. Below 1200px and above 1920px (true ultra-wide desktop)
// are untouched, still their own fixed/stepped values.
const LAPTOP_MIN_W = 1200;
const LAPTOP_MAX_W = 1920;
const LAPTOP_SCALE_MIN = 3.45;
const LAPTOP_SCALE_MAX = 3.9;
const LAPTOP_CARD_Y_MIN = -1.0;
const LAPTOP_CARD_Y_MAX = -0.95;

function laptopProgress(w) {
    const clamped = Math.min(Math.max(w, LAPTOP_MIN_W), LAPTOP_MAX_W);
    return (clamped - LAPTOP_MIN_W) / (LAPTOP_MAX_W - LAPTOP_MIN_W);
}

export default function Lanyard({
    position = [0, 0, 30],
    gravity = [0, -40, 0],
    fov = 20,
    transparent = true,
    frontImage = null,
    backImage = null,
    imageFit = 'cover',
    lanyardWidth = 1,
    rtl = false
}) {
    const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 768);
    const wrapperRef = useRef(null);
    const { dpr: tierDpr, physicsHz, reducedMotion } = usePerformanceTier();
    // Generous lead so physics/rendering are already warmed back up before
    // the card actually scrolls into view — no frozen-frame pop-in.
    const inView = useInViewport(wrapperRef, { rootMargin: '300px 0px' });
    const active = inView && !reducedMotion;

    const [sceneConfig, setSceneConfig] = useState({
        anchorX: 3.5,
        anchorY: 3.9,
        cardScale: 2.25,
        cardY: -1.15,
        ropeScale: 1,
    });
    
    const dir = rtl ? -1 : 1;

    useEffect(() => {
        let rafId = 0;

        const applyResize = () => {
            rafId = 0;
            const w = window.innerWidth;
            const nextIsMobile = w < 768;
            setIsMobile(prev => (prev === nextIsMobile ? prev : nextIsMobile));
            updateScene(w);
        };

        // One rAF-coalesced resize handler for both the responsive scene
        // config and the isMobile flag — was two independent listeners
        // each doing a synchronous setState per resize event.
        const onResize = () => {
            if (rafId === 0) rafId = requestAnimationFrame(applyResize);
        };

        const updateScene = (w) => {

            if (w <= 600) {

                setSceneConfig({
                    anchorX: 0,
                    anchorY: 5.7,
                    cardScale: 3.50,
                    cardY: -2,
                    ropeScale: 1
                });

            }

            else if (w <= 900) {

                setSceneConfig({
                    anchorX: dir * 1,
                    anchorY: 4.5,
                    cardScale: 2.45,
                    cardY: -0.9,
                    ropeScale: 1
                });

            }

            else if (w <= 1200) {

                setSceneConfig({
                    anchorX: dir * 2,
                    anchorY: 5,
                    cardScale: 3.3,
                    cardY: -1.0,
                    ropeScale: 1
                });

            }

            else if (w <= 1600) {

                const t = laptopProgress(w);

                setSceneConfig({
                    anchorX: dir * 3.0,
                    anchorY: 4.6,
                    cardScale: LAPTOP_SCALE_MIN + t * (LAPTOP_SCALE_MAX - LAPTOP_SCALE_MIN),
                    cardY: LAPTOP_CARD_Y_MIN + t * (LAPTOP_CARD_Y_MAX - LAPTOP_CARD_Y_MIN),
                    ropeScale: 1
                });

            }

            else if (w <= LAPTOP_MAX_W) {

                const t = laptopProgress(w);

                setSceneConfig({
                    anchorX: dir * 3.5,
                    anchorY: 5.15,
                    cardScale: LAPTOP_SCALE_MIN + t * (LAPTOP_SCALE_MAX - LAPTOP_SCALE_MIN),
                    cardY: LAPTOP_CARD_Y_MIN + t * (LAPTOP_CARD_Y_MAX - LAPTOP_CARD_Y_MIN),
                    ropeScale: 1
                });

            }

            else {

                setSceneConfig({
                    anchorX: dir * 3.5,
                    anchorY: 5.15,
                    cardScale: 3.75,
                    cardY: -0.95,
                    ropeScale: 1
                });

            }

        };

        updateScene(window.innerWidth);

        window.addEventListener("resize", onResize, { passive: true });

        return () => {
            window.removeEventListener("resize", onResize);
            if (rafId) cancelAnimationFrame(rafId);
        };
        // dir is derived from the rtl prop; this component isn't currently
        // passed a live-changing rtl value anywhere, so recomputing only on
        // resize (not on dir change) matches existing behavior exactly.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const effectiveDpr = Math.min(tierDpr, isMobile ? 1.5 : 2);
    const effectivePhysicsHz = Math.min(physicsHz, isMobile ? 30 : 60);

    return (
        <div
            className="lanyard-wrapper"
            ref={wrapperRef}
            style={{ touchAction: 'pan-y' }}
        >
            <Canvas
                camera={{ position: position, fov: fov }}
                dpr={[Math.min(1, effectiveDpr), effectiveDpr]}
                gl={{ alpha: transparent }}
                // "never" fully stops R3F's RAF loop (and, with it, Rapier's
                // physics stepping and Band's own useFrame) rather than just
                // hiding a frame that's still being computed underneath —
                // real idle cost when the card is scrolled far away or
                // reduced-motion is on, not a cosmetic pause.
                frameloop={active ? 'always' : 'never'}
                style={{
                    position: 'absolute',
                    inset: 0,
                    pointerEvents: 'auto',
                    touchAction: isMobile ? 'pan-y' : 'auto'
                }}
                onCreated={({ gl }) => {
                    gl.setClearColor(0x000000, transparent ? 0 : 1);
                    gl.domElement.style.pointerEvents = 'auto';
                    gl.domElement.style.touchAction = isMobile ? 'pan-y' : 'auto';
                }}
            >
                <ambientLight intensity={Math.PI} />
                <Physics gravity={gravity} timeStep={1 / effectivePhysicsHz}>
                    <Band
                        isMobile={isMobile}
                        frontImage={frontImage}
                        backImage={backImage}
                        imageFit={imageFit}
                        lanyardWidth={lanyardWidth}
                        anchorOffsetX={sceneConfig.anchorX}
                        anchorY={sceneConfig.anchorY}
                        cardScale={sceneConfig.cardScale}
                        cardY={sceneConfig.cardY}
                        ropeScale={sceneConfig.ropeScale}
                    />
                </Physics>
                <Environment blur={0.75}>
                    <Lightformer
                        intensity={2}
                        color="white"
                        position={[0, -1, 5]}
                        rotation={[0, 0, Math.PI / 3]}
                        scale={[100, 0.1, 1]}
                    />
                    <Lightformer
                        intensity={3}
                        color="white"
                        position={[-1, -1, 1]}
                        rotation={[0, 0, Math.PI / 3]}
                        scale={[100, 0.1, 1]}
                    />
                    <Lightformer
                        intensity={3}
                        color="white"
                        position={[1, 1, 1]}
                        rotation={[0, 0, Math.PI / 3]}
                        scale={[100, 0.1, 1]}
                    />
                    <Lightformer
                        intensity={10}
                        color="white"
                        position={[-10, 0, 14]}
                        rotation={[0, Math.PI / 2, Math.PI / 3]}
                        scale={[100, 10, 1]}
                    />
                </Environment>
            </Canvas>
        </div>
    );
}
function Band({

    maxSpeed = 50,

    minSpeed = 0,

    isMobile = false,

    frontImage = null,

    backImage = null,

    imageFit = 'cover',

    lanyardWidth = 1,

    anchorOffsetX = 2.5,

    anchorY = 4,

    cardScale = 2.25,

    cardY = -1.2,

    ropeScale = 1

}) {
    // Two strands (left/right) form the V: each is its own chain of three
    // free bodies between a fixed anchor and the shared connector body the
    // card hangs from — the physical clasp where both strands meet.
    const fixedL = useRef(),
        fixedR = useRef(),
        l1 = useRef(),
        l2 = useRef(),
        l3 = useRef(),
        r1 = useRef(),
        r2 = useRef(),
        r3 = useRef(),
        connector = useRef(),
        connectorMesh = useRef(),
        card = useRef(),
        anchorGroup = useRef();

    const vec = new THREE.Vector3(),
        ang = new THREE.Vector3(),
        rot = new THREE.Vector3(),
        dir = new THREE.Vector3();
    // angularDamping lowered from 4 — a spin now bleeds off more slowly, so
    // momentum from a drag-release or the idle torque below can actually
    // carry the card through a full rotation instead of dying out after a
    // quarter-turn. linearDamping (the swing/sway feel) is untouched.
    const segmentProps = { type: 'dynamic', canSleep: true, colliders: false, angularDamping: 3, linearDamping: 4 };
    // Strand bodies exist purely to give the strap mass and constraint
    // points — nothing in this scene should ever collide with them (the
    // chains are held together by joints alone), so they're placed in a
    // collision group that matches nothing. This also makes the two
    // strands' overlapping initial positions safely inert.
    const strandColliderProps = { args: [0.09], collisionGroups: interactionGroups(2, []) };
    const { nodes, materials } = useGLTF(cardGLB);
    // useTexture must be called unconditionally; use a blank pixel when an image
    // isn't supplied for a given face, then skip compositing it below.
    const frontTex = useTexture(frontImage || '/ME.jpeg');

    const [backCanvasTex, setBackCanvasTex] = useState(null);
    const { t, i18n } = useTranslation();
    const isArabic = i18n.language === 'ar';

    useEffect(() => {
        if (backImage) return;
        let cancelled = false;

        const traceRoundedRect = (ctx, x, y, w, h, r) => {
            ctx.beginPath();
            ctx.moveTo(x + r, y);
            ctx.arcTo(x + w, y, x + w, y + h, r);
            ctx.arcTo(x + w, y + h, x, y + h, r);
            ctx.arcTo(x, y + h, x, y, r);
            ctx.arcTo(x, y, x + w, y, r);
            ctx.closePath();
        };

        const draw = (img) => {
            if (cancelled) return;
            // 2x the old 512x720 baseline — the same canvas ends up resampled
            // into a fixed-size UV rect in the card's texture atlas, so extra
            // source resolution is what keeps the name/role text crisp rather
            // than soft on retina displays.
            const w = 1024, h = 1440;
            const c = document.createElement('canvas');
            c.width = w; c.height = h;
            const ctx = c.getContext('2d');

            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, w, h);

            // Portrait sits in its own framed, rounded area with margin on every
            // side — an ID-badge portrait, not an edge-to-edge photo — so it
            // reads as a deliberate focal element rather than a full-bleed crop.
            // ~15% larger than the original 680x780 frame (same aspect ratio,
            // derived from it rather than a second guessed number) so the
            // portrait reads as the clear focal point of the back face.
            const ORIGINAL_PORTRAIT_ASPECT = 680 / 780;
            const frameW = 780;
            const frameH = Math.round(frameW / ORIGINAL_PORTRAIT_ASPECT);
            const frameX = (w - frameW) / 2;
            const frameRadius = 36;

            // Name — the largest, primary text on the back face. Portrait
            // stays the dominant element; name is the clear secondary focus;
            // role is comfortably readable without competing with either. Both
            // use most of the card's printable width now instead of sitting in
            // a narrow column — SAFE_MARGIN is the only hard edge constraint;
            // fitFontSize below measures the actual rendered text and only
            // ever shrinks a size down from its target, so this stays correct
            // even if the translated name/role text changes length later.
            const name = t('hero.lanyard.name');
            const roleLine1 = t('hero.lanyard.roleLine1');
            const roleLine2 = t('hero.lanyard.roleLine2');
            const centerX = w / 2;
            const SAFE_MARGIN = 72;
            const printableWidth = w - SAFE_MARGIN * 2;

            const nameFont = size => (isArabic ? `700 ${size}px "Thmanyah Display", serif` : `bold ${size}px Georgia, serif`);
            const roleFont = size => (isArabic ? `600 ${size}px "Thmanyah Sans", sans-serif` : `500 ${size}px Inter, Arial, sans-serif`);
            const fitFontSize = (text, baseSize, fontBuilder) => {
                ctx.font = fontBuilder(baseSize);
                const measured = ctx.measureText(text).width;
                return measured > printableWidth ? baseSize * (printableWidth / measured) : baseSize;
            };

            const nameSize = fitFontSize(name, isArabic ? 92 : 104, nameFont);
            const roleBaseSize = isArabic ? 48 : 44;
            const roleSize = Math.min(
                fitFontSize(roleLine1, roleBaseSize, roleFont),
                fitFontSize(roleLine2, roleBaseSize, roleFont)
            );

            // Gap from the frame's bottom edge to the name's baseline, and from
            // the name's baseline down through both role lines — both grew
            // along with the type sizes above so the extra breathing room
            // scales with what it's separating, rather than staying fixed
            // while the text around it gets bigger.
            const frameToNameGap = 130;
            const roleGap1 = isArabic ? 80 : 68;
            const roleLineHeight = roleSize * (isArabic ? 1.5 : 1.35);
            // Rough descender clearance below the last role line's baseline —
            // enough to know where the text block visually ends, for centering.
            const roleDescender = roleSize * 0.28;

            const contentHeight = frameH + frameToNameGap + roleGap1 + roleLineHeight + roleDescender;
            const frameY = Math.round((h - contentHeight) / 2);
            const nameY = frameY + frameH + frameToNameGap;

            // Soft elevation behind the frame, matching the card's own
            // restrained, non-neon materials — scaled with the frame so it
            // reads the same relative weight as before, not thinner.
            ctx.save();
            ctx.shadowColor = 'rgba(0,0,0,0.16)';
            ctx.shadowBlur = 41;
            ctx.shadowOffsetY = 14;
            ctx.fillStyle = '#ffffff';
            traceRoundedRect(ctx, frameX, frameY, frameW, frameH, frameRadius);
            ctx.fill();
            ctx.restore();

            // Photo, cover-fit and clipped to the same rounded frame, top-biased
            // so a face/head is never cropped out.
            ctx.save();
            traceRoundedRect(ctx, frameX, frameY, frameW, frameH, frameRadius);
            ctx.clip();
            const scale = Math.max(frameW / img.width, frameH / img.height);
            const dw = img.width * scale;
            const dh = img.height * scale;
            const dx = frameX + (frameW - dw) / 2;
            const dy = frameY;
            ctx.drawImage(img, dx, dy, dw, dh);
            ctx.restore();

            // A subtle hairline frame on top of the photo edge.
            ctx.save();
            traceRoundedRect(ctx, frameX + 1.5, frameY + 1.5, frameW - 3, frameH - 3, frameRadius - 1.5);
            ctx.lineWidth = 3;
            ctx.strokeStyle = 'rgba(0,0,0,0.1)';
            ctx.stroke();
            ctx.restore();

            ctx.textAlign = 'center';
            ctx.fillStyle = '#111111';
            ctx.font = nameFont(nameSize);
            // A touch of tracking on the name only, Latin only — a classic
            // premium wordmark treatment that Arabic's cursive letter-joining
            // can't take (same reasoning as the hero terminal's ASCII banner
            // staying Latin-only: tracking out a joined script breaks its
            // letterforms rather than just spacing them).
            if ('letterSpacing' in ctx) ctx.letterSpacing = isArabic ? '0px' : '0.5px';
            ctx.fillText(name, centerX, nameY);
            if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';

            // Role — visibly smaller and lighter, never competing with the name.
            // Arabic needs noticeably more line-height than Latin here: Thmanyah's
            // taller ascenders/descenders collide at the same tight spacing that
            // reads fine for the English Inter lines (same lesson as the hero
            // terminal's banner/prompt sizing).
            ctx.fillStyle = '#666666';
            ctx.font = roleFont(roleSize);
            ctx.fillText(roleLine1, centerX, nameY + roleGap1);
            ctx.fillText(roleLine2, centerX, nameY + roleGap1 + roleLineHeight);

            const tex = new THREE.CanvasTexture(c);
            tex.colorSpace = THREE.SRGBColorSpace;
            tex.needsUpdate = true;
            // Release the previous back-face texture's GPU memory before
            // swapping in the new one (this effect re-runs on every
            // language switch).
            setBackCanvasTex(prev => {
                if (prev && prev !== tex) prev.dispose();
                return tex;
            });
        };

        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = '/ME.jpeg';
        img.onload = () => {
            // Thmanyah Display/Sans load async via @font-face — wait for the
            // fonts actually in use before drawing, so Arabic text never
            // silently falls back to the browser's default serif.
            const fontsReady = typeof document !== 'undefined' && document.fonts?.ready ? document.fonts.ready : Promise.resolve();
            fontsReady.then(() => draw(img));
        };

        return () => {
            cancelled = true;
        };
    }, [backImage, t, isArabic]);
    const backTex = useTexture(backImage || '/ME.jpeg');

    // Composite the front/back images into the card's texture atlas (front = left
    // half, back = right half). Each image is drawn aspect-preserving (no stretch).
    const cardMap = useMemo(() => {
        const baseMap = materials.base.map;
        if (!frontTex.image && !backImage && !backCanvasTex) return baseMap;

        const baseImg = baseMap.image;
        const W = baseImg.width;
        const H = baseImg.height;
        const canvas = document.createElement('canvas');
        canvas.width = W;
        canvas.height = H;
        const ctx = canvas.getContext('2d');
        if (!ctx) return baseMap;
        // Keep the original baked atlas for the card edges and any untouched face.
        ctx.drawImage(baseImg, 0, 0, W, H);

        const drawFitted = (img, rect) => {
            const rx = rect.x * W;
            const ry = rect.y * H;
            const rw = rect.w * W;
            const rh = rect.h * H;
            // always cover — fill the rect completely, no letterboxing
            const scale = Math.max(rw / img.width, rh / img.height);
            const dw = img.width * scale;
            const dh = img.height * scale;
            const dx = rx + (rw - dw) / 2;
            // bias to top so the face/head is visible rather than centered
            const dy = ry;
            ctx.save();
            ctx.beginPath();
            ctx.rect(rx, ry, rw, rh);
            ctx.clip();
            ctx.drawImage(img, dx, dy, dw, dh);
            ctx.restore();
        };

        // front face — white base first, then photo on top
        const frx = FRONT_UV_RECT.x * W;
        const fry = FRONT_UV_RECT.y * H;
        const frw = FRONT_UV_RECT.w * W;
        const frh = FRONT_UV_RECT.h * H;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(frx, fry, frw, frh);
        if (frontTex.image) drawFitted(frontTex.image, FRONT_UV_RECT);

        // back face
        if (backImage && backTex.image) {
            drawFitted(backTex.image, BACK_UV_RECT);
        } else if (backCanvasTex) {
            const rx = BACK_UV_RECT.x * W;
            const ry = BACK_UV_RECT.y * H;
            const rw = BACK_UV_RECT.w * W;
            const rh = BACK_UV_RECT.h * H;
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(rx, ry, rw, rh);
            ctx.drawImage(backCanvasTex.image, rx, ry, rw, rh);
        }

        const composite = new THREE.CanvasTexture(canvas);
        composite.colorSpace = THREE.SRGBColorSpace;
        composite.flipY = baseMap.flipY;
        composite.anisotropy = 16;
        composite.needsUpdate = true;
        return composite;
    }, [backImage, frontTex, backTex, backCanvasTex, materials.base.map]);

    // Dispose the composited atlas texture when it's replaced (deps above
    // change, e.g. language switch) or on unmount — it's a texture we
    // allocate here, not the shared glTF material map, so nothing else
    // frees it.
    useEffect(() => {
        const baseMap = materials.base.map;
        return () => {
            if (cardMap && cardMap !== baseMap && typeof cardMap.dispose === 'function') {
                cardMap.dispose();
            }
        };
    }, [cardMap, materials.base.map]);
    // One Catmull-Rom per strand, five control points each: fixed anchor,
    // the strand's three physics bodies (smoothed), and the shared
    // connector. Point order is anchor → connector so the sweep's `s`
    // parameter runs 0 at the mount and 1 at the card — which is what the
    // twist falloff in updateStrapGeometry keys off.
    const [curves] = useState(() => ({
        left: new THREE.CatmullRomCurve3(
            Array.from({ length: 5 }, () => new THREE.Vector3()), false, 'chordal'
        ),
        right: new THREE.CatmullRomCurve3(
            Array.from({ length: 5 }, () => new THREE.Vector3()), false, 'chordal'
        ),
    }));
    const [dragged, drag] = useState(false);
    const [hovered, hover] = useState(false);
    const idleStartedAt = useRef(null);
    // Torsion currently applied at the card end of both strands — eased
    // toward the card's live yaw every frame rather than snapped to it, so
    // twists wind up and dissipate gradually.
    const twistRef = useRef(0);

    const strapRings = isMobile ? STRAP_RINGS_MOBILE : STRAP_RINGS_DESKTOP;
    const strapRadial = isMobile ? STRAP_RADIAL_MOBILE : STRAP_RADIAL_DESKTOP;
    const strapGeoL = useMemo(() => createStrapGeometry(strapRings, strapRadial), [strapRings, strapRadial]);
    const strapGeoR = useMemo(() => createStrapGeometry(strapRings, strapRadial), [strapRings, strapRadial]);
    useEffect(() => () => {
        strapGeoL.dispose();
        strapGeoR.dispose();
    }, [strapGeoL, strapGeoR]);

    const strapHalfWidth = STRAP_HALF_WIDTH * lanyardWidth;
    const strapHalfThick = STRAP_HALF_THICK * lanyardWidth;

    // V-shape layout. hangLength is the vertical drop below the anchor
    // bodies and reproduces the old rope's totals — desktop 4×0.75, mobile
    // 4×0.54; the old [0,1,0] start-anchor lift is instead baked into the
    // anchors' own y=+1 positions in the JSX below, NOT added here too —
    // so the card still comes to rest at the same height as before. Each
    // strand is the hypotenuse from its own spread-out anchor down to that
    // meeting point. The two strands are deliberately NOT the same length:
    // a real hanging lanyard always sits a hair uneven, so the left strand
    // runs ~4% long (visible slack) against a near-taut right strand.
    const anchorSpread = isMobile ? 0.5 : 0.7;
    const hangLength = isMobile ? ropeScale * 2.16 : ropeScale * 3;
    const strandTotal = Math.hypot(hangLength, anchorSpread);
    const strandSegL = (strandTotal * 1.035) / 4;
    const strandSegR = (strandTotal * 0.995) / 4;

    const cardJointOffset = isMobile
        ? 2.1 * ropeScale
        : (1.65 + (cardScale - 2.25) * 0.9 + (cardY + 1.2)) * ropeScale;

    useRopeJoint(fixedL, l1, [[0, 0, 0], [0, 0, 0], strandSegL]);
    useRopeJoint(l1, l2, [[0, 0, 0], [0, 0, 0], strandSegL]);
    useRopeJoint(l2, l3, [[0, 0, 0], [0, 0, 0], strandSegL]);
    useRopeJoint(l3, connector, [[0, 0, 0], [0, 0, 0], strandSegL]);

    useRopeJoint(fixedR, r1, [[0, 0, 0], [0, 0, 0], strandSegR]);
    useRopeJoint(r1, r2, [[0, 0, 0], [0, 0, 0], strandSegR]);
    useRopeJoint(r2, r3, [[0, 0, 0], [0, 0, 0], strandSegR]);
    useRopeJoint(r3, connector, [[0, 0, 0], [0, 0, 0], strandSegR]);

    // The card hangs off the connector — the one place both strands and
    // the badge mechanically meet, exactly like a real clasp. A spherical
    // joint (a hinge point, not a weld) is what lets the badge yaw/pitch
    // under the clasp without the strands having to rigidly follow.
    useSphericalJoint(connector, card, [
        [0, 0, 0],
        [0, cardJointOffset, 0],
    ]);

    useEffect(() => {
        if (hovered) {
            document.body.style.cursor = dragged ? 'grabbing' : 'grab';
            return () => void (document.body.style.cursor = 'auto');
        }
    }, [hovered, dragged]);

    useFrame((state, delta) => {
        if (dragged) {
            idleStartedAt.current = state.clock.elapsedTime;

            vec.set(state.pointer.x, state.pointer.y, 0.5).unproject(state.camera);
            dir.copy(vec).sub(state.camera.position).normalize();
            vec.add(dir.multiplyScalar(state.camera.position.length()));
            [card, connector, l1, l2, l3, r1, r2, r3, fixedL, fixedR].forEach(ref => ref.current?.wakeUp());
            card.current?.setNextKinematicTranslation({ x: vec.x - dragged.x, y: vec.y - dragged.y, z: vec.z - dragged.z });
        }
        const bodiesReady = fixedL.current && fixedR.current
            && l1.current && l2.current && l3.current
            && r1.current && r2.current && r3.current
            && connector.current && card.current;
        if (bodiesReady) {
            const safeDelta = Number.isFinite(delta)
                ? THREE.MathUtils.clamp(delta, 0, MAX_ROPE_VISUAL_DELTA)
                : 0;
            const anchorLPos = fixedL.current.translation();
            const anchorRPos = fixedR.current.translation();
            const l1Pos = l1.current.translation();
            const l2Pos = l2.current.translation();
            const l3Pos = l3.current.translation();
            const r1Pos = r1.current.translation();
            const r2Pos = r2.current.translation();
            const r3Pos = r3.current.translation();
            const connectorPos = connector.current.translation();
            const ropePositionsAreValid = [
                anchorLPos, anchorRPos, l1Pos, l2Pos, l3Pos, r1Pos, r2Pos, r3Pos, connectorPos,
            ].every(isFiniteVector);

            if (ropePositionsAreValid) {
                // A real strap isn't equally slack everywhere along its
                // length — it's more restrained near where it's mounted and
                // has more give toward its free end. Per strand: the body
                // nearest the anchor settles fastest/stiffest, the one
                // nearest the clasp slowest/softest. The connector itself is
                // NEVER smoothed: it's the point the card physically hangs
                // from, and any added lag there would visibly detach the
                // strap from the badge's own motion.
                [
                    [l1, l1Pos, 1.25], [l2, l2Pos, 1], [l3, l3Pos, 0.78],
                    [r1, r1Pos, 1.25], [r2, r2Pos, 1], [r3, r3Pos, 0.78],
                ].forEach(([ref, position, speedMultiplier]) => {
                    if (!ref.current.lerped || !isFiniteVector(ref.current.lerped)) {
                        ref.current.lerped = new THREE.Vector3().copy(position);
                    }

                    const clampedDistance = THREE.MathUtils.clamp(
                        ref.current.lerped.distanceTo(position),
                        0.1,
                        1
                    );
                    const interpolationSpeed = (minSpeed + clampedDistance * (maxSpeed - minSpeed)) * speedMultiplier;
                    const interpolationAlpha = THREE.MathUtils.clamp(safeDelta * interpolationSpeed, 0, 1);
                    ref.current.lerped.lerp(position, interpolationAlpha);
                });

                curves.left.points[0].copy(anchorLPos);
                curves.left.points[1].copy(l1.current.lerped);
                curves.left.points[2].copy(l2.current.lerped);
                curves.left.points[3].copy(l3.current.lerped);
                curves.left.points[4].copy(connectorPos);

                curves.right.points[0].copy(anchorRPos);
                curves.right.points[1].copy(r1.current.lerped);
                curves.right.points[2].copy(r2.current.lerped);
                curves.right.points[3].copy(r3.current.lerped);
                curves.right.points[4].copy(connectorPos);

                // Torsion follows the badge's yaw, eased in over ~0.2s so a
                // spin winds the strap up and a stop lets it visibly relax
                // back — never an instant snap. The proxy for "how far
                // yawed" is the rotation quaternion's own y-component (the
                // same cheap trick the face-forward restoring torque below
                // already uses on this exact value) rather than an Euler
                // decomposition: Euler angles wrap at ±π, which the card's
                // own momentum can carry it through mid-spin (see the idle
                // torque below), and that wrap would show up here as
                // exactly the instant snap this is supposed to avoid. The
                // quaternion component has no such discontinuity and
                // naturally saturates instead of growing unboundedly,
                // which is also a closer match to how real fabric resists
                // torsion than a raw angle would be.
                const cardRotQ = card.current.rotation();
                if (isFiniteVector(cardRotQ)) {
                    const targetTwist = THREE.MathUtils.clamp(cardRotQ.y * 2.2, -1.1, 1.1);
                    twistRef.current += (targetTwist - twistRef.current) * Math.min(1, safeDelta * 5);
                }

                updateStrapGeometry(strapGeoL, curves.left, strapRadial, strapHalfWidth, strapHalfThick, twistRef.current);
                // Marginally different torsion on the second strand — the two
                // sides of a real lanyard never wind identically.
                updateStrapGeometry(strapGeoR, curves.right, strapRadial, strapHalfWidth, strapHalfThick, twistRef.current * 0.88);

                if (connectorMesh.current) {
                    connectorMesh.current.position.set(connectorPos.x, connectorPos.y, connectorPos.z);
                }
            }

            const cardAngularVelocity = card.current.angvel();
            const cardRotation = card.current.rotation();
            if (isFiniteVector(cardAngularVelocity) && isFiniteVector(cardRotation)) {
                ang.copy(cardAngularVelocity);
                rot.copy(cardRotation);

                // This is the badge's "face forward" restoring torque — the higher
                // this coefficient, the harder it pulls the card back toward
                // front-facing every frame, which is what was starving out full
                // rotations and back-side visibility. Weakened (not removed) so a
                // drag-release or idle-torque spin can actually carry the card
                // past 90°/180° before it gets reined back in, while it still
                // settles front-facing at rest — same as a real badge naturally
                // hangs, just with a lot more freedom to swing through on the way.
                card.current.setAngvel({
                    x: ang.x,
                    y: ang.y - rot.y * 0.1,
                    z: ang.z
                });
            }

            /* Idle physics motion - keeps the card alive after initial drop */
            if (!dragged && card.current) {
                if (idleStartedAt.current === null) {
                    idleStartedAt.current = state.clock.elapsedTime;
                }

                const idleAge = state.clock.elapsedTime - idleStartedAt.current;

                /*
                  Wait a bit so the card finishes the initial drop first.
                  Then apply tiny physical torque forever.
                */
                if (idleAge > 1.4) {
                    const t = state.clock.elapsedTime;

                    card.current.wakeUp();

                    // Modestly stronger than before (paired with the weaker
                    // face-forward restoring torque above) — enough for real
                    // rotational momentum to build up over time and
                    // occasionally carry into a full spin, without reading as
                    // continuous or jittery; still a slow, gentle sine/cosine
                    // drift, just with more energy behind it.
                    card.current.applyTorqueImpulse(
                        {
                            x: Math.sin(t * 0.85) * (isMobile ? 0.0024 : 0.0032),
                            y: Math.cos(t * 0.65) * (isMobile ? 0.0016 : 0.0022),
                            z: Math.sin(t * 0.95) * (isMobile ? 0.0019 : 0.0025),
                        },
                        true
                    );
                }
            }
        }

        // project card to screen coords and move hit zone + enable canvas events on hover
        const canvas = state.gl.domElement;

        canvas.style.pointerEvents = 'auto';
        canvas.style.touchAction = dragged ? 'none' : (isMobile ? 'pan-y' : 'auto');

    });

    return (
        <>
            <group

                ref={anchorGroup}

                position={[anchorOffsetX, anchorY, 0]}
            >
                {/* Two fixed mounts, spread apart — the top of the V. The left
                    one hangs a hair higher: real lanyards are never mounted
                    perfectly level, and this seeds the natural asymmetry the
                    unequal strand lengths continue below. */}
                <RigidBody ref={fixedL} {...segmentProps} type="kinematicPosition" position={[-anchorSpread, isMobile ? 0.06 : 1.06, 0]} />
                <RigidBody ref={fixedR} {...segmentProps} type="kinematicPosition" position={[anchorSpread, isMobile ? 0 : 1, 0]} />

                {/* Strand bodies start fanned along each side; gravity pulls
                    them into the V on the first frames — the same "drop in"
                    the single rope had. Their colliders match nothing (see
                    strandColliderProps), so the two chains can cross and
                    converge freely without contact jitter. */}
                <RigidBody position={[-anchorSpread * 0.75, 0, 0]} ref={l1} {...segmentProps}>
                    <BallCollider {...strandColliderProps} />
                </RigidBody>
                <RigidBody position={[-anchorSpread * 0.5, 0, 0]} ref={l2} {...segmentProps}>
                    <BallCollider {...strandColliderProps} />
                </RigidBody>
                <RigidBody position={[-anchorSpread * 0.25, 0, 0]} ref={l3} {...segmentProps}>
                    <BallCollider {...strandColliderProps} />
                </RigidBody>
                <RigidBody position={[anchorSpread * 0.75, 0, 0]} ref={r1} {...segmentProps}>
                    <BallCollider {...strandColliderProps} />
                </RigidBody>
                <RigidBody position={[anchorSpread * 0.5, 0, 0]} ref={r2} {...segmentProps}>
                    <BallCollider {...strandColliderProps} />
                </RigidBody>
                <RigidBody position={[anchorSpread * 0.25, 0, 0]} ref={r3} {...segmentProps}>
                    <BallCollider {...strandColliderProps} />
                </RigidBody>

                <RigidBody position={[0, -0.25, 0]} ref={connector} {...segmentProps}>
                    <BallCollider args={[0.05]} collisionGroups={interactionGroups(2, [])} />
                </RigidBody>

                <RigidBody position={[1.2, -0.4, 0]} ref={card} {...segmentProps} type={dragged ? 'kinematicPosition' : 'dynamic'}>
                    <CuboidCollider args={[0.8, 1.125, 0.01]} />
                    <group
                        scale={cardScale}
                        position={[0, cardY, -0.05]}
                        onPointerOver={e => {
                            if (e.pointerType === 'mouse') hover(true);
                        }}
                        onPointerOut={e => {
                            if (e.pointerType === 'mouse') hover(false);
                        }}
                        onPointerUp={e => {
                            if (e.pointerType !== 'mouse') return;
                            if (e.target.hasPointerCapture?.(e.pointerId)) {
                                e.target.releasePointerCapture(e.pointerId);
                            }
                            drag(false);
                        }}
                        onPointerCancel={e => {
                            if (e.pointerType !== 'mouse') return;
                            if (e.target.hasPointerCapture?.(e.pointerId)) {
                                e.target.releasePointerCapture(e.pointerId);
                            }
                            drag(false);
                        }}
                        onPointerDown={e => {
                            if (e.pointerType !== 'mouse') return;

                            e.target.setPointerCapture(e.pointerId);
                            drag(new THREE.Vector3().copy(e.point).sub(vec.copy(card.current.translation())));
                        }}
                    >
                        <mesh geometry={nodes.card.geometry}>
                            <meshPhysicalMaterial
                                map={cardMap}
                                map-anisotropy={16}
                                clearcoat={isMobile ? 0 : 1}
                                clearcoatRoughness={0.15}
                                roughness={0.9}
                                metalness={0.8}
                            />
                        </mesh>
                        <mesh geometry={nodes.clip.geometry} material={materials.metal} material-roughness={0.3} renderOrder={2} />
                        <mesh geometry={nodes.clamp.geometry} material={materials.metal} renderOrder={2} />
                    </group>
                </RigidBody>
            </group>
            {/* The straps render in world space (their vertex positions come
                straight from body translations), so they live outside the
                anchor group at identity transform. frustumCulled off because
                positions stream in-place — the stale bounding sphere would
                let the camera cull a mid-swing strap. Matte, high-roughness,
                near-zero-metalness material is the woven-fabric read; the
                Environment lightformers give the rounded edges their sheen. */}
            <mesh geometry={strapGeoL} frustumCulled={false}>
                <meshStandardMaterial color="#1a1a1a" roughness={0.88} metalness={0.04} side={THREE.DoubleSide} />
            </mesh>
            <mesh geometry={strapGeoR} frustumCulled={false}>
                <meshStandardMaterial color="#1a1a1a" roughness={0.88} metalness={0.04} side={THREE.DoubleSide} />
            </mesh>
            {/* The clasp: a small polished-metal bead at the exact physics
                point where both strands and the card's own joint meet. It's
                what visually closes the V — both strap ends terminate inside
                it, so there's no floating end or hard intersection at the
                junction. Position follows the connector body every frame. */}
            <mesh ref={connectorMesh} frustumCulled={false}>
                <sphereGeometry args={[0.075, 20, 14]} />
                <meshStandardMaterial color="#26262b" roughness={0.32} metalness={0.85} />
            </mesh>
        </>
    );
}
