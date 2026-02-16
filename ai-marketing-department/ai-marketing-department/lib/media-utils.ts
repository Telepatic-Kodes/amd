export type MediaType = "image" | "video" | "audio" | "document" | "presentation";

export const MEDIA_TYPE_CONFIG: Record<
  MediaType,
  { label: string; extensions: string[]; mimePatterns: string[]; maxSizeMB: number; icon: string }
> = {
  image: {
    label: "Imágenes",
    extensions: [".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg"],
    mimePatterns: ["image/"],
    maxSizeMB: 10,
    icon: "Image",
  },
  video: {
    label: "Videos",
    extensions: [".mp4", ".mov", ".webm"],
    mimePatterns: ["video/"],
    maxSizeMB: 100,
    icon: "Video",
  },
  audio: {
    label: "Audio",
    extensions: [".mp3", ".wav", ".m4a", ".ogg"],
    mimePatterns: ["audio/"],
    maxSizeMB: 50,
    icon: "Music",
  },
  document: {
    label: "Documentos",
    extensions: [".pdf", ".docx", ".txt", ".md"],
    mimePatterns: ["application/pdf", "application/vnd.openxmlformats", "text/"],
    maxSizeMB: 10,
    icon: "FileText",
  },
  presentation: {
    label: "Presentaciones",
    extensions: [".pptx"],
    mimePatterns: ["application/vnd.openxmlformats-officedocument.presentationml"],
    maxSizeMB: 25,
    icon: "Presentation",
  },
};

export const ALL_ACCEPTED_EXTENSIONS = Object.values(MEDIA_TYPE_CONFIG).flatMap(
  (c) => c.extensions
);

export const ALL_ACCEPTED_MIME = Object.values(MEDIA_TYPE_CONFIG).flatMap(
  (c) => c.mimePatterns
);

export function detectMediaType(mimeType: string): MediaType {
  for (const [type, config] of Object.entries(MEDIA_TYPE_CONFIG)) {
    if (config.mimePatterns.some((p) => mimeType.startsWith(p))) {
      return type as MediaType;
    }
  }
  return "document";
}

export function validateMediaFile(
  file: File
): { valid: true } | { valid: false; error: string } {
  const mediaType = detectMediaType(file.type);
  const config = MEDIA_TYPE_CONFIG[mediaType];
  const maxBytes = config.maxSizeMB * 1024 * 1024;

  if (file.size > maxBytes) {
    return {
      valid: false,
      error: `${file.name} excede el límite de ${config.maxSizeMB}MB para ${config.label.toLowerCase()}`,
    };
  }

  const ext = "." + file.name.split(".").pop()?.toLowerCase();
  const allExts = Object.values(MEDIA_TYPE_CONFIG).flatMap((c) => c.extensions);
  if (!allExts.includes(ext)) {
    return { valid: false, error: `Tipo de archivo no soportado: ${ext}` };
  }

  return { valid: true };
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}
