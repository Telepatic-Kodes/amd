# Coding Conventions

**Analysis Date:** 2026-01-27

## Naming Patterns

**Files:**
- TypeScript/JavaScript: camelCase for functions and utilities (`cn()`, `generateSparklineData()`)
- Components: PascalCase for React components (`Card`, `AgentNode`, `OrgChart`)
- Hooks: camelCase with 'use' prefix (standard React convention)
- Utilities: camelCase (`utils.ts`, `theme.ts`, `index.ts` for barrel exports)
- Config files: lowercase with dots (`tailwind.config.js`, `next.config.js`)

**Functions:**
- Handlers: descriptive camelCase (`createTask`, `updateAgentStatus`, `logExecution`)
- Query/Mutation prefixes in Convex: `get*`, `list*`, `create*`, `update*`, `delete*`
- Action handlers in Convex: `execute*`, `call*` (e.g., `executeAgent`, `callClaude`)
- Generator functions: prefix with 'generate' (`generateSparklineData`, `generateWeeklyData`, `generateMockActivities`)
- Component render helpers: prefix with 'render' or direct JSX in body

**Variables:**
- camelCase for all variables and properties (`agentId`, `taskId`, `departmentColors`, `statusColor`)
- Constants in component files: UPPER_CASE for literal values (e.g., magic numbers), lowercase for objects
- Type-specific suffixes: use `Id` for IDs (`agentId`, `taskId`, `deploymentId`)
- Status variables: descriptive names ending with status (`previousStatus`, `agentStatus`)

**Types & Interfaces:**
- PascalCase for all types and interfaces (`Agent`, `AgentNodeProps`, `CardProps`)
- Suffix with 'Props' for React component prop interfaces
- Suffix with 'State' for state shape interfaces
- Use `Record<string, Type>` for lookup objects (`Record<string, { bg: string; border: string }>`)
- Union types use `v.union()` in Convex for runtime validation

## Code Style

**Formatting:**
- ESLint with config: `"eslint": "^8.55.0"` for backend, `"eslint": "^9"` for frontend
- No explicit prettier config found; use default formatting
- Target: ES2020 (TypeScript `"target": "ES2020"`)
- Module system: ESNext (`"module": "ESNext"`)
- Indentation: 2 spaces (inferred from code style)

**Linting:**
- ESLint enabled in both projects: `npm run lint`
- Run command in root: `eslint .`
- Run command in frontend: `eslint` (no directory specified, scans project)
- Type checking: `npm run typecheck` → `tsc --noEmit`

**Imports:**
1. External packages (React, Convex, libraries)
2. Type imports (`type { Metadata }`)
3. Internal utilities (`@/lib/utils`, `@/components/*`)
4. Relative imports only when necessary
5. Never use star imports; be explicit about what you import

Example from `/home/tomas/Escritorio/amd/ai-marketing-department/ai-marketing-department/app/page.tsx`:
```typescript
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Users, CheckCircle2, Clock, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
```

## Path Aliases

**Configured:**
- `@/*` → Root directory (`./*`)
- `@/lib/*` → Utilities and helpers
- `@/components/*` → React components
- `@convex/*` → Convex backend (generated in frontend)

**Usage:**
```typescript
// Convex backend in frontend
import { api } from "@convex/_generated/api";

// Utilities
import { cn } from "@/lib/utils";

// Components
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
```

## Error Handling

**Patterns:**
- Throw `Error` objects with descriptive messages
- Check for null/undefined with early returns or conditional throws
- In Convex handlers: throw with clear context (e.g., "Agent not found", "Max retries exceeded")
- In React: use try-catch for async operations, display errors in UI via toast/error states

Example from `/home/tomas/Escritorio/amd/convex/functions.ts`:
```typescript
const agent = await ctx.db.get(args.id);
if (!agent) throw new Error("Agent not found");

if (agent.status !== "active") {
  throw new Error(`Agent is not active: ${agent.status}`);
}
```

**Validation:**
- Use Convex `v.*` validators at API boundaries (all mutation/query arguments)
- Runtime validation with unions for enums: `v.union(v.literal("active"), v.literal("paused"))`
- No client-side validation framework; rely on type safety and Convex validators

## Logging

**Framework:** `console` (no dedicated logging framework)

