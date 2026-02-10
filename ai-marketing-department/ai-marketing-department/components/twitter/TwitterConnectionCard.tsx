"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/Toast";
import {
  Twitter,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { useState, useEffect } from "react";

interface TwitterConnectionCardProps {
  convexSiteUrl?: string;
}

export function TwitterConnectionCard({ convexSiteUrl }: TwitterConnectionCardProps) {
  const connection = useQuery(api.twitter.queries.getConnection);
  const disconnect = useMutation(api.twitter.mutations.disconnect);
  const { success, error: showError } = useToast();
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  // Check for OAuth callback results in URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const twitterStatus = params.get("twitter");
    const twitterName = params.get("name");
    const twitterError = params.get("error");

    if (twitterStatus === "connected" && twitterName) {
      success("Twitter conectado", `${twitterName} conectado exitosamente`);
      // Clean URL params
      window.history.replaceState({}, "", window.location.pathname);
    } else if (twitterStatus === "error" && twitterError) {
      showError("Error al conectar Twitter", twitterError);
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  const handleConnect = () => {
    // Redirect to Convex HTTP Action that starts OAuth
    const authUrl = convexSiteUrl
      ? `${convexSiteUrl}/twitter/auth`
      : "/api/twitter/auth"; // Fallback
    window.location.href = authUrl;
  };

  const handleDisconnect = async () => {
    if (!connection?._id) return;
    if (!window.confirm("¿Desconectar tu cuenta de Twitter/X?")) return;

    setIsDisconnecting(true);
    try {
      await disconnect({ connectionId: connection._id });
      success("Twitter desconectado", "Cuenta desconectada");
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
      color: "text-green-400",
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
      color: "text-stone-400",
      bg: "bg-stone-400/10",
      border: "border-stone-300",
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
          <div className="p-2 rounded-lg bg-[#1DA1F2]/10">
            <Twitter className="h-5 w-5 text-[#1DA1F2]" />
          </div>
          <div>
            <h4 className="font-medium text-white flex items-center gap-2">
              Twitter/X
              <span className={cn("inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full", config.bg, config.color)}>
                <StatusIcon className="h-3 w-3" />
                {config.label}
              </span>
            </h4>
            {connection ? (
              <div className="mt-1 space-y-1">
                <p className="text-sm text-stone-300">@{connection.username}</p>
                {connection.displayName && (
                  <p className="text-xs text-stone-500">{connection.displayName}</p>
                )}
                {connection.isExpiringSoon && (
                  <p className="text-xs text-yellow-400 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Token expira en {connection.expiresInDays} días
                  </p>
                )}
                {status === "expired" && (
                  <p className="text-xs text-yellow-400">
                    Token expirado, reconecta tu cuenta
                  </p>
                )}
                <p className="text-xs text-stone-500">
                  Publicaciones hoy: {connection.dailyTweetCount}/50
                </p>
              </div>
            ) : (
              <p className="text-sm text-stone-400 mt-1">
                Conecta tu cuenta de Twitter/X para publicar tweets y threads.
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2 shrink-0">
          {!connection || status === "disconnected" ? (
            <button
              onClick={handleConnect}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1DA1F2] text-white text-sm font-medium hover:bg-[#1a8cd8] transition-colors"
            >
              <Twitter className="h-4 w-4" />
              Conectar Twitter/X
            </button>
          ) : status === "expired" ? (
            <button
              onClick={handleConnect}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-yellow-500/10 text-yellow-400 text-sm font-medium hover:bg-yellow-500/20 transition-colors border border-yellow-500/30"
            >
              Reconectar
            </button>
          ) : (
            <>
              {connection.username && (
                <a
                  href={`https://twitter.com/${connection.username}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-stone-400 hover:text-stone-900 transition-colors"
                >
                  Ver perfil <ExternalLink className="h-3 w-3" />
                </a>
              )}
              <button
                onClick={handleDisconnect}
                disabled={isDisconnecting}
                className="text-xs text-stone-500 hover:text-red-400 transition-colors disabled:opacity-50"
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
