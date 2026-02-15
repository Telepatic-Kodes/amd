"use client";

import { useState } from "react";
import { useAction, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/Toast";
import { Mail, Loader2, CheckCircle2, AlertTriangle, Users } from "lucide-react";

interface SendEmailButtonProps {
  contentId: Id<"content">;
  contentBody: string;
  contentStatus: string;
  className?: string;
}

export function SendEmailButton({
  contentId,
  contentBody,
  contentStatus,
  className,
}: SendEmailButtonProps) {
  const connectionStatus = useQuery(api.email.queries.getConnectionStatus);
  const subscriberStats = useQuery(api.email.queries.getSubscriberStats);
  const sendHistory = useQuery(api.email.queries.getSendHistory, { contentId });
  const sendEmail = useAction(api.email.actions.sendEmail);
  const { success, error: showError } = useToast();

  const [isSending, setIsSending] = useState(false);
  const [sendResult, setSendResult] = useState<{
    sent: number;
    delivered: number;
    openRate: number;
    clickRate: number;
  } | null>(null);

  const isEligible = contentStatus === "approved" || contentStatus === "scheduled";
  const isConnected = connectionStatus?.isConnected;
  const activeSubscribers = subscriberStats?.active || 0;
  const alreadySent = sendHistory?.some((log) => log.status === "sent");

  // Already sent state
  if (alreadySent) {
    const lastSend = sendHistory?.find((log) => log.status === "sent");
    return (
      <div className={cn("space-y-2", className)}>
        <div className="flex items-center gap-2 text-sm">
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          <span className="text-emerald-500">Enviado por email</span>
          {lastSend?.sentAt && (
            <span className="text-xs text-[var(--text-tertiary)]">
              {new Date(lastSend.sentAt).toLocaleDateString("es-CL", {
                day: "numeric",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          )}
        </div>
        {lastSend?.metadata && (
          <div className="flex gap-3 text-xs text-[var(--text-tertiary)]">
            <span>Destinatarios: {lastSend.recipientCount}</span>
            {lastSend.metadata.openRate && (
              <span>Apertura: {lastSend.metadata.openRate}%</span>
            )}
            {lastSend.metadata.clickRate && (
              <span>Clicks: {lastSend.metadata.clickRate}%</span>
            )}
          </div>
        )}
      </div>
    );
  }

  // Don't show if not eligible
  if (!isEligible) return null;

  const handleSend = async () => {
    if (!isConnected) {
      showError("Sin conexión", "Configura un proveedor de email en Ajustes");
      return;
    }

    if (activeSubscribers === 0) {
      showError("Sin suscriptores", "Agrega suscriptores en la sección de email");
      return;
    }

    if (!window.confirm(`¿Enviar este contenido a ${activeSubscribers} suscriptores activos?`)) {
      return;
    }

    setIsSending(true);
    try {
      const result = await sendEmail({ contentId });
      if (result.metrics) {
        setSendResult(result.metrics);
      }
      success(
        "Email enviado",
        `Enviado a ${result.recipientCount} suscriptores`
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error desconocido";
      showError("Error al enviar", message);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center gap-2">
        <button
          onClick={handleSend}
          disabled={isSending || !isConnected || activeSubscribers === 0}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/10 text-[var(--success)] text-sm font-medium hover:bg-emerald-500/20 transition-colors border border-[var(--success)]/30 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Enviando...
            </>
          ) : (
            <>
              <Mail className="h-4 w-4" />
              Enviar por Email
            </>
          )}
        </button>

        {isConnected && activeSubscribers > 0 && (
          <span className="text-xs text-[var(--text-tertiary)] flex items-center gap-1">
            <Users className="h-3 w-3" />
            {activeSubscribers} suscriptores
          </span>
        )}

        {!isConnected && (
          <span className="text-xs text-yellow-500 flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            Sin proveedor conectado
          </span>
        )}
      </div>

      {/* Send result summary */}
      {sendResult && (
        <div className="p-3 rounded-lg bg-[var(--badge-green-bg)] border border-[var(--badge-green-bg)]">
          <p className="text-xs font-medium text-[var(--badge-green-text)] mb-1">
            Resultados del envío
          </p>
          <div className="grid grid-cols-4 gap-2 text-xs">
            <div>
              <p className="text-[var(--text-tertiary)]">Enviados</p>
              <p className="font-medium text-[var(--text-primary)]">{sendResult.sent}</p>
            </div>
            <div>
              <p className="text-[var(--text-tertiary)]">Entregados</p>
              <p className="font-medium text-[var(--text-primary)]">{sendResult.delivered}</p>
            </div>
            <div>
              <p className="text-[var(--text-tertiary)]">Apertura</p>
              <p className="font-medium text-[var(--text-primary)]">{sendResult.openRate}%</p>
            </div>
            <div>
              <p className="text-[var(--text-tertiary)]">Clicks</p>
              <p className="font-medium text-[var(--text-primary)]">{sendResult.clickRate}%</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
