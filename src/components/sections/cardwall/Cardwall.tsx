"use client";

import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useId,
} from "react";
import Link from "next/link";
import gsap from "gsap";
import { useLenis } from "lenis/react";
import { getOptimizedCardwallCoverUrl } from "@/lib/image-optimization";
import { markCardwallSettled, restoreChromeFromModal, yieldChromeToModal } from "@/lib/cardwall-events";

/* ==========================================================================
   Types & Interfaces
   ========================================================================== */

interface CardDesign {
  id: number;
  title: string;
  writer: string;
  category: string;
  readTime: string;
  words: string;
  description: string;
  slug: string;
  bg: string;
  accent: string;
  hue: string;
  pattern?: "lines" | "grid" | "solid" | "band";
  image?: string;
  backImage?: string;
}

interface ViewConfig {
  baseRotY: number;
  topView: number;
  perspective: number;
  originX: number;
  originY: number;
  zNear: number;
  zFar: number;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

interface DetailState {
  idx: number;
  sourceRect: { left: number; top: number; width: number; height: number };
  sourceLayoutCenter: { x: number; y: number };
  sourceTilt: { topView: number; baseRotY: number };
  sourcePhysics: { lift: number; rotX: number; rotZ: number };
  sourceZ: number;
  sourcePerspective: number;
  sourceOriginViewportX: number;
  sourceOriginViewportY: number;
  sectionOffsetLeft: number;
  sectionOffsetTop: number;
  clickTime: number;
}

interface CardPhysicsState {
  lift: number;
  velLift: number;
  rotX: number;
  velRotX: number;
  rotZ: number;
  velRotZ: number;
  glow: number;
}

/* ==========================================================================
   14 Publications & Palettes (Tailored to Website Content)
   ========================================================================== */

const PALETTE: Omit<CardDesign, "id">[] = [
  {
    title: "The Silent Architecture of Memory",
    writer: "Sarah Admin",
    category: "ARTICLE",
    readTime: "6 min read",
    words: "1,250",
    description: "An analytical essay on how human recollection rebuilds itself across literary spaces, personal archives, and fluid retrospective narratives.",
    slug: "/publications/silent-architecture-of-memory",
    bg: "linear-gradient(155deg,#1c1d22 0%,#0d0e12 100%)",
    accent: "#f3e8d2",
    hue: "rgba(220,210,190,0.45)",
    pattern: "solid",
    image: "https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=420&h=666&fit=crop&auto=format&q=75",
  },
  {
    title: "Echoes of the Monsoon",
    writer: "Jane Member",
    category: "POEM",
    readTime: "2 min read",
    words: "280",
    description: "Lyrical verses capturing raw rainfall over parched clay, weeping ink upon dry leaves and washing away seasons of waiting.",
    slug: "/publications/echoes-of-the-monsoon",
    bg: "linear-gradient(160deg,#a25a3d 0%,#6b3825 100%)",
    accent: "#fdf4e7",
    hue: "rgba(255,220,180,0.45)",
    pattern: "band",
    image: "https://images.unsplash.com/photo-1534274988757-a28bf1a57c17?w=420&h=666&fit=crop&auto=format&q=75",
  },
  {
    title: "If on a winter's night a traveler",
    writer: "Italo Calvino",
    category: "EDITOR'S PICK",
    readTime: "8 min read",
    words: "1,800",
    description: "Calvino’s metafictional masterpiece on the hypnotic, infinite labyrinth of reading — drawing the reader into nested incomplete worlds.",
    slug: "/editors-shelf/if-on-a-winters-night-a-traveler",
    bg: "linear-gradient(150deg,#ece3d1 0%,#c9bba2 100%)",
    accent: "#ffffff",
    hue: "rgba(255,245,220,0.55)",
    pattern: "solid",
    image: "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=420&h=666&fit=crop&auto=format&q=75",
  },
  {
    title: "Neon Dreamers",
    writer: "John Author",
    category: "STORY",
    readTime: "12 min read",
    words: "3,400",
    description: "Under holographic rain, Kael interface-jacks the core network — feeling the pulse of minds locked inside the grid dreaming of synthetic pastures.",
    slug: "/publications/neon-dreamers",
    bg: "linear-gradient(160deg,#2a3446 0%,#131824 100%)",
    accent: "#dce8f8",
    hue: "rgba(190,210,240,0.45)",
    pattern: "lines",
    image: "https://images.unsplash.com/photo-1515621061946-eff1c2a352bd?w=420&h=666&fit=crop&auto=format&q=75",
  },
  {
    title: "Ficciones & Infinite Labyrinths",
    writer: "Jorge Luis Borges",
    category: "PHILOSOPHY",
    readTime: "10 min read",
    words: "2,100",
    description: "Labyrinths, mirrors, infinite libraries, and double agents. Borges is the patron saint of magical realism, challenging our concept of reality.",
    slug: "/editors-shelf/ficciones",
    bg: "linear-gradient(155deg,#b58b4f 0%,#6f5128 100%)",
    accent: "#fff3dc",
    hue: "rgba(255,225,180,0.5)",
    pattern: "band",
    image: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=420&h=666&fit=crop&auto=format&q=75",
  },
  {
    title: "Deep Forest Verse",
    writer: "Sarah Jenkins",
    category: "POETRY",
    readTime: "3 min read",
    words: "340",
    description: "Explorations into quiet contemplation, organic solitude, and the cadence of natural speech amidst moss and pine.",
    slug: "/publications",
    bg: "linear-gradient(155deg,#3f4a3a 0%,#222a20 100%)",
    accent: "#e8eedb",
    hue: "rgba(200,220,180,0.4)",
    pattern: "lines",
    image: "https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=420&h=666&fit=crop&auto=format&q=75",
  },
  {
    title: "Architectural Geometry of Classic Verse",
    writer: "Elena Rostova",
    category: "MONOGRAPH",
    readTime: "7 min read",
    words: "1,620",
    description: "Structure, space, and syntax: how mathematical symmetry and classical metric forms anchor modernist poetics.",
    slug: "/publications",
    bg: "linear-gradient(160deg,#44474c 0%,#24262a 100%)",
    accent: "#f0ece1",
    hue: "rgba(220,220,220,0.45)",
    pattern: "grid",
    image: "https://images.unsplash.com/photo-1513001900722-370f803f498d?w=420&h=666&fit=crop&auto=format&q=75",
  },
  {
    title: "Correspondence with the Past",
    writer: "David Kojo",
    category: "ESSAY",
    readTime: "5 min read",
    words: "1,150",
    description: "Vintage epistolary essays and letterpress reflections compiled from alumni archives on finding cadence and empathy.",
    slug: "/publications",
    bg: "linear-gradient(155deg,#8c5a4a 0%,#4a2e25 100%)",
    accent: "#f9ede0",
    hue: "rgba(255,210,180,0.4)",
    pattern: "solid",
    image: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=420&h=666&fit=crop&auto=format&q=75",
  },
  {
    title: "Anthology Vintage Reserve",
    writer: "Mark Moderator",
    category: "ANTHOLOGY",
    readTime: "9 min read",
    words: "2,400",
    description: "A decade of award-winning critiques, prize-winning sonnets, and student essays celebrating creative camaraderie.",
    slug: "/publications",
    bg: "linear-gradient(150deg,#dcd2bb 0%,#b5a888 100%)",
    accent: "#ffffff",
    hue: "rgba(255,240,210,0.55)",
    pattern: "grid",
    image: "https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=420&h=666&fit=crop&auto=format&q=75",
  },
  {
    title: "Modern Critique Monolith",
    writer: "Priya Sharma",
    category: "REVIEW",
    readTime: "11 min read",
    words: "2,850",
    description: "An editorial analysis of postmodern typography, editorial aesthetics, and narrative structuralism.",
    slug: "/publications",
    bg: "linear-gradient(155deg,#5e3035 0%,#2d1619 100%)",
    accent: "#f5ded0",
    hue: "rgba(230,170,170,0.4)",
    pattern: "band",
    image: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=420&h=666&fit=crop&auto=format&q=75",
  },
  {
    title: "Calm Horizons & Prose",
    writer: "Fatima Al-Sayed",
    category: "PROSE",
    readTime: "5 min read",
    words: "1,080",
    description: "Meditative narratives examining silence, modern attention, and the restorative power of slow editorial reading.",
    slug: "/publications",
    bg: "linear-gradient(155deg,#7a8a74 0%,#43513f 100%)",
    accent: "#f1f8ee",
    hue: "rgba(220,230,200,0.45)",
    pattern: "solid",
    image: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=420&h=666&fit=crop&auto=format&q=75",
  },
  {
    title: "Ink & Celestial Starlight",
    writer: "Alex Chen",
    category: "POEM",
    readTime: "2 min read",
    words: "269",
    description: "Night-written poetic fragments bridging astronomy, memory, and midnight reflection in the digital age.",
    slug: "/publications",
    bg: "linear-gradient(160deg,#3e4258 0%,#1c1e30 100%)",
    accent: "#e5ddf2",
    hue: "rgba(200,200,230,0.45)",
    pattern: "lines",
    image: "https://images.unsplash.com/photo-1519791883288-dc8bd696e667?w=420&h=666&fit=crop&auto=format&q=75",
  },
  {
    title: "Minimalist Campus Essays",
    writer: "Marcus Vance",
    category: "ESSAY",
    readTime: "4 min read",
    words: "890",
    description: "Sharp, restrained prose arguing against linguistic excess in contemporary campus writing.",
    slug: "/publications",
    bg: "linear-gradient(150deg,#efe7d8 0%,#c6baa0 100%)",
    accent: "#ffffff",
    hue: "rgba(255,245,215,0.5)",
    pattern: "solid",
    image: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=420&h=666&fit=crop&auto=format&q=75",
  },
  {
    title: "The Morning Slams",
    writer: "Sarah Admin",
    category: "SPOKEN WORD",
    readTime: "3 min read",
    words: "520",
    description: "Spoken word records from campus workshops, celebrating competitive live literary discourse and passionate expression.",
    slug: "/publications",
    bg: "linear-gradient(160deg,#222327 0%,#0b0c0e 100%)",
    accent: "#ece2cb",
    hue: "rgba(210,200,180,0.4)",
    pattern: "grid",
    image: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=420&h=666&fit=crop&auto=format&q=75",
  },
];

const REPEATS = 3;
const DEFAULT_CARDS: CardDesign[] = Array.from({ length: REPEATS }, (_, r) =>
  PALETTE.map((c, ci) => ({ ...c, id: r * PALETTE.length + ci }))
).flat();

const COLORFLOW_EMBED_URLS = [
  "https://colorflow-embed.b-cdn.net/embed.html#e=bRYky8cX",
  "https://colorflow-embed.b-cdn.net/embed.html#e=JSkv0dYf",
  "https://colorflow-embed.b-cdn.net/embed.html#e=zpgjhfcY",
  "https://colorflow-embed.b-cdn.net/embed.html#e=goRuheWY",
];

/* ==========================================================================
   Constants & Presets
   ========================================================================== */

const CARD_W = 210;
const CARD_H = Math.round(CARD_W * 1.586); // 333
const CARD_THICKNESS = 4;

const EDGE_TOP = "linear-gradient(180deg, #faf3e0 0%, #ecdcba 100%)";
const EDGE_SIDE = "linear-gradient(180deg, #efe2c3 0%, #d6c497 100%)";
const EDGE_BOTTOM = "linear-gradient(180deg, #d6c497 0%, #b5a175 100%)";

const DECK_SHADOW = [
  "0 1px 2px 0 rgba(0,0,0,0.5)",
  "inset 0 0 0 1px rgba(255,255,255,0.1)",
  "inset 0 0 0 2px rgba(0,0,0,0.25)",
  "inset 0 2px 0 0 rgba(255,255,255,0.18)",
  "inset 0 -2px 0 0 rgba(0,0,0,0.35)",
].join(",");

const DETAIL_SHADOW = [
  "0 30px 70px -25px rgba(0,0,0,0.55)",
  "inset 0 0 0 1px rgba(255,255,255,0.12)",
  "inset 0 0 0 2px rgba(0,0,0,0.25)",
  "inset 0 2px 0 0 rgba(255,255,255,0.18)",
  "inset 0 -2px 0 0 rgba(0,0,0,0.35)",
].join(",");

const DEFAULT_CFG: ViewConfig = {
  baseRotY: 45,
  topView: -34,
  perspective: 4000,
  originX: 65,
  originY: 14,
  zNear: -100,
  zFar: 500,
  startX: -11,
  startY: 70,
  endX: 147,
  endY: 124,
};

const DEFAULT_CFG_MOBILE: ViewConfig = {
  baseRotY: 43,
  topView: -34,
  perspective: 1760,
  originX: -50,
  originY: -95,
  zNear: -100,
  zFar: 500,
  startX: -46,
  startY: 48,
  endX: 147,
  endY: 114,
};

const MOBILE_BREAKPOINT = 768;

const LIFT_MAX = 140;
const INDEX_SIGMA = 2;
const SPRING_LIFT = 0.22;
const DAMPING_LIFT = 0.55;
const SPRING_ROT = 0.18;
const DAMPING_ROT = 0.55;
const TILT_MAX_X = 22;
const TILT_MAX_Z = 6;

const DETAIL_SCALE = 1.55;
const DETAIL_SCALE_MOBILE = 0.75;
const T0_WRAPPER_PERSPECTIVE = 100000;

const LANDING = {
  overlayPerspective: 8000,
  overlayOriginXpx: 610,
  overlayOriginYpx: 118,
  wrapperPerspective: 1990,
  wrapperOriginXpct: -61,
  wrapperOriginYpct: 200,
  wrapperWidth: 100,
  wrapperHeight: 251,
  wrapperCenterXvw: 20.5,
  wrapperCenterYvh: 53.5,
};

const LANDING_MOBILE = {
  ...LANDING,
  wrapperCenterXvw: 50,
  wrapperCenterYvh: 22.5,
};

function pickDefaultCfg(): ViewConfig {
  if (typeof window === "undefined") return DEFAULT_CFG;
  return window.innerWidth <= MOBILE_BREAKPOINT ? DEFAULT_CFG_MOBILE : DEFAULT_CFG;
}

function clamp(min: number, val: number, max?: number): number {
  if (max === undefined) {
    return Math.min(min, val);
  }
  return Math.max(min, Math.min(val, max));
}

/* ==========================================================================
   Icons (Card Face & Detail Micro-Animations)
   ========================================================================== */

function BookIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-foreground">
      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
      <path d="M6 6h10" opacity="0.6" />
      <path d="M6 10h10" opacity="0.6" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-foreground">
      <circle cx="12" cy="12" r="9" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function SparklesIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-foreground">
      <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z" />
    </svg>
  );
}

