"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { comparisonFeatures } from "@/lib/landing-data";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export function ComparisonTable() {
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
              AMD vs Alternativas
            </h2>
            <p className="text-xl text-zinc-400 max-w-3xl mx-auto">
              Compara el costo, tiempo, y resultados de AMD contra las opciones
              tradicionales.
            </p>
          </motion.div>

          {/* Table */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-zinc-800">
                        <th className="text-left p-4 text-zinc-400 font-semibold">
                          Característica
                        </th>
                        <th className="text-center p-4 text-zinc-400 font-semibold">
                          Equipo Tradicional
                        </th>
                        <th className="text-center p-4 text-zinc-400 font-semibold">
                          Agencia
                        </th>
                        <th className="text-center p-4 text-zinc-400 font-semibold">
                          Freelancers
                        </th>
                        <th className="text-center p-4 bg-indigo-500/10 text-indigo-400 font-bold">
                          AMD
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {comparisonFeatures.map((feature, index) => (
                        <motion.tr
                          key={index}
                          className="border-b border-zinc-800/50 hover:bg-zinc-900/20 transition-colors"
                          initial={{ opacity: 0, x: -20 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <td className="p-4 text-white font-medium">
                            {feature.feature}
                          </td>
                          <td className="p-4 text-center text-zinc-400">
                            {feature.traditional}
                          </td>
                          <td className="p-4 text-center text-zinc-400">
                            {feature.agency}
                          </td>
                          <td className="p-4 text-center text-zinc-400">
                            {feature.freelancers}
                          </td>
                          <td
                            className={cn(
                              "p-4 text-center font-bold bg-indigo-500/5",
                              feature.amdHighlight
                                ? "text-green-400"
                                : "text-white"
                            )}
                          >
                            {feature.amd}
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Savings Banner */}
          <motion.div
            className="mt-12 text-center"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <Card className="inline-block bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/20">
              <CardContent className="px-12 py-8">
                <p className="text-zinc-400 text-lg mb-2">
                  Ahorro promedio anual con AMD:
                </p>
                <div className="text-5xl font-bold text-green-400">
                  $150k - $450k
                </div>
                <p className="text-zinc-500 mt-2 text-sm">
                  Basado en comparación con equipo tradicional
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
