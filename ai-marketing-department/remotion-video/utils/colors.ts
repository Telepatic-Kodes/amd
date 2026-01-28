// Department colors for video
export const departmentColors = {
  leadership: {
    primary: "rgb(168, 85, 247)",   // purple-500
    bg: "rgba(168, 85, 247, 0.1)",
    glow: "rgba(168, 85, 247, 0.3)",
  },
  content: {
    primary: "rgb(59, 130, 246)",   // blue-500
    bg: "rgba(59, 130, 246, 0.1)",
    glow: "rgba(59, 130, 246, 0.3)",
  },
  social: {
    primary: "rgb(236, 72, 153)",   // pink-500
    bg: "rgba(236, 72, 153, 0.1)",
    glow: "rgba(236, 72, 153, 0.3)",
  },
  demandgen: {
    primary: "rgb(249, 115, 22)",   // orange-500
    bg: "rgba(249, 115, 22, 0.1)",
    glow: "rgba(249, 115, 22, 0.3)",
  },
  seo: {
    primary: "rgb(34, 197, 94)",    // green-500
    bg: "rgba(34, 197, 94, 0.1)",
    glow: "rgba(34, 197, 94, 0.3)",
  },
  brand: {
    primary: "rgb(234, 179, 8)",    // yellow-500
    bg: "rgba(234, 179, 8, 0.1)",
    glow: "rgba(234, 179, 8, 0.3)",
  },
  ops: {
    primary: "rgb(6, 182, 212)",    // cyan-500
    bg: "rgba(6, 182, 212, 0.1)",
    glow: "rgba(6, 182, 212, 0.3)",
  },
};

export const departmentLabels: Record<string, string> = {
  leadership: "Leadership",
  content: "Content",
  social: "Social Media",
  demandgen: "Demand Gen",
  seo: "SEO",
  brand: "Brand & Creative",
  ops: "Marketing Ops",
};

export const statusColors = {
  active: "rgb(34, 197, 94)",     // green
  paused: "rgb(234, 179, 8)",     // yellow
  error: "rgb(239, 68, 68)",      // red
  maintenance: "rgb(59, 130, 246)", // blue
};

// Alias for backward compatibility
export const departmentNames = departmentLabels;
