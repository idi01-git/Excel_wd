"use client"

import { forwardRef, Fragment, useMemo, useRef, useState } from "react"
import { motion, useMotionValue, useSpring } from "motion/react"
import { useMergeRefs } from "@floating-ui/react"

// --- Tiptap UI Primitive ---
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/tiptap-ui-primitive/tooltip"

// --- Lib ---
import { cn, parseShortcutKeys } from "@/lib/tiptap-utils"

import "@/components/tiptap-ui-primitive/button/button-colors.scss"
import "@/components/tiptap-ui-primitive/button/button.scss"

export type ButtonVariant = "ghost" | "primary"
export type ButtonSize = "small" | "default" | "large"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  showTooltip?: boolean
  tooltip?: React.ReactNode
  shortcutKeys?: string
  variant?: ButtonVariant
  size?: ButtonSize
}

export const ShortcutDisplay: React.FC<{ shortcuts: string[] }> = ({
  shortcuts,
}) => {
  if (shortcuts.length === 0) return null

  return (
    <div>
      {shortcuts.map((key, index) => (
        <Fragment key={index}>
          {index > 0 && <kbd>+</kbd>}
          <kbd>{key}</kbd>
        </Fragment>
      ))}
    </div>
  )
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      children,
      tooltip,
      showTooltip = true,
      shortcutKeys,
      variant,
      size,
      onMouseMove,
      onMouseLeave,
      ...props
    },
    ref
  ) => {
    const shortcuts = useMemo<string[]>(
      () => parseShortcutKeys({ shortcutKeys }),
      [shortcutKeys]
    )

    const innerRef = useRef<HTMLButtonElement>(null)
    const mergedRef = useMergeRefs([ref, innerRef])

    const x = useMotionValue(0)
    const y = useMotionValue(0)
    const springConfig = { damping: 15, stiffness: 150, mass: 0.1 }
    const springX = useSpring(x, springConfig)
    const springY = useSpring(y, springConfig)

    const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
      onMouseMove?.(e)
      if (!innerRef.current) return
      const rect = innerRef.current.getBoundingClientRect()
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2
      const distanceX = e.clientX - centerX
      const distanceY = e.clientY - centerY
      
      x.set(distanceX * 0.2)
      y.set(distanceY * 0.2)
    }

    const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
      onMouseLeave?.(e)
      x.set(0)
      y.set(0)
    }

    const innerContent = (
      <>
        <span className="tiptap-button-content relative z-10 flex items-center justify-center gap-[inherit] pointer-events-none">
          {children}
        </span>
        <span className="tiptap-button-fluid-fill" />
      </>
    )

    if (!tooltip || !showTooltip) {
      return (
        <motion.button
          data-slot="tiptap-button"
          className={cn("tiptap-button", className)}
          ref={mergedRef}
          data-style={variant}
          data-size={size}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          whileTap={{ scale: 0.95 }}
          style={{ x: springX, y: springY }}
          {...props as any}
        >
          {innerContent}
        </motion.button>
      )
    }

    return (
      <Tooltip delay={200}>
        <TooltipTrigger
          asChild
        >
          <motion.button
            data-slot="tiptap-button"
            className={cn("tiptap-button", className)}
            ref={mergedRef}
            data-style={variant}
            data-size={size}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            whileTap={{ scale: 0.95 }}
            style={{ x: springX, y: springY }}
            {...props as any}
          >
            {innerContent}
          </motion.button>
        </TooltipTrigger>
        <TooltipContent>
          {tooltip}
          <ShortcutDisplay shortcuts={shortcuts} />
        </TooltipContent>
      </Tooltip>
    )
  }
)

Button.displayName = "Button"

export default Button