/* ==========================================================================
   Card Face Component (Minimal: Excelsior text + Writer name)
   ========================================================================== */

function CardFace({
  card,
  setShineRef,
}: {
  card: CardDesign;
  setShineRef?: (el: HTMLDivElement | null) => void;
}) {
  const optimizedImg = card.image ? getOptimizedCardwallCoverUrl(card.image) : "";

  return (
    <div
      className="relative h-full w-full overflow-hidden select-none flex flex-col justify-between p-[8%]"
      style={{
        borderRadius: 14,
        background: optimizedImg ? `url(${optimizedImg}) center/cover no-repeat` : card.bg,
        color: card.accent,
        fontFamily: "var(--font-geist-sans), var(--font-sans), ui-sans-serif, system-ui",
      }}
    >
      {/* Optional Custom Card Background Image */}
      {optimizedImg && (
        <>
          <img
            src={optimizedImg}
            alt={card.title}
            decoding="async"
            loading="eager"
            className="pointer-events-none absolute inset-0 h-full w-full object-cover"
          />
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.18) 45%, rgba(0,0,0,0.75) 100%)",
            }}
          />
        </>
      )}

      {/* Top Header: ONLY Excelsior text */}
      <div className="relative z-10">
        <div
          className="uppercase leading-none"
          style={{
            fontSize: 10,
            letterSpacing: "0.26em",
            fontWeight: 600,
            color: card.accent,
            opacity: 0.95,
          }}
        >
          EXCELSIOR
        </div>
      </div>

      {/* Bottom Footer: ONLY Writer / Author name */}
      <div className="relative z-10">
        <div
          className="uppercase leading-tight font-medium"
          style={{
            fontSize: 11,
            letterSpacing: "0.14em",
            color: card.accent,
            textShadow: "0 1px 3px rgba(0,0,0,0.6)",
          }}
        >
          {card.writer}
        </div>
      </div>

      {/* Noise texture */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.07] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='80' height='80'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='1' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.5 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
        }}
      />

      {/* Specular highlight */}
      <div
        ref={setShineRef}
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          borderRadius: 14,
          backgroundImage: `linear-gradient(115deg, transparent 30%, ${card.hue} 50%, transparent 70%)`,
          backgroundSize: "200% 100%",
          backgroundPosition: "50% 50%",
          opacity: 0,
          mixBlendMode: "screen",
          willChange: "opacity",
        }}
      />

      {/* Static edge gloss */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          borderRadius: 14,
          background: "linear-gradient(180deg, rgba(255,255,255,0.14) 0%, transparent 28%, transparent 100%)",
        }}
      />
    </div>
  );
}

/* ==========================================================================
   Config Panel (Dev Tool - § 24)
   ========================================================================== */

