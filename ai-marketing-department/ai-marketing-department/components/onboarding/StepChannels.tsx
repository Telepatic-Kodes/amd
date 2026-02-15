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
        <h2 className="text-2xl font-bold text-[var(--text-primary)]">Canales Activos</h2>
        <p className="text-[var(--text-tertiary)] text-sm">¿Que canales deben gestionar tus agentes?</p>
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
                  ? "border-[var(--accent)] bg-[var(--accent)]/10"
                  : "border-[var(--border)] bg-[var(--card-bg)] hover:border-[var(--border)]"
              )}
            >
              <div className="flex items-center gap-3">
                <Icon className={cn("w-5 h-5", active ? "text-[var(--accent)]" : "text-[var(--text-tertiary)]")} />
                <span className="font-medium text-sm text-[var(--text-primary)]">{label}</span>
              </div>
              <div
                className={cn(
                  "w-10 h-6 rounded-full transition-colors duration-200 relative",
                  active ? "bg-[var(--accent)]" : "bg-[var(--surface-2)]"
                )}
              >
                <div
                  className={cn(
                    "absolute top-1 w-4 h-4 rounded-full bg-[var(--card-bg)] transition-transform duration-200",
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
