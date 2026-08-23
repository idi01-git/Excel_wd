// src/components/sections/hardback/HardbackScene.tsx
'use client';

import React, { useRef, Suspense, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { ContactShadows, Environment, Lightformer } from '@react-three/drei';
import * as THREE from 'three';
import { Book } from './Book';
import {
  BOOKS,
  BookData,
  SHELF_PITCH,
  COVER_PADDING,
  COVER_Z_LIFT,
  SHELF_Y,
  OPEN_POS_X,
  OPEN_POS_Y,
  OPEN_POS_Z,
  OPEN_ANGLE,
  OPEN_TILT_X,
  FALL_DEPTH,
  SHELF_OPEN_Y,
  SHELF_OPEN_Z,
  SLIDER_APPROACH,
} from './hardback-data';

// Responsive offsets for mobile
const MOBILE_OPEN_POS_X = -0.05;
const MOBILE_OPEN_POS_Y = -1.25;
const MOBILE_OPEN_POS_Z = 1.35;

// Constants for entrance animation
const ENTRANCE_DURATION = 2.0;
const ENTRANCE_STAGGER = 0.055;
const ENTRY_FROM_X = 14;
const ENTRY_FROM_Z = -5;
const ENTRY_FROM_Y_OFFSET = 0.6;

// ── Math & Easing Helpers ───────────────────────────────────────────────────
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const easeInOutSine = (t: number) => -(Math.cos(Math.PI * t) - 1) / 2;
const easeInOutCubic = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4);
const smoothstep = (t: number, a: number, b: number) => {
  const x = clamp01((t - a) / (b - a));
  return x * x * (3 - 2 * x);
};
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/**
 * Continuous shelf layout with fractional coverness
 */
function layoutShelf(position: number, books: BookData[] = BOOKS) {
  const N = books.length;
  // Strictly clamp position to [0, N - 1] so fractional coverness and anchor never drift beyond bounds
  const clampedPos = Math.max(0, Math.min(N - 1, position));
  const widths: number[] = [];
  const cov: number[] = [];

  for (let i = 0; i < N; i++) {
    const relP = i - clampedPos;
    const c = Math.max(0, 1 - Math.abs(relP));
    cov.push(c);
    const expanded = books[i].width + COVER_PADDING;
    widths.push(SHELF_PITCH + (expanded - SHELF_PITCH) * c);
  }

  const lefts: number[] = [0];
  for (let i = 1; i < N; i++) lefts.push(lefts[i - 1] + widths[i - 1]);
  const centres = widths.map((w, i) => lefts[i] + w / 2);

  // Anchor: x value at the slider's current fractional position
  const lo = Math.floor(clampedPos);
  const hi = Math.min(N - 1, lo + 1);
  const frac = clampedPos - lo;
  const safeLo = Math.max(0, Math.min(N - 1, lo));
  const safeHi = Math.max(0, Math.min(N - 1, hi));
  const anchor = lerp(centres[safeLo] || 0, centres[safeHi] || centres[safeLo] || 0, frac);

  return {
    centres,
    covernesses: cov,
    anchor,
  };
}

/**
 * Recursively applies opacity to meshes in a group
 */
/**
 * Recursively applies opacity to meshes in a group and fades shadows
 */
function applyGroupOpacity(group: THREE.Group, opacity: number) {
  const isHidden = opacity <= 0.01;
  group.visible = !isHidden;
  group.traverse((obj) => {
    if (obj instanceof THREE.Mesh) {
      // Disable shadow casting as soon as the book begins receding and fading
      obj.castShadow = opacity > 0.5;
      if (obj.material) {
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
        for (const m of mats) {
          if (m && 'opacity' in m) {
            (m as any).opacity = opacity;
            (m as any).transparent = true;
          }
        }
      }
    }
  });
}

// ── Camera Rig ──────────────────────────────────────────────────────────────
function CameraRig() {
  const { camera } = useThree();
  useEffect(() => {
    camera.lookAt(0, -0.4, 0);
  }, [camera]);
  return null;
}