function ConfigPanel({
  cfg,
  setCfg,
}: {
  cfg: ViewConfig;
  setCfg: React.Dispatch<React.SetStateAction<ViewConfig>>;
}) {
  const [open, setOpen] = useState(false);

  const sliders: Array<{
    key: keyof ViewConfig;
    label: string;
    min: number;
    max: number;
    step: number;
    group: string;
  }> = [
    { key: "perspective", label: "Perspective (px)", min: 400, max: 4000, step: 20, group: "Camera" },
    { key: "originX", label: "Origin X (%)", min: -50, max: 150, step: 1, group: "Camera" },
    { key: "originY", label: "Origin Y (%)", min: -100, max: 200, step: 1, group: "Camera" },
    { key: "topView", label: "Top view (°)", min: -75, max: 75, step: 1, group: "Card tilt" },
    { key: "baseRotY", label: "Edge reveal (°)", min: -45, max: 45, step: 1, group: "Card tilt" },
    { key: "zNear", label: "Z near", min: -500, max: 800, step: 10, group: "Depth" },
    { key: "zFar", label: "Z far", min: -2000, max: 500, step: 10, group: "Depth" },
    { key: "startX", label: "Start X (%)", min: -60, max: 160, step: 1, group: "Ribbon" },
    { key: "startY", label: "Start Y (%)", min: -60, max: 200, step: 1, group: "Ribbon" },
    { key: "endX", label: "End X (%)", min: -60, max: 160, step: 1, group: "Ribbon" },
    { key: "endY", label: "End Y (%)", min: -60, max: 200, step: 1, group: "Ribbon" },
  ];

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed top-4 left-4 z-[1000] h-11 w-11 rounded-xl border border-foreground/10
                   bg-background/80 backdrop-blur-md flex items-center justify-center
                   text-xs font-mono font-medium shadow-md hover:bg-background cursor-pointer"
      >
        CFG
      </button>
    );
  }

  return (
    <div
      className="fixed top-4 left-4 z-[1000] w-[280px] max-h-[85vh] overflow-y-auto
                 rounded-xl border border-foreground/15 p-4 text-xs font-sans
                 shadow-2xl backdrop-blur-xl"
      style={{
        background: "color-mix(in oklab, var(--background) 88%, transparent)",
      }}
    >
      <div className="flex items-center justify-between pb-3 border-b border-foreground/10">
        <span className="font-semibold uppercase tracking-wider text-[11px]">View Config</span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCfg(pickDefaultCfg())}
            className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded border border-foreground/15 hover:bg-foreground/5 cursor-pointer"
          >
            Reset
          </button>
          <button
            onClick={() => setOpen(false)}
            className="text-[14px] leading-none px-1 text-muted-foreground hover:text-foreground cursor-pointer"
          >
            ✕
          </button>
        </div>
      </div>

      <div className="space-y-3 pt-3">
        {sliders.map((s) => (
          <div key={s.key} className="space-y-1">
            <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
              <span>{s.label}</span>
              <span className="text-foreground">{cfg[s.key]}</span>
            </div>
            <input
              type="range"
              min={s.min}
              max={s.max}
              step={s.step}
              value={cfg[s.key]}
              onChange={(e) =>
                setCfg((prev) => ({
                  ...prev,
                  [s.key]: Number(e.target.value),
                }))
              }
              className="w-full h-1 bg-foreground/20 rounded cursor-pointer accent-foreground"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ==========================================================================
   Card Back Component (Refined Literary Back)
   ========================================================================== */

function CardBack({ card }: { card: CardDesign }) {
  return (
    <div
      className="relative h-full w-full select-none overflow-hidden flex flex-col justify-between p-[8%]"
      style={{
        background: card.backImage ? `url(${card.backImage}) center/cover no-repeat` : card.bg,
        color: card.accent,
        fontFamily: "var(--font-geist-sans), var(--font-sans), ui-sans-serif, system-ui",
      }}
    >
      {card.backImage && (
        <img
          src={card.backImage}
          alt={`${card.title} back`}
          decoding="async"
          className="pointer-events-none absolute inset-0 h-full w-full object-cover"
        />
      )}
      <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.35)" }} />

      {/* Top Brand & Category */}
      <div className="relative z-10 flex items-center justify-between">
        <span className="text-[9px] uppercase tracking-[0.24em] font-semibold opacity-85">
          EXCELSIOR
        </span>
        <span className="text-[8px] uppercase tracking-[0.2em] opacity-60">
          {card.category}
        </span>
      </div>

      {/* Center publication title */}
      <div className="relative z-10 my-auto text-center px-2">
        <div
          className="font-serif italic text-[14px] leading-snug line-clamp-3 opacity-90"
          style={{ fontFamily: "var(--font-playfair), serif" }}
        >
          "{card.title}"
        </div>
      </div>

      {/* Bottom Author & Read Time */}
      <div className="relative z-10 flex items-center justify-between">
        <span className="text-[9.5px] uppercase tracking-[0.12em] font-medium opacity-80">
          {card.writer}
        </span>
        <span className="text-[8px] uppercase tracking-[0.16em] opacity-55">
          {card.readTime}
        </span>
      </div>

      {/* 9. Top edge gloss */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          borderRadius: 14,
          background: "linear-gradient(180deg, rgba(255,255,255,0.08) 0%, transparent 22%)",
        }}
      />
    </div>
  );
}

/* ==========================================================================
   Card Detail Modal Component (<CardDetail>)
   ========================================================================== */

function CardDetail({
  card,
  detail,
  onClose,
  deckPerspectiveEl,
  slotEls,
  entranceEls,
  shadowEls,
  cardEls,
}: {
  card: CardDesign;
  detail: DetailState;
  onClose: () => void;
  deckPerspectiveEl: HTMLDivElement | null;
  slotEls: (HTMLDivElement | null)[];
  entranceEls: (HTMLDivElement | null)[];
  shadowEls: (HTMLDivElement | null)[];
  cardEls: (HTMLDivElement | null)[];
}) {
  const backdropRef = useRef<HTMLDivElement>(null);
  const chromeRootRef = useRef<HTMLDivElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const infoRootRef = useRef<HTMLDivElement>(null);
  const closingRef = useRef(false);
  const entrancePlayedRef = useRef(false);

  const paletteId = detail.idx % PALETTE.length;

  const isMobile = typeof window !== "undefined" && window.innerWidth <= MOBILE_BREAKPOINT;
  const landing = isMobile ? LANDING_MOBILE : LANDING;
  const scaleTarget = isMobile ? DETAIL_SCALE_MOBILE : DETAIL_SCALE;

  const perspStateRef = useRef({
    deckPerspective: detail.sourcePerspective,
    deckOriginX: detail.sourceOriginViewportX,
    deckOriginY: detail.sourceOriginViewportY,
    slotPerspective: T0_WRAPPER_PERSPECTIVE,
    slotOriginXpct: 50,
    slotOriginYpct: 50,
    slotTranslateX: 0,
    slotTranslateY: 0,
  });

  const slotEl = slotEls[detail.idx];
  const otherEntrances = entranceEls.filter((el, i) => i !== detail.idx && el !== null);

  // Notify document & Navbar of active modal state
  useEffect(() => {
    yieldChromeToModal();
    return () => restoreChromeFromModal();
  }, []);

  const applyPerspState = useCallback(() => {
    const s = perspStateRef.current;
    if (deckPerspectiveEl) {
      deckPerspectiveEl.style.perspective = `${s.deckPerspective}px`;
      deckPerspectiveEl.style.perspectiveOrigin = `${s.deckOriginX}px ${s.deckOriginY}px`;
    }
    if (slotEl) {
      slotEl.style.perspective = `${s.slotPerspective}px`;
      slotEl.style.perspectiveOrigin = `${s.slotOriginXpct}% ${s.slotOriginYpct}%`;
      slotEl.style.transform = `translate3d(${s.slotTranslateX}px, ${s.slotTranslateY}px, ${detail.sourceZ}px)`;
    }
  }, [deckPerspectiveEl, slotEl, detail.sourceZ]);

  const close = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;

    const flipEl = slotEl?.querySelector("[data-card-flip]") as HTMLElement | null;
    const scaleEl = slotEl?.querySelector("[data-card-scale]") as HTMLElement | null;
    const frontFaceEl = slotEl?.querySelector("[data-card-face]") as HTMLElement | null;
    const cardPhysicsEl = cardEls[detail.idx];
    const shadowEl = shadowEls[detail.idx];
    const infoItems = infoRootRef.current?.querySelectorAll("[data-detail-reveal]");

    const tl = gsap.timeline({
      onComplete: () => {
        onClose();
      },
    });

    // 1. Modal UI fades out (exact reverse of entrance bloom)
    if (infoItems && infoItems.length > 0) {
      tl.to(
        infoItems,
        {
          opacity: 0,
          y: 20,
          filter: "blur(6px)",
          duration: 0.3,
          ease: "power2.in",
          stagger: 0.02,
        },
        0
      );
    }
    if (infoRootRef.current) {
      tl.to(
        infoRootRef.current,
        {
          opacity: 0,
          duration: 0.3,
          ease: "power2.in",
        },
        0
      );
    }
    if (boxRef.current) {
      tl.to(
        boxRef.current,
        {
          opacity: 0,
          scale: 0.94,
          y: 15,
          duration: 0.35,
          ease: "power2.in",
        },
        0
      );
    }
    if (iframeRef.current) {
      tl.to(
        iframeRef.current,
        {
          opacity: 0,
          duration: 0.3,
          ease: "power2.in",
        },
        0
      );
    }

    const closeBtn = document.querySelector("[data-detail-close-btn]") as HTMLElement | null;
    if (closeBtn) {
      tl.to(closeBtn, { opacity: 0, scale: 0.8, duration: 0.2, ease: "power2.in" }, 0);
    }

    // 2. Smoothly reset 3D orbit drag if manipulated
    if (cardPhysicsEl) {
      tl.to(cardPhysicsEl, { rotateX: 0, rotateY: 0, duration: 0.5, ease: "power2.inOut" }, 0);
    }

    // 3. Card Return Flight (exact reverse of 0.95s flight trajectory)
    if (flipEl) {
      tl.to(flipEl, { rotationY: 0, duration: 0.95, ease: "power3.inOut" }, 0);
    }
    if (scaleEl) {
      tl.to(scaleEl, { scale: 1, duration: 0.95, ease: "power3.inOut" }, 0);
    }
    if (frontFaceEl) {
      tl.to(frontFaceEl, { boxShadow: DECK_SHADOW, duration: 0.95, ease: "power3.inOut" }, 0);
    }

    tl.to(
      perspStateRef.current,
      {
        deckPerspective: detail.sourcePerspective,
        deckOriginX: detail.sourceOriginViewportX,
        deckOriginY: detail.sourceOriginViewportY,
        slotPerspective: T0_WRAPPER_PERSPECTIVE,
        slotOriginXpct: 50,
        slotOriginYpct: 50,
        slotTranslateX: 0,
        slotTranslateY: 0,
        duration: 0.95,
        ease: "power3.inOut",
        onUpdate: applyPerspState,
      },
      0
    );

    // 4. Just before other cards fade in, drop deck & backdrop z-index so
    //    returning cards appear BEHIND ManifestoStrip (z-300), not above it.
    //    The flying card is still in the hero viewport area so it stays visible
    //    above the now-lowered backdrop.
    tl.call(
      () => {
        if (deckPerspectiveEl) deckPerspectiveEl.style.zIndex = "200";
        if (chromeRootRef.current) chromeRootRef.current.style.zIndex = "80";
        // Bring the Navbar back mid-flight (as the backdrop fades) instead of
        // after the full 0.95s return — otherwise the screen sits header-less.
        // Idempotent; handleCloseDetail re-asserts it as a safety net.
        restoreChromeFromModal();
      },
      [],
      0.3
    );

    // 5. Other deck cards smoothly fade & glide back in behind ManifestoStrip
    if (otherEntrances.length > 0) {
      gsap.killTweensOf(otherEntrances);
      tl.to(
        otherEntrances,
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.55,
          ease: "power2.out",
          stagger: {
            each: 0.006,
            from: detail.idx,
          },
        },
        0.35
      );
    }

    // 5. Hero title block smoothly fades back
    const heroTitleBlock = document.querySelector("[data-hero-title-block]") as HTMLElement | null;
    if (heroTitleBlock) {
      tl.to(heroTitleBlock, { opacity: 1, duration: 0.55, ease: "power2.out" }, 0.35);
    }

    // 6. Backdrop blur fades out
    if (backdropRef.current) {
      tl.to(backdropRef.current, { opacity: 0, duration: 0.55, ease: "power2.inOut" }, 0.35);
    }

    // 7. Restore deck shadows across returning cards
    const validShadows = shadowEls.filter((el) => el !== null);
    if (validShadows.length > 0) {
      gsap.killTweensOf(validShadows);
      tl.to(
        validShadows,
        {
          opacity: 0.32,
          duration: 0.45,
          ease: "power2.out",
          stagger: {
            each: 0.006,
            from: detail.idx,
          },
        },
        0.35
      );
    }
  }, [slotEl, detail, cardEls, shadowEls, otherEntrances, onClose, applyPerspState]);

  // Strict capture-phase scroll lock preventing background window displacement
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const prevHtmlOverflow = html.style.overflow;
    const prevBodyOverflow = body.style.overflow;
    const prevTouchAction = body.style.touchAction;

    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    body.style.touchAction = "none";

    const preventScroll = (e: Event) => {
      const target = e.target as HTMLElement | null;
      if (target && typeof target.closest === "function" && target.closest("[data-detail-info-scroll]")) return;
      e.preventDefault();
      e.stopPropagation();
    };

    window.addEventListener("wheel", preventScroll, { capture: true, passive: false });
    window.addEventListener("touchmove", preventScroll, { capture: true, passive: false });
    document.addEventListener("scroll", preventScroll, { capture: true, passive: false });

    return () => {
      html.style.overflow = prevHtmlOverflow;
      body.style.overflow = prevBodyOverflow;
      body.style.touchAction = prevTouchAction;
      window.removeEventListener("wheel", preventScroll, { capture: true } as any);
      window.removeEventListener("touchmove", preventScroll, { capture: true } as any);
      document.removeEventListener("scroll", preventScroll, { capture: true } as any);
    };
  }, []);

  // 3D Rotation triggered on Click & Hold (Mouse Drag) with full unrestricted 3D orbit freedom
  const isDraggingRef = useRef(false);
  const hasMovedRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0, rotX: 0, rotY: 0 });
  const currentRotRef = useRef({ rotX: 0, rotY: 0 });

  useEffect(() => {
    const onMouseDown = (e: MouseEvent) => {
      if (closingRef.current || !slotEl) return;
      const target = e.target as HTMLElement | null;
      if (target && typeof target.closest === "function" && target.closest("button, a, input, [data-detail-reveal]")) return;

      isDraggingRef.current = true;
      hasMovedRef.current = false;
      dragStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        rotX: currentRotRef.current.rotX,
        rotY: currentRotRef.current.rotY,
      };
      document.body.style.cursor = "grabbing";
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current || closingRef.current || !slotEl) return;

      const deltaX = e.clientX - dragStartRef.current.x;
      const deltaY = e.clientY - dragStartRef.current.y;

      if (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3) {
        hasMovedRef.current = true;
      }

      // Fully unrestricted 3D orbit rotation (1:1 direct manipulation)
      const targetRotY = dragStartRef.current.rotY + deltaX * 0.85;
      const targetRotX = dragStartRef.current.rotX - deltaY * 0.85;

      currentRotRef.current = { rotX: targetRotX, rotY: targetRotY };

      const cardPhysicsEl = cardEls[detail.idx];
      if (cardPhysicsEl) {
        gsap.to(cardPhysicsEl, {
          rotateX: targetRotX,
          rotateY: targetRotY,
          duration: 0.08,
          ease: "none",
          overwrite: "auto",
        });
      }
    };

    const onMouseUp = () => {
      if (!isDraggingRef.current) return;
      isDraggingRef.current = false;
      document.body.style.cursor = "";

      currentRotRef.current = { rotX: 0, rotY: 0 };
      const cardPhysicsEl = cardEls[detail.idx];
      if (cardPhysicsEl && !closingRef.current) {
        // Elastic spring back to neutral plane when released
        gsap.to(cardPhysicsEl, {
          rotateX: 0,
          rotateY: 0,
          duration: 0.85,
          ease: "elastic.out(1, 0.65)",
          overwrite: "auto",
        });
      }
    };

    window.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);

    return () => {
      window.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      document.body.style.cursor = "";
    };
  }, [slotEl, detail.idx, cardEls]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close]);

  // Entrance timeline on modal mount — layout effect so initial hidden states apply BEFORE paint
  useLayoutEffect(() => {
    if (entrancePlayedRef.current || !slotEl) return;
    entrancePlayedRef.current = true;

    const flipEl = slotEl.querySelector("[data-card-flip]") as HTMLElement | null;
    const scaleEl = slotEl.querySelector("[data-card-scale]") as HTMLElement | null;
    const frontFaceEl = slotEl.querySelector("[data-card-face]") as HTMLElement | null;
    const cardPhysicsEl = cardEls[detail.idx];
    const shadowEl = shadowEls[detail.idx];
    const infoItems = infoRootRef.current?.querySelectorAll("[data-detail-reveal]");

    const targetLayoutCx = (landing.wrapperCenterXvw / 100) * window.innerWidth;
    const targetLayoutCy = (landing.wrapperCenterYvh / 100) * window.innerHeight;
    const sourceLayoutCenterViewportX = detail.sectionOffsetLeft + detail.sourceLayoutCenter.x;
    const sourceLayoutCenterViewportY = detail.sectionOffsetTop + detail.sourceLayoutCenter.y;
    const flightDx = targetLayoutCx - sourceLayoutCenterViewportX;
    const flightDy = targetLayoutCy - sourceLayoutCenterViewportY;

    if (flipEl) gsap.set(flipEl, { transformOrigin: "50% 50%", rotationY: 0 });
    if (scaleEl) gsap.set(scaleEl, { transformOrigin: "50% 50%", scale: 1 });
    if (boxRef.current) gsap.set(boxRef.current, { opacity: 0, scale: 0.94, y: 20 });
    if (backdropRef.current) gsap.set(backdropRef.current, { opacity: 0 });
    if (iframeRef.current) gsap.set(iframeRef.current, { opacity: 0 });
    if (infoItems) gsap.set(infoItems, { opacity: 0, y: 28, filter: "blur(10px)" });

    applyPerspState();

    const tl = gsap.timeline();

    // 1. Immediate backdrop bloom & ambient transition
    if (backdropRef.current) {
      tl.to(backdropRef.current, { opacity: 1, duration: 0.5, ease: "power2.out" }, 0);
    }
    const heroTitleBlock = document.querySelector("[data-hero-title-block]") as HTMLElement | null;
    if (heroTitleBlock) {
      tl.to(heroTitleBlock, { opacity: 0, duration: 0.45, ease: "power2.out" }, 0);
    }

    // 2. Other deck cards smoothly glide down and fade out with ripple from clicked card
    if (otherEntrances.length > 0) {
      gsap.killTweensOf(otherEntrances);
      tl.to(
        otherEntrances,
        {
          opacity: 0,
          y: 35,
          scale: 0.96,
          duration: 0.45,
          ease: "power2.out",
          stagger: {
            each: 0.006,
            from: detail.idx,
          },
        },
        0
      );
    }

    // 3. Smoothly ease out physics hover on clicked card wrapper
    if (cardPhysicsEl) {
      gsap.killTweensOf(cardPhysicsEl);
      tl.to(
        cardPhysicsEl,
        {
          x: 0,
          y: 0,
          z: 0,
          rotateX: 0,
          rotateY: 0,
          rotateZ: 0,
          duration: 0.5,
          ease: "power2.out",
        },
        0
      );
    }

    // 4. Fade ALL deck shadows out so no orphan shadows bleed through the modal or active card
    const validShadows = shadowEls.filter((el) => el !== null);
    if (validShadows.length > 0) {
      gsap.killTweensOf(validShadows);
      tl.to(validShadows, { opacity: 0, duration: 0.35, ease: "power2.out" }, 0);
    }

    // 5. Main Card Flight & 3D transformation (starts immediately, butter smooth)
    if (flipEl) {
      tl.to(flipEl, { rotationY: 360, duration: 0.95, ease: "power3.inOut" }, 0);
    }
    if (scaleEl) {
      tl.to(scaleEl, { scale: scaleTarget, duration: 0.95, ease: "power3.inOut" }, 0);
    }
    if (frontFaceEl) {
      tl.to(frontFaceEl, { boxShadow: DETAIL_SHADOW, duration: 0.95, ease: "power3.inOut" }, 0);
    }
    tl.to(
      perspStateRef.current,
      {
        deckPerspective: landing.overlayPerspective,
        deckOriginX: landing.overlayOriginXpx,
        deckOriginY: landing.overlayOriginYpx,
        slotPerspective: landing.wrapperPerspective,
        slotOriginXpct: landing.wrapperOriginXpct,
        slotOriginYpct: landing.wrapperOriginYpct,
        slotTranslateX: flightDx,
        slotTranslateY: flightDy,
        duration: 0.95,
        ease: "power3.inOut",
        onUpdate: applyPerspState,
      },
      0
    );

    // 6. Glass container & gradient colorflow background bloom in behind the card
    if (boxRef.current) {
      tl.to(boxRef.current, { opacity: 1, scale: 1, y: 0, duration: 0.65, ease: "power3.out" }, 0.3);
    }
    if (iframeRef.current) {
      tl.to(iframeRef.current, { opacity: 1, duration: 0.6, ease: "power2.out" }, 0.35);
    }

    // 7. Editorial info items reveal smoothly with upward glide and blur unmasking
    if (infoItems && infoItems.length > 0) {
      tl.to(
        infoItems,
        {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          duration: 0.6,
          ease: "power3.out",
          stagger: 0.05,
        },
        0.4
      );
    }
  }, [slotEl, otherEntrances, detail, landing, scaleTarget, cardEls, shadowEls, applyPerspState]);

  return (
    <>
      {/* Chrome Root: Backdrop + Box (z-[400]) */}
      <div
        ref={chromeRootRef}
        className="fixed inset-0 z-[400] cursor-grab active:cursor-grabbing"
        onClick={() => {
          if (!hasMovedRef.current) close();
        }}
      >
        <div
          ref={backdropRef}
          aria-hidden
          className="absolute inset-0"
          style={{
            background: "color-mix(in oklab, var(--background) 92%, transparent)",
            backdropFilter: "blur(18px)",
            WebkitBackdropFilter: "blur(18px)",
            zIndex: 0,
          }}
        />

        <div
          ref={boxRef}
          className="absolute overflow-hidden rounded-[32px] cursor-default
                     inset-x-4 top-4 h-[calc(45vh-24px)]
                     md:inset-x-auto md:left-[30px] md:top-[30px] md:bottom-[30px]
                     md:h-auto md:w-[calc(50vw-60px)]"
          style={{
            background:
              "linear-gradient(150deg, color-mix(in oklab, var(--foreground) 6%, transparent) 0%, color-mix(in oklab, var(--foreground) 2%, transparent) 100%)",
            boxShadow: [
              "inset 0 0 0 1px color-mix(in oklab, var(--foreground) 14%, transparent)",
              "0 40px 80px -30px rgba(0,0,0,0.35)",
            ].join(","),
            zIndex: 1,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <iframe
            ref={iframeRef}
            title="Gradient backdrop"
            src={COLORFLOW_EMBED_URLS[paletteId % 4]}
            loading="eager"
            aria-hidden
            className="pointer-events-none absolute inset-0 h-full w-full"
            style={{ border: 0, opacity: 0 }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.28) 100%)",
            }}
          />
        </div>
      </div>

      {/* Controls Root: Close Button + Info Panel (z-[99999]) */}
      <div className="fixed inset-0 z-[99999] pointer-events-none">
        <button
          data-detail-close-btn
          onClick={close}
          aria-label="Close"
          className="pointer-events-auto absolute right-6 top-6 rounded-full
                     border border-foreground/20 p-3 text-foreground/80
                     backdrop-blur-md transition-colors hover:bg-foreground/10
                     hover:text-foreground cursor-pointer"
          style={{ zIndex: 10 }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          >
            <path d="M3 3 L13 13 M13 3 L3 13" />
          </svg>
        </button>

        <div
          ref={infoRootRef}
          className="pointer-events-auto absolute flex flex-col gap-3 overflow-y-auto
                     inset-x-4 top-[calc(45vh+8px)] bottom-4 px-4 pb-6
                     md:justify-center md:overflow-visible md:gap-6
                     md:inset-x-auto md:right-[30px] md:top-[30px] md:bottom-[30px]
                     md:px-0 md:pb-0 md:w-[calc(50vw-60px)]
                     md:pl-[4vw] md:pr-[2vw]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* 1. Eyebrow */}
          <div
            data-detail-reveal
            className="text-[11px] uppercase tracking-[0.28em] text-muted-foreground"
          >
            EXCELSIOR · {card.category}
          </div>

          {/* 2. Title */}
          <h2
            data-detail-reveal
            className="font-medium text-foreground tracking-tight"
            style={{
              fontFamily: "var(--font-playfair), serif",
              fontSize: "clamp(1.5rem, 5.5vw, 4.2rem)",
              lineHeight: 0.95,
              letterSpacing: "-0.02em",
            }}
          >
            {card.title}
          </h2>

          {/* 3. Description */}
          <p
            data-detail-reveal
            className="max-w-[46ch] text-[13px] md:text-[15px] leading-relaxed text-muted-foreground"
          >
            {card.description}
          </p>

          {/* 4. Literary Badges */}
          <div data-detail-reveal className="grid grid-cols-3 gap-3">
            {[
              { label: card.category, sub: "Format", Icon: BookIcon },
              { label: card.readTime, sub: "Read Time", Icon: ClockIcon },
              { label: "Curated", sub: "Editorial Pick", Icon: SparklesIcon },
            ].map(({ label, sub, Icon }, i) => (
              <div
                key={i}
                className="flex flex-col items-center gap-1 rounded-xl
                           border border-foreground/10 bg-foreground/5 px-2 py-2 text-center
                           md:gap-1.5 md:px-3 md:py-3"
              >
                <Icon />
                <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-foreground">
                  {label}
                </div>
                <div className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
                  {sub}
                </div>
              </div>
            ))}
          </div>

          {/* 5. Author + Word Count Row */}
          <div
            data-detail-reveal
            className="mt-2 flex items-end justify-between border-t border-foreground/10 pt-4"
          >
            <div>
              <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                Writer / Contributor
              </div>
              <div className="text-[14px] font-medium text-foreground mt-0.5">
                {card.writer}
              </div>
            </div>
            <div
              className="text-foreground font-medium"
              style={{
                fontFamily: "var(--font-playfair), serif",
                fontSize: isMobile ? 24 : 30,
                lineHeight: 1,
              }}
            >
              {card.words
                ? card.words.toLowerCase().includes("word") ||
                  card.words.toLowerCase().includes("page") ||
                  card.words.toLowerCase().includes("vol") ||
                  card.words.toLowerCase().includes("pub")
                  ? card.words
                  : `${card.words} words`
                : "Featured"}
            </div>
          </div>

          {/* 6. Dynamic Destination CTA button */}
          <Link
            href={card.slug || "/publications"}
            data-detail-reveal
            className="group mt-1 md:mt-2 px-6 py-3 md:px-8 md:py-4 rounded-full
                       bg-foreground text-background border border-foreground/15
                       flex items-center justify-center gap-3 cursor-pointer
                       transition-transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <span className="text-[12px] uppercase tracking-[0.24em] font-medium">
              {card.slug?.includes("/editors-shelf")
                ? "Open Editor's Shelf"
                : card.slug?.includes("/library")
                ? "View in Library"
                : card.slug?.includes("/events")
                ? "View Event"
                : "Read publication"}
            </span>
            <span className="transition-transform group-hover:translate-x-1">→</span>
          </Link>
        </div>
      </div>
    </>
  );
}

