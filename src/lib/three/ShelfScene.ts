/**
 * ShelfScene — The Complete Shelf
 *
 * A warm editorial 3D library with a continuous walnut shelf of
 * clothbound hardcovers.  Browse by dragging, scrolling, or keyboard.
 * Select a book to pull it forward; inspect it with orbit/pan/zoom.
 *
 * Vanilla Three.js — no React Three Fiber.
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// ─── Types ──────────────────────────────────────────────────────────────────

interface BookConfig {
  thickness: number;   // spine width (X)
  height: number;      // book height (Y)
  depth: number;       // cover width (Z)
  coverColor: string;  // cloth cover hex
  foilColor: string;   // foil stamp hex
  motifType: number;   // 0-4 — foil pattern on spine
  title: string;
  author: string;
}

export interface BookInfo {
  index: number;
  title: string;
  author: string;
  color: string;
}

export interface ShelfCallbacks {
  onBookSelect: (info: BookInfo | null) => void;
  onModeChange: (mode: 'browse' | 'selected' | 'inspecting') => void;
  onReady: () => void;
}

// ─── Book Library ───────────────────────────────────────────────────────────

const BOOKS: BookConfig[] = [
  { thickness: 0.14, height: 0.88, depth: 0.55, coverColor: '#6B2D3E', foilColor: '#C4A35A', motifType: 0, title: 'Meridian',          author: 'E. Blackwell' },
  { thickness: 0.10, height: 0.75, depth: 0.48, coverColor: '#1B3A5C', foilColor: '#D4AF37', motifType: 1, title: 'The Quiet Hours',    author: 'S. Tanaka' },
  { thickness: 0.18, height: 0.82, depth: 0.56, coverColor: '#2D5A3E', foilColor: '#B8860B', motifType: 3, title: 'Verdant',            author: 'L. Hargrove' },
  { thickness: 0.09, height: 0.78, depth: 0.50, coverColor: '#3D3D3D', foilColor: '#C0C0C0', motifType: 2, title: 'Monolith',           author: 'K. Voss' },
  { thickness: 0.16, height: 0.95, depth: 0.62, coverColor: '#8B6914', foilColor: '#F5F0E8', motifType: 4, title: 'The Amber Index',    author: 'D. Calloway' },
  { thickness: 0.08, height: 0.70, depth: 0.45, coverColor: '#4A5568', foilColor: '#D4AF37', motifType: 1, title: 'Slate',              author: 'M. Finch' },
  { thickness: 0.20, height: 0.85, depth: 0.54, coverColor: '#9B6B7B', foilColor: '#C4A35A', motifType: 0, title: 'Bloom & Wither',     author: 'A. Rosewood' },
  { thickness: 0.11, height: 0.80, depth: 0.52, coverColor: '#1A5C5C', foilColor: '#B8860B', motifType: 3, title: 'Undertow',           author: 'J. Pereira' },
  { thickness: 0.22, height: 0.92, depth: 0.60, coverColor: '#E8DCC8', foilColor: '#5C3D2E', motifType: 2, title: 'Parchment',          author: 'R. Ellsworth' },
  { thickness: 0.09, height: 0.72, depth: 0.46, coverColor: '#6B8E6B', foilColor: '#D4AF37', motifType: 4, title: 'Fern & Stone',       author: 'C. Whitfield' },
  { thickness: 0.15, height: 0.88, depth: 0.56, coverColor: '#5B2C6F', foilColor: '#C4A35A', motifType: 0, title: 'Ultraviolet',        author: 'N. Okafor' },
  { thickness: 0.17, height: 0.78, depth: 0.50, coverColor: '#A0522D', foilColor: '#F5F0E8', motifType: 1, title: 'Fired Earth',        author: 'T. Brennan' },
  { thickness: 0.12, height: 0.95, depth: 0.62, coverColor: '#0D2137', foilColor: '#D4AF37', motifType: 3, title: 'Constellation',      author: 'I. Nakamura' },
  { thickness: 0.19, height: 0.75, depth: 0.48, coverColor: '#556B2F', foilColor: '#C4A35A', motifType: 2, title: 'Olive Season',       author: 'P. Durand' },
  { thickness: 0.10, height: 0.82, depth: 0.54, coverColor: '#7B6B8E', foilColor: '#B8860B', motifType: 4, title: 'Amethyst Hour',      author: 'F. Castellani' },
  { thickness: 0.21, height: 0.80, depth: 0.52, coverColor: '#7A5C3C', foilColor: '#D4AF37', motifType: 0, title: 'Copperfield Notes',  author: 'W. Ashton' },
  { thickness: 0.11, height: 0.90, depth: 0.58, coverColor: '#6E7B7A', foilColor: '#C0C0C0', motifType: 1, title: 'Still Water',        author: 'H. Lindström' },
  { thickness: 0.16, height: 0.76, depth: 0.49, coverColor: '#2E1A47', foilColor: '#C4A35A', motifType: 3, title: 'The Indigo Margin',  author: 'B. Kavuri' },
  { thickness: 0.13, height: 0.85, depth: 0.55, coverColor: '#B8A88A', foilColor: '#5C3D2E', motifType: 2, title: 'Sandstone',          author: 'G. Morales' },
];

// ─── Constants ──────────────────────────────────────────────────────────────

const CREAM       = 0xFAF7F2;
const PAGE_CREAM  = 0xF5F0E8;
const WALNUT      = 0x5C3D2E;
const WALNUT_DARK = 0x3D2820;

const BOOK_GAP       = 0.012;
const COVER_BOARD    = 0.005;  // thickness of rigid cover boards
const COVER_OVERHANG = 0.006;  // cover extends past page block

const CAMERA_Y    = 0.50;
const CAMERA_Z    = 1.90;
const CAMERA_FOV  = 38;

const LERP_SPEED       = 0.065;
const PULL_OUT_Z       = 0.55;
const INSPECT_Z        = 0.90;
const INSPECT_ROT_Y    = -Math.PI / 5;
const SELECT_ROT_Y     = -Math.PI / 14;

const DRAG_SENSITIVITY = 0.003;
const WHEEL_SENSITIVITY = 0.0012;
const VELOCITY_DAMPING  = 0.92;
const CLICK_THRESHOLD   = 5; // px — distinguish click from drag

// ─── ShelfScene ─────────────────────────────────────────────────────────────

export class ShelfScene {
  // Core Three.js
  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private clock: THREE.Clock;
  private container: HTMLDivElement;
  private animFrameId = 0;

  // Objects
  private books: THREE.Group[] = [];
  private bookXPositions: number[] = []; // rest X of each book
  private shelfGroup!: THREE.Group;

  // Controls
  private orbitControls!: OrbitControls;
  private savedCameraPos = new THREE.Vector3();
  private savedCameraTarget = new THREE.Vector3();

  // Browsing state
  private targetCameraX = 0;
  private velocityX = 0;
  private minCameraX = 0;
  private maxCameraX = 0;

  // Interaction
  private isDragging = false;
  private pointerDownX = 0;
  private pointerTravelX = 0;
  private dragStartCameraX = 0;
  private raycaster = new THREE.Raycaster();
  private pointerNDC = new THREE.Vector2();

  // Selection / inspection state
  private selectedIndex = -1;
  private mode: 'browse' | 'selected' | 'inspecting' = 'browse';
  private pullOutProgress = 0;   // current pull amount
  private pullOutTarget = 0;     // desired pull amount
  private bookRotProgress = 0;   // current Y rotation
  private bookRotTarget = 0;     // desired Y rotation

  // Callbacks
  private callbacks: ShelfCallbacks;

  // Bound event handlers (for cleanup)
  private _onPointerDown: (e: PointerEvent) => void;
  private _onPointerMove: (e: PointerEvent) => void;
  private _onPointerUp: (e: PointerEvent) => void;
  private _onWheel: (e: WheelEvent) => void;
  private _onKeyDown: (e: KeyboardEvent) => void;
  private _onResize: () => void;

  // ── Constructor ────────────────────────────────────────────

  constructor(container: HTMLDivElement, callbacks: ShelfCallbacks) {
    this.container = container;
    this.callbacks = callbacks;
    this.clock = new THREE.Clock();

    this.initRenderer();
    this.initCamera();
    this.initScene();
    this.initLighting();
    this.buildShelf();
    this.buildBooks();
    this.initOrbitControls();

    // Bind events
    this._onPointerDown = this.onPointerDown.bind(this);
    this._onPointerMove = this.onPointerMove.bind(this);
    this._onPointerUp   = this.onPointerUp.bind(this);
    this._onWheel       = this.onWheel.bind(this);
    this._onKeyDown     = this.onKeyDown.bind(this);
    this._onResize      = this.onResize.bind(this);

    const canvas = this.renderer.domElement;
    canvas.addEventListener('pointerdown', this._onPointerDown);
    canvas.addEventListener('pointermove', this._onPointerMove);
    canvas.addEventListener('pointerup',   this._onPointerUp);
    canvas.addEventListener('pointercancel', this._onPointerUp);
    canvas.addEventListener('wheel', this._onWheel, { passive: false });
    window.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('resize', this._onResize);

    // Centre camera on middle book
    const midIdx = Math.floor(BOOKS.length / 2);
    this.targetCameraX = this.bookXPositions[midIdx] ?? 0;
    this.camera.position.x = this.targetCameraX;

    this.animate();
    callbacks.onReady();
  }

  // ── Renderer ───────────────────────────────────────────────

  private initRenderer(): void {
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.setClearColor(CREAM);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.container.appendChild(this.renderer.domElement);
  }

  // ── Camera ─────────────────────────────────────────────────

  private initCamera(): void {
    const aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(CAMERA_FOV, aspect, 0.05, 50);
    this.camera.position.set(0, CAMERA_Y, CAMERA_Z);
  }

  // ── Scene ──────────────────────────────────────────────────

  private initScene(): void {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(CREAM);

    // Subtle warm fog for depth
    this.scene.fog = new THREE.Fog(CREAM, 3.5, 8);
  }

  // ── Lighting ───────────────────────────────────────────────

  private initLighting(): void {
    // Ambient — warm fill
    const ambient = new THREE.AmbientLight(0xFFF5E6, 0.5);
    this.scene.add(ambient);

    // Key light — warm directional from above-right-front
    const key = new THREE.DirectionalLight(0xFFE8CC, 0.9);
    key.position.set(2, 3, 3);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.near = 0.1;
    key.shadow.camera.far = 10;
    key.shadow.camera.left = -4;
    key.shadow.camera.right = 4;
    key.shadow.camera.top = 2;
    key.shadow.camera.bottom = -1;
    key.shadow.bias = -0.002;
    key.shadow.normalBias = 0.02;
    this.scene.add(key);

    // Fill — softer from opposite side
    const fill = new THREE.DirectionalLight(0xE8E0D6, 0.35);
    fill.position.set(-2, 1.5, 2);
    this.scene.add(fill);

    // Accent from below-front for gentle shelf glow
    const accent = new THREE.PointLight(0xFFD4A0, 0.2, 6);
    accent.position.set(0, -0.2, 2);
    this.scene.add(accent);
  }

  // ── Shelf ──────────────────────────────────────────────────

  private buildShelf(): void {
    this.shelfGroup = new THREE.Group();

    // Walnut materials
    const walnutMat = new THREE.MeshStandardMaterial({
      color: WALNUT,
      roughness: 0.65,
      metalness: 0.05,
    });
    const walnutDarkMat = new THREE.MeshStandardMaterial({
      color: WALNUT_DARK,
      roughness: 0.75,
      metalness: 0.04,
    });

    // Calculate total shelf width
    let totalWidth = 0;
    for (const b of BOOKS) totalWidth += b.thickness;
    totalWidth += (BOOKS.length - 1) * BOOK_GAP;
    const shelfPadding = 0.15;
    const fullWidth = totalWidth + shelfPadding * 2;

    const maxHeight = Math.max(...BOOKS.map(b => b.height));
    const maxDepth = Math.max(...BOOKS.map(b => b.depth));

    const shelfThickness = 0.025;
    const backDepth = maxDepth + 0.08;

    // Bottom plank
    const bottomGeo = new THREE.BoxGeometry(fullWidth, shelfThickness, backDepth);
    const bottom = new THREE.Mesh(bottomGeo, walnutMat);
    bottom.position.set(totalWidth / 2, -shelfThickness / 2, -backDepth / 2 + maxDepth * 0.55);
    bottom.receiveShadow = true;
    this.shelfGroup.add(bottom);

    // Back panel
    const backPanelH = maxHeight + 0.20;
    const backGeo = new THREE.BoxGeometry(fullWidth, backPanelH, 0.012);
    const backPanel = new THREE.Mesh(backGeo, walnutDarkMat);
    backPanel.position.set(totalWidth / 2, backPanelH / 2 - shelfThickness, -backDepth / 2 + maxDepth * 0.55 - backDepth / 2 + 0.006);
    backPanel.receiveShadow = true;
    this.shelfGroup.add(backPanel);

    // Top shelf/molding
    const topGeo = new THREE.BoxGeometry(fullWidth, shelfThickness * 0.6, backDepth * 0.7);
    const top = new THREE.Mesh(topGeo, walnutMat);
    top.position.set(totalWidth / 2, maxHeight + 0.08, -backDepth / 2 + maxDepth * 0.55);
    this.shelfGroup.add(top);

    // Left bookend
    const endH = maxHeight + 0.04;
    const endGeo = new THREE.BoxGeometry(0.015, endH, backDepth * 0.5);
    const leftEnd = new THREE.Mesh(endGeo, walnutMat);
    leftEnd.position.set(-shelfPadding + 0.03, endH / 2, -backDepth / 2 + maxDepth * 0.55 + 0.06);
    this.shelfGroup.add(leftEnd);

    // Right bookend
    const rightEnd = new THREE.Mesh(endGeo, walnutMat);
    rightEnd.position.set(totalWidth + shelfPadding - 0.03, endH / 2, -backDepth / 2 + maxDepth * 0.55 + 0.06);
    this.shelfGroup.add(rightEnd);

    this.scene.add(this.shelfGroup);
  }

  // ── Books ──────────────────────────────────────────────────

  private buildBooks(): void {
    let x = 0;

    for (let i = 0; i < BOOKS.length; i++) {
      const cfg = BOOKS[i];
      const book = this.createBook(cfg, i);

      // Position on shelf — bottom of book at Y=0, spine facing +Z
      const centerX = x + cfg.thickness / 2;
      book.position.set(centerX, cfg.height / 2, 0);
      book.userData = { bookIndex: i, restX: centerX, restZ: 0, restRotY: 0 };

      this.books.push(book);
      this.bookXPositions.push(centerX);
      this.scene.add(book);

      x += cfg.thickness + BOOK_GAP;
    }

    // Camera bounds
    const margin = 0.3;
    this.minCameraX = this.bookXPositions[0] - margin;
    this.maxCameraX = this.bookXPositions[this.bookXPositions.length - 1] + margin;
  }

  private createBook(cfg: BookConfig, _index: number): THREE.Group {
    const group = new THREE.Group();
    const { thickness, height, depth, coverColor, foilColor } = cfg;

    // ── Materials ──
    const coverMat = new THREE.MeshStandardMaterial({
      color: coverColor,
      roughness: 0.82,
      metalness: 0.02,
    });
    const pageMat = new THREE.MeshStandardMaterial({
      color: PAGE_CREAM,
      roughness: 0.92,
      metalness: 0.0,
    });
    const foilMat = new THREE.MeshStandardMaterial({
      color: foilColor,
      roughness: 0.28,
      metalness: 0.72,
    });

    // ── Page block ──
    const pageThick = thickness - COVER_BOARD * 2;
    const pageH = height - COVER_OVERHANG * 2;
    const pageD = depth - COVER_BOARD - COVER_OVERHANG;

    const pageGeo = new THREE.BoxGeometry(pageThick, pageH, pageD);
    const pages = new THREE.Mesh(pageGeo, pageMat);
    pages.position.set(0, 0, -(COVER_BOARD + COVER_OVERHANG) / 2);
    pages.castShadow = true;
    pages.receiveShadow = true;
    group.add(pages);

    // ── Front cover (+X side) ──
    const coverGeo = new THREE.BoxGeometry(COVER_BOARD, height, depth);
    const frontCover = new THREE.Mesh(coverGeo, coverMat);
    frontCover.position.x = thickness / 2 - COVER_BOARD / 2;
    frontCover.castShadow = true;
    frontCover.receiveShadow = true;
    group.add(frontCover);

    // ── Back cover (-X side) ──
    const backCover = new THREE.Mesh(coverGeo, coverMat);
    backCover.position.x = -(thickness / 2 - COVER_BOARD / 2);
    backCover.castShadow = true;
    group.add(backCover);

    // ── Spine (facing camera, +Z) ──
    const spineGeo = new THREE.BoxGeometry(thickness, height, COVER_BOARD);
    const spine = new THREE.Mesh(spineGeo, coverMat);
    spine.position.z = depth / 2 - COVER_BOARD / 2;
    spine.castShadow = true;
    group.add(spine);

    // ── Raised Spine Bands / Ribs (Iconic Hardcover Detailing) ──
    const numRibs = 4;
    const ribStep = (height * 0.7) / (numRibs - 1);
    const ribStart = -(height * 0.35);
    const ribGeo = new THREE.BoxGeometry(thickness * 1.02, 0.008, COVER_BOARD * 1.5);
    for (let r = 0; r < numRibs; r++) {
      const rib = new THREE.Mesh(ribGeo, coverMat);
      rib.position.set(0, ribStart + r * ribStep, depth / 2 + 0.001);
      group.add(rib);
    }

    // ── Headbands (Colored Woven Cloth Tape at Top and Bottom of Spine) ──
    const headbandMat = new THREE.MeshStandardMaterial({
      color: 0x8B0000, // Rich burgundy woven accent
      roughness: 0.9,
    });
    const headbandGeo = new THREE.BoxGeometry(thickness - COVER_BOARD * 2, 0.008, 0.01);
    
    const topHeadband = new THREE.Mesh(headbandGeo, headbandMat);
    topHeadband.position.set(0, height / 2 - COVER_OVERHANG, depth / 2 - 0.015);
    group.add(topHeadband);

    const bottomHeadband = new THREE.Mesh(headbandGeo, headbandMat);
    bottomHeadband.position.set(0, -(height / 2 - COVER_OVERHANG), depth / 2 - 0.015);
    group.add(bottomHeadband);

    // ── Foil motifs on spine face ──
    const spineZ = depth / 2 + 0.0005;
    this.addFoilMotif(group, cfg.motifType, thickness, height, spineZ, foilMat);

    return group;
  }

  private addFoilMotif(
    group: THREE.Group,
    motif: number,
    thick: number,
    h: number,
    z: number,
    mat: THREE.MeshStandardMaterial,
  ): void {
    const addRect = (w: number, rh: number, y: number) => {
      const geo = new THREE.BoxGeometry(w, rh, 0.001);
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(0, y, z);
      group.add(mesh);
    };

    const addLine = (w: number, y: number) => {
      addRect(w, 0.003, y);
    };

    const addCircle = (r: number, y: number) => {
      const geo = new THREE.CircleGeometry(r, 16);
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(0, y, z);
      group.add(mesh);
    };

    switch (motif) {
      case 0: // Classic — two lines framing a title block
        addLine(thick * 0.55, h * 0.20);
        addRect(thick * 0.45, h * 0.055, h * 0.06);
        addLine(thick * 0.55, -h * 0.08);
        addRect(thick * 0.30, h * 0.025, -h * 0.28);
        break;

      case 1: // Modern — circle + line
        addCircle(thick * 0.14, h * 0.25);
        addRect(thick * 0.40, h * 0.04, h * 0.03);
        addLine(thick * 0.35, -h * 0.18);
        break;

      case 2: // Minimal — single element
        addRect(thick * 0.50, h * 0.05, h * 0.10);
        addLine(thick * 0.60, -h * 0.05);
        break;

      case 3: // Ornate — stacked lines + diamond
        addLine(thick * 0.50, h * 0.28);
        addLine(thick * 0.35, h * 0.24);
        addRect(thick * 0.22, h * 0.045, h * 0.08);
        addLine(thick * 0.50, -h * 0.06);
        addLine(thick * 0.35, -h * 0.10);
        // Diamond (rotated square)
        const dSz = thick * 0.10;
        const dGeo = new THREE.BoxGeometry(dSz, dSz, 0.001);
        const dMesh = new THREE.Mesh(dGeo, mat);
        dMesh.position.set(0, -h * 0.26, z);
        dMesh.rotation.z = Math.PI / 4;
        group.add(dMesh);
        break;

      case 4: // Geometric — square + dots
        addRect(thick * 0.25, thick * 0.25, h * 0.18);
        addCircle(thick * 0.04, h * 0.02);
        addCircle(thick * 0.04, -h * 0.04);
        addCircle(thick * 0.04, -h * 0.10);
        addRect(thick * 0.40, h * 0.03, -h * 0.25);
        break;
    }
  }

  // ── Orbit Controls (for inspection) ────────────────────────

  private initOrbitControls(): void {
    this.orbitControls = new OrbitControls(this.camera, this.renderer.domElement);
    this.orbitControls.enabled = false;
    this.orbitControls.enableDamping = true;
    this.orbitControls.dampingFactor = 0.06;
    this.orbitControls.minDistance = 0.3;
    this.orbitControls.maxDistance = 3;
    this.orbitControls.maxPolarAngle = Math.PI * 0.85;
    this.orbitControls.minPolarAngle = Math.PI * 0.15;
    this.orbitControls.enablePan = true;
    this.orbitControls.panSpeed = 0.5;
  }

  // ── Public API (called from React) ─────────────────────────

  public getBookCount(): number {
    return BOOKS.length;
  }

  public getAllBookInfo(): BookInfo[] {
    return BOOKS.map((b, i) => ({
      index: i,
      title: b.title,
      author: b.author,
      color: b.coverColor,
    }));
  }

  /** Scroll to a specific book by index */
  public navigateTo(index: number): void {
    if (this.mode === 'inspecting') return;
    const clamped = Math.max(0, Math.min(BOOKS.length - 1, index));
    this.targetCameraX = this.bookXPositions[clamped];
    this.velocityX = 0;

    if (this.mode === 'selected' && this.selectedIndex !== clamped) {
      this.deselectBook();
    }
  }

  /** Step left/right */
  public navigateBy(delta: number): void {
    if (this.mode === 'inspecting') return;

    const currentIdx = this.nearestBookIndex();
    const next = Math.max(0, Math.min(BOOKS.length - 1, currentIdx + delta));
    this.navigateTo(next);
  }

  /** Select a book (pull it forward) */
  public selectBook(index: number): void {
    if (index < 0 || index >= BOOKS.length) return;
    if (this.mode === 'inspecting') return;

    // Deselect previous
    if (this.selectedIndex >= 0 && this.selectedIndex !== index) {
      this.returnBookToShelf(this.selectedIndex);
    }

    this.selectedIndex = index;
    this.mode = 'selected';
    this.pullOutTarget = PULL_OUT_Z;
    this.bookRotTarget = SELECT_ROT_Y;
    this.targetCameraX = this.bookXPositions[index];
    this.velocityX = 0;

    this.callbacks.onBookSelect({
      index,
      title: BOOKS[index].title,
      author: BOOKS[index].author,
      color: BOOKS[index].coverColor,
    });
    this.callbacks.onModeChange('selected');
  }

  /** Deselect current book */
  public deselectBook(): void {
    if (this.selectedIndex >= 0) {
      this.returnBookToShelf(this.selectedIndex);
    }
    this.selectedIndex = -1;
    this.mode = 'browse';
    this.pullOutTarget = 0;
    this.bookRotTarget = 0;
    this.callbacks.onBookSelect(null);
    this.callbacks.onModeChange('browse');
  }

  /** Enter orbit inspection of the selected book */
  public enterInspect(): void {
    if (this.selectedIndex < 0) return;

    this.mode = 'inspecting';
    this.pullOutTarget = INSPECT_Z;
    this.bookRotTarget = INSPECT_ROT_Y;

    // Save camera state for restoration
    this.savedCameraPos.copy(this.camera.position);

    const book = this.books[this.selectedIndex];
    const target = new THREE.Vector3(
      book.userData.restX,
      book.position.y,
      INSPECT_Z,
    );
    this.savedCameraTarget.copy(target);

    // Set orbit controls target
    this.orbitControls.target.copy(target);
    this.orbitControls.enabled = true;
    this.orbitControls.update();

    this.callbacks.onModeChange('inspecting');
  }

  /** Exit inspection, return to shelf browsing */
  public exitInspect(): void {
    this.orbitControls.enabled = false;
    this.mode = 'selected';
    this.pullOutTarget = PULL_OUT_Z;
    this.bookRotTarget = SELECT_ROT_Y;

    // Restore camera
    this.camera.position.copy(this.savedCameraPos);

    this.callbacks.onModeChange('selected');
  }

  /** Return to browse mode entirely (from selected or inspecting) */
  public returnToBrowse(): void {
    if (this.mode === 'inspecting') {
      this.orbitControls.enabled = false;
    }
    if (this.selectedIndex >= 0) {
      this.returnBookToShelf(this.selectedIndex);
    }
    this.selectedIndex = -1;
    this.mode = 'browse';
    this.pullOutTarget = 0;
    this.bookRotTarget = 0;

    // Restore camera Z if it was moved during inspection
    this.camera.position.y = CAMERA_Y;
    this.camera.position.z = CAMERA_Z;

    this.callbacks.onBookSelect(null);
    this.callbacks.onModeChange('browse');
  }

  // ── Private helpers ────────────────────────────────────────

  private returnBookToShelf(index: number): void {
    // Reset animation targets; the animate loop will lerp back
    this.pullOutTarget = 0;
    this.bookRotTarget = 0;
  }

  private nearestBookIndex(): number {
    let nearest = 0;
    let minDist = Infinity;
    for (let i = 0; i < this.bookXPositions.length; i++) {
      const d = Math.abs(this.camera.position.x - this.bookXPositions[i]);
      if (d < minDist) {
        minDist = d;
        nearest = i;
      }
    }
    return nearest;
  }

  // ── Animation Loop ─────────────────────────────────────────

  private animate = (): void => {
    this.animFrameId = requestAnimationFrame(this.animate);
    const _dt = this.clock.getDelta();

    if (this.mode === 'inspecting') {
      this.updateInspecting();
    } else {
      this.updateBrowse();
    }

    // Animate selected book pull-out
    this.updateBookAnimation();

    this.renderer.render(this.scene, this.camera);
  };

  private updateBrowse(): void {
    // Apply velocity (momentum from drag)
    if (!this.isDragging && Math.abs(this.velocityX) > 0.0001) {
      this.targetCameraX += this.velocityX;
      this.velocityX *= VELOCITY_DAMPING;
    }

    // Clamp
    this.targetCameraX = Math.max(this.minCameraX, Math.min(this.maxCameraX, this.targetCameraX));

    // Lerp camera X
    this.camera.position.x += (this.targetCameraX - this.camera.position.x) * LERP_SPEED;

    // Ensure camera Y/Z are at browsing position
    this.camera.position.y += (CAMERA_Y - this.camera.position.y) * LERP_SPEED;
    this.camera.position.z += (CAMERA_Z - this.camera.position.z) * LERP_SPEED;

    // Look at the shelf
    this.camera.lookAt(this.camera.position.x, CAMERA_Y - 0.05, 0);
  }

  private updateInspecting(): void {
    this.orbitControls.update();
  }

  private updateBookAnimation(): void {
    if (this.selectedIndex < 0) {
      // If no book selected, lerp all books back to rest
      for (const book of this.books) {
        book.position.z += (0 - book.position.z) * LERP_SPEED;
        book.rotation.y += (0 - book.rotation.y) * LERP_SPEED;
      }
      this.pullOutProgress = 0;
      this.bookRotProgress = 0;
      return;
    }

    const selected = this.books[this.selectedIndex];

    // Lerp pull-out
    this.pullOutProgress += (this.pullOutTarget - this.pullOutProgress) * LERP_SPEED;
    selected.position.z = this.pullOutProgress;

    // Lerp rotation
    this.bookRotProgress += (this.bookRotTarget - this.bookRotProgress) * LERP_SPEED;
    selected.rotation.y = this.bookRotProgress;

    // All other books stay at rest
    for (let i = 0; i < this.books.length; i++) {
      if (i === this.selectedIndex) continue;
      const book = this.books[i];
      book.position.z += (0 - book.position.z) * LERP_SPEED;
      book.rotation.y += (0 - book.rotation.y) * LERP_SPEED;
    }
  }

  // ── Event Handlers ─────────────────────────────────────────

  private onPointerDown(e: PointerEvent): void {
    if (this.mode === 'inspecting') return;

    this.isDragging = true;
    this.pointerDownX = e.clientX;
    this.pointerTravelX = 0;
    this.dragStartCameraX = this.targetCameraX;
    this.velocityX = 0;

    this.renderer.domElement.setPointerCapture(e.pointerId);
  }

  private onPointerMove(e: PointerEvent): void {
    if (this.mode === 'inspecting') return;

    if (this.isDragging) {
      const dx = e.clientX - this.pointerDownX;
      this.pointerTravelX = dx;

      this.targetCameraX = this.dragStartCameraX - dx * DRAG_SENSITIVITY;
      this.velocityX = -e.movementX * DRAG_SENSITIVITY;
    } else {
      // Hover detection for cursor feedback
      const rect = this.renderer.domElement.getBoundingClientRect();
      this.pointerNDC.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.pointerNDC.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      this.raycaster.setFromCamera(this.pointerNDC, this.camera);
      const meshes: THREE.Object3D[] = [];
      for (const book of this.books) {
        book.traverse((child) => {
          if (child instanceof THREE.Mesh) meshes.push(child);
        });
      }
      const hits = this.raycaster.intersectObjects(meshes, false);
      if (hits.length > 0) {
        this.renderer.domElement.style.cursor = 'pointer';
      } else {
        this.renderer.domElement.style.cursor = 'grab';
      }
    }
  }

  private onPointerUp(e: PointerEvent): void {
    if (this.mode === 'inspecting') {
      this.isDragging = false;
      return;
    }

    const wasClick = Math.abs(this.pointerTravelX) < CLICK_THRESHOLD;
    this.isDragging = false;

    this.renderer.domElement.releasePointerCapture(e.pointerId);

    if (wasClick) {
      this.handleClick(e);
    }
  }

  private handleClick(e: PointerEvent): void {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.pointerNDC.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointerNDC.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.pointerNDC, this.camera);

    // Collect all book meshes
    const meshes: THREE.Object3D[] = [];
    for (const book of this.books) {
      book.traverse((child) => {
        if (child instanceof THREE.Mesh) meshes.push(child);
      });
    }

    const hits = this.raycaster.intersectObjects(meshes, false);
    if (hits.length > 0) {
      // Find which book group this mesh belongs to
      let obj: THREE.Object3D | null = hits[0].object;
      while (obj && !obj.userData?.bookIndex && obj.userData?.bookIndex !== 0) {
        obj = obj.parent;
      }
      if (obj && (obj.userData?.bookIndex !== undefined)) {
        const idx = obj.userData.bookIndex as number;
        if (this.selectedIndex === idx) {
          // Already selected — enter inspect
          this.enterInspect();
        } else {
          this.selectBook(idx);
        }
        return;
      }
    }

    // Clicked empty space — deselect
    if (this.mode === 'selected') {
      this.deselectBook();
    }
  }

  private onWheel(e: WheelEvent): void {
    if (this.mode === 'inspecting') return;
    e.preventDefault();
    this.targetCameraX += e.deltaY * WHEEL_SENSITIVITY;
    this.velocityX = 0;
  }

  private onKeyDown(e: KeyboardEvent): void {
    if (this.mode === 'inspecting') {
      if (e.key === 'Escape') {
        this.exitInspect();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        this.navigateBy(-1);
        break;
      case 'ArrowRight':
        e.preventDefault();
        this.navigateBy(1);
        break;
      case 'Enter':
        if (this.mode === 'selected') {
          this.enterInspect();
        } else {
          const idx = this.nearestBookIndex();
          this.selectBook(idx);
        }
        break;
      case 'Escape':
        if (this.mode === 'selected') {
          this.deselectBook();
        }
        break;
    }
  }

  private onResize(): void {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  // ── Disposal ───────────────────────────────────────────────

  public dispose(): void {
    cancelAnimationFrame(this.animFrameId);

    const canvas = this.renderer.domElement;
    canvas.removeEventListener('pointerdown', this._onPointerDown);
    canvas.removeEventListener('pointermove', this._onPointerMove);
    canvas.removeEventListener('pointerup',   this._onPointerUp);
    canvas.removeEventListener('pointercancel', this._onPointerUp);
    canvas.removeEventListener('wheel', this._onWheel);
    window.removeEventListener('keydown', this._onKeyDown);
    window.removeEventListener('resize', this._onResize);

    this.orbitControls.dispose();

    // Dispose all geometries and materials
    this.scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
        if (Array.isArray(obj.material)) {
          obj.material.forEach((m) => m.dispose());
        } else {
          obj.material.dispose();
        }
      }
    });

    this.renderer.dispose();

    // Remove canvas from DOM
    if (canvas.parentElement) {
      canvas.parentElement.removeChild(canvas);
    }
  }
}
