"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { BrandManual } from "@/components/brand/BrandManual";
import { ArrowLeft, Download, Link2, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useToast } from "@/components/ui/Toast";

export default function BrandManualPage() {
  const brandProfile = useQuery(api.brandProfile.getBrandProfile);
  const activeStrategy = useQuery(api.cmoEngine.getActiveStrategy);
  const createShare = useMutation(api.brandManualShares.createShare);
  const { toast } = useToast();
  const [sharing, setSharing] = useState(false);

  if (brandProfile === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-stone-400" />
      </div>
    );
  }

  if (!brandProfile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-stone-500">No hay perfil de marca configurado.</p>
        <Link href="/brand" className="text-orange-600 hover:underline">
          Crear perfil de marca
        </Link>
      </div>
    );
  }

  const handlePrint = () => window.print();

  const handleShare = async () => {
    setSharing(true);
    try {
      const { token } = await createShare({ brandProfileId: brandProfile._id });
      const url = `${window.location.origin}/manual/${token}`;
      await navigator.clipboard.writeText(url);
      toast({ title: "Link copiado", description: "El link público fue copiado al portapapeles." });
    } catch {
      toast({ title: "Error", description: "No se pudo crear el link.", variant: "destructive" });
    } finally {
      setSharing(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Top Bar — hidden in print */}
      <div className="brand-manual-doc no-print sticky top-0 z-10 bg-white/80 backdrop-blur border-b border-stone-200 px-6 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link
            href="/brand"
            className="inline-flex items-center gap-2 text-sm text-stone-500 hover:text-stone-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a Marca
          </Link>
          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              disabled={sharing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-stone-300 text-stone-700 hover:bg-stone-50 transition-colors disabled:opacity-50"
            >
              {sharing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Link2 className="h-3.5 w-3.5" />}
              Copiar Link Público
            </button>
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-stone-900 text-white hover:bg-stone-800 transition-colors"
            >
              <Download className="h-3.5 w-3.5" />
              Descargar PDF
            </button>
          </div>
        </div>
      </div>

      {/* Document */}
      <BrandManual brandProfile={brandProfile} strategy={activeStrategy} />
    </div>
  );
}
