"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import { useState } from "react";

export default function KBListPage() {
  const kbs = useQuery(api.kb.queries.listKnowledgeBases, {
    status: undefined,
  });

  const categoryLabels: Record<string, string> = {
    brand: "🎨 Brand Identity",
    products: "📦 Products & Services",
    personas: "👥 Buyer Personas",
    guidelines: "📋 Content Guidelines",
  };

  const statusBadgeColor: Record<string, string> = {
    draft: "bg-yellow-100 text-yellow-800",
    processing: "bg-blue-100 text-blue-800",
    active: "bg-green-100 text-green-800",
    archived: "bg-gray-100 text-gray-800",
  };

  return (
    <div className="min-h-screen bg-zinc-950">
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Knowledge Bases
          </h1>
          <p className="text-zinc-400">
            Manage company brand, products, personas, and guidelines for AI
            agents
          </p>
        </div>

        {/* Create KB Button */}
        <Link
          href="/kb/create"
          className="inline-block mb-8 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition"
        >
          + Create New Knowledge Base
        </Link>

        {/* KBs Grid */}
        {kbs === undefined ? (
          <div className="text-center py-12 text-zinc-400">
            Loading knowledge bases...
          </div>
        ) : kbs && kbs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {kbs.map((kb) => (
              <div
                key={kb._id}
                className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 hover:border-zinc-700 transition"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-xl font-semibold text-white mb-1">
                      {kb.name}
                    </h2>
                    <p className="text-sm text-zinc-400">
                      {categoryLabels[kb.category] || kb.category}
                    </p>
                  </div>
                  <span
                    className={`text-xs px-3 py-1 rounded-full font-semibold ${statusBadgeColor[kb.status]}`}
                  >
                    {kb.status}
                  </span>
                </div>

                <p className="text-zinc-300 text-sm mb-4">
                  {kb.description}
                </p>

                <div className="mb-4 text-sm text-zinc-400">
                  <div>
                    Documents: {kb.metadata.documentCount || 0}
                  </div>
                  <div>
                    Size:{" "}
                    {kb.metadata.totalSizeBytes
                      ? (kb.metadata.totalSizeBytes / 1024 / 1024).toFixed(2)
                      : 0}{" "}
                    MB
                  </div>
                </div>

                <div className="flex gap-3">
                  <Link
                    href={`/kb/${kb._id}`}
                    className="flex-1 text-center px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm transition"
                  >
                    View
                  </Link>
                  {kb.status === "draft" && (
                    <Link
                      href={`/kb/${kb._id}/edit`}
                      className="flex-1 text-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition"
                    >
                      Edit
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-zinc-900 rounded-lg border border-zinc-800">
            <p className="text-zinc-400 mb-4">No knowledge bases yet</p>
            <Link
              href="/kb/create"
              className="inline-block px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition"
            >
              Create your first KB
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
