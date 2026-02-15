"use client";

import { motion } from "framer-motion";
import { Upload, Edit3, Palette, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface BrandOnboardingChoiceProps {
  onUpload: () => void;
  onManual: () => void;
}

export function BrandOnboardingChoice({ onUpload, onManual }: BrandOnboardingChoiceProps) {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="text-center mb-10"
      >
        <div className="inline-flex p-3 rounded-2xl bg-[var(--badge-purple-bg)] mb-4">
          <Palette className="h-8 w-8 text-[var(--badge-purple-text)]" />
        </div>
        <h1 className="text-3xl font-bold text-[var(--text-primary)]">
          Configura tu marca
        </h1>
        <p className="text-[var(--text-tertiary)] mt-2 max-w-md mx-auto">
          Define la identidad de tu marca para que los agentes de IA generen contenido alineado con tu voz y estilo.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
        {/* Card A — Import from assets */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
          onClick={onUpload}
          className={cn(
            "group relative flex flex-col items-center text-center p-8 rounded-2xl border-2 border-[var(--border)]",
            "bg-[var(--card-bg)] hover:border-orange-300 hover:shadow-lg transition-all duration-200",
            "focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2"
          )}
        >
          <div className="p-4 rounded-xl bg-[var(--accent-muted)] group-hover:bg-[var(--accent-muted)] transition-colors mb-4">
            <Upload className="h-8 w-8 text-[var(--accent)]" />
          </div>
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
            Importar desde assets
          </h3>
          <p className="text-sm text-[var(--text-tertiary)] mb-6">
            Sube tu web, documentos o logo y extraemos tu marca automáticamente
          </p>
          <span className={cn(
            "inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold",
            "bg-[var(--accent)] text-white group-hover:bg-[var(--accent-hover)] transition-colors"
          )}>
            <Sparkles className="w-4 h-4" />
            Importar con IA
          </span>
        </motion.button>

        {/* Card B — Fill manually */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2, ease: "easeOut" }}
          onClick={onManual}
          className={cn(
            "group relative flex flex-col items-center text-center p-8 rounded-2xl border-2 border-[var(--border)]",
            "bg-[var(--card-bg)] hover:border-[var(--border-hover)] hover:shadow-lg transition-all duration-200",
            "focus:outline-none focus:ring-2 focus:ring-stone-400 focus:ring-offset-2"
          )}
        >
          <div className="p-4 rounded-xl bg-[var(--surface-1)] group-hover:bg-[var(--surface-2)] transition-colors mb-4">
            <Edit3 className="h-8 w-8 text-[var(--text-secondary)]" />
          </div>
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
            Completar manualmente
          </h3>
          <p className="text-sm text-[var(--text-tertiary)] mb-6">
            Llena paso a paso la información de tu marca
          </p>
          <span className={cn(
            "inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold",
            "border-2 border-[var(--border-hover)] text-[var(--text-secondary)] group-hover:border-[var(--border-hover)] transition-colors"
          )}>
            <Edit3 className="w-4 h-4" />
            Comenzar wizard
          </span>
        </motion.button>
      </div>
    </div>
  );
}
