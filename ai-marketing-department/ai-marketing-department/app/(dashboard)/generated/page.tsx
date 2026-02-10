"use client";

import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { FilterTabs } from "@/components/ui/FilterTabs";
import { EmptyContent } from "@/components/ui/EmptyState";
import { SkeletonGrid } from "@/components/ui/Skeleton";
import { DonutChart } from "@/components/charts/DonutChart";
import { chartColors } from "@/components/charts/theme";
import { useToast } from "@/components/ui/Toast";
import {
  FileText,
  Linkedin,
  Twitter,
  Mail,
  Megaphone,
  Search,
  Palette,
  Copy,
  Check,
  X,
  Eye,
  Code,
  Heart,
  MessageCircle,
  Share2,
  Send,
  ThumbsUp,
  Repeat2,
  Bookmark,
  Download,
  LayoutGrid,
  List,
  Sparkles,
} from "lucide-react";
import { useState, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import { motion, AnimatePresence } from "framer-motion";
import type { Doc } from "@convex/_generated/dataModel";

const TASK_ICONS: Record<string, React.ElementType> = {
  write_blog: FileText,
  create_linkedin_post: Linkedin,
  create_twitter_thread: Twitter,
  write_email: Mail,
  create_ads: Megaphone,
  keyword_research: Search,
  brand_strategy: Palette,
  default: FileText,
};

const TASK_COLORS: Record<string, string> = {
  write_blog: "text-orange-400",
  create_linkedin_post: "text-sky-400",
  create_twitter_thread: "text-cyan-400",
  write_email: "text-purple-400",
  create_ads: "text-orange-400",
  keyword_research: "text-green-400",
  brand_strategy: "text-pink-400",
  default: "text-stone-400",
};

const TASK_BG_COLORS: Record<string, string> = {
  write_blog: "bg-orange-500/10",
  create_linkedin_post: "bg-sky-500/10",
  create_twitter_thread: "bg-cyan-500/10",
  write_email: "bg-purple-500/10",
  create_ads: "bg-orange-500/10",
  keyword_research: "bg-green-500/10",
  brand_strategy: "bg-pink-500/10",
  default: "bg-stone-500/10",
};

const TASK_LABELS: Record<string, string> = {
  write_blog: "Blog",
  create_linkedin_post: "LinkedIn",
  create_twitter_thread: "Twitter",
  write_email: "Email",
  create_ads: "Ads",
  keyword_research: "SEO",
  brand_strategy: "Brand",
  default: "Other",
};

const FILTER_TABS = [
  { id: "all", label: "All", icon: LayoutGrid },
  { id: "write_blog", label: "Blog", icon: FileText },
  { id: "create_linkedin_post", label: "LinkedIn", icon: Linkedin },
  { id: "create_twitter_thread", label: "Twitter", icon: Twitter },
  { id: "write_email", label: "Email", icon: Mail },
  { id: "create_ads", label: "Ads", icon: Megaphone },
];

function CopyButton({ text, size = "sm" }: { text: string; size?: "sm" | "lg" }) {
  const [copied, setCopied] = useState(false);
  const { success } = useToast();

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopied(true);
    success("Copied!", "Content copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  if (size === "lg") {
    return (
      <button
        onClick={handleCopy}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-white transition-colors"
      >
        {copied ? (
          <>
            <Check className="h-4 w-4" />
            Copied
          </>
        ) : (
          <>
            <Copy className="h-4 w-4" />
            Copy content
          </>
        )}
      </button>
    );
  }

  return (
    <button
      onClick={handleCopy}
      className="p-2 rounded-lg bg-stone-200 hover:bg-stone-100 transition-colors"
      title="Copy content"
    >
      {copied ? (
        <Check className="h-4 w-4 text-green-400" />
      ) : (
        <Copy className="h-4 w-4 text-stone-400" />
      )}
    </button>
  );
}

// Platform-specific preview frames
function LinkedInPreview({ content }: { content: string }) {
  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden max-w-xl">
      <div className="p-4 flex items-start gap-3">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-purple-600 flex items-center justify-center text-white font-bold">
          AI
        </div>
        <div className="flex-1">
          <p className="font-semibold text-stone-900">AI Marketing Department</p>
          <p className="text-xs text-stone-500">Marketing Automation • 1m</p>
        </div>
      </div>
      <div className="px-4 pb-3">
        <div className="text-stone-800 text-sm whitespace-pre-wrap leading-relaxed">
          {content}
        </div>
      </div>
      <div className="px-4 py-2 border-t border-stone-100 flex items-center gap-1 text-xs text-stone-500">
        <span className="flex items-center gap-1">
          <span className="w-4 h-4 rounded-full bg-orange-500 flex items-center justify-center">
            <ThumbsUp className="w-2.5 h-2.5 text-white" />
          </span>
          128
        </span>
        <span className="ml-auto">24 comments • 8 shares</span>
      </div>
      <div className="px-4 py-2 border-t border-stone-100 flex justify-around">
        <button className="flex items-center gap-2 text-stone-600 hover:text-stone-900 text-sm py-2 px-4 rounded hover:bg-stone-50">
          <ThumbsUp className="w-4 h-4" /> Like
        </button>
        <button className="flex items-center gap-2 text-stone-600 hover:text-stone-900 text-sm py-2 px-4 rounded hover:bg-stone-50">
          <MessageCircle className="w-4 h-4" /> Comment
        </button>
        <button className="flex items-center gap-2 text-stone-600 hover:text-stone-900 text-sm py-2 px-4 rounded hover:bg-stone-50">
          <Share2 className="w-4 h-4" /> Share
        </button>
        <button className="flex items-center gap-2 text-stone-600 hover:text-stone-900 text-sm py-2 px-4 rounded hover:bg-stone-50">
          <Send className="w-4 h-4" /> Send
        </button>
      </div>
    </div>
  );
}

