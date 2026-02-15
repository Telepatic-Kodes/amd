"use client";

import { Bot, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface CopilotMessageProps {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  isStreaming?: boolean;
}

export function CopilotMessage({ role, content, timestamp, isStreaming }: CopilotMessageProps) {
  const isUser = role === "user";
  const time = new Date(timestamp).toLocaleTimeString("es-CL", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className={cn("flex gap-2.5 px-4 py-2", isUser ? "flex-row-reverse" : "flex-row")}>
      <div
        className={cn(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
          isUser
            ? "bg-[var(--brand-accent-muted)]"
            : "bg-[var(--surface-2)]"
        )}
      >
        {isUser ? (
          <User className="h-3.5 w-3.5" style={{ color: "var(--brand-accent)" }} />
        ) : (
          <Bot className="h-3.5 w-3.5 text-[var(--text-secondary)]" />
        )}
      </div>

      <div className={cn("flex-1 min-w-0", isUser ? "text-right" : "text-left")}>
        <div
          className={cn(
            "inline-block max-w-[85%] rounded-xl px-3 py-2 text-sm leading-relaxed",
            isUser
              ? "bg-[var(--brand-accent)] text-white rounded-tr-sm"
              : "bg-[var(--surface-1)] text-[var(--text-primary)] rounded-tl-sm border border-[var(--border)]"
          )}
        >
          {isStreaming ? (
            <div className="flex items-center gap-1">
              <div className="flex gap-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-current opacity-40 animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-current opacity-40 animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-current opacity-40 animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
              <span className="text-xs opacity-60 ml-1">Pensando...</span>
            </div>
          ) : (
            <p className="whitespace-pre-wrap break-words">{content}</p>
          )}
        </div>
        <p className={cn(
          "text-[9px] mt-0.5 px-1",
          isUser ? "text-[var(--text-tertiary)]" : "text-[var(--text-tertiary)]"
        )}>
          {time}
        </p>
      </div>
    </div>
  );
}
