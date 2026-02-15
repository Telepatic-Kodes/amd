"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { Plus, X, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const CATEGORIES = ["industry", "competitor", "technical", "news", "blog"];
const FREQUENCIES = [
  { value: "hourly", label: "Cada hora" },
  { value: "daily", label: "Diario" },
  { value: "weekly", label: "Semanal" },
];

export function AddFeedForm({ onSuccess }: { onSuccess?: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [url, setUrl] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState("industry");
  const [syncFrequency, setSyncFrequency] = useState<"hourly" | "daily" | "weekly">("daily");

  const addFeed = useMutation(api.feeds.mutations.addFeed);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await addFeed({ url, name, category, syncFrequency });
      setUrl("");
      setName("");
      setCategory("industry");
      setSyncFrequency("daily");
      setIsOpen(false);
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al agregar feed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <AnimatePresence>
        {!isOpen ? (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent)] text-white font-medium transition-colors"
          >
            <Plus className="h-4 w-4" />
            Agregar Feed
          </motion.button>
        ) : (
          <motion.form
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            onSubmit={handleSubmit}
            className="p-4 rounded-lg border border-[var(--border)] bg-[var(--card-bg)] space-y-4"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-[var(--text-primary)] font-medium">Agregar Nuevo Feed</h3>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 rounded hover:bg-[var(--surface-2)] text-[var(--text-tertiary)]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {error && (
              <div className="text-sm text-[var(--error)] bg-red-500/10 rounded p-2">
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-xs text-[var(--text-tertiary)] mb-1">URL del Feed</label>
                <input
                  type="url"
                  inputMode="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com/feed.xml"
                  required
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--card-bg)] py-2 px-3 text-sm text-[var(--text-primary)] placeholder-stone-400 focus:border-[var(--accent)] focus:outline-none"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-xs text-[var(--text-tertiary)] mb-1">Nombre</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Mi Feed"
                  required
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--card-bg)] py-2 px-3 text-sm text-[var(--text-primary)] placeholder-stone-400 focus:border-[var(--accent)] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs text-[var(--text-tertiary)] mb-1">Categoría</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--card-bg)] py-2 px-3 text-sm text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-[var(--text-tertiary)] mb-1">Frecuencia de Sincronización</label>
                <select
                  value={syncFrequency}
                  onChange={(e) => setSyncFrequency(e.target.value as typeof syncFrequency)}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--card-bg)] py-2 px-3 text-sm text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none"
                >
                  {FREQUENCIES.map((freq) => (
                    <option key={freq.value} value={freq.value}>{freq.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex-1 py-2 rounded-lg border border-[var(--border)] text-[var(--text-tertiary)] hover:bg-[var(--surface-2)] transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 py-2 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent)] text-white font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Agregar Feed
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
