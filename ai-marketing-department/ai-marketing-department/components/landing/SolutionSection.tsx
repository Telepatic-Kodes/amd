"use client";

import { Card, CardContent } from "@/components/ui/Card";
import { departments } from "@/lib/landing-data";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
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

export function SolutionSection() {
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
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              6 Departamentos.{" "}
              <span className="bg-gradient-to-r from-orange-400 to-purple-400 bg-clip-text text-transparent">
                37 Agentes Especializados.
              </span>
            </h2>
            <p className="text-xl text-stone-400 max-w-3xl mx-auto">
              Un departamento de marketing completo operado por IA, coordinado y
              trabajando 24/7 en tus campañas.
            </p>
          </motion.div>

          {/* Department Cards */}
          <motion.div
            className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
          >
            {departments.map((dept, index) => (
              <motion.div key={index} variants={cardVariants}>
                <Card
                  hover
                  className="group hover:border-orange-500/50 transition-all duration-300 h-full"
                >
                  <CardContent className="p-8">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <motion.h3
                        className={cn("text-2xl font-bold", dept.color)}
                        whileHover={{ scale: 1.05 }}
                        transition={{ duration: 0.2 }}
                      >
                        {dept.name}
                      </motion.h3>
                      <Badge variant="default" className="text-sm">
                        {dept.agentCount} agentes
                      </Badge>
                    </div>

                    {/* Description */}
                    <p className="text-stone-400 mb-6">{dept.description}</p>

                    {/* Capabilities */}
                    <div className="space-y-2">
                      <p className="text-xs text-stone-500 uppercase font-semibold mb-3">
                        Capacidades:
                      </p>
                      <ul className="space-y-2">
                        {dept.capabilities.map((capability, i) => (
                          <motion.li
                            key={i}
                            className="flex items-start gap-2 text-sm text-stone-300"
                            initial={{ opacity: 0, x: -10 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.05 }}
                          >
                            <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                            <span>{capability}</span>
                          </motion.li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          {/* Stats Banner */}
          <motion.div
            className="mt-16 text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <Card className="bg-gradient-to-r from-orange-500/10 to-purple-500/10 border-orange-500/20">
              <CardContent className="px-8 py-12">
                <div className="grid gap-8 md:grid-cols-3">
                  {[
                    { value: "37", label: "Agentes Especializados" },
                    { value: "24/7", label: "Operación Continua" },
                    { value: "$2.5k", label: "Precio mensual" },
                  ].map((stat, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, scale: 0.8 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <div className="text-4xl font-bold text-white mb-2">
                        {stat.value}
                      </div>
                      <p className="text-stone-400">{stat.label}</p>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
