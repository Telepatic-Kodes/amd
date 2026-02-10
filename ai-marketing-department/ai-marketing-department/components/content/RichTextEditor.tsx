"use client";

import { useState, useCallback, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import CharacterCount from "@tiptap/extension-character-count";
import { Bold, Italic, Strikethrough, Code, LinkIcon, Copy, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { EditorToolbar } from "./EditorToolbar";
import { LinkDialog } from "./LinkDialog";
import { EditorStatusBar } from "./EditorStatusBar";
import { copyHtmlToClipboard, downloadAsFile, cleanPastedContent } from "@/lib/editor-utils";
import { useToast } from "@/components/ui/Toast";

/**
 * Props for RichTextEditor component
 */
interface RichTextEditorProps {
  /** Initial HTML content to display in the editor */
  content: string;
  /** Callback fired when content changes (debounced 150ms) */
  onChange: (html: string) => void;
  /** Placeholder text shown when editor is empty */
  placeholder?: string;
  /** Minimum height of the editor area (default: "300px") */
  minHeight?: string;
  /** Additional CSS classes for the editor container */
  className?: string;
  /** Title used for filename when downloading (default: "content") */
  title?: string;
  /** Whether to show export buttons (Copy HTML, Download) */
  showExport?: boolean;
}

/**
 * RichTextEditor - WYSIWYG editor powered by TipTap
 *
 * Features:
 * - Text formatting: Bold, Italic, Strikethrough, Code
 * - Headings: H1, H2, H3
 * - Lists: Bullet and Numbered
 * - Links: Insert, Edit, Remove
 * - Blocks: Blockquote, Code Block, Horizontal Rule
 * - BubbleMenu: Inline formatting on text selection
 * - Export: Copy HTML, Download as file
 * - Accessibility: Full ARIA support, keyboard navigation
 * - Performance: Memoized toolbar, debounced onChange
 * - Mobile: Touch-optimized, responsive design
 *
 * Keyboard Shortcuts:
 * - Ctrl+B: Bold
 * - Ctrl+I: Italic
 * - Ctrl+E: Inline Code
 * - Ctrl+Z: Undo
 * - Ctrl+Y: Redo
 *
 * @example
 * ```tsx
 * <RichTextEditor
 *   content={htmlContent}
 *   onChange={(html) => setHtmlContent(html)}
 *   placeholder="Start writing..."
 *   minHeight="400px"
 *   showExport={true}
 * />
 * ```
 */

export function RichTextEditor({
  content,
  onChange,
  placeholder = "Start writing...",
  minHeight = "300px",
  className,
  title = "content",
  showExport = false,
}: RichTextEditorProps) {
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const { success, error: showError } = useToast();
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced onChange callback (150ms) for performance with large documents
  const debouncedOnChange = useCallback(
    (html: string) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(() => {
        onChange(html);
      }, 150);
    },
    [onChange]
  );

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-orange-400 hover:text-orange-300 underline cursor-pointer",
        },
      }),
      CharacterCount,
    ],
    content,
    editorProps: {
      attributes: {
        class: cn(
          "prose prose-invert max-w-none focus:outline-none",
          "text-white text-sm leading-relaxed",
          // Handle long words overflow with CSS
          "break-words"
        ),
        // Add placeholder attribute for empty state
        'data-placeholder': placeholder,
      },
      // Handle paste events - clean invalid formatting and images
      handlePaste: (view, event) => {
        const html = event.clipboardData?.getData('text/html');
        if (html && /<img/i.test(html)) {
          // Show notification if images were in pasted content
          setTimeout(() => {
            showError("Images removed", "Images are not supported and were removed from pasted content");
          }, 100);
        }
        // TipTap automatically sanitizes pasted content through its schema
        return false;
      },
    },
    onUpdate: ({ editor }) => {
      debouncedOnChange(editor.getHTML());
    },
    // Performance optimization: prevent unnecessary re-renders
    shouldRerenderOnTransaction: false,
  });

  if (!editor) {
    return null;
  }

  // Export handlers
  const handleCopyHtml = async () => {
    try {
      await copyHtmlToClipboard(content);
      success("Copied!", "HTML copied to clipboard");
    } catch (err) {
      showError("Copy failed", "Failed to copy HTML to clipboard");
    }
  };

  const handleDownload = () => {
    try {
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `${title.toLowerCase().replace(/\s+/g, '-')}-${timestamp}.html`;
      downloadAsFile(content, filename);
      success("Downloaded!", `Saved as ${filename}`);
    } catch (err) {
      showError("Download failed", "Failed to download file");
    }
  };

  const BubbleMenuButton = ({
    onClick,
    isActive = false,
    children,
    title,
  }: {
    onClick: () => void;
    isActive?: boolean;
    children: React.ReactNode;
    title: string;
  }) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      aria-pressed={isActive}
      className={cn(
        "p-2 rounded transition-colors touch-target min-w-[44px] min-h-[44px] flex items-center justify-center",
        "hover:bg-stone-100",
        isActive ? "bg-stone-700 text-orange-400" : "text-stone-300"
      )}
    >
      {children}
    </button>
  );

  return (
    <div
      className={cn("border border-stone-200 rounded-lg overflow-hidden", className)}
      // Prevent virtual keyboard from pushing editor off screen on mobile
      style={{ position: 'relative' }}
    >
      {/* Main Toolbar */}
      <EditorToolbar
        editor={editor}
        onLinkClick={() => setIsLinkDialogOpen(true)}
      />

      {/* BubbleMenu - Appears on text selection */}
      <BubbleMenu
        editor={editor}
        options={{
          placement: "top",
        }}
        updateDelay={100}
        className="flex gap-1 p-1 bg-stone-200 border border-stone-300 rounded-lg shadow-lg z-50"
      >
        <BubbleMenuButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive("bold")}
          title="Bold"
        >
          <Bold className="h-4 w-4" />
        </BubbleMenuButton>
        <BubbleMenuButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive("italic")}
          title="Italic"
        >
          <Italic className="h-4 w-4" />
        </BubbleMenuButton>
        <BubbleMenuButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          isActive={editor.isActive("strike")}
          title="Strikethrough"
        >
          <Strikethrough className="h-4 w-4" />
        </BubbleMenuButton>
        <BubbleMenuButton
          onClick={() => editor.chain().focus().toggleCode().run()}
          isActive={editor.isActive("code")}
          title="Code"
        >
          <Code className="h-4 w-4" />
        </BubbleMenuButton>
        <div className="w-px h-6 bg-stone-700 my-auto mx-1" />
        <BubbleMenuButton
          onClick={() => setIsLinkDialogOpen(true)}
          isActive={editor.isActive("link")}
          title="Link"
        >
          <LinkIcon className="h-4 w-4" />
        </BubbleMenuButton>
      </BubbleMenu>

      {/* Editor Content */}
      <div
        className="p-4 bg-[#faf8f4]/50"
        style={{ minHeight }}
        data-placeholder={placeholder}
      >
        <EditorContent editor={editor} />
      </div>

      {/* Footer - EditorStatusBar with optional export buttons */}
      <div className="flex items-center justify-between border-t border-stone-200 bg-[#faf8f4]/50">
        <EditorStatusBar content={content} className="flex-1 border-0" />

        {showExport && (
          <div className="flex gap-2 px-4 border-l border-stone-200">
            <button
              type="button"
              onClick={handleCopyHtml}
              aria-label="Copy HTML to clipboard"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-stone-400 hover:text-stone-900 hover:bg-stone-200 rounded transition-colors"
              title="Copy HTML to clipboard"
            >
              <Copy className="h-3.5 w-3.5" />
              Copy HTML
            </button>
            <button
              type="button"
              onClick={handleDownload}
              aria-label="Download as HTML file"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-stone-400 hover:text-stone-900 hover:bg-stone-200 rounded transition-colors"
              title="Download as HTML file"
            >
              <Download className="h-3.5 w-3.5" />
              Download
            </button>
          </div>
        )}
      </div>

      {/* Link Dialog */}
      <LinkDialog
        editor={editor}
        isOpen={isLinkDialogOpen}
        onClose={() => setIsLinkDialogOpen(false)}
      />
    </div>
  );
}
