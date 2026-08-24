'use client';

import React, { useRef, useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { BookData, SPINE_WRAP_T } from '@/components/sections/hardback/hardback-data';
import {
  makeSpineTexture,
  makeCoverTexture,
  makeBackCoverTexture,
  PAGE_EDGE_COLOR,
  INNER_CREAM_COLOR,
} from '@/components/sections/hardback/hardback-textures';

// ── Physically-Driven Specular Foil Glint Shader ──────────────────────────────
const sheenVertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const sheenFragmentShader = `
  varying vec2 vUv;
  uniform float uProgress;
  uniform float uHover;
  uniform vec3 uColor;

  void main() {
    // Physical specular reflection wave that glides as the cover turns towards the light
    float glintPos = mix(-0.2, 1.25, uProgress);
    float diagonal = vUv.x * 0.68 + vUv.y * 0.32;
    
    // Broad, soft Gaussian-like curve for natural light diffusion on gold/cloth
    float dist = abs(diagonal - glintPos);
    float glint = smoothstep(0.40, 0.0, dist);
    
    // Soft vignette edge so it stays naturally within the cover margins
    float edge = smoothstep(0.02, 0.14, vUv.x) * smoothstep(0.98, 0.86, vUv.x) *
                 smoothstep(0.02, 0.14, vUv.y) * smoothstep(0.98, 0.86, vUv.y);
                 
    float alpha = glint * edge * uHover * 0.26;
    gl_FragColor = vec4(uColor, alpha);
  }
`;

interface Book3DMeshProps {
  book: BookData;
  index: number;
  isHovered: boolean;
  /** False while the shelf is off-screen — used to kick a render on re-entry. */
  active: boolean;
}

export function Book3DMesh({ book, index, isHovered, active }: Book3DMeshProps) {
  const groupRef = useRef<THREE.Group>(null);
  const sheenMatRef = useRef<THREE.ShaderMaterial>(null);
  const progressRef = useRef(0);
  const invalidate = useThree((state) => state.invalidate);

  const W = 1.75;
  const H = 2.62;
  const D = book.spineThickness || 0.35;
  const COVER_T = 0.038;
  const PAGE_T = D - 2 * COVER_T;
  const PAGE_RECESS = 0.055;
  const xCenter = SPINE_WRAP_T / 2;

  // Textures memoized. The cover texture may redraw asynchronously once its
  // image decodes — the callback re-invalidates the demand render loop.
  const textures = useMemo(() => {
    const spineTex = makeSpineTexture(book);
    const coverTex = makeCoverTexture(book, invalidate);
    const backCoverTex = makeBackCoverTexture(book);

    return {
      spineTex,
      coverTex,
      backCoverTex,
    };
  }, [book]);

  // Living foil sheen material
  const livingSheenMaterial = useMemo(() => {
    const foilColor = new THREE.Color(book.foilColor || book.coverTextColor || '#e7b55f');
    return new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uProgress: { value: 0 },
        uHover: { value: 0 },
        uColor: { value: foilColor },
      },
      vertexShader: sheenVertexShader,
      fragmentShader: sheenFragmentShader,
    });
  }, [book]);

  // Materials with enhanced PBR response for studio key/rim lighting
  const materials = useMemo(() => {
    // 1. Back Cover
    const backCoverMats: THREE.MeshStandardMaterial[] = [
      new THREE.MeshStandardMaterial({ color: book.coverColor, roughness: 0.65 }), // +X
      new THREE.MeshStandardMaterial({ color: book.spineColor, roughness: 0.55 }), // -X
      new THREE.MeshStandardMaterial({ color: book.coverColor, roughness: 0.65 }), // +Y
      new THREE.MeshStandardMaterial({ color: book.coverColor, roughness: 0.65 }), // -Y
      new THREE.MeshStandardMaterial({ color: INNER_CREAM_COLOR, roughness: 0.75 }), // +Z
      new THREE.MeshStandardMaterial({ map: textures.backCoverTex, roughness: 0.52, metalness: 0.15 }), // -Z
    ];

    // 2. Page Block: Warm aged deckle-edge
    const pageBlockMats: THREE.MeshStandardMaterial[] = [
      new THREE.MeshStandardMaterial({ color: PAGE_EDGE_COLOR, roughness: 0.92 }), // +X
      new THREE.MeshStandardMaterial({ color: PAGE_EDGE_COLOR, roughness: 0.92 }), // -X
      new THREE.MeshStandardMaterial({ color: PAGE_EDGE_COLOR, roughness: 0.92 }), // +Y
      new THREE.MeshStandardMaterial({ color: PAGE_EDGE_COLOR, roughness: 0.92 }), // -Y
      new THREE.MeshStandardMaterial({ color: PAGE_EDGE_COLOR, roughness: 0.92 }), // +Z
      new THREE.MeshStandardMaterial({ color: PAGE_EDGE_COLOR, roughness: 0.92 }), // -Z
    ];

    // 3. Front Cover: Clothboard with lustrous metallic foil reflections
    const frontCoverMats: THREE.MeshStandardMaterial[] = [
      new THREE.MeshStandardMaterial({ color: book.coverColor, roughness: 0.65 }), // +X
      new THREE.MeshStandardMaterial({ color: book.spineColor, roughness: 0.55 }), // -X
      new THREE.MeshStandardMaterial({ color: book.coverColor, roughness: 0.65 }), // +Y
      new THREE.MeshStandardMaterial({ color: book.coverColor, roughness: 0.65 }), // -Y
      new THREE.MeshStandardMaterial({
        map: textures.coverTex,
        roughness: 0.46,
        metalness: 0.22,
      }), // +Z (foil cover)
      new THREE.MeshStandardMaterial({ color: INNER_CREAM_COLOR, roughness: 0.75 }), // -Z
    ];

    // 4. Spine Wrap: Embossed cloth with gilded bands
    const spineWrapMats: THREE.MeshStandardMaterial[] = [
      new THREE.MeshStandardMaterial({ color: book.spineColor, roughness: 0.55 }), // +X
      new THREE.MeshStandardMaterial({
        map: textures.spineTex,
        roughness: 0.48,
        metalness: 0.2,
      }), // -X (spine)
      new THREE.MeshStandardMaterial({ color: book.spineColor, roughness: 0.55 }), // +Y
      new THREE.MeshStandardMaterial({ color: book.spineColor, roughness: 0.55 }), // -Y
      new THREE.MeshStandardMaterial({ color: book.spineColor, roughness: 0.55 }), // +Z
      new THREE.MeshStandardMaterial({ color: book.spineColor, roughness: 0.55 }), // -Z
    ];

    return {
      backCoverMats,
      pageBlockMats,
      frontCoverMats,
      spineWrapMats,
    };
  }, [book, textures]);

  // Organic individual resting angles for a natural exhibition display
  const restAngles = useMemo(() => {
    const variants = [
      { y: -0.38, x: 0.08, z: -0.035 },
      { y: -0.44, x: 0.10, z: -0.048 },
      { y: -0.35, x: 0.07, z: -0.028 },
      { y: -0.41, x: 0.09, z: -0.042 },
      { y: -0.37, x: 0.08, z: -0.032 },
    ];
    return variants[index % variants.length];
  }, [index]);

  // Kick a frame whenever interaction state changes (hover in/out, shelf
  // re-entering the viewport) — the convergence loop below keeps rendering
  // until the springs settle, then the loop parks itself.
  useEffect(() => {
    invalidate();
  }, [isHovered, active, invalidate]);

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    // Clamp delta: in demand mode the first frame after a long park carries
    // the full elapsed time, which would make damp() leap straight to its
    // target (perceived as a "snap"). A ≤33ms step keeps every transition
    // buttery regardless of how long the loop was parked.
    const dt = Math.min(delta, 1 / 30);

    // Luxurious weighted spring inertia
    const targetRotY = isHovered ? 0.0 : restAngles.y;
    const targetRotX = isHovered ? 0.0 : restAngles.x;
    const targetRotZ = isHovered ? 0.0 : restAngles.z;
    const targetPosY = isHovered ? 0.12 : 0.0;
    const targetPosZ = isHovered ? 0.42 : 0.0;

    groupRef.current.rotation.y = THREE.MathUtils.damp(groupRef.current.rotation.y, targetRotY, 5.5, dt);
    groupRef.current.rotation.x = THREE.MathUtils.damp(groupRef.current.rotation.x, targetRotX, 5.5, dt);
    groupRef.current.rotation.z = THREE.MathUtils.damp(groupRef.current.rotation.z, targetRotZ, 5.5, dt);
    groupRef.current.position.y = THREE.MathUtils.damp(groupRef.current.position.y, targetPosY, 5.5, dt);
    groupRef.current.position.z = THREE.MathUtils.damp(groupRef.current.position.z, targetPosZ, 5.5, dt);

    // Physical motion-driven glint progress (only glints smoothly as the book rotates)
    const targetProgress = isHovered ? 1.0 : 0.0;
    progressRef.current = THREE.MathUtils.damp(progressRef.current, targetProgress, 4.5, dt);

    if (sheenMatRef.current) {
      sheenMatRef.current.uniforms.uProgress.value = progressRef.current;
      sheenMatRef.current.uniforms.uHover.value = progressRef.current;
    }

    // Demand-mode loop: keep requesting frames while the springs are still in
    // motion; once converged, stop invalidating and the render loop parks.
    const stillMoving =
      Math.abs(groupRef.current.rotation.y - targetRotY) > 1e-3 ||
      Math.abs(groupRef.current.rotation.x - targetRotX) > 1e-3 ||
      Math.abs(groupRef.current.rotation.z - targetRotZ) > 1e-3 ||
      Math.abs(groupRef.current.position.y - targetPosY) > 1e-3 ||
      Math.abs(groupRef.current.position.z - targetPosZ) > 1e-3 ||
      Math.abs(progressRef.current - targetProgress) > 1e-3;
    if (stillMoving) invalidate();
  });

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {/* Back Cover Board */}
      <mesh
        position={[xCenter, 0, -D / 2 + COVER_T / 2]}
        material={materials.backCoverMats}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[W, H, COVER_T]} />
      </mesh>

      {/* Recessed Page Block */}
      <mesh
        position={[xCenter - PAGE_RECESS / 2, 0, 0]}
        material={materials.pageBlockMats}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[W - PAGE_RECESS, H - PAGE_RECESS * 2, PAGE_T]} />
      </mesh>

      {/* Spine Wrap */}
      <mesh
        position={[xCenter - W / 2 - SPINE_WRAP_T / 2, 0, 0]}
        material={materials.spineWrapMats}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[SPINE_WRAP_T, H, D]} />
      </mesh>

      {/* Front Cover Board */}
      <mesh
        position={[xCenter, 0, D / 2 - COVER_T / 2]}
        material={materials.frontCoverMats}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[W, H, COVER_T]} />
      </mesh>

      {/* Living Foil Sheen Plane (Shimmers across foil on hover) */}
      <mesh
        position={[xCenter, 0, D / 2 + 0.002]}
        material={livingSheenMaterial}
        ref={(m) => {
          if (m) sheenMatRef.current = m.material as THREE.ShaderMaterial;
        }}
      >
        <planeGeometry args={[W, H]} />
      </mesh>
    </group>
  );
}
