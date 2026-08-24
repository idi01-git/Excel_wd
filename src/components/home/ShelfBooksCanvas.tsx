'use client';

import React, { Suspense } from 'react';
import * as THREE from 'three';
import { Canvas, type EventManager } from '@react-three/fiber';
import { View } from '@react-three/drei';
import { BookData } from '@/components/sections/hardback/hardback-data';
import { Book3DMesh } from './Book3DCard';

export interface ShelfBookSlot {
  book: BookData;
  index: number;
  trackRef: React.RefObject<HTMLDivElement | null>;
  hovered: boolean;
}

// Pointer events stay fully disabled (interaction is handled by the DOM Link
// overlay in each slot), so R3F's event system is stubbed out entirely.
const noop = () => {};
const noopEvents = (): EventManager<HTMLElement> => ({
  enabled: false,
  priority: 0,
  handlers: {
    onClick: noop,
    onContextMenu: noop,
    onDoubleClick: noop,
    onWheel: noop,
    onPointerDown: noop,
    onPointerUp: noop,
    onPointerLeave: noop,
    onPointerMove: noop,
    onPointerCancel: noop,
    onLostPointerCapture: noop,
  },
  connect: noop,
  disconnect: noop,
  update: noop,
});

/**
 * One WebGL context for the whole shelf. Each book renders through a drei
 * <View> that scissors to its tracked DOM slot, so visuals, clipping bounds,
 * lighting and hover behavior are pixel-identical to the previous five
 * per-book canvases — with a single renderer, one shared shader program set,
 * and a capped device pixel ratio for mobile GPUs.
 */
export default function ShelfBooksCanvas({
  slots,
  paused = false,
}: {
  slots: ShelfBookSlot[];
  paused?: boolean;
}) {
  if (slots.length === 0) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-10">
      <Canvas
        events={noopEvents}
        frameloop={paused ? 'never' : 'demand'}
        shadows={{ type: THREE.PCFShadowMap }}
        dpr={[1, 1.5]}
        camera={{ position: [0, -0.04, 6.4], fov: 32 }}
        gl={{
          antialias: true,
          alpha: true,
          stencil: false,
          powerPreference: 'high-performance',
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.12,
        }}
        className="w-full h-full"
      >
        {slots.map(({ book, index, trackRef, hovered }) => (
          <View
            key={book.id || `feat-${index}`}
            track={trackRef as unknown as React.RefObject<HTMLElement>}
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
              <Book3DMesh book={book} index={index} isHovered={hovered} active={!paused} />
            </Suspense>
          </View>
        ))}
      </Canvas>
    </div>
  );
}
