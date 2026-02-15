"use client";

import { useState, useCallback, useMemo } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { usePathname } from "next/navigation";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { useBrandContext } from "./useBrandContext";

const PAGE_LABELS: Record<string, string> = {
  "/": "Inicio",
  "/content": "Contenido",
  "/strategy": "Estrategia",
  "/analytics": "Analíticas",
  "/agents": "Agentes",
  "/monitoring": "Monitoreo",
  "/publishing": "Publicaciones",
  "/reports": "Reportes",
  "/settings": "Configuración",
  "/tasks": "Tareas",
  "/brand": "Marca",
  "/knowledge-base": "Base de Conocimiento",
};

interface CopilotSuggestion {
  label: string;
  message: string;
}

const PAGE_SUGGESTIONS: Record<string, CopilotSuggestion[]> = {
  "/": [
    { label: "Resumen del dia", message: "Dame un resumen de las actividades de marketing de hoy" },
    { label: "Tareas pendientes", message: "Que tareas de marketing necesitan atencion hoy?" },
    { label: "KPIs principales", message: "Cuales son los KPIs mas importantes a revisar esta semana?" },
  ],
  "/content": [
    { label: "Crear post LinkedIn", message: "Ayudame a crear un post para LinkedIn sobre nuestra marca" },
    { label: "Revisar borradores", message: "Cuantos contenidos hay en borrador y cuales debo revisar primero?" },
    { label: "Ideas de contenido", message: "Sugiere 5 ideas de contenido para esta semana" },
  ],
  "/strategy": [
    { label: "Estado estrategia", message: "Cual es el estado actual de la estrategia de marketing?" },
    { label: "Generar estrategia", message: "Necesito generar una nueva estrategia de contenido. Que datos necesitas?" },
    { label: "Optimizar campana", message: "Como puedo optimizar las campanas activas?" },
  ],
  "/analytics": [
    { label: "Top 5 contenidos", message: "Cuales son los 5 contenidos con mejor rendimiento?" },
    { label: "Comparar periodos", message: "Compara el rendimiento de esta semana vs la anterior" },
    { label: "Tendencias", message: "Que tendencias ves en las metricas de engagement?" },
  ],
  "/agents": [
    { label: "Ejecutar agente", message: "Que agentes deberia ejecutar para mejorar la produccion de contenido?" },
    { label: "Ver errores", message: "Hay agentes con errores o que necesiten atencion?" },
    { label: "Optimizar agentes", message: "Como puedo optimizar la configuracion de los agentes?" },
  ],
};

export function useCopilot() {
  const pathname = usePathname();
  const { activeBrand, activeBrandId } = useBrandContext();

  const [isOpen, setIsOpen] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState<Id<"copilotConversations"> | null>(null);
  const [isSending, setIsSending] = useState(false);

  // Queries — only run when copilot is open to avoid errors if backend tables don't exist yet
  const conversations = useQuery(api.copilot.listConversations, isOpen ? { limit: 10 } : "skip");
  const messages = useQuery(
    api.copilot.getConversationMessages,
    isOpen && activeConversationId ? { conversationId: activeConversationId } : "skip"
  );

  // Mutations & actions
  const createConversation = useMutation(api.copilot.createConversation);
  const clearConversation = useMutation(api.copilot.clearConversation);
  const sendMessageAction = useAction(api.copilot.sendMessage);

  // Current page context
  const currentPage = useMemo(() => {
    const base = "/" + (pathname.split("/")[1] || "");
    return PAGE_LABELS[base] || pathname;
  }, [pathname]);

  // Context-aware suggestions
  const suggestions = useMemo<CopilotSuggestion[]>(() => {
    const base = "/" + (pathname.split("/")[1] || "");
    return PAGE_SUGGESTIONS[base] || PAGE_SUGGESTIONS["/"] || [];
  }, [pathname]);

  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);
  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  const startNewConversation = useCallback(async () => {
    const base = "/" + (pathname.split("/")[1] || "");
    const id = await createConversation({
      brandProfileId: activeBrandId ?? undefined,
      context: { page: base },
    });
    setActiveConversationId(id);
    return id;
  }, [createConversation, activeBrandId, pathname]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isSending) return;

      setIsSending(true);
      try {
        let conversationId = activeConversationId;
        if (!conversationId) {
          conversationId = await startNewConversation();
        }

        await sendMessageAction({
          conversationId,
          message: text,
          context: {
            page: currentPage,
            brandName: activeBrand?.companyName,
            brandIndustry: activeBrand?.industry,
          },
        });
      } finally {
        setIsSending(false);
      }
    },
    [activeConversationId, isSending, startNewConversation, sendMessageAction, currentPage, activeBrand]
  );

  const clearCurrentConversation = useCallback(async () => {
    if (activeConversationId) {
      await clearConversation({ conversationId: activeConversationId });
      setActiveConversationId(null);
    }
  }, [activeConversationId, clearConversation]);

  const selectConversation = useCallback((id: Id<"copilotConversations">) => {
    setActiveConversationId(id);
  }, []);

  return {
    isOpen,
    toggle,
    open,
    close,
    messages: messages ?? [],
    conversations: conversations ?? [],
    isSending,
    sendMessage,
    currentPage,
    suggestions,
    activeConversationId,
    startNewConversation,
    clearCurrentConversation,
    selectConversation,
    brandName: activeBrand?.companyName,
  };
}
