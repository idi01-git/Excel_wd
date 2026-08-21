import * as THREE from 'three';
import { BookData } from './hardback-data';

export const SERIF_STACK = `"Playfair Display", "Rozha One", "Martel", "Noto Serif Devanagari", "Lora", "Cormorant Garamond", Georgia, serif`;
export const SANS_STACK = `"Noto Sans Devanagari", "Outfit", "Inter", "Helvetica Neue", Arial, sans-serif`;
export const MONO_STACK = `"JetBrains Mono", "SF Mono", monospace`;
export const PAGE_EDGE_COLOR = '#ecdcb0';
export const INNER_CREAM_COLOR = '#f6edd6';

/**
 * Deterministic pseudo-random generator seeded by a string (e.g. book ID)
 */
function seeded(seed: string) {
  let state = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    state ^= seed.charCodeAt(i);
    state = Math.imul(state, 16777619);
  }
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Word wrap helper for canvas 2D context
 */
export function wrapLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = '';

  for (const w of words) {
    const test = current ? `${current} ${w}` : w;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = w;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

/**
 * Helper to dynamically fit font size to maximum bounding width
 */
export function fitFontSize(
  ctx: CanvasRenderingContext2D,
  text: string,
  font: (size: number) => string,
  maxWidth: number,
  start: number,
  min: number
): number {
  let size = start;
  while (size > min) {
    ctx.font = font(size);
    if (ctx.measureText(text).width <= maxWidth) return size;
    size -= 2;
  }
  return min;
}

/**
 * Render fine woven cloth linen weave texture onto canvas
 */
function drawClothWeave(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  intensity = 0.07
) {
  ctx.save();
  // Micro horizontal threads
  ctx.fillStyle = `rgba(255, 255, 255, ${intensity * 0.7})`;
  for (let y = 0; y < height; y += 4) {
    ctx.fillRect(0, y, width, 1.2);
  }
  // Micro vertical threads
  ctx.fillStyle = `rgba(0, 0, 0, ${intensity * 0.9})`;
  for (let x = 0; x < width; x += 4) {
    ctx.fillRect(x, 0, 1.2, height);
  }
  // Organic cloth grain speckles
  ctx.fillStyle = `rgba(255, 255, 255, ${intensity * 0.5})`;
  for (let i = 0; i < 400; i++) {
    const rx = (Math.sin(i * 997) * 0.5 + 0.5) * width;
    const ry = (Math.cos(i * 353) * 0.5 + 0.5) * height;
    ctx.fillRect(rx, ry, 1, 1);
  }
  ctx.restore();
}

/**
 * Line drawing helper for procedural motifs
 */
function strokeLine(
  ctx: CanvasRenderingContext2D,
  points: Array<[number, number]>,
  width = 3
) {
  if (points.length < 2) return;
  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i][0], points[i][1]);
  }
  ctx.lineWidth = width;
  ctx.stroke();
}

/**
 * Draw Complete-Shelf procedural foil motifs onto cover
 */
