"use client";

import { useState } from "react";
import { useAction, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/Toast";
import { Twitter, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { TwitterPostPreview } from "./TwitterPostPreview";
import { TwitterThreadPreview } from "./TwitterThreadPreview";

interface PublishToTwitterButtonProps {
  contentId: Id<"content">;
  contentBody: string;
  contentStatus: string;
  className?: string;
}

/**
 * Client-side thread splitter - mirrors server-side logic
 * Splits text into 280-char chunks with thread indicators
 */
function splitIntoThread(text: string, maxLength: number = 280): string[] {
  const trimmedText = text.trim();

  // Case 1: Empty text
  if (trimmedText.length === 0) {
    return [];
  }

  // Case 2: Fits in single tweet
  if (trimmedText.length <= maxLength) {
    return [trimmedText];
  }

  // Case 3: Thread needed
  // First, estimate how many chunks we need
  const roughChunkCount = Math.ceil(trimmedText.length / maxLength);
  const indicatorLength = ` (${roughChunkCount}/${roughChunkCount})`.length;
  const effectiveMaxLength = maxLength - indicatorLength;

  // Split into chunks
  const chunks: string[] = [];
  let remaining = trimmedText;

  while (remaining.length > 0) {
    if (remaining.length <= effectiveMaxLength) {
      chunks.push(remaining.trim());
      break;
    }

    // Try to split on paragraph break
    const paragraphBreak = remaining.lastIndexOf("\n\n", effectiveMaxLength);
    if (paragraphBreak > effectiveMaxLength / 2) {
      chunks.push(remaining.substring(0, paragraphBreak).trim());
      remaining = remaining.substring(paragraphBreak + 2).trim();
      continue;
    }

    // Try to split on single newline
    const newlineBreak = remaining.lastIndexOf("\n", effectiveMaxLength);
    if (newlineBreak > effectiveMaxLength / 2) {
      chunks.push(remaining.substring(0, newlineBreak).trim());
      remaining = remaining.substring(newlineBreak + 1).trim();
      continue;
    }

    // Try to split on sentence break
    const sentenceBreak = findLastSentenceBreak(remaining, effectiveMaxLength);
    if (sentenceBreak > effectiveMaxLength / 2) {
      chunks.push(remaining.substring(0, sentenceBreak + 1).trim());
      remaining = remaining.substring(sentenceBreak + 1).trim();
      continue;
    }

    // Try to split on word boundary
    const spaceBreak = remaining.lastIndexOf(" ", effectiveMaxLength);
    if (spaceBreak > 0) {
      chunks.push(remaining.substring(0, spaceBreak).trim());
      remaining = remaining.substring(spaceBreak + 1).trim();
      continue;
    }

    // Last resort: truncate
    chunks.push(remaining.substring(0, effectiveMaxLength - 3) + "...");
    remaining = remaining.substring(effectiveMaxLength - 3).trim();
  }

  // Add thread indicators
  const tweets = chunks
    .filter(chunk => chunk.length > 0)
    .map((chunk, idx) => {
      const position = idx + 1;
      return `${chunk} (${position}/${chunks.length})`;
    });

  return tweets;
}

function findLastSentenceBreak(text: string, maxLength: number): number {
  const sentenceEnders = [". ", "! ", "? "];
  let lastBreak = -1;

  for (const ender of sentenceEnders) {
    const pos = text.lastIndexOf(ender, maxLength);
    if (pos > lastBreak) {
      lastBreak = pos;
    }
  }

  return lastBreak;
}

export function PublishToTwitterButton({
  contentId,
  contentBody,
  contentStatus,
  className,
}: PublishToTwitterButtonProps) {
  const connectionStatus = useQuery(api.twitter.queries.getConnectionStatus);
  const publishHistory = useQuery(api.twitter.queries.getPublishHistory, {
    contentId,
  });
  const publishToTwitter = useAction(api.twitter.actions.publishToTwitter);
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
      showError("Error al publicar", "Conecta tu cuenta de Twitter primero");
      return;
    }

    const tweets = splitIntoThread(contentBody);
    const confirmMessage = tweets.length > 1
      ? `¿Publicar este hilo de ${tweets.length} tweets en Twitter/X?`
      : "¿Publicar este tweet en Twitter/X?";

    if (!window.confirm(confirmMessage)) return;

    setIsPublishing(true);
    try {
      await publishToTwitter({ contentId });
      success("Publicado en Twitter", "Contenido publicado exitosamente");
      setShowPreview(false);
    } catch (err: any) {
      showError("Error al publicar", err.message);
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
        <span className="text-green-400">Publicado en Twitter</span>
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

  // Preview mode
  const tweets = splitIntoThread(contentBody);
  const isThread = tweets.length > 1;
  const totalChars = tweets.reduce((sum, tweet) => sum + tweet.length, 0);
  const isRateLimited = connectionStatus?.dailyTweetCount && connectionStatus.dailyTweetCount >= 50;

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center gap-2">
        <button
          onClick={() => setShowPreview(!showPreview)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#1DA1F2]/10 text-[#1DA1F2] text-sm font-medium hover:bg-[#1DA1F2]/20 transition-colors border border-[#1DA1F2]/30"
        >
          <Twitter className="h-4 w-4" />
          {showPreview ? "Vista Previa Twitter" : "Publicar en Twitter"}
        </button>

        {!isConnected && (
          <span className="text-xs text-yellow-400 flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            Conecta tu cuenta de Twitter primero
          </span>
        )}

        {isConnected && isRateLimited && (
          <span className="text-xs text-yellow-400 flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            Límite diario alcanzado (50 tweets/día)
          </span>
        )}

        {isConnected && isThread && (
          <span className="text-xs text-blue-400">
            Se publicará como hilo de {tweets.length} tweets
          </span>
        )}
      </div>

      {showPreview && (
        <div className="space-y-3">
          {isThread ? (
            <TwitterThreadPreview
              tweets={tweets}
              authorName={connectionStatus?.displayName || "Tu Nombre"}
              authorHandle={connectionStatus?.username || "tu_usuario"}
              authorAvatar={connectionStatus?.profileImageUrl}
            />
          ) : (
            <TwitterPostPreview
              text={tweets[0] || contentBody}
              authorName={connectionStatus?.displayName || "Tu Nombre"}
              authorHandle={connectionStatus?.username || "tu_usuario"}
              authorAvatar={connectionStatus?.profileImageUrl}
            />
          )}

          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowPreview(false)}
              className="px-3 py-1.5 rounded-lg text-sm text-zinc-400 hover:bg-zinc-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handlePublish}
              disabled={isPublishing || !isConnected || isRateLimited}
              className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-[#1DA1F2] text-white text-sm font-medium hover:bg-[#1a8cd8] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPublishing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Publicando...
                </>
              ) : (
                <>
                  <Twitter className="h-4 w-4" />
                  {isThread ? `Publicar hilo (${tweets.length} tweets)` : "Publicar tweet"}
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
