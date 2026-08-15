import * as THREE from 'three';
import { BookData } from './hardback-data';

export const SERIF_STACK = `"Playfair Display", "Cormorant Garamond", Georgia, "Times New Roman", serif`;
export const SANS_STACK = `"Helvetica Neue", Helvetica, Arial, sans-serif`;
export const PAGE_EDGE_COLOR = '#e8d8a8';
export const INNER_CREAM_COLOR = '#f3ead2';

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
 * Procedural Spine Texture (200 x 1024)
 * Title rotated +90° so it reads top-to-bottom
 */
export function makeSpineTexture(book: BookData): THREE.CanvasTexture {
  const W = 200;
  const H = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  // Background
  ctx.fillStyle = book.spineColor;
  ctx.fillRect(0, 0, W, H);

  // Two horizontal accent bands at head + tail (~15% alpha of text colour)
  const accent = book.spineTextColor.startsWith('#')
    ? book.spineTextColor + '26'
    : 'rgba(243, 236, 216, 0.15)';
  ctx.fillStyle = accent;
  ctx.fillRect(0, 26, W, 2);
  ctx.fillRect(0, H - 28, W, 2);

  ctx.save();
  ctx.translate(W / 2, H / 2);
  ctx.rotate(Math.PI / 2); // rotate text +90°

  ctx.fillStyle = book.spineTextColor;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Title fits within H-200px margin
  const titleSize = fitFontSize(
    ctx,
    book.title.toUpperCase(),
    (s) => `600 ${s}px ${SERIF_STACK}`,
    H - 200,
    72,
    32
  );
  ctx.font = `600 ${titleSize}px ${SERIF_STACK}`;
  ctx.fillText(book.title.toUpperCase(), 0, -10);

  // Author below — sans, smaller
  const authorSize = Math.max(18, Math.min(28, titleSize * 0.42));
  ctx.font = `500 ${authorSize}px ${SANS_STACK}`;
  ctx.fillText(book.author.toUpperCase(), 0, titleSize * 0.7 + authorSize * 0.6);

  ctx.restore();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  return tex;
}

/**
 * Procedural Cover Texture (640 x 960)
 */
