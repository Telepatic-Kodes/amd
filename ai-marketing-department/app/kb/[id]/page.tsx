"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function KBDetailPage() {
  const params = useParams();
  const kbId = params.id as string;

  const kb = useQuery(api.kb.queries.getKnowledgeBase, {
    kbId: kbId as Id<"knowledgeBases">,
  });

  const sections = useQuery(api.kb.queries.getSectionsByKB, {
    kbId: kbId as Id<"knowledgeBases">,
  });

  const categoryLabels: Record<string, string> = {
    brand: "🎨 Brand Identity",
    products: "📦 Products & Services",
    personas: "👥 Buyer Personas",
    guidelines: "📋 Content Guidelines",
  };

  if (kb === undefined || sections === undefined) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-zinc-400">Loading knowledge base...</div>
      </div>
    );
  }

  if (!kb) {
    return (
      <div className="min-h-screen bg-zinc-950">
        <div className="max-w-4xl mx-auto px-6 py-12">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white mb-2">
              Knowledge Base not found
            </h1>
            <Link href="/kb" className="text-blue-500 hover:text-blue-400">
              ← Back to Knowledge Bases
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <Link href="/kb" className="text-blue-500 hover:text-blue-400 mb-6 block">
          ← Back to Knowledge Bases
        </Link>

        <div className="mb-8">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">
                {kb.name}
              </h1>
              <p className="text-zinc-400 text-lg">
                {categoryLabels[kb.category] || kb.category}
              </p>
            </div>
            <span className="px-4 py-2 rounded-full font-semibold text-sm bg-green-100 text-green-800">
              {kb.status}
            </span>
          </div>

          <p className="text-zinc-300 mb-6">{kb.description}</p>

          {/* Metadata */}
          <div className="grid grid-cols-3 gap-4 mb-8 bg-zinc-900 p-6 rounded-lg">
            <div>
              <div className="text-zinc-400 text-sm">Documents</div>
              <div className="text-2xl font-bold text-white">
                {kb.metadata.documentCount || 0}
              </div>
            </div>
            <div>
              <div className="text-zinc-400 text-sm">Total Size</div>
              <div className="text-2xl font-bold text-white">
                {kb.metadata.totalSizeBytes
                  ? (kb.metadata.totalSizeBytes / 1024 / 1024).toFixed(2)
                  : 0}{" "}
                MB
              </div>
            </div>
            <div>
              <div className="text-zinc-400 text-sm">Sections</div>
              <div className="text-2xl font-bold text-white">
                {sections?.length || 0}
              </div>
            </div>
          </div>
        </div>

        {/* Sections */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-6">Sections</h2>

          {sections && sections.length > 0 ? (
            <div className="space-y-4">
              {sections.map((section) => (
                <div
                  key={section._id}
                  className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 hover:border-zinc-700 transition"
                >
                  <div className="mb-3">
                    <h3 className="text-lg font-semibold text-white">
                      {section.title}
                    </h3>
                    <div className="flex gap-4 text-sm text-zinc-400 mt-2">
                      <span>Words: {section.metadata.wordCount}</span>
                      {section.topics && section.topics.length > 0 && (
                        <span>Topics: {section.topics.join(", ")}</span>
                      )}
                    </div>
                  </div>

                  <p className="text-zinc-300 line-clamp-3">
                    {section.content}
                  </p>

                  <div className="mt-4 pt-4 border-t border-zinc-800">
                    <button className="text-blue-500 hover:text-blue-400 text-sm font-semibold">
                      View Full Section →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-zinc-900 rounded-lg border border-zinc-800">
              <p className="text-zinc-400">
                No sections in this knowledge base yet
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
