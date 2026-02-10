"use client";

import { X } from "lucide-react";

interface ShortcutGroup {
  title: string;
  shortcuts: { keys: string[]; description: string }[];
}

const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    title: "General",
    shortcuts: [
      { keys: ["⌘", "K"], description: "Abrir paleta de comandos" },
      { keys: ["?"], description: "Mostrar atajos de teclado" },
      { keys: ["N"], description: "Ir a crear contenido" },
      { keys: ["Esc"], description: "Cerrar diálogo" },
    ],
  },
  {
    title: "Navegación (G + tecla)",
    shortcuts: [
      { keys: ["G", "H"], description: "Ir a Inicio" },
      { keys: ["G", "B"], description: "Ir a Marca" },
      { keys: ["G", "C"], description: "Ir a Centro de Control" },
      { keys: ["G", "R"], description: "Ir a Resultados" },
      { keys: ["G", "S"], description: "Ir a Configuración" },
    ],
  },
  {
    title: "Paleta de Comandos",
    shortcuts: [
      { keys: ["↑", "↓"], description: "Navegar opciones" },
      { keys: ["↵"], description: "Seleccionar opción" },
    ],
  },
];

interface KeyboardShortcutsHelpProps {
  open: boolean;
  onClose: () => void;
}

export function KeyboardShortcutsHelp({ open, onClose }: KeyboardShortcutsHelpProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-label="Atajos de teclado">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-md rounded-xl border border-[var(--border)] bg-[var(--surface-0)] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-3">
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">Atajos de teclado</h2>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-1)] transition-colors"
            aria-label="Cerrar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 max-h-[60vh] overflow-y-auto space-y-5">
          {SHORTCUT_GROUPS.map((group) => (
            <div key={group.title}>
              <h3 className="text-[10px] uppercase tracking-wider text-[var(--text-tertiary)] font-medium mb-2">
                {group.title}
              </h3>
              <div className="space-y-1.5">
                {group.shortcuts.map((shortcut) => (
                  <div
                    key={shortcut.description}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-[var(--text-secondary)]">{shortcut.description}</span>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((key, i) => (
                        <span key={i}>
                          <kbd className="inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 text-[11px] font-medium text-[var(--text-secondary)] bg-[var(--surface-1)] border border-[var(--border)] rounded">
                            {key}
                          </kbd>
                          {i < shortcut.keys.length - 1 && (
                            <span className="text-[var(--text-tertiary)] text-xs mx-0.5">+</span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="border-t border-[var(--border)] px-5 py-2.5 text-[10px] text-[var(--text-tertiary)] text-center">
          Presiona <kbd className="border border-[var(--border)] rounded px-1 py-0.5 mx-0.5 bg-[var(--surface-1)]">?</kbd> en cualquier momento para ver esta ayuda
        </div>
      </div>
    </div>
  );
}
