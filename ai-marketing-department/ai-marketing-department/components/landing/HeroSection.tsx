"use client";

import { Button } from "@/components/ui/Button";
import { Bot, Sparkles, ArrowRight } from "lucide-react";
import { SimpleCounter } from "@/components/ui/AnimatedCounter";
import { motion } from "framer-motion";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const agentItemVariants = {
  initial: { opacity: 0, scale: 0.8 },
  animate: { opacity: 1, scale: 1 },
};

export function HeroSection() {
  const scrollToDemo = () => {
    const ctaSection = document.getElementById("cta-final");
    ctaSection?.scrollIntoView({ behavior: "smooth" });
  };

  const scrollToHowItWorks = () => {
    const howItWorksSection = document.getElementById("how-it-works");
    howItWorksSection?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-black">
      {/* Gradient background */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-b from-orange-500/10 via-purple-500/5 to-black"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      />

      {/* Grid pattern */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20" />

      <div className="container mx-auto px-4 py-32 relative z-10">
        <div className="max-w-5xl mx-auto text-center">
          {/* Badge */}
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-sm font-medium mb-8"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Sparkles className="h-4 w-4" />
            <span>Automatización de Marketing con IA</span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            Tu Departamento de Marketing Completo,{" "}
            <span className="bg-gradient-to-r from-orange-400 to-purple-400 bg-clip-text text-transparent">
              Operado por 37 Agentes de IA
            </span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            className="text-xl md:text-2xl text-stone-400 mb-12 max-w-3xl mx-auto leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            Automatiza contenido, SEO, social media y ads. Ahorra hasta{" "}
            <span className="text-green-400 font-semibold">
              <SimpleCounter value={450} duration={2000} />k/año
            </span>
            .
          </motion.p>

          {/* CTAs */}
          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
          >
            <Button size="lg" onClick={scrollToDemo}>
              Agendar Demo
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button size="lg" variant="outline" onClick={scrollToHowItWorks}>
              Ver Cómo Funciona
            </Button>
          </motion.div>

          {/* Agent Grid Preview */}
          <motion.div
            className="mt-20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 1 }}
          >
            <motion.div
              className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 max-w-4xl mx-auto"
              variants={staggerContainer}
              initial="initial"
              animate="animate"
            >
              {Array.from({ length: 37 }).map((_, i) => (
                <motion.div
                  key={i}
                  className="aspect-square rounded-lg bg-stone-100/50 border border-stone-200 flex items-center justify-center hover:border-orange-500/50 transition-all duration-300"
                  variants={agentItemVariants}
                  whileHover={{ scale: 1.1, borderColor: "rgba(99, 102, 241, 0.5)" }}
                  transition={{ duration: 0.2 }}
                >
                  <Bot className="h-6 w-6 text-stone-600 hover:text-orange-500" />
                </motion.div>
              ))}
            </motion.div>
            <motion.p
              className="text-stone-500 text-sm mt-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 1.4 }}
            >
              37 agentes especializados trabajando 24/7 en tu marketing
            </motion.p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
