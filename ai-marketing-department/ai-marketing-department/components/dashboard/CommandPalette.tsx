"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import {
  Search,
  Home,
  FileText,
  BarChart3,
  Settings,
  Activity,
  Bot,
  Plus,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon: typeof Home;
  section: string;
  action: () => void;
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const agents = useQuery(api.functions.listAgents, {});

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

  // Build command items
  const items = useMemo<CommandItem[]>(() => {
    const pages: CommandItem[] = [
      { id: "nav-home", label: "Inicio", description: "Dashboard principal", icon: Home, section: "Paginas", action: () => navigate("/") },
      { id: "nav-control", label: "Centro de Control", description: "Monitorea agentes", icon: Activity, section: "Paginas", action: () => navigate("/control-center") },
      { id: "nav-content", label: "Contenido", description: "Gestiona contenido", icon: FileText, section: "Paginas", action: () => navigate("/content") },
      { id: "nav-results", label: "Resultados", description: "Metricas y analytics", icon: BarChart3, section: "Paginas", action: () => navigate("/results") },
      { id: "nav-settings", label: "Configuracion", description: "Configuracion avanzada", icon: Settings, section: "Paginas", action: () => navigate("/settings") },
    ];

    const actions: CommandItem[] = [
      { id: "act-content", label: "Crear Contenido", description: "Nuevo contenido", icon: Plus, section: "Acciones", action: () => navigate("/content") },
      { id: "act-task", label: "Nueva Tarea", description: "Crear tarea manual", icon: Plus, section: "Acciones", action: () => navigate("/control-center") },
    ];

    const agentItems: CommandItem[] = (agents || []).map((a: Record<string, unknown>) => ({
      id: `agent-${a._id}`,
      label: a.name as string,
      description: `${a.department} · ${a.status}`,
      icon: a.status === "active" ? Zap : Bot,
      section: "Agentes",
      action: () => navigate("/control-center"),
    }));

    return [...pages, ...actions, ...agentItems];
  }, [agents, navigate]);

  // Filter items by query
  const filtered = useMemo(() => {
    if (!query.trim()) return items;
    const lower = query.toLowerCase();
    return items.filter(
      (item) =>
        item.label.toLowerCase().includes(lower) ||
        item.description?.toLowerCase().includes(lower) ||
        item.section.toLowerCase().includes(lower)
    );
  }, [items, query]);

  // Group by section
  const grouped = useMemo(() => {
    const map = new Map<string, CommandItem[]>();
    for (const item of filtered) {
      const list = map.get(item.section) || [];
      list.push(item);
      map.set(item.section, list);
    }
    return map;
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
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60"
        onClick={() => setOpen(false)}
      />

      {/* Palette */}
      <div className="relative w-full max-w-lg rounded-xl border border-[var(--border)] bg-stone-50 shadow-2xl overflow-hidden">
        {/* Search input */}
        <div className="flex items-center gap-3 border-b border-[var(--border)] px-4 py-3">
          <Search className="h-4 w-4 text-stone-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            inputMode="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar paginas, agentes, acciones..."
            className="flex-1 bg-transparent text-sm text-[var(--text-primary)] placeholder:text-stone-400 outline-none"
          />
          <kbd className="hidden sm:inline-flex text-[10px] text-stone-400 border border-stone-300 rounded px-1.5 py-0.5">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-[300px] overflow-y-auto py-2">
          {filtered.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-stone-400">
              Sin resultados para &ldquo;{query}&rdquo;
            </div>
          ) : (
            Array.from(grouped.entries()).map(([section, sectionItems]) => (
              <div key={section}>
                <div className="px-4 py-1.5 text-[10px] uppercase tracking-wider text-stone-400 font-medium">
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
                      onClick={() => item.action()}
                      onMouseEnter={() => setSelectedIndex(currentIndex)}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-2 text-left transition-colors",
                        isSelected ? "bg-white/[0.06]" : "hover:bg-white/[0.03]"
                      )}
                    >
                      <Icon className={cn("h-4 w-4 shrink-0", isSelected ? "text-emerald-400" : "text-stone-400")} />
                      <div className="min-w-0 flex-1">
                        <span className={cn("text-sm", isSelected ? "text-stone-900" : "text-stone-700")}>
                          {item.label}
                        </span>
                        {item.description && (
                          <span className="text-xs text-stone-400 ml-2">{item.description}</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer hint */}
        <div className="border-t border-[var(--border)] px-4 py-2 flex items-center gap-3 text-[10px] text-stone-400">
          <span><kbd className="border border-stone-300 rounded px-1 py-0.5 mr-0.5">↑↓</kbd> navegar</span>
          <span><kbd className="border border-stone-300 rounded px-1 py-0.5 mr-0.5">↵</kbd> seleccionar</span>
          <span><kbd className="border border-stone-300 rounded px-1 py-0.5 mr-0.5">esc</kbd> cerrar</span>
        </div>
      </div>
    </div>
  );
}
