"use client";

import { useState, useRef, useEffect } from "react";
import { X, Send, Trash2, MessageSquare, Plus, Bot } from "lucide-react";
import { cn } from "@/lib/utils";
import { CopilotMessage } from "./CopilotMessage";
import { CopilotSuggestions } from "./CopilotSuggestions";
import { useCopilot } from "@/hooks/useCopilot";

export function CopilotSidebar() {
  const {
    isOpen,
    close,
    toggle,
    messages,
    conversations,
    isSending,
    sendMessage,
    currentPage,
    suggestions,
    activeConversationId,
    startNewConversation,
    clearCurrentConversation,
    selectConversation,
    brandName,
  } = useCopilot();

  const [input, setInput] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut: Cmd+J to toggle copilot
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "j") {
        e.preventDefault();
        toggle();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [toggle]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSend = async () => {
    if (!input.trim() || isSending) return;
    const text = input;
    setInput("");
    await sendMessage(text);
  };

  const handleSuggestionSelect = async (message: string) => {
    await sendMessage(message);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Floating toggle button */}
      <button
        onClick={toggle}
        className={cn(
          "fixed bottom-6 right-6 z-40 flex h-12 w-12 items-center justify-center rounded-full shadow-lg transition-all hover:scale-105",
          isOpen
            ? "bg-[var(--surface-2)] text-[var(--text-secondary)]"
            : "bg-[var(--brand-accent)] text-white"
        )}
        aria-label="Abrir copiloto"
      >
        {isOpen ? <X className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
      </button>

      {/* Sidebar panel */}
      <div
        className={cn(
          "fixed top-0 right-0 z-50 h-full w-[400px] max-w-full bg-[var(--surface-0)] border-l border-[var(--border)] shadow-2xl transition-transform duration-300 flex flex-col",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] bg-[var(--surface-0)]">
          <div className="flex items-center gap-2 min-w-0">
            <Bot className="h-4 w-4 shrink-0" style={{ color: "var(--brand-accent)" }} />
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-[var(--text-primary)] truncate">
                Copilot
              </h2>
              <p className="text-[10px] text-[var(--text-tertiary)] truncate">
                {currentPage}{brandName ? ` · ${brandName}` : ""}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="p-1.5 rounded-md hover:bg-[var(--surface-1)] transition-colors"
              title="Historial"
            >
              <MessageSquare className="h-3.5 w-3.5 text-[var(--text-tertiary)]" />
            </button>
            <button
              onClick={async () => { await startNewConversation(); setShowHistory(false); }}
              className="p-1.5 rounded-md hover:bg-[var(--surface-1)] transition-colors"
              title="Nueva conversacion"
            >
              <Plus className="h-3.5 w-3.5 text-[var(--text-tertiary)]" />
            </button>
            {activeConversationId && (
              <button
                onClick={clearCurrentConversation}
                className="p-1.5 rounded-md hover:bg-[var(--surface-1)] transition-colors"
                title="Limpiar conversacion"
              >
                <Trash2 className="h-3.5 w-3.5 text-[var(--text-tertiary)]" />
              </button>
            )}
            <button
              onClick={close}
              className="p-1.5 rounded-md hover:bg-[var(--surface-1)] transition-colors"
            >
              <X className="h-3.5 w-3.5 text-[var(--text-tertiary)]" />
            </button>
          </div>
        </div>

        {/* History panel */}
        {showHistory && (
          <div className="border-b border-[var(--border)] bg-[var(--surface-1)] max-h-48 overflow-y-auto">
            <div className="px-3 py-2">
              <p className="text-[10px] uppercase tracking-wider text-[var(--text-tertiary)] font-medium mb-1">
                Conversaciones recientes
              </p>
              {conversations.length === 0 ? (
                <p className="text-xs text-[var(--text-tertiary)] py-2">Sin conversaciones aun</p>
              ) : (
                conversations.map((conv) => (
                  <button
                    key={conv._id}
                    onClick={() => { selectConversation(conv._id); setShowHistory(false); }}
                    className={cn(
                      "w-full text-left px-2 py-1.5 rounded-md text-xs transition-colors",
                      conv._id === activeConversationId
                        ? "bg-[var(--brand-accent-muted)] text-[var(--text-primary)]"
                        : "text-[var(--text-secondary)] hover:bg-[var(--surface-2)]"
                    )}
                  >
                    <p className="truncate font-medium">{conv.title || "Sin titulo"}</p>
                    <p className="text-[9px] text-[var(--text-tertiary)]">
                      {new Date(conv.updatedAt).toLocaleDateString("es-CL")}
                    </p>
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto py-2">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full px-6 text-center">
              <div className="w-12 h-12 rounded-full bg-[var(--brand-accent-muted)] flex items-center justify-center mb-3">
                <Bot className="h-6 w-6" style={{ color: "var(--brand-accent)" }} />
              </div>
              <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-1">
                Hola! Soy tu copiloto
              </h3>
              <p className="text-xs text-[var(--text-tertiary)] mb-4">
                Puedo ayudarte a crear contenido, analizar metricas, ejecutar agentes y mas.
              </p>
              <CopilotSuggestions
                suggestions={suggestions}
                onSelect={handleSuggestionSelect}
                disabled={isSending}
              />
            </div>
          ) : (
            <>
              {messages.map((msg) => (
                <CopilotMessage
                  key={msg._id}
                  role={msg.role}
                  content={msg.content}
                  timestamp={msg.timestamp}
                />
              ))}
              {isSending && (
                <CopilotMessage
                  role="assistant"
                  content=""
                  timestamp={Date.now()}
                  isStreaming
                />
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Suggestions when conversation exists */}
        {messages.length > 0 && messages.length < 4 && !isSending && (
          <CopilotSuggestions
            suggestions={suggestions.slice(0, 2)}
            onSelect={handleSuggestionSelect}
            disabled={isSending}
          />
        )}

        {/* Input */}
        <div className="border-t border-[var(--border)] px-3 py-3 bg-[var(--surface-0)]">
          <div className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-1)] px-3 py-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Escribe tu mensaje..."
              disabled={isSending}
              className="flex-1 bg-transparent text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none disabled:opacity-50"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isSending}
              className="flex h-7 w-7 items-center justify-center rounded-lg transition-colors
                disabled:opacity-30 disabled:cursor-not-allowed"
              style={{
                backgroundColor: input.trim() ? "var(--brand-accent)" : "transparent",
                color: input.trim() ? "white" : "var(--text-tertiary)",
              }}
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </div>
          <p className="text-[9px] text-[var(--text-tertiary)] text-center mt-1.5">
            <kbd className="border border-[var(--border)] rounded px-1 py-0.5 text-[8px]">Cmd+J</kbd> para abrir/cerrar
          </p>
        </div>
      </div>
    </>
  );
}