// ── Lighting Rig ────────────────────────────────────────────────────────────
function StudioLights({ isDark }: { isDark: boolean }) {
  return (
    <>
      <ambientLight
        intensity={isDark ? 0.42 : 0.78}
        color={isDark ? '#ffead0' : '#fff5e8'}
      />

      <directionalLight
        position={[5, 7, 6]}
        intensity={isDark ? 1.45 : 1.1}
        color={isDark ? '#ffd9a8' : '#fff2d8'}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-14}
        shadow-camera-right={14}
        shadow-camera-top={8}
        shadow-camera-bottom={-8}
        shadow-camera-near={0.1}
        shadow-camera-far={30}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
        shadow-radius={14}
        shadow-blurSamples={25}
      />

      <directionalLight
        position={[-6, 4, 3]}
        intensity={isDark ? 0.4 : 0.55}
        color="#b8d0e8"
      />
      <pointLight
        position={[0, -3, 4]}
        intensity={isDark ? 0.35 : 0.25}
        color="#ffc89a"
      />

      <Environment resolution={256}>
        <Lightformer
          form="rect"
          intensity={isDark ? 1.4 : 1.8}
          color="#ffe5cc"
          position={[0, 6, 4]}
          scale={[10, 4, 1]}
        />
        <Lightformer
          form="rect"
          intensity={isDark ? 0.9 : 1.2}
          color="#dee8f5"
          position={[-7, 2, 3]}
          scale={[5, 6, 1]}
        />
        <Lightformer
          form="rect"
          intensity={isDark ? 0.7 : 1.0}
          color="#fff0e0"
          position={[7, 0, -2]}
          scale={[4, 6, 1]}
        />
      </Environment>
    </>
  );
}

// ── Book Manager with Single Frame Loop ──────────────────────────────────────
interface BookManagerProps {
  books: BookData[];
  positionRef: React.MutableRefObject<number>;
  targetRef: React.MutableRefObject<number>;
  modeRef: React.MutableRefObject<string>;
  selectedIndexRef: React.MutableRefObject<number>;
  openProgressRef: React.MutableRefObject<number>;
  enterProgressRef: React.MutableRefObject<number>;
  hoverIndexRef: React.MutableRefObject<number>;
  groupRefs: React.MutableRefObject<(THREE.Group | null)[]>;
  pivotRefs: React.MutableRefObject<(THREE.Group | null)[]>;
  shelfGroupRef: React.MutableRefObject<THREE.Group | null>;
  isMobile: boolean;
}

