'use client';

import React, { useRef, useState, useMemo, Suspense } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import Link from 'next/link';
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
}

function Book3DMesh({ book, index, isHovered }: Book3DMeshProps) {
  const groupRef = useRef<THREE.Group>(null);
  const sheenMatRef = useRef<THREE.ShaderMaterial>(null);
  const progressRef = useRef(0);

  const W = 1.75;
  const H = 2.62;
  const D = book.spineThickness || 0.35;
  const COVER_T = 0.038;
  const PAGE_T = D - 2 * COVER_T;
  const PAGE_RECESS = 0.055;
  const xCenter = SPINE_WRAP_T / 2;

  // Textures memoized
  const textures = useMemo(() => {
    const spineTex = makeSpineTexture(book);
    const coverTex = makeCoverTexture(book);
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

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    // Luxurious weighted spring inertia
    const targetRotY = isHovered ? 0.0 : restAngles.y;
    const targetRotX = isHovered ? 0.0 : restAngles.x;
    const targetRotZ = isHovered ? 0.0 : restAngles.z;
    const targetPosY = isHovered ? 0.12 : 0.0;
    const targetPosZ = isHovered ? 0.42 : 0.0;

    groupRef.current.rotation.y = THREE.MathUtils.damp(groupRef.current.rotation.y, targetRotY, 5.5, delta);
    groupRef.current.rotation.x = THREE.MathUtils.damp(groupRef.current.rotation.x, targetRotX, 5.5, delta);
    groupRef.current.rotation.z = THREE.MathUtils.damp(groupRef.current.rotation.z, targetRotZ, 5.5, delta);
    groupRef.current.position.y = THREE.MathUtils.damp(groupRef.current.position.y, targetPosY, 5.5, delta);
    groupRef.current.position.z = THREE.MathUtils.damp(groupRef.current.position.z, targetPosZ, 5.5, delta);

    // Physical motion-driven glint progress (only glints smoothly as the book rotates)
    const targetProgress = isHovered ? 1.0 : 0.0;
    progressRef.current = THREE.MathUtils.damp(progressRef.current, targetProgress, 4.5, delta);

    if (sheenMatRef.current) {
      sheenMatRef.current.uniforms.uProgress.value = progressRef.current;
      sheenMatRef.current.uniforms.uHover.value = progressRef.current;
    }
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

export interface Book3DCardProps {
  book: BookData;
  index: number;
}

export function Book3DCard({ book, index }: Book3DCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="group relative block h-[470px] w-[300px] shrink-0 md:h-[520px] md:w-[330px] select-none"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link
        href="/editors-shelf"
        className="relative block w-full h-full"
        aria-label={`${book.title} by ${book.author} — view 3D volume`}
      >
        {/* Soft, rich ambient contact drop shadow */}
        <div
          aria-hidden
          className={`absolute -bottom-5 left-1/2 h-8 w-[72%] -translate-x-1/2 rounded-[100%] bg-black/45 blur-xl transition-all duration-700 ease-out ${
            isHovered ? 'scale-110 opacity-70 blur-2xl' : 'scale-95 opacity-35'
          }`}
        />

        {/* 3D Canvas with Studio 3-Point Exhibition Lighting & ACES Filmic Tone Mapping */}
        <div className="relative w-full h-full cursor-pointer overflow-visible">
          <Canvas
            shadows={{ type: THREE.PCFShadowMap }}
            camera={{ position: [0, -0.04, 6.4], fov: 32 }}
            gl={{
              antialias: true,
              alpha: true,
              powerPreference: 'high-performance',
              toneMapping: THREE.ACESFilmicToneMapping,
              toneMappingExposure: 1.12,
            }}
            className="w-full h-full pointer-events-none"
          >
            {/* Studio Hemisphere Ambient Fill */}
            <hemisphereLight args={['#fff8ea', '#6e5848', 1.8]} />

            {/* Warm Key Light (Casts soft directional shadows and specular highlights on foil) */}
            <directionalLight
              position={[4.5, 7.0, 5.5]}
              intensity={3.4}
              color="#fff6e7"
              castShadow
              shadow-mapSize-width={1024}
              shadow-mapSize-height={1024}
              shadow-bias={-0.0005}
            />

            {/* Cool Studio Rim Light (Highlights spine edge and cloth texture) */}
            <directionalLight position={[-5.0, 3.5, -4.0]} intensity={2.2} color="#c8d5e5" />

            {/* Warm Under-Bounce Fill */}
            <pointLight position={[-2.0, -1.6, 3.5]} intensity={1.1} color="#d79b72" />

            <Suspense fallback={null}>
              <Book3DMesh book={book} index={index} isHovered={isHovered} />
            </Suspense>
          </Canvas>
        </div>
      </Link>
    </div>
  );
}
