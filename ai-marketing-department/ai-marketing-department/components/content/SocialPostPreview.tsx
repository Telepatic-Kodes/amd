"use client";

import { memo, useState, type ReactNode } from "react";
import { Linkedin, Twitter, Instagram, Heart, MessageCircle, Repeat2, Share, Send, BookmarkPlus, ThumbsUp, MoreHorizontal, Globe, ChevronLeft, ChevronRight, Image as ImageIcon, Play, Music2, Eye, UserPlus, Mail, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

// ── Helpers ──────────────────────────────────────────────

/** Parse text with **bold** markers and newlines into React nodes */
function renderFormattedText(text: string, preserveParagraphs = false): ReactNode[] {
  // If preserveParagraphs, split on double-newline or emoji-sentence boundaries
  let lines: string[];
  if (preserveParagraphs) {
    // Common emojis used at the start of social media caption sentences
    const emojiList = "📊💼🌟🔥👉🧵🔍✨💡🚀❤️⭐✅❌📈📉🎯💰🏆📌🎉💪🎊☀️🌍🌈🤔❓✍️🙌👀💎🏅📣📢🛡️⚡🌱🏠🧡💚💙💛🤍🖤💜🩵🎁🤩😍🙏👏👋💬🔗📱💻🖼️📷🎥🎬📝🔑🏷️";
    // Normalize --- separators to newlines first
    const normalized = text.replace(/\s*---+\s*/g, "\n\n");
    // Split on actual newlines, then further split each line on emoji boundaries
    lines = normalized
      .split(/\n+/)
      .flatMap((line) => {
        const trimmed = line.trim();
        if (!trimmed) return [];
        // Split before emoji characters that start new sentences
        return trimmed
          .split(new RegExp(`\\s(?=[${emojiList}])`, "g"))
          .map((l) => l.trim())
          .filter((l) => l.length > 0);
      });
  } else {
    lines = text.split("\n");
  }

  const nodes: ReactNode[] = [];

  lines.forEach((line, lineIdx) => {
    if (lineIdx > 0) {
      nodes.push(preserveParagraphs ? <br key={`br1-${lineIdx}`} /> : null);
      nodes.push(<br key={`br-${lineIdx}`} />);
    }

    const parts = line.split(/(\*\*.*?\*\*)/g);
    parts.forEach((part, partIdx) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        nodes.push(
          <strong key={`${lineIdx}-${partIdx}`}>
            {part.slice(2, -2)}
          </strong>
        );
      } else if (part) {
        nodes.push(part);
      }
    });
  });

  return nodes;
}

/** Extract hashtags from text */
function extractHashtags(text: string): { clean: string; hashtags: string[] } {
  const hashtagRegex = /#[\w\u00C0-\u024F]+/g;
  const hashtags = text.match(hashtagRegex) || [];
  const clean = text.replace(hashtagRegex, "").replace(/\s{2,}/g, " ").trim();
  return { clean, hashtags };
}

/**
 * Parse AI-generated Instagram body to extract the actual caption,
 * hashtags, carousel detection, and slide descriptions.
 */
