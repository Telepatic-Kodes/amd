"use client";

import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { translate } from "@/lib/language";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Share2, Linkedin, Twitter, Instagram, Mail } from "lucide-react";
import { PublishToLinkedInButton } from "@/components/linkedin/PublishToLinkedInButton";
import { PublishToTwitterButton } from "@/components/twitter/PublishToTwitterButton";
import { PublishToInstagramButton } from "@/components/instagram/PublishToInstagramButton";
import { SendEmailButton } from "@/components/email/SendEmailButton";

interface ContentDetailPlatformPublishProps {
  contentId: Id<"content">;
  contentBody: string;
  contentStatus: string;
  contentType?: string;
  className?: string;
}

export function ContentDetailPlatformPublish({
  contentId,
  contentBody,
  contentStatus,
  contentType,
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
  const emailHistory = useQuery(api.email.queries.getSendHistory, {
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
  const sentByEmail = emailHistory?.some(
    (log) => log.status === "sent"
  );

  // Show email section for newsletter/email content types
  const showEmailSection = !contentType || contentType === "newsletter" || contentType === "email";

  const isEligible =
    contentStatus === "approved" ||
    contentStatus === "scheduled" ||
    contentStatus === "published";

  if (!isEligible) {
    return null; // Don't show publish panel for non-approved content
  }

  return (
    <Card className={cn("border-[var(--border)] bg-[var(--card-bg)]", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
            <Share2 className="h-4 w-4 text-orange-500" />
            {translate("publishToPlatforms")}
          </h3>
          {/* Publish status summary */}
          <div className="flex items-center gap-2 text-xs text-[var(--text-tertiary)]">
            {publishedToLinkedIn || publishedToTwitter || publishedToInstagram || sentByEmail ? (
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
                  {sentByEmail && (
                    <div
                      className="w-2 h-2 rounded-full bg-emerald-500"
                      title="Email"
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
          <div className="flex items-center gap-2 text-xs font-medium text-[var(--text-tertiary)]">
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
          <div className="flex items-center gap-2 text-xs font-medium text-[var(--text-tertiary)]">
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
          <div className="flex items-center gap-2 text-xs font-medium text-[var(--text-tertiary)]">
            <Instagram className="h-3.5 w-3.5 text-[#E4405F]" />
            Instagram
          </div>
          <PublishToInstagramButton
            contentId={contentId}
            contentBody={contentBody}
            contentStatus={contentStatus}
          />
        </div>

        {/* Email Section - only for newsletter/email content types */}
        {showEmailSection && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-medium text-[var(--text-tertiary)]">
              <Mail className="h-3.5 w-3.5 text-emerald-500" />
              Email
            </div>
            <SendEmailButton
              contentId={contentId}
              contentBody={contentBody}
              contentStatus={contentStatus}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
