"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AccordionItem {
  id: string;
  question: string;
  answer: string;
}

export interface AccordionProps {
  items: AccordionItem[];
  allowMultiple?: boolean;
}

export function Accordion({ items, allowMultiple = false }: AccordionProps) {
  const [openItems, setOpenItems] = useState<string[]>([]);

  const toggleItem = (id: string) => {
    if (allowMultiple) {
      setOpenItems((prev) =>
        prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
      );
    } else {
      setOpenItems((prev) => (prev.includes(id) ? [] : [id]));
    }
  };

  return (
    <div className="space-y-4">
      {items.map((item) => {
        const isOpen = openItems.includes(item.id);
        return (
          <div
            key={item.id}
            className="border border-stone-200 rounded-lg bg-[#faf8f4]/50 overflow-hidden transition-all duration-200 hover:border-stone-300"
          >
            <button
              onClick={() => toggleItem(item.id)}
              className="w-full flex items-center justify-between p-6 text-left"
            >
              <h3 className="text-lg font-semibold text-white pr-4">
                {item.question}
              </h3>
              <ChevronDown
                className={cn(
                  "h-5 w-5 text-stone-400 transition-transform duration-200 flex-shrink-0",
                  isOpen && "transform rotate-180"
                )}
              />
            </button>
            <div
              className={cn(
                "overflow-hidden transition-all duration-300",
                isOpen ? "max-h-96" : "max-h-0"
              )}
            >
              <div className="p-6 pt-0 text-stone-400 leading-relaxed">
                {item.answer}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
