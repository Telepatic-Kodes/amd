# Coding Conventions

**Analysis Date:** 2026-02-14

## Naming Patterns

**Files:**
- React Components: `PascalCase.tsx` (e.g., `GenerateContentModal.tsx`, `LineChartComponent.tsx`)
- Utilities & helpers: `camelCase.ts` (e.g., `contentTypes.ts`, `brand-utils.ts`)
- Custom hooks: `useX.ts` or `useX.tsx` (e.g., `useKeyboardShortcuts.ts`, `useBrandContext.tsx`)
- Constants/exports: `camelCase.ts` (e.g., `schemas.ts`, `contentTypes.ts`)
- Directories: `kebab-case` for feature folders (e.g., `/content`, `/brand`, `/content-pipeline`)

**Functions:**
- Exported functions: `camelCase` (e.g., `formatTypeName()`, `validateFile()`, `calculateWordCount()`)
- React components: `PascalCase` (e.g., `export function GenerateContentModal()`)
- Private/internal functions: `camelCase` with underscore prefix optional (e.g., `_convertTextToHtml()`)
- Hook names: `use` prefix in camelCase (e.g., `useKeyboardShortcuts()`, `useDashboardData()`)

**Variables:**
- Local variables: `camelCase` (e.g., `selectedTemplate`, `pendingG`, `generateButton`)
- Constants (non-exported): `camelCase` (e.g., `defaultChannels`, `CHANNELS` if constant array)
- Global constants: `UPPER_SNAKE_CASE` (e.g., `ALLOWED_TRANSITIONS`, `CONTENT_TYPES`)
- State variables (React): `camelCase` (e.g., `const [topic, setTopic]`, `const [mode, setMode]`)

**Types:**
- Interfaces: `PascalCase` (e.g., `interface ChannelResult {}`, `interface ParsedContent {}`, `interface GenerateResponse {}`)
- Type aliases: `PascalCase` (e.g., `type ErrorCode = ...`, `type AdaptedContent = Record<...>`)
- Generic types: `T`, `P`, `K`, `V` (standard convention)
- Props interfaces: `Props` or `{ComponentName}Props` (e.g., `interface Props {}` or `interface GenerateContentModalProps {}`)

## Code Style

**Formatting:**
- Tool: Prettier (integrated via ESLint config)
- Line length: Typically 80-100 characters (Next.js default)
- Imports: Organized by group (React/Next.js → third-party libs → relative imports)
- Quotes: Double quotes for JSX/HTML, single or double quotes for strings (Prettier normalizes to single in most contexts)
- Semicolons: Enforced throughout

**Linting:**
- Tool: ESLint 9 with `eslint-config-next` (TypeScript support)
- Config file: `eslint.config.mjs`
- Extends: `eslint-config-next/core-web-vitals` and `eslint-config-next/typescript`
- Ignored files: `.next/`, `out/`, `build/`, `convex/_generated/`
- Run: `npm run lint`

**Example import organization:**
```typescript
// 1. React & Next.js
import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

// 2. Third-party libraries
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

// 3. Local imports
import { useToast } from "@/components/ui/Toast";
import { validateFile } from "@/lib/file-parsers";

// 4. Type imports (optional, often intermixed)
import type { ParsedContent } from "@/lib/file-parsers";
```

## Path Aliases

**Defined in tsconfig.json:**
- `@/*` → Current directory (project root)
- `@convex/*` → `../../convex/` (sibling Convex backend)

**Usage pattern:**
```typescript
// Correct
import { useToast } from "@/components/ui/Toast";
import { api } from "@convex/_generated/api";

// Avoid
import { useToast } from "../components/ui/Toast";
import { api } from "../../../../convex/_generated/api";
```

## Error Handling

**Patterns:**
- Central error classifier in `lib/errors.ts` provides `ClassifiedError` interface with `code`, `title`, `description`, `action`, `retryable` fields
- Agent-specific errors mapped in `lib/agent-errors.ts` for AI/LLM failures (rate limits, timeouts, token overflow)
- Try-catch with error classification:

```typescript
try {
  const result = await generateContent({ /* ... */ });
} catch (error) {
  const classified = classifyError(error);
  showError({
    title: classified.title,
    description: classified.description,
    retryable: classified.retryable
  });
}
```

- Validation errors: Use Zod schemas in `lib/schemas.ts` for structured validation with Spanish error messages:

```typescript
const contentSchema = z.object({
  title: z.string().min(5, "El título debe tener al menos 5 caracteres"),
  body: z.string().min(50, "El contenido debe tener al menos 50 caracteres"),
  // ...
});

const result = contentSchema.safeParse(data);
if (!result.success) {
  return { error: result.error.issues[0].message };
}
```

- Network/auth errors handled separately in `lib/errors.ts` with detection functions: `isNetworkError()`, `isAuthExpired()`, `isAuthUnauthorized()`

## Logging

**Framework:** `console` (no dedicated logger)

**Patterns:**
- Limited logging in production code; used mainly for debugging
- Error logging in catch blocks:

```typescript
if (error instanceof Error) {
  console.error("Operation failed:", error.message);
}
```

