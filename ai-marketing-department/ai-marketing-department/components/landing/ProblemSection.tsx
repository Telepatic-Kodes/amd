"use client";

import { Card, CardContent } from "@/components/ui/Card";
import { Users, DollarSign, TrendingDown } from "lucide-react";
import { SimpleCounter } from "@/components/ui/AnimatedCounter";
import { motion } from "framer-motion";

const problems = [
  {
    icon: Users,
    title: "Contratar un equipo",
    cost: "$200k-500k/año",
    costValue: 350,
    description:
      "Un equipo de marketing completo requiere 5-7 especialistas con salarios, beneficios, y overhead operativo.",
    color: "text-red-500",
  },
  {
    icon: DollarSign,
    title: "Agencias tradicionales",
    cost: "$5k-15k/mes",
    costValue: 10,
    description:
      "Las agencias cobran retainers altos por servicios limitados y tiempos de entrega lentos.",
    color: "text-orange-500",
  },
  {
    icon: TrendingDown,
    title: "Freelancers inconsistentes",
    cost: "$3k-8k/mes",
    costValue: 5,
    description:
      "Los freelancers son económicos pero inconsistentes, difíciles de coordinar, y no escalan.",
    color: "text-yellow-500",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
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

export function ProblemSection() {
  return (
    <section className="py-24 bg-[#faf8f4]/50">
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
              El Marketing Tradicional es{" "}
              <span className="text-red-500">Ineficiente y Caro</span>
            </h2>
            <p className="text-xl text-stone-400 max-w-3xl mx-auto">
              Las empresas gastan cientos de miles de dólares en equipos o
              agencias que no pueden escalar ni mantener la consistencia.
            </p>
          </motion.div>

          {/* Problem Cards */}
          <motion.div
            className="grid gap-8 md:grid-cols-3"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
          >
            {problems.map((problem, index) => (
              <motion.div key={index} variants={itemVariants}>
                <Card hover className="h-full">
                  <CardContent className="p-8">
                    {/* Icon */}
                    <motion.div
                      className={`inline-flex p-4 rounded-lg bg-stone-100 mb-6 ${problem.color}`}
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ duration: 0.2 }}
                    >
                      <problem.icon className="h-8 w-8" />
                    </motion.div>

                    {/* Title */}
                    <h3 className="text-2xl font-bold text-white mb-3">
                      {problem.title}
                    </h3>

                    {/* Cost */}
                    <div className="text-3xl font-bold mb-4 ${problem.color}">
                      <span className={problem.color}>{problem.cost}</span>
                    </div>

                    {/* Description */}
                    <p className="text-stone-400 leading-relaxed">
                      {problem.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          {/* Total Cost Banner */}
          <motion.div
            className="mt-12 text-center"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Card className="inline-block">
              <CardContent className="px-12 py-8">
                <p className="text-stone-400 text-lg mb-2">
                  Costo promedio anual de marketing tradicional:
                </p>
                <div className="text-5xl font-bold text-red-500">
                  $<SimpleCounter value={150} duration={2000} />k - $
                  <SimpleCounter value={500} duration={2000} />k
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
