"use client";

import { useState } from "react";
import { useQuery, useAction } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { translate } from "@/lib/language";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { useToast } from "@/components/ui/Toast";
import { Share2, Linkedin, Twitter, Instagram, Loader2, CheckCircle } from "lucide-react";
import { PlatformPreviewGrid } from "./PlatformPreviewGrid";

interface CrossPlatformPublishPanelProps {
  contentId: Id<"content">;
  contentBody: string;
  contentStatus: string;
  contentHashtags?: string[];
  className?: string;
}

export function CrossPlatformPublishPanel({
  contentId,
  contentBody,
  contentStatus,
  contentHashtags,
  className,
}: CrossPlatformPublishPanelProps) {
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [instagramImageUrl, setInstagramImageUrl] = useState("");
  const { success, error: showError } = useToast();

  // Query connection status for each platform
  const linkedinConnection = useQuery(api.linkedin.queries.getConnection);
  const twitterConnection = useQuery(api.twitter.queries.getConnection);
  const instagramConnection = useQuery(api.instagram.queries.getConnection);

  // Batch publish action
  const publishToMultiplePlatforms = useAction(
    api.crossPlatform.actions.publishToMultiplePlatforms
  );

  const [isPublishing, setIsPublishing] = useState(false);

  // Check eligibility
  const isEligible =
    contentStatus === "approved" ||
    contentStatus === "scheduled" ||
    contentStatus === "published";

  if (!isEligible) {
    return null;
  }

  const handlePlatformToggle = (platform: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platform)
        ? prev.filter((p) => p !== platform)
        : [...prev, platform]
    );
  };

  const handlePublish = async () => {
    if (selectedPlatforms.length === 0) {
      showError("Error", "Selecciona al menos una plataforma");
      return;
    }

    // Validate Instagram image URL if Instagram is selected
    if (selectedPlatforms.includes("instagram") && !instagramImageUrl) {
      showError("Error", translate("imageUrlRequired"));
      return;
    }

    // Validate Instagram image URL format
    if (selectedPlatforms.includes("instagram") && instagramImageUrl) {
      if (!instagramImageUrl.startsWith("https://")) {
        showError("Error", "La URL de Instagram debe comenzar con https://");
        return;
      }
    }

    setIsPublishing(true);

    try {
      const result = await publishToMultiplePlatforms({
        contentId,
        platforms: selectedPlatforms,
        instagramImageUrl: selectedPlatforms.includes("instagram")
          ? instagramImageUrl
          : undefined,
      });

      // Show per-platform results
      result.results.forEach((platformResult) => {
        if (platformResult.success) {
          success(
            translate("publishSuccess").replace(
              "{platform}",
              platformResult.platform.charAt(0).toUpperCase() +
                platformResult.platform.slice(1)
            ),
            platformResult.url || ""
          );
        } else {
          showError(
            translate("publishError").replace(
              "{platform}",
              platformResult.platform.charAt(0).toUpperCase() +
                platformResult.platform.slice(1)
            ),
            platformResult.error || "Error desconocido"
          );
        }
      });

      // Check if all platforms succeeded
      const allSuccess = result.results.every((r) => r.success);
      const failureCount = result.results.filter((r) => !r.success).length;

      if (allSuccess) {
        success(
          translate("allPlatformsSuccess"),
          `Publicado en ${result.results.length} plataforma(s)`
        );
      } else if (failureCount > 0) {
        showError(
          translate("someFailures").replace("{N}", failureCount.toString()),
          "Revisa los errores arriba"
        );
      }
    } catch (err: any) {
      showError("Error al publicar", err.message || "Error desconocido");
    } finally {
      setIsPublishing(false);
    }
  };

  // Platform connection status
  const platforms = [
    {
      id: "linkedin",
      label: "LinkedIn",
      icon: Linkedin,
      color: "text-[#0A66C2]",
      bgColor: "bg-[#0A66C2]/10",
      borderColor: "border-[#0A66C2]/20",
      connection: linkedinConnection,
    },
    {
      id: "twitter",
      label: "Twitter/X",
      icon: Twitter,
      color: "text-[#1DA1F2]",
      bgColor: "bg-[#1DA1F2]/10",
      borderColor: "border-[#1DA1F2]/20",
      connection: twitterConnection,
    },
    {
      id: "instagram",
      label: "Instagram",
      icon: Instagram,
      color: "text-[#E4405F]",
      bgColor: "bg-gradient-to-r from-[#833AB4]/10 via-[#FD1D1D]/10 to-[#FCAF45]/10",
      borderColor: "border-[#E4405F]/20",
      connection: instagramConnection,
    },
  ];

  return (
    <Card className={cn("border-zinc-800 bg-zinc-950/50", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
            <Share2 className="h-4 w-4 text-indigo-500" />
            {translate("crossPlatformPublish")}
          </h3>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0 space-y-4">
        {/* Platform Selection */}
        <div>
          <p className="text-xs text-zinc-500 mb-2 uppercase tracking-wider">
            {translate("selectPlatforms")}
          </p>
          <div className="space-y-2">
            {platforms.map((platform) => {
              const Icon = platform.icon;
              const isConnected = !!platform.connection;
              const isSelected = selectedPlatforms.includes(platform.id);

              return (
                <label
                  key={platform.id}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer",
                    isConnected
                      ? "hover:bg-zinc-900/50"
                      : "opacity-50 cursor-not-allowed",
                    isSelected && isConnected
                      ? `${platform.borderColor} ${platform.bgColor}`
                      : "border-zinc-800"
                  )}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handlePlatformToggle(platform.id)}
                    disabled={!isConnected || isPublishing}
                    className="w-4 h-4 rounded border-zinc-700 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-0 disabled:opacity-50"
                  />
                  <Icon className={cn("h-4 w-4", platform.color)} />
                  <span className="text-sm text-white flex-1">
                    {platform.label}
                  </span>
                  {isConnected ? (
                    <span className="text-xs text-green-400 flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Conectado
                    </span>
                  ) : (
                    <span className="text-xs text-zinc-500">
                      {translate("notConnected")}
                    </span>
                  )}
                </label>
              );
            })}
          </div>
        </div>

        {/* Side-by-side Preview */}
        {selectedPlatforms.length > 0 && (
          <div>
            <p className="text-xs text-zinc-500 mb-2 uppercase tracking-wider">
              {translate("platformPreview")}
            </p>
            <PlatformPreviewGrid
              contentBody={contentBody}
              selectedPlatforms={selectedPlatforms}
              hashtags={contentHashtags}
            />
          </div>
        )}

        {/* Instagram Image URL Input */}
        {selectedPlatforms.includes("instagram") && (
          <div>
            <label className="text-xs text-zinc-500 mb-2 block uppercase tracking-wider">
              URL de Imagen Instagram (HTTPS)
            </label>
            <input
              type="url"
              value={instagramImageUrl}
              onChange={(e) => setInstagramImageUrl(e.target.value)}
              placeholder="https://example.com/image.jpg"
              disabled={isPublishing}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-950/50 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
            />
            <p className="text-xs text-zinc-500 mt-1">
              Requerido para publicar en Instagram
            </p>
          </div>
        )}

        {/* Publish Button */}
        <button
          onClick={handlePublish}
          disabled={selectedPlatforms.length === 0 || isPublishing}
          className={cn(
            "w-full px-4 py-2.5 rounded-lg font-medium transition-all flex items-center justify-center gap-2",
            selectedPlatforms.length === 0 || isPublishing
              ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
              : "bg-indigo-600 hover:bg-indigo-700 text-white"
          )}
        >
          {isPublishing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {translate("publishingToMultiple")}
            </>
          ) : (
            translate("publishToSelected").replace(
              "{N}",
              selectedPlatforms.length.toString()
            )
          )}
        </button>

        {/* Publish Status Summary */}
        <div className="pt-3 border-t border-zinc-800">
          <p className="text-xs text-zinc-500 mb-2">
            Estado de publicación
          </p>
          <div className="flex items-center gap-2 text-xs">
            {/* Show colored dots for published platforms */}
            <div className="flex gap-1.5">
              {platforms.map((platform) => (
                <div
                  key={platform.id}
                  className={cn(
                    "w-2 h-2 rounded-full transition-opacity",
                    selectedPlatforms.includes(platform.id)
                      ? "opacity-100"
                      : "opacity-20",
                    platform.id === "linkedin" && "bg-[#0A66C2]",
                    platform.id === "twitter" && "bg-[#1DA1F2]",
                    platform.id === "instagram" &&
                      "bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#FCAF45]"
                  )}
                  title={platform.label}
                />
              ))}
            </div>
            <span className="text-zinc-400">
              {selectedPlatforms.length === 0
                ? "Selecciona plataformas"
                : `${selectedPlatforms.length} seleccionada(s)`}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