**Patterns:**
- Use `console.log()`, `console.error()` for logging
- Execution logs via Convex mutations: `logExecution()` captures structured metrics
- Audit logs in database: `auditLog` table tracks all state changes
- Error tracking: stored in execution/task `error` field with message, code, stack

Example from `/home/tomas/Escritorio/amd/convex/functions.ts`:
```typescript
// Audit logging pattern
await ctx.db.insert("auditLog", {
  action: "agent.created",
  entityType: "agent",
  entityId: args.agentId,
  performedBy: "system",
  metadata: { name: args.name, department: args.department },
  timestamp: now,
});
```

## Comments

**When to Comment:**
- Explain WHY, not WHAT (code should be self-documenting)
- Document complex algorithms or non-obvious business logic
- Mark TODO/FIXME items (none currently found in main code)
- Section headers for logical groupings (e.g., `// ===========================================`)

**JSDoc/TSDoc:**
- Minimal usage; mostly omitted for simple functions
- Used for public APIs and complex signatures
- Example from actions: `/** Action para llamar a Claude API */`

**Language:**
- Spanish for comments and documentation in main codebase
- English for code identifiers and UI strings

## Function Design

**Size:**
- Keep functions under 50 lines when possible
- Handler functions in Convex typically 20-40 lines
- Component render logic: split into smaller functions or subcomponents for readability

**Parameters:**
- Use object destructuring for multiple parameters
- Convex functions use single `args` object from schema validation
- React components use destructured props with interfaces

Example:
```typescript
export const createTask = mutation({
  args: {
    title: v.string(),
    type: v.string(),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    agentId: v.id("agents"),
    input: v.any(),
  },
  handler: async (ctx, args) => {
    // Handler logic
  },
});
```

**Return Values:**
- Convex queries: return data objects or null
- Convex mutations: return ID of created/modified document or void
- React components: return JSX or ReactNode
- Utility functions: return typed values matching their purpose

## Module Design

**Exports:**
- Named exports preferred over default exports
- Barrel exports in `index.ts` for component libraries

Example from `/home/tomas/Escritorio/amd/ai-marketing-department/ai-marketing-department/components/charts/index.ts`:
```typescript
export { Sparkline, SparklineArea } from './Sparkline';
export { LineChart } from './LineChart';
export { AreaChart } from './AreaChart';
export { chartColors, seriesColors, gradients } from './theme';
```

**File Organization:**
- One main export per file (component, hook, utility)
- Related types and helpers co-located with implementation
- Enum-like objects (color maps, status mappings) defined near top of file

Example from `/home/tomas/Escritorio/amd/ai-marketing-department/ai-marketing-department/components/org/AgentNode.tsx`:
```typescript
const departmentColors: Record<string, { bg: string; border: string }> = {
  leadership: { bg: "bg-purple-500/10", border: "border-purple-500/30" },
  // ...
};

const statusColors: Record<string, string> = {
  active: "bg-green-500",
  paused: "bg-yellow-500",
};

export function AgentNode({ agent, isSelected, onClick }: AgentNodeProps) {
  // Component logic
}
```

## Specific Conventions by Domain

**Convex Backend (`/home/tomas/Escritorio/amd/convex/`):**
- All database operations wrapped in typed query/mutation/action functions
- Schema uses `defineTable()` and `defineSchema()` with Convex validators
- Index declarations for query performance: `.index("by_field", ["field"])`
- Timestamps stored as milliseconds since epoch (`Date.now()`)
- Document IDs use Convex `v.id("tableName")` type

**React Components (`/home/tomas/Escritorio/amd/ai-marketing-department/`):**
- "use client" directive on client components (Next.js 13+)
- Props interfaces defined before component
- Destructure props with typing in function signature
- Use `cn()` utility (wraps clsx + tailwind-merge) for dynamic classes
- Motion animations via `framer-motion` library
- Icons from `lucide-react` library
- Charts via `recharts` library with shared theme config

**Styling:**
- Tailwind CSS v4 (`"tailwindcss": "^4"`)
- Class composition via `cn()` utility
- Theme colors in centralized `theme.ts` files
- Department/status colors as TypeScript objects for reusability
- Dark mode primary (all components use dark bg/colors)

---

*Convention analysis: 2026-01-27*
