// src/components/home/MorphogenesisHero.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { useLenis } from 'lenis/react';
import * as THREE from 'three';
import { motion } from 'framer-motion';
import { 
  ArrowRight, 
  Mail, 
  Feather
} from 'lucide-react';
import { vertexShader, fragmentShader } from './shaders';

function hexToRgb(hex: string) {
  const cleanHex = hex.replace('#', '');
  const bigint = parseInt(cleanHex, 16);
  if (isNaN(bigint)) return { r: 0.92, g: 0.96, b: 0.87 };
  return {
    r: ((bigint >> 16) & 255) / 255,
    g: ((bigint >> 8) & 255) / 255,
    b: (bigint & 255) / 255,
  };
}

export default function MorphogenesisHero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const materialRef = useRef<THREE.ShaderMaterial | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && resolvedTheme === 'dark';
  const targetHex = isDark ? '#0f0f0f' : '#ebf5df';

  // Setup Three.js Scene, Camera, and Shader for Scroll Transition
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    let animationFrameId: number;

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    
    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: false,
      powerPreference: 'high-performance',
    });
    rendererRef.current = renderer;

    const rgb = hexToRgb(targetHex);
    const geometry = new THREE.PlaneGeometry(2, 2);
    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uProgress: { value: 0 },
        uResolution: {
          value: new THREE.Vector2(container.offsetWidth, container.offsetHeight),
        },
        uColor: { value: new THREE.Vector3(rgb.r, rgb.g, rgb.b) },
        uSpread: { value: 0.45 },
      },
      transparent: true,
    });
    materialRef.current = material;

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    const resize = () => {
      if (!container || !renderer || !material) return;
      const width = container.offsetWidth;
      const height = container.offsetHeight;
      renderer.setSize(width, height, false);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      material.uniforms.uResolution.value.set(width, height);
    };

    resize();
    window.addEventListener('resize', resize);

    const resizeObserver = new ResizeObserver(() => {
      resize();
    });
    resizeObserver.observe(container);

    const animate = () => {
      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.removeEventListener('resize', resize);
      resizeObserver.disconnect();
      cancelAnimationFrame(animationFrameId);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      materialRef.current = null;
      rendererRef.current = null;
    };
  }, [targetHex]);

  // Sync scroll with shader progress
  const updateScrollProgress = (scrollTop: number) => {
    if (!materialRef.current) return;
    const windowHeight = typeof window !== 'undefined' ? window.innerHeight : 800;
    // Calculate progress as user scrolls past the hero (0 to 1.15)
    const scrollProgress = Math.min(Math.max((scrollTop / windowHeight) * 1.1, 0), 1.15);
    materialRef.current.uniforms.uProgress.value = scrollProgress;
  };

  useLenis(() => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const currentScroll = Math.max(0, -rect.top);
    updateScrollProgress(currentScroll);
  });

  useEffect(() => {
    const handleScroll = () => {
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const currentScroll = Math.max(0, -rect.top);
      updateScrollProgress(currentScroll);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <section 
      ref={containerRef}
      className="relative w-full h-[100svh] min-h-[640px] overflow-hidden select-none bg-[#080808]"
    >
      {/* ── Background Hero Image (Tailored from Assets) ── */}
      <div className="absolute inset-0 w-full h-full pointer-events-none">
        <picture className="w-full h-full block">
          {/* Mobile vertical framing */}
          <source 
            media="(max-width: 768px)" 
            srcSet="/images/hero-mobile.jpg" 
          />
          {/* Desktop editorial composition */}
          <source 
            media="(min-width: 769px)" 
            srcSet="/images/hero-bg.png" 
          />
          <img 
            src="/images/hero-bg.png" 
            alt="Excelsior Literary & Debate Society" 
            className="w-full h-full object-cover object-[center_bottom] md:object-center"
          />
        </picture>

        {/* Subtle cinematic left vignette for text contrast */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/35 to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30 pointer-events-none" />
      </div>

      {/* ── Hero Viewport Stage (100svh) ── */}
      <div className="relative w-full h-full flex flex-col justify-between px-6 sm:px-12 md:px-16 lg:px-20 pt-24 pb-8 md:pb-10 z-10">

        {/* ── Center / Left Editorial Overlay ── */}
        <div className="my-auto max-w-2xl text-left space-y-5 pt-2 md:pt-4">
          
          {/* Main Headline */}
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="font-serif text-5xl sm:text-6xl md:text-7xl lg:text-[5.5rem] xl:text-[6rem] text-white tracking-tight leading-[1.02]"
          >
            Where <span className="italic font-normal text-[#e5b869]">Words</span>
            <br />
            Ignite <span className="italic font-normal text-[#e5b869]">Minds.</span>
          </motion.h1>

          {/* Elegant Divider with Star Accent */}
          <motion.div 
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ duration: 0.8, delay: 0.25, ease: "easeOut" }}
            className="flex items-center gap-3 origin-left w-64 sm:w-80"
          >
            <div className="h-[1px] flex-grow bg-gradient-to-r from-amber-200/50 via-amber-200/20 to-transparent" />
            <span className="text-[#e5b869] text-xs select-none">✦</span>
          </motion.div>

          {/* Subtitle */}
          <motion.p 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="text-[#e0d6c3]/85 text-sm sm:text-base md:text-[16.5px] max-w-md font-sans font-light leading-relaxed drop-shadow"
          >
            A space where ideas are voiced, perspectives are challenged, and stories find their voice.
          </motion.p>

          {/* Action CTAs */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-wrap items-center gap-5 pt-3"
          >
            <Link 
              href="/publications"
              className="inline-flex items-center gap-2 px-7 py-3 rounded-full border border-[#dfb260]/60 bg-black/40 hover:bg-black/70 text-[#f5ebd7] text-xs font-semibold tracking-widest uppercase hover:border-[#e5b869] transition-all duration-300 active:scale-95 shadow-lg"
            >
              <span>Explore</span>
              <ArrowRight size={13} className="text-[#e5b869]" />
            </Link>

            <Link 
              href="/editors-shelf"
              className="text-xs uppercase tracking-widest font-semibold text-[#dfb260] hover:text-[#f5ebd7] transition underline-offset-8 hover:underline"
            >
              Our Initiatives
            </Link>
          </motion.div>

        </div>

        {/* ── Bottom Section: Scroll Down (Left) & Socials (Right) ── */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="w-full flex items-end justify-between text-[#dfb260]/80 pb-1"
        >
          {/* Scroll Indicator */}
          <div className="flex flex-col items-start gap-1">
            <span className="text-[#e5b869] text-xs select-none">✦</span>
            <div className="flex items-center gap-2 text-[8.5px] font-semibold tracking-[0.3em] uppercase">
              <span>Scroll</span>
              <span className="animate-bounce text-[#e5b869]">↓</span>
            </div>
          </div>

          {/* Social Links */}
          <div className="flex items-center gap-4 text-[#dfb260]/70 text-xs">
            <a 
              href="https://instagram.com" 
              target="_blank" 
              rel="noreferrer" 
              className="hover:text-[#f5ebd7] transition"
              aria-label="Instagram"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
              </svg>
            </a>
            <span className="text-[#dfb260]/40">|</span>
            <a 
              href="https://linkedin.com" 
              target="_blank" 
              rel="noreferrer" 
              className="hover:text-[#f5ebd7] transition"
              aria-label="LinkedIn"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
                <rect x="2" y="9" width="4" height="12"/>
                <circle cx="4" cy="4" r="2"/>
              </svg>
            </a>
            <span className="text-[#dfb260]/40">|</span>
            <a 
              href="mailto:contact@excelsior.org" 
              className="hover:text-[#f5ebd7] transition"
              aria-label="Email"
            >
              <Mail size={16} />
            </a>
          </div>
        </motion.div>

      </div>

      {/* ── Three.js WebGL Canvas (Dissolve Shader Overlay) ── */}
      <canvas 
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none z-20"
      />
    </section>
  );
}
