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
          class: "text-[var(--accent)] hover:text-orange-500 underline cursor-pointer",
        },
      }),
    ],
    content,
    editable: false, // Read-only mode
    editorProps: {
      attributes: {
        class: cn(
          // Prose styles for better readability
          "prose max-w-none",
          // Typography
          "text-[var(--text-primary)] text-base leading-relaxed",
          // Prose customization for light theme
          "prose-headings:text-[var(--text-primary)] prose-headings:font-bold",
          "prose-h1:text-4xl prose-h1:mb-6",
          "prose-h2:text-3xl prose-h2:mb-4",
          "prose-h3:text-2xl prose-h3:mb-3",
          "prose-p:text-[var(--text-secondary)] prose-p:mb-4",
          "prose-strong:text-[var(--text-primary)] prose-strong:font-semibold",
          "prose-em:text-[var(--text-secondary)]",
          "prose-code:text-[var(--accent)] prose-code:bg-[var(--surface-1)] prose-code:rounded prose-code:px-1",
          "prose-pre:bg-[var(--surface-1)] prose-pre:border prose-pre:border-[var(--border)]",
          "prose-blockquote:border-l-orange-500 prose-blockquote:text-[var(--text-secondary)] prose-blockquote:italic",
          "prose-ul:text-[var(--text-secondary)] prose-ol:text-[var(--text-secondary)]",
          "prose-li:text-[var(--text-secondary)] prose-li:mb-2"
        ),
      },
    },
  });

  if (!editor) {
    return null;
  }

  return (
    <div className={cn("p-8 bg-[var(--card-bg)] rounded-lg", className)}>
      <EditorContent editor={editor} />
    </div>
  );
}
