/* eslint-disable react/no-unknown-property */
'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Canvas, extend, useFrame } from '@react-three/fiber';
import { useGLTF, useTexture, Environment, Lightformer } from '@react-three/drei';
import { BallCollider, CuboidCollider, Physics, RigidBody, useRopeJoint, useSphericalJoint } from '@react-three/rapier';
import { MeshLineGeometry, MeshLineMaterial } from 'meshline';

// replace with your own imports, see the usage snippet for details
import * as THREE from 'three';
import lanyardTexture from '../../../assets/models/lanyard/lanyard.png'; // TODO: replace with your logo image
import cardGLB from '../../../assets/models/lanyard/card.glb';
import { usePerformanceTier } from '../../../hooks/usePerformanceTier';
import useInViewport from '../../../hooks/useInViewport';
import './Lanyard.css';

extend({ MeshLineGeometry, MeshLineMaterial });

// MeshLine smoothing is visual-only and must never extrapolate after a
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
    lanyardImage = null,
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
        const updateScene = () => {

            const w = window.innerWidth;

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

        updateScene();

        window.addEventListener("resize", updateScene);

        return () => window.removeEventListener("resize", updateScene);
        // dir is derived from the rtl prop; this component isn't currently
        // passed a live-changing rtl value anywhere, so recomputing only on
        // resize (not on dir change) matches existing behavior exactly.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
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
                        lanyardImage={lanyardImage}
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

    lanyardImage = null,

    lanyardWidth = 1,

    anchorOffsetX = 2.5,

    anchorY = 4,

    cardScale = 2.25,

    cardY = -1.2,

    ropeScale = 1

}) {
    const band = useRef(),
        fixed = useRef(),
        j1 = useRef(),
        j2 = useRef(),
        j3 = useRef(),
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
    const { nodes, materials } = useGLTF(cardGLB);
    const texture = useTexture(lanyardImage || lanyardTexture);
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
            setBackCanvasTex(tex);
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
    }, [backImage, frontTex, backTex, backCanvasTex, materials.base.map]); const [curve] = useState(
        () =>
            new THREE.CatmullRomCurve3([new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()])
    );
    const [dragged, drag] = useState(false);
    const [hovered, hover] = useState(false);
    const idleStartedAt = useRef(null);

    const ropeSegments = [
        0.5 * ropeScale,
        1.0 * ropeScale,
        1.5 * ropeScale,
        2.0 * ropeScale
    ];

    const ropeLength = isMobile
        ? ropeScale * 0.72
        : ropeScale;

    const cardJointOffset = isMobile
        ? 2.1 * ropeScale
        : (1.65 + (cardScale - 2.25) * 0.9 + (cardY + 1.2)) * ropeScale;

    const ropeStartAnchor = isMobile
        ? [0, 0, 0]
        : [0, 1, 0];

    useRopeJoint(
        fixed,
        j1,
        [ropeStartAnchor, [0, 0, 0], ropeLength]
    );

    useRopeJoint(
        j1,
        j2,
        [[0, 0, 0], [0, 0, 0], ropeLength]
    );

    useRopeJoint(
        j2,
        j3,
        [[0, 0, 0], [0, 0, 0], ropeLength]
    );

    useSphericalJoint(j3, card, [
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
            [card, j1, j2, j3, fixed].forEach(ref => ref.current?.wakeUp());
            card.current?.setNextKinematicTranslation({ x: vec.x - dragged.x, y: vec.y - dragged.y, z: vec.z - dragged.z });
        }
        if (fixed.current && j1.current && j2.current && j3.current && card.current && band.current) {
            const safeDelta = Number.isFinite(delta)
                ? THREE.MathUtils.clamp(delta, 0, MAX_ROPE_VISUAL_DELTA)
                : 0;
            const fixedPosition = fixed.current.translation();
            const j1Position = j1.current.translation();
            const j2Position = j2.current.translation();
            const j3Position = j3.current.translation();
            const ropePositionsAreValid = [fixedPosition, j1Position, j2Position, j3Position]
                .every(isFiniteVector);

            if (ropePositionsAreValid) {
                [[j1, j1Position], [j2, j2Position]].forEach(([ref, position]) => {
                    if (!ref.current.lerped || !isFiniteVector(ref.current.lerped)) {
                        ref.current.lerped = new THREE.Vector3().copy(position);
                    }

                    const clampedDistance = THREE.MathUtils.clamp(
                        ref.current.lerped.distanceTo(position),
                        0.1,
                        1
                    );
                    const interpolationSpeed = minSpeed + clampedDistance * (maxSpeed - minSpeed);
                    const interpolationAlpha = THREE.MathUtils.clamp(safeDelta * interpolationSpeed, 0, 1);
                    ref.current.lerped.lerp(position, interpolationAlpha);
                });

                curve.points[0].copy(j3Position);
                curve.points[1].copy(j2.current.lerped);
                curve.points[2].copy(j1.current.lerped);
                curve.points[3].copy(fixedPosition);
                band.current.geometry.setPoints(curve.getPoints(isMobile ? 16 : 32));
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

    curve.curveType = 'chordal';
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;

    return (
        <>
            <group

                ref={anchorGroup}

                position={[anchorOffsetX, anchorY, 0]}
            >
                <RigidBody ref={fixed} {...segmentProps} type="kinematicPosition" />
                <RigidBody position={[ropeSegments[0], 0, 0]} ref={j1} {...segmentProps}>
                    <BallCollider args={[0.1]} />
                </RigidBody>
                <RigidBody position={[ropeSegments[1], 0, 0]} ref={j2} {...segmentProps}>
                    <BallCollider args={[0.1]} />
                </RigidBody>
                <RigidBody position={[ropeSegments[2], 0, 0]} ref={j3} {...segmentProps}>
                    <BallCollider args={[0.1]} />
                </RigidBody>
                <RigidBody position={[ropeSegments[3], 0, 0]} ref={card} {...segmentProps} type={dragged ? 'kinematicPosition' : 'dynamic'}>
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
            <mesh ref={band}>
                <meshLineGeometry />
                {/* <meshLineMaterial
                    color="black"
                    depthTest={false}
                    resolution={isMobile ? [1000, 2000] : [1000, 1000]}
                    useMap
                    map={texture}
                    repeat={[-4, 1]}
                    lineWidth={lanyardWidth}
                /> */}
                <meshLineMaterial
                    depthTest={false}
                    resolution={isMobile ? [1000, 2000] : [1000, 1000]}
                    lineWidth={lanyardWidth}
                    color="#1a1a1a"
                />
            </mesh>
        </>
    );
}
