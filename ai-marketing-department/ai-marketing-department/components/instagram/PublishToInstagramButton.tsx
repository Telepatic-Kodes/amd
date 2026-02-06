"use client";

import { useState } from "react";
import { useAction, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { translate } from "@/lib/language";
import { useToast } from "@/components/ui/Toast";
import { Instagram, Loader2, CheckCircle2, AlertTriangle, Plus, X } from "lucide-react";
import { InstagramPostPreview } from "./InstagramPostPreview";
import { InstagramCarouselPreview } from "./InstagramCarouselPreview";

interface PublishToInstagramButtonProps {
  contentId: Id<"content">;
  contentBody: string;
  contentStatus: string;
  className?: string;
}

export function PublishToInstagramButton({
  contentId,
  contentBody,
  contentStatus,
  className,
}: PublishToInstagramButtonProps) {
  const connectionStatus = useQuery(api.instagram.queries.getConnectionStatus);
  const publishHistory = useQuery(api.instagram.queries.getPublishHistory, {
    contentId,
  });
  const publishToInstagram = useAction(api.instagram.actions.publishToInstagram);
  const { success, error: showError } = useToast();

  const [isPublishing, setIsPublishing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [isCarousel, setIsCarousel] = useState(false);
  const [carouselUrls, setCarouselUrls] = useState<string[]>([""]);

  const isEligible = contentStatus === "approved" || contentStatus === "scheduled";
  const isConnected = connectionStatus?.isConnected;
  const alreadyPublished = publishHistory?.some(
    (log) => log.status === "published"
  );

  const truncatedCaption = contentBody.substring(0, 2200);
  const captionTooLong = contentBody.length > 2200;

  // Client-side validation
  const validateInputs = (): { valid: boolean; error?: string } => {
    if (!imageUrl && !isCarousel) {
      return { valid: false, error: "Se requiere una imagen para publicar en Instagram" };
    }

    if (!imageUrl.startsWith("https://") && !isCarousel) {
      return { valid: false, error: "La URL de la imagen debe comenzar con https://" };
    }

    if (isCarousel) {
      const validUrls = carouselUrls.filter(url => url.trim().length > 0);
      if (validUrls.length < 2) {
        return { valid: false, error: "Un carrusel requiere al menos 2 imágenes" };
      }
      if (validUrls.length > 10) {
        return { valid: false, error: "Un carrusel puede tener máximo 10 imágenes" };
      }
      for (const url of validUrls) {
        if (!url.startsWith("https://")) {
          return { valid: false, error: "Todas las URLs deben comenzar con https://" };
        }
      }
    }

    if (captionTooLong) {
      return { valid: false, error: "El texto supera el límite de 2200 caracteres" };
    }

    return { valid: true };
  };

  const handlePublish = async () => {
    if (!isConnected) {
      showError("Error de conexión", "No hay cuenta de Instagram conectada");
      return;
    }

    const validation = validateInputs();
    if (!validation.valid) {
      showError("Error de validación", validation.error!);
      return;
    }

    const confirmMessage = isCarousel
      ? `¿Publicar carrusel de ${carouselUrls.filter(u => u.trim()).length} imágenes en Instagram?`
      : "¿Publicar en Instagram?";

    if (!window.confirm(confirmMessage)) return;

    setIsPublishing(true);
    try {
      if (isCarousel) {
        const validUrls = carouselUrls.filter(url => url.trim().length > 0);
        await publishToInstagram({ contentId, imageUrls: validUrls });
      } else {
        await publishToInstagram({ contentId, imageUrl });
      }
      success("Publicado en Instagram", "Post publicado exitosamente");
      setShowPreview(false);
    } catch (err: any) {
      showError("Error al publicar", err.message);
    } finally {
      setIsPublishing(false);
    }
  };

  const addCarouselImage = () => {
    if (carouselUrls.length < 10) {
      setCarouselUrls([...carouselUrls, ""]);
    }
  };

  const removeCarouselImage = (index: number) => {
    if (carouselUrls.length > 1) {
      setCarouselUrls(carouselUrls.filter((_, i) => i !== index));
    }
  };

  const updateCarouselUrl = (index: number, value: string) => {
    const newUrls = [...carouselUrls];
    newUrls[index] = value;
    setCarouselUrls(newUrls);
  };

  // Don't show if not eligible for publishing
  if (!isEligible && !alreadyPublished) return null;

  // Already published state
  if (alreadyPublished) {
    const lastPublish = publishHistory?.find((log) => log.status === "published");
    return (
      <div className={cn("flex items-center gap-2 text-sm", className)}>
        <CheckCircle2 className="h-4 w-4 text-green-400" />
        <span className="text-green-400">Publicado en Instagram</span>
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
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-[#833AB4]/10 via-[#FD1D1D]/10 to-[#FCAF45]/10 text-[#FD1D1D] text-sm font-medium hover:from-[#833AB4]/20 hover:via-[#FD1D1D]/20 hover:to-[#FCAF45]/20 transition-colors border border-[#FD1D1D]/30"
        >
          <Instagram className="h-4 w-4" />
          {showPreview ? "Vista previa" : "Publicar en Instagram"}
        </button>

        {!isConnected && (
          <span className="text-xs text-yellow-400 flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            No hay cuenta de Instagram conectada
          </span>
        )}

        {isConnected && connectionStatus.dailyPostCount !== undefined &&
          connectionStatus.dailyPostCount >= 25 && (
          <span className="text-xs text-yellow-400 flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            Límite diario alcanzado (25/25)
          </span>
        )}
      </div>

      {showPreview && (
        <div className="space-y-4 p-4 rounded-lg bg-zinc-900/50 border border-zinc-800">
          {/* Image URL Input */}
          {!isCarousel && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">
                URL de la imagen <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://ejemplo.com/imagen.jpg"
                className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#FD1D1D]/50"
              />
              <p className="text-xs text-zinc-500">
                La imagen debe ser JPEG o PNG, entre 320x320 y 1440x1440 píxeles
              </p>
              {imageUrl && !imageUrl.startsWith("https://") && (
                <p className="text-xs text-red-400">
                  La URL debe comenzar con https://
                </p>
              )}
            </div>
          )}

          {/* Carousel Toggle */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="carousel-toggle"
              checked={isCarousel}
              onChange={(e) => {
                setIsCarousel(e.target.checked);
                if (e.target.checked) {
                  setImageUrl("");
                  setCarouselUrls([""]);
                }
              }}
              className="w-4 h-4 rounded border-zinc-700 bg-zinc-800 text-[#FD1D1D] focus:ring-[#FD1D1D]/50"
            />
            <label htmlFor="carousel-toggle" className="text-sm text-zinc-300">
              Agregar más imágenes (carrusel)
            </label>
          </div>

          {/* Carousel URLs */}
          {isCarousel && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-zinc-300">
                  Imágenes del carrusel
                </p>
                <span className="text-xs text-zinc-500">
                  {carouselUrls.filter(u => u.trim()).length} de 10 imágenes
                </span>
              </div>
              {carouselUrls.map((url, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={url}
                    onChange={(e) => updateCarouselUrl(index, e.target.value)}
                    placeholder={`https://ejemplo.com/imagen${index + 1}.jpg`}
                    className="flex-1 px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#FD1D1D]/50"
                  />
                  {carouselUrls.length > 1 && (
                    <button
                      onClick={() => removeCarouselImage(index)}
                      className="px-2 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-red-400 hover:border-red-500/30 transition-colors"
                      aria-label="Eliminar imagen"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
              {carouselUrls.length < 10 && (
                <button
                  onClick={addCarouselImage}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-600 transition-colors text-sm"
                >
                  <Plus className="h-4 w-4" />
                  Agregar imagen
                </button>
              )}
              {carouselUrls.filter(u => u.trim()).length < 2 && carouselUrls.some(u => u.trim()) && (
                <p className="text-xs text-yellow-400">
                  Se requieren al menos 2 imágenes para un carrusel
                </p>
              )}
            </div>
          )}

          {/* Preview */}
          <div className="mt-4">
            <p className="text-sm font-medium text-zinc-300 mb-3">Vista previa:</p>
            {isCarousel ? (
              <InstagramCarouselPreview
                imageUrls={carouselUrls.filter(url => url.trim().length > 0)}
                caption={truncatedCaption}
                authorUsername={connectionStatus?.username || "usuario"}
                authorAvatar={connectionStatus?.profilePictureUrl}
              />
            ) : (
              <InstagramPostPreview
                imageUrl={imageUrl}
                caption={truncatedCaption}
                authorUsername={connectionStatus?.username || "usuario"}
                authorAvatar={connectionStatus?.profilePictureUrl}
                isCarousel={false}
              />
            )}
          </div>

          {/* Character Count Warning */}
          {captionTooLong && (
            <p className="text-sm text-red-400">
              El texto supera el límite de 2200 caracteres (actual: {contentBody.length})
            </p>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-3 border-t border-zinc-800">
            <button
              onClick={() => setShowPreview(false)}
              className="px-3 py-1.5 rounded-lg text-sm text-zinc-400 hover:bg-zinc-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handlePublish}
              disabled={isPublishing || !isConnected || captionTooLong || !validateInputs().valid}
              className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#FCAF45] text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPublishing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Publicando...
                </>
              ) : (
                <>
                  <Instagram className="h-4 w-4" />
                  Publicar
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
