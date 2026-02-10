"use client";

import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Check, Star } from "lucide-react";
import { PricingTier } from "@/lib/landing-data";

interface PricingCardProps {
  tier: PricingTier;
}

export function PricingCard({ tier }: PricingCardProps) {
  const handleCTA = () => {
    if (tier.name === "Enterprise") {
      // Open contact form or email
      window.location.href = "mailto:sales@amd.com";
    } else {
      // Scroll to CTA form
      const ctaSection = document.getElementById("cta-final");
      ctaSection?.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <Card
      hover
      className={
        tier.popular
          ? "border-orange-500 relative scale-105"
          : "border-stone-200"
      }
    >
      {tier.popular && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <Badge variant="info" className="flex items-center gap-1 px-4 py-1">
            <Star className="h-3 w-3 fill-current" />
            <span className="font-bold">MÁS POPULAR</span>
          </Badge>
        </div>
      )}

      <CardContent className="p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h3 className="text-2xl font-bold text-white mb-2">{tier.name}</h3>
          <div className="flex items-baseline justify-center gap-2 mb-4">
            <span className="text-5xl font-bold text-white">{tier.price}</span>
            {tier.priceMonthly && (
              <span className="text-stone-500 text-lg">/mes</span>
            )}
          </div>
          <p className="text-stone-400 text-sm">{tier.idealFor}</p>
        </div>

        {/* Features */}
        <ul className="space-y-3 mb-8">
          {tier.features.map((feature, index) => (
            <li key={index} className="flex items-start gap-3">
              <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
              <span className="text-stone-300 text-sm">{feature}</span>
            </li>
          ))}
        </ul>

        {/* CTA Button */}
        <Button
          size="lg"
          variant={tier.popular ? "primary" : "secondary"}
          className="w-full"
          onClick={handleCTA}
        >
          {tier.cta}
        </Button>
      </CardContent>
    </Card>
  );
}
