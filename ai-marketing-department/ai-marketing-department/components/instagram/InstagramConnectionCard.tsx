"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { cn } from "@/lib/utils";
import { translate } from "@/lib/language";
import { useToast } from "@/components/ui/Toast";
import {
  Instagram,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  ExternalLink,
  Loader2,
  Info,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useState, useEffect } from "react";

interface InstagramConnectionCardProps {
  convexSiteUrl?: string;
}

export function InstagramConnectionCard({ convexSiteUrl }: InstagramConnectionCardProps) {
  const connection = useQuery(api.instagram.queries.getConnection);
  const disconnect = useMutation(api.instagram.mutations.disconnect);
  const { success, error: showError } = useToast();
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [showFacebookInfo, setShowFacebookInfo] = useState(true);

  // Check for OAuth callback results in URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const instagramStatus = params.get("instagram");
    const instagramName = params.get("name");
    const instagramError = params.get("error");

    if (instagramStatus === "connected" && instagramName) {
      success("Instagram conectado", `@${instagramName} conectado exitosamente`);
      // Clean URL params
      window.history.replaceState({}, "", window.location.pathname);
    } else if (instagramStatus === "error" && instagramError) {
      showError("Error de conexión", instagramError);
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  const handleConnect = () => {
    // Redirect to Convex HTTP Action that starts Facebook OAuth (for Instagram)
    const authUrl = convexSiteUrl
      ? `${convexSiteUrl}/instagram/auth`
      : "/api/instagram/auth"; // Fallback
    window.location.href = authUrl;
  };

  const handleDisconnect = async () => {
    if (!connection?._id) return;
    if (!window.confirm("¿Desconectar tu cuenta de Instagram Business?")) return;

    setIsDisconnecting(true);
    try {
      await disconnect({ connectionId: connection._id });
      success("Instagram desconectado", "Cuenta desconectada");
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
      color: "text-zinc-400",
      bg: "bg-zinc-400/10",
      border: "border-zinc-700",
      label: "Desconectado",
    },
    pending_review: {
      icon: Clock,
      color: "text-blue-400",
      bg: "bg-blue-400/10",
      border: "border-blue-500/30",
      label: "Revisión pendiente",
    },
  };

  const status = connection?.status || "disconnected";
  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.disconnected;
  const StatusIcon = config.icon;

  return (
    <div className={cn("rounded-xl border p-5 transition-colors", config.border, config.bg)}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-tr from-[#833AB4] via-[#FD1D1D] to-[#FCAF45]">
            <Instagram className="h-5 w-5 text-white" />
          </div>
          <div>
            <h4 className="font-medium text-white flex items-center gap-2">
              Instagram Business
              <span className={cn("inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full", config.bg, config.color)}>
                <StatusIcon className="h-3 w-3" />
                {config.label}
              </span>
            </h4>
            {connection ? (
              <div className="mt-1 space-y-1">
                <p className="text-sm text-zinc-300">@{connection.username}</p>
                {connection.facebookPageName && (
                  <p className="text-xs text-zinc-400">
                    Página: {connection.facebookPageName}
                  </p>
                )}
                {connection.isExpiringSoon && (
                  <p className="text-xs text-yellow-400 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Token expira en {connection.expiresInDays} días
                  </p>
                )}
                {status === "expired" && (
                  <p className="text-xs text-yellow-400">
                    Token expirado - Reconectar para continuar
                  </p>
                )}
                <p className="text-xs text-zinc-500">
                  Publicaciones hoy: {connection.dailyPostCount}/25
                </p>
              </div>
            ) : (
              <p className="text-sm text-zinc-400 mt-1">
                Conecta tu cuenta de Instagram Business para publicar contenido
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2 shrink-0">
          {!connection || status === "disconnected" ? (
            <button
              onClick={handleConnect}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#FCAF45] text-white text-sm font-medium hover:opacity-90 transition-opacity"
            >
              <Instagram className="h-4 w-4" />
              Conectar Instagram
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
              <button
                onClick={handleDisconnect}
                disabled={isDisconnecting}
                className="text-xs text-zinc-500 hover:text-red-400 transition-colors disabled:opacity-50"
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

      {/* Facebook Business Requirement Explanation - Always Visible */}
      <div className="mt-4 pt-4 border-t border-zinc-800">
        <button
          onClick={() => setShowFacebookInfo(!showFacebookInfo)}
          className="flex items-center justify-between w-full text-left"
        >
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-blue-400" />
            <span className="text-sm font-medium text-zinc-300">
              Requisitos de Instagram Business API
            </span>
          </div>
          {showFacebookInfo ? (
            <ChevronUp className="h-4 w-4 text-zinc-500" />
          ) : (
            <ChevronDown className="h-4 w-4 text-zinc-500" />
          )}
        </button>

        {showFacebookInfo && (
          <div className="mt-3 p-3 rounded-lg bg-blue-500/5 border border-blue-500/20">
            <p className="text-xs text-zinc-400 mb-2">
              Instagram Business API requiere:
            </p>
            <ul className="text-xs text-zinc-400 space-y-1.5 ml-4">
              <li className="list-decimal">
                Una cuenta de Instagram de tipo <span className="text-zinc-300 font-medium">Business o Creator</span>
              </li>
              <li className="list-decimal">
                Vinculada a una <span className="text-zinc-300 font-medium">Página de Facebook</span>
              </li>
              <li className="list-decimal">
                Aprobación de <span className="text-zinc-300 font-medium">Meta App Review</span> (60-90 días)
              </li>
            </ul>
            <a
              href="https://help.instagram.com/502981923235522"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 mt-3 transition-colors"
            >
              Cómo convertir a cuenta Business
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        )}
      </div>

      {/* App Review Status (if applicable) */}
      {status === "pending_review" && (
        <div className="mt-3 p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
          <div className="flex items-start gap-2">
            <Clock className="h-4 w-4 text-blue-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-medium text-blue-300">
                App pendiente de revisión por Meta
              </p>
              <p className="text-xs text-zinc-400 mt-1">
                Mientras tanto, puedes probar la publicación con cuentas de prueba.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
