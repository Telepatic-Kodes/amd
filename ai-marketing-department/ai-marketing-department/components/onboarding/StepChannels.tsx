"use client";

import { cn } from "@/lib/utils";
import { Linkedin, Twitter, BookOpen, Mail, Search, Facebook } from "lucide-react";

const CHANNELS = [
  { id: "linkedin", label: "LinkedIn", icon: Linkedin },
  { id: "twitter", label: "Twitter / X", icon: Twitter },
  { id: "blog", label: "Blog", icon: BookOpen },
  { id: "email", label: "Email Newsletter", icon: Mail },
  { id: "google-ads", label: "Google Ads", icon: Search },
  { id: "meta-ads", label: "Meta Ads", icon: Facebook },
];

interface Props {
  selected: string[];
  onChange: (channels: string[]) => void;
}

export function StepChannels({ selected, onChange }: Props) {
  const toggle = (id: string) => {
    onChange(selected.includes(id) ? selected.filter((c) => c !== id) : [...selected, id]);
  };

  return (
    <div className="space-y-6 max-w-lg mx-auto">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-white">Active Channels</h2>
        <p className="text-zinc-400 text-sm">Which channels should your agents manage?</p>
      </div>

      <div className="space-y-2">
        {CHANNELS.map(({ id, label, icon: Icon }) => {
          const active = selected.includes(id);
          return (
            <button
              key={id}
              onClick={() => toggle(id)}
              className={cn(
                "w-full flex items-center justify-between p-4 rounded-xl border transition-all duration-200",
                active
                  ? "border-indigo-500 bg-indigo-500/10"
                  : "border-zinc-800 bg-zinc-950/50 hover:border-zinc-700"
              )}
            >
              <div className="flex items-center gap-3">
                <Icon className={cn("w-5 h-5", active ? "text-indigo-400" : "text-zinc-500")} />
                <span className="font-medium text-sm text-white">{label}</span>
              </div>
              <div
                className={cn(
                  "w-10 h-6 rounded-full transition-colors duration-200 relative",
                  active ? "bg-indigo-600" : "bg-zinc-700"
                )}
              >
                <div
                  className={cn(
                    "absolute top-1 w-4 h-4 rounded-full bg-white transition-transform duration-200",
                    active ? "translate-x-5" : "translate-x-1"
                  )}
                />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
