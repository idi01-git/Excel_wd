'use client';

import React, { useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { ThreeEvent } from '@react-three/fiber';
import {
  BookData,
  COVER_THICK,
  SPINE_WRAP_T,
  PAGE_INSET,
} from './hardback-data';
import {
  makeSpineTexture,
  makeCoverTexture,
  makeBackCoverTexture,
  makeImageCoverTexture,
  makeInsidePageTexture,
  makeInsideCoverTexture,
  PAGE_EDGE_COLOR,
  INNER_CREAM_COLOR,
} from './hardback-textures';

interface BookProps {
  book: BookData;
  groupRef?: (node: THREE.Group | null) => void;
  pivotRef?: (node: THREE.Group | null) => void;
  initialPosition?: [number, number, number];
  onClick?: (e: ThreeEvent<MouseEvent>) => void;
  onPointerOver?: (e: ThreeEvent<PointerEvent>) => void;
  onPointerOut?: (e: ThreeEvent<PointerEvent>) => void;
}

export const Book: React.FC<BookProps> = ({
  book,
  groupRef,
  pivotRef,
  initialPosition = [0, 0, 0],
  onClick,
  onPointerOver,
  onPointerOut,
}) => {
  const W = book.width;
  const H = book.height;
  const D = book.spineThickness;
  const PAGE_T = D - 2 * COVER_THICK;
  const xCenter = SPINE_WRAP_T / 2;

  // Textures memoized per book
  const textures = useMemo(() => {
    const spineTex = makeSpineTexture(book);
    const coverTex = book.coverImage
      ? makeImageCoverTexture(book)
      : makeCoverTexture(book);
    const backCoverTex = makeBackCoverTexture(book);
    const insidePageTex = makeInsidePageTexture(book);
    const insideCoverTex = makeInsideCoverTexture(book);

    return {
      spineTex,
      coverTex,
      backCoverTex,
      insidePageTex,
      insideCoverTex,
    };
  }, [book]);

  // Clean up textures on unmount
  useEffect(() => {
    return () => {
      textures.spineTex.dispose();
      textures.coverTex.dispose();
      textures.backCoverTex.dispose();
      textures.insidePageTex.dispose();
      textures.insideCoverTex.dispose();
    };
  }, [textures]);

  // Materials for 4 parts with exact face ordering [+X, -X, +Y, -Y, +Z, -Z]
  const materials = useMemo(() => {
    // 1. Back Cover Materials
    const backCoverMats: THREE.MeshStandardMaterial[] = [
      new THREE.MeshStandardMaterial({ color: book.coverColor, roughness: 0.7, transparent: true, depthWrite: true }), // +X
      new THREE.MeshStandardMaterial({ color: book.spineColor, roughness: 0.6, transparent: true, depthWrite: true }),  // -X
      new THREE.MeshStandardMaterial({ color: book.coverColor, roughness: 0.7, transparent: true, depthWrite: true }), // +Y
      new THREE.MeshStandardMaterial({ color: book.coverColor, roughness: 0.7, transparent: true, depthWrite: true }), // -Y
      new THREE.MeshStandardMaterial({ color: INNER_CREAM_COLOR, roughness: 0.7, transparent: true, depthWrite: true }),// +Z
      new THREE.MeshStandardMaterial({ map: textures.backCoverTex, roughness: 0.58, metalness: 0.08, transparent: true, depthWrite: true }), // -Z (foil badge back)
    ];

    // 2. Page Block Materials
    const pageBlockMats: THREE.MeshStandardMaterial[] = [
      new THREE.MeshStandardMaterial({ color: PAGE_EDGE_COLOR, roughness: 0.95, transparent: true, depthWrite: true }), // +X (fore-edge)
      new THREE.MeshStandardMaterial({ color: PAGE_EDGE_COLOR, roughness: 0.95, transparent: true, depthWrite: true }), // -X (gutter)
      new THREE.MeshStandardMaterial({ color: PAGE_EDGE_COLOR, roughness: 0.95, transparent: true, depthWrite: true }), // +Y
      new THREE.MeshStandardMaterial({ color: PAGE_EDGE_COLOR, roughness: 0.95, transparent: true, depthWrite: true }), // -Y
      new THREE.MeshStandardMaterial({ map: textures.insidePageTex, roughness: 0.95, transparent: true, depthWrite: true }), // +Z (visible excerpt page)
      new THREE.MeshStandardMaterial({ color: PAGE_EDGE_COLOR, roughness: 0.95, transparent: true, depthWrite: true }), // -Z
    ];

    // 3. Front Cover Materials
    const frontCoverMats: THREE.MeshStandardMaterial[] = [
      new THREE.MeshStandardMaterial({ color: book.coverColor, roughness: 0.7, transparent: true, depthWrite: true }), // +X
      new THREE.MeshStandardMaterial({ color: book.spineColor, roughness: 0.6, transparent: true, depthWrite: true }),  // -X
      new THREE.MeshStandardMaterial({ color: book.coverColor, roughness: 0.7, transparent: true, depthWrite: true }), // +Y
      new THREE.MeshStandardMaterial({ color: book.coverColor, roughness: 0.7, transparent: true, depthWrite: true }), // -Y
      new THREE.MeshStandardMaterial({ map: textures.coverTex, roughness: 0.55, metalness: 0.1, transparent: true, depthWrite: true }), // +Z (cover front)
      new THREE.MeshStandardMaterial({ map: textures.insideCoverTex, roughness: 0.85, transparent: true, depthWrite: true }), // -Z (inside frontispiece)
    ];

    // 4. Spine Wrap Materials
    const spineWrapMats: THREE.MeshStandardMaterial[] = [
      new THREE.MeshStandardMaterial({ color: book.spineColor, roughness: 0.6, transparent: true, depthWrite: true }),  // +X
      new THREE.MeshStandardMaterial({ map: textures.spineTex, roughness: 0.6, transparent: true, depthWrite: true }),   // -X (visible spine text)
      new THREE.MeshStandardMaterial({ color: book.spineColor, roughness: 0.6, transparent: true, depthWrite: true }),  // +Y
      new THREE.MeshStandardMaterial({ color: book.spineColor, roughness: 0.6, transparent: true, depthWrite: true }),  // -Y
      new THREE.MeshStandardMaterial({ color: book.spineColor, roughness: 0.6, transparent: true, depthWrite: true }),  // +Z
      new THREE.MeshStandardMaterial({ color: book.spineColor, roughness: 0.6, transparent: true, depthWrite: true }),  // -Z
    ];

    return {
      backCoverMats,
      pageBlockMats,
      frontCoverMats,
      spineWrapMats,
    };
  }, [book, textures]);

  // Clean up materials on unmount
  useEffect(() => {
    return () => {
      Object.values(materials).forEach((matList) => {
        matList.forEach((m) => m.dispose());
      });
    };
  }, [materials]);

  return (
    <group
      ref={groupRef}
      position={initialPosition}
      onClick={onClick}
      onPointerOver={onPointerOver}
      onPointerOut={onPointerOut}
    >
      {/* 1. Back Cover */}
      <mesh
        position={[xCenter, 0, -D / 2 + COVER_THICK / 2]}
        material={materials.backCoverMats}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[W, H, COVER_THICK]} />
      </mesh>

      {/* 2. Page Block */}
      <mesh
        position={[xCenter + PAGE_INSET / 2, 0, -D / 2 + COVER_THICK + PAGE_T / 2]}
        material={materials.pageBlockMats}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[W - PAGE_INSET, H - PAGE_INSET, PAGE_T]} />
      </mesh>

      {/* 3. Spine Wrap */}
      <mesh
        position={[xCenter - W / 2 - SPINE_WRAP_T / 2, 0, 0]}
        material={materials.spineWrapMats}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[SPINE_WRAP_T, H, D]} />
      </mesh>

      {/* 4. Front Cover (inside hinge pivot group) */}
      <group
        ref={pivotRef}
        position={[xCenter - W / 2, 0, D / 2 - COVER_THICK / 2]}
      >
        <mesh
          position={[W / 2, 0, 0]}
          material={materials.frontCoverMats}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[W, H, COVER_THICK]} />
        </mesh>
      </group>
    </group>
  );
};
