"use client";

import { TaskCard } from "@/components/tasks/TaskCard";

interface Task {
  _id: string;
  title?: string;
  agentId?: string;
  type: string;
  status: string;
  createdAt: number;
}

interface TaskListProps {
  tasks: Task[];
  selectedTaskId: string | null;
  onSelectTask: (id: string | null) => void;
  isLoading: boolean;
}

export function TaskList({
  tasks,
  selectedTaskId,
  onSelectTask,
  isLoading,
}: TaskListProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="h-24 rounded-xl border border-[var(--border)] bg-[var(--card-bg)] animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="p-4 rounded-full bg-[var(--surface-1)] mb-4">
          <svg
            className="w-8 h-8 text-[var(--text-secondary)]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12h6m-3-3v6m-7.5 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15A2.25 2.25 0 002.25 6.75v10.5A2.25 2.25 0 004.5 19.5z"
            />
          </svg>
        </div>
        <p className="text-sm font-medium text-[var(--text-primary)]">
          Sin tareas
        </p>
        <p className="text-xs text-[var(--text-secondary)] mt-1">
          No hay tareas en esta categoria
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {tasks.map((task) => (
        <TaskCard
          key={task._id}
          task={task}
          isSelected={task._id === selectedTaskId}
          onSelect={() =>
            onSelectTask(task._id === selectedTaskId ? null : task._id)
          }
        />
      ))}
    </div>
  );
}
