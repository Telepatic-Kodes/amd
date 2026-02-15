"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { useBrandContext } from "@/hooks/useBrandContext";
import {
  Linkedin,
  Twitter,
  Instagram,
  Mail,
  Plus,
  Trash2,
  Star,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/Toast";

const PLATFORMS = [
  { id: "linkedin", label: "LinkedIn", icon: Linkedin, color: "text-blue-600" },
  { id: "twitter", label: "Twitter/X", icon: Twitter, color: "text-cyan-500" },
  { id: "instagram", label: "Instagram", icon: Instagram, color: "text-pink-500" },
  { id: "email", label: "Email", icon: Mail, color: "text-amber-600" },
];

export function ChannelGroupManager() {
  const { activeBrandId } = useBrandContext();
  const { success } = useToast();
  const groups = useQuery(api.channelGroups.listChannelGroups, {
    brandProfileId: activeBrandId ?? undefined,
  });
  const createGroup = useMutation(api.channelGroups.createChannelGroup);
  const deleteGroup = useMutation(api.channelGroups.deleteChannelGroup);
  const toggleDefault = useMutation(api.channelGroups.toggleDefault);

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);

  const handleCreate = async () => {
    if (!name.trim() || selectedPlatforms.length === 0) return;
    await createGroup({
      name: name.trim(),
      platforms: selectedPlatforms,
      brandProfileId: activeBrandId ?? undefined,
    });
    setName("");
    setSelectedPlatforms([]);
    setShowForm(false);
    success("Grupo creado", `${name} con ${selectedPlatforms.length} plataformas`);
  };

  const togglePlatform = (platformId: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platformId)
        ? prev.filter((p) => p !== platformId)
        : [...prev, platformId]
    );
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="h-5 w-5 text-[var(--brand-accent)]" />
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">
            Grupos de Canales
          </h3>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-[var(--brand-accent)] text-white hover:opacity-90 transition-opacity"
        >
          <Plus className="h-3 w-3" />
          Crear grupo
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-4 space-y-3">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nombre del grupo..."
            className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--input-bg)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none focus:border-[var(--brand-accent)]"
          />
          <div className="flex flex-wrap gap-2">
            {PLATFORMS.map((platform) => {
              const Icon = platform.icon;
              const isSelected = selectedPlatforms.includes(platform.id);
              return (
                <button
                  key={platform.id}
                  onClick={() => togglePlatform(platform.id)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-medium transition-colors",
                    isSelected
                      ? "border-[var(--brand-accent)] bg-[var(--brand-accent-muted)] text-[var(--text-primary)]"
                      : "border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--surface-1)]"
                  )}
                >
                  <Icon className={cn("h-3.5 w-3.5", isSelected ? platform.color : "")} />
                  {platform.label}
                </button>
              );
            })}
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCreate}
              disabled={!name.trim() || selectedPlatforms.length === 0}
              className="px-4 py-1.5 text-xs font-medium rounded-lg bg-[var(--brand-accent)] text-white hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Guardar
            </button>
            <button
              onClick={() => { setShowForm(false); setName(""); setSelectedPlatforms([]); }}
              className="px-4 py-1.5 text-xs font-medium rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--surface-1)] transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Groups list */}
      {!groups ? (
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-16 rounded-xl bg-[var(--surface-1)] animate-pulse" />
          ))}
        </div>
      ) : groups.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--border)] p-8 text-center">
          <Layers className="h-8 w-8 mx-auto text-[var(--text-tertiary)] mb-2" />
          <p className="text-sm text-[var(--text-secondary)]">Sin grupos creados</p>
          <p className="text-xs text-[var(--text-tertiary)] mt-1">
            Crea un grupo para publicar en multiples plataformas con un clic
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {groups.map((group) => (
            <div
              key={group._id}
              className="flex items-center gap-3 px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--card-bg)] hover:bg-[var(--surface-1)] transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                    {group.name}
                  </p>
                  {group.isDefault && (
                    <Star className="h-3 w-3 text-amber-500 fill-amber-500 shrink-0" />
                  )}
                </div>
                <div className="flex items-center gap-1.5 mt-1">
                  {group.platforms.map((platformId) => {
                    const platform = PLATFORMS.find((p) => p.id === platformId);
                    if (!platform) return null;
                    const Icon = platform.icon;
                    return <Icon key={platformId} className={cn("h-3.5 w-3.5", platform.color)} />;
                  })}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => toggleDefault({ id: group._id })}
                  className="p-1.5 rounded-md hover:bg-[var(--surface-2)] transition-colors"
                  title={group.isDefault ? "Quitar favorito" : "Marcar como favorito"}
                >
                  <Star className={cn(
                    "h-3.5 w-3.5",
                    group.isDefault ? "text-amber-500 fill-amber-500" : "text-[var(--text-tertiary)]"
                  )} />
                </button>
                <button
                  onClick={() => deleteGroup({ id: group._id })}
                  className="p-1.5 rounded-md hover:bg-[var(--badge-red-bg)] text-[var(--text-tertiary)] hover:text-[var(--error)] transition-colors"
                  title="Eliminar grupo"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
