"use client";

import { memo } from "react";
import { Editor } from "@tiptap/react";
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code2,
  Minus,
  LinkIcon,
  Undo,
  Redo,
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Props for EditorToolbar component
 */
interface EditorToolbarProps {
  /** TipTap editor instance */
  editor: Editor | null;
  /** Callback fired when Link button is clicked */
  onLinkClick?: () => void;
  /** Additional CSS classes for the toolbar */
  className?: string;
}

/**
 * EditorToolbar - Formatting toolbar for rich text editor
 *
 * Features:
 * - Text formatting: Bold, Italic, Strikethrough, Code
 * - Headings: H1, H2, H3 (hidden on mobile)
 * - Lists: Bullet and Numbered
 * - Blocks: Blockquote, Code Block, Horizontal Rule (hidden on mobile)
 * - Link: Insert/Edit links
 * - Undo/Redo (hidden on mobile)
 * - Responsive: Essential buttons visible on mobile (<640px)
 * - Accessible: Full ARIA support, keyboard navigation
 * - Performance: Memoized to prevent unnecessary re-renders
 *
 * Mobile Optimization:
 * - Touch targets: 44x44px minimum
 * - Essential buttons only: Bold, Italic, Lists, Link
 * - Advanced features hidden on small screens
 *
 * @example
 * ```tsx
 * <EditorToolbar
 *   editor={editor}
 *   onLinkClick={() => setLinkDialogOpen(true)}
 * />
 * ```
 */

interface ToolbarButtonProps {
  onClick: () => void;
  isActive?: boolean;
  children: React.ReactNode;
  title: string;
  disabled?: boolean;
  className?: string;
}

const ToolbarButton = ({
  onClick,
  isActive = false,
  children,
  title,
  disabled = false,
  className,
}: ToolbarButtonProps) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    title={title}
    aria-label={title}
    aria-pressed={isActive}
    className={cn(
      "p-2 rounded transition-colors touch-target",
      "hover:bg-stone-200 disabled:opacity-50 disabled:cursor-not-allowed",
      isActive ? "bg-stone-200 text-orange-400" : "text-stone-400",
      className
    )}
  >
    {children}
  </button>
);

const Divider = ({ className }: { className?: string }) => (
  <div className={cn("w-px h-6 bg-stone-200 my-auto mx-1", className)} />
);

const EditorToolbarComponent = ({
  editor,
  onLinkClick,
  className,
}: EditorToolbarProps) => {
  if (!editor) {
    return null;
  }

  return (
    <div
      role="toolbar"
      aria-label="Text formatting toolbar"
      className={cn(
        "flex flex-wrap gap-1 p-2 border-b border-stone-200 bg-white",
        className
      )}
    >
      {/* Text Formatting - Always visible on mobile */}
      <div className="flex gap-1">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive("bold")}
          title="Bold (Ctrl+B)"
        >
          <Bold className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive("italic")}
          title="Italic (Ctrl+I)"
        >
          <Italic className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          isActive={editor.isActive("strike")}
          title="Strikethrough"
          className="hidden sm:flex"
        >
          <Strikethrough className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleCode().run()}
          isActive={editor.isActive("code")}
          title="Inline Code (Ctrl+E)"
          className="hidden sm:flex"
        >
          <Code className="h-4 w-4" />
        </ToolbarButton>
      </div>

      <Divider />

      {/* Headings - Hidden on mobile */}
      <div className="hidden sm:flex gap-1">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          isActive={editor.isActive("heading", { level: 1 })}
          title="Heading 1"
        >
          <Heading1 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          isActive={editor.isActive("heading", { level: 2 })}
          title="Heading 2"
        >
          <Heading2 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          isActive={editor.isActive("heading", { level: 3 })}
          title="Heading 3"
        >
          <Heading3 className="h-4 w-4" />
        </ToolbarButton>
      </div>

      <Divider className="hidden sm:block" />

      {/* Lists - Always visible on mobile */}
      <div className="flex gap-1">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive("bulletList")}
          title="Bullet List"
        >
          <List className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive("orderedList")}
          title="Numbered List"
        >
          <ListOrdered className="h-4 w-4" />
        </ToolbarButton>
      </div>

      <Divider className="hidden sm:block" />

      {/* Blocks - Hidden on mobile */}
      <div className="hidden sm:flex gap-1">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          isActive={editor.isActive("blockquote")}
          title="Quote"
        >
          <Quote className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          isActive={editor.isActive("codeBlock")}
          title="Code Block"
        >
          <Code2 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          title="Horizontal Rule"
        >
          <Minus className="h-4 w-4" />
        </ToolbarButton>
      </div>

      <Divider className="hidden sm:block" />

      {/* Link - Always visible on mobile */}
      <ToolbarButton
        onClick={onLinkClick || (() => {})}
        isActive={editor.isActive("link")}
        title="Add Link"
      >
        <LinkIcon className="h-4 w-4" />
      </ToolbarButton>

      <Divider className="hidden sm:block" />

      {/* Undo/Redo - Hidden on mobile */}
      <div className="hidden sm:flex gap-1">
        <ToolbarButton
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          title="Undo (Ctrl+Z)"
        >
          <Undo className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          title="Redo (Ctrl+Y)"
        >
          <Redo className="h-4 w-4" />
        </ToolbarButton>
      </div>
    </div>
  );
};

// Memoized export for performance optimization
export const EditorToolbar = memo(EditorToolbarComponent);
