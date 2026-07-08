"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import type { NodeViewProps } from "@tiptap/react"
import { NodeViewWrapper } from "@tiptap/react"
import { TrashIcon } from "@/components/tiptap-icons/trash-icon"
import { focusNextNode } from "@/lib/tiptap-utils"
import "./image-node.scss"

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max)

const getResizeAttrs = (props: NodeViewProps, width: number, height: number) => {
  const { node } = props
  return {
    ...node.attrs,
    width: `${width}`,
    height: `${height}`,
  }
}

export const ImageNode: React.FC<NodeViewProps> = (props) => {
  const { node, editor, extension } = props
  const { src, alt, title, width, height } = node.attrs as {
    src: string
    alt?: string
    title?: string
    width?: string | null
    height?: string | null
  }

  const wrapperRef = useRef<HTMLDivElement | null>(null)
  const imgRef = useRef<HTMLImageElement | null>(null)
  const [dimensions, setDimensions] = useState({
    width: typeof width === "string" ? parseInt(width, 10) : null,
    height: typeof height === "string" ? parseInt(height, 10) : null,
  })

  const displayWidth = dimensions.width ?? undefined
  const displayHeight = dimensions.height ?? undefined

  useEffect(() => {
    if (!imgRef.current) return
    if (!displayWidth && !displayHeight) return

    const naturalWidth = imgRef.current.naturalWidth
    const naturalHeight = imgRef.current.naturalHeight
    const widthValue = displayWidth ?? Math.round((displayHeight! * naturalWidth) / naturalHeight)
    const heightValue = displayHeight ?? Math.round((displayWidth! * naturalHeight) / naturalWidth)

    setDimensions({ width: widthValue, height: heightValue })
  }, [displayWidth, displayHeight])

  const handleRemove = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    event.stopPropagation()
    props.deleteNode()
    focusNextNode(editor)
  }

  const handleResize = (event: React.PointerEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    event.currentTarget.setPointerCapture(event.pointerId)

    const startX = event.clientX
    const startY = event.clientY
    const startWidth = imgRef.current?.clientWidth ?? 0
    const startHeight = imgRef.current?.clientHeight ?? 0

    const resizerElement = event.currentTarget

    const onPointerMove = (moveEvent: PointerEvent) => {
      if (!imgRef.current) return
      const deltaX = moveEvent.clientX - startX
      const deltaY = moveEvent.clientY - startY
      const nextWidth = clamp(startWidth + deltaX, 64, 2000)
      const nextHeight = clamp(startHeight + deltaY, 64, 2000)

      setDimensions({ width: nextWidth, height: nextHeight })
    }

    const onPointerUp = () => {
      if (imgRef.current) {
        const nextWidth = imgRef.current.clientWidth
        const nextHeight = imgRef.current.clientHeight

        editor.commands.command(({ tr }) => {
          const pos = props.getPos()
          if (typeof pos === 'number') {
            tr.setNodeMarkup(pos, undefined, getResizeAttrs(props, nextWidth, nextHeight))
          }
          return true
        })
      }

      resizerElement.releasePointerCapture(event.pointerId)
      window.removeEventListener("pointermove", onPointerMove)
      window.removeEventListener("pointerup", onPointerUp)
      focusNextNode(editor)
    }

    window.addEventListener("pointermove", onPointerMove)
    window.addEventListener("pointerup", onPointerUp)
  }

  const handleImageLoad = () => {
    if (imgRef.current && !displayWidth && !displayHeight) {
      const naturalWidth = imgRef.current.naturalWidth
      const naturalHeight = imgRef.current.naturalHeight
      setDimensions({ width: naturalWidth, height: naturalHeight })
    }
  }

  const handleDeleteKey = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Delete" || event.key === "Backspace") {
      event.preventDefault()
      event.stopPropagation()
      props.deleteNode()
      focusNextNode(editor)
    }
  }

  const wrapperStyles = {
    width: displayWidth ? `${displayWidth}px` : undefined,
    height: displayHeight ? `${displayHeight}px` : undefined,
  }

  return (
    <NodeViewWrapper
      as="div"
      className="tiptap-image-node"
      ref={wrapperRef}
      tabIndex={0}
      onKeyDown={handleDeleteKey}
    >
      <div className="tiptap-image-node__frame">
        <img
          ref={imgRef}
          src={src}
          alt={alt || title || "Image"}
          title={title}
          style={wrapperStyles}
          onLoad={handleImageLoad}
          className="tiptap-image-node__image"
          draggable={false}
        />
        <button
          type="button"
          className="tiptap-image-node__delete"
          onClick={handleRemove}
          aria-label="Delete image"
        >
          <TrashIcon className="tiptap-image-node__delete-icon" />
        </button>
        <div
          className="tiptap-image-node__resizer"
          role="button"
          tabIndex={0}
          aria-label="Resize image"
          onPointerDown={handleResize}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault()
              event.stopPropagation()
            }
          }}
        />
      </div>
    </NodeViewWrapper>
  )
}
