import { HeroSection } from "@/components/landing/HeroSection";
import { ProblemSection } from "@/components/landing/ProblemSection";
import { SolutionSection } from "@/components/landing/SolutionSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { CaseStudiesSection } from "@/components/landing/CaseStudiesSection";
import { ComparisonTable } from "@/components/landing/ComparisonTable";
import { TestimonialsSection } from "@/components/landing/TestimonialsSection";
import { PricingSection } from "@/components/landing/PricingSection";
import { FAQSection } from "@/components/landing/FAQSection";
import { CTASection } from "@/components/landing/CTASection";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-black">
      {/* 1. Hero + Value Proposition */}
      <HeroSection />

      {/* 2. Pain Points (Problemas) */}
      <ProblemSection />

      {/* 3. Solution (6 Departamentos) */}
      <SolutionSection />

      {/* 4. How It Works (3 Pasos) */}
      <HowItWorksSection />

      {/* 5. Casos de Éxito (3 Casos con Datos Realistas) */}
      <CaseStudiesSection />

      {/* 6. Comparison Table (AMD vs Alternativas) */}
      <ComparisonTable />

      {/* 7. Testimonials (3 Quotes) */}
      <TestimonialsSection />

      {/* 8. Pricing (3 Tiers) */}
      <PricingSection />

      {/* 9. FAQ (6 Preguntas) */}
      <FAQSection />

      {/* 10. CTA Final (Conversión) */}
      <CTASection />
    </div>
  );
}
