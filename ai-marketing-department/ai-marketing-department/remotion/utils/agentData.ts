// Mock agent data for the video demo
export interface Agent {
  id: string;
  agentId: string;
  name: string;
  department: string;
  role: "cmo" | "director" | "specialist";
  status: "active" | "paused" | "error" | "maintenance";
}

export const agents: Agent[] = [
  // Leadership
  { id: "1", agentId: "cmo-001", name: "CMO Agent", department: "leadership", role: "cmo", status: "active" },

  // Content Department
  { id: "2", agentId: "content-dir", name: "Content Director", department: "content", role: "director", status: "active" },
  { id: "3", agentId: "content-001", name: "Long-Form Content Manager", department: "content", role: "specialist", status: "active" },
  { id: "4", agentId: "content-002", name: "Blog Content Writer", department: "content", role: "specialist", status: "active" },
  { id: "5", agentId: "content-003", name: "Whitepaper Author", department: "content", role: "specialist", status: "active" },
  { id: "6", agentId: "content-004", name: "Case Study Writer", department: "content", role: "specialist", status: "active" },
  { id: "7", agentId: "content-005", name: "Content Publisher", department: "content", role: "specialist", status: "active" },

  // Social Media Department
  { id: "8", agentId: "social-dir", name: "Social Media Manager", department: "social", role: "director", status: "active" },
  { id: "9", agentId: "social-001", name: "LinkedIn Content Creator", department: "social", role: "specialist", status: "active" },
  { id: "10", agentId: "social-002", name: "Twitter/X Content Creator", department: "social", role: "specialist", status: "active" },
  { id: "11", agentId: "social-003", name: "YouTube Scriptwriter", department: "social", role: "specialist", status: "active" },
  { id: "12", agentId: "social-004", name: "Short-Form Video Creator", department: "social", role: "specialist", status: "active" },
  { id: "13", agentId: "social-005", name: "Podcast Producer", department: "social", role: "specialist", status: "active" },
  { id: "14", agentId: "social-006", name: "Social Engagement Analyst", department: "social", role: "specialist", status: "active" },
  { id: "15", agentId: "social-007", name: "Social Scheduling Coordinator", department: "social", role: "specialist", status: "active" },

  // Demand Gen Department
  { id: "16", agentId: "demandgen-dir", name: "Demand Gen Director", department: "demandgen", role: "director", status: "active" },
  { id: "17", agentId: "demandgen-001", name: "Paid Media Manager", department: "demandgen", role: "specialist", status: "active" },
  { id: "18", agentId: "demandgen-002", name: "Meta Ads Specialist", department: "demandgen", role: "specialist", status: "active" },
  { id: "19", agentId: "demandgen-003", name: "Google Ads Specialist", department: "demandgen", role: "specialist", status: "active" },
  { id: "20", agentId: "demandgen-004", name: "LinkedIn Ads Specialist", department: "demandgen", role: "specialist", status: "active" },
  { id: "21", agentId: "demandgen-005", name: "Ad Performance Analyst", department: "demandgen", role: "specialist", status: "active" },
  { id: "22", agentId: "demandgen-006", name: "Budget Pacing Analyst", department: "demandgen", role: "specialist", status: "active" },

  // SEO Department
  { id: "23", agentId: "seo-dir", name: "SEO Manager", department: "seo", role: "director", status: "active" },
  { id: "24", agentId: "seo-001", name: "SEO Content Strategist", department: "seo", role: "specialist", status: "active" },
  { id: "25", agentId: "seo-002", name: "Backlink Analyst", department: "seo", role: "specialist", status: "active" },
  { id: "26", agentId: "seo-003", name: "Technical SEO Specialist", department: "seo", role: "specialist", status: "active" },
  { id: "27", agentId: "seo-004", name: "Keyword Rank Tracker", department: "seo", role: "specialist", status: "active" },

  // Brand & Creative Department
  { id: "28", agentId: "brand-dir", name: "Brand Director", department: "brand", role: "director", status: "active" },
  { id: "29", agentId: "brand-001", name: "Ad Creative Designer", department: "brand", role: "specialist", status: "active" },
  { id: "30", agentId: "brand-002", name: "Landing Page Builder", department: "brand", role: "specialist", status: "active" },
  { id: "31", agentId: "brand-003", name: "Asset Librarian", department: "brand", role: "specialist", status: "active" },

  // Marketing Ops Department
  { id: "32", agentId: "ops-dir", name: "Marketing Ops Director", department: "ops", role: "director", status: "active" },
  { id: "33", agentId: "ops-001", name: "Email Operations Manager", department: "ops", role: "specialist", status: "active" },
  { id: "34", agentId: "ops-002", name: "Newsletter Writer", department: "ops", role: "specialist", status: "active" },
  { id: "35", agentId: "ops-003", name: "Nurture Campaign Specialist", department: "ops", role: "specialist", status: "active" },
  { id: "36", agentId: "ops-004", name: "List Hygiene Specialist", department: "ops", role: "specialist", status: "active" },
  { id: "37", agentId: "ops-005", name: "Marketing Automation Specialist", department: "ops", role: "specialist", status: "active" },
];

export const getCMO = () => agents.find((a) => a.role === "cmo")!;
export const getDirectors = () => agents.filter((a) => a.role === "director");
export const getSpecialists = () => agents.filter((a) => a.role === "specialist");
export const getAgentsByDepartment = (dept: string) => agents.filter((a) => a.department === dept);
export const getDepartments = () => ["content", "social", "demandgen", "seo", "brand", "ops"];