function TwitterPreview({ content }: { content: string }) {
  const tweets = content.split(/\d+\//).filter(t => t.trim());

  return (
    <div className="space-y-3 max-w-xl">
      {tweets.map((tweet, i) => (
        <div key={i} className="bg-black rounded-xl border border-stone-200 p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-orange-500 flex items-center justify-center text-white font-bold text-sm">
              AI
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <span className="font-bold text-white">AI Marketing</span>
                <span className="text-stone-500">@ai_marketing · 1m</span>
              </div>
              <p className="text-white text-sm mt-1 whitespace-pre-wrap">{tweet.trim()}</p>
            </div>
          </div>
          <div className="flex justify-between mt-4 px-8 text-stone-500">
            <button className="flex items-center gap-1 hover:text-orange-400 text-sm">
              <MessageCircle className="w-4 h-4" /> 12
            </button>
            <button className="flex items-center gap-1 hover:text-green-400 text-sm">
              <Repeat2 className="w-4 h-4" /> 48
            </button>
            <button className="flex items-center gap-1 hover:text-pink-400 text-sm">
              <Heart className="w-4 h-4" /> 256
            </button>
            <button className="flex items-center gap-1 hover:text-orange-400 text-sm">
              <Bookmark className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function EmailPreview({ content }: { content: string }) {
  const lines = content.split('\n');
  const subjectLine = lines.find(l => l.toLowerCase().includes('subject:') || l.toLowerCase().includes('asunto:'));
  const subject = subjectLine ? subjectLine.replace(/^(subject:|asunto:)/i, '').trim() : 'Newsletter';
  const body = lines.filter(l => l !== subjectLine).join('\n');

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden max-w-2xl">
      <div className="bg-stone-50 p-4 border-b border-stone-200">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
            AI
          </div>
          <div>
            <p className="font-medium text-stone-900">AI Marketing Department</p>
            <p className="text-xs text-stone-500">marketing@ai-dept.com</p>
          </div>
        </div>
        <p className="font-semibold text-stone-900 text-lg">{subject}</p>
      </div>
      <div className="p-6">
        <div className="prose prose-sm max-w-none text-stone-700">
          <ReactMarkdown>{body}</ReactMarkdown>
        </div>
      </div>
      <div className="px-6 pb-6">
        <button className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:opacity-90 transition-opacity">
          Learn more →
        </button>
      </div>
    </div>
  );
}

function BlogPreview({ content }: { content: string }) {
  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden max-w-3xl">
      <div className="h-48 bg-gradient-to-br from-orange-500 via-purple-500 to-pink-500 flex items-center justify-center">
        <FileText className="w-16 h-16 text-white/50" />
      </div>
      <article className="p-8">
        <div className="flex items-center gap-2 text-sm text-stone-500 mb-4">
          <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded">Marketing</span>
          <span>•</span>
          <span>5 min read</span>
        </div>
        <div className="prose prose-lg max-w-none text-stone-800">
          <ReactMarkdown
            components={{
              h1: ({children}) => <h1 className="text-3xl font-bold text-stone-900 mb-4">{children}</h1>,
              h2: ({children}) => <h2 className="text-2xl font-bold text-stone-900 mt-8 mb-4">{children}</h2>,
              h3: ({children}) => <h3 className="text-xl font-semibold text-stone-900 mt-6 mb-3">{children}</h3>,
              p: ({children}) => <p className="text-stone-700 leading-relaxed mb-4">{children}</p>,
              ul: ({children}) => <ul className="list-disc list-inside space-y-2 mb-4">{children}</ul>,
              ol: ({children}) => <ol className="list-decimal list-inside space-y-2 mb-4">{children}</ol>,
              li: ({children}) => <li className="text-stone-700">{children}</li>,
              strong: ({children}) => <strong className="font-semibold text-stone-900">{children}</strong>,
              em: ({children}) => <em className="italic">{children}</em>,
            }}
          >
            {content}
          </ReactMarkdown>
        </div>
      </article>
    </div>
  );
}

function AdsPreview({ content }: { content: string }) {
  return (
    <div className="space-y-6 max-w-2xl">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="p-3 flex items-center gap-2 border-b border-stone-100">
          <div className="w-8 h-8 rounded-full bg-orange-600 flex items-center justify-center">
            <span className="text-white font-bold text-xs">f</span>
          </div>
          <div>
            <p className="font-semibold text-stone-900 text-sm">Sponsored</p>
            <p className="text-xs text-stone-500">Facebook Ad</p>
          </div>
        </div>
        <div className="h-40 bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center">
          <Megaphone className="w-12 h-12 text-white/50" />
        </div>
        <div className="p-4">
          <div className="text-sm text-stone-700 whitespace-pre-wrap mb-3">
            <ReactMarkdown>{content.substring(0, 500)}</ReactMarkdown>
          </div>
          <button className="w-full py-2 bg-orange-600 text-white rounded font-medium text-sm">
            Learn More
          </button>
        </div>
      </div>
    </div>
  );
}

function GenericPreview({ content, type }: { content: string; type: string }) {
  const bgColor = TASK_BG_COLORS[type] || TASK_BG_COLORS.default;

  return (
    <div className={`rounded-xl ${bgColor} p-6 max-w-3xl`}>
      <div className="bg-white/90 backdrop-blur rounded-lg p-6 shadow-sm">
        <div className="prose prose-sm max-w-none">
          <ReactMarkdown
            components={{
              h1: ({children}) => <h1 className="text-2xl font-bold text-stone-900 mb-4">{children}</h1>,
              h2: ({children}) => <h2 className="text-xl font-bold text-stone-900 mt-6 mb-3">{children}</h2>,
              h3: ({children}) => <h3 className="text-lg font-semibold text-stone-900 mt-4 mb-2">{children}</h3>,
              p: ({children}) => <p className="text-stone-700 leading-relaxed mb-3">{children}</p>,
              ul: ({children}) => <ul className="list-disc list-inside space-y-1 mb-3 text-stone-700">{children}</ul>,
              ol: ({children}) => <ol className="list-decimal list-inside space-y-1 mb-3 text-stone-700">{children}</ol>,
              li: ({children}) => <li className="text-stone-700">{children}</li>,
              strong: ({children}) => <strong className="font-semibold text-stone-900">{children}</strong>,
              em: ({children}) => <em className="italic">{children}</em>,
              code: ({children}) => <code className="bg-stone-100 px-1.5 py-0.5 rounded text-sm font-mono">{children}</code>,
              blockquote: ({children}) => <blockquote className="border-l-4 border-stone-300 pl-4 italic text-stone-600">{children}</blockquote>,
            }}
          >
            {content}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
}

function ContentPreview({ content, type }: { content: string; type: string }) {
  switch (type) {
    case 'create_linkedin_post':
      return <LinkedInPreview content={content} />;
    case 'create_twitter_thread':
      return <TwitterPreview content={content} />;
    case 'write_email':
      return <EmailPreview content={content} />;
    case 'write_blog':
      return <BlogPreview content={content} />;
    case 'create_ads':
      return <AdsPreview content={content} />;
    default:
      return <GenericPreview content={content} type={type} />;
  }
}

function ReviewModal({
  task,
  onClose,
}: {
  task: Doc<"tasks">;
  onClose: () => void;
}) {
  const [viewMode, setViewMode] = useState<'preview' | 'raw'>('preview');
  const Icon = TASK_ICONS[task.type] || TASK_ICONS.default;
  const colorClass = TASK_COLORS[task.type] || TASK_COLORS.default;
  const content = task.output?.content || "";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="relative w-full max-w-5xl max-h-[90vh] bg-stone-100 rounded-2xl border border-stone-300 shadow-2xl flex flex-col"
      >
        <div className="flex items-center justify-between p-6 border-b border-stone-200">
          <div className="flex items-center gap-3">
            <div className={`rounded-lg bg-stone-200 p-2 ${colorClass}`}>
              <Icon className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">
                {task.title.replace("[SDK] ", "")}
              </h2>
              <p className="text-sm text-stone-500">
                {new Date(task.createdAt).toLocaleString("es-ES", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex bg-stone-200 rounded-lg p-1">
              <button
                onClick={() => setViewMode('preview')}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                  viewMode === 'preview'
                    ? 'bg-orange-600 text-white'
                    : 'text-stone-400 hover:text-stone-900'
                }`}
              >
                <Eye className="h-4 w-4 inline mr-1" />
                Preview
              </button>
              <button
                onClick={() => setViewMode('raw')}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                  viewMode === 'raw'
                    ? 'bg-orange-600 text-white'
                    : 'text-stone-400 hover:text-stone-900'
                }`}
              >
                <Code className="h-4 w-4 inline mr-1" />
                Raw
              </button>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-stone-200 transition-colors"
            >
              <X className="h-5 w-5 text-stone-400" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-6">
          {viewMode === 'preview' ? (
            <div className="flex justify-center">
              <ContentPreview content={content} type={task.type} />
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-stone-50 border border-stone-200">
              <pre className="text-sm text-stone-200 whitespace-pre-wrap font-mono leading-relaxed">
                {content}
              </pre>
            </div>
          )}

          {task.input && Object.keys(task.input).length > 0 && (
            <div className="mt-6">
              <p className="text-xs text-stone-500 mb-2 uppercase tracking-wider">
                Input Parameters
              </p>
              <div className="p-3 rounded-lg bg-stone-50 border border-stone-200">
                <code className="text-xs text-orange-400 whitespace-pre">
                  {JSON.stringify(task.input, null, 2)}
                </code>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between p-6 border-t border-stone-200">
          <div className="flex items-center gap-2">
            <Badge variant="success">Completed</Badge>
            <Badge variant="info">$0.00</Badge>
            <span className="text-xs text-stone-500">
              {content.length} characters
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-stone-200 hover:bg-stone-100 text-stone-300 transition-colors"
            >
              Close
            </button>
            <CopyButton text={content} size="lg" />
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// Content Card with hover actions
function ContentCard({
  task,
  onReview,
}: {
  task: Doc<"tasks">;
  onReview: () => void;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const { success } = useToast();
  const Icon = TASK_ICONS[task.type] || TASK_ICONS.default;
  const colorClass = TASK_COLORS[task.type] || TASK_COLORS.default;
  const bgColor = TASK_BG_COLORS[task.type] || TASK_BG_COLORS.default;
  const label = TASK_LABELS[task.type] || TASK_LABELS.default;
  const content = task.output?.content || "";
  const preview = content.substring(0, 100).replace(/\n/g, " ").replace(/[#*_]/g, '');

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        hover
        className="cursor-pointer group relative overflow-hidden"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={onReview}
      >
        {/* Mini Preview Header */}
        <div className={`h-24 ${bgColor} rounded-t-xl flex items-center justify-center relative overflow-hidden`}>
          <Icon className={`h-10 w-10 ${colorClass} opacity-50`} />
          <div className="absolute inset-0 bg-gradient-to-t from-stone-100 to-transparent opacity-60" />

          {/* Type Badge */}
          <div className="absolute top-3 left-3">
            <Badge variant="default" className="bg-black/50 backdrop-blur-sm border-0">
              {label}
            </Badge>
          </div>

          {/* Quick Actions on Hover */}
          <AnimatePresence>
            {isHovered && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute bottom-3 right-3 flex gap-2"
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigator.clipboard.writeText(content);
                    success("Copied!", "Content copied to clipboard");
                  }}
                  className="p-2 rounded-lg bg-black/70 backdrop-blur-sm hover:bg-black/90 transition-colors"
                  title="Copy"
                >
                  <Copy className="h-4 w-4 text-white" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onReview();
                  }}
                  className="p-2 rounded-lg bg-black/70 backdrop-blur-sm hover:bg-black/90 transition-colors"
                  title="Preview"
                >
                  <Eye className="h-4 w-4 text-white" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const blob = new Blob([content], { type: 'text/plain' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${task.title.replace(/[^a-z0-9]/gi, '_')}.txt`;
                    a.click();
                  }}
                  className="p-2 rounded-lg bg-black/70 backdrop-blur-sm hover:bg-black/90 transition-colors"
                  title="Download"
                >
                  <Download className="h-4 w-4 text-white" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`rounded-md bg-stone-200 p-1.5 ${colorClass}`}>
                <Icon className="h-4 w-4" />
              </div>
              <h3 className="font-semibold text-white text-sm truncate">
                {task.title.replace("[SDK] ", "")}
              </h3>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <p className="text-xs text-stone-500 mb-3 line-clamp-2">
            {preview}...
          </p>

          <div className="flex items-center justify-between">
            <span className="text-xs text-stone-600">
              {new Date(task.createdAt).toLocaleString("es-ES", {
                day: "numeric",
                month: "short",
              })}
            </span>
            <div className="flex items-center gap-1.5">
              <Badge variant="success" className="text-xs px-1.5 py-0.5">
                <Check className="h-3 w-3" />
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function GeneratedContentPage() {
  const tasks = useQuery(api.functions.listTasks, { limit: 50 });
  const [reviewingTask, setReviewingTask] = useState<Doc<"tasks"> | null>(null);
  const [activeFilter, setActiveFilter] = useState("all");

  // Filter only completed tasks with output
  const completedTasks = useMemo((): Doc<"tasks">[] => {
    if (!tasks) return [];
    return tasks.filter(
      (t: Doc<"tasks">) => t.status === "completed" && t.output?.content
    );
  }, [tasks]);

  // Apply filter
  const filteredTasks = useMemo(() => {
    if (activeFilter === "all") return completedTasks;
    return completedTasks.filter((t) => t.type === activeFilter);
  }, [completedTasks, activeFilter]);

  // Calculate content distribution for mini chart
  const contentDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    completedTasks.forEach((t) => {
      const type = t.type || 'default';
      counts[type] = (counts[type] || 0) + 1;
    });

    return Object.entries(counts).map(([type, count]) => ({
      name: TASK_LABELS[type] || 'Other',
      value: count,
      color: type === 'write_blog' ? chartColors.departments.content :
             type === 'create_linkedin_post' ? chartColors.info :
             type === 'create_twitter_thread' ? chartColors.tertiary :
             type === 'write_email' ? chartColors.secondary :
             type === 'create_ads' ? chartColors.warning :
             chartColors.primary,
    }));
  }, [completedTasks]);

  // Update filter tabs with counts
  const tabsWithCounts = useMemo(() => {
    return FILTER_TABS.map(tab => ({
      ...tab,
      count: tab.id === "all"
        ? completedTasks.length
        : completedTasks.filter((t) => t.type === tab.id).length,
    }));
  }, [completedTasks]);

  if (!tasks) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-stone-400 bg-clip-text text-transparent">
            Generated Content
          </h1>
          <p className="text-stone-400 mt-2">Loading...</p>
        </div>
        <SkeletonGrid items={6} columns={3} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-stone-400 bg-clip-text text-transparent">
            Generated Content
          </h1>
          <p className="text-stone-400 mt-2">
            {completedTasks.length} pieces generated with Plan Max (Cost: $0.00)
          </p>
        </div>

        {/* Mini Distribution Chart */}
        {contentDistribution.length > 0 && (
          <div className="flex items-center gap-4 p-3 rounded-xl bg-stone-100/50 border border-stone-200">
            <DonutChart
              data={contentDistribution}
              height={60}
              innerRadius={18}
              outerRadius={28}
              showLegend={false}
              showTooltip={false}
              interactive={false}
            />
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs">
              {contentDistribution.slice(0, 4).map((item) => (
                <div key={item.name} className="flex items-center gap-1">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-stone-400">{item.name}</span>
                  <span className="text-stone-500">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Filter Tabs */}
      <FilterTabs
        tabs={tabsWithCounts}
        activeTab={activeFilter}
        onChange={setActiveFilter}
        variant="pills"
        size="sm"
      />

      {/* Content Grid */}
      <AnimatePresence mode="popLayout">
        {filteredTasks.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Card className="md:col-span-2 lg:col-span-3">
              <CardContent className="p-12 text-center">
                <EmptyContent />
                <code className="block mt-4 text-sm text-orange-400">
                  npm run workflow:content -- --topic "Your topic"
                </code>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            layout
            className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
          >
            {filteredTasks.map((task) => (
              <ContentCard
                key={task._id}
                task={task}
                onReview={() => setReviewingTask(task)}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Review Modal */}
      <AnimatePresence>
        {reviewingTask && (
          <ReviewModal
            task={reviewingTask}
            onClose={() => setReviewingTask(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
