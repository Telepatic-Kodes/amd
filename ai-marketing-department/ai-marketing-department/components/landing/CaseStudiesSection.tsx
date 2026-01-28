"use client";

import { caseStudies } from "@/lib/landing-data";
import { CaseStudyCard } from "./CaseStudyCard";
import { Briefcase } from "lucide-react";
import { motion } from "framer-motion";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6 },
  },
};

export function CaseStudiesSection() {
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
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-sm font-medium mb-6"
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <Briefcase className="h-4 w-4" />
              <span>Casos de Éxito</span>
            </motion.div>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Resultados Reales de{" "}
              <span className="text-green-400">Clientes Reales</span>
            </h2>
            <p className="text-xl text-zinc-400 max-w-3xl mx-auto">
              Empresas de diferentes industrias están escalando su marketing con
              AMD sin contratar equipos adicionales.
            </p>
          </motion.div>

          {/* Case Study Cards */}
          <motion.div
            className="grid gap-8 md:grid-cols-2 lg:grid-cols-3"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
          >
            {caseStudies.map((caseStudy, index) => (
              <motion.div key={index} variants={cardVariants}>
                <CaseStudyCard caseStudy={caseStudy} />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
