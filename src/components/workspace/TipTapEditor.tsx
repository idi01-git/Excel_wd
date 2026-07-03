// src/components/workspace/TipTapEditor.tsx
'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import { useEffect, useState } from 'react';

interface TipTapEditorProps {
  initialContent: any;
  onAutoSave: (content: any) => Promise<void>;
  status: string;
}

export default function TipTapEditor({ initialContent, onAutoSave, status }: TipTapEditorProps) {
  const [saveStatus, setSaveStatus] = useState<string>('Saved');
  const [isDirty, setIsDirty] = useState<boolean>(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-cyan-400 underline cursor-pointer'
        }
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg my-6 mx-auto border border-white/10'
        }
      }),
      Placeholder.configure({
        placeholder: 'Tell your story here...'
      })
    ],
    content: initialContent,
    editable: status === 'DRAFT' || status === 'REJECTED',
    onUpdate({ editor }) {
      setIsDirty(true);
      setSaveStatus('Unsaved changes...');
    }
  });

  // Debounced auto-save effect
  useEffect(() => {
    if (!isDirty || !editor) return;

    const timer = setTimeout(async () => {
      setSaveStatus('Saving...');
      try {
        const json = editor.getJSON();
        await onAutoSave(json);
        setSaveStatus('Saved');
        setIsDirty(false);
      } catch (error) {
        console.error('Auto save error:', error);
        setSaveStatus('Failed to auto-save');
      }
    }, 5000); // 5 seconds debounce

    return () => clearTimeout(timer);
  }, [isDirty, editor, onAutoSave]);

  if (!editor) return null;

  const isEditable = status === 'DRAFT' || status === 'REJECTED';

  return (
    <div className="w-full">
      {/* Editor Save Status Indicator */}
      <div className="flex justify-between items-center mb-3">
        <span className="text-sm font-medium uppercase tracking-wider text-gray-500">Draft Content</span>
        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
          saveStatus === 'Saved' 
            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
            : saveStatus === 'Saving...'
            ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20 animate-pulse'
            : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
        }`}>
          {saveStatus}
        </span>
      </div>

      {/* TipTap Formatting Bar */}
      {isEditable && (
        <div className="flex flex-wrap gap-1 p-2 bg-slate-900 border border-white/10 rounded-t-xl">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`p-1.5 rounded text-sm font-bold w-8 h-8 flex items-center justify-center hover:bg-white/5 ${editor.isActive('bold') ? 'bg-violet-600 text-white' : 'text-gray-400'}`}
            title="Bold"
          >
            B
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-1.5 rounded text-sm italic w-8 h-8 flex items-center justify-center hover:bg-white/5 ${editor.isActive('italic') ? 'bg-violet-600 text-white' : 'text-gray-400'}`}
            title="Italic"
          >
            I
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={`p-1.5 rounded text-sm line-through w-8 h-8 flex items-center justify-center hover:bg-white/5 ${editor.isActive('strike') ? 'bg-violet-600 text-white' : 'text-gray-400'}`}
            title="Strike"
          >
            S
          </button>
          <div className="w-px h-8 bg-white/10 mx-1"></div>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`p-1.5 rounded text-xs w-8 h-8 flex items-center justify-center hover:bg-white/5 ${editor.isActive('heading', { level: 2 }) ? 'bg-violet-600 text-white' : 'text-gray-400'}`}
            title="Heading 2"
          >
            H2
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={`p-1.5 rounded text-xs w-8 h-8 flex items-center justify-center hover:bg-white/5 ${editor.isActive('heading', { level: 3 }) ? 'bg-violet-600 text-white' : 'text-gray-400'}`}
            title="Heading 3"
          >
            H3
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={`p-1.5 rounded text-sm w-8 h-8 flex items-center justify-center hover:bg-white/5 ${editor.isActive('blockquote') ? 'bg-violet-600 text-white' : 'text-gray-400'}`}
            title="Blockquote"
          >
            “”
          </button>
          <div className="w-px h-8 bg-white/10 mx-1"></div>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`p-1.5 rounded text-xs w-8 h-8 flex items-center justify-center hover:bg-white/5 ${editor.isActive('bulletList') ? 'bg-violet-600 text-white' : 'text-gray-400'}`}
            title="Bullet List"
          >
            ul
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`p-1.5 rounded text-xs w-8 h-8 flex items-center justify-center hover:bg-white/5 ${editor.isActive('orderedList') ? 'bg-violet-600 text-white' : 'text-gray-400'}`}
            title="Numbered List"
          >
            ol
          </button>
          <button
            type="button"
            onClick={() => {
              const url = prompt('Enter URL:');
              if (url) editor.chain().focus().setLink({ href: url }).run();
            }}
            className={`p-1.5 rounded text-sm w-8 h-8 flex items-center justify-center hover:bg-white/5 ${editor.isActive('link') ? 'bg-violet-600 text-white' : 'text-gray-400'}`}
            title="Insert Link"
          >
            🔗
          </button>
          <button
            type="button"
            onClick={() => {
              const url = prompt('Enter image URL:');
              if (url) editor.chain().focus().setImage({ src: url }).run();
            }}
            className="p-1.5 rounded text-sm w-8 h-8 flex items-center justify-center hover:bg-white/5 text-gray-400"
            title="Insert Image"
          >
            🖼
          </button>
        </div>
      )}

      {/* Editor Body */}
      <div className={`p-6 bg-slate-900/30 border border-white/10 rounded-b-xl min-h-[350px] font-serif prose prose-invert max-w-none focus:outline-none ${!isEditable ? 'rounded-t-xl border-t border-white/10' : ''}`}>
        <EditorContent editor={editor} />
      </div>

      {/* CSS details overrides for TipTap placeholders & focuses */}
      <style jsx global>{`
        .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: rgba(255, 255, 255, 0.3);
          pointer-events: none;
          height: 0;
        }
        .ProseMirror:focus {
          outline: none;
        }
        .ProseMirror blockquote {
          border-left: 3px solid #7d52ff;
          padding-left: 1.25rem;
          font-style: italic;
          color: rgba(255,255,255,0.7);
        }
      `}</style>
    </div>
  );
}
