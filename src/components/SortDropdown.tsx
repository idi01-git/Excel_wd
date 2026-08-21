"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowDownUp } from "lucide-react";

interface SortOption {
  id: string;
  label: string;
}

interface SortDropdownProps {
  options: SortOption[];
  value: string;
  onChange: (value: string) => void;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  onOpen?: () => void;
  compact?: boolean;
}

const smoothSpring = {
  type: 'spring' as const,
  stiffness: 260,
  damping: 25,
  mass: 1,
};

export default function SortDropdown({ 
  options, 
  value, 
  onChange, 
  isOpen: controlledIsOpen, 
  onOpenChange,
  onOpen,
  compact = false
}: SortDropdownProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isControlled = controlledIsOpen !== undefined;
  const isOpen = isControlled ? controlledIsOpen : internalIsOpen;

  const handleToggle = () => {
    const next = !isOpen;
    if (next && onOpen) onOpen();
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

  return (
    <div className="relative z-40">
      <motion.button
        layout
        transition={smoothSpring}
        onClick={handleToggle}
        className={`flex items-center gap-1.5 h-9 rounded-full bg-neutral-100/80 hover:bg-neutral-200/60 dark:bg-white/[0.06] dark:hover:bg-white/[0.1] text-neutral-700 dark:text-neutral-200 text-xs font-medium tracking-wide outline-none cursor-pointer transition-colors overflow-hidden ${
          compact ? 'px-2.5 sm:px-4' : 'px-4'
        }`}
        title={`Sort by: ${currentOption?.label}`}
      >
        <motion.span layout className={compact ? 'hidden sm:inline whitespace-nowrap' : 'inline whitespace-nowrap'}>
          {currentOption?.label}
        </motion.span>
        <ArrowDownUp size={12} className="text-neutral-400 dark:text-neutral-500 shrink-0" />
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
              className="absolute right-0 top-full mt-2 w-48 bg-white/95 dark:bg-neutral-950/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-neutral-200/60 dark:border-white/10 p-1.5 z-50 overflow-hidden"
            >
              {options.map((option) => (
                <button
                  key={option.id}
                  onClick={() => {
                    onChange(option.id);
                    handleClose();
                  }}
                  className={`w-full text-left px-3 py-2 text-xs font-medium rounded-xl transition-colors cursor-pointer ${
                    value === option.id 
                      ? "bg-neutral-950 text-white dark:bg-white dark:text-neutral-950 font-semibold shadow-xs" 
                      : "text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-white/[0.08]"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
