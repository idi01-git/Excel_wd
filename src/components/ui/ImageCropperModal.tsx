// src/components/ui/ImageCropperModal.tsx
'use client';

import React, { useState, useRef, useEffect, useCallback, useId } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ZoomIn, ZoomOut, RotateCw, Check, Crop, RefreshCcw, Circle, Square, User } from 'lucide-react';

export const ASPECT_RATIOS = {
  AVATAR: 1,
  BOOK: 2 / 3,
  PORTRAIT: 4 / 4.3,
  BANNER: 16 / 9,
  FREE: null,
} as const;

export type AspectPreset = keyof typeof ASPECT_RATIOS;

export interface ImageCropperModalProps {
  isOpen: boolean;
  imageSrc: string;
  aspectRatio?: number | null; // e.g. 1 for square, 2/3 for books
  aspectPresetLabel?: string;
  cropShape?: 'rect' | 'round'; // 'round' for circular avatar framing
  circular?: boolean; // Convenience flag for circular crop
  allowRatioSelection?: boolean; // Show interactive ratio switcher toolbar
  onCropComplete: (croppedBlob: Blob, croppedUrl: string) => void;
  onCancel: () => void;
}

const RATIO_PRESETS = [
  { label: 'Original', value: 'ORIGINAL' as const },
  { label: '1:1', value: 1 },
  { label: '4:3', value: 4 / 3 },
  { label: '16:9', value: 16 / 9 },
  { label: '3:4', value: 3 / 4 },
  { label: '9:16', value: 9 / 16 },
];

