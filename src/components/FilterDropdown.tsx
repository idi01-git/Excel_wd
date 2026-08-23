"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { SlidersHorizontal, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FilterOption {
  id: string;
  label: string;
}

interface FilterDropdownProps {
  options: FilterOption[];
  value: string;
  onChange: (value: string) => void;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  iconOnly?: boolean;
  className?: string;
}

const smoothSpring = {
  type: 'spring' as const,
  stiffness: 260,
  damping: 25,
  mass: 1,
};

export default function FilterDropdown({
  options,
  value,
  onChange,
  isOpen: controlledIsOpen,
  onOpenChange,
  iconOnly = false,
  className,
}: FilterDropdownProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isControlled = controlledIsOpen !== undefined;
  const isOpen = isControlled ? controlledIsOpen : internalIsOpen;

  const handleToggle = () => {
    const next = !isOpen;
    if (isControlled && onOpenChange) {
      onOpenChange(next);
    } else {
      setInternalIsOpen(next);
      if (onOpenChange) onOpenChange(next);
    }
  };

  const handleClose = () => {
    if (isControlled && onOpenChange) {
      onOpenChange(false);
    } else {
      setInternalIsOpen(false);
      if (onOpenChange) onOpenChange(false);
    }
  };

  const currentOption = options.find((o) => o.id === value) || options[0];
  const isFiltered = value && value !== "all";

  return (
    <div className="relative z-40">
      <motion.button
        type="button"
        layout
        transition={smoothSpring}
        whileTap={{ scale: 0.9 }}
        onClick={handleToggle}
        title={isFiltered ? `Filter: ${currentOption?.label}` : "Filter publications"}
        aria-label={isFiltered ? `Filter: ${currentOption?.label}` : "Filter publications"}
        className={cn(
          "relative flex items-center justify-center gap-1.5 h-10 w-10 sm:h-9 sm:w-9 rounded-full bg-neutral-100/80 hover:bg-neutral-200/80 dark:bg-white/[0.06] dark:hover:bg-white/[0.12] border text-neutral-700 dark:text-neutral-200 text-xs font-medium tracking-wide outline-none cursor-pointer transition-colors shadow-xs shrink-0 select-none",
          isFiltered
            ? "border-neutral-900/30 dark:border-white/30 text-neutral-950 dark:text-white bg-neutral-200/70 dark:bg-white/[0.12]"
            : "border-neutral-200/80 dark:border-white/10",
          !iconOnly && "w-auto px-4",
          className
        )}
      >
        {!iconOnly && (
          <motion.span layout className="whitespace-nowrap">
            {currentOption?.label}
          </motion.span>
        )}
        <SlidersHorizontal size={14} className={cn("shrink-0", isFiltered ? "text-neutral-950 dark:text-white" : "text-neutral-500 dark:text-neutral-400")} />
        
        {/* Active Filter Indicator Dot */}
        {isFiltered && (
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-neutral-950 dark:bg-white shadow-xs" />
        )}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              onClick={handleClose}
            />
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="absolute right-0 top-full mt-2 w-44 sm:w-48 bg-white/95 dark:bg-neutral-950/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-neutral-200/60 dark:border-white/10 p-1.5 z-50 overflow-hidden"
            >
              <div className="px-2.5 py-1.5 text-[10px] uppercase font-semibold tracking-wider text-muted-foreground border-b border-neutral-100 dark:border-neutral-800/80 mb-1">
                Language Filter
              </div>
              {options.map((option) => {
                const active = value === option.id;
                return (
                  <button
                    key={option.id}
                    onClick={() => {
                      onChange(option.id);
                      handleClose();
                    }}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-xl transition-colors cursor-pointer text-left",
                      active
                        ? "bg-neutral-950 text-white dark:bg-white dark:text-neutral-950 font-semibold shadow-xs"
                        : "text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-white/[0.08]"
                    )}
                  >
                    <span>{option.label}</span>
                    {active && <Check size={12} strokeWidth={2.5} className="shrink-0" />}
                  </button>
                );
              })}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