- TypeScript environment validation in `lib/validateEnv.ts` logs missing env vars before throwing
- No structured logging; console.log, console.error, console.warn available

**When to log:**
- Development: Trace data flow in complex operations (e.g., multi-channel content generation)
- Production: Errors and warnings only
- Avoid: Logging sensitive data (API keys, personal info)

## Comments

**When to Comment:**
- Complex algorithm logic (e.g., file parsing, error classification)
- Non-obvious code intent
- Workarounds or hacks (prefer refactoring)
- JSDoc for exported functions in utility files

**JSDoc/TSDoc:**
- Used in `lib/file-parsers.ts` with `/**` blocks for exported functions
- Includes param descriptions, return types, and usage examples:

```typescript
/**
 * Validates a file before parsing
 *
 * @param file - File to validate
 * @param maxSizeMB - Maximum file size in MB (default: 10)
 * @returns Validation result with error message if invalid
 */
export function validateFile(file: File, maxSizeMB: number = 10): ValidationResult {
  // ...
}
```

- TypeScript interfaces have minimal comments (types are self-documenting)
- Inline comments rare; prefer self-documenting variable names

**Example from codebase:**
```typescript
// Skip if user is typing in an input, textarea, or contenteditable
const target = e.target as HTMLElement;
if (
  target.tagName === "INPUT" ||
  target.tagName === "TEXTAREA" ||
  target.tagName === "SELECT" ||
  target.isContentEditable
) {
  return;
}
```

## Function Design

**Size:**
- Target: < 100 lines per function
- Larger functions broken into smaller helpers
- Example: `useKeyboardShortcuts()` in `hooks/useKeyboardShortcuts.ts` is ~90 lines, then calls extracted `navigate()` callback

**Parameters:**
- Prefer object destructuring for >2 params:

```typescript
// Good
function formatContent({
  title,
  body,
  metadata,
}: {
  title: string;
  body: string;
  metadata?: Record<string, unknown>;
}) {
  // ...
}

// Avoid
function formatContent(title, body, metadata) { }
```

- No optional positional params; use defaults in object or separate overloads
- React components use `Props` interface for all props:

```typescript
interface Props {
  isOpen: boolean;
  onClose: () => void;
  defaultChannels?: string[];
}

export function GenerateContentModal({ isOpen, onClose, defaultChannels = [] }: Props) {
  // ...
}
```

**Return Values:**
- Explicit return types on exported functions:

```typescript
export function validateFile(file: File, maxSizeMB: number = 10): ValidationResult {
  // ...
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
}
```

- Void functions: `() => void` for callbacks, `void` for effects
- Avoid implicit `any` returns; use `: Promise<T>` for async

## Module Design

**Exports:**
- Named exports for utilities; default export for React components (occasional):

```typescript
// lib/contentTypes.ts - Named exports
export const typeColors: Record<string, string> = { /* ... */ };
export const typeIcons: Record<string, React.ElementType> = { /* ... */ };
export function formatTypeName(type: string): string { /* ... */ }

// components/content/GenerateContentModal.tsx
export function GenerateContentModal({ /* ... */ }: Props) { /* ... */ }

// Alternative for chart
export { LineChartComponent as LineChart };
```

**Barrel Files:**
- Not extensively used in this codebase
- Each component imports directly: `import { LineChart } from "@/components/charts/LineChart"`
- Central utility exports in `lib/` (e.g., `lib/utils.ts` for `cn()` function)

**Single Responsibility:**
- Each file has one primary export or closely related set of utilities
- `lib/contentTypes.ts` groups content-related constants and formatting
- `lib/errors.ts` owns all error classification logic
- Convex actions separated: `convex/actions.ts` for LLM calls, `convex/functions.ts` for queries/mutations

---

## Language & Localization

**Code Language:** English (function names, variable names, type names)

**Documentation & Comments:** English

**User-Facing Strings:** Spanish (hardcoded in Spanish in most error messages and validation)

Example from `lib/schemas.ts`:
```typescript
title: z
  .string()
  .min(5, "El título debe tener al menos 5 caracteres")
  .max(120, "El título no puede superar 120 caracteres"),
```

---

## TypeScript Configuration

**Strict Mode:** Enabled (`"strict": true` in tsconfig.json)

**Key Settings:**
- Target: `ES2017`
- Module: `esnext`
- JSX: `react-jsx`
- `noEmit: true` (no emitted .js files; Next.js handles compilation)
- `skipLibCheck: true` (skip type checking node_modules)
- `allowJs: true` (allow .js files, but project uses .ts/.tsx)
- `isolatedModules: true` (each file is compiled independently)

**No `any`:** Strict mode enforces type safety; `any` avoided in favor of `unknown` + type guards or `as Type` assertions (minimal)

Example from `lib/agent-errors.ts`:
```typescript
interface AgentErrorInfo {
  title: string;
  description: string;
  retryable: boolean;
  retryDelay?: number;
}

const AGENT_ERROR_PATTERNS: Array<{
  test: (msg: string) => boolean;
  info: AgentErrorInfo;
}> = [ /* ... */ ];
```

---

*Convention analysis: 2026-02-14*
