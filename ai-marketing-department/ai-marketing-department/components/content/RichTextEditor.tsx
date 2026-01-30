"use client";

import { useState } from "react";
import { useEditor, EditorContent, TiptapBubbleMenu } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import CharacterCount from "@tiptap/extension-character-count";
import { Bold, Italic, Strikethrough, Code, LinkIcon, Copy, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { EditorToolbar } from "./EditorToolbar";
import { LinkDialog } from "./LinkDialog";
import { EditorStatusBar } from "./EditorStatusBar";
import { copyHtmlToClipboard, downloadAsFile } from "@/lib/editor-utils";
import { useToast } from "@/components/ui/Toast";

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: string;
  className?: string;
  title?: string; // For filename when downloading
  showExport?: boolean; // Show export buttons
}

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

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-indigo-400 hover:text-indigo-300 underline cursor-pointer",
        },
      }),
      CharacterCount,
    ],
    content,
    editorProps: {
      attributes: {
        class: cn(
          "prose prose-invert max-w-none focus:outline-none",
          "text-white text-sm leading-relaxed"
        ),
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
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
      className={cn(
        "p-2 rounded transition-colors touch-target min-w-[44px] min-h-[44px] flex items-center justify-center",
        "hover:bg-zinc-700",
        isActive ? "bg-zinc-700 text-indigo-400" : "text-zinc-300"
      )}
    >
      {children}
    </button>
  );

  return (
    <div className={cn("border border-zinc-800 rounded-lg overflow-hidden", className)}>
      {/* Main Toolbar */}
      <EditorToolbar
        editor={editor}
        onLinkClick={() => setIsLinkDialogOpen(true)}
      />

      {/* BubbleMenu - Appears on text selection */}
      <TiptapBubbleMenu
        editor={editor}
        tippyOptions={{
          duration: 100,
          placement: "top",
        }}
        className="flex gap-1 p-1 bg-zinc-800 border border-zinc-700 rounded-lg shadow-lg"
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
        <div className="w-px h-6 bg-zinc-700 my-auto mx-1" />
        <BubbleMenuButton
          onClick={() => setIsLinkDialogOpen(true)}
          isActive={editor.isActive("link")}
          title="Link"
        >
          <LinkIcon className="h-4 w-4" />
        </BubbleMenuButton>
      </TiptapBubbleMenu>

      {/* Editor Content */}
      <div
        className="p-4 bg-zinc-950/50"
        style={{ minHeight }}
        data-placeholder={placeholder}
      >
        <EditorContent editor={editor} />
      </div>

      {/* Footer - EditorStatusBar with optional export buttons */}
      <div className="flex items-center justify-between border-t border-zinc-800 bg-zinc-950/50">
        <EditorStatusBar content={content} className="flex-1 border-0" />

        {showExport && (
          <div className="flex gap-2 px-4 border-l border-zinc-800">
            <button
              type="button"
              onClick={handleCopyHtml}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors"
              title="Copy HTML to clipboard"
            >
              <Copy className="h-3.5 w-3.5" />
              Copy HTML
            </button>
            <button
              type="button"
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors"
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
