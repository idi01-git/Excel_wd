"use client"

import { useEffect, useRef, useState } from "react"
import { EditorContent, EditorContext, useEditor, Editor } from "@tiptap/react"
import { TextSelection } from "@tiptap/pm/state"

// --- Tiptap Core Extensions ---
import { StarterKit } from "@tiptap/starter-kit"
import { TaskItem, TaskList } from "@tiptap/extension-list"
import { TextAlign } from "@tiptap/extension-text-align"
import { Typography } from "@tiptap/extension-typography"
import { Highlight } from "@tiptap/extension-highlight"
import { Subscript } from "@tiptap/extension-subscript"
import { Superscript } from "@tiptap/extension-superscript"
import { Selection } from "@tiptap/extensions"
import { FontFamily } from "@tiptap/extension-font-family"
import { Color } from "@tiptap/extension-color"
import { TextStyle } from "@tiptap/extension-text-style"
import { FontSize } from "@/components/tiptap-extension/font-size"
import { FontWeight } from "@/components/tiptap-extension/font-weight"
import { ImageNode } from "@/components/tiptap-node/image-node/image-node-extension"

// --- UI Primitives ---
import { Button } from "@/components/tiptap-ui-primitive/button"
import { Spacer } from "@/components/tiptap-ui-primitive/spacer"
import {
  Toolbar,
  ToolbarGroup,
  ToolbarSeparator,
} from "@/components/tiptap-ui-primitive/toolbar"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuGroup,
} from "@/components/tiptap-ui-primitive/dropdown-menu"

// --- Tiptap Node ---
import { ImageUploadNode } from "@/components/tiptap-node/image-upload-node/image-upload-node-extension"
import { HorizontalRule } from "@/components/tiptap-node/horizontal-rule-node/horizontal-rule-node-extension"
import "@/components/tiptap-node/blockquote-node/blockquote-node.scss"
import "@/components/tiptap-node/code-block-node/code-block-node.scss"
import "@/components/tiptap-node/horizontal-rule-node/horizontal-rule-node.scss"
import "@/components/tiptap-node/list-node/list-node.scss"
import "@/components/tiptap-node/image-node/image-node.scss"
import "@/components/tiptap-node/heading-node/heading-node.scss"
import "@/components/tiptap-node/paragraph-node/paragraph-node.scss"

// --- Tiptap UI ---
import { HeadingDropdownMenu } from "@/components/tiptap-ui/heading-dropdown-menu"
import { ImageUploadButton } from "@/components/tiptap-ui/image-upload-button"
import { ListDropdownMenu } from "@/components/tiptap-ui/list-dropdown-menu"
import { BlockquoteButton } from "@/components/tiptap-ui/blockquote-button"
import { CodeBlockButton } from "@/components/tiptap-ui/code-block-button"
import {
  ColorHighlightPopover,
  ColorHighlightPopoverContent,
  ColorHighlightPopoverButton,
} from "@/components/tiptap-ui/color-highlight-popover"
import {
  LinkPopover,
  LinkContent,
  LinkButton,
} from "@/components/tiptap-ui/link-popover"
import { MarkButton } from "@/components/tiptap-ui/mark-button"
import { TextAlignButton } from "@/components/tiptap-ui/text-align-button"
import { UndoRedoButton } from "@/components/tiptap-ui/undo-redo-button"

// --- Icons ---
import { ArrowLeftIcon } from "@/components/tiptap-icons/arrow-left-icon"
import { HighlighterIcon } from "@/components/tiptap-icons/highlighter-icon"
import { LinkIcon } from "@/components/tiptap-icons/link-icon"
import { ChevronDownIcon } from "@/components/tiptap-icons/chevron-down-icon"
import { 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  AlignJustify,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Heading,
  List,
  ListOrdered,
  ListTodo,
  Ban,
  Bold
} from "lucide-react"

// --- UI Primitives ---
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/tiptap-ui-primitive/popover"