/* ==========================================================================
   Main Cardwall Hero Section
   ========================================================================== */

export type HeroCardInput = {
  title: string;
  writer: string;
  category?: string;
  readTime?: string;
  words?: string;
  description?: string;
  href?: string;
  image?: string;
  accent?: string;
};

export default function Cardwall({
  heroCards = [],
  startEntrance = true,
}: {
  heroCards?: HeroCardInput[];
  startEntrance?: boolean;
}) {
  const visibleCards: CardDesign[] = React.useMemo(() => {
    return heroCards.length
      ? Array.from({ length: Math.ceil(DEFAULT_CARDS.length / heroCards.length) }, (_, repeat) =>
          heroCards.map((item, index) => ({
            ...PALETTE[index % PALETTE.length],
            id: repeat * heroCards.length + index,
            title: item.title,
            writer: item.writer,
            category: item.category || PALETTE[index % PALETTE.length].category,
            readTime: item.readTime || PALETTE[index % PALETTE.length].readTime,
            words: item.words || PALETTE[index % PALETTE.length].words,
            description: item.description || PALETTE[index % PALETTE.length].description,
            slug: item.href || PALETTE[index % PALETTE.length].slug,
            image: item.image || PALETTE[index % PALETTE.length].image,
            accent: item.accent || PALETTE[index % PALETTE.length].accent,
          }))
        )
          .flat()
          .slice(0, DEFAULT_CARDS.length)
      : DEFAULT_CARDS;
  }, [heroCards]);

  const sectionRef = useRef<HTMLElement>(null);
  const deckPerspectiveRef = useRef<HTMLDivElement>(null);
  const entranceSettledRef = useRef(false);
  const entrancePlayedRef = useRef(false);
  const lockedIdxRef = useRef<number | null>(null);
  const lenis = useLenis();

  // Safety: never leave Lenis frozen if the section unmounts while the detail modal is open
  useEffect(() => {
    return () => {
      lenis?.start();
    };
  }, [lenis]);

  const [cfg, setCfg] = useState<ViewConfig>(DEFAULT_CFG);
  const [detail, setDetail] = useState<DetailState | null>(null);
  const [centers, setCenters] = useState<Array<{ x: number; y: number }>>(() => {
    const cfgInit = DEFAULT_CFG;
    const vw = 1440;
    const vh = 900;
    const sx = (cfgInit.startX / 100) * vw;
    const sy = (cfgInit.startY / 100) * vh;
    const ex = (cfgInit.endX / 100) * vw;
    const ey = (cfgInit.endY / 100) * vh;
    const count = visibleCards.length || 18;
    return Array.from({ length: count }, (_, i) => {
      const t = i / (count - 1);
      return {
        x: sx + t * (ex - sx),
        y: sy + t * (ey - sy),
      };
    });
  });
  // Sync client responsive cfg on mount without SSR hydration mismatch
  useEffect(() => {
    setCfg(pickDefaultCfg());
  }, []);

  // Warm the decoder cache with the EXACT URLs the card faces render, so
  // custom covers are already decoded before frame 1 of the entrance.
  // Deliberately stateless: resolving decodes must never re-render this
  // component (18 cards × deep 3D subtree) mid-flight.
  useEffect(() => {
    visibleCards.forEach((card) => {
      const sources = [card.image ? getOptimizedCardwallCoverUrl(card.image) : "", card.backImage || ""];
      sources.forEach((src) => {
        if (!src) return;
        const img = new Image();
        img.decoding = "async";
        img.onload = () => {
          if ("decode" in img) img.decode().catch(() => {});
        };
        img.src = src;
      });
    });
  }, [visibleCards]);

  const centersRef = useRef<Array<{ x: number; y: number }>>([]);
  const layoutCentersRef = useRef<Array<{ x: number; y: number }>>([]);
  const ribbonRef = useRef<{ x0: number; y0: number; dx: number; dy: number; len2: number }>({
    x0: 0,
    y0: 0,
    dx: 0,
    dy: 0,
    len2: 1,
  });

  // Array of DOM refs for each card slot
  const slotRefs = useRef<(HTMLDivElement | null)[]>([]);
  const shadowRefs = useRef<(HTMLDivElement | null)[]>([]);
  const entranceRefs = useRef<(HTMLDivElement | null)[]>([]);
  const flipRefs = useRef<(HTMLDivElement | null)[]>([]);
  const scaleRefs = useRef<(HTMLDivElement | null)[]>([]);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const baseTiltRefs = useRef<(HTMLDivElement | null)[]>([]);
  const shineRefs = useRef<(HTMLDivElement | null)[]>([]);
  const frontFaceRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Physics state per card
  const physicsStates = useRef<CardPhysicsState[]>(
    Array.from({ length: 42 }, () => ({
      lift: 0,
      velLift: 0,
      rotX: 0,
      velRotX: 0,
      rotZ: 0,
      velRotZ: 0,
      glow: 0,
    }))
  );

  // Live cursor state
  const cursorRef = useRef({
    active: false,
    x: -9999,
    y: -9999,
    hitIdx: -1,
    stripStart: 0,
    stripEnd: 0,
  });

  // Unique title letters
  const titleText = "Excelsior.";

  // Update layout calculation
  const measure = useCallback(() => {
    if (!sectionRef.current) return;
    const rect = sectionRef.current.getBoundingClientRect();
    const vw = rect.width;
    const vh = rect.height;

    const sx = (cfg.startX / 100) * vw;
    const sy = (cfg.startY / 100) * vh;
    const ex = (cfg.endX / 100) * vw;
    const ey = (cfg.endY / 100) * vh;

    const layout = visibleCards.map((_, i) => {
      const t = i / (visibleCards.length - 1);
      return {
        x: sx + t * (ex - sx),
        y: sy + t * (ey - sy),
      };
    });

    layoutCentersRef.current = layout;
    setCenters((prev) => {
      if (prev.length === layout.length && prev[0] && layout[0]) {
        const dx = Math.abs(prev[0].x - layout[0].x);
        const dy = Math.abs(prev[0].y - layout[0].y);
        if (dx < 1 && dy < 1) return prev;
      }
      return layout;
    });

    const originX = (cfg.originX / 100) * vw;
    const originY = (cfg.originY / 100) * vh;
    const p = cfg.perspective;
    const projected = layout.map((c, i) => {
      const t = i / (visibleCards.length - 1);
      const z = cfg.zNear + t * (cfg.zFar - cfg.zNear);
      const scale = p / (p - z);
      return {
        x: originX + (c.x - originX) * scale,
        y: originY + (c.y - originY) * scale,
      };
    });
    centersRef.current = projected;

    const N = visibleCards.length;
    const dx = projected[N - 1].x - projected[0].x;
    const dy = projected[N - 1].y - projected[0].y;
    ribbonRef.current = {
      x0: projected[0].x,
      y0: projected[0].y,
      dx,
      dy,
      len2: Math.max(1, dx * dx + dy * dy),
    };
  }, [cfg]);

  // Initial measure + resize handling with debouncing & delta threshold
  useEffect(() => {
    measure();

    let lastW = window.innerWidth;
    let lastH = window.innerHeight;
    let timer: NodeJS.Timeout;

    function onResize() {
      if (!entranceSettledRef.current) return;
      const wantMobile = window.innerWidth <= MOBILE_BREAKPOINT;
      setCfg((prev) => {
        if (wantMobile && prev === DEFAULT_CFG) return DEFAULT_CFG_MOBILE;
        if (!wantMobile && prev === DEFAULT_CFG_MOBILE) return DEFAULT_CFG;
        return prev;
      });

      const dW = Math.abs(window.innerWidth - lastW);
      const dH = Math.abs(window.innerHeight - lastH);
      if (dW < 24 && dH < 24) return;

      lastW = window.innerWidth;
      lastH = window.innerHeight;

      clearTimeout(timer);
      timer = setTimeout(() => {
        measure();
      }, 120);
    }

    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      clearTimeout(timer);
    };
  }, [measure]);

  // Entrance animation (Helical sky formation -> resting deck)
  useEffect(() => {
    if (entrancePlayedRef.current || centers.length === 0) return;

    const validEntranceEls = entranceRefs.current.filter((el) => el !== null);
    const letters = sectionRef.current?.querySelectorAll("[data-reveal-letter]");
    const tagline = sectionRef.current?.querySelectorAll("[data-reveal-tagline]");
    const meta = sectionRef.current?.querySelectorAll("[data-reveal-meta]");

    // Frame 1: Pre-position all elements in their initial ready state
    if (validEntranceEls.length > 0) {
      gsap.set(validEntranceEls, {
        x: (i) => Math.cos((i / 42) * 6 * Math.PI) * (320 + (i % 4) * 20),
        y: (i) => -820 + Math.sin((i / 42) * 6 * Math.PI) * 160,
        rotation: (i) => (i / 42) * 1080 - 540,
        scale: 0.55,
        opacity: 0,
        force3D: true,
      });
    }

    if (letters && letters.length > 0) {
      gsap.set(letters, { opacity: 0, scale: 0.4, rotationY: 90 });
    }
    if (tagline && tagline.length > 0) {
      gsap.set(tagline, { opacity: 0, y: 20 });
    }
    if (meta && meta.length > 0) {
      gsap.set(meta, { opacity: 0, y: 20 });
    }

    // Wait until startEntrance is triggered by the preloader completion
    if (!startEntrance) return;
    entrancePlayedRef.current = true;

    const buildTimeline = () => {
      const tl = gsap.timeline({
        delay: 0.05,
        onComplete: () => {
          entranceSettledRef.current = true;
          // Let deferred heavy work (WebGL books, texture pre-generation)
          // start only now that the flight is over.
          markCardwallSettled();
        },
      });

      if (validEntranceEls.length > 0) {
        tl.to(
          validEntranceEls,
          {
            x: 0,
            y: 0,
            rotation: 0,
            scale: 1,
            opacity: 1,
            duration: 1.8,
            ease: "power3.out",
            stagger: { each: 0.028, from: "center" },
            force3D: true,
          },
          0
        );
      }

      if (letters && letters.length > 0) {
        tl.to(
          letters,
          {
            opacity: 1,
            scale: 1,
            rotationY: 0,
            duration: 1.1,
            ease: "power3.out",
            stagger: 0.055,
            force3D: true,
          },
          0.1
        );
      }

      if (tagline && tagline.length > 0) {
        tl.to(
          tagline,
          { opacity: 1, y: 0, duration: 1.1, ease: "power4.out", force3D: true },
          0.9
        );
      }

      if (meta && meta.length > 0) {
        tl.to(meta, { opacity: 1, y: 0, duration: 1, ease: "power4.out", force3D: true }, 1.0);
      }
    };

    requestAnimationFrame(buildTimeline);
  }, [startEntrance]);

  // Physics animation loop (rAF) with delta clamping & micro-thresholding.
  // The loop is parked via IntersectionObserver while the hero is scrolled
  // out of view so it never competes with below-the-fold scrolling.
  useEffect(() => {
    let animId = 0;
    let running = false;
    let lastT = performance.now();

    const tick = (now: number) => {
      if (!entranceSettledRef.current) {
        animId = requestAnimationFrame(tick);
        return;
      }

      const dt = clamp(0.1, (now - lastT) / 16.667, 1.5);
      lastT = now;

      const cursor = cursorRef.current;
      const proj = centersRef.current;

      let fracFocus = 0;
      if (cursor.active && cursor.hitIdx >= 0) {
        const stripW = cursor.stripEnd - cursor.stripStart;
        const tSeg = stripW > 0 ? (cursor.x - cursor.stripStart) / stripW : 0;
        fracFocus = cursor.hitIdx + clamp(0, tSeg, 1);
      }

      const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
      const waveSpeed = 0.0003;
      const waveSpatialFreq = 0.12;
      const wavePhase = now * waveSpeed;

      for (let i = 0; i < visibleCards.length; i++) {
        if (lockedIdxRef.current === i) continue;

        const s = physicsStates.current[i];
        const center = proj[i] || { x: 0, y: 0 };
        const cardRef = cardRefs.current[i];
        const shine = shineRefs.current[i];
        const shadow = shadowRefs.current[i];

        if (!cardRef || !shadow) continue;

        const dx = cursor.x - center.x;
        const dy = cursor.y - center.y;

        const rawWave = Math.sin(wavePhase - i * waveSpatialFreq);
        const mobileWaveLift = Math.max(0, rawWave);

        const targetLift = isMobile
          ? -mobileWaveLift * (LIFT_MAX * 0.12)
          : cursor.active
          ? -LIFT_MAX * Math.exp(-Math.pow(i - fracFocus, 2) / Math.pow(INDEX_SIGMA, 2))
          : 0;

        const liftRatio = Math.min(1, Math.abs(s.lift) / LIFT_MAX);
        const targetRotX = isMobile
          ? rawWave * 0.6
          : cursor.active
          ? clamp(-TILT_MAX_X, (dy / 400) * TILT_MAX_X, TILT_MAX_X) * liftRatio
          : 0;
        const targetRotZ = isMobile
          ? -rawWave * 0.45
          : cursor.active
          ? clamp(-TILT_MAX_Z, (-dx / 500) * TILT_MAX_Z, TILT_MAX_Z) * liftRatio
          : 0;

        // Optimized Semi-implicit Euler springs
        s.velLift += (targetLift - s.lift) * SPRING_LIFT * dt;
        s.velLift *= Math.pow(DAMPING_LIFT, dt);
        s.lift += s.velLift * dt;

        s.velRotX += (targetRotX - s.rotX) * SPRING_ROT * dt;
        s.velRotX *= Math.pow(DAMPING_ROT, dt);
        s.rotX += s.velRotX * dt;

        s.velRotZ += (targetRotZ - s.rotZ) * SPRING_ROT * dt;
        s.velRotZ *= Math.pow(DAMPING_ROT, dt);
        s.rotZ += s.velRotZ * dt;

        const targetGlow = Math.min(1, Math.abs(s.lift) / LIFT_MAX);
        s.glow += (targetGlow - s.glow) * 0.15 * dt;

        // Skip DOM writes if values have settled and cursor is idle
        if (!cursor.active && !isMobile && Math.abs(s.lift) < 0.01 && Math.abs(s.velLift) < 0.01) {
          continue;
        }

        const liftedZ = Math.abs(s.lift) * 0.6;
        cardRef.style.transform = `translate3d(0, ${s.lift.toFixed(2)}px, ${liftedZ.toFixed(2)}px) rotateX(${s.rotX.toFixed(2)}deg) rotateZ(${s.rotZ.toFixed(2)}deg)`;
        cardRef.style.zIndex = `${100 + Math.round(Math.abs(s.lift))}`;

        if (shine) {
          const u = isMobile
            ? (rawWave + 1) * 0.5
            : clamp(0, (cursor.x - (center.x - CARD_W / 2)) / CARD_W, 1);
          shine.style.opacity = `${(s.glow * 0.85).toFixed(3)}`;
          shine.style.backgroundPosition = `${(u * 100).toFixed(1)}% 50%`;
        }

        const l = Math.abs(s.lift);
        shadow.style.opacity = `${(0.32 + s.glow * 0.35).toFixed(3)}`;
        shadow.style.transform = `translateY(${(10 + l * 0.12).toFixed(2)}px) scale(${(1 + l * 0.004).toFixed(3)}, ${(0.7 + l * 0.002).toFixed(3)})`;
      }

      animId = requestAnimationFrame(tick);
    };

    const start = () => {
      if (running) return;
      running = true;
      lastT = performance.now();
      animId = requestAnimationFrame(tick);
    };

    const stop = () => {
      running = false;
      cancelAnimationFrame(animId);
    };

    const visibilityObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) start();
        else stop();
      },
      { rootMargin: "10% 0px 10% 0px" }
    );

    if (sectionRef.current) visibilityObserver.observe(sectionRef.current);

    start();
    return () => {
      stop();
      visibilityObserver.disconnect();
    };
  }, []);

  // Pointer event handlers
  const handlePointerMove = (e: React.PointerEvent) => {
    if (
      lockedIdxRef.current !== null ||
      !entranceSettledRef.current ||
      !sectionRef.current ||
      (typeof window !== "undefined" && window.innerWidth < 768)
    ) {
      cursorRef.current.active = false;
      cursorRef.current.hitIdx = -1;
      return;
    }

    const rect = sectionRef.current.getBoundingClientRect();
    cursorRef.current.x = e.clientX - rect.left;
    cursorRef.current.y = e.clientY - rect.top;

    const hit = document.elementFromPoint(e.clientX, e.clientY);
    const cardEl = hit?.closest("[data-card-index]") as HTMLElement | null;

    if (cardEl) {
      const hitIdx = Number(cardEl.dataset.cardIndex);
      cursorRef.current.active = true;
      cursorRef.current.hitIdx = hitIdx;

      const r = cardEl.getBoundingClientRect();
      const next = document.querySelector(`[data-card-index="${hitIdx + 1}"]`);
      cursorRef.current.stripStart = r.left - rect.left;
      cursorRef.current.stripEnd = next
        ? next.getBoundingClientRect().left - rect.left
        : r.right - rect.left;
    } else {
      cursorRef.current.active = false;
      cursorRef.current.hitIdx = -1;
    }
  };

  const handlePointerLeave = () => {
    cursorRef.current.active = false;
    cursorRef.current.hitIdx = -1;
    cursorRef.current.x = -9999;
    cursorRef.current.y = -9999;
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    // Completely deactivate click / detail modal on mobile screens
    if (
      detail !== null ||
      !sectionRef.current ||
      (typeof window !== "undefined" && window.innerWidth < 768) ||
      e.pointerType === "touch"
    ) {
      return;
    }
    const tClick = performance.now();
    const hit = document.elementFromPoint(e.clientX, e.clientY);
    const slot = hit?.closest("[data-card-index]") as HTMLElement | null;
    if (!slot) return;

    // Freeze any in-flight smooth scroll so flight coordinates stay valid while the modal is open
    lenis?.stop();

    const idx = Number(slot.dataset.cardIndex);
    lockedIdxRef.current = idx;
    cursorRef.current.active = false;

    // Clear any leftover imperative zIndex from previous close animation
    // so React's className z-[500] (set by setDetail below) takes effect
    if (deckPerspectiveRef.current) {
      deckPerspectiveRef.current.style.zIndex = "";
    }

    const slotEl = slotRefs.current[idx];

    const s = physicsStates.current[idx];
    const sourcePhysics = { lift: s.lift, rotX: s.rotX, rotZ: s.rotZ };

    s.lift = 0;
    s.rotX = 0;
    s.rotZ = 0;
    s.velLift = 0;
    s.velRotX = 0;
    s.velRotZ = 0;
    s.glow = 0;

    const r = slot.getBoundingClientRect();
    const t = idx / (visibleCards.length - 1);
    const zOff = cfg.zNear + t * (cfg.zFar - cfg.zNear);

    const sectRect = sectionRef.current.getBoundingClientRect();
    const sourceOriginViewportX = sectRect.left + (cfg.originX / 100) * sectRect.width;
    const sourceOriginViewportY = sectRect.top + (cfg.originY / 100) * sectRect.height;

    setDetail({
      idx,
      sourceRect: { left: r.left, top: r.top, width: r.width, height: r.height },
      sourceLayoutCenter: layoutCentersRef.current[idx] || { x: 0, y: 0 },
      sourceTilt: { topView: cfg.topView, baseRotY: cfg.baseRotY },
      sourcePhysics,
      sourceZ: zOff,
      sourcePerspective: cfg.perspective,
      sourceOriginViewportX,
      sourceOriginViewportY,
      sectionOffsetLeft: sectRect.left,
      sectionOffsetTop: sectRect.top,
      clickTime: tClick,
    });
  };

  const handleCloseDetail = () => {
    lockedIdxRef.current = null;
    setDetail(null);
    restoreChromeFromModal();
    // Reset the opened card's elevated stacking
    cardRefs.current.forEach((el) => {
      if (el) el.style.zIndex = "";
    });
    // Cleanly restore slot wrapper styles
    slotRefs.current.forEach((el) => {
      if (el) {
        el.style.zIndex = "";
        el.style.perspective = "";
        el.style.perspectiveOrigin = "";
        el.style.opacity = "";
      }
    });
    // Ensure all entrance wrappers are clean
    entranceRefs.current.forEach((el) => {
      if (el) {
        gsap.set(el, { opacity: 1, y: 0, scale: 1 });
      }
    });
    lenis?.start();
  };

  return (
    <section
      ref={sectionRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      onPointerDown={handlePointerDown}
      className="relative h-screen w-full overflow-x-clip overflow-y-visible bg-background text-foreground cursor-default select-none"
    >
      {/* 21. Ambient radial glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 70% 45% at 50% 68%, color-mix(in oklab, var(--foreground) 8%, transparent) 0%, transparent 70%)",
        }}
      />

      {/* 19. Hero Title & Tagline block */}
      <div
        data-hero-title-block
        className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
        style={{
          transform: "translateY(-14vh)",
        }}
      >
        {/* Tagline — placed closely above the Excelsior wordmark */}
        <p
          data-reveal-tagline
          className="text-center text-sm md:text-base tracking-[0.02em] text-muted-foreground/90 font-medium mb-1.5 md:mb-3"
          style={{
            fontFamily: "var(--font-playfair), serif",
            fontStyle: "italic",
            transform: "translateZ(0)",
            backfaceVisibility: "hidden",
            willChange: "transform, opacity",
          }}
        >
          Appreciate Literature?
        </p>

        {/* Wordmark — scales to cover ~80% of viewport width on mobile */}
        <h1
          style={{
            fontFamily: "var(--font-playfair), serif",
            fontSize: "clamp(4.2rem, 18.5vw, 12.5rem)",
            lineHeight: 0.92,
            letterSpacing: "-0.04em",
            perspective: "1200px",
            transformStyle: "preserve-3d",
          }}
          className="text-center font-medium tracking-tight text-foreground/95 select-none w-full px-2"
        >
          {titleText.split("").map((char, idx) => (
            <span
              key={idx}
              data-reveal-letter
              className="inline-block"
              style={{
                transformOrigin: "50% 50%",
                transform: "translateZ(0)",
                backfaceVisibility: "hidden",
                willChange: "transform, opacity",
              }}
            >
              {char === " " ? "\u00A0" : char}
            </span>
          ))}
        </h1>
      </div>

      {/* Deck Perspective Container */}
      <div
        ref={deckPerspectiveRef}
        suppressHydrationWarning
        className={`pointer-events-none absolute inset-0 ${detail !== null ? "z-[500]" : "z-[200]"}`}
        style={{
          perspective: cfg.perspective,
          perspectiveOrigin: `${cfg.originX}% ${cfg.originY}%`,
          transform: "translateZ(0)",
          transformStyle: "preserve-3d",
        }}
      >
        {visibleCards.map((card, i) => {
          const center = centers[i] || { x: -9999, y: -9999 };
          const t = i / (visibleCards.length - 1);
          const zOffset = cfg.zNear + t * (cfg.zFar - cfg.zNear);
          const left = center.x - CARD_W / 2;
          const top = center.y - CARD_H / 2;

          return (
            <div
              key={card.id}
              data-card-slot={i}
              suppressHydrationWarning
              ref={(el) => {
                slotRefs.current[i] = el;
              }}
              className="pointer-events-none absolute"
              style={{
                left,
                top,
                width: CARD_W,
                height: CARD_H,
                transformStyle: "preserve-3d",
                transform: `translateZ(${zOffset}px)`,
              }}
            >
              {/* Shadow node */}
              <div
                ref={(el) => {
                  shadowRefs.current[i] = el;
                }}
                className="pointer-events-none absolute left-1/2 bottom-0"
                style={{
                  width: 189,
                  height: 24,
                  marginLeft: -94.5,
                  background:
                    "radial-gradient(ellipse 50% 50% at center, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.24) 40%, rgba(0,0,0,0.06) 65%, transparent 80%)",
                  willChange: "transform, opacity",
                }}
              />

              {/* Entrance wrapper */}
              <div
                ref={(el) => {
                  entranceRefs.current[i] = el;
                }}
                style={{
                  transformStyle: "preserve-3d",
                  transformOrigin: "50% 50%",
                  transform: "translateZ(0)",
                  willChange: "transform, opacity",
                }}
              >
                {/* Flip wrapper */}
                <div
                  data-card-flip
                  ref={(el) => {
                    flipRefs.current[i] = el;
                  }}
                  style={{
                    transformStyle: "preserve-3d",
                    transformOrigin: "50% 50%",
                    transform: "translateZ(0)",
                  }}
                >
                  {/* Scale wrapper */}
                  <div
                    data-card-scale
                    ref={(el) => {
                      scaleRefs.current[i] = el;
                    }}
                    style={{
                      transformStyle: "preserve-3d",
                      transformOrigin: "50% 50%",
                      transform: "translateZ(0)",
                    }}
                  >
                    {/* Physics card wrapper */}
                    <div
                      ref={(el) => {
                        cardRefs.current[i] = el;
                      }}
                      style={{
                        transformStyle: "preserve-3d",
                        transformOrigin: "50% 50%",
                        width: CARD_W,
                        height: CARD_H,
                      }}
                    >
                      {/* Base tilt wrapper */}
                      <div
                        ref={(el) => {
                          baseTiltRefs.current[i] = el;
                        }}
                        style={{
                          transformStyle: "preserve-3d",
                          transformOrigin: "50% 50%",
                          transform: `rotateX(${cfg.topView}deg) rotateY(${cfg.baseRotY}deg)`,
                          width: CARD_W,
                          height: CARD_H,
                          position: "relative",
                        }}
                      >
                        {/* Front Face */}
                        <div
                          data-card-index={i}
                          data-card-face
                          ref={(el) => {
                            frontFaceRefs.current[i] = el;
                          }}
                          className="pointer-events-auto absolute inset-0 cursor-pointer"
                          style={{
                            borderRadius: 14,
                            backfaceVisibility: "hidden",
                            boxShadow: DECK_SHADOW,
                            transform: "translateZ(0)",
                          }}
                        >
                          <CardFace
                            card={card}
                            setShineRef={(el) => {
                              shineRefs.current[i] = el;
                            }}
                          />
                        </div>

                        {/* Back Face */}
                        <div
                          className="absolute inset-0 overflow-hidden"
                          style={{
                            borderRadius: 14,
                            transform: `translateZ(-${CARD_THICKNESS}px) rotateY(180deg)`,
                            boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.05)",
                          }}
                        >
                          <CardBack card={card} />
                        </div>

                        {/* Left edge */}
                        <div
                          className="absolute pointer-events-none"
                          style={{
                            left: -CARD_THICKNESS,
                            top: 14,
                            width: CARD_THICKNESS,
                            height: CARD_H - 28,
                            transformOrigin: "100% 50%",
                            transform: "rotateY(-90deg)",
                            background: EDGE_SIDE,
                          }}
                        />

                        {/* Right edge */}
                        <div
                          className="absolute pointer-events-none"
                          style={{
                            right: -CARD_THICKNESS,
                            top: 14,
                            width: CARD_THICKNESS,
                            height: CARD_H - 28,
                            transformOrigin: "0% 50%",
                            transform: "rotateY(90deg)",
                            background: EDGE_SIDE,
                          }}
                        />

                        {/* Top edge */}
                        <div
                          className="absolute pointer-events-none"
                          style={{
                            left: 14,
                            top: -CARD_THICKNESS,
                            width: CARD_W - 28,
                            height: CARD_THICKNESS,
                            transformOrigin: "50% 100%",
                            transform: "rotateX(90deg)",
                            background: EDGE_TOP,
                          }}
                        />

                        {/* Bottom edge */}
                        <div
                          className="absolute pointer-events-none"
                          style={{
                            left: 14,
                            top: CARD_H,
                            width: CARD_W - 28,
                            height: CARD_THICKNESS,
                            transformOrigin: "50% 0%",
                            transform: "rotateX(-90deg)",
                            background: EDGE_BOTTOM,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Flight Detail Modal */}
      {detail !== null && visibleCards[detail.idx] && (
        <CardDetail
          card={visibleCards[detail.idx]}
          detail={detail}
          onClose={handleCloseDetail}
          deckPerspectiveEl={deckPerspectiveRef.current}
          slotEls={slotRefs.current}
          entranceEls={entranceRefs.current}
          shadowEls={shadowRefs.current}
          cardEls={cardRefs.current}
        />
      )}
    </section>
  );
}
