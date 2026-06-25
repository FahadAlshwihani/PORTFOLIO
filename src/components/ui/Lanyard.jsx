/* eslint-disable react/no-unknown-property */
'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, extend, useFrame } from '@react-three/fiber';
import { useGLTF, useTexture, Environment, Lightformer } from '@react-three/drei';
import { BallCollider, CuboidCollider, Physics, RigidBody, useRopeJoint, useSphericalJoint } from '@react-three/rapier';
import { MeshLineGeometry, MeshLineMaterial } from 'meshline';

// replace with your own imports, see the usage snippet for details
import * as THREE from 'three';
import lanyardTexture from '../assets/lanyard/lanyard.png'; // TODO: replace with your logo image
import cardGLB from '../assets/lanyard/card.glb';
import '../../styles/ui/Lanyard.css';

extend({ MeshLineGeometry, MeshLineMaterial });

// 1x1 transparent pixel — lets useTexture be called unconditionally when a
// front/back image isn't supplied.
const createBlankTexture = () => {
    const tex = new THREE.DataTexture(new Uint8Array([0, 0, 0, 0]), 1, 1, THREE.RGBAFormat);
    tex.needsUpdate = true;
    return tex;
};

// The card model's front face is UV-mapped to the LEFT half of the texture
// atlas and the back face to the RIGHT half (measured from card.glb). Each
// custom image is composited into its own half so the two faces render
// independently, aspect-preserving (no stretching).
const FRONT_UV_RECT = { x: 0, y: 0, w: 0.5, h: 0.755 };
const BACK_UV_RECT = { x: 0.5, y: 0, w: 0.5, h: 0.757 };