export function ImageCropperModal({
  isOpen,
  imageSrc,
  aspectRatio = 1,
  aspectPresetLabel = 'Square (1:1)',
  cropShape: initialCropShape,
  circular = false,
  allowRatioSelection = false,
  onCropComplete,
  onCancel,
}: ImageCropperModalProps) {
  const maskId = useId();
  const isProfilePreset = Boolean(
    circular ||
    initialCropShape === 'round' ||
    aspectPresetLabel?.toLowerCase().includes('avatar') ||
    aspectPresetLabel?.toLowerCase().includes('profile')
  );

  const [cropShape, setCropShape] = useState<'rect' | 'round'>(
    initialCropShape || (isProfilePreset ? 'round' : 'rect')
  );

  const [scale, setScale] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const posStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const [activeRatio, setActiveRatio] = useState<number | 'ORIGINAL'>(
    aspectRatio === null ? 'ORIGINAL' : (aspectRatio || 1)
  );

  const imageRef = useRef<HTMLImageElement | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [naturalAspect, setNaturalAspect] = useState<number>(1);

  // Load source image
  useEffect(() => {
    if (!imageSrc) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imageRef.current = img;
      const aspect = (img.naturalWidth || 1) / (img.naturalHeight || 1);
      setNaturalAspect(aspect);
      setImageLoaded(true);
      setScale(1);
      setRotation(0);
      setPosition({ x: 0, y: 0 });
      if (aspectRatio === null) {
        setActiveRatio('ORIGINAL');
      } else if (aspectRatio) {
        setActiveRatio(aspectRatio);
      }
      setCropShape(initialCropShape || (isProfilePreset ? 'round' : 'rect'));
    };
    img.src = imageSrc;
  }, [imageSrc, aspectRatio, initialCropShape, isProfilePreset]);

  // Compute framing dimensions based on current active ratio
  const targetRatio = activeRatio === 'ORIGINAL' ? naturalAspect : (activeRatio || 1);
  const isSquareRatio = Math.abs(targetRatio - 1) < 0.01;
  const isCircular = isSquareRatio && cropShape === 'round';

  const maxViewH = 260;
  const maxViewW = 280;

  let frameWidth: number;
  let frameHeight: number;

  if (targetRatio < 1) {
    frameHeight = maxViewH;
    frameWidth = Math.round(frameHeight * targetRatio);
    if (frameWidth > maxViewW) {
      frameWidth = maxViewW;
      frameHeight = Math.round(frameWidth / targetRatio);
    }
  } else {
    frameWidth = maxViewW;
    frameHeight = Math.round(frameWidth / targetRatio);
    if (frameHeight > maxViewH) {
      frameHeight = maxViewH;
      frameWidth = Math.round(frameHeight * targetRatio);
    }
  }

  // Exact base dimensions that cover the frame centered
  const imgAspect = naturalAspect || 1;
  let baseW: number;
  let baseH: number;

  if (imgAspect > targetRatio) {
    baseH = frameHeight;
    baseW = Math.round(frameHeight * imgAspect);
  } else {
    baseW = frameWidth;
    baseH = Math.round(frameWidth / imgAspect);
  }

  // Pointer drag event handlers for pan
  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    posStartRef.current = { ...position };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    
    const boundX = (baseW * scale) * 0.9;
    const boundY = (baseH * scale) * 0.9;
    
    const nextX = Math.max(-boundX, Math.min(boundX, posStartRef.current.x + dx));
    const nextY = Math.max(-boundY, Math.min(boundY, posStartRef.current.y + dy));

    setPosition({ x: nextX, y: nextY });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDragging) {
      setIsDragging(false);
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {}
    }
  };

  const handleReset = () => {
    setScale(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
  };

  // Generate cropped output canvas with 100% exact mathematical parity
  const handleCrop = useCallback(() => {
    if (!imageRef.current || !imageLoaded) return;

    const img = imageRef.current;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const outputSize = Math.min(1200, Math.max(800, Math.round(frameWidth * 3)));
    const outputWidth = outputSize;
    const outputHeight = Math.round(outputSize / targetRatio);

    canvas.width = outputWidth;
    canvas.height = outputHeight;

    const factor = outputWidth / frameWidth;

    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, outputWidth, outputHeight);

    ctx.save();
    
    // Circular crop clipping
    if (isCircular) {
      ctx.beginPath();
      ctx.arc(outputWidth / 2, outputHeight / 2, Math.min(outputWidth, outputHeight) / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
    }

    // 1. Move to canvas center
    ctx.translate(outputWidth / 2, outputHeight / 2);

    // 2. Apply user pan position
    ctx.translate(position.x * factor, position.y * factor);

    // 3. Apply user rotation
    ctx.rotate((rotation * Math.PI) / 180);

    // 4. Apply user zoom scale
    ctx.scale(scale, scale);

    // 5. Draw image centered
    const drawW = baseW * factor;
    const drawH = baseH * factor;
    ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);

    ctx.restore();

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const croppedUrl = URL.createObjectURL(blob);
        onCropComplete(blob, croppedUrl);
      },
      'image/webp',
      0.95
    );
  }, [imageLoaded, targetRatio, frameWidth, frameHeight, baseW, baseH, rotation, scale, position, onCropComplete, isCircular]);

  if (!isOpen) return null;

  const preview40Factor = 40 / frameWidth;
  const preview24Factor = 24 / frameWidth;

  return (
    <AnimatePresence>
      <div 
        data-lenis-prevent
        className="fixed inset-0 z-1100 flex items-center justify-center p-4 overflow-y-auto"
      >
        {/* Frosted Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onCancel}
          className="fixed inset-0 bg-black/85 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          data-lenis-prevent
          initial={{ opacity: 0, scale: 0.94, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 16 }}
          transition={{ type: 'spring', damping: 26, stiffness: 320 }}
          className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0c0c0c] p-6 text-neutral-900 dark:text-neutral-100 shadow-2xl space-y-4"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-900 text-neutral-900 dark:text-white border border-neutral-200 dark:border-neutral-800">
                {isCircular ? <Circle size={15} className="text-purple-600 dark:text-purple-400" /> : <Crop size={15} />}
              </div>
              <div>
                <h3 className="font-serif text-base sm:text-lg font-bold text-neutral-900 dark:text-white">
                  {isCircular
                    ? 'Profile Photo Framing'
                    : aspectPresetLabel
                    ? aspectPresetLabel
                    : (allowRatioSelection ? 'Image Cropper & Framing' : 'Image Cropper')}
                </h3>
                <p className="font-mono text-[10px] uppercase tracking-wider text-neutral-500">
                  {isCircular
                    ? 'Circular Avatar View (1:1)'
                    : allowRatioSelection
                    ? 'Select aspect ratio or custom framing'
                    : `Aspect: ${aspectPresetLabel}`}
                </p>
              </div>
            </div>
            <button
              onClick={onCancel}
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-neutral-200 dark:border-neutral-800 text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors cursor-pointer"
            >
              <X size={15} />
            </button>
          </div>

          {/* Interactive Ratio Switcher & Shape Toggle Toolbar */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            {allowRatioSelection ? (
              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-neutral-100 dark:bg-[#141414] border border-neutral-200 dark:border-neutral-800 overflow-x-auto">
                {RATIO_PRESETS.map((preset) => {
                  const isSelected = activeRatio === preset.value;
                  return (
                    <button
                      key={preset.label}
                      onClick={() => setActiveRatio(preset.value as any)}
                      className={`px-2.5 py-1 rounded-lg text-[10.5px] font-mono font-bold transition-all cursor-pointer whitespace-nowrap ${
                        isSelected
                          ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 shadow-xs'
                          : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                      }`}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>
            ) : <div />}

            {/* Shape Switcher for 1:1 square crops (Circle Avatar vs Square Box) */}
            {isSquareRatio && (
              <div className="flex items-center gap-1 p-1 rounded-xl bg-neutral-100 dark:bg-[#141414] border border-neutral-200 dark:border-neutral-800 ml-auto">
                <button
                  type="button"
                  onClick={() => setCropShape('round')}
                  className={`px-2.5 py-1 rounded-lg text-[10.5px] font-mono flex items-center gap-1.5 transition-all cursor-pointer ${
                    cropShape === 'round'
                      ? 'bg-purple-600 text-white font-bold shadow-xs'
                      : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                  }`}
                  title="Circular Avatar Mask"
                >
                  <Circle size={12} />
                  <span>Circle</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCropShape('rect')}
                  className={`px-2.5 py-1 rounded-lg text-[10.5px] font-mono flex items-center gap-1.5 transition-all cursor-pointer ${
                    cropShape === 'rect'
                      ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-bold shadow-xs'
                      : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                  }`}
                  title="Square Mask"
                >
                  <Square size={12} />
                  <span>Square</span>
                </button>
              </div>
            )}
          </div>

          {/* Framing Canvas Stage */}
          <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-neutral-100 dark:bg-[#070707] border border-neutral-200/80 dark:border-neutral-800/80 select-none relative">
            <div
              className={`relative overflow-hidden cursor-grab active:cursor-grabbing flex items-center justify-center touch-none shadow-inner ${
                isCircular ? 'rounded-full' : 'rounded-2xl'
              }`}
              style={{
                width: `${frameWidth}px`,
                height: `${frameHeight}px`,
                backgroundColor: '#0a0a0a',
              }}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
            >
              {/* Image Transform Layer */}
              {imageSrc && (
                <div
                  style={{
                    position: 'absolute',
                    width: `${baseW}px`,
                    height: `${baseH}px`,
                    transform: `translate(${position.x}px, ${position.y}px) rotate(${rotation}deg) scale(${scale})`,
                    transformOrigin: 'center center',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    pointerEvents: 'none',
                    willChange: 'transform',
                  }}
                >
                  <img
                    src={imageSrc}
                    alt="Source Crop"
                    style={{
                      width: `${baseW}px`,
                      height: `${baseH}px`,
                      maxWidth: 'none',
                      maxHeight: 'none',
                      objectFit: 'fill',
                      display: 'block',
                      pointerEvents: 'none',
                      userSelect: 'none',
                    }}
                    draggable={false}
                  />
                </div>
              )}

              {/* Square Grid Lines for Rectangular framing */}
              {!isCircular && (
                <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3 opacity-25 border border-white/40">
                  <div className="border-r border-b border-white/30" />
                  <div className="border-r border-b border-white/30" />
                  <div className="border-b border-white/30" />
                  <div className="border-r border-b border-white/30" />
                  <div className="border-r border-b border-white/30" />
                  <div className="border-b border-white/30" />
                  <div className="border-r border-b border-white/30" />
                  <div className="border-r border-b border-white/30" />
                  <div />
                </div>
              )}

              {/* Circular Avatar Framing Guide with SVG Mask & Rule-of-Thirds Crosshairs */}
              {isCircular && (
                <svg
                  className="absolute inset-0 w-full h-full pointer-events-none z-10"
                  width="100%"
                  height="100%"
                >
                  <defs>
                    <mask id={maskId}>
                      <rect width="100%" height="100%" fill="white" />
                      <circle cx="50%" cy="50%" r="48.5%" fill="black" />
                    </mask>
                  </defs>
                  
                  {/* Frosted Dark Shadow Outside the Circle */}
                  <rect
                    width="100%"
                    height="100%"
                    fill="rgba(0, 0, 0, 0.65)"
                    mask={`url(#${maskId})`}
                  />

                  {/* High-visibility Circular Frame Ring */}
                  <circle
                    cx="50%"
                    cy="50%"
                    r="48.5%"
                    fill="none"
                    stroke="rgba(255, 255, 255, 0.9)"
                    strokeWidth="2"
                    strokeDasharray="6 4"
                  />

                  {/* Center Alignment Crosshairs for Precision Face Framing */}
                  <line
                    x1="50%"
                    y1="38%"
                    x2="50%"
                    y2="62%"
                    stroke="rgba(255, 255, 255, 0.35)"
                    strokeWidth="1"
                    strokeDasharray="3 3"
                  />
                  <line
                    x1="38%"
                    y1="50%"
                    x2="62%"
                    y2="50%"
                    stroke="rgba(255, 255, 255, 0.35)"
                    strokeWidth="1"
                    strokeDasharray="3 3"
                  />
                </svg>
              )}
            </div>

            <p className="font-mono text-[10px] text-neutral-400 mt-2">
              {isCircular
                ? 'Drag inside circle to position your face'
                : 'Click and drag inside to pan & frame'}
            </p>
          </div>

          {/* Live Circular Avatar Preview Strip */}
          {isCircular && (
            <div className="flex items-center justify-between px-3.5 py-2.5 rounded-2xl bg-neutral-100 dark:bg-[#141414] border border-neutral-200 dark:border-neutral-800 text-xs">
              <div className="flex items-center gap-2">
                <User size={13} className="text-purple-600 dark:text-purple-400" />
                <span className="text-[11px] font-semibold text-neutral-700 dark:text-neutral-300">
                  Live Avatar Preview
                </span>
              </div>

              <div className="flex items-center gap-4">
                {/* 40px preview (Navbar/Profile size) */}
                <div className="flex items-center gap-1.5">
                  <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-purple-500/80 bg-black shadow-sm flex items-center justify-center shrink-0">
                    {imageSrc && (
                      <div
                        style={{
                          position: 'absolute',
                          width: `${baseW * preview40Factor}px`,
                          height: `${baseH * preview40Factor}px`,
                          transform: `translate(${position.x * preview40Factor}px, ${position.y * preview40Factor}px) rotate(${rotation}deg) scale(${scale})`,
                          transformOrigin: 'center center',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          pointerEvents: 'none',
                        }}
                      >
                        <img
                          src={imageSrc}
                          alt="Preview"
                          style={{
                            width: `${baseW * preview40Factor}px`,
                            height: `${baseH * preview40Factor}px`,
                            maxWidth: 'none',
                            maxHeight: 'none',
                            objectFit: 'fill',
                            display: 'block',
                            pointerEvents: 'none',
                          }}
                        />
                      </div>
                    )}
                  </div>
                  <span className="text-[9px] font-mono text-neutral-500">Header</span>
                </div>

                {/* 24px preview (Comment/List size) */}
                <div className="flex items-center gap-1.5">
                  <div className="relative w-6 h-6 rounded-full overflow-hidden border border-purple-500/60 bg-black shadow-xs flex items-center justify-center shrink-0">
                    {imageSrc && (
                      <div
                        style={{
                          position: 'absolute',
                          width: `${baseW * preview24Factor}px`,
                          height: `${baseH * preview24Factor}px`,
                          transform: `translate(${position.x * preview24Factor}px, ${position.y * preview24Factor}px) rotate(${rotation}deg) scale(${scale})`,
                          transformOrigin: 'center center',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          pointerEvents: 'none',
                        }}
                      >
                        <img
                          src={imageSrc}
                          alt="Preview"
                          style={{
                            width: `${baseW * preview24Factor}px`,
                            height: `${baseH * preview24Factor}px`,
                            maxWidth: 'none',
                            maxHeight: 'none',
                            objectFit: 'fill',
                            display: 'block',
                            pointerEvents: 'none',
                          }}
                        />
                      </div>
                    )}
                  </div>
                  <span className="text-[9px] font-mono text-neutral-500">Comment</span>
                </div>
              </div>
            </div>
          )}

          {/* Controls: Zoom & Rotate */}
          <div className="space-y-3 pt-1">
            {/* Zoom Slider */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setScale((s) => Math.max(0.5, +(s - 0.1).toFixed(2)))}
                className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 text-neutral-500 hover:text-neutral-900 dark:hover:text-white cursor-pointer"
              >
                <ZoomOut size={14} />
              </button>
              <input
                type="range"
                min="0.5"
                max="3"
                step="0.05"
                value={scale}
                onChange={(e) => setScale(parseFloat(e.target.value))}
                className="flex-1 accent-neutral-900 dark:accent-white cursor-pointer h-1.5 bg-neutral-200 dark:bg-neutral-800 rounded-lg"
              />
              <button
                type="button"
                onClick={() => setScale((s) => Math.min(3, +(s + 0.1).toFixed(2)))}
                className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 text-neutral-500 hover:text-neutral-900 dark:hover:text-white cursor-pointer"
              >
                <ZoomIn size={14} />
              </button>
              <span className="font-mono text-[10px] w-8 text-right text-neutral-500">
                {Math.round(scale * 100)}%
              </span>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center justify-between text-xs font-mono">
              <button
                type="button"
                onClick={() => setRotation((r) => (r + 90) % 360)}
                className="flex items-center gap-1 text-neutral-500 hover:text-neutral-900 dark:hover:text-white cursor-pointer"
              >
                <RotateCw size={12} />
                <span>Rotate 90°</span>
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="flex items-center gap-1 text-neutral-500 hover:text-neutral-900 dark:hover:text-white cursor-pointer"
              >
                <RefreshCcw size={12} />
                <span>Reset Framing</span>
              </button>
            </div>
          </div>

          {/* Action Footer */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-neutral-200 dark:border-neutral-800">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 rounded-xl text-xs font-mono font-bold text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCrop}
              className="px-5 py-2 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-mono font-bold flex items-center gap-1.5 shadow-md hover:shadow-lg transition cursor-pointer"
            >
              <Check size={14} />
              <span>
                {isCircular
                  ? 'Apply Profile Photo'
                  : allowRatioSelection
                  ? activeRatio === 'ORIGINAL'
                    ? 'Apply Original'
                    : 'Apply Crop'
                  : `Apply ${aspectPresetLabel || 'Crop'}`}
              </span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
