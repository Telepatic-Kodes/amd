"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { translate } from "@/lib/language";
import { Linkedin, Twitter, Instagram, Hash } from "lucide-react";
import {
  adaptForTwitter,
  adaptForLinkedIn,
  adaptForInstagram,
} from "@/lib/contentAdapters";

interface PlatformPreviewGridProps {
  contentBody: string;
  selectedPlatforms: string[];
  hashtags?: string[];
}

export function PlatformPreviewGrid({
  contentBody,
  selectedPlatforms,
  hashtags,
}: PlatformPreviewGridProps) {
  if (selectedPlatforms.length === 0) {
    return (
      <div className="p-6 text-center border border-zinc-800 rounded-lg bg-zinc-900/30">
        <p className="text-sm text-zinc-500">
          {translate("selectPlatformsPreview")}
        </p>
      </div>
    );
  }

  const platforms = [
    {
      id: "linkedin",
      name: "LinkedIn",
      icon: Linkedin,
      color: "text-[#0A66C2]",
      bgColor: "bg-[#0A66C2]/10",
      borderColor: "border-[#0A66C2]/20",
      maxLength: 3000,
    },
    {
      id: "twitter",
      name: "Twitter/X",
      icon: Twitter,
      color: "text-[#1DA1F2]",
      bgColor: "bg-[#1DA1F2]/10",
      borderColor: "border-[#1DA1F2]/20",
      maxLength: 280,
    },
    {
      id: "instagram",
      name: "Instagram",
      icon: Instagram,
      color: "text-[#E4405F]",
      bgColor: "bg-gradient-to-r from-[#833AB4]/10 via-[#FD1D1D]/10 to-[#FCAF45]/10",
      borderColor: "border-[#E4405F]/20",
      maxLength: 2200,
    },
  ];

  const selectedPlatformData = platforms.filter((p) =>
    selectedPlatforms.includes(p.id)
  );

  return (
    <div
      className={cn(
        "grid gap-4",
        selectedPlatformData.length === 1 && "grid-cols-1",
        selectedPlatformData.length === 2 && "grid-cols-1 md:grid-cols-2",
        selectedPlatformData.length === 3 && "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
      )}
    >
      {selectedPlatformData.map((platform) => {
        const Icon = platform.icon;
        let adaptedContent: {
          text: string;
          charCount: number;
          isThread?: boolean;
          tweetCount?: number;
          hashtagsList?: string[];
        } = {
          text: "",
          charCount: 0,
        };

        // Adapt content for each platform
        if (platform.id === "twitter") {
          const twitterResult = adaptForTwitter(contentBody, hashtags);
          adaptedContent = {
            text: twitterResult.text,
            charCount: twitterResult.text.length,
            isThread: twitterResult.isThread,
            tweetCount: twitterResult.tweetCount,
          };
        } else if (platform.id === "linkedin") {
          const linkedinResult = adaptForLinkedIn(contentBody);
          adaptedContent = {
            text: linkedinResult.text,
            charCount: linkedinResult.text.length,
          };
        } else if (platform.id === "instagram") {
          const instagramResult = adaptForInstagram(contentBody, hashtags);
          adaptedContent = {
            text: instagramResult.caption,
            charCount: instagramResult.caption.length,
            hashtagsList: instagramResult.hashtagsList,
          };
        }

        // Calculate color based on character limit
        const percentage = (adaptedContent.charCount / platform.maxLength) * 100;
        let charCountColor = "text-green-400";
        if (percentage > 100) {
          charCountColor = "text-red-400";
        } else if (percentage > 90) {
          charCountColor = "text-yellow-400";
        }

        return (
          <motion.div
            key={platform.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={cn(
              "border rounded-lg p-4 space-y-3",
              platform.borderColor,
              platform.bgColor
            )}
          >
            {/* Platform Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon className={cn("h-4 w-4", platform.color)} />
                <span className="text-sm font-semibold text-white">
                  {platform.name}
                </span>
              </div>
              <span className={cn("text-xs font-mono", charCountColor)}>
                {translate("charactersUsed")
                  .replace("{N}", adaptedContent.charCount.toString())
                  .replace("{MAX}", platform.maxLength.toString())}
              </span>
            </div>

            {/* Preview Text */}
            <div className="rounded-lg bg-zinc-950/50 p-3 border border-zinc-800/50 max-h-40 overflow-y-auto">
              <p className="text-sm text-zinc-300 whitespace-pre-wrap">
                {adaptedContent.text.slice(0, 300)}
                {adaptedContent.text.length > 300 && "..."}
              </p>
            </div>

            {/* Platform-Specific Info */}
            <div className="flex items-center justify-between text-xs">
              {platform.id === "twitter" && (
                <>
                  {adaptedContent.isThread ? (
                    <span className="text-zinc-400">
                      {translate("twitterThread").replace(
                        "{N}",
                        (adaptedContent.tweetCount || 1).toString()
                      )}
                    </span>
                  ) : (
                    <span className="text-zinc-400">Tweet único</span>
                  )}
                </>
              )}
              {platform.id === "linkedin" && (
                <span className="text-zinc-400">
                  {translate("linkedinPost")}
                </span>
              )}
              {platform.id === "instagram" && (
                <span className="text-zinc-400">
                  {translate("instagramCaption")}
                </span>
              )}
            </div>

            {/* Instagram Hashtags Preview */}
            {platform.id === "instagram" &&
              adaptedContent.hashtagsList &&
              adaptedContent.hashtagsList.length > 0 && (
                <div className="pt-2 border-t border-zinc-800/50">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Hash className="h-3 w-3 text-zinc-500" />
                    <p className="text-xs text-zinc-500 uppercase tracking-wider">
                      {translate("suggestedHashtags")}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {adaptedContent.hashtagsList.slice(0, 10).map((tag, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded text-xs bg-zinc-800/50 text-zinc-400 border border-zinc-700/50"
                      >
                        {tag}
                      </span>
                    ))}
                    {adaptedContent.hashtagsList.length > 10 && (
                      <span className="text-xs text-zinc-500">
                        +{adaptedContent.hashtagsList.length - 10} más
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-600 mt-1.5">
                    {translate("hashtagsFromKeywords")}
                  </p>
                </div>
              )}
          </motion.div>
        );
      })}
    </div>
  );
}