// --- Hooks ---
import { useIsBreakpoint } from "@/hooks/use-is-breakpoint"
import { useWindowSize } from "@/hooks/use-window-size"
import { useCursorVisibility } from "@/hooks/use-cursor-visibility"

// --- Components ---
import { ThemeToggle } from "@/components/tiptap-templates/simple/theme-toggle"

// --- Lib ---
import { handleImageUpload, MAX_FILE_SIZE } from "@/lib/tiptap-utils"

// --- Styles ---
import "@/components/tiptap-templates/simple/simple-editor.scss"

import content from "@/components/tiptap-templates/simple/data/content.json"

function applyFontWeight(editor: Editor, fontWeight: number) {
  const weight = fontWeight.toString()
  editor.chain().focus().setFontWeight(weight).run()
}

const CustomHighlight = Highlight.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      color: {
        default: null,
        parseHTML: element => element.style.backgroundColor || element.getAttribute('data-color'),
        renderHTML: attributes => {
          if (!attributes.color) {
            return {}
          }
          return {
            style: `--highlight-color: ${attributes.color}; background-color: ${attributes.color};`,
            'data-color': attributes.color,
          }
        },
      }
    }
  }
})

const MainToolbarContent = ({
  editor,
  onHighlighterClick,
  onLinkClick,
  isMobile,
}: {
  editor: Editor | null
  onHighlighterClick: () => void
  onLinkClick: () => void
  isMobile: boolean
}) => {
  const [headingOpen, setHeadingOpen] = useState(false)
  const [boldOpen, setBoldOpen] = useState(false)
  const [boldWeight, setBoldWeight] = useState<number>(700)

  const [listOpen, setListOpen] = useState(false)
  const [lastListType, setLastListType] = useState<'bulletList' | 'orderedList' | 'taskList'>('bulletList')

  const [alignOpen, setAlignOpen] = useState(false)
  const [lastAlign, setLastAlign] = useState<'left' | 'center' | 'right' | 'justify'>('center')

  const [colorOpen, setColorOpen] = useState(false)
  const [lastColor, setLastColor] = useState<string>('var(--tt-color-highlight-yellow)')
  const [isHighContrast, setIsHighContrast] = useState<boolean>(false)

  useEffect(() => {
    if (!editor) return

    const syncFontWeight = () => {
      const fontWeight = Number(editor.getAttributes('textStyle').fontWeight)
      if (!Number.isNaN(fontWeight) && fontWeight >= 300 && fontWeight <= 900) {
        setBoldWeight(fontWeight)
      }
    }

    syncFontWeight()
    editor.on('selectionUpdate', syncFontWeight)
    editor.on('transaction', syncFontWeight)

    return () => {
      editor.off('selectionUpdate', syncFontWeight)
      editor.off('transaction', syncFontWeight)
    }
  }, [editor])

  if (!editor) return null;

  const getHeadingLabel = () => {
    if (editor.isActive('heading', { level: 1 })) return 'Title'
    if (editor.isActive('heading', { level: 2 })) return 'Big'
    if (editor.isActive('heading', { level: 3 })) return 'Medium'
    if (editor.isActive('heading', { level: 4 })) return 'Extra Small'
    return 'Small'
  }

  // List Calculations
  const isBulletActive = editor.isActive('bulletList')
  const isOrderedActive = editor.isActive('orderedList')
  const isTaskActive = editor.isActive('taskList')
  const isAnyListActive = isBulletActive || isOrderedActive || isTaskActive
  const ListIcon = isOrderedActive ? ListOrdered
    : isTaskActive ? ListTodo
    : List

  const handleListLeftClick = () => {
    if (isAnyListActive) {
      if (isBulletActive) editor.chain().focus().toggleBulletList().run()
      if (isOrderedActive) editor.chain().focus().toggleOrderedList().run()
      if (isTaskActive) editor.chain().focus().toggleTaskList().run()
    } else {
      if (lastListType === 'bulletList') editor.chain().focus().toggleBulletList().run()
      if (lastListType === 'orderedList') editor.chain().focus().toggleOrderedList().run()
      if (lastListType === 'taskList') editor.chain().focus().toggleTaskList().run()
    }
  }

  // Alignment Calculations
  const isCenterAligned = editor.isActive({ textAlign: 'center' })
  const isRightAligned = editor.isActive({ textAlign: 'right' })
  const isJustifyAligned = editor.isActive({ textAlign: 'justify' })
  const isLeftAligned = editor.isActive({ textAlign: 'left' })
  const isAligned = isCenterAligned || isRightAligned || isJustifyAligned
  const AlignIcon = isCenterAligned ? AlignCenter
    : isRightAligned ? AlignRight
    : isJustifyAligned ? AlignJustify
    : AlignLeft

  const handleAlignLeftClick = () => {
    if (isAligned) {
      editor.chain().focus().unsetTextAlign().run()
    } else {
      editor.chain().focus().setTextAlign(lastAlign).run()
    }
  }

  // Highlight/Color Calculations
  const isHighlighted = editor.isActive('highlight')
  const handleColorLeftClick = () => {
    if (isHighlighted) {
      editor.chain().focus().unsetHighlight().run()
    } else {
      editor.chain().focus().setHighlight({ color: lastColor } as any).run()
    }
  }

  return (
    <>
      <Spacer />

      <ToolbarGroup>
        <UndoRedoButton action="undo" />
        <UndoRedoButton action="redo" />
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        {/* Font Family Dropdown */}
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" tooltip="Font Family" aria-label="Font Family" tabIndex={-1} className="w-[85px] justify-between text-[11px] px-1.5">
              <span className="truncate capitalize">{editor.getAttributes('textStyle').fontFamily || 'Sans'}</span>
              <ChevronDownIcon className="w-3 h-3 ml-0.5 opacity-50 shrink-0" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="min-w-[140px]">
            <DropdownMenuGroup>
              {/* English Fonts */}
              <DropdownMenuItem asChild>
                <Button variant="ghost" className="w-full justify-start text-left text-xs py-1.5 px-3" onClick={() => editor.chain().focus().unsetFontFamily().run()}>
                  Inter (Professional)
                </Button>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Button variant="ghost" className="w-full justify-start text-left text-xs py-1.5 px-3" style={{ fontFamily: 'Montserrat, sans-serif' }} onClick={() => editor.chain().focus().setFontFamily('Montserrat, sans-serif').run()}>
                  Montserrat (Modern)
                </Button>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Button variant="ghost" className="w-full justify-start text-left text-xs py-1.5 px-3" style={{ fontFamily: 'Playfair Display, serif' }} onClick={() => editor.chain().focus().setFontFamily('Playfair Display, serif').run()}>
                  Playfair (Elegant)
                </Button>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Button variant="ghost" className="w-full justify-start text-left text-xs py-1.5 px-3" style={{ fontFamily: 'Georgia, serif' }} onClick={() => editor.chain().focus().setFontFamily('Georgia, serif').run()}>
                  Georgia (Classic)
                </Button>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Button variant="ghost" className="w-full justify-start text-left text-xs py-1.5 px-3" style={{ fontFamily: 'Dancing Script, cursive' }} onClick={() => editor.chain().focus().setFontFamily('Dancing Script, cursive').run()}>
                  Dancing Script (Calligraphy)
                </Button>
              </DropdownMenuItem>
              
              {/* Divider */}
              <div className="h-px bg-gray-200 dark:bg-white/10 my-1 mx-2" />

              {/* Hindi Fonts */}
              <DropdownMenuItem asChild>
                <Button variant="ghost" className="w-full justify-start text-left text-xs py-1.5 px-3" style={{ fontFamily: 'Noto Sans Devanagari, sans-serif' }} onClick={() => editor.chain().focus().setFontFamily('Noto Sans Devanagari, sans-serif').run()}>
                  देवनागरी (Professional)
                </Button>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Button variant="ghost" className="w-full justify-start text-left text-xs py-1.5 px-3" style={{ fontFamily: 'Tiro Devanagari Hindi, serif' }} onClick={() => editor.chain().focus().setFontFamily('Tiro Devanagari Hindi, serif').run()}>
                  देवनागरी (Classic)
                </Button>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Button variant="ghost" className="w-full justify-start text-left text-xs py-1.5 px-3" style={{ fontFamily: 'Yatra One, cursive' }} onClick={() => editor.chain().focus().setFontFamily('Yatra One, cursive').run()}>
                  देवनागरी (Display)
                </Button>
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        {/* Heading/Size Dropdown */}
        <DropdownMenu open={headingOpen} onOpenChange={setHeadingOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              tooltip="Text Size"
              aria-label="Text Size"
              className="w-[80px] justify-between text-[11px] px-1.5"
            >
              <span className="truncate">{getHeadingLabel()}</span>
              <ChevronDownIcon className="w-3 h-3 ml-0.5 opacity-50 shrink-0" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="min-w-[140px]">
            <DropdownMenuGroup>
              <DropdownMenuItem key="title" asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-left text-xs py-1.5 px-3 font-bold"
                  data-active-state={editor.isActive('heading', { level: 1 }) ? "on" : "off"}
                  onClick={() => {
                    editor.chain().focus().toggleHeading({ level: 1 }).run()
                    setHeadingOpen(false)
                  }}
                >
                  Title
                </Button>
              </DropdownMenuItem>
              <DropdownMenuItem key="big" asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-left text-xs py-1.5 px-3 font-semibold"
                  data-active-state={editor.isActive('heading', { level: 2 }) ? "on" : "off"}
                  onClick={() => {
                    editor.chain().focus().toggleHeading({ level: 2 }).run()
                    setHeadingOpen(false)
                  }}
                >
                  Big
                </Button>
              </DropdownMenuItem>
              <DropdownMenuItem key="medium" asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-left text-xs py-1.5 px-3 font-medium"
                  data-active-state={editor.isActive('heading', { level: 3 }) ? "on" : "off"}
                  onClick={() => {
                    editor.chain().focus().toggleHeading({ level: 3 }).run()
                    setHeadingOpen(false)
                  }}
                >
                  Medium
                </Button>
              </DropdownMenuItem>
              <DropdownMenuItem key="small" asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-left text-xs py-1.5 px-3"
                  data-active-state={(!editor.isActive('heading') || editor.isActive('paragraph')) ? "on" : "off"}
                  onClick={() => {
                    editor.chain().focus().setParagraph().run()
                    setHeadingOpen(false)
                  }}
                >
                  Small
                </Button>
              </DropdownMenuItem>
              <DropdownMenuItem key="extrasmall" asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-left text-[11px] py-1.5 px-3 text-gray-500"
                  data-active-state={editor.isActive('heading', { level: 4 }) ? "on" : "off"}
                  onClick={() => {
                    editor.chain().focus().toggleHeading({ level: 4 }).run()
                    setHeadingOpen(false)
                  }}
                >
                  Extra Small
                </Button>
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* List Dropdown (Click to toggle bullet list, Right-click to choose type) */}
        <DropdownMenu open={listOpen} onOpenChange={setListOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              tooltip="List (Right-click to select type)"
              aria-label="Lists"
              data-active-state={isAnyListActive ? "on" : "off"}
              onPointerDown={(e) => {
                if (e.button === 0) e.preventDefault()
              }}
              onClick={handleListLeftClick}
              onContextMenu={(e) => {
                e.preventDefault()
                setListOpen(true)
              }}
            >
              <ListIcon className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="min-w-[140px]">
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-left text-xs py-1.5 px-3"
                  data-active-state={isBulletActive ? "on" : "off"}
                  onClick={() => {
                    setLastListType('bulletList')
                    editor.chain().focus().toggleBulletList().run()
                    setListOpen(false)
                  }}
                >
                  <List className="w-4 h-4 mr-2" /> Bullet List
                </Button>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-left text-xs py-1.5 px-3"
                  data-active-state={isOrderedActive ? "on" : "off"}
                  onClick={() => {
                    setLastListType('orderedList')
                    editor.chain().focus().toggleOrderedList().run()
                    setListOpen(false)
                  }}
                >
                  <ListOrdered className="w-4 h-4 mr-2" /> Ordered List
                </Button>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-left text-xs py-1.5 px-3"
                  data-active-state={isTaskActive ? "on" : "off"}
                  onClick={() => {
                    setLastListType('taskList')
                    editor.chain().focus().toggleTaskList().run()
                    setListOpen(false)
                  }}
                >
                  <ListTodo className="w-4 h-4 mr-2" /> Task List
                </Button>
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        <BlockquoteButton />
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        {/* Bold Button (Left-click toggles bold, Right-click for custom weight) */}
        <Popover open={boldOpen} onOpenChange={setBoldOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              tooltip="Bold (Right-click for thickness)"
              aria-label="Bold text"
              data-active-state={editor.isActive('bold') ? "on" : "off"}
              onPointerDown={(e) => {
                // Prevent popover from triggering on left-click — only right-click opens it
                if (e.button === 0) e.preventDefault()
              }}
              onClick={() => {
                editor.chain().focus().toggleBold().run()
              }}
              onContextMenu={(e) => {
                e.preventDefault()
                setBoldOpen(true)
              }}
            >
              <Bold className="w-4 h-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="p-3 bg-white dark:bg-slate-950 border border-gray-200 dark:border-white/10 rounded-xl shadow-lg z-50 min-w-[200px]">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Font Weight</span>
                <span className="text-[10px] text-gray-500 font-mono">{boldWeight}</span>
              </div>
              <input 
                type="range" 
                min="300" 
                max="900" 
                step="1"
                value={boldWeight}
                onInput={(e) => {
                  const val = Number(e.currentTarget.value)
                  setBoldWeight(val)
                  applyFontWeight(editor, val)
                }}
                style={{
                  background: `linear-gradient(90deg, currentColor ${((boldWeight - 300) / 600) * 100}%, rgba(148, 163, 184, 0.35) ${((boldWeight - 300) / 600) * 100}%)`,
                }}
                className="editor-weight-slider w-full h-2 rounded-full appearance-none cursor-pointer focus:outline-none transition-all duration-150 ease-out text-black dark:text-white"
              />
              <div className="text-[10px] text-gray-500">Weight: {boldWeight}</div>
            </div>
          </PopoverContent>
        </Popover>
        <MarkButton type="italic" />
        <MarkButton type="strike" />
        <MarkButton type="underline" />
        
        {/* Highlight/Color Dropdown (Click to toggle highlight, Right-click to choose color) */}
        {!isMobile ? (
          <Popover open={colorOpen} onOpenChange={setColorOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                tooltip="Highlight (Right-click to select color & thickness)"
                aria-label="Highlight color"
                data-active-state={isHighlighted ? "on" : "off"}
                onPointerDown={(e) => {
                  if (e.button === 0) e.preventDefault()
                }}
                onClick={handleColorLeftClick}
                onContextMenu={(e) => {
                  e.preventDefault()
                  setColorOpen(true)
                }}
              >
                <HighlighterIcon className="tiptap-button-icon" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="p-3 bg-white dark:bg-slate-950 border border-gray-200 dark:border-white/10 rounded-xl shadow-lg z-50 min-w-[220px]">
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Highlight Color</span>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="accent-black dark:accent-white cursor-pointer"
                      checked={isHighContrast} 
                      onChange={(e) => setIsHighContrast(e.target.checked)} 
                    />
                    <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">High Contrast</span>
                  </label>
                </div>
                
                <div className="flex items-center gap-2">
                  {[
                    { name: 'yellow', value: isHighContrast ? '#ffff00' : 'var(--tt-color-highlight-yellow)' },
                    { name: 'green', value: isHighContrast ? '#00ff00' : 'var(--tt-color-highlight-green)' },
                    { name: 'blue', value: isHighContrast ? '#0000ff' : 'var(--tt-color-highlight-blue)' },
                    { name: 'purple', value: isHighContrast ? '#ff00ff' : 'var(--tt-color-highlight-purple)' },
                    { name: 'red', value: isHighContrast ? '#ff0000' : 'var(--tt-color-highlight-red)' },
                  ].map((color) => (
                    <button
                      key={color.value}
                      className="w-6 h-6 rounded-full border border-black/10 dark:border-white/10 transition-transform hover:scale-110 active:scale-95 cursor-pointer"
                      style={{ backgroundColor: color.value }}
                      onClick={() => {
                        setLastColor(color.value)
                        editor.chain().focus().setHighlight({ color: color.value } as any).run()
                        setColorOpen(false)
                      }}
                      title={color.name}
                    />
                  ))}
                  <div className="w-px h-6 bg-gray-200 dark:bg-white/10 mx-1" />
                  <Button
                    variant="ghost"
                    className="p-1 h-6 w-6 flex items-center justify-center"
                    onClick={() => {
                      editor.chain().focus().unsetHighlight().run()
                      setColorOpen(false)
                    }}
                    title="Remove Highlight"
                  >
                    <Ban className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        ) : (
          <ColorHighlightPopoverButton onClick={onHighlighterClick} />
        )}
        {!isMobile ? <LinkPopover /> : <LinkButton onClick={onLinkClick} />}
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <Button
          variant="ghost"
          tooltip="Align Left"
          aria-label="Align Left"
          data-active-state={isLeftAligned ? "on" : "off"}
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
        >
          <AlignLeft className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          tooltip="Align Center"
          aria-label="Align Center"
          data-active-state={isCenterAligned ? "on" : "off"}
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
        >
          <AlignCenter className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          tooltip="Align Right"
          aria-label="Align Right"
          data-active-state={isRightAligned ? "on" : "off"}
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
        >
          <AlignRight className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          tooltip="Justify"
          aria-label="Justify"
          data-active-state={isJustifyAligned ? "on" : "off"}
          onClick={() => editor.chain().focus().setTextAlign('justify').run()}
        >
          <AlignJustify className="w-4 h-4" />
        </Button>
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <ImageUploadButton />
      </ToolbarGroup>

      <Spacer />
    </>
  )
}

const MobileToolbarContent = ({
  type,
  onBack,
}: {
  type: "highlighter" | "link"
  onBack: () => void
}) => (
  <>
    <ToolbarGroup>
      <Button variant="ghost" onClick={onBack}>
        <ArrowLeftIcon className="tiptap-button-icon" />
        {type === "highlighter" ? (
          <HighlighterIcon className="tiptap-button-icon" />
        ) : (
          <LinkIcon className="tiptap-button-icon" />
        )}
      </Button>
    </ToolbarGroup>

    <ToolbarSeparator />

    {type === "highlighter" ? (
      <ColorHighlightPopoverContent />
    ) : (
      <LinkContent />
    )}
  </>
)

export interface SimpleEditorProps {
  initialContent?: any
  onAutoSave?: (content: any) => Promise<void>
  onSaveStatusChange?: (status: string) => void
  status?: string
  editorStyle?: 'broadsheet' | 'minimal' | 'scholar'
}

export function SimpleEditor({ 
  initialContent, 
  onAutoSave, 
  onSaveStatusChange, 
  status = 'DRAFT',
  editorStyle = 'scholar'
}: SimpleEditorProps) {
  const isMobile = useIsBreakpoint()
  const { height } = useWindowSize()
  const [mobileView, setMobileView] = useState<"main" | "highlighter" | "link">(
    "main"
  )
  const toolbarRef = useRef<HTMLDivElement>(null)
  const [saveStatus, setSaveStatus] = useState<string>("Saved")
  const [isDirty, setIsDirty] = useState<boolean>(false)

  const isEditable = status === 'DRAFT' || status === 'REJECTED'

  const editor = useEditor({
    editable: isEditable,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        autocomplete: "off",
        autocorrect: "off",
        autocapitalize: "off",
        "aria-label": "Main content area, start typing to enter text.",
        class: "simple-editor",
      },
    },
    extensions: [
      StarterKit.configure({
        horizontalRule: false,
        link: {
          openOnClick: false,
          enableClickSelection: true,
        },
      }),
      HorizontalRule,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      TaskList,
      TaskItem.configure({ nested: true }),
      CustomHighlight.configure({ multicolor: true }),
      ImageNode.configure({ inline: false, allowBase64: true, HTMLAttributes: { class: 'cursor-move' } }),
      Typography,
      Superscript,
      Subscript,
      Selection,
      ImageUploadNode.configure({
        accept: "image/*",
        maxSize: 2 * 1024 * 1024, // 2MB limit to prevent Base64 from exceeding API payload size limits
        limit: 3,
        upload: handleImageUpload,
      }),
      TextStyle,
      FontFamily,
      Color,
      FontSize,
      FontWeight,
    ],
    content: initialContent || content,
    onUpdate({ editor }) {
      setIsDirty(true)
      setSaveStatus("Unsaved changes...")
      if (onSaveStatusChange) onSaveStatusChange("Unsaved changes...")
    }
  })

  // Debounced auto-save effect
  useEffect(() => {
    if (!isDirty || !editor || !onAutoSave) return

    const timer = setTimeout(async () => {
      setSaveStatus("Saving...")
      if (onSaveStatusChange) onSaveStatusChange("Saving...")
      try {
        const json = editor.getJSON()
        await onAutoSave(json)
        setSaveStatus("Saved")
        if (onSaveStatusChange) onSaveStatusChange("Saved")
        setIsDirty(false)
      } catch (error) {
        console.error("Auto save error:", error)
        setSaveStatus("Failed to save")
        if (onSaveStatusChange) onSaveStatusChange("Failed to save")
      }
    }, 5000)

    return () => clearTimeout(timer)
  }, [isDirty, editor, onAutoSave, onSaveStatusChange])

  const rect = useCursorVisibility({
    editor,
    overlayHeight: toolbarRef.current?.getBoundingClientRect().height ?? 0,
  })

  useEffect(() => {
    if (!isMobile && mobileView !== "main") {
      setMobileView("main")
    }
  }, [isMobile, mobileView])

  return (
    <div className={`simple-editor-wrapper theme-${editorStyle}`}>
      <EditorContext.Provider value={{ editor }}>
        {isEditable && (
          <Toolbar
            ref={toolbarRef}
            style={{
              ...(isMobile
                ? {
                    bottom: `calc(100% - ${height - rect.y}px)`,
                  }
                : {}),
            }}
          >
            {mobileView === "main" ? (
              <MainToolbarContent
                editor={editor}
                onHighlighterClick={() => setMobileView("highlighter")}
                onLinkClick={() => setMobileView("link")}
                isMobile={isMobile}
              />
            ) : (
              <MobileToolbarContent
                type={mobileView === "highlighter" ? "highlighter" : "link"}
                onBack={() => setMobileView("main")}
              />
            )}
          </Toolbar>
        )}

        <EditorContent
          editor={editor}
          role="presentation"
          className="simple-editor-content"
        />
      </EditorContext.Provider>
    </div>
  )
}


