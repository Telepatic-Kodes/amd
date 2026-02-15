"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import {
  Key,
  Plus,
  Trash2,
  Copy,
  Check,
  Clock,
  Shield,
  Activity,
  AlertTriangle,
  Eye,
  EyeOff,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/Toast";

const PERMISSION_OPTIONS = [
  { value: "read:content", label: "Leer contenido", group: "Contenido" },
  { value: "write:content", label: "Crear/editar contenido", group: "Contenido" },
  { value: "read:agents", label: "Leer agentes", group: "Agentes" },
  { value: "write:agents", label: "Ejecutar agentes", group: "Agentes" },
  { value: "read:analytics", label: "Leer analítica", group: "Analítica" },
  { value: "read:strategies", label: "Leer estrategias", group: "Estrategias" },
  { value: "write:strategies", label: "Crear estrategias", group: "Estrategias" },
  { value: "admin", label: "Acceso completo", group: "Admin" },
];

export function ApiTokenManager() {
  const tokens = useQuery(api.publicApi.listTokens);
  const createToken = useMutation(api.publicApi.createToken);
  const revokeToken = useMutation(api.publicApi.revokeToken);
  const { success, error: showError } = useToast();

  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPermissions, setNewPermissions] = useState<string[]>(["read:content", "read:agents"]);
  const [expiresInDays, setExpiresInDays] = useState<number | undefined>(undefined);
  const [newToken, setNewToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showTokens, setShowTokens] = useState(false);

  const handleCreate = async () => {
    if (!newName.trim()) {
      showError("Error", "El nombre es requerido");
      return;
    }
    if (newPermissions.length === 0) {
      showError("Error", "Selecciona al menos un permiso");
      return;
    }

    try {
      const result = await createToken({
        name: newName.trim(),
        permissions: newPermissions,
        expiresInDays,
      });
      setNewToken(result.token);
      success("Token creado", "Copia el token ahora — no se mostrará de nuevo.");
      setNewName("");
      setNewPermissions(["read:content", "read:agents"]);
      setExpiresInDays(undefined);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Error desconocido";
      showError("Error al crear token", message);
    }
  };

  const handleRevoke = async (id: Id<"apiKeys">, name: string) => {
    try {
      await revokeToken({ id });
      success("Token revocado", `"${name}" ya no puede acceder a la API.`);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Error desconocido";
      showError("Error", message);
    }
  };

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const togglePermission = (perm: string) => {
    if (perm === "admin") {
      setNewPermissions(newPermissions.includes("admin") ? [] : ["admin"]);
      return;
    }
    setNewPermissions((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev.filter((p) => p !== "admin"), perm]
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">API Tokens</h3>
          <p className="text-sm text-[var(--text-tertiary)]">
            Gestiona tokens para acceder a la API pública de AMD
          </p>
        </div>
        <button
          onClick={() => {
            setIsCreating(!isCreating);
            setNewToken(null);
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--accent)] text-white text-sm font-medium hover:bg-[var(--accent-hover)] transition-colors"
        >
          <Plus className="h-4 w-4" />
          Crear Token
        </button>
      </div>

      {/* New Token Alert */}
      {newToken && (
        <div className="p-4 rounded-lg border border-amber-500/50 bg-[var(--badge-amber-bg)]">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-[var(--badge-amber-text)] mt-0.5 flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <p className="text-sm font-medium text-amber-800">
                Copia este token ahora — no se mostrará de nuevo
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 px-3 py-2 bg-[var(--card-bg)] rounded border border-amber-200 text-xs font-mono text-[var(--text-primary)] break-all">
                  {newToken}
                </code>
                <button
                  onClick={() => handleCopy(newToken)}
                  className="p-2 rounded-lg border border-amber-200 hover:bg-amber-100 transition-colors"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-[var(--badge-green-text)]" />
                  ) : (
                    <Copy className="h-4 w-4 text-[var(--badge-amber-text)]" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Form */}
      {isCreating && !newToken && (
        <div className="p-4 rounded-lg border border-[var(--border)] bg-[var(--card-bg)] space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Nombre</label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Ej: Integración Zapier, App Móvil..."
              className="w-full rounded-lg border border-[var(--border-hover)] py-2 px-3 text-sm focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Permisos</label>
            <div className="grid grid-cols-2 gap-2">
              {PERMISSION_OPTIONS.map((perm) => (
                <button
                  key={perm.value}
                  onClick={() => togglePermission(perm.value)}
                  className={cn(
                    "flex items-center gap-2 p-2 rounded-lg border text-left text-xs transition-all",
                    newPermissions.includes(perm.value)
                      ? "border-[var(--accent)] bg-[var(--accent-muted)] text-orange-700"
                      : "border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--border-hover)]"
                  )}
                >
                  <Shield className="h-3 w-3 flex-shrink-0" />
                  <span>{perm.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Expiración</label>
            <select
              value={expiresInDays || ""}
              onChange={(e) => setExpiresInDays(e.target.value ? parseInt(e.target.value) : undefined)}
              className="w-full rounded-lg border border-[var(--border-hover)] py-2 px-3 text-sm focus:border-[var(--accent)] focus:outline-none"
            >
              <option value="">Sin expiración</option>
              <option value="30">30 días</option>
              <option value="90">90 días</option>
              <option value="180">6 meses</option>
              <option value="365">1 año</option>
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setIsCreating(false)}
              className="flex-1 py-2 rounded-lg border border-[var(--border)] text-sm text-[var(--text-secondary)] hover:bg-[var(--surface-0)] transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleCreate}
              className="flex-1 py-2 rounded-lg bg-[var(--accent)] text-white text-sm font-medium hover:bg-[var(--accent-hover)] transition-colors"
            >
              Crear Token
            </button>
          </div>
        </div>
      )}

      {/* Token List */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-[var(--text-tertiary)]">
            {tokens?.filter((t) => t.status === "active").length || 0} tokens activos
          </span>
          <button
            onClick={() => setShowTokens(!showTokens)}
            className="flex items-center gap-1 text-xs text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
          >
            {showTokens ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
            {showTokens ? "Ocultar" : "Mostrar"} prefijos
          </button>
        </div>

        {tokens?.map((token) => (
          <div
            key={token._id}
            className={cn(
              "flex items-center justify-between p-3 rounded-lg border",
              token.status === "active"
                ? "border-[var(--border)] bg-[var(--card-bg)]"
                : "border-[var(--border)] bg-[var(--surface-0)] opacity-60"
            )}
          >
            <div className="flex items-center gap-3 min-w-0">
              <Key className={cn("h-4 w-4 flex-shrink-0", token.status === "active" ? "text-orange-500" : "text-[var(--text-tertiary)]")} />
              <div className="min-w-0">
                <p className="text-sm font-medium text-[var(--text-primary)] truncate">{token.name}</p>
                <div className="flex items-center gap-3 text-xs text-[var(--text-tertiary)]">
                  {showTokens && (
                    <code className="font-mono">{token.keyPrefix}...</code>
                  )}
                  <span className="flex items-center gap-1">
                    <Activity className="h-3 w-3" />
                    {token.totalRequests} peticiones
                  </span>
                  {token.lastUsedAt && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Último uso: {new Date(token.lastUsedAt).toLocaleDateString("es-CL")}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {token.status === "active" ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[var(--badge-green-bg)] text-green-700 border border-green-200">
                  Activo
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[var(--badge-red-bg)] text-[var(--badge-red-text)] border border-[var(--badge-red-bg)]">
                  Revocado
                </span>
              )}
              {token.status === "active" && (
                <button
                  onClick={() => handleRevoke(token._id, token.name)}
                  className="p-1.5 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--badge-red-text)] hover:bg-[var(--badge-red-bg)] transition-colors"
                  title="Revocar token"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        ))}

        {(!tokens || tokens.length === 0) && (
          <div className="text-center py-8 text-[var(--text-tertiary)] text-sm">
            No hay tokens creados. Crea uno para acceder a la API.
          </div>
        )}
      </div>

      {/* API Documentation Link */}
      <div className="p-3 rounded-lg border border-[var(--border)] bg-[var(--surface-0)]">
        <p className="text-xs text-[var(--text-tertiary)]">
          <strong>Base URL:</strong>{" "}
          <code className="px-1 py-0.5 bg-[var(--card-bg)] rounded text-[var(--text-secondary)]">
            {typeof window !== "undefined" ? window.location.origin : ""}/api/v1
          </code>
        </p>
        <p className="text-xs text-[var(--text-tertiary)] mt-1">
          <strong>Auth:</strong>{" "}
          <code className="px-1 py-0.5 bg-[var(--card-bg)] rounded text-[var(--text-secondary)]">
            Authorization: Bearer amd_live_...
          </code>
        </p>
        <p className="text-xs text-[var(--text-tertiary)] mt-1">
          <strong>Endpoints:</strong> /agents, /content, /analytics, /strategies
        </p>
      </div>
    </div>
  );
}
