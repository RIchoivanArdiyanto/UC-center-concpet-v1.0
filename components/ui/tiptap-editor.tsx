"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import { Bold, Italic, List, ListOrdered, Link as LinkIcon, Image as ImageIcon, Heading2, Quote } from "lucide-react";
import { useEffect } from "react";

interface TiptapEditorProps {
  content: string;
  onChange: (html: string) => void;
}

export function TiptapEditor({ content, onChange }: TiptapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false }),
      Image.configure({ inline: true }),
    ],
    content: content || "",
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content || "");
    }
  }, [content, editor]);

  if (!editor) return <div className="h-40 bg-slate-50 border rounded-lg animate-pulse" />;

  const addImage = () => {
    const url = window.prompt("URL Gambar:");
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  const setLink = () => {
    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("URL Link:", previousUrl);
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  return (
    <div className="border border-slate-300 rounded-xl overflow-hidden bg-white focus-within:ring-2 focus-within:ring-[#0b64b4] transition-all">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-1 p-2 bg-slate-50 border-b border-slate-200">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-2 rounded hover:bg-slate-200 ${editor.isActive("bold") ? "bg-slate-300 font-bold" : ""}`}
          title="Bold"
        >
          <Bold className="w-4 h-4 text-slate-700" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-2 rounded hover:bg-slate-200 ${editor.isActive("italic") ? "bg-slate-300 font-bold" : ""}`}
          title="Italic"
        >
          <Italic className="w-4 h-4 text-slate-700" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`p-2 rounded hover:bg-slate-200 ${editor.isActive("heading", { level: 2 }) ? "bg-slate-300" : ""}`}
          title="Heading"
        >
          <Heading2 className="w-4 h-4 text-slate-700" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-2 rounded hover:bg-slate-200 ${editor.isActive("bulletList") ? "bg-slate-300" : ""}`}
          title="Bullet List"
        >
          <List className="w-4 h-4 text-slate-700" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-2 rounded hover:bg-slate-200 ${editor.isActive("orderedList") ? "bg-slate-300" : ""}`}
          title="Ordered List"
        >
          <ListOrdered className="w-4 h-4 text-slate-700" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`p-2 rounded hover:bg-slate-200 ${editor.isActive("blockquote") ? "bg-slate-300" : ""}`}
          title="Quote"
        >
          <Quote className="w-4 h-4 text-slate-700" />
        </button>
        <button
          type="button"
          onClick={setLink}
          className={`p-2 rounded hover:bg-slate-200 ${editor.isActive("link") ? "bg-slate-300" : ""}`}
          title="Link"
        >
          <LinkIcon className="w-4 h-4 text-slate-700" />
        </button>
        <button
          type="button"
          onClick={addImage}
          className="p-2 rounded hover:bg-slate-200"
          title="Tambah Gambar"
        >
          <ImageIcon className="w-4 h-4 text-slate-700" />
        </button>
      </div>

      {/* Editor Content Area */}
      <div className="p-4 min-h-[220px] prose prose-slate max-w-none focus:outline-none">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
