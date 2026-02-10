"use client";

import { Card, CardContent } from "@/components/ui/Card";
import { testimonials } from "@/lib/landing-data";
import { Quote, Star } from "lucide-react";
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
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5 },
  },
};

export function TestimonialsSection() {
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
              Lo Que Dicen Nuestros Clientes
            </h2>
            <p className="text-xl text-stone-400 max-w-3xl mx-auto">
              Líderes de marketing que están transformando sus departamentos con
              AMD.
            </p>
          </motion.div>

          {/* Testimonial Cards */}
          <motion.div
            className="grid gap-8 md:grid-cols-3"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
          >
            {testimonials.map((testimonial) => (
              <motion.div key={testimonial.id} variants={cardVariants}>
                <Card hover className="h-full">
                  <CardContent className="p-8">
                    {/* Stars */}
                    <motion.div
                      className="flex gap-1 mb-6"
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.2 }}
                    >
                      {[...Array(5)].map((_, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, scale: 0 }}
                          whileInView={{ opacity: 1, scale: 1 }}
                          viewport={{ once: true }}
                          transition={{ delay: i * 0.05 + 0.3 }}
                        >
                          <Star className="h-5 w-5 fill-yellow-500 text-yellow-500" />
                        </motion.div>
                      ))}
                    </motion.div>

                    {/* Quote */}
                    <Quote className="h-8 w-8 text-orange-500 mb-4" />
                    <p className="text-stone-300 leading-relaxed mb-6">
                      "{testimonial.quote}"
                    </p>

                    {/* Author */}
                    <div className="border-t border-stone-200 pt-4">
                      <p className="text-white font-semibold">
                        {testimonial.author}
                      </p>
                      <p className="text-stone-500 text-sm">
                        {testimonial.role} at {testimonial.company}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
