"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Sparkles, ArrowRight, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";

export function CTASection() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // TODO: Integrate with Convex to save lead
    console.log("Lead submitted:", formData);

    // For now, just show success message
    setSubmitted(true);

    // Reset form after 3 seconds
    setTimeout(() => {
      setSubmitted(false);
      setFormData({ name: "", email: "", company: "" });
    }, 3000);
  };

  return (
    <section
      id="cta-final"
      className="py-24 bg-gradient-to-b from-stone-100/30 to-black"
    >
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
          >
            <Card className="bg-gradient-to-r from-orange-500/10 to-purple-500/10 border-orange-500/20">
              <CardContent className="p-12">
                {/* Header */}
                <div className="text-center mb-12">
                  <motion.div
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/20 border border-orange-500/30 text-orange-300 text-sm font-medium mb-6"
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                  >
                    <Sparkles className="h-4 w-4" />
                    <span>Empieza Hoy</span>
                  </motion.div>

                  <motion.h2
                    className="text-4xl md:text-5xl font-bold text-white mb-6"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                  >
                    Empieza a Automatizar{" "}
                    <span className="bg-gradient-to-r from-orange-400 to-purple-400 bg-clip-text text-transparent">
                      Tu Marketing Hoy
                    </span>
                  </motion.h2>

                  <motion.p
                    className="text-xl text-stone-300 mb-8"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                  >
                    Setup en 5 minutos. Sin tarjeta de crédito. Demo gratuita de
                    30 minutos.
                  </motion.p>

                  {/* Benefits */}
                  <motion.div
                    className="flex flex-wrap justify-center gap-6 mb-12"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.5 }}
                  >
                    {[
                      "Setup en 5 minutos",
                      "Sin tarjeta de crédito",
                      "Demo gratuita",
                      "Soporte incluido",
                    ].map((benefit, index) => (
                      <motion.div
                        key={index}
                        className="flex items-center gap-2 text-stone-400"
                        initial={{ opacity: 0, x: -10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.6 + index * 0.1 }}
                      >
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <span className="text-sm">{benefit}</span>
                      </motion.div>
                    ))}
                  </motion.div>
                </div>

                {/* Form */}
                {!submitted ? (
                  <motion.form
                    onSubmit={handleSubmit}
                    className="max-w-md mx-auto"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.7 }}
                  >
                    <div className="space-y-4">
                      <input
                        type="text"
                        placeholder="Nombre completo"
                        required
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        className="w-full px-4 py-3 bg-stone-100 border border-stone-300 rounded-lg text-white placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                      />
                      <input
                        type="email"
                        placeholder="Email corporativo"
                        required
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        className="w-full px-4 py-3 bg-stone-100 border border-stone-300 rounded-lg text-white placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                      />
                      <input
                        type="text"
                        placeholder="Empresa"
                        required
                        value={formData.company}
                        onChange={(e) =>
                          setFormData({ ...formData, company: e.target.value })
                        }
                        className="w-full px-4 py-3 bg-stone-100 border border-stone-300 rounded-lg text-white placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                      />
                    </div>

                    <Button type="submit" size="lg" className="w-full mt-6">
                      Agendar Demo Ahora
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>

                    <p className="text-center text-stone-500 text-xs mt-4">
                      Al enviar, aceptas nuestros términos y política de
                      privacidad.
                    </p>
                  </motion.form>
                ) : (
                  <motion.div
                    className="text-center py-12"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                    >
                      <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                    </motion.div>
                    <h3 className="text-2xl font-bold text-white mb-2">
                      ¡Gracias!
                    </h3>
                    <p className="text-stone-400">
                      Te contactaremos pronto para agendar tu demo.
                    </p>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
