"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export interface TimelineItem {
  id: string;
  title: string;
  description: string;
  icon?: React.ReactNode;
}

export interface TimelineProps {
  items: TimelineItem[];
  orientation?: "horizontal" | "vertical";
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.3,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 },
  },
};

export function Timeline({ items, orientation = "horizontal" }: TimelineProps) {
  if (orientation === "vertical") {
    return (
      <motion.div
        className="space-y-8"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        {items.map((item, index) => (
          <motion.div key={item.id} className="flex gap-6" variants={itemVariants}>
            {/* Timeline icon/line */}
            <div className="flex flex-col items-center">
              <motion.div
                className="rounded-full bg-indigo-600 p-3 text-white"
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ duration: 0.2 }}
              >
                {item.icon || (
                  <div className="h-6 w-6 flex items-center justify-center font-bold">
                    {index + 1}
                  </div>
                )}
              </motion.div>
              {index < items.length - 1 && (
                <motion.div
                  className="w-0.5 h-full bg-zinc-800 mt-2"
                  initial={{ scaleY: 0 }}
                  whileInView={{ scaleY: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  style={{ originY: 0 }}
                />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 pb-8">
              <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
              <p className="text-zinc-400">{item.description}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>
    );
  }

  // Horizontal orientation
  return (
    <div className="relative">
      {/* Connecting line */}
      <motion.div
        className="absolute top-6 left-0 right-0 h-0.5 bg-zinc-800 hidden md:block"
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
      />

      <motion.div
        className="grid gap-8 md:grid-cols-3 relative"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        {items.map((item, index) => (
          <motion.div
            key={item.id}
            className="flex flex-col items-center text-center"
            variants={itemVariants}
          >
            {/* Icon */}
            <motion.div
              className="relative z-10 rounded-full bg-indigo-600 p-3 text-white mb-4"
              whileHover={{ scale: 1.15, rotate: 10 }}
              transition={{ duration: 0.2 }}
            >
              {item.icon || (
                <div className="h-6 w-6 flex items-center justify-center font-bold">
                  {index + 1}
                </div>
              )}
            </motion.div>

            {/* Content */}
            <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
            <p className="text-zinc-400">{item.description}</p>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
