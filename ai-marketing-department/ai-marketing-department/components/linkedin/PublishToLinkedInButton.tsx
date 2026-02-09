"use client";

import { useState } from "react";
import { useAction, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { translate } from "@/lib/language";
import { useToast } from "@/components/ui/Toast";
import { Linkedin, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { LinkedInPostPreview } from "./LinkedInPostPreview";

interface PublishToLinkedInButtonProps {
  contentId: Id<"content">;
  contentBody: string;
  contentStatus: string;
  className?: string;
}

export function PublishToLinkedInButton({
  contentId,
  contentBody,
  contentStatus,
  className,
}: PublishToLinkedInButtonProps) {
  const connectionStatus = useQuery(api.linkedin.queries.getConnectionStatus);
  const publishHistory = useQuery(api.linkedin.queries.getPublishHistory, {
    contentId,
  });
  const publishToLinkedIn = useAction(api.linkedin.actions.publishToLinkedIn);
  const { success, error: showError } = useToast();

  const [isPublishing, setIsPublishing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const isEligible = contentStatus === "approved" || contentStatus === "scheduled";
  const isConnected = connectionStatus?.isConnected;
  const alreadyPublished = publishHistory?.some(
    (log) => log.status === "published"
  );

  const handlePublish = async () => {
    if (!isConnected) {
      showError(translate("linkedinPublishError"), translate("linkedinNoConnection"));
      return;
    }

    if (!window.confirm("¿Publicar este contenido en LinkedIn?")) return;

    setIsPublishing(true);
    try {
      await publishToLinkedIn({ contentId });
      success(translate("linkedinPublished"), translate("linkedinPostSuccess"));
      setShowPreview(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error desconocido";
      showError(translate("linkedinPublishError"), message);
    } finally {
      setIsPublishing(false);
    }
  };

  // Don't show if not eligible for publishing
  if (!isEligible && !alreadyPublished) return null;

  // Already published state
  if (alreadyPublished) {
    const lastPublish = publishHistory?.find((log) => log.status === "published");
    return (
      <div className={cn("flex items-center gap-2 text-sm", className)}>
        <CheckCircle2 className="h-4 w-4 text-green-400" />
        <span className="text-green-400">{translate("linkedinPublished")}</span>
        {lastPublish?.publishedAt && (
          <span className="text-xs text-zinc-500">
            {new Date(lastPublish.publishedAt).toLocaleDateString("es-CL", {
              day: "numeric",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center gap-2">
        <button
          onClick={() => setShowPreview(!showPreview)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#0A66C2]/10 text-[#0A66C2] text-sm font-medium hover:bg-[#0A66C2]/20 transition-colors border border-[#0A66C2]/30"
        >
          <Linkedin className="h-4 w-4" />
          {showPreview ? translate("linkedinPreview") : translate("publishToLinkedIn")}
        </button>

        {!isConnected && (
          <span className="text-xs text-yellow-400 flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            {translate("linkedinNoConnection")}
          </span>
        )}

        {isConnected && connectionStatus.dailyPostCount !== undefined &&
          connectionStatus.dailyPostCount >= 10 && (
          <span className="text-xs text-yellow-400 flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            {translate("linkedinRateLimit")}
          </span>
        )}
      </div>

      {showPreview && (
        <div className="space-y-3">
          <LinkedInPostPreview
            commentary={contentBody}
            authorName={connectionStatus?.displayName || "Tu Nombre"}
            authorAvatar={connectionStatus?.profilePicture}
          />

          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowPreview(false)}
              className="px-3 py-1.5 rounded-lg text-sm text-zinc-400 hover:bg-zinc-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handlePublish}
              disabled={isPublishing || !isConnected || contentBody.length > 3000}
              className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-[#0A66C2] text-white text-sm font-medium hover:bg-[#004182] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPublishing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {translate("publishingToLinkedIn")}
                </>
              ) : (
                <>
                  <Linkedin className="h-4 w-4" />
                  {translate("publishToLinkedIn")}
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
