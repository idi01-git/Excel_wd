import { Extension } from "@tiptap/core"

export interface NodeBackgroundOptions {
  types: string[]
  defaultColor?: string
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    nodeBackground: {
      setNodeBackgroundColor: (color: string) => ReturnType
      unsetNodeBackgroundColor: () => ReturnType
      toggleNodeBackgroundColor: (color: string) => ReturnType
    }
  }
}

export const NodeBackground = Extension.create<NodeBackgroundOptions>({
  name: "nodeBackground",

  addOptions() {
    return {
      types: ["paragraph", "heading", "blockquote", "codeBlock"],
      defaultColor: undefined,
    }
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          backgroundColor: {
            default: this.options.defaultColor,
            parseHTML: (element) => element.style.backgroundColor || null,
            renderHTML: (attributes) => {
              if (!attributes.backgroundColor) {
                return {}
              }

              return {
                style: `background-color: ${attributes.backgroundColor}`,
              }
            },
          },
        },
      },
    ]
  },

  addCommands() {
    return {
      setNodeBackgroundColor:
        (color: string) =>
        ({ commands }) => {
          return this.options.types.every((type) =>
            commands.updateAttributes(type, { backgroundColor: color })
          )
        },
      unsetNodeBackgroundColor:
        () =>
        ({ commands }) => {
          return this.options.types.every((type) =>
            commands.resetAttributes(type, "backgroundColor")
          )
        },
      toggleNodeBackgroundColor:
        (color: string) =>
        ({ commands, editor }) => {
          const isCurrentColor = this.options.types.some((type) => {
            const attrs = editor.getAttributes(type)
            return attrs.backgroundColor === color
          })

          if (isCurrentColor) {
            return this.options.types.every((type) =>
              commands.resetAttributes(type, "backgroundColor")
            )
          }

          return this.options.types.every((type) =>
            commands.updateAttributes(type, { backgroundColor: color })
          )
        },
    }
  },
})

export default NodeBackground
