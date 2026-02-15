"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import {
  Search,
  Bot,
  Zap,
  Moon,
  Sun,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/hooks/useTheme";
import {
  PAGE_COMMANDS,
  ACTION_COMMANDS,
  CONTEXT_COMMANDS,
  fuzzyMatch,
  getRecentCommands,
  addRecentCommand,
  type CommandAction,
} from "@/lib/commandActions";

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon: typeof Search;
  section: string;
  action: () => void;
  shortcut?: string;
  keywords?: string[];
}

const SECTION_ORDER = ["Recientes", "Páginas", "Acciones", "Agentes"];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const agents = useQuery(api.functions.listAgents, {});
  const { resolved: currentTheme, toggleTheme } = useTheme();

  // Keyboard shortcut: Cmd+K / Ctrl+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const navigate = useCallback((path: string) => {
    setOpen(false);
    router.push(path);
  }, [router]);

  const executeCommand = useCallback((cmd: CommandAction) => {
    addRecentCommand(cmd.id);
    if (cmd.action === "navigate" && cmd.href) {
      navigate(cmd.href);
    } else {
      setOpen(false);
    }
  }, [navigate]);

  // Current page context
  const currentBasePage = useMemo(() => {
    return "/" + (pathname.split("/")[1] || "");
  }, [pathname]);

  // Build command items
  const items = useMemo<CommandItem[]>(() => {
    // Recent commands
    const recentIds = getRecentCommands();
    const allCommands = [...PAGE_COMMANDS, ...ACTION_COMMANDS, ...CONTEXT_COMMANDS];
    const recentItems: CommandItem[] = recentIds
      .map((id) => {
        const cmd = allCommands.find((c) => c.id === id);
        if (!cmd) return null;
        return {
          id: `recent-${cmd.id}`,
          label: cmd.label,
          description: cmd.description,
          icon: Clock,
          section: "Recientes",
          action: () => executeCommand(cmd),
          keywords: cmd.keywords,
        };
      })
      .filter(Boolean) as CommandItem[];

    // Pages
    const pages: CommandItem[] = PAGE_COMMANDS.map((cmd) => ({
      id: cmd.id,
      label: cmd.label,
      description: cmd.description,
      icon: cmd.icon,
      section: "Páginas",
      action: () => executeCommand(cmd),
      shortcut: cmd.shortcut,
      keywords: cmd.keywords,
    }));

    // Actions (global + context-specific)
    const contextCommands = CONTEXT_COMMANDS.filter(
      (cmd) => !cmd.contextPages || cmd.contextPages.includes(currentBasePage)
    );
    const actionCmds = [...ACTION_COMMANDS, ...contextCommands];
    const actions: CommandItem[] = [
      ...actionCmds.map((cmd) => ({
        id: cmd.id,
        label: cmd.label,
        description: cmd.description,
        icon: cmd.icon,
        section: "Acciones",
        action: () => executeCommand(cmd),
        shortcut: cmd.shortcut,
        keywords: cmd.keywords,
      })),
      {
        id: "act-theme",
        label: currentTheme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro",
        description: "Alternar tema",
        icon: currentTheme === "dark" ? Sun : Moon,
        section: "Acciones",
        action: () => { toggleTheme(); setOpen(false); },
        keywords: ["tema", "theme", "dark", "light", "oscuro", "claro"],
      },
    ];

    // Agents
    const agentItems: CommandItem[] = (agents || []).map((a: Record<string, unknown>) => ({
      id: `agent-${a._id}`,
      label: a.name as string,
      description: `${a.department} · ${a.status}`,
      icon: a.status === "active" ? Zap : Bot,
      section: "Agentes",
      action: () => { addRecentCommand(`agent-${a._id}`); navigate("/agents"); },
      keywords: [a.name as string, a.department as string, a.agentId as string].filter(Boolean),
    }));

    return [...recentItems, ...pages, ...actions, ...agentItems];
  }, [agents, navigate, currentTheme, toggleTheme, currentBasePage, executeCommand]);

  // Filter items by query with fuzzy matching
  const filtered = useMemo(() => {
    if (!query.trim()) {
      // When no query, skip "Recientes" if empty
      return items.filter((item) => item.section !== "Recientes" || items.some((i) => i.section === "Recientes"));
    }
    return items.filter((item) => {
      if (fuzzyMatch(item.label, query)) return true;
      if (item.description && fuzzyMatch(item.description, query)) return true;
      if (item.keywords?.some((kw) => fuzzyMatch(kw, query))) return true;
      return false;
    });
  }, [items, query]);

  // Group by section in defined order
  const grouped = useMemo(() => {
    const map = new Map<string, CommandItem[]>();
    for (const item of filtered) {
      const list = map.get(item.section) || [];
      list.push(item);
      map.set(item.section, list);
    }
    // Sort sections by defined order
    const sorted = new Map<string, CommandItem[]>();
    for (const section of SECTION_ORDER) {
      if (map.has(section)) sorted.set(section, map.get(section)!);
    }
    return sorted;
  }, [filtered]);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter" && filtered[selectedIndex]) {
        e.preventDefault();
        filtered[selectedIndex].action();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, filtered, selectedIndex]);

  // Reset selection when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  if (!open) return null;

  let flatIndex = -1;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]" role="dialog" aria-label="Paleta de comandos" aria-modal="true">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60"
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />

      {/* Palette */}
      <div className="relative w-full max-w-lg rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl overflow-hidden" role="combobox" aria-expanded="true" aria-haspopup="listbox">
        {/* Search input */}
        <div className="flex items-center gap-3 border-b border-[var(--border)] px-4 py-3">
          <Search className="h-4 w-4 text-[var(--text-tertiary)] shrink-0" aria-hidden="true" />
          <input
            ref={inputRef}
            type="text"
            inputMode="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar paginas, agentes, acciones..."
            className="flex-1 bg-transparent text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none"
            aria-label="Buscar comandos"
            aria-autocomplete="list"
          />
          <kbd className="hidden sm:inline-flex text-[10px] text-[var(--text-tertiary)] border border-[var(--border)] rounded px-1.5 py-0.5">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-[360px] overflow-y-auto py-2" role="listbox" aria-label="Resultados de busqueda">
          {filtered.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-[var(--text-tertiary)]">
              Sin resultados para &ldquo;{query}&rdquo;
            </div>
          ) : (
            Array.from(grouped.entries()).map(([section, sectionItems]) => (
              <div key={section}>
                <div className="px-4 py-1.5 text-[10px] uppercase tracking-wider text-[var(--text-tertiary)] font-medium">
                  {section}
                </div>
                {sectionItems.map((item) => {
                  flatIndex++;
                  const isSelected = flatIndex === selectedIndex;
                  const Icon = item.icon;
                  const currentIndex = flatIndex;
                  return (
                    <button
                      key={item.id}
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => item.action()}
                      onMouseEnter={() => setSelectedIndex(currentIndex)}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-2 text-left transition-colors",
                        isSelected
                          ? "bg-[var(--brand-accent-muted)]"
                          : "hover:bg-[var(--surface-1)]"
                      )}
                    >
                      <Icon className={cn(
                        "h-4 w-4 shrink-0",
                        isSelected ? "text-[var(--brand-accent)]" : "text-[var(--text-tertiary)]"
                      )} />
                      <div className="min-w-0 flex-1">
                        <span className={cn(
                          "text-sm",
                          isSelected ? "text-[var(--text-primary)] font-medium" : "text-[var(--text-secondary)]"
                        )}>
                          {item.label}
                        </span>
                        {item.description && (
                          <span className="text-xs text-[var(--text-tertiary)] ml-2">{item.description}</span>
                        )}
                      </div>
                      {item.shortcut && (
                        <kbd className="text-[9px] text-[var(--text-tertiary)] border border-[var(--border)] rounded px-1 py-0.5">
                          {item.shortcut}
                        </kbd>
                      )}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer hint */}
        <div className="border-t border-[var(--border)] px-4 py-2 flex items-center gap-3 text-[10px] text-[var(--text-tertiary)]">
          <span><kbd className="border border-[var(--border)] rounded px-1 py-0.5 mr-0.5">↑↓</kbd> navegar</span>
          <span><kbd className="border border-[var(--border)] rounded px-1 py-0.5 mr-0.5">↵</kbd> seleccionar</span>
          <span><kbd className="border border-[var(--border)] rounded px-1 py-0.5 mr-0.5">esc</kbd> cerrar</span>
          <span className="ml-auto text-[9px]">{filtered.length} resultados</span>
        </div>
      </div>
    </div>
  );
}
