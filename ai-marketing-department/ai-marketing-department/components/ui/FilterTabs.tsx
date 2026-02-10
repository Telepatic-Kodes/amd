"use client";

import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";

interface Tab {
  id: string;
  label: string;
  icon?: LucideIcon;
  count?: number;
}

interface FilterTabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (tabId: string) => void;
  variant?: 'pills' | 'underline' | 'buttons';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function FilterTabs({
  tabs,
  activeTab,
  onChange,
  variant = 'pills',
  size = 'md',
  className,
}: FilterTabsProps) {
  const sizes = {
    sm: {
      text: 'text-xs',
      padding: 'px-2.5 py-1',
      iconSize: 'h-3 w-3',
      gap: 'gap-1',
    },
    md: {
      text: 'text-sm',
      padding: 'px-3 py-1.5',
      iconSize: 'h-4 w-4',
      gap: 'gap-1.5',
    },
    lg: {
      text: 'text-base',
      padding: 'px-4 py-2',
      iconSize: 'h-5 w-5',
      gap: 'gap-2',
    },
  };

  const s = sizes[size];

  if (variant === 'pills') {
    return (
      <div className={cn("flex items-center gap-2 flex-wrap", className)}>
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={cn(
                "relative inline-flex items-center rounded-full font-medium transition-all",
                s.text,
                s.padding,
                s.gap,
                isActive
                  ? "text-white"
                  : "text-stone-500 hover:text-stone-700 hover:bg-stone-100"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="activePill"
                  className="absolute inset-0 rounded-full bg-orange-600"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                />
              )}
              <span className="relative flex items-center gap-1.5">
                {Icon && <Icon className={s.iconSize} />}
                {tab.label}
                {tab.count !== undefined && (
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-0.5 text-xs font-medium",
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-stone-200 text-stone-500"
                    )}
                  >
                    {tab.count}
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>
    );
  }

  if (variant === 'underline') {
    return (
      <div className={cn("relative border-b border-stone-200", className)}>
        <div className="flex items-center gap-4">
          {tabs.map((tab) => {
            const isActive = tab.id === activeTab;
            const Icon = tab.icon;

            return (
              <button
                key={tab.id}
                onClick={() => onChange(tab.id)}
                className={cn(
                  "relative pb-3 font-medium transition-colors",
                  s.text,
                  isActive ? "text-stone-900" : "text-stone-400 hover:text-stone-600"
                )}
              >
                <span className={cn("flex items-center", s.gap)}>
                  {Icon && <Icon className={s.iconSize} />}
                  {tab.label}
                  {tab.count !== undefined && (
                    <span className="text-stone-400">({tab.count})</span>
                  )}
                </span>
                {isActive && (
                  <motion.div
                    layoutId="activeUnderline"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Buttons variant
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-lg bg-stone-100 p-1",
        className
      )}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        const Icon = tab.icon;

        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={cn(
              "relative rounded-md font-medium transition-colors",
              s.text,
              s.padding,
              isActive
                ? "text-stone-900"
                : "text-stone-500 hover:text-stone-700"
            )}
          >
            {isActive && (
              <motion.div
                layoutId="activeButton"
                className="absolute inset-0 rounded-md bg-white shadow-sm"
                transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
              />
            )}
            <span className={cn("relative flex items-center", s.gap)}>
              {Icon && <Icon className={s.iconSize} />}
              {tab.label}
              {tab.count !== undefined && (
                <span className="ml-1 text-xs opacity-75">
                  {tab.count}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// Simple toggle variant for binary choices
interface ToggleTabsProps {
  options: [string, string];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function ToggleTabs({ options, value, onChange, className }: ToggleTabsProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-lg bg-stone-100 p-1",
        className
      )}
    >
      {options.map((option) => (
        <button
          key={option}
          onClick={() => onChange(option)}
          className={cn(
            "relative px-4 py-1.5 rounded-md text-sm font-medium transition-colors",
            value === option
              ? "text-stone-900"
              : "text-stone-500 hover:text-stone-700"
          )}
        >
          {value === option && (
            <motion.div
              layoutId="toggleActive"
              className="absolute inset-0 rounded-md bg-white shadow-sm"
              transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
            />
          )}
          <span className="relative">{option}</span>
        </button>
      ))}
    </div>
  );
}
