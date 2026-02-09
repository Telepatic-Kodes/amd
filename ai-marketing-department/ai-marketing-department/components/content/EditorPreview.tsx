"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import { cn } from "@/lib/utils";

interface EditorPreviewProps {
  content: string;
  className?: string;
}

/**
 * EditorPreview - Read-only editor instance for previewing formatted content
 *
 * Displays HTML content with:
 * - TipTap rendering (same as editing mode)
 * - Prose typography for readability
 * - No toolbar or editing controls
 * - Matches published content appearance
 */
export function EditorPreview({ content, className }: EditorPreviewProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Link.configure({
        openOnClick: true, // Allow clicking links in preview
        HTMLAttributes: {
          class: "text-indigo-400 hover:text-indigo-300 underline cursor-pointer",
        },
      }),
    ],
    content,
    editable: false, // Read-only mode
    editorProps: {
      attributes: {
        class: cn(
          // Prose styles for better readability
          "prose prose-invert max-w-none",
          // Typography
          "text-white text-base leading-relaxed",
          // Prose customization for dark theme
          "prose-headings:text-white prose-headings:font-bold",
          "prose-h1:text-4xl prose-h1:mb-6",
          "prose-h2:text-3xl prose-h2:mb-4",
          "prose-h3:text-2xl prose-h3:mb-3",
          "prose-p:text-zinc-200 prose-p:mb-4",
          "prose-strong:text-white prose-strong:font-semibold",
          "prose-em:text-zinc-300",
          "prose-code:text-indigo-400 prose-code:bg-zinc-900 prose-code:rounded prose-code:px-1",
          "prose-pre:bg-zinc-900 prose-pre:border prose-pre:border-zinc-800",
          "prose-blockquote:border-l-indigo-500 prose-blockquote:text-zinc-300 prose-blockquote:italic",
          "prose-ul:text-zinc-200 prose-ol:text-zinc-200",
          "prose-li:text-zinc-200 prose-li:mb-2"
        ),
      },
    },
  });

  if (!editor) {
    return null;
  }

  return (
    <div className={cn("p-8 bg-zinc-950/50 rounded-lg", className)}>
      <EditorContent editor={editor} />
    </div>
  );
}
