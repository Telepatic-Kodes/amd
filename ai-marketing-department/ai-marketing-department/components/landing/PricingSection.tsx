"use client";

import { pricingTiers } from "@/lib/landing-data";
import { PricingCard } from "./PricingCard";
import { DollarSign } from "lucide-react";
import { motion } from "framer-motion";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 },
  },
};

export function PricingSection() {
  return (
    <section className="py-24 bg-black">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
          >
            <motion.div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--accent)]/10 border border-[var(--accent)]/20 text-[var(--accent)] text-sm font-medium mb-6"
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <DollarSign className="h-4 w-4" />
              <span>Pricing Transparente</span>
            </motion.div>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Planes para Cada Etapa de{" "}
              <span className="text-[var(--accent)]">Crecimiento</span>
            </h2>
            <p className="text-xl text-[var(--text-tertiary)] max-w-3xl mx-auto">
              Desde startups hasta enterprises, tenemos un plan que se ajusta a
              tus necesidades.
            </p>
          </motion.div>

          {/* Pricing Cards */}
          <motion.div
            className="grid gap-8 md:grid-cols-3 items-center"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
          >
            {pricingTiers.map((tier, index) => (
              <motion.div key={index} variants={cardVariants}>
                <PricingCard tier={tier} />
              </motion.div>
            ))}
          </motion.div>

          {/* Additional Info */}
          <motion.div
            className="mt-12 text-center"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <p className="text-[var(--text-tertiary)] text-sm">
              Todos los planes incluyen setup gratuito y onboarding completo.
              <br />
              Sin contratos, cancela cuando quieras.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