function parseInstagramBody(raw: string): {
  caption: string;
  hashtags: string[];
  isCarousel: boolean;
  slideDescriptions: string[];
} {
  const hasStructuredFormat = /##\s*Contenido|Caption:|Visual Sugerido:/i.test(raw);

  if (!hasStructuredFormat) {
    const { clean, hashtags } = extractHashtags(raw);
    return { caption: clean, hashtags, isCarousel: false, slideDescriptions: [] };
  }

  const isCarousel = /Visual Sugerido:\s*Carrusel/i.test(raw);

  // Extract slide descriptions
  const slideDescriptions: string[] = [];
  const slideRegex = /\*?\*?Imagen\s*(\d+):\*?\*?\s*(.+)/gi;
  let slideMatch;
  while ((slideMatch = slideRegex.exec(raw)) !== null) {
    slideDescriptions.push(slideMatch[2].trim());
  }

  // Extract caption
  let caption = "";
  const captionMatch = raw.match(/\*?\*?Caption:\*?\*?\s*([\s\S]*?)(?=---|\*?\*?Hashtags:|\s*$)/i);
  if (captionMatch) {
    caption = captionMatch[1].trim();
  } else {
    caption = raw
      .replace(/##\s*Contenido\s*Mejorado/gi, "")
      .replace(/Tipo:\s*\S+/gi, "")
      .replace(/Título:\s*[^\n]+/gi, "")
      .replace(/Visual Sugerido:\s*[^\n]+/gi, "")
      .replace(/\*?\*?Imagen\s*\d+:\*?\*?\s*[^\n]+/gi, "")
      .replace(/\*?\*?Caption:\*?\*?/gi, "")
      .replace(/\*?\*?Hashtags:\*?\*?/gi, "")
      .replace(/---/g, "")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  // Extract hashtags
  const hashtagsSectionMatch = raw.match(/\*?\*?Hashtags:\*?\*?\s*([\s\S]*?)$/i);
  const hashtagsSection = hashtagsSectionMatch ? hashtagsSectionMatch[1].trim() : "";
  const { clean: cleanCaption, hashtags: captionHashtags } = extractHashtags(caption);
  const sectionHashtags = hashtagsSection ? (hashtagsSection.match(/#[\w\u00C0-\u024F]+/g) || []) : [];
  const allHashtags = sectionHashtags.length > 0 ? sectionHashtags : captionHashtags;

  return {
    caption: cleanCaption || caption,
    hashtags: allHashtags,
    isCarousel,
    slideDescriptions,
  };
}

/**
 * Generic parser for AI-generated structured body content.
 * Works for LinkedIn, TikTok, and other platforms.
 * Strips structural markers and extracts clean caption + hashtags.
 */
function parseStructuredBody(raw: string): { caption: string; hashtags: string[] } {
  const hasStructuredFormat = /##\s*Contenido|Caption:|Texto:|Guión:|Script:/i.test(raw);

  if (!hasStructuredFormat) {
    const { clean, hashtags } = extractHashtags(raw);
    return { caption: clean, hashtags };
  }

  // Try to extract caption from known markers
  let caption = "";
  const captionMatch = raw.match(/(?:\*?\*?(?:Caption|Texto|Guión|Script|Copy):\*?\*?)\s*([\s\S]*?)(?=---|\*?\*?Hashtags:|\*?\*?Música:|\*?\*?Audio:|\s*$)/i);
  if (captionMatch) {
    caption = captionMatch[1].trim();
  } else {
    // Fallback: strip all structural markers
    caption = raw
      .replace(/##\s*Contenido\s*(?:Mejorado)?/gi, "")
      .replace(/Tipo:\s*[^\n]+/gi, "")
      .replace(/Título:\s*[^\n]+/gi, "")
      .replace(/Formato:\s*[^\n]+/gi, "")
      .replace(/Duración:\s*[^\n]+/gi, "")
      .replace(/Visual Sugerido:\s*[^\n]+/gi, "")
      .replace(/Música Sugerida:\s*[^\n]+/gi, "")
      .replace(/\*?\*?Imagen\s*\d+:\*?\*?\s*[^\n]+/gi, "")
      .replace(/\*?\*?Escena\s*\d+:\*?\*?\s*[^\n]+/gi, "")
      .replace(/\*?\*?(?:Caption|Texto|Guión|Script|Copy):\*?\*?/gi, "")
      .replace(/\*?\*?Hashtags:\*?\*?/gi, "")
      .replace(/\*?\*?(?:Música|Audio):\*?\*?/gi, "")
      .replace(/---/g, "")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  // Extract hashtags
  const hashtagsSectionMatch = raw.match(/\*?\*?Hashtags:\*?\*?\s*([\s\S]*?)(?=---|$)/i);
  const hashtagsSection = hashtagsSectionMatch ? hashtagsSectionMatch[1].trim() : "";
  const { clean: cleanCaption, hashtags: captionHashtags } = extractHashtags(caption);
  const sectionHashtags = hashtagsSection ? (hashtagsSection.match(/#[\w\u00C0-\u024F]+/g) || []) : [];
  const allHashtags = sectionHashtags.length > 0 ? sectionHashtags : captionHashtags;

  // Normalize separators and ensure paragraph breaks before bold headers
  const finalCaption = (cleanCaption || caption)
    .replace(/\s*---+\s*/g, "\n\n")
    .replace(/(?<!\n)\s*(?=\*\*[A-ZÁÉÍÓÚÑ¿])/g, "\n\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return { caption: finalCaption, hashtags: allHashtags };
}

/**
 * Extract TikTok-specific metadata from structured body (scenes, music, duration).
 */
function parseTikTokBody(raw: string): {
  caption: string;
  hashtags: string[];
  scenes: string[];
  music: string;
  duration: string;
} {
  const base = parseStructuredBody(raw);

  // Extract scenes
  const scenes: string[] = [];
  const sceneRegex = /\*?\*?Escena\s*(\d+):\*?\*?\s*(.+)/gi;
  let sceneMatch;
  while ((sceneMatch = sceneRegex.exec(raw)) !== null) {
    scenes.push(sceneMatch[2].trim());
  }

  // Extract music suggestion (strip ** bold markers)
  const musicMatch = raw.match(/\*?\*?(?:Música Sugerida|Música|Audio):?\*?\*?\s*([^\n]+)/i);
  const music = musicMatch ? musicMatch[1].replace(/\*\*/g, "").trim() : "";

  // Extract duration (strip ** bold markers)
  const durationMatch = raw.match(/\*?\*?Duración:?\*?\*?\s*([^\n]+)/i);
  const duration = durationMatch ? durationMatch[1].replace(/\*\*/g, "").trim() : "";

  return { ...base, scenes, music, duration };
}

// ── Props ────────────────────────────────────────────────

interface ContentAsset {
  type: "image" | "video" | "document";
  url: string;
  alt?: string;
}

interface SocialPostPreviewProps {
  body: string;
  type: string;
  title?: string;
  brandName?: string;
  brandInitial?: string;
  imageUrl?: string;
  assets?: ContentAsset[];
}

// ── LinkedIn Preview ─────────────────────────────────────

function LinkedInPreview({ body, brandName, brandInitial, imageUrl, assets }: {
  body: string;
  brandName: string;
  brandInitial: string;
  imageUrl?: string;
  assets?: ContentAsset[];
}) {
  const parsed = parseStructuredBody(body);
  const firstImage = assets?.find((a) => a.type === "image") || (imageUrl ? { url: imageUrl, alt: "LinkedIn post" } : null);

  return (
    <div className="bg-[var(--card-bg)] rounded-lg border border-[var(--border)] overflow-hidden max-w-2xl mx-auto shadow-sm">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 flex items-start gap-3">
        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center text-white font-bold text-lg shrink-0">
          {brandInitial}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[var(--text-primary)]">{brandName}</p>
          <p className="text-xs text-[var(--text-tertiary)]">Marketing Department</p>
          <div className="flex items-center gap-1 text-xs text-[var(--text-tertiary)] mt-0.5">
            <span>Ahora</span>
            <span>·</span>
            <Globe className="h-3 w-3" />
          </div>
        </div>
        <MoreHorizontal className="h-5 w-5 text-[var(--text-tertiary)] shrink-0" />
      </div>

      {/* Body */}
      <div className="px-4 pb-3">
        <p className="text-sm text-[var(--text-primary)] leading-relaxed whitespace-pre-line">
          {renderFormattedText(parsed.caption, true)}
        </p>
        {parsed.hashtags.length > 0 && (
          <p className="text-sm text-[#0A66C2] mt-2">
            {parsed.hashtags.join(" ")}
          </p>
        )}
      </div>

      {/* Image */}
      {firstImage && (
        <div className="w-full aspect-[1.91/1] bg-[var(--surface-1)]">
          <img
            src={firstImage.url}
            alt={("alt" in firstImage ? firstImage.alt : undefined) || "LinkedIn post"}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Engagement stats */}
      <div className="px-4 py-2 flex items-center justify-between border-t border-[var(--border)]">
        <div className="flex items-center gap-1 text-xs text-[var(--text-tertiary)]">
          <span className="flex -space-x-1">
            <span className="h-4 w-4 rounded-full bg-blue-500 border border-white flex items-center justify-center">
              <ThumbsUp className="h-2.5 w-2.5 text-white" />
            </span>
            <span className="h-4 w-4 rounded-full bg-red-500 border border-white flex items-center justify-center">
              <Heart className="h-2.5 w-2.5 text-white" />
            </span>
          </span>
          <span className="ml-1 text-[var(--text-tertiary)]">Vista previa</span>
        </div>
      </div>

      {/* Actions */}
      <div className="px-4 py-1 border-t border-[var(--border)] flex items-center justify-around">
        {[
          { icon: ThumbsUp, label: "Recomendar" },
          { icon: MessageCircle, label: "Comentar" },
          { icon: Repeat2, label: "Difundir" },
          { icon: Send, label: "Enviar" },
        ].map(({ icon: Icon, label }) => (
          <button key={label} className="flex items-center gap-2 px-3 py-2.5 rounded hover:bg-[var(--surface-0)] text-[var(--text-tertiary)] transition-colors">
            <Icon className="h-4 w-4" />
            <span className="text-xs font-medium">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Twitter/X Preview ────────────────────────────────────

function TwitterPreview({ body, brandName, brandInitial }: { body: string; brandName: string; brandInitial: string }) {
  // Split thread by numbered markers (1/5, 2/5, etc.)
  const threadParts = body.split(/(?=\d+\/\d+\s)/).filter(Boolean);
  const tweets = threadParts.length > 1 ? threadParts : [body];
  const handle = brandName.toLowerCase().replace(/\s+/g, "");

  return (
    <div className="max-w-xl mx-auto space-y-0">
      {tweets.map((tweet, i) => {
        const { clean, hashtags } = extractHashtags(tweet.trim());
        const isLast = i === tweets.length - 1;

        return (
          <div
            key={i}
            className={cn(
              "bg-[var(--card-bg)] border border-[var(--border)] px-4 py-3",
              i === 0 && "rounded-t-xl",
              isLast && "rounded-b-xl",
              !isLast && "border-b-0"
            )}
          >
            <div className="flex gap-3">
              {/* Avatar + thread line */}
              <div className="flex flex-col items-center">
                <div className="h-10 w-10 rounded-full bg-[var(--surface-3)] flex items-center justify-center text-white font-bold text-sm shrink-0">
                  {brandInitial}
                </div>
                {!isLast && (
                  <div className="w-0.5 flex-1 bg-[var(--surface-2)] mt-1" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 pb-1">
                <div className="flex items-center gap-1 mb-0.5">
                  <span className="text-sm font-bold text-[var(--text-primary)]">{brandName}</span>
                  <svg className="h-4 w-4 text-blue-400 shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.998-3.818-3.998-.47 0-.92.084-1.336.25C14.818 2.415 13.51 1.5 12 1.5s-2.816.917-3.437 2.25c-.415-.165-.866-.25-1.336-.25-2.11 0-3.818 1.79-3.818 4 0 .494.083.964.237 1.4-1.272.65-2.147 2.018-2.147 3.6 0 1.495.782 2.798 1.942 3.486-.02.17-.032.34-.032.514 0 2.21 1.708 4 3.818 4 .47 0 .92-.086 1.335-.25.62 1.334 1.926 2.25 3.437 2.25 1.512 0 2.818-.916 3.437-2.25.415.163.865.248 1.336.248 2.11 0 3.818-1.79 3.818-4 0-.174-.012-.344-.033-.513 1.158-.687 1.943-1.99 1.943-3.484zm-6.616-3.334l-4.334 6.5c-.145.217-.382.334-.625.334-.143 0-.288-.04-.416-.126l-.115-.094-2.415-2.415c-.293-.293-.293-.768 0-1.06s.768-.294 1.06 0l1.77 1.767 3.825-5.74c.23-.345.696-.436 1.04-.207.346.23.44.696.21 1.04z" /></svg>
                  <span className="text-xs text-[var(--text-tertiary)]">@{handle} · ahora</span>
                </div>
                <p className="text-sm text-[var(--text-primary)] leading-relaxed">
                  {renderFormattedText(clean)}
                </p>
                {hashtags.length > 0 && (
                  <p className="text-sm text-[#1DA1F2] mt-1">
                    {hashtags.join(" ")}
                  </p>
                )}

                {/* Tweet actions */}
                <div className="flex items-center justify-between mt-3 max-w-[300px]">
                  {[MessageCircle, Repeat2, Heart, BookmarkPlus, Share].map((Icon, idx) => (
                    <button key={idx} className="p-1.5 rounded-full hover:bg-[var(--badge-blue-bg)] text-[var(--text-tertiary)] hover:text-blue-500 transition-colors">
                      <Icon className="h-4 w-4" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Instagram Preview ────────────────────────────────────

function InstagramPreview({ body, brandName, brandInitial, imageUrl, assets }: {
  body: string;
  brandName: string;
  brandInitial: string;
  imageUrl?: string;
  assets?: ContentAsset[];
}) {
  const parsed = parseInstagramBody(body);
  const handle = brandName.toLowerCase().replace(/\s+/g, "");

  // Determine images: real assets first, then single imageUrl fallback
  const imageAssets = assets?.filter((a) => a.type === "image") || [];
  const images = imageAssets.length > 0
    ? imageAssets.map((a) => ({ url: a.url, alt: a.alt }))
    : imageUrl
      ? [{ url: imageUrl, alt: "Instagram post" }]
      : [];

  // Carousel if: multiple images, or AI suggested carousel with slide descriptions
  const isCarousel = images.length > 1 || (parsed.isCarousel && parsed.slideDescriptions.length > 1);
  const totalSlides = isCarousel
    ? Math.max(images.length, parsed.slideDescriptions.length)
    : 1;

  return (
    <div className="max-w-lg mx-auto space-y-3">
      {/* Post type badge */}
      {isCarousel && (
        <div className="flex items-center justify-center gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-pink-500 bg-pink-50 px-2.5 py-1 rounded-full border border-pink-200">
            Carrusel · {totalSlides} slides
          </span>
        </div>
      )}

      <InstagramPostCard
        handle={handle}
        brandInitial={brandInitial}
        caption={parsed.caption}
        hashtags={parsed.hashtags}
        images={images}
        isCarousel={isCarousel}
        totalSlides={totalSlides}
        slideDescriptions={parsed.slideDescriptions}
      />
    </div>
  );
}

/** Instagram post card with carousel support */
function InstagramPostCard({ handle, brandInitial, caption, hashtags, images, isCarousel, totalSlides, slideDescriptions }: {
  handle: string;
  brandInitial: string;
  caption: string;
  hashtags: string[];
  images: { url: string; alt?: string }[];
  isCarousel: boolean;
  totalSlides: number;
  slideDescriptions: string[];
}) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const goNext = () => setCurrentSlide((p) => (p < totalSlides - 1 ? p + 1 : 0));
  const goPrev = () => setCurrentSlide((p) => (p > 0 ? p - 1 : totalSlides - 1));

  const currentImage = images[currentSlide];
  const currentDescription = slideDescriptions[currentSlide];

  return (
    <div className="bg-[var(--card-bg)] rounded-xl border border-[var(--border)] overflow-hidden shadow-sm">
      {/* Header */}
      <div className="px-4 py-3 flex items-center gap-3 border-b border-[var(--border)]">
        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-yellow-400 via-pink-500 to-purple-600 p-[2px]">
          <div className="h-full w-full rounded-full bg-[var(--card-bg)] flex items-center justify-center">
            <span className="text-xs font-bold text-[var(--text-primary)]">{brandInitial}</span>
          </div>
        </div>
        <span className="text-sm font-semibold text-[var(--text-primary)]">{handle}</span>
        <MoreHorizontal className="h-5 w-5 text-[var(--text-tertiary)] ml-auto" />
      </div>

      {/* Image area */}
      <div className="aspect-square bg-[var(--surface-0)] relative overflow-hidden group">
        {currentImage ? (
          <img
            src={currentImage.url}
            alt={currentImage.alt || `Slide ${currentSlide + 1}`}
            className="w-full h-full object-cover"
          />
        ) : currentDescription ? (
          <div className="w-full h-full bg-gradient-to-br from-purple-50 to-pink-50 flex flex-col items-center justify-center p-8 text-center">
            <ImageIcon className="h-10 w-10 text-pink-300 mb-3" />
            <p className="text-sm text-[var(--text-secondary)] font-medium">{currentDescription}</p>
            <p className="text-xs text-[var(--text-tertiary)] mt-2">Slide {currentSlide + 1} de {totalSlides}</p>
          </div>
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-stone-100 to-stone-200 flex items-center justify-center">
            <Instagram className="h-16 w-16 text-[var(--text-tertiary)]" />
          </div>
        )}

        {/* Carousel navigation */}
        {isCarousel && totalSlides > 1 && (
          <>
            <button
              onClick={goPrev}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ChevronLeft className="h-5 w-5 text-white" />
            </button>
            <button
              onClick={goNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ChevronRight className="h-5 w-5 text-white" />
            </button>

            {/* Counter badge */}
            <div className="absolute top-3 right-3 px-2 py-1 rounded-full bg-black/60 text-xs text-white font-medium">
              {currentSlide + 1}/{totalSlides}
            </div>

            {/* Dot indicators */}
            <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
              {Array.from({ length: totalSlides }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentSlide(i)}
                  className={cn(
                    "h-1.5 w-1.5 rounded-full transition-all",
                    i === currentSlide ? "bg-blue-500 w-2.5" : "bg-[var(--card-bg)]/70"
                  )}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Actions */}
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Heart className="h-6 w-6 text-[var(--text-primary)]" />
          <MessageCircle className="h-6 w-6 text-[var(--text-primary)]" />
          <Send className="h-6 w-6 text-[var(--text-primary)]" />
        </div>
        <BookmarkPlus className="h-6 w-6 text-[var(--text-primary)]" />
      </div>

      {/* Caption */}
      <div className="px-4 pb-4">
        <p className="text-sm text-[var(--text-primary)] leading-relaxed whitespace-pre-line">
          <span className="font-semibold mr-1">{handle}</span>
          {renderFormattedText(caption, true)}
        </p>
        {hashtags.length > 0 && (
          <p className="text-sm text-[#00376B] mt-1">
            {hashtags.join(" ")}
          </p>
        )}
      </div>
    </div>
  );
}

// ── TikTok Preview ──────────────────────────────────────

function TikTokPreview({ body, brandName, brandInitial, imageUrl, assets }: {
  body: string;
  brandName: string;
  brandInitial: string;
  imageUrl?: string;
  assets?: ContentAsset[];
}) {
  const parsed = parseTikTokBody(body);
  const handle = brandName.toLowerCase().replace(/\s+/g, "");
  const videoAsset = assets?.find((a) => a.type === "video");
  const coverImage = assets?.find((a) => a.type === "image") || (imageUrl ? { url: imageUrl, alt: "TikTok cover" } : null);

  return (
    <div className="max-w-[340px] mx-auto">
      {/* Phone-style frame */}
      <div className="bg-black rounded-2xl overflow-hidden shadow-xl relative" style={{ aspectRatio: "9/16" }}>
        {/* Video/Cover area */}
        <div className="absolute inset-0">
          {coverImage ? (
            <img
              src={coverImage.url}
              alt={("alt" in coverImage ? coverImage.alt : undefined) || "TikTok video"}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-b from-stone-800 to-stone-900 flex items-center justify-center">
              <Play className="h-16 w-16 text-white/30" />
            </div>
          )}
          {/* Dark gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
        </div>

        {/* Play button center */}
        {!videoAsset && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-[var(--card-bg)]/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
              <Play className="h-8 w-8 text-white ml-1" fill="white" />
            </div>
          </div>
        )}

        {/* Right sidebar actions */}
        <div className="absolute right-3 bottom-32 flex flex-col items-center gap-5">
          <div className="flex flex-col items-center gap-1">
            <div className="h-10 w-10 rounded-full bg-[var(--card-bg)]/20 backdrop-blur-sm flex items-center justify-center border-2 border-white">
              <span className="text-xs font-bold text-white">{brandInitial}</span>
            </div>
            <div className="h-4 w-4 rounded-full bg-rose-500 flex items-center justify-center -mt-2.5">
              <UserPlus className="h-2.5 w-2.5 text-white" />
            </div>
          </div>
          {[
            { icon: Heart, count: "12.5K" },
            { icon: MessageCircle, count: "234" },
            { icon: BookmarkPlus, count: "1.2K" },
            { icon: Share, count: "567" },
          ].map(({ icon: Icon, count }, idx) => (
            <div key={idx} className="flex flex-col items-center gap-0.5">
              <div className="h-9 w-9 flex items-center justify-center">
                <Icon className="h-6 w-6 text-white drop-shadow-md" />
              </div>
              <span className="text-[10px] text-white font-medium drop-shadow-md">{count}</span>
            </div>
          ))}
          {/* Music disc */}
          <div className="h-9 w-9 rounded-full bg-[var(--surface-2)] border-2 border-[var(--border)] flex items-center justify-center animate-[spin_3s_linear_infinite]">
            <Music2 className="h-3.5 w-3.5 text-white" />
          </div>
        </div>

        {/* Bottom content */}
        <div className="absolute bottom-0 left-0 right-14 p-4">
          {/* Username */}
          <p className="text-sm font-bold text-white drop-shadow-md mb-1">@{handle}</p>

          {/* Caption */}
          <p className="text-xs text-white/90 leading-relaxed drop-shadow-md mb-2 line-clamp-4">
            {renderFormattedText(parsed.caption, true)}
          </p>

          {/* Hashtags */}
          {parsed.hashtags.length > 0 && (
            <p className="text-xs text-white/80 drop-shadow-md mb-2">
              {parsed.hashtags.slice(0, 5).join(" ")}
            </p>
          )}

          {/* Music bar */}
          <div className="flex items-center gap-2">
            <Music2 className="h-3 w-3 text-white shrink-0" />
            <div className="overflow-hidden">
              <p className="text-xs text-white/80 whitespace-nowrap animate-[scroll_8s_linear_infinite]">
                {parsed.music || "Sonido original - " + handle}
              </p>
            </div>
          </div>
        </div>

        {/* Scenes indicator (if has scenes) */}
        {parsed.scenes.length > 0 && (
          <div className="absolute top-4 left-4 right-14">
            <div className="bg-black/50 backdrop-blur-sm rounded-lg px-3 py-2 border border-white/10">
              <p className="text-[10px] font-semibold text-white/70 uppercase tracking-wider mb-1">
                Guión · {parsed.scenes.length} escenas
              </p>
              {parsed.duration && (
                <p className="text-[10px] text-white/50">Duración: {parsed.duration}</p>
              )}
            </div>
          </div>
        )}

        {/* Progress bar */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-[var(--card-bg)]/20">
          <div className="h-full w-1/3 bg-[var(--card-bg)] rounded-r-full" />
        </div>
      </div>

      {/* Scenes detail (below the phone frame) */}
      {parsed.scenes.length > 0 && (
        <div className="mt-4 space-y-2">
          <p className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">Escenas del video</p>
          {parsed.scenes.map((scene, i) => (
            <div key={i} className="flex items-start gap-2 bg-[var(--surface-1)] rounded-lg px-3 py-2">
              <span className="text-xs font-bold text-[var(--text-tertiary)] shrink-0 mt-0.5">{i + 1}.</span>
              <p className="text-xs text-[var(--text-secondary)]">{scene}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Newsletter Parser ────────────────────────────────────

function parseNewsletterBody(raw: string): {
  subject: string;
  preheader: string;
  sections: { heading: string; body: string }[];
  cta: { text: string; url: string } | null;
  footer: string;
} {
  const sections: { heading: string; body: string }[] = [];

  // Extract subject line
  const subjectMatch = raw.match(/\*?\*?(?:Subject|Asunto|Línea de asunto):?\*?\*?\s*([^\n]+)/i);
  const subject = subjectMatch ? subjectMatch[1].replace(/\*\*/g, "").trim() : "";

  // Extract preheader
  const preheaderMatch = raw.match(/\*?\*?(?:Preheader|Pre-header|Preview text|Texto previo):?\*?\*?\s*([^\n]+)/i);
  const preheader = preheaderMatch ? preheaderMatch[1].replace(/\*\*/g, "").trim() : "";

  // Extract CTA
  const ctaMatch = raw.match(/\*?\*?(?:CTA|Call to Action|Botón|Llamada a la acción):?\*?\*?\s*([^\n]+)/i);
  const ctaUrlMatch = raw.match(/\*?\*?(?:URL|Link|Enlace):?\*?\*?\s*([^\n]+)/i);
  const cta = ctaMatch ? {
    text: ctaMatch[1].replace(/\*\*/g, "").replace(/[[\]"']/g, "").trim(),
    url: ctaUrlMatch ? ctaUrlMatch[1].replace(/\*\*/g, "").trim() : "#",
  } : null;

  // Extract footer
  const footerMatch = raw.match(/\*?\*?(?:Footer|Pie de página|Firma):?\*?\*?\s*([\s\S]*?)(?=\*?\*?(?:CTA|URL|$))/i);
  const footer = footerMatch ? footerMatch[1].replace(/\*\*/g, "").trim() : "";

  // Extract sections by splitting on bold headings (## or **)
  const sectionRegex = /(?:#{2,3}\s*|^\*\*|\n\*\*)([^*\n]+)\*?\*?\s*\n([\s\S]*?)(?=(?:#{2,3}\s|\n\*\*[A-ZÁÉÍÓÚÑ¿])|$)/gm;
  let sectionMatch;
  while ((sectionMatch = sectionRegex.exec(raw)) !== null) {
    const heading = sectionMatch[1].replace(/\*\*/g, "").replace(/:/g, "").trim();
    const body = sectionMatch[2]
      .replace(/\*?\*?(?:Subject|Asunto|Preheader|CTA|URL|Footer|Firma|Línea de asunto|Texto previo|Call to Action|Botón|Llamada a la acción|Pie de página|Link|Enlace):?\*?\*?\s*[^\n]*/gi, "")
      .replace(/\*\*/g, "")
      .replace(/---/g, "")
      .trim();
    // Skip metadata sections
    if (/^(Subject|Asunto|Preheader|CTA|URL|Footer|Firma|Contenido Mejorado|Tipo|Título)/i.test(heading)) continue;
    if (body.length > 10) {
      sections.push({ heading, body });
    }
  }

  // If no sections found, try simple paragraph splitting as fallback
  if (sections.length === 0) {
    const cleaned = raw
      .replace(/##\s*Contenido\s*(?:Mejorado)?/gi, "")
      .replace(/Tipo:\s*[^\n]+/gi, "")
      .replace(/Título:\s*[^\n]+/gi, "")
      .replace(/\*?\*?(?:Subject|Asunto|Preheader|CTA|URL|Footer|Firma|Línea de asunto|Texto previo|Call to Action|Botón|Llamada a la acción|Pie de página|Link|Enlace):?\*?\*?\s*[^\n]*/gi, "")
      .replace(/---/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    const paragraphs = cleaned.split(/\n\n+/).filter((p) => p.trim().length > 10);
    paragraphs.forEach((p, i) => {
      sections.push({ heading: i === 0 ? "Introducción" : `Sección ${i + 1}`, body: p.replace(/\*\*/g, "").trim() });
    });
  }

  return { subject, preheader, sections, cta, footer };
}

// ── Newsletter Preview ───────────────────────────────────

function NewsletterPreview({ body, title, brandName, brandInitial }: {
  body: string;
  title?: string;
  brandName: string;
  brandInitial: string;
}) {
  const parsed = parseNewsletterBody(body);
  const displaySubject = parsed.subject || title || "Newsletter";

  return (
    <div className="max-w-xl mx-auto">
      {/* Email client chrome */}
      <div className="bg-[var(--surface-1)] rounded-t-xl border border-[var(--border)] px-4 py-3 flex items-center gap-3">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-[var(--error)]" />
          <div className="w-3 h-3 rounded-full bg-yellow-400" />
          <div className="w-3 h-3 rounded-full bg-green-400" />
        </div>
        <div className="flex-1 text-center">
          <span className="text-xs text-[var(--text-tertiary)] font-medium">Bandeja de entrada</span>
        </div>
      </div>

      {/* Email header bar */}
      <div className="bg-[var(--card-bg)] border-x border-[var(--border)] px-5 py-3 border-b border-[var(--border)]">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-9 h-9 rounded-full bg-emerald-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
            {brandInitial}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{brandName}</p>
            <p className="text-xs text-[var(--text-tertiary)] truncate">newsletter@{brandName.toLowerCase().replace(/\s+/g, "")}.com</p>
          </div>
          <span className="ml-auto text-xs text-[var(--text-tertiary)] shrink-0">Ahora</span>
        </div>
        <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{displaySubject}</p>
        {parsed.preheader && (
          <p className="text-xs text-[var(--text-tertiary)] truncate mt-0.5">{parsed.preheader}</p>
        )}
      </div>

      {/* Email body */}
      <div className="bg-[var(--card-bg)] border-x border-b border-[var(--border)] rounded-b-xl overflow-hidden">
        {/* Brand header banner */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-500 px-6 py-8 text-center">
          <div className="w-12 h-12 rounded-full bg-[var(--card-bg)]/20 flex items-center justify-center text-white text-lg font-bold mx-auto mb-3">
            {brandInitial}
          </div>
          <h2 className="text-white text-lg font-bold">{displaySubject}</h2>
          {parsed.preheader && (
            <p className="text-emerald-100 text-sm mt-1">{parsed.preheader}</p>
          )}
        </div>

        {/* Sections */}
        <div className="px-6 py-6 space-y-5">
          {parsed.sections.map((section, i) => (
            <div key={i}>
              <h3 className="text-sm font-bold text-[var(--text-primary)] mb-2 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                {section.heading}
              </h3>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed pl-3.5">{section.body}</p>
              {i < parsed.sections.length - 1 && (
                <div className="border-b border-[var(--border)] mt-5" />
              )}
            </div>
          ))}
        </div>

        {/* CTA Button */}
        {parsed.cta && (
          <div className="px-6 pb-6 text-center">
            <div className="inline-flex items-center gap-2 bg-emerald-600 text-white text-sm font-semibold px-6 py-3 rounded-lg">
              {parsed.cta.text}
              <ExternalLink className="w-3.5 h-3.5" />
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="bg-[var(--surface-0)] px-6 py-4 border-t border-[var(--border)]">
          <div className="text-center space-y-1">
            {parsed.footer ? (
              <p className="text-xs text-[var(--text-tertiary)]">{parsed.footer}</p>
            ) : (
              <>
                <p className="text-xs text-[var(--text-tertiary)]">{brandName} &middot; Newsletter semanal</p>
                <p className="text-xs text-[var(--text-tertiary)]">
                  <span className="underline cursor-pointer">Desuscribirse</span> &middot; <span className="underline cursor-pointer">Ver en navegador</span>
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Blog / Generic Preview ───────────────────────────────

function BlogPreview({ body, title }: { body: string; title?: string }) {
  return (
    <div className="bg-[var(--card-bg)] rounded-xl border border-[var(--border)] overflow-hidden max-w-2xl mx-auto shadow-sm">
      <div className="px-8 py-10">
        {title && (
          <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-6">{title}</h1>
        )}
        <div className="text-[var(--text-secondary)] leading-relaxed text-base">
          {renderFormattedText(body)}
        </div>
      </div>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────

export const SocialPostPreview = memo(function SocialPostPreview({
  body,
  type,
  title,
  brandName = "Berke Spa",
  brandInitial = "B",
  imageUrl,
  assets,
}: SocialPostPreviewProps) {
  const platform = type.replace("social_", "");
  const isNewsletter = type === "newsletter" || type === "email";

  return (
    <div className="py-6 px-4 bg-[var(--surface-0)] rounded-xl min-h-[400px]">
      {/* Platform indicator */}
      <div className="flex items-center justify-center gap-2 mb-6">
        {platform === "linkedin" && <Linkedin className="h-5 w-5 text-[#0A66C2]" />}
        {platform === "twitter" && <Twitter className="h-5 w-5 text-[#1DA1F2]" />}
        {platform === "instagram" && <Instagram className="h-5 w-5 text-[#E4405F]" />}
        {platform === "tiktok" && <Play className="h-5 w-5 text-[#000000] dark:text-white" />}
        {isNewsletter && <Mail className="h-5 w-5 text-emerald-500" />}
        <span className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">
          {platform === "linkedin" ? "Vista previa LinkedIn" : platform === "twitter" ? "Vista previa Twitter / X" : platform === "instagram" ? "Vista previa Instagram" : platform === "tiktok" ? "Vista previa TikTok" : isNewsletter ? "Vista previa Newsletter" : "Vista previa"}
        </span>
      </div>

      {/* Platform-specific render */}
      {platform === "linkedin" && (
        <LinkedInPreview body={body} brandName={brandName} brandInitial={brandInitial} imageUrl={imageUrl} assets={assets} />
      )}
      {platform === "twitter" && (
        <TwitterPreview body={body} brandName={brandName} brandInitial={brandInitial} />
      )}
      {platform === "instagram" && (
        <InstagramPreview body={body} brandName={brandName} brandInitial={brandInitial} imageUrl={imageUrl} assets={assets} />
      )}
      {platform === "tiktok" && (
        <TikTokPreview body={body} brandName={brandName} brandInitial={brandInitial} imageUrl={imageUrl} assets={assets} />
      )}
      {isNewsletter && (
        <NewsletterPreview body={body} title={title} brandName={brandName} brandInitial={brandInitial} />
      )}
      {!["linkedin", "twitter", "instagram", "tiktok"].includes(platform) && !isNewsletter && (
        <BlogPreview body={body} title={title} />
      )}
    </div>
  );
});
