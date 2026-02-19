"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/Toast";
import {
  HardDrive,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { useState, useEffect } from "react";

interface GoogleDriveConnectionCardProps {
  convexSiteUrl?: string;
}

export function GoogleDriveConnectionCard({ convexSiteUrl }: GoogleDriveConnectionCardProps) {
  const connection = useQuery(api.googledrive.queries.getConnection);
  const disconnect = useMutation(api.googledrive.mutations.disconnect);
  const { success, error: showError } = useToast();
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  // Check for OAuth callback results in URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const driveStatus = params.get("google_drive");
    const driveName = params.get("name");
    const driveError = params.get("error");

    if (driveStatus === "connected" && driveName) {
      success("Google Drive conectado", `${driveName} conectado exitosamente`);
      // Clean URL params
      window.history.replaceState({}, "", window.location.pathname);
    } else if (driveStatus === "error" && driveError) {
      showError("Error de conexión", driveError);
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [success, showError]);

  const handleConnect = () => {
    // Redirect to Convex HTTP Action that starts OAuth
    const authUrl = convexSiteUrl
      ? `${convexSiteUrl}/googledrive/auth`
      : "/api/googledrive/auth"; // Fallback
    window.location.href = authUrl;
  };

  const handleDisconnect = async () => {
    if (!connection?._id) return;
    if (!window.confirm("¿Desconectar tu cuenta de Google Drive?")) return;

    setIsDisconnecting(true);
    try {
      await disconnect({ connectionId: connection._id });
      success("Google Drive desconectado", "Cuenta desconectada");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error desconocido";
      showError("Error", message);
    } finally {
      setIsDisconnecting(false);
    }
  };

  const statusConfig = {
    connected: {
      icon: CheckCircle2,
      color: "text-[var(--success)]",
      bg: "bg-green-400/10",
      border: "border-green-500/30",
      label: "Conectado",
    },
    expired: {
      icon: AlertTriangle,
      color: "text-yellow-400",
      bg: "bg-yellow-400/10",
      border: "border-yellow-500/30",
      label: "Expirado",
    },
    disconnected: {
      icon: XCircle,
      color: "text-[var(--text-tertiary)]",
      bg: "bg-[var(--surface-2)]/10",
      border: "border-[var(--border)]",
      label: "Desconectado",
    },
  };

  const status = connection?.status || "disconnected";
  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.disconnected;
  const StatusIcon = config.icon;

  return (
    <div className={cn("rounded-xl border p-5 transition-colors", config.border, config.bg)}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-blue-500/10">
            <HardDrive className="h-5 w-5 text-blue-500" />
          </div>
          <div>
            <h4 className="font-medium text-[var(--text-primary)] flex items-center gap-2">
              Google Drive
              <span className={cn("inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full", config.bg, config.color)}>
                <StatusIcon className="h-3 w-3" />
                {config.label}
              </span>
            </h4>
            {connection ? (
              <div className="mt-1 space-y-1">
                <p className="text-sm text-[var(--text-tertiary)]">{connection.displayName}</p>
                {connection.email && (
                  <p className="text-xs text-[var(--text-tertiary)]">{connection.email}</p>
                )}
                {connection.isExpiringSoon && (
                  <p className="text-xs text-yellow-400 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Token expira pronto ({connection.expiresInDays} días)
                  </p>
                )}
                {status === "expired" && (
                  <p className="text-xs text-yellow-400">
                    Token expirado — reconecta para continuar
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-[var(--text-tertiary)] mt-1">
                Importa assets y documentos de marca
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2 shrink-0">
          {!connection || status === "disconnected" ? (
            <button
              onClick={handleConnect}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 transition-colors"
            >
              <HardDrive className="h-4 w-4" />
              Conectar Google Drive
            </button>
          ) : status === "expired" ? (
            <button
              onClick={handleConnect}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-yellow-500/10 text-yellow-400 text-sm font-medium hover:bg-yellow-500/20 transition-colors border border-yellow-500/30"
            >
              Reconectar Google Drive
            </button>
          ) : (
            <>
              {connection.profileUrl && (
                <a
                  href={connection.profileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
                >
                  Abrir Drive <ExternalLink className="h-3 w-3" />
                </a>
              )}
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}
