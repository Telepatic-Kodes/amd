"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import Link from "next/link";

const categoryOptions = [
  { value: "brand", label: "🎨 Brand Identity", description: "Brand voice, values, mission" },
  {
    value: "products",
    label: "📦 Products & Services",
    description: "Features, pricing, use cases",
  },
  {
    value: "personas",
    label: "👥 Buyer Personas",
    description: "Target audience profiles",
  },
  {
    value: "guidelines",
    label: "📋 Content Guidelines",
    description: "Do's and don'ts, messaging",
  },
];

const visibilityOptions = [
  { value: "all", label: "All Agents", description: "Visible to all agent types" },
  {
    value: "content",
    label: "Content & Blog Agents",
    description: "For writers and creators",
  },
  {
    value: "social",
    label: "Social Media Agents",
    description: "For social posting agents",
  },
  {
    value: "demandgen",
    label: "Demand Gen & Ads",
    description: "For marketing & paid ads",
  },
];

export default function KBCreatePage() {
  const router = useRouter();
  const createKB = useMutation(api.kb.mutations.createKnowledgeBase);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "brand",
    visibility: ["all"],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await createKB({
        name: formData.name,
        description: formData.description,
        category: formData.category as "brand" | "products" | "personas" | "guidelines",
        visibility: formData.visibility as any,
      });

      // Navigate to the new KB page
      router.push(`/kb/${result._id}`);
    } catch (error) {
      alert("Error creating knowledge base. Please try again.");
      console.error(error);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950">
      <div className="max-w-2xl mx-auto px-6 py-12">
        {/* Header */}
        <Link href="/kb" className="text-blue-500 hover:text-blue-400 mb-6 block">
          ← Back to Knowledge Bases
        </Link>

        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Create Knowledge Base
          </h1>
          <p className="text-zinc-400">
            Add company information that AI agents will reference when creating content
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Name */}
          <div>
            <label className="block text-sm font-semibold text-white mb-3">
              Knowledge Base Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="e.g., ACME Brand Guidelines"
              className="w-full px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-white mb-3">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="What's in this knowledge base?"
              rows={3}
              className="w-full px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-semibold text-white mb-4">
              Category *
            </label>
            <div className="space-y-3">
              {categoryOptions.map((option) => (
                <label
                  key={option.value}
                  className="flex items-start p-4 bg-zinc-900 border border-zinc-800 rounded-lg cursor-pointer hover:border-zinc-700 transition"
                >
                  <input
                    type="radio"
                    name="category"
                    value={option.value}
                    checked={formData.category === option.value}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    className="mt-1 mr-4"
                  />
                  <div>
                    <div className="font-semibold text-white">{option.label}</div>
                    <div className="text-sm text-zinc-400">
                      {option.description}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Visibility */}
          <div>
            <label className="block text-sm font-semibold text-white mb-4">
              Who should see this KB?
            </label>
            <div className="space-y-2">
              {visibilityOptions.map((option) => (
                <label
                  key={option.value}
                  className="flex items-start p-3 bg-zinc-900 border border-zinc-800 rounded-lg cursor-pointer hover:border-zinc-700 transition"
                >
                  <input
                    type="checkbox"
                    checked={formData.visibility.includes(option.value)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData({
                          ...formData,
                          visibility: [...formData.visibility, option.value],
                        });
                      } else {
                        setFormData({
                          ...formData,
                          visibility: formData.visibility.filter(
                            (v) => v !== option.value
                          ),
                        });
                      }
                    }}
                    className="mt-1 mr-3"
                  />
                  <div>
                    <div className="font-semibold text-white text-sm">
                      {option.label}
                    </div>
                    <div className="text-xs text-zinc-400">
                      {option.description}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-4 pt-8">
            <button
              type="submit"
              disabled={loading || !formData.name}
              className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-700 text-white rounded-lg font-semibold transition"
            >
              {loading ? "Creating..." : "Create Knowledge Base"}
            </button>
            <Link
              href="/kb"
              className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-semibold transition"
            >
              Cancel
            </Link>
          </div>
        </form>

        {/* Info */}
        <div className="mt-12 p-6 bg-zinc-900 border border-zinc-800 rounded-lg">
          <h3 className="text-sm font-semibold text-white mb-2">
            📝 Next Steps
          </h3>
          <ul className="text-sm text-zinc-400 space-y-1">
            <li>• Create the KB to begin</li>
            <li>• Upload documents (PDF, DOCX, PPTX) or add URLs</li>
            <li>• Edit extracted sections to match your brand</li>
            <li>• Activate when ready for agents to use</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
