"use client";

import { useState } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@convex/_generated/api";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/Toast";
import {
  Mail,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
} from "lucide-react";

export function EmailConnectionCard() {
  const connection = useQuery(api.email.queries.getConnection);
  const connectProvider = useMutation(api.email.mutations.connectProvider);
  const disconnect = useMutation(api.email.mutations.disconnect);
  const validateApiKey = useAction(api.email.actions.validateApiKey);
  const { success, error: showError } = useToast();

  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [provider, setProvider] = useState<"sendgrid" | "resend" | "mailgun" | "mock">("mock");
  const [apiKey, setApiKey] = useState("");
  const [senderEmail, setSenderEmail] = useState("");
  const [senderName, setSenderName] = useState("");

  const handleTestConnection = async () => {
    setIsTesting(true);
    try {
      const result = await validateApiKey({ provider, apiKey: apiKey || "mock" });
      if (result.valid) {
        success("Conexión válida", result.message);
      } else {
        showError("Conexión inválida", result.message);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error desconocido";
      showError("Error", message);
    } finally {
      setIsTesting(false);
    }
  };

  const handleConnect = async () => {
    if (!senderEmail) {
      showError("Error", "El email del remitente es requerido");
      return;
    }
    if (!senderName) {
      showError("Error", "El nombre del remitente es requerido");
      return;
    }

    setIsConnecting(true);
    try {
      await connectProvider({
        provider,
        apiKey: apiKey || `mock_key_${Date.now()}`,
        senderEmail,
        senderName,
      });
      success("Email conectado", `Proveedor ${provider} configurado exitosamente`);
      setShowForm(false);
      setApiKey("");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error desconocido";
      showError("Error", message);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!connection?._id) return;
    if (!window.confirm("¿Desconectar el proveedor de email?")) return;

    setIsDisconnecting(true);
    try {
      await disconnect({ connectionId: connection._id });
      success("Desconectado", "Proveedor de email desconectado");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error desconocido";
      showError("Error", message);
    } finally {
      setIsDisconnecting(false);
    }
  };

  const isConnected = connection?.status === "connected";

  const statusConfig = isConnected
    ? {
        icon: CheckCircle2,
        color: "text-emerald-500",
        bg: "bg-emerald-500/10",
        border: "border-[var(--success)]/30",
        label: "Conectado",
      }
    : {
        icon: XCircle,
        color: "text-[var(--text-tertiary)]",
        bg: "bg-[var(--surface-2)]/10",
        border: "border-[var(--border)]",
        label: "Desconectado",
      };

  const StatusIcon = statusConfig.icon;

  return (
    <div className={cn("rounded-xl border p-5 transition-colors", statusConfig.border, statusConfig.bg)}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/10">
            <Mail className="h-5 w-5 text-emerald-500" />
          </div>
          <div>
            <h4 className="font-medium text-[var(--text-primary)] flex items-center gap-2">
              Email Marketing
              <span className={cn("inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full", statusConfig.bg, statusConfig.color)}>
                <StatusIcon className="h-3 w-3" />
                {statusConfig.label}
              </span>
            </h4>
            {connection ? (
              <div className="mt-1 space-y-1">
                <p className="text-sm text-[var(--text-tertiary)]">
                  {connection.senderName} ({connection.senderEmail})
                </p>
                <p className="text-xs text-[var(--text-tertiary)]">
                  Proveedor: <span className="font-medium capitalize">{connection.provider}</span>
                </p>
                <p className="text-xs text-[var(--text-tertiary)]">
                  Envíos hoy: {connection.dailySendCount}/{connection.dailySendLimit}
                </p>
              </div>
            ) : (
              <p className="text-sm text-[var(--text-tertiary)] mt-1">
                Conecta un proveedor de email para enviar newsletters y campañas
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2 shrink-0">
          {!connection ? (
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 text-white text-sm font-medium hover:bg-[var(--success)] transition-colors"
            >
              <Mail className="h-4 w-4" />
              Configurar
            </button>
          ) : (
            <button
              onClick={handleDisconnect}
              disabled={isDisconnecting}
              className="text-xs text-[var(--text-tertiary)] hover:text-[var(--error)] transition-colors disabled:opacity-50"
            >
              {isDisconnecting ? (
                <Loader2 className="h-3 w-3 animate-spin inline mr-1" />
              ) : null}
              Desconectar
            </button>
          )}
        </div>
      </div>

      {/* Connection Form */}
      {showForm && !connection && (
        <div className="mt-4 pt-4 border-t border-[var(--border)] space-y-3">
          {/* Provider */}
          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
              Proveedor
            </label>
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value as typeof provider)}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--card-bg)] py-2 px-3 text-sm text-[var(--text-primary)] focus:border-[var(--success)] focus:outline-none focus:ring-1 focus:ring-[var(--success)]"
            >
              <option value="mock">Mock (Pruebas)</option>
              <option value="sendgrid">SendGrid</option>
              <option value="resend">Resend</option>
              <option value="mailgun">Mailgun</option>
            </select>
          </div>

          {/* API Key (hidden for mock) */}
          {provider !== "mock" && (
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                API Key
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="SG.xxxxxx..."
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--card-bg)] py-2 px-3 text-sm text-[var(--text-primary)] placeholder-stone-400 focus:border-[var(--success)] focus:outline-none focus:ring-1 focus:ring-[var(--success)]"
              />
            </div>
          )}

          {/* Sender Email */}
          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
              Email del Remitente
            </label>
            <input
              type="email"
              inputMode="email"
              value={senderEmail}
              onChange={(e) => setSenderEmail(e.target.value)}
              placeholder="marketing@tuempresa.com"
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--card-bg)] py-2 px-3 text-sm text-[var(--text-primary)] placeholder-stone-400 focus:border-[var(--success)] focus:outline-none focus:ring-1 focus:ring-[var(--success)]"
            />
          </div>

          {/* Sender Name */}
          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
              Nombre del Remitente
            </label>
            <input
              type="text"
              value={senderName}
              onChange={(e) => setSenderName(e.target.value)}
              placeholder="Tu Empresa"
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--card-bg)] py-2 px-3 text-sm text-[var(--text-primary)] placeholder-stone-400 focus:border-[var(--success)] focus:outline-none focus:ring-1 focus:ring-[var(--success)]"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={handleTestConnection}
              disabled={isTesting}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[var(--success)]/30 bg-emerald-500/10 text-[var(--success)] text-sm font-medium hover:bg-emerald-500/20 transition-colors disabled:opacity-50"
            >
              {isTesting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <AlertCircle className="h-3.5 w-3.5" />
              )}
              Probar Conexión
            </button>
            <button
              onClick={handleConnect}
              disabled={isConnecting || !senderEmail || !senderName}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 text-white text-sm font-medium hover:bg-[var(--success)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isConnecting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="h-3.5 w-3.5" />
              )}
              Conectar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
