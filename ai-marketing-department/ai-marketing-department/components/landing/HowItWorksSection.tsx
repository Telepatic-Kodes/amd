"use client";

import { Timeline, TimelineItem } from "@/components/ui/Timeline";
import { Settings, Bot, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";

const steps: TimelineItem[] = [
  {
    id: "step-1",
    title: "Configura en 5 minutos",
    description:
      "Conecta tus herramientas de marketing, define tu estrategia, y activa los agentes relevantes. Sin código.",
    icon: <Settings className="h-6 w-6" />,
  },
  {
    id: "step-2",
    title: "Los agentes ejecutan 24/7",
    description:
      "37 agentes especializados trabajan continuamente: investigan, crean contenido, optimizan campañas, y analizan resultados.",
    icon: <Bot className="h-6 w-6" />,
  },
  {
    id: "step-3",
    title: "Tú apruebas y publicas",
    description:
      "Revisas el contenido generado en tu dashboard, apruebas lo que te gusta, y publicas con un click. Control total.",
    icon: <CheckCircle className="h-6 w-6" />,
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-24 bg-[#faf8f4]/50">
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
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              ¿Cómo Funciona?
            </h2>
            <p className="text-xl text-[var(--text-tertiary)] max-w-3xl mx-auto">
              Desde onboarding hasta ejecución continua, AMD se integra
              perfectamente en tu workflow de marketing.
            </p>
          </motion.div>

          {/* Timeline */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Timeline items={steps} orientation="horizontal" />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
