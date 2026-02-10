"use client";

import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { translate } from "@/lib/language";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Share2, Linkedin, Twitter, Instagram } from "lucide-react";
import { PublishToLinkedInButton } from "@/components/linkedin/PublishToLinkedInButton";
import { PublishToTwitterButton } from "@/components/twitter/PublishToTwitterButton";
import { PublishToInstagramButton } from "@/components/instagram/PublishToInstagramButton";

interface ContentDetailPlatformPublishProps {
  contentId: Id<"content">;
  contentBody: string;
  contentStatus: string;
  className?: string;
}

export function ContentDetailPlatformPublish({
  contentId,
  contentBody,
  contentStatus,
  className,
}: ContentDetailPlatformPublishProps) {
  // Query publish history for all platforms
  const linkedinHistory = useQuery(api.linkedin.queries.getPublishHistory, {
    contentId,
  });
  const twitterHistory = useQuery(api.twitter.queries.getPublishHistory, {
    contentId,
  });
  const instagramHistory = useQuery(api.instagram.queries.getPublishHistory, {
    contentId,
  });

  // Check if content has been published to each platform
  const publishedToLinkedIn = linkedinHistory?.some(
    (log) => log.status === "published"
  );
  const publishedToTwitter = twitterHistory?.some(
    (log) => log.status === "published"
  );
  const publishedToInstagram = instagramHistory?.some(
    (log) => log.status === "published"
  );

  const isEligible =
    contentStatus === "approved" ||
    contentStatus === "scheduled" ||
    contentStatus === "published";

  if (!isEligible) {
    return null; // Don't show publish panel for non-approved content
  }

  return (
    <Card className={cn("border-stone-200 bg-[#faf8f4]/50", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
            <Share2 className="h-4 w-4 text-orange-500" />
            {translate("publishToPlatforms")}
          </h3>
          {/* Publish status summary */}
          <div className="flex items-center gap-2 text-xs text-stone-500">
            {publishedToLinkedIn || publishedToTwitter || publishedToInstagram ? (
              <>
                <span>{translate("publishedTo")}:</span>
                <div className="flex gap-1">
                  {publishedToLinkedIn && (
                    <div
                      className="w-2 h-2 rounded-full bg-[#0A66C2]"
                      title="LinkedIn"
                    />
                  )}
                  {publishedToTwitter && (
                    <div
                      className="w-2 h-2 rounded-full bg-[#1DA1F2]"
                      title="Twitter/X"
                    />
                  )}
                  {publishedToInstagram && (
                    <div
                      className="w-2 h-2 rounded-full bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#FCAF45]"
                      title="Instagram"
                    />
                  )}
                </div>
              </>
            ) : (
              <span>{translate("notPublishedYet")}</span>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0 space-y-4">
        {/* LinkedIn Section */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-medium text-stone-400">
            <Linkedin className="h-3.5 w-3.5 text-[#0A66C2]" />
            LinkedIn
          </div>
          <PublishToLinkedInButton
            contentId={contentId}
            contentBody={contentBody}
            contentStatus={contentStatus}
          />
        </div>

        {/* Twitter Section */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-medium text-stone-400">
            <Twitter className="h-3.5 w-3.5 text-[#1DA1F2]" />
            Twitter/X
          </div>
          <PublishToTwitterButton
            contentId={contentId}
            contentBody={contentBody}
            contentStatus={contentStatus}
          />
        </div>

        {/* Instagram Section */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-medium text-stone-400">
            <Instagram className="h-3.5 w-3.5 text-[#E4405F]" />
            Instagram
          </div>
          <PublishToInstagramButton
            contentId={contentId}
            contentBody={contentBody}
            contentStatus={contentStatus}
          />
        </div>
      </CardContent>
    </Card>
  );
}