function BookManager({
  books,
  positionRef,
  targetRef,
  modeRef,
  selectedIndexRef,
  openProgressRef,
  enterProgressRef,
  hoverIndexRef,
  groupRefs,
  pivotRefs,
  shelfGroupRef,
  isMobile,
}: BookManagerProps) {
  const N = books.length;
  const hoverProgressRef = useRef<number[]>(new Array(N).fill(0));

  useFrame(() => {
    const mode = modeRef.current;
    const selectedIdx = selectedIndexRef.current;
    const openProgress = openProgressRef.current;
    const enterProgress = enterProgressRef.current;
    const hoverIdx = hoverIndexRef.current;

    // 1. Slider Physics: Exponential Decay (No spring, no overshoot)
    if (mode === 'browsing') {
      const maxIndex = Math.max(0, N - 1);
      const target = Math.max(0, Math.min(maxIndex, targetRef.current));
      targetRef.current = target;
      const pos = positionRef.current;
      const dx = target - pos;
      if (Math.abs(dx) < 0.0005) {
        positionRef.current = target;
      } else {
        positionRef.current = Math.max(0, Math.min(maxIndex, pos + dx * SLIDER_APPROACH));
      }
    }

    const currentPos = positionRef.current;
    const { centres, covernesses, anchor } = layoutShelf(currentPos, books);

    // Target coordinates for open book
    const openX = isMobile ? MOBILE_OPEN_POS_X : OPEN_POS_X;
    const openY = isMobile ? MOBILE_OPEN_POS_Y : OPEN_POS_Y;
    const openZ = isMobile ? MOBILE_OPEN_POS_Z : OPEN_POS_Z;

    // 2. Iterate each book and calculate physical transforms
    for (let i = 0; i < N; i++) {
      const g = groupRefs.current[i];
      const pivot = pivotRefs.current[i];
      if (!g) continue;

      const book = books[i];
      const cov = covernesses[i];
      const shelfX = centres[i] - anchor;
      const shelfY = book.height / 2 + SHELF_Y;
      const shelfZ = COVER_Z_LIFT * cov;
      // POSITIVE π/2 for spine-forward so spine title faces camera
      const shelfRotY = Math.PI * 0.5 * (1 - cov);

      let x = shelfX;
      let y = shelfY;
      let z = shelfZ;
      let rotX = 0;
      let rotY = shelfRotY;
      let openAngle = 0;
      let bookOpacity = 1.0;

      // ── ENTRANCE ANIMATION ──────────────────────────────
      if (mode === 'entering') {
        const startSec = i * ENTRANCE_STAGGER;
        const perBookEnter = Math.max(
          0.4,
          ENTRANCE_DURATION - (N - 1) * ENTRANCE_STAGGER
        );
        const localT = clamp01(
          (enterProgress * ENTRANCE_DURATION - startSec) / perBookEnter
        );

        const easedPos = easeInOutSine(localT);
        x = lerp(ENTRY_FROM_X, shelfX, easedPos);
        y = lerp(SHELF_Y + ENTRY_FROM_Y_OFFSET, shelfY, easedPos);
        z = lerp(ENTRY_FROM_Z, shelfZ, easedPos);

        const rotEased = localT * localT; // easeInQuad (late-biased swing)
        rotY = lerp(0, shelfRotY, rotEased);
      }

      // ── OPEN / CLOSE ANIMATION ──────────────────────────
      else if (mode === 'opening' || mode === 'open' || mode === 'closing') {
        if (i === selectedIdx) {
          // Selected book: glide to OPEN_POS, tilt back, swing front cover
          const moveT = smoothstep(openProgress, 0.0, 0.6);
          const openT = smoothstep(openProgress, 0.45, 1.0);

          x = lerp(shelfX, openX, moveT);
          y = lerp(shelfY, openY + book.height / 2, moveT);
          z = lerp(shelfZ, openZ, moveT);
          rotY = lerp(shelfRotY, 0, moveT); // -> cover-forward
          rotX = lerp(0, OPEN_TILT_X, moveT); // tip back
          openAngle = OPEN_ANGLE * easeInOutCubic(openT);
        } else {
          // Other books: step back into -Z, fade alpha, settle dip
          const dist = Math.abs(i - selectedIdx);
          const startOffset = clamp01(0.04 * dist);
          const fadeT = smoothstep(openProgress, startOffset, startOffset + 0.55);
          z = shelfZ - FALL_DEPTH * easeOutQuart(fadeT);
          rotX = -0.18 * fadeT;
          bookOpacity = 1 - fadeT;
        }
      }

      // ── HOVER EASING ───────────────────────────────────
      const wantsHover =
        (mode === 'browsing' || mode === 'entering') &&
        hoverIdx === i &&
        i !== selectedIdx;
      const targetH = wantsHover ? 1 : 0;
      const curH = hoverProgressRef.current[i];
      const newH = curH + (targetH - curH) * 0.16;
      hoverProgressRef.current[i] = newH;
      const hoverLift = newH * 0.18 * (1 - cov * 0.5);
      const hoverForward = newH * 0.12 * (1 - cov);
      y += hoverLift;
      z += hoverForward;

      // ── APPLY TRANSFORMS & OPACITY ──────────────────────
      if (bookOpacity < 0.999) {
        applyGroupOpacity(g, bookOpacity);
      } else {
        applyGroupOpacity(g, 1.0);
      }
      g.visible = bookOpacity > 0.02; // Skip raycasting once transparent
      g.position.set(x, y, z);
      g.rotation.set(rotX, rotY, 0);

      if (pivot) {
        pivot.rotation.y = -openAngle; // -144° front cover swing forward & left
      }
    }

    // 3. Shelf Group Retreat During Open
    const sg = shelfGroupRef.current;
    if (sg) {
      const t =
        mode === 'opening' || mode === 'open' || mode === 'closing'
          ? smoothstep(openProgress, 0.05, 0.95)
          : 0;
      const eased = easeInOutCubic(t);
      sg.position.set(0, SHELF_OPEN_Y * eased, SHELF_OPEN_Z * eased);
      sg.visible = t < 0.95;
    }
  });

  return null;
}

// ── HardbackScene Component ─────────────────────────────────────────────────
export interface HardbackSceneProps {
  books?: BookData[];
  isDark: boolean;
  isMobile: boolean;
  positionRef: React.MutableRefObject<number>;
  targetRef: React.MutableRefObject<number>;
  modeRef: React.MutableRefObject<string>;
  selectedIndexRef: React.MutableRefObject<number>;
  openProgressRef: React.MutableRefObject<number>;
  enterProgressRef: React.MutableRefObject<number>;
  hoverIndexRef: React.MutableRefObject<number>;
  onBookClick: (index: number) => void;
  onBookHover: (index: number) => void;
  onBookOut: () => void;
}

