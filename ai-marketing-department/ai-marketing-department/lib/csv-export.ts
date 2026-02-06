/**
 * CSV Export Utility
 * Converts analytics data to CSV format and triggers download
 */

interface ExportData {
  executions: Array<{
    timestamp: number;
    agentName: string;
    status: string;
    tokens: number;
    cost: number;
    duration: number;
  }>;
  tasks: Array<{
    createdAt: number;
    title: string;
    type: string;
    priority: string;
    status: string;
    agentName: string;
  }>;
  content: Array<{
    createdAt: number;
    title: string;
    type: string;
    status: string;
    likes: number;
    comments: number;
    shares: number;
    impressions: number;
  }>;
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toISOString();
}

function formatCost(cost: number): string {
  return cost.toFixed(4);
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
  return `${(ms / 60000).toFixed(2)}m`;
}

function escapeCSV(value: string): string {
  // Escape quotes and wrap in quotes if contains comma, quote, or newline
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function arrayToCSV(headers: string[], rows: string[][]): string {
  const headerRow = headers.map(escapeCSV).join(",");
  const dataRows = rows.map((row) => row.map((cell) => escapeCSV(cell)).join(","));
  return [headerRow, ...dataRows].join("\n");
}

export async function exportToCsv(
  data: ExportData,
  filename?: string
): Promise<void> {
  const sections: string[] = [];

  // Section 1: Ejecuciones
  if (data.executions.length > 0) {
    sections.push("## Ejecuciones\n");
    const headers = ["Fecha", "Agente", "Estado", "Tokens", "Costo", "Duracion"];
    const rows = data.executions.map((exec) => [
      formatDate(exec.timestamp),
      exec.agentName,
      exec.status,
      exec.tokens.toString(),
      formatCost(exec.cost),
      formatDuration(exec.duration),
    ]);
    sections.push(arrayToCSV(headers, rows));
    sections.push("\n"); // Empty line between sections
  }

  // Section 2: Tareas
  if (data.tasks.length > 0) {
    sections.push("## Tareas\n");
    const headers = ["Fecha", "Titulo", "Tipo", "Prioridad", "Estado", "Agente"];
    const rows = data.tasks.map((task) => [
      formatDate(task.createdAt),
      task.title,
      task.type,
      task.priority,
      task.status,
      task.agentName,
    ]);
    sections.push(arrayToCSV(headers, rows));
    sections.push("\n"); // Empty line between sections
  }

  // Section 3: Contenido
  if (data.content.length > 0) {
    sections.push("## Contenido\n");
    const headers = [
      "Fecha",
      "Titulo",
      "Tipo",
      "Estado",
      "Likes",
      "Comentarios",
      "Compartidos",
      "Impresiones",
    ];
    const rows = data.content.map((item) => [
      formatDate(item.createdAt),
      item.title,
      item.type,
      item.status,
      item.likes.toString(),
      item.comments.toString(),
      item.shares.toString(),
      item.impressions.toString(),
    ]);
    sections.push(arrayToCSV(headers, rows));
  }

  // Combine all sections
  const csvContent = sections.join("\n");

  // Create Blob and trigger download
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute(
    "download",
    filename || `amd-analytics-${new Date().toISOString().split("T")[0]}.csv`
  );
  link.style.visibility = "hidden";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Clean up the URL object
  URL.revokeObjectURL(url);
}
