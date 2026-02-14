"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { BrandManual } from "@/components/brand/BrandManual";
import { Loader2 } from "lucide-react";
import { use } from "react";

export default function PublicManualPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const data = useQuery(api.brandManualShares.getBrandProfileByToken, { token });

  if (data === undefined) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-stone-400" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white gap-4">
        <p className="text-stone-500 text-lg">Este manual no existe o ha expirado.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <BrandManual brandProfile={data.profile} strategy={data.strategy} />
    </div>
  );
}
