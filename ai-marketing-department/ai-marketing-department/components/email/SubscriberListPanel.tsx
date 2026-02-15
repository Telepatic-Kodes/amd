"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/Toast";
import {
  Users,
  Search,
  UserPlus,
  Upload,
  Loader2,
  Mail,
  UserMinus,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";

const STATUS_TABS = [
  { id: "all", label: "Todos" },
  { id: "active", label: "Activos" },
  { id: "unsubscribed", label: "Desuscriptos" },
  { id: "bounced", label: "Rebotados" },
] as const;

export function SubscriberListPanel() {
  const [activeTab, setActiveTab] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const { success, error: showError } = useToast();

  // Add form state
  const [newEmail, setNewEmail] = useState("");
  const [newFirstName, setNewFirstName] = useState("");
  const [newLastName, setNewLastName] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const stats = useQuery(api.email.queries.getSubscriberStats);
  const subscribers = useQuery(api.email.queries.getSubscribers, {
    status: activeTab === "all" ? undefined : activeTab,
    search: searchQuery.length >= 2 ? searchQuery : undefined,
    limit: 50,
  });
  const addSubscriber = useMutation(api.email.mutations.addSubscriber);
  const updateStatus = useMutation(api.email.mutations.updateSubscriberStatus);

  const handleAddSubscriber = async () => {
    if (!newEmail) {
      showError("Error", "El email es requerido");
      return;
    }

    setIsAdding(true);
    try {
      await addSubscriber({
        email: newEmail,
        firstName: newFirstName || undefined,
        lastName: newLastName || undefined,
        tags: [],
        segments: [],
        source: "manual",
      });
      success("Suscriptor agregado", newEmail);
      setNewEmail("");
      setNewFirstName("");
      setNewLastName("");
      setShowAddForm(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error desconocido";
      showError("Error", message);
    } finally {
      setIsAdding(false);
    }
  };

  const handleStatusChange = async (
    subscriberId: string,
    newStatus: "active" | "unsubscribed" | "bounced" | "complained"
  ) => {
    try {
      await updateStatus({
        subscriberId: subscriberId as never,
        status: newStatus,
      });
      success("Estado actualizado", `Suscriptor ${newStatus}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error desconocido";
      showError("Error", message);
    }
  };

  const statusBadge = (status: string) => {
    const config: Record<string, { color: string; label: string }> = {
      active: { color: "bg-[var(--badge-green-bg)] text-[var(--badge-green-text)]", label: "Activo" },
      unsubscribed: { color: "bg-[var(--surface-1)] text-[var(--text-secondary)]", label: "Desuscripto" },
      bounced: { color: "bg-[var(--badge-red-bg)] text-[var(--badge-red-text)]", label: "Rebotado" },
      complained: { color: "bg-[var(--badge-amber-bg)] text-[var(--badge-amber-text)]", label: "Queja" },
    };
    const c = config[status] || config.active;
    return (
      <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", c.color)}>
        {c.label}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {/* Stats Bar */}
      {stats && (
        <div className="grid grid-cols-4 gap-3">
          <div className="p-3 rounded-lg bg-[var(--badge-green-bg)] border border-[var(--badge-green-bg)]">
            <p className="text-xs text-[var(--text-tertiary)]">Activos</p>
            <p className="text-lg font-bold text-[var(--success)]">{stats.active}</p>
          </div>
          <div className="p-3 rounded-lg bg-[var(--surface-0)] border border-[var(--border)]">
            <p className="text-xs text-[var(--text-tertiary)]">Total</p>
            <p className="text-lg font-bold text-[var(--text-secondary)]">{stats.total}</p>
          </div>
          <div className="p-3 rounded-lg bg-[var(--surface-0)] border border-[var(--border)]">
            <p className="text-xs text-[var(--text-tertiary)]">Desuscriptos</p>
            <p className="text-lg font-bold text-[var(--text-tertiary)]">{stats.unsubscribed}</p>
          </div>
          <div className="p-3 rounded-lg bg-[var(--badge-red-bg)] border border-[var(--badge-red-bg)]">
            <p className="text-xs text-[var(--text-tertiary)]">Rebotados</p>
            <p className="text-lg font-bold text-[var(--error)]">{stats.bounced}</p>
          </div>
        </div>
      )}

      {/* Search + Actions */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-tertiary)]" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por email..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--card-bg)] text-sm text-[var(--text-primary)] placeholder-stone-400 focus:border-[var(--success)] focus:outline-none focus:ring-1 focus:ring-[var(--success)]"
          />
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500 text-white text-sm font-medium hover:bg-[var(--success)] transition-colors"
        >
          <UserPlus className="h-4 w-4" />
          Agregar
        </button>
      </div>

      {/* Add Subscriber Form */}
      {showAddForm && (
        <div className="p-4 rounded-lg border border-[var(--badge-green-bg)] bg-[var(--badge-green-bg)] space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <input
              type="email"
              inputMode="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="email@ejemplo.com"
              className="rounded-lg border border-[var(--border)] bg-[var(--card-bg)] py-2 px-3 text-sm text-[var(--text-primary)] placeholder-stone-400 focus:border-[var(--success)] focus:outline-none focus:ring-1 focus:ring-[var(--success)]"
            />
            <input
              type="text"
              value={newFirstName}
              onChange={(e) => setNewFirstName(e.target.value)}
              placeholder="Nombre"
              className="rounded-lg border border-[var(--border)] bg-[var(--card-bg)] py-2 px-3 text-sm text-[var(--text-primary)] placeholder-stone-400 focus:border-[var(--success)] focus:outline-none focus:ring-1 focus:ring-[var(--success)]"
            />
            <input
              type="text"
              value={newLastName}
              onChange={(e) => setNewLastName(e.target.value)}
              placeholder="Apellido"
              className="rounded-lg border border-[var(--border)] bg-[var(--card-bg)] py-2 px-3 text-sm text-[var(--text-primary)] placeholder-stone-400 focus:border-[var(--success)] focus:outline-none focus:ring-1 focus:ring-[var(--success)]"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleAddSubscriber}
              disabled={isAdding || !newEmail}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500 text-white text-sm font-medium hover:bg-[var(--success)] transition-colors disabled:opacity-50"
            >
              {isAdding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
              Agregar
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              className="px-3 py-1.5 rounded-lg text-sm text-[var(--text-tertiary)] hover:bg-[var(--surface-2)] transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Status Filter Tabs */}
      <div className="flex gap-1 border-b border-[var(--border)]">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "px-3 py-2 text-sm font-medium transition-colors border-b-2 -mb-px",
              activeTab === tab.id
                ? "border-[var(--success)] text-[var(--success)]"
                : "border-transparent text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Subscribers Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)]">
              <th className="text-left py-2 px-3 text-xs font-medium text-[var(--text-tertiary)] uppercase">
                Email
              </th>
              <th className="text-left py-2 px-3 text-xs font-medium text-[var(--text-tertiary)] uppercase">
                Nombre
              </th>
              <th className="text-left py-2 px-3 text-xs font-medium text-[var(--text-tertiary)] uppercase">
                Estado
              </th>
              <th className="text-left py-2 px-3 text-xs font-medium text-[var(--text-tertiary)] uppercase">
                Tags
              </th>
              <th className="text-left py-2 px-3 text-xs font-medium text-[var(--text-tertiary)] uppercase">
                Apertura
              </th>
              <th className="text-right py-2 px-3 text-xs font-medium text-[var(--text-tertiary)] uppercase">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            {subscribers === undefined ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-[var(--text-tertiary)]">
                  <Loader2 className="h-5 w-5 animate-spin inline mr-2" />
                  Cargando...
                </td>
              </tr>
            ) : subscribers.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-[var(--text-tertiary)]">
                  <Users className="h-5 w-5 inline mr-2" />
                  No hay suscriptores
                </td>
              </tr>
            ) : (
              subscribers.map((sub) => {
                const openRate =
                  sub.totalSent && sub.totalSent > 0 && sub.totalOpened !== undefined
                    ? Math.round((sub.totalOpened / sub.totalSent) * 100)
                    : 0;

                return (
                  <tr key={sub._id} className="border-b border-[var(--border)] hover:bg-[var(--surface-0)]">
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-2">
                        <Mail className="h-3.5 w-3.5 text-[var(--text-tertiary)]" />
                        <span className="text-[var(--text-primary)]">{sub.email}</span>
                      </div>
                    </td>
                    <td className="py-2 px-3 text-[var(--text-secondary)]">
                      {[sub.firstName, sub.lastName].filter(Boolean).join(" ") || "—"}
                    </td>
                    <td className="py-2 px-3">{statusBadge(sub.status)}</td>
                    <td className="py-2 px-3">
                      <div className="flex gap-1 flex-wrap">
                        {sub.tags.slice(0, 2).map((tag) => (
                          <span
                            key={tag}
                            className="text-xs px-1.5 py-0.5 rounded bg-[var(--surface-1)] text-[var(--text-secondary)]"
                          >
                            {tag}
                          </span>
                        ))}
                        {sub.tags.length > 2 && (
                          <span className="text-xs text-[var(--text-tertiary)]">
                            +{sub.tags.length - 2}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-2 px-3 text-[var(--text-secondary)]">{openRate}%</td>
                    <td className="py-2 px-3 text-right">
                      {sub.status === "active" ? (
                        <button
                          onClick={() => handleStatusChange(sub._id, "unsubscribed")}
                          className="text-xs text-[var(--text-tertiary)] hover:text-[var(--error)] transition-colors"
                          title="Desuscribir"
                        >
                          <UserMinus className="h-3.5 w-3.5" />
                        </button>
                      ) : sub.status === "unsubscribed" ? (
                        <button
                          onClick={() => handleStatusChange(sub._id, "active")}
                          className="text-xs text-[var(--text-tertiary)] hover:text-[var(--success)] transition-colors"
                          title="Reactivar"
                        >
                          <UserPlus className="h-3.5 w-3.5" />
                        </button>
                      ) : null}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
