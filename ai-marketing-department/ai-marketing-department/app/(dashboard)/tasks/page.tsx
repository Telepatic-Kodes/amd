"use client";

import { useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { ListTodo } from "lucide-react";
import { cn } from "@/lib/utils";
import { TaskList } from "@/components/tasks/TaskList";
import { TaskDetailPanel } from "@/components/tasks/TaskDetailPanel";

const STATUS_TABS = [
  { id: "all", label: "Todos" },
  { id: "pending", label: "Pendientes" },
  { id: "running", label: "Ejecutando" },
  { id: "completed", label: "Completadas" },
  { id: "failed", label: "Fallidas" },
];

export default function TasksPage() {
  const [activeTab, setActiveTab] = useState("all");
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const tasks = useQuery(
    api.functions.listTasks,
    activeTab === "all" ? {} : { status: activeTab }
  );

  const pendingTasks = useQuery(api.functions.getPendingTasks);

  const selectedTask = useMemo(() => {
    if (!selectedTaskId || !tasks) return null;
    return (
      tasks.find(
        (t: Record<string, unknown>) => t._id === selectedTaskId
      ) || null
    );
  }, [selectedTaskId, tasks]);

  const isLoading = tasks === undefined;
  const pendingCount = pendingTasks?.length ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-xl bg-[var(--surface-1)]">
          <ListTodo className="w-8 h-8 text-orange-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">
            Tareas
          </h1>
          <p className="text-[var(--text-secondary)] text-sm">
            {pendingCount > 0
              ? `${pendingCount} tarea${pendingCount !== 1 ? "s" : ""} pendiente${pendingCount !== 1 ? "s" : ""}`
              : "Sin tareas pendientes"}
          </p>
        </div>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              setSelectedTaskId(null);
            }}
            className={cn(
              "px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors",
              activeTab === tab.id
                ? "bg-[var(--accent)] text-white"
                : "text-[var(--text-secondary)] hover:bg-[var(--surface-1)]"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Content */}
      <div className="flex gap-6">
        {/* Task List */}
        <div className={cn("flex-1 min-w-0", selectedTask && "lg:max-w-[60%]")}>
          <TaskList
            tasks={(tasks as Record<string, unknown>[] | undefined) ?? []}
            selectedTaskId={selectedTaskId}
            onSelectTask={setSelectedTaskId}
            isLoading={isLoading}
          />
        </div>

        {/* Detail Panel */}
        {selectedTask && (
          <div className="hidden lg:block w-80 flex-shrink-0">
            <TaskDetailPanel
              task={selectedTask as Record<string, unknown> as TaskDetailPanelProps["task"]}
              onClose={() => setSelectedTaskId(null)}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// Extract the type for cleaner casting
type TaskDetailPanelProps = React.ComponentProps<typeof TaskDetailPanel>;
