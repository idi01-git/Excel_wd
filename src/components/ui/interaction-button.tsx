"use client";

import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";

interface InteractionButtonProps {
  icon: LucideIcon;
  count?: number;
  label?: string;
  active: boolean;
  onClick: (e: React.MouseEvent) => void;
  activeColor: string;
  defaultColor?: string;
  withConfetti?: boolean;
  withFill?: boolean;
  fillColor?: string;
  disabled?: boolean;
  size?: number;
  className?: string;
  textClassName?: string;
}

function Confetti({ colorClass }: { colorClass: string }) {
  const reduceMotion = useReducedMotion();
  const [show, setShow] = useState(true);
  
  useEffect(() => {
    const t = setTimeout(() => setShow(false), 1000);
    return () => clearTimeout(t);
  }, []);

  if (!show || reduceMotion) return null;

  return (
    <div className={cn("absolute inset-0 pointer-events-none flex items-center justify-center z-10", colorClass)}>
      {[...Array(6)].map((_, i) => {
        const angle = (i * 60) * (Math.PI / 180);
        const distances = [16, 18, 20, 17, 19, 21];
        const distance = distances[i % distances.length];
        return (
          <motion.div
            key={i}
            initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
            animate={{ 
              x: Math.cos(angle) * distance, 
              y: Math.sin(angle) * distance, 
              scale: [0, 1.2, 0],
              opacity: [1, 1, 0]
            }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="absolute w-1.5 h-1.5 rounded-full bg-current"
          />
        );
      })}
    </div>
  );
}

export function InteractionButton({ 
  icon: Icon, 
  count, 
  label,
  active, 
  onClick, 
  activeColor,
  defaultColor = "text-neutral-400 dark:text-neutral-500",
  withConfetti = false,
  withFill = true,
  fillColor,
  disabled = false,
  size = 14,
  className,
  textClassName
}: InteractionButtonProps) {
  const reduceMotion = useReducedMotion();
  const [justActivated, setJustActivated] = useState(false);
  const wasActive = useRef(active);

  useEffect(() => {
    if (!wasActive.current && active && withConfetti) {
      setJustActivated(true);
      const t = setTimeout(() => setJustActivated(false), 1000);
      wasActive.current = active;
      return () => clearTimeout(t);
    }

    wasActive.current = active;
  }, [active, withConfetti]);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled) return;
    onClick(e);
  };

  return (
    <motion.button
      type="button"
      onClick={handleClick}
      onPointerDown={(e) => e.stopPropagation()}
      disabled={disabled}
      aria-disabled={disabled}
      className={cn(
        "relative flex items-center gap-1.5 outline-none group transition-colors cursor-pointer",
        disabled && "cursor-not-allowed opacity-70",
        className
      )}
      whileTap={disabled || reduceMotion ? undefined : { scale: 0.85 }}
    >
      <div className={cn("relative flex items-center justify-center", active ? activeColor : defaultColor)}>
        {withConfetti && justActivated && <Confetti colorClass={activeColor} />}
        <motion.div
          initial={false}
          animate={{ scale: active ? 1.15 : 1 }}
          transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 450, damping: 15 }}
        >
          <Icon 
            size={size} 
            strokeWidth={active ? 2.5 : 1.5} 
            className={cn("transition-colors duration-200", !active && "group-hover:text-neutral-700 dark:group-hover:text-neutral-200")}
            fill={active && withFill ? (fillColor || "currentColor") : "transparent"}
          />
        </motion.div>
      </div>
      
      {(count !== undefined || label) && (
        <span className={cn("font-medium transition-colors text-xs", textClassName, active ? "text-neutral-900 dark:text-neutral-100 font-semibold" : "text-neutral-500 dark:text-neutral-400 group-hover:text-neutral-800 dark:group-hover:text-neutral-200")}>
          {label && <span className="mr-1">{label}</span>}
          {count !== undefined && count > 0 && count}
        </span>
      )}
    </motion.button>
  );
}
