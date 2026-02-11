"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { UnifiedOnboarding } from "@/components/onboarding/UnifiedOnboarding";

export default function OnboardingPage() {
  const router = useRouter();
  const onboarding = useQuery(api.onboarding.get);
  const profile = useQuery(api.brandProfile.getBrandProfile);

  // If already onboarded with a complete brand profile, redirect to dashboard
  useEffect(() => {
    if (onboarding?.completedAt && profile && profile.status === "complete") {
      router.push("/");
    }
  }, [onboarding, profile, router]);

  // Still loading auth/data — show nothing to avoid flash
  if (onboarding === undefined || profile === undefined) {
    return null;
  }

  // Already completed — show nothing while useEffect redirect fires
  if (onboarding?.completedAt && profile && profile.status === "complete") {
    return null;
  }

  return <UnifiedOnboarding />;
}
