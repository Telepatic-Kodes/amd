"use client";

import { useState } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import {
  Webhook,
  Plus,
  Trash2,
  Pause,
  Play,
  Send,
  Check,
  X,
  Clock,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Loader2,
  Copy,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/Toast";

const WEBHOOK_EVENTS = [
  { value: "content.published", label: "Contenido publicado" },
  { value: "content.status_changed", label: "Estado de contenido cambiado" },
  { value: "agent.execution_completed", label: "Ejecución de agente completada" },
  { value: "agent.execution_failed", label: "Ejecución de agente fallida" },
  { value: "strategy.completed", label: "Estrategia completada" },
  { value: "strategy.failed", label: "Estrategia fallida" },
  { value: "report.generated", label: "Reporte generado" },
];

export function WebhookManager() {
  const webhooks = useQuery(api.webhookEngine.listWebhooks);
  const createWebhook = useMutation(api.webhookEngine.createWebhook);
  const updateWebhook = useMutation(api.webhookEngine.updateWebhook);
  const deleteWebhook = useMutation(api.webhookEngine.deleteWebhook);
  const sendTestPing = useAction(api.webhookEngine.sendTestPing);
  const { success, error: showError } = useToast();

  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [newEvents, setNewEvents] = useState<string[]>([]);
  const [newSecret, setNewSecret] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!newName.trim() || !newUrl.trim()) {
      showError("Error", "Nombre y URL son requeridos");
      return;
    }
    if (newEvents.length === 0) {
      showError("Error", "Selecciona al menos un evento");
      return;
    }

    try {
      const result = await createWebhook({
        name: newName.trim(),
        url: newUrl.trim(),
        events: newEvents,
      });
      setNewSecret(result.secret);
      success("Webhook creado", "Copia el signing secret para verificar las entregas.");
      setNewName("");
      setNewUrl("");
      setNewEvents([]);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Error desconocido";
      showError("Error", message);
    }
  };

  const handleDelete = async (id: Id<"webhooks">, name: string) => {
    if (!window.confirm(`¿Eliminar webhook "${name}"? Esta acción no se puede deshacer.`)) return;
    try {
      await deleteWebhook({ id });
      success("Eliminado", `Webhook "${name}" eliminado.`);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Error desconocido";
      showError("Error", message);
    }
  };

  const handleToggle = async (id: Id<"webhooks">, currentStatus: string) => {
    try {
      await updateWebhook({
        id,
        status: currentStatus === "active" ? "paused" : "active",
      });
      success(
        currentStatus === "active" ? "Pausado" : "Activado",
        `Webhook ${currentStatus === "active" ? "pausado" : "activado"}.`
      );
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Error desconocido";
      showError("Error", message);
    }
  };

  const handleTestPing = async (webhookId: Id<"webhooks">) => {
    setTestingId(webhookId);
    try {
      const result = await sendTestPing({ webhookId });
      if (result.success) {
        success("Ping exitoso", `Respuesta: ${result.statusCode}`);
      } else {
        showError("Ping fallido", `${result.statusCode}: ${result.body}`);
      }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Error desconocido";
      showError("Error", message);
    } finally {
      setTestingId(null);
    }
  };

  const toggleEvent = (event: string) => {
    setNewEvents((prev) =>
      prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event]
    );
  };

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    success("Copiado", "Secret copiado al portapapeles");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">Webhooks</h3>
          <p className="text-sm text-[var(--text-tertiary)]">
            Recibe notificaciones en tiempo real cuando ocurren eventos en AMD
          </p>
        </div>
        <button
          onClick={() => {
            setIsCreating(!isCreating);
            setNewSecret(null);
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--accent)] text-white text-sm font-medium hover:bg-[var(--accent-hover)] transition-colors"
        >
          <Plus className="h-4 w-4" />
          Crear Webhook
        </button>
      </div>

      {/* New Secret Alert */}
      {newSecret && (
        <div className="p-4 rounded-lg border border-amber-500/50 bg-[var(--badge-amber-bg)]">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-[var(--badge-amber-text)] mt-0.5 flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <p className="text-sm font-medium text-amber-800">
                Signing Secret — cópialo ahora, no se mostrará de nuevo
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 px-3 py-2 bg-[var(--card-bg)] rounded border border-amber-200 text-xs font-mono text-[var(--text-primary)] break-all">
                  {newSecret}
                </code>
                <button
                  onClick={() => copyToClipboard(newSecret)}
                  className="p-2 rounded-lg border border-amber-200 hover:bg-amber-100 transition-colors"
                >
                  <Copy className="h-4 w-4 text-[var(--badge-amber-text)]" />
                </button>
              </div>
              <p className="text-xs text-amber-700">
                Usa este secret para verificar la firma HMAC-SHA256 en el header X-AMD-Signature.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Create Form */}
      {isCreating && !newSecret && (
        <div className="p-4 rounded-lg border border-[var(--border)] bg-[var(--card-bg)] space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Nombre</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Ej: Slack Notificaciones"
                className="w-full rounded-lg border border-[var(--border-hover)] py-2 px-3 text-sm focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">URL (HTTPS)</label>
              <input
                type="url"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                placeholder="https://hooks.slack.com/..."
                className="w-full rounded-lg border border-[var(--border-hover)] py-2 px-3 text-sm focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Eventos</label>
            <div className="grid grid-cols-2 gap-2">
              {WEBHOOK_EVENTS.map((event) => (
                <button
                  key={event.value}
                  onClick={() => toggleEvent(event.value)}
                  className={cn(
                    "flex items-center gap-2 p-2 rounded-lg border text-left text-xs transition-all",
                    newEvents.includes(event.value)
                      ? "border-[var(--accent)] bg-[var(--accent-muted)] text-orange-700"
                      : "border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--border-hover)]"
                  )}
                >
                  <Webhook className="h-3 w-3 flex-shrink-0" />
                  {event.label}
                </button>
              ))}
            </div>
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
              Crear Webhook
            </button>
          </div>
        </div>
      )}

      {/* Webhook List */}
      <div className="space-y-2">
        {webhooks?.map((webhook) => (
          <div
            key={webhook._id}
            className={cn(
              "rounded-lg border overflow-hidden",
              webhook.status === "active"
                ? "border-[var(--border)] bg-[var(--card-bg)]"
                : webhook.status === "failed"
                  ? "border-[var(--badge-red-bg)] bg-[var(--badge-red-bg)]/50"
                  : "border-[var(--border)] bg-[var(--surface-0)]"
            )}
          >
            {/* Webhook header */}
            <div className="flex items-center justify-between p-3">
              <div
                className="flex items-center gap-3 min-w-0 cursor-pointer flex-1"
                onClick={() => setExpandedId(expandedId === webhook._id ? null : webhook._id)}
              >
                <Webhook className={cn(
                  "h-4 w-4 flex-shrink-0",
                  webhook.status === "active" ? "text-green-500" : "text-[var(--text-tertiary)]"
                )} />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[var(--text-primary)] truncate">{webhook.name}</p>
                  <p className="text-xs text-[var(--text-tertiary)] truncate">{webhook.url}</p>
                </div>
                {expandedId === webhook._id ? (
                  <ChevronUp className="h-4 w-4 text-[var(--text-tertiary)]" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-[var(--text-tertiary)]" />
                )}
              </div>

              <div className="flex items-center gap-1.5">
                {/* Status badge */}
                <span className={cn(
                  "px-2 py-0.5 rounded-full text-[10px] font-medium",
                  webhook.status === "active"
                    ? "bg-[var(--badge-green-bg)] text-green-700 border border-green-200"
                    : webhook.status === "paused"
                      ? "bg-yellow-50 text-[var(--badge-amber-text)] border border-yellow-200"
                      : "bg-[var(--badge-red-bg)] text-[var(--badge-red-text)] border border-[var(--badge-red-bg)]"
                )}>
                  {webhook.status === "active" ? "Activo" : webhook.status === "paused" ? "Pausado" : "Fallido"}
                </span>

                {/* Test Ping */}
                <button
                  onClick={() => handleTestPing(webhook._id)}
                  disabled={testingId === webhook._id}
                  className="p-1.5 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--badge-blue-text)] hover:bg-[var(--badge-blue-bg)] transition-colors"
                  title="Enviar ping de prueba"
                >
                  {testingId === webhook._id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </button>

                {/* Toggle */}
                <button
                  onClick={() => handleToggle(webhook._id, webhook.status)}
                  className="p-1.5 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--surface-1)] transition-colors"
                  title={webhook.status === "active" ? "Pausar" : "Activar"}
                >
                  {webhook.status === "active" ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </button>

                {/* Delete */}
                <button
                  onClick={() => handleDelete(webhook._id, webhook.name)}
                  className="p-1.5 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--badge-red-text)] hover:bg-[var(--badge-red-bg)] transition-colors"
                  title="Eliminar"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Expanded details */}
            {expandedId === webhook._id && (
              <div className="border-t border-[var(--border)] p-3 space-y-3">
                {/* Events */}
                <div>
                  <p className="text-xs font-medium text-[var(--text-tertiary)] mb-1">Eventos suscritos</p>
                  <div className="flex flex-wrap gap-1">
                    {webhook.events.map((event) => (
                      <span
                        key={event}
                        className="px-2 py-0.5 rounded-full text-[10px] bg-[var(--surface-1)] text-[var(--text-secondary)]"
                      >
                        {event}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-2 rounded-lg bg-[var(--surface-0)]">
                    <p className="text-xs text-[var(--text-tertiary)]">Último envío</p>
                    <p className="text-sm font-medium text-[var(--text-secondary)]">
                      {webhook.lastDeliveryAt
                        ? new Date(webhook.lastDeliveryAt).toLocaleString("es-CL")
                        : "Nunca"}
                    </p>
                  </div>
                  <div className="p-2 rounded-lg bg-[var(--surface-0)]">
                    <p className="text-xs text-[var(--text-tertiary)]">Último status</p>
                    <p className={cn(
                      "text-sm font-medium",
                      webhook.lastDeliveryStatus && webhook.lastDeliveryStatus < 400
                        ? "text-[var(--badge-green-text)]"
                        : "text-[var(--text-tertiary)]"
                    )}>
                      {webhook.lastDeliveryStatus || "—"}
                    </p>
                  </div>
                  <div className="p-2 rounded-lg bg-[var(--surface-0)]">
                    <p className="text-xs text-[var(--text-tertiary)]">Fallos consecutivos</p>
                    <p className={cn(
                      "text-sm font-medium",
                      (webhook.failureCount || 0) > 0 ? "text-[var(--badge-red-text)]" : "text-[var(--text-tertiary)]"
                    )}>
                      {webhook.failureCount || 0}
                    </p>
                  </div>
                </div>

                {/* Delivery history placeholder */}
                <WebhookDeliveryHistory webhookId={webhook._id} />
              </div>
            )}
          </div>
        ))}

        {(!webhooks || webhooks.length === 0) && (
          <div className="text-center py-8 text-[var(--text-tertiary)] text-sm">
            No hay webhooks configurados. Crea uno para recibir notificaciones.
          </div>
        )}
      </div>
    </div>
  );
}

function WebhookDeliveryHistory({ webhookId }: { webhookId: Id<"webhooks"> }) {
  const deliveries = useQuery(api.webhookEngine.getDeliveries, { webhookId });

  if (!deliveries || deliveries.length === 0) {
    return (
      <p className="text-xs text-[var(--text-tertiary)] text-center py-2">
        Sin entregas recientes
      </p>
    );
  }

  return (
    <div>
      <p className="text-xs font-medium text-[var(--text-tertiary)] mb-1">Últimas entregas</p>
      <div className="space-y-1 max-h-32 overflow-y-auto">
        {deliveries.slice(0, 5).map((d) => (
          <div key={d._id} className="flex items-center justify-between px-2 py-1 rounded text-xs">
            <div className="flex items-center gap-2">
              {d.status === "success" ? (
                <Check className="h-3 w-3 text-green-500" />
              ) : d.status === "pending" ? (
                <Clock className="h-3 w-3 text-yellow-500" />
              ) : (
                <X className="h-3 w-3 text-[var(--error)]" />
              )}
              <span className="text-[var(--text-secondary)]">{d.event}</span>
            </div>
            <div className="flex items-center gap-2 text-[var(--text-tertiary)]">
              {d.statusCode ? <span>{d.statusCode}</span> : null}
              <span>intento {d.attempt}</span>
              {d.sentAt && <span>{new Date(d.sentAt).toLocaleTimeString("es-CL")}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