export function makeCoverTexture(book: BookData): THREE.CanvasTexture {
  const W = 640;
  const H = 960;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  // Background
  ctx.fillStyle = book.coverColor;
  ctx.fillRect(0, 0, W, H);

  // Hairline frame, 28px inset, ~20% alpha of text colour
  const strokeColor = book.coverTextColor.startsWith('#')
    ? book.coverTextColor + '33'
    : 'rgba(243, 236, 216, 0.2)';
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = 2;
  ctx.strokeRect(28, 28, W - 56, H - 56);

  ctx.fillStyle = book.coverTextColor;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Eyebrow — small caps, 70% alpha
  ctx.font = `500 22px ${SANS_STACK}`;
  ctx.globalAlpha = 0.7;
  ctx.fillText('THE COLLECTION', W / 2, 86);
  ctx.globalAlpha = 1;

  // Title — wrap up to 3 lines, fit to W-130 width
  const titleAvailable = W - 130;
  const titleStartSize = book.title.length > 18 ? 72 : 92;
  const titleFont = (s: number) => `700 ${s}px ${SERIF_STACK}`;
  let lines: string[] = [];
  let titleSize = titleStartSize;
  for (let s = titleStartSize; s >= 36; s -= 4) {
    ctx.font = titleFont(s);
    const candidate = wrapLines(ctx, book.title, titleAvailable);
    if (candidate.length <= 3) {
      lines = candidate;
      titleSize = s;
      break;
    }
  }
  if (lines.length === 0) {
    titleSize = 36;
    ctx.font = titleFont(titleSize);
    lines = wrapLines(ctx, book.title, titleAvailable);
  }
  ctx.font = titleFont(titleSize);
  const lineHeight = titleSize * 1.08;
  const totalH = lineHeight * lines.length;
  const startY = H / 2 - totalH / 2 + lineHeight / 2;
  lines.forEach((line, i) => ctx.fillText(line, W / 2, startY + i * lineHeight));

  // Hairline divider above author at 50% alpha
  ctx.strokeStyle = book.coverTextColor;
  ctx.globalAlpha = 0.5;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(W / 2 - 60, H - 170);
  ctx.lineTo(W / 2 + 60, H - 170);
  ctx.stroke();
  ctx.globalAlpha = 1;

  // Author at the foot
  ctx.font = `500 26px ${SANS_STACK}`;
  ctx.fillText(book.author.toUpperCase(), W / 2, H - 130);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  tex.needsUpdate = true;
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
      t.anisotropy = 4;
      t.needsUpdate = true;
    },
    undefined,
    () => {
      // On error — silently fall back to the procedural cover
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
 * Inside Page Texture (640 x 960) — Excerpt Page
 * Visible on the +Z face of the page block when open
 */
export function makeInsidePageTexture(book: BookData): THREE.CanvasTexture {
  const W = 640;
  const H = 960;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#f7efd9'; // cream paper
  ctx.fillRect(0, 0, W, H);

  // Subtle paper grain — ~280 single-pixel dark dots
  ctx.fillStyle = 'rgba(20, 14, 4, 0.025)';
  for (let i = 0; i < 280; i++) {
    ctx.fillRect(Math.random() * W, Math.random() * H, 1, 1);
  }

  // "—" mark, 60px serif
  ctx.fillStyle = '#3a2a14';
  ctx.font = `500 60px ${SERIF_STACK}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('—', W / 2, 220);

  // Excerpt — italic, wrap up to 6 lines, fit 22–42px
  ctx.fillStyle = '#1a1208';
  const excerptAvailable = W - 140;
  const excerptFont = (s: number) => `italic 500 ${s}px ${SERIF_STACK}`;
  let excerptLines: string[] = [];
  let excerptSize = 38;
  for (let s = 42; s >= 22; s -= 2) {
    ctx.font = excerptFont(s);
    const candidate = wrapLines(ctx, `"${book.excerpt}"`, excerptAvailable);
    if (candidate.length <= 6) {
      excerptLines = candidate;
      excerptSize = s;
      break;
    }
  }
  ctx.font = excerptFont(excerptSize);
  const lineHeight = excerptSize * 1.45;
  const totalH = lineHeight * excerptLines.length;
  const startY = H / 2 - totalH / 2 + lineHeight / 2;
  excerptLines.forEach((line, i) => ctx.fillText(line, W / 2, startY + i * lineHeight));

  // Foot meta-line — small caps title · author
  ctx.fillStyle = '#3a2a14';
  ctx.font = `500 18px ${SANS_STACK}`;
  ctx.globalAlpha = 0.75;
  ctx.fillText(
    `${book.title.toUpperCase()}  ·  ${book.author.toUpperCase()}`,
    W / 2,
    H - 96
  );
  ctx.globalAlpha = 1;

  // Page number "· 1 ·"
  ctx.fillStyle = '#3a2a14';
  ctx.font = `500 16px ${SANS_STACK}`;
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
 * Inside Cover (frontispiece) Texture (640 x 960)
 * Visible on the back face (-Z) of the hinged front cover
 */
export function makeInsideCoverTexture(book: BookData): THREE.CanvasTexture {
  const W = 640;
  const H = 960;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#f3ead2'; // tinted endpaper
  ctx.fillRect(0, 0, W, H);

  ctx.strokeStyle = 'rgba(58, 42, 20, 0.32)';
  ctx.lineWidth = 1;
  ctx.strokeRect(40, 40, W - 80, H - 80);

  ctx.fillStyle = '#3a2a14';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.font = `500 18px ${SANS_STACK}`;
  ctx.globalAlpha = 0.7;
  ctx.fillText('FROM THE LIBRARY OF', W / 2, H / 2 - 96);
  ctx.globalAlpha = 1;

  ctx.font = `600 36px ${SERIF_STACK}`;
  ctx.fillText(book.title, W / 2, H / 2);

  ctx.font = `500 22px ${SANS_STACK}`;
  ctx.globalAlpha = 0.85;
  ctx.fillText(book.author, W / 2, H / 2 + 64);
  ctx.globalAlpha = 1;

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  return tex;
}
