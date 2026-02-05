import {
  FileText,
  BookOpen,
  Linkedin,
  Twitter,
  Instagram,
  Mail,
  Video,
  FileCode,
} from "lucide-react";

export const typeColors: Record<string, string> = {
  blog: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  social_linkedin: "bg-sky-500/10 text-sky-400 border-sky-500/20",
  social_twitter: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  social_instagram: "bg-pink-500/10 text-pink-400 border-pink-500/20",
  social_tiktok: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  email: "bg-green-500/10 text-green-400 border-green-500/20",
  newsletter: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  ad_copy: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  landing_page: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  whitepaper: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
  case_study: "bg-violet-500/10 text-violet-400 border-violet-500/20",
  video_script: "bg-red-500/10 text-red-400 border-red-500/20",
};

export const typeIcons: Record<string, React.ElementType> = {
  blog: BookOpen,
  social_linkedin: Linkedin,
  social_twitter: Twitter,
  social_instagram: Instagram,
  social_tiktok: Video,
  email: Mail,
  newsletter: Mail,
  ad_copy: FileCode,
  landing_page: FileCode,
  whitepaper: FileText,
  case_study: FileText,
  video_script: Video,
};

export function formatTypeName(type: string): string {
  return type
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export const statusColors: Record<string, string> = {
  draft: "bg-zinc-400",
  review: "bg-yellow-400",
  revision_needed: "bg-orange-400",
  approved: "bg-green-400",
  scheduled: "bg-indigo-400",
  published: "bg-emerald-400",
  archived: "bg-zinc-600",
};

export const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  draft: ["review"],
  review: ["approved", "revision_needed"],
  revision_needed: ["review"],
  approved: ["scheduled", "published"],
  scheduled: ["published", "approved"],
  published: ["archived"],
  archived: ["draft"],
};