export function drawMotif(
  ctx: CanvasRenderingContext2D,
  book: BookData,
  width: number,
  height: number
) {
  const motif = book.motif || 'lattice';
  const foil = book.foilColor || book.coverTextColor || '#e7b55f';
  const random = seeded(book.id + (book.motif || ''));

  ctx.save();
  ctx.strokeStyle = foil;
  ctx.fillStyle = foil;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const centerY = height * 0.46;

  switch (motif) {
    case 'orbit': {
      ctx.globalAlpha = 0.85;
      const cx = width / 2;
      const cy = centerY;
      for (let r = 40; r <= 160; r += 32) {
        ctx.beginPath();
        ctx.ellipse(cx, cy, r * 1.3, r * 0.75, Math.PI / 4, 0, Math.PI * 2);
        ctx.lineWidth = 2.5;
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.arc(cx, cy, 14, 0, Math.PI * 2);
      ctx.fill();
      for (let i = 0; i < 8; i++) {
        const ang = (i / 8) * Math.PI * 2 + random();
        const dist = 70 + (i % 3) * 45;
        ctx.beginPath();
        ctx.arc(cx + Math.cos(ang) * dist * 1.2, cy + Math.sin(ang) * dist * 0.7, 4, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case 'network': {
      const nodes: Array<[number, number]> = [];
      for (let i = 0; i < 20; i++) {
        nodes.push([
          width * 0.2 + random() * (width * 0.6),
          centerY - 130 + random() * 260,
        ]);
      }
      ctx.globalAlpha = 0.4;
      nodes.forEach((pt, i) => {
        nodes.slice(i + 1).forEach((other) => {
          const dist = Math.hypot(pt[0] - other[0], pt[1] - other[1]);
          if (dist < 150) strokeLine(ctx, [pt, other], 2);
        });
      });
      ctx.globalAlpha = 0.95;
      nodes.forEach(([x, y]) => {
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fill();
      });
      break;
    }
    case 'continuum': {
      ctx.globalAlpha = 0.85;
      const cx = width / 2;
      const cy = centerY;
      for (let r = 24; r < 170; r += 20) {
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.lineWidth = 2.2;
        ctx.stroke();
      }
      strokeLine(ctx, [[cx - 180, cy], [cx + 180, cy]], 1.5);
      strokeLine(ctx, [[cx, cy - 180], [cx, cy + 180]], 1.5);
      break;
    }
    case 'steps': {
      ctx.globalAlpha = 0.8;
      const startX = width * 0.22;
      const stepW = (width * 0.56) / 7;
      for (let i = 0; i < 7; i++) {
        const x = startX + i * stepW;
        const h = 40 + i * 28;
        ctx.fillRect(x, centerY + 100 - h, stepW - 6, h);
      }
      break;
    }
    case 'runner': {
      ctx.globalAlpha = 0.88;
      for (let i = 0; i < 9; i++) {
        const y = centerY - 120 + i * 30;
        const offset = Math.sin(i * 0.7) * 45;
        strokeLine(
          ctx,
          [
            [width * 0.2 + offset, y],
            [width * 0.8 + offset, y],
          ],
          3
        );
      }
      break;
    }
    case 'fracture': {
      ctx.globalAlpha = 0.85;
      const cx = width / 2;
      const cy = centerY;
      for (let i = 0; i < 14; i++) {
        const a1 = (i / 14) * Math.PI * 2;
        const a2 = a1 + (random() - 0.5) * 0.4;
        const r1 = 30 + random() * 40;
        const r2 = 120 + random() * 60;
        strokeLine(
          ctx,
          [
            [cx + Math.cos(a1) * r1, cy + Math.sin(a1) * r1],
            [cx + Math.cos(a2) * r2, cy + Math.sin(a2) * r2],
          ],
          2.5
        );
      }
      break;
    }
    case 'wave': {
      ctx.globalAlpha = 0.82;
      for (let wave = 0; wave < 8; wave++) {
        const yBase = centerY - 100 + wave * 28;
        const points: Array<[number, number]> = [];
        for (let x = width * 0.18; x <= width * 0.82; x += 12) {
          const y = yBase + Math.sin((x / width) * Math.PI * 4 + wave * 0.6) * 16;
          points.push([x, y]);
        }
        strokeLine(ctx, points, 2.5);
      }
      break;
    }
    case 'schematic': {
      ctx.globalAlpha = 0.8;
      const boxSize = 220;
      const left = width / 2 - boxSize / 2;
      const top = centerY - boxSize / 2;
      ctx.strokeRect(left, top, boxSize, boxSize);
      ctx.strokeRect(left + 25, top + 25, boxSize - 50, boxSize - 50);
      strokeLine(ctx, [[left, top], [left + boxSize, top + boxSize]], 1.5);
      strokeLine(ctx, [[left + boxSize, top], [left, top + boxSize]], 1.5);
      ctx.beginPath();
      ctx.arc(width / 2, centerY, 30, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'windows': {
      ctx.globalAlpha = 0.85;
      const cols = 4;
      const rows = 4;
      const cellW = (width * 0.55) / cols;
      const cellH = 45;
      const startX = width / 2 - (cols * cellW) / 2;
      const startY = centerY - (rows * cellH) / 2;
      for (let c = 0; c < cols; c++) {
        for (let r = 0; r < rows; r++) {
          if ((c + r) % 2 === 0) {
            ctx.fillRect(startX + c * cellW + 4, startY + r * cellH + 4, cellW - 8, cellH - 8);
          } else {
            ctx.strokeRect(startX + c * cellW + 4, startY + r * cellH + 4, cellW - 8, cellH - 8);
          }
        }
      }
      break;
    }
    case 'circuit': {
      ctx.globalAlpha = 0.85;
      for (let i = 0; i < 7; i++) {
        const y = centerY - 90 + i * 30;
        const x1 = width * 0.2;
        const xMid = width * 0.4 + (i % 3) * 40;
        const x2 = width * 0.8;
        strokeLine(
          ctx,
          [
            [x1, y],
            [xMid, y],
            [xMid + 25, y - 20],
            [x2, y - 20],
          ],
          2.5
        );
        ctx.beginPath();
        ctx.arc(x2, y - 20, 5, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case 'branches': {
      ctx.globalAlpha = 0.85;
      const startY = centerY + 120;
      const endY = centerY - 120;
      const cx = width / 2;
      strokeLine(ctx, [[cx, startY], [cx, endY]], 4);
      for (let i = 0; i < 6; i++) {
        const branchY = startY - 35 - i * 32;
        const dir = i % 2 === 0 ? 1 : -1;
        strokeLine(
          ctx,
          [
            [cx, branchY],
            [cx + dir * 65, branchY - 25],
            [cx + dir * 90, branchY - 25],
          ],
          2.5
        );
      }
      break;
    }
    case 'lattice':
    default: {
      const nodes: Array<[number, number]> = [];
      for (let i = 0; i < 22; i++) {
        nodes.push([
          width * 0.18 + random() * (width * 0.64),
          centerY - 130 + random() * 260,
        ]);
      }
      ctx.globalAlpha = 0.35;
      nodes.forEach((pt, i) => {
        nodes.slice(i + 1).forEach((other) => {
          const dist = Math.hypot(pt[0] - other[0], pt[1] - other[1]);
          if (dist < 130) strokeLine(ctx, [pt, other], 2);
        });
      });
      ctx.globalAlpha = 0.95;
      nodes.forEach(([x, y], idx) => {
        ctx.beginPath();
        ctx.arc(x, y, idx % 4 === 0 ? 8 : 4, 0, Math.PI * 2);
        ctx.fill();
      });
      break;
    }
  }

  ctx.restore();
}

export function getFontStacks(book: BookData) {
  const isHindi =
    book.language === 'hi' ||
    /[ऀ-ॿ]/.test(book.title + book.author + (book.excerpt || ''));
  return {
    serif: isHindi
      ? `"Rozha One", "Martel", "Noto Serif Devanagari", "Lora", Georgia, serif`
      : `"Playfair Display", "Lora", "Cormorant Garamond", Georgia, serif`,
    sans: isHindi
      ? `"Noto Sans Devanagari", "Outfit", "Inter", sans-serif`
      : `"Outfit", "Inter", "Helvetica Neue", Arial, sans-serif`,
    mono: MONO_STACK,
  };
}

// ── Global In-Memory Caches for 3D Book Assets ──────────────────────────────
export const BOOK_IMAGE_CACHE = new Map<string, HTMLImageElement>();
const COVER_TEX_CACHE = new Map<string, THREE.CanvasTexture>();
const SPINE_TEX_CACHE = new Map<string, THREE.CanvasTexture>();
const BACK_TEX_CACHE = new Map<string, THREE.CanvasTexture>();

/**
 * Preload an individual book image into in-memory cache
 */
export function preloadBookImage(src: string): Promise<HTMLImageElement> {
  if (BOOK_IMAGE_CACHE.has(src)) {
    const cached = BOOK_IMAGE_CACHE.get(src)!;
    if (cached.complete && cached.naturalWidth > 0) {
      return Promise.resolve(cached);
    }
  }

  return new Promise((resolve) => {
    const img = new Image();
    if (src.startsWith('http://') || src.startsWith('https://')) {
      img.crossOrigin = 'anonymous';
    }
    const onDone = async () => {
      try {
        if ('decode' in img) {
          await img.decode();
        }
      } catch {
        // Ignore decode failures (older browser / progressive stream)
      }
      BOOK_IMAGE_CACHE.set(src, img);
      resolve(img);
    };
    img.onload = onDone;
    img.onerror = () => {
      resolve(img);
    };
    img.src = src;
    if (img.complete && img.naturalWidth > 0) {
      onDone();
    }
  });
}

/**
 * Preloads all book textures and cover images for a list of books
 */
export async function preloadBookAssets(books: BookData[]): Promise<void> {
  const promises: Promise<any>[] = [];
  for (const book of books) {
    if (book.coverImage) {
      promises.push(preloadBookImage(book.coverImage));
    }
  }
  await Promise.allSettled(promises);
  // Pre-generate textures so they are instant in WebGL
  for (const book of books) {
    makeSpineTexture(book);
    makeCoverTexture(book);
    makeBackCoverTexture(book);
  }
}

/**
 * Procedural Spine Texture (240 x 1024)
 * Top-to-bottom vertical title with foil stamped accents, raised bands & imprint
 */
export function makeSpineTexture(book: BookData): THREE.CanvasTexture {
  const cacheKey = `${book.id}-${book.spineColor}-${book.spineTextColor}-${book.title}`;
  if (SPINE_TEX_CACHE.has(cacheKey)) {
    return SPINE_TEX_CACHE.get(cacheKey)!;
  }

  const W = 240;
  const H = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;
  const fonts = getFontStacks(book);

  // Background cloth color
  ctx.fillStyle = book.spineColor;
  ctx.fillRect(0, 0, W, H);

  // Woven cloth texture
  drawClothWeave(ctx, W, H, 0.08);

  const foil = book.foilColor || book.spineTextColor || '#f3ecd8';

  // Headband / tailband gilded stripes
  ctx.fillStyle = foil;
  ctx.globalAlpha = 0.9;
  ctx.fillRect(16, 28, W - 32, 3);
  ctx.fillRect(16, 36, W - 32, 1.5);
  ctx.fillRect(16, H - 38, W - 32, 1.5);
  ctx.fillRect(16, H - 30, W - 32, 3);
  ctx.globalAlpha = 1;

  // Spine Hub Band Shading
  const hubTops = [120, 280, 480, 680, 880];
  hubTops.forEach((top) => {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.fillRect(10, top, W - 20, 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.fillRect(10, top + 2, W - 20, 4);
  });

  // Vertical text
  ctx.save();
  ctx.translate(W / 2, H / 2);
  ctx.rotate(Math.PI / 2);

  ctx.fillStyle = foil;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Title with strict bounds clamping
  const titleSize = fitFontSize(
    ctx,
    book.title.toUpperCase(),
    (s) => `700 ${s}px ${fonts.serif}`,
    H - 300,
    58,
    22
  );
  ctx.font = `700 ${titleSize}px ${fonts.serif}`;
  ctx.fillText(book.title.toUpperCase(), 0, -12);

  // Author below title
  const authorSize = Math.max(14, Math.min(22, titleSize * 0.44));
  ctx.font = `600 ${authorSize}px ${fonts.sans}`;
  ctx.globalAlpha = 0.85;
  ctx.fillText(book.author.toUpperCase(), 0, titleSize * 0.7 + authorSize * 0.5);
  ctx.globalAlpha = 1;

  ctx.restore();

  // Bottom publisher monogram
  ctx.fillStyle = foil;
  ctx.font = `700 18px ${fonts.mono}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.globalAlpha = 0.8;
  ctx.fillText('EXC', W / 2, H - 75);
  ctx.globalAlpha = 1;

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  tex.needsUpdate = true;
  SPINE_TEX_CACHE.set(cacheKey, tex);
  return tex;
}

/**
 * Procedural Front Cover Texture (720 x 1080)
 * Tactile clothbound board with central foil-stamped motif, debossed frame, and refined typography
 */
export function makeCoverTexture(book: BookData): THREE.CanvasTexture {
  const cacheKey = `${book.id}-${book.coverImage || 'procedural'}-${book.coverColor}-${book.motif}`;
  if (COVER_TEX_CACHE.has(cacheKey)) {
    return COVER_TEX_CACHE.get(cacheKey)!;
  }

  const W = 720;
  const H = 1080;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;
  const foil = book.foilColor || book.coverTextColor || '#e7b55f';

  const drawCoverImg = (img: HTMLImageElement) => {
    ctx.clearRect(0, 0, W, H);
    const imgAspect = img.naturalWidth / img.naturalHeight;
    const canvasAspect = W / H;
    let drawW = W;
    let drawH = H;
    let offsetX = 0;
    let offsetY = 0;

    if (imgAspect > canvasAspect) {
      drawW = H * imgAspect;
      offsetX = (W - drawW) / 2;
    } else {
      drawH = W / imgAspect;
      offsetY = (H - drawH) / 2;
    }

    ctx.drawImage(img, offsetX, offsetY, drawW, drawH);
    drawClothWeave(ctx, W, H, 0.05);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 2;
    ctx.strokeRect(18, 18, W - 36, H - 36);
  };

  // If already loaded in cache, draw synchronously right now
  let drawnFromCache = false;
  if (book.coverImage && BOOK_IMAGE_CACHE.has(book.coverImage)) {
    const cached = BOOK_IMAGE_CACHE.get(book.coverImage)!;
    if (cached.complete && cached.naturalWidth > 0) {
      drawCoverImg(cached);
      drawnFromCache = true;
    }
  }

  if (!drawnFromCache) {
    renderProceduralCoverContent(ctx, book, W, H, foil);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  tex.needsUpdate = true;

  // Asynchronous backup load in case not yet cached
  if (book.coverImage && !drawnFromCache) {
    preloadBookImage(book.coverImage).then((img) => {
      if (img.complete && img.naturalWidth > 0) {
        drawCoverImg(img);
        tex.needsUpdate = true;
      }
    });
  }

  COVER_TEX_CACHE.set(cacheKey, tex);
  return tex;
}

function renderProceduralCoverContent(
  ctx: CanvasRenderingContext2D,
  book: BookData,
  W: number,
  H: number,
  foil: string
) {
  const fonts = getFontStacks(book);

  // Board Base Color
  ctx.fillStyle = book.coverColor;
  ctx.fillRect(0, 0, W, H);

  // Woven Linen Cloth Weave
  drawClothWeave(ctx, W, H, 0.09);

  // Outer Hairline Border (Debossed Foil)
  ctx.strokeStyle = foil;
  ctx.globalAlpha = 0.55;
  ctx.lineWidth = 2;
  ctx.strokeRect(36, 36, W - 72, H - 72);

  // Inner Fine Border
  ctx.globalAlpha = 0.3;
  ctx.lineWidth = 1;
  ctx.strokeRect(44, 44, W - 88, H - 88);
  ctx.globalAlpha = 1;

  // Header / Eyebrow
  ctx.fillStyle = foil;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `600 20px ${fonts.mono}`;
  ctx.globalAlpha = 0.75;
  ctx.fillText('EXCELSIOR EDITIONS', W / 2, 88);
  ctx.globalAlpha = 1;

  // Draw Central Procedural Foil Motif
  drawMotif(ctx, book, W, H);

  // Title Block (Lower half of cover)
  const titleAvailable = W - 140;
  const titleStartSize = book.title.length > 20 ? 54 : 70;
  const titleFont = (s: number) => `700 ${s}px ${fonts.serif}`;
  let lines: string[] = [];
  let titleSize = titleStartSize;
  for (let s = titleStartSize; s >= 30; s -= 4) {
    ctx.font = titleFont(s);
    const candidate = wrapLines(ctx, book.title, titleAvailable);
    if (candidate.length <= 3) {
      lines = candidate;
      titleSize = s;
      break;
    }
  }
  if (lines.length === 0) {
    titleSize = 28;
    ctx.font = titleFont(titleSize);
    lines = wrapLines(ctx, book.title, titleAvailable);
  }

  ctx.font = titleFont(titleSize);
  const lineHeight = titleSize * 1.14;
  const totalH = lineHeight * lines.length;
  const startY = H - 240 - totalH / 2;

  ctx.fillStyle = foil;
  ctx.globalAlpha = 0.95;
  lines.forEach((line, i) => {
    ctx.fillText(line, W / 2, startY + i * lineHeight);
  });

  // Foil Accent Divider
  ctx.strokeStyle = foil;
  ctx.globalAlpha = 0.6;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(W / 2 - 50, H - 150);
  ctx.lineTo(W / 2 + 50, H - 150);
  ctx.stroke();

  // Author at Footer
  ctx.font = `600 22px ${fonts.sans}`;
  ctx.globalAlpha = 0.85;
  ctx.fillText(book.author.toUpperCase(), W / 2, H - 110);
  ctx.globalAlpha = 1;
}

/**
 * Procedural Back Cover Texture (720 x 1080)
 * Clothbound back board with stamped foil imprint badge
 */
export function makeBackCoverTexture(book: BookData): THREE.CanvasTexture {
  const cacheKey = `${book.id}-${book.coverColor}-${book.foilColor || book.coverTextColor}`;
  if (BACK_TEX_CACHE.has(cacheKey)) {
    return BACK_TEX_CACHE.get(cacheKey)!;
  }

  const W = 720;
  const H = 1080;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;
  const fonts = getFontStacks(book);

  ctx.fillStyle = book.coverColor;
  ctx.fillRect(0, 0, W, H);

  drawClothWeave(ctx, W, H, 0.09);

  const foil = book.foilColor || book.coverTextColor || '#e7b55f';

  // Hairline border
  ctx.strokeStyle = foil;
  ctx.globalAlpha = 0.45;
  ctx.lineWidth = 2;
  ctx.strokeRect(36, 36, W - 72, H - 72);

  // Center Imprint Badge
  ctx.fillStyle = foil;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.beginPath();
  ctx.arc(W / 2, H / 2 - 20, 48, 0, Math.PI * 2);
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.font = `700 24px ${fonts.serif}`;
  ctx.globalAlpha = 0.9;
  ctx.fillText('EXC', W / 2, H / 2 - 20);

  ctx.font = `600 16px ${fonts.mono}`;
  ctx.globalAlpha = 0.7;
  ctx.fillText('THE COMPLETE SHELF', W / 2, H / 2 + 50);
  ctx.fillText('CURATED EDITION', W / 2, H / 2 + 74);
  ctx.globalAlpha = 1;

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  tex.needsUpdate = true;
  BACK_TEX_CACHE.set(cacheKey, tex);
  return tex;
}

/**
 * Image-backed cover loader with graceful procedural fallback
 */
export function makeImageCoverTexture(book: BookData): THREE.Texture {
  const loader = new THREE.TextureLoader();
  loader.crossOrigin = 'anonymous';
  const tex = loader.load(
    book.coverImage!,
    (t) => {
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = 8;
      t.needsUpdate = true;
    },
    undefined,
    () => {
      const fallback = makeCoverTexture(book);
      tex.image = fallback.image as unknown as HTMLImageElement;
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.needsUpdate = true;
    }
  );
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * Inside Page Texture (640 x 960) — Excerpt Page (Right Page in 3D open spread)
 */
export function makeInsidePageTexture(book: BookData): THREE.CanvasTexture {
  const W = 640;
  const H = 960;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;
  const fonts = getFontStacks(book);

  ctx.fillStyle = '#f7efd9';
  ctx.fillRect(0, 0, W, H);

  // Subtle paper grain
  ctx.fillStyle = 'rgba(20, 14, 4, 0.025)';
  for (let i = 0; i < 300; i++) {
    ctx.fillRect(Math.random() * W, Math.random() * H, 1, 1);
  }

  // Opening ornament
  const ornament = book.rightPageOrnament || '— § —';
  ctx.fillStyle = '#3a2a14';
  ctx.font = `500 52px ${fonts.serif}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(ornament, W / 2, 210);

  // Excerpt
  ctx.fillStyle = '#1a1208';
  const excerptText = book.excerpt ? `"${book.excerpt.trim()}"` : (book.synopsis ? `"${book.synopsis.trim()}"` : '');
  const excerptAvailable = W - 140;
  const excerptFont = (s: number) => `italic 500 ${s}px ${fonts.serif}`;
  let excerptLines: string[] = [];
  let excerptSize = 38;
  for (let s = 42; s >= 20; s -= 2) {
    ctx.font = excerptFont(s);
    const candidate = wrapLines(ctx, excerptText, excerptAvailable);
    if (candidate.length <= 6) {
      excerptLines = candidate;
      excerptSize = s;
      break;
    }
  }
  if (excerptLines.length === 0) {
    excerptSize = 20;
    ctx.font = excerptFont(excerptSize);
    excerptLines = wrapLines(ctx, excerptText, excerptAvailable);
  }
  ctx.font = excerptFont(excerptSize);
  const lineHeight = excerptSize * 1.45;
  const totalH = lineHeight * excerptLines.length;
  const startY = H / 2 - totalH / 2 + lineHeight / 2;
  excerptLines.forEach((line, i) => ctx.fillText(line, W / 2, startY + i * lineHeight));

  // Foot meta
  ctx.fillStyle = '#3a2a14';
  ctx.font = `600 16px ${fonts.mono}`;
  ctx.globalAlpha = 0.75;
  ctx.fillText(
    `${book.title}  ·  ${book.author}`,
    W / 2,
    H - 96
  );
  ctx.globalAlpha = 1;

  ctx.font = `500 15px ${fonts.sans}`;
  ctx.globalAlpha = 0.5;
  ctx.fillText('· 1 ·', W / 2, H - 56);
  ctx.globalAlpha = 1;

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  return tex;
}

/**
 * Inside Cover (frontispiece) Texture (640 x 960) — Left Page in 3D open spread
 */
export function makeInsideCoverTexture(book: BookData): THREE.CanvasTexture {
  const W = 640;
  const H = 960;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;
  const fonts = getFontStacks(book);

  ctx.fillStyle = '#f3ead2';
  ctx.fillRect(0, 0, W, H);

  ctx.strokeStyle = 'rgba(58, 42, 20, 0.3)';
  ctx.lineWidth = 1;
  ctx.strokeRect(40, 40, W - 80, H - 80);

  ctx.fillStyle = '#3a2a14';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Eyebrow
  const headerText = book.leftPageHeader || 'FROM THE SHELF OF EXCELSIOR';
  ctx.font = `600 15px ${fonts.mono}`;
  ctx.globalAlpha = 0.75;
  ctx.fillText(headerText, W / 2, H / 2 - 96);
  ctx.globalAlpha = 1;

  // Title
  const titleAvailable = W - 120;
  const titleFont = (s: number) => `700 ${s}px ${fonts.serif}`;
  let lines: string[] = [];
  let titleSize = 36;
  for (let s = 36; s >= 22; s -= 2) {
    ctx.font = titleFont(s);
    const candidate = wrapLines(ctx, book.title, titleAvailable);
    if (candidate.length <= 3) {
      lines = candidate;
      titleSize = s;
      break;
    }
  }
  if (lines.length === 0) {
    titleSize = 22;
    ctx.font = titleFont(titleSize);
    lines = wrapLines(ctx, book.title, titleAvailable);
  }
  ctx.font = titleFont(titleSize);
  const lineH = titleSize * 1.25;
  const totalH = lineH * lines.length;
  const startY = H / 2 - totalH / 2 + lineH / 2;
  lines.forEach((l, i) => ctx.fillText(l, W / 2, startY + i * lineH));

  // Author
  ctx.font = `600 20px ${fonts.sans}`;
  ctx.globalAlpha = 0.85;
  ctx.fillText(book.author, W / 2, H / 2 + 64);
  ctx.globalAlpha = 1;

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  return tex;
}
