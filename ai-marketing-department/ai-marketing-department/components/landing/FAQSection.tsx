"use client";

import { Accordion } from "@/components/ui/Accordion";
import { faqItems } from "@/lib/landing-data";
import { HelpCircle } from "lucide-react";
import { motion } from "framer-motion";

export function FAQSection() {
  return (
    <section className="py-24 bg-zinc-950/50">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
          >
            <motion.div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-sm font-medium mb-6"
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <HelpCircle className="h-4 w-4" />
              <span>Preguntas Frecuentes</span>
            </motion.div>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              ¿Tienes Preguntas?
            </h2>
            <p className="text-xl text-zinc-400">
              Respondemos las dudas más comunes sobre AMD.
            </p>
          </motion.div>

          {/* FAQ Accordion */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Accordion items={faqItems} allowMultiple={false} />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