export const HardbackScene: React.FC<HardbackSceneProps> = ({
  books = BOOKS,
  isDark,
  isMobile,
  positionRef,
  targetRef,
  modeRef,
  selectedIndexRef,
  openProgressRef,
  enterProgressRef,
  hoverIndexRef,
  onBookClick,
  onBookHover,
  onBookOut,
}) => {
  const groupRefs = useRef<(THREE.Group | null)[]>([]);
  const pivotRefs = useRef<(THREE.Group | null)[]>([]);
  const shelfGroupRef = useRef<THREE.Group>(null!);

  const activeBooks = books && books.length > 0 ? books : BOOKS;

  return (
    <Canvas
      shadows={{ type: THREE.VSMShadowMap }}
      dpr={[1, 2]}
      camera={{ position: [0, 2.7, 11.95], fov: 36, near: 0.1, far: 80 }}
      gl={{ antialias: true, alpha: true }}
      style={{ width: '100%', height: '100%' }}
    >
      <CameraRig />

      <Suspense fallback={null}>
        <StudioLights isDark={isDark} />

        {/* 4-Layer Contact Shadows + Directional Receiver Plane inside Shelf Group */}
        <group ref={shelfGroupRef}>
          {/* L1 — Pinpoint AO directly under each book */}
          <ContactShadows
            position={[0, SHELF_Y + 0.004, 0]}
            opacity={isDark ? 0.85 : 0.55}
            scale={9}
            blur={0.9}
            far={2.0}
            color={isDark ? '#000000' : '#1a0a04'}
            resolution={1024}
          />
          {/* L2 — Close penumbra */}
          <ContactShadows
            position={[0, SHELF_Y + 0.003, 0]}
            opacity={isDark ? 0.5 : 0.35}
            scale={18}
            blur={2.5}
            far={3.5}
            color={isDark ? '#000000' : '#1a0a04'}
            resolution={1024}
          />
          {/* L3 — Wide soft halo */}
          <ContactShadows
            position={[0, SHELF_Y + 0.002, 0]}
            opacity={isDark ? 0.28 : 0.2}
            scale={32}
            blur={5.5}
            far={5.0}
            color={isDark ? '#000000' : '#2a160a'}
            resolution={512}
          />
          {/* L4 — Outer drop-off, fades to transparent */}
          <ContactShadows
            position={[0, SHELF_Y + 0.001, 0]}
            opacity={isDark ? 0.14 : 0.1}
            scale={50}
            blur={9}
            far={6.5}
            color={isDark ? '#000000' : '#2a160a'}
            resolution={256}
          />
          {/* Directional Cast Shadow Receiver Plane */}
          <mesh
            position={[0, SHELF_Y + 0.0005, 0]}
            rotation={[-Math.PI / 2, 0, 0]}
            receiveShadow
          >
            <planeGeometry args={[60, 30]} />
            <shadowMaterial
              transparent
              opacity={isDark ? 0.4 : 0.24}
              color="#000000"
            />
          </mesh>
        </group>

        <BookManager
          books={activeBooks}
          positionRef={positionRef}
          targetRef={targetRef}
          modeRef={modeRef}
          selectedIndexRef={selectedIndexRef}
          openProgressRef={openProgressRef}
          enterProgressRef={enterProgressRef}
          hoverIndexRef={hoverIndexRef}
          groupRefs={groupRefs}
          pivotRefs={pivotRefs}
          shelfGroupRef={shelfGroupRef}
          isMobile={isMobile}
        />

        {activeBooks.map((book, i) => (
          <Book
            key={book.id || `book-${i}`}
            book={book}
            groupRef={(g) => {
              groupRefs.current[i] = g;
            }}
            pivotRef={(p) => {
              pivotRefs.current[i] = p;
            }}
            initialPosition={[
              ENTRY_FROM_X,
              SHELF_Y + ENTRY_FROM_Y_OFFSET,
              ENTRY_FROM_Z,
            ]}
            onClick={(e) => {
              e.stopPropagation();
              onBookClick(i);
            }}
            onPointerOver={() => onBookHover(i)}
            onPointerOut={() => onBookOut()}
          />
        ))}
      </Suspense>
    </Canvas>
  );
};
