import { ReactNodeViewRenderer, mergeAttributes } from "@tiptap/react"
import { Image } from "@tiptap/extension-image"
import { ImageNode as ImageNodeComponent } from "./image-node"

export const ImageNode = Image.extend({
  name: "image",

  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        parseHTML: (element) => element.getAttribute("width") || null,
        renderHTML: (attributes) => {
          if (!attributes.width) {
            return {}
          }
          return { width: attributes.width }
        },
      },
      height: {
        default: null,
        parseHTML: (element) => element.getAttribute("height") || null,
        renderHTML: (attributes) => {
          if (!attributes.height) {
            return {}
          }
          return { height: attributes.height }
        },
      },
    }
  },

  renderHTML({ HTMLAttributes }) {
    return ["img", mergeAttributes(this.options.HTMLAttributes, HTMLAttributes)]
  },

  addNodeView() {
    return ReactNodeViewRenderer(ImageNodeComponent)
  },
})

export default ImageNode