export default function Lanyard({
    position = [0, 0, 30],
    gravity = [0, -40, 0],
    fov = 20,
    transparent = true,
    frontImage = null,
    backImage = null,
    imageFit = 'cover',
    lanyardImage = null,
    lanyardWidth = 1
}) {
    const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

const hitRef = useRef(null);

  return (
    <div className="lanyard-wrapper">
      <div ref={hitRef} className="lanyard-hit-zone" />
      <Canvas
        camera={{ position: position, fov: fov }}
        dpr={[1, isMobile ? 1.5 : 2]}
        gl={{ alpha: transparent }}
        style={{ pointerEvents: 'none' }}
        onCreated={({ gl }) => gl.setClearColor(0x000000, transparent ? 0 : 1)}
      >
                <ambientLight intensity={Math.PI} />
<Physics gravity={gravity} timeStep={isMobile ? 1 / 30 : 1 / 60}>
          <Band
            isMobile={isMobile}
            frontImage={frontImage}
            backImage={backImage}
            imageFit={imageFit}
            lanyardImage={lanyardImage}
            lanyardWidth={lanyardWidth}
            hitRef={hitRef}
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
  hitRef = { current: null }
}) {
    const band = useRef(),
        fixed = useRef(),
        j1 = useRef(),
        j2 = useRef(),
        j3 = useRef(),
        card = useRef();
    const vec = new THREE.Vector3(),
        ang = new THREE.Vector3(),
        rot = new THREE.Vector3(),
        dir = new THREE.Vector3();
    const segmentProps = { type: 'dynamic', canSleep: true, colliders: false, angularDamping: 4, linearDamping: 4 };
    const { nodes, materials } = useGLTF(cardGLB);
    const texture = useTexture(lanyardImage || lanyardTexture);
    // useTexture must be called unconditionally; use a blank pixel when an image
    // isn't supplied for a given face, then skip compositing it below.
    const frontTex = useTexture(frontImage || '/ME.jpeg');

    const [backCanvasTex, setBackCanvasTex] = useState(null);

    useEffect(() => {
        if (backImage) return;
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = '/ME.jpeg';
        img.onload = () => {
            const w = 512, h = 720;
            const c = document.createElement('canvas');
            c.width = w; c.height = h;
            const ctx = c.getContext('2d');

            // fully white background — no stripes anywhere
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, w, h);

            // photo area — cover fill top 62%, no gap at top
            const photoH = Math.floor(h * 0.70);
            const photoY = 0;
            const scale = Math.max(w / img.width, photoH / img.height);
            const dw = img.width * scale;
            const dh = img.height * scale;
            const dx = (w - dw) / 2;
            // bias toward top of photo (faces/portraits)
            const dy = photoY;
            ctx.save();
            ctx.beginPath();
            ctx.rect(0, photoY, w, photoH);
            ctx.clip();
            ctx.drawImage(img, dx, dy, dw, dh);
            ctx.restore();

            // subtle shadow under photo into text area
            const shadowGrad = ctx.createLinearGradient(0, photoH - 20, 0, photoH + 20);
            shadowGrad.addColorStop(0, 'rgba(0,0,0,0.08)');
            shadowGrad.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = shadowGrad;
            ctx.fillRect(0, photoH - 20, w, 40);

            // name
            const textY = photoH + 44;
            ctx.fillStyle = '#111111';
            ctx.font = 'bold 36px Georgia, serif';
            ctx.textAlign = 'left';
            ctx.fillText('Fahad Al-Shwihani', 36, textY);

            // title
            ctx.fillStyle = '#666666';
            ctx.font = '400 24px Inter, Arial, sans-serif';
            ctx.fillText('Full-Stack &', 36, textY + 42);
            ctx.fillText('IT Infrastructure Engineer', 36, textY + 74);

            const tex = new THREE.CanvasTexture(c);
            tex.colorSpace = THREE.SRGBColorSpace;
            tex.needsUpdate = true;
            setBackCanvasTex(tex);
        };
    }, [backImage]);
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
    }, [frontImage, backImage, imageFit, frontTex, backTex, backCanvasTex, materials.base.map]); const [curve] = useState(
        () =>
            new THREE.CatmullRomCurve3([new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()])
    );
    const [dragged, drag] = useState(false);
    const [hovered, hover] = useState(false);

    useRopeJoint(fixed, j1, [[0, 0, 0], [0, 0, 0], 1]);
    useRopeJoint(j1, j2, [[0, 0, 0], [0, 0, 0], 1]);
    useRopeJoint(j2, j3, [[0, 0, 0], [0, 0, 0], 1]);
    useSphericalJoint(j3, card, [
        [0, 0, 0],
        [0, 1.5, 0]
    ]);

    useEffect(() => {
        if (hovered) {
            document.body.style.cursor = dragged ? 'grabbing' : 'grab';
            return () => void (document.body.style.cursor = 'auto');
        }
    }, [hovered, dragged]);

    useFrame((state, delta) => {
        if (dragged) {
            vec.set(state.pointer.x, state.pointer.y, 0.5).unproject(state.camera);
            dir.copy(vec).sub(state.camera.position).normalize();
            vec.add(dir.multiplyScalar(state.camera.position.length()));
            [card, j1, j2, j3, fixed].forEach(ref => ref.current?.wakeUp());
            card.current?.setNextKinematicTranslation({ x: vec.x - dragged.x, y: vec.y - dragged.y, z: vec.z - dragged.z });
        }
        if (fixed.current) {
            [j1, j2].forEach(ref => {
                if (!ref.current.lerped) ref.current.lerped = new THREE.Vector3().copy(ref.current.translation());
                const clampedDistance = Math.max(0.1, Math.min(1, ref.current.lerped.distanceTo(ref.current.translation())));
                ref.current.lerped.lerp(
                    ref.current.translation(),
                    delta * (minSpeed + clampedDistance * (maxSpeed - minSpeed))
                );
            });
            curve.points[0].copy(j3.current.translation());
            curve.points[1].copy(j2.current.lerped);
            curve.points[2].copy(j1.current.lerped);
            curve.points[3].copy(fixed.current.translation());
            band.current.geometry.setPoints(curve.getPoints(isMobile ? 16 : 32));
ang.copy(card.current.angvel());
      rot.copy(card.current.rotation());
      card.current.setAngvel({ x: ang.x, y: ang.y - rot.y * 0.25, z: ang.z });
    }

    // project card position to screen and move hit zone
    if (card.current && hitRef.current) {
      const pos = new THREE.Vector3();
      card.current.getWorldPosition ? card.current.getWorldPosition(pos) : pos.copy(card.current.translation());
      const translation = card.current.translation();
      pos.set(translation.x, translation.y, translation.z);
      pos.project(state.camera);
      const x = (pos.x * 0.5 + 0.5) * state.size.width;
      const y = (-pos.y * 0.5 + 0.5) * state.size.height;
      hitRef.current.style.left = `${x - 80}px`;
      hitRef.current.style.top = `${y - 120}px`;
    }
  });

    curve.curveType = 'chordal';
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;

    return (
        <>
            <group position={[0, 4, 0]}>
                <RigidBody ref={fixed} {...segmentProps} type="fixed" />
                <RigidBody position={[0.5, 0, 0]} ref={j1} {...segmentProps}>
                    <BallCollider args={[0.1]} />
                </RigidBody>
                <RigidBody position={[1, 0, 0]} ref={j2} {...segmentProps}>
                    <BallCollider args={[0.1]} />
                </RigidBody>
                <RigidBody position={[1.5, 0, 0]} ref={j3} {...segmentProps}>
                    <BallCollider args={[0.1]} />
                </RigidBody>
                <RigidBody position={[2, 0, 0]} ref={card} {...segmentProps} type={dragged ? 'kinematicPosition' : 'dynamic'}>
                    <CuboidCollider args={[0.8, 1.125, 0.01]} />
<group
            scale={2.25}
            position={[0, -1.2, -0.05]}
            onPointerOver={() => hover(true)}
            onPointerOut={() => hover(false)}
            onPointerUp={e => (e.target.releasePointerCapture(e.pointerId), drag(false))}
            onPointerDown={e => (
              e.target.setPointerCapture(e.pointerId),
              drag(new THREE.Vector3().copy(e.point).sub(vec.copy(card.current.translation())))
            )}
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
                        <mesh geometry={nodes.clip.geometry} material={materials.metal} material-roughness={0.3} />
                        <mesh geometry={nodes.clamp.geometry} material={materials.metal} />
                    </group>
                </RigidBody>
            </group>
            <mesh ref={band}>
                <meshLineGeometry />
                <meshLineMaterial
                    color="white"
                    depthTest={false}
                    resolution={isMobile ? [1000, 2000] : [1000, 1000]}
                    useMap
                    map={texture}
                    repeat={[-4, 1]}
                    lineWidth={lanyardWidth}
                />
            </mesh>
        </>
    );
}
