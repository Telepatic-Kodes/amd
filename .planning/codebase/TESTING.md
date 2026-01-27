# Testing Patterns

**Analysis Date:** 2026-01-27

## Test Framework

**Runner:**
- Not detected - no test runner configuration found (no jest.config.js, vitest.config.js, etc.)
- No testing dependencies in package.json
- Current packages: `@types/node`, `dotenv`, `eslint`, `ts-node`, `typescript` (development only)

**Assertion Library:**
- Not configured - project has zero test infrastructure currently

**Run Commands:**
- No test command defined in `npm run` scripts
- Current scripts focus on linting and type checking only:
  - `npm run lint` → ESLint verification
  - `npm run typecheck` → `tsc --noEmit` (TypeScript strict mode)

## Current Testing Status

**Summary:**
- **Zero automated tests** in the codebase
- **Manual testing via dashboard UI** (Next.js frontend at localhost:3000)
- **Script-based testing** via `scripts/run-agent.js` for agent execution
- **Convex SDK** provides built-in validation via `v.*` validators at API boundaries

## Recommended Testing Structure

While not yet implemented, the following patterns should be adopted:

### Test File Organization

**Location:** Co-located with source code

Proposed structure:
```
convex/
├── functions.ts
├── functions.test.ts          # Convex query/mutation tests
├── actions.ts
├── actions.test.ts            # Action (external API) tests
├── schema.ts
└── seed.ts

ai-marketing-department/ai-marketing-department/
├── components/
│   ├── ui/
│   │   ├── Card.tsx
│   │   └── Card.test.tsx      # Component tests
│   └── org/
│       ├── AgentNode.tsx
│       └── AgentNode.test.tsx
├── app/
│   ├── page.tsx
│   └── page.test.tsx          # Page/integration tests
└── lib/
    ├── utils.ts
    └── utils.test.ts          # Utility function tests
```

**Naming:**
- Test files: `*.test.ts` or `*.test.tsx` for React components
- Test suites: Describe what is being tested (e.g., "Card component", "createTask mutation")
- Test names: Use `it()` or `test()` - should read like documentation

### Test Framework Choice (Not Yet Implemented)

**Recommended for this project:**
1. **Convex Backend:** Convex test utilities (when available) or custom query/mutation wrappers
2. **React Components:** Vitest + React Testing Library
3. **Utilities:** Vitest
4. **E2E:** Playwright or Cypress for dashboard testing

**Rationale:**
- Fast (Vitest is faster than Jest for development)
- TypeScript-first
- Works with Next.js 16
- Minimal config overhead

## Test Structure

### Convex Patterns (Not Yet Implemented)

Expected structure for database operations:

```typescript
// Example: Testing createTask mutation
describe("createTask mutation", () => {
  it("should create a task with pending status", async () => {
    const ctx = createTestContext();

    const { id, taskId } = await ctx.runMutation(
      api.functions.createTask,
      {
        title: "Test Task",
        type: "write_blog",
        priority: "high",
        agentId: testAgentId,
        input: { topic: "AI" },
      }
    );

    expect(id).toBeDefined();
    expect(taskId).toMatch(/^task_/);

    // Verify in database
    const task = await ctx.db.get(id);
    expect(task.status).toBe("pending");
    expect(task.title).toBe("Test Task");
  });

  it("should create scheduled task with queued status", async () => {
    const ctx = createTestContext();
    const futureTime = Date.now() + 3600000;

    const { id } = await ctx.runMutation(
      api.functions.createTask,
      {
        title: "Scheduled Task",
        type: "analyze_keywords",
        priority: "medium",
        agentId: testAgentId,
        input: {},
        scheduledFor: futureTime,
      }
    );

    const task = await ctx.db.get(id);
    expect(task.status).toBe("queued");
    expect(task.scheduledFor).toBe(futureTime);
  });

  it("should throw if agent not found", async () => {
    const ctx = createTestContext();

    await expect(
      ctx.runMutation(api.functions.createTask, {
        title: "Test",
        type: "test",
        priority: "low",
        agentId: invalidAgentId,
        input: {},
      })
    ).rejects.toThrow();
  });
});
```

### React Component Patterns (Not Yet Implemented)

Expected structure for components:

```typescript
// Example: Testing Card component
import { render, screen } from '@testing-library/react';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';

describe("Card component", () => {
  it("should render children", () => {
    render(
      <Card>
        <CardHeader>Header</CardHeader>
        <CardContent>Content</CardContent>
      </Card>
    );

    expect(screen.getByText("Header")).toBeInTheDocument();
    expect(screen.getByText("Content")).toBeInTheDocument();
  });

  it("should apply hover styles when hover prop is true", () => {
    const { container } = render(
      <Card hover>
        <CardContent>Hoverable Card</CardContent>
      </Card>
    );

    const cardElement = container.querySelector('.rounded-xl');
    expect(cardElement).toHaveClass('hover:border-zinc-700');
  });

  it("should accept custom className", () => {
    const { container } = render(
      <Card className="custom-class">
        Content
      </Card>
    );

    const cardElement = container.querySelector('.rounded-xl');
    expect(cardElement).toHaveClass('custom-class');
  });
});
```

### Utility Function Patterns (Not Yet Implemented)

Expected structure for utility tests:

```typescript
// Example: Testing cn() utility
import { cn } from '@/lib/utils';

describe("cn() utility", () => {
  it("should merge class strings", () => {
    const result = cn("px-4 py-2", "px-8");
    expect(result).toBe("py-2 px-8"); // Tailwind merge handles conflict
  });

  it("should handle conditional classes", () => {
    const isActive = true;
    const result = cn("base-class", isActive && "active-class");
    expect(result).toContain("base-class");
    expect(result).toContain("active-class");
  });

  it("should handle undefined and null", () => {
    const result = cn("base", undefined, null, "other");
    expect(result).toBe("base other");
  });
});
```

## Mocking

**Framework:** Not yet configured

**Expected Patterns:**

### Mocking Convex API
```typescript
// Mock convex/react hooks
vi.mock('convex/react', () => ({
  useQuery: vi.fn(() => ({
    isLoading: false,
    data: mockData,
  })),
  useMutation: vi.fn(() => ({
    mutate: vi.fn().mockResolvedValue({}),
    isPending: false,
  })),
}));
```

### Mocking framer-motion
```typescript
// framer-motion can be mocked for simpler testing
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));
```

### What to Mock
- **External APIs:** Convex queries/mutations, Claude API calls
- **framer-motion animations** (for unit tests; keep in e2e tests)
- **lucide-react icons** if testing component structure without visual verification
- **Next.js hooks:** `useRouter`, `usePathname` (if testing client components)

### What NOT to Mock
- **Utility functions:** Test with real implementations (cn, date formatting)
- **React internals:** Let React Testing Library handle useState, useEffect
- **CSS classes:** Test class application without mocking Tailwind
- **Component logic:** Test actual component behavior, not implementation details

## Fixtures and Factories

**Not yet implemented but recommended:**

Create fixture files for test data:

```typescript
// convex/fixtures.ts
export const createTestAgent = (overrides?: Partial<Agent>): Agent => ({
  _id: "test_agent_id" as Id<"agents">,
  agentId: "content-001",
  name: "Test Agent",
  description: "A test agent",
  department: "content",
  role: "specialist",
  status: "active",
  config: {
    systemPrompt: "You are a test agent",
    model: "claude-sonnet-4-20250514",
    temperature: 0.7,
    maxTokens: 2048,
  },
  triggers: ["manual"],
  createdAt: Date.now(),
  updatedAt: Date.now(),
  ...overrides,
});

export const createTestTask = (overrides?: Partial<Task>): Task => ({
  _id: "test_task_id" as Id<"tasks">,
  taskId: "task_123",
  title: "Test Task",
  type: "test",
  priority: "medium",
  status: "pending",
  agentId: "test_agent_id" as Id<"agents">,
  input: {},
  retryCount: 0,
  maxRetries: 3,
  createdAt: Date.now(),
  updatedAt: Date.now(),
  ...overrides,
});
```

**Location:**
- Backend fixtures: `convex/fixtures.ts` or `convex/test-utils.ts`
- Component fixtures: `components/__fixtures__/` or co-located `*.fixtures.ts`

## Coverage

**Requirements:** Not enforced currently

**Recommended targets (once testing is implemented):**
- Statements: > 70%
- Branches: > 60%
- Functions: > 70%
- Lines: > 70%

**View Coverage Command (Once Configured):**
```bash
vitest --coverage
```

## Test Types

### Unit Tests (To Be Implemented)

**Scope:** Single function or component in isolation

**Approach:**
- Test pure functions (utilities, helpers)
- Test component rendering with different props
- Test state transitions and event handlers
- Mock external dependencies (API calls, database)

**Files:**
- Utility tests: `lib/*.test.ts`
- Component tests: `components/**/*.test.tsx`
- Function tests: `convex/*.test.ts`

### Integration Tests (To Be Implemented)

**Scope:** Multiple components or functions working together

**Approach:**
- Test complete workflows (e.g., create agent → assign task → execute)
- Test Convex mutations triggering related database updates
- Test handoff logic between agents
- Real Convex DB with test fixtures

**Files:**
- `convex/*.integration.test.ts`
- `app/**/*.integration.test.tsx`

### E2E Tests (Not Implemented)

**Scope:** Full user workflows through the dashboard UI

**Approach (recommended):**
- Use Playwright or Cypress
- Test critical user paths (create campaign, view analytics, execute agent)
- Test dashboard at localhost:3000
- Verify Convex integration end-to-end

**Commands (once configured):**
```bash
playwright test          # Run all E2E tests
playwright test --ui     # Interactive mode
```

## Common Patterns

### Async Testing (Not Yet Implemented)

Expected pattern for testing async functions:

```typescript
describe("async operations", () => {
  // Pattern 1: await in test
  it("should handle promise resolution", async () => {
    const result = await executeAgent({
      agentId: "content-001",
      taskType: "write_blog",
      input: { topic: "AI" },
    });

    expect(result.success).toBe(true);
    expect(result.taskId).toBeDefined();
  });

  // Pattern 2: with timeout for slow operations
  it("should complete within timeout", async () => {
    const result = await callClaude(
      "Generate content",
      { maxTokens: 1000 }
    );

    expect(result.content).toBeDefined();
  }, 30000); // 30 second timeout
});
```

### Error Testing (Not Yet Implemented)

Expected pattern for testing error scenarios:

```typescript
describe("error handling", () => {
  it("should throw when agent not found", async () => {
    await expect(
      executeAgent({
        agentId: "nonexistent-agent",
        taskType: "test",
        input: {},
      })
    ).rejects.toThrow("Agent not found");
  });

  it("should include error context", async () => {
    try {
      await createTask({
        agentId: invalidId,
        // missing required fields
      });
      fail("Should have thrown");
    } catch (error) {
      expect(error.message).toContain("required");
    }
  });

  it("should recover from transient errors", async () => {
    // Test retry logic with max retries
    const mockFn = vi.fn()
      .mockRejectedValueOnce(new Error("Transient"))
      .mockResolvedValueOnce({ success: true });

    const result = await retryTask(mockFn, { maxRetries: 3 });
    expect(result.success).toBe(true);
    expect(mockFn).toHaveBeenCalledTimes(2);
  });
});
```

## Current Manual Testing Approach

**Script-based Agent Execution:**

File: `/home/tomas/Escritorio/amd/scripts/run-agent.js`

Manual test command:
```bash
node scripts/run-agent.js --agent content-001 --task write_blog --input '{"topic":"IA"}'
```

**Dashboard Testing:**
- Run frontend: `npm run dev` (localhost:3000)
- Test workflows through UI (create agents, tasks, view content)
- Verify Convex integration via dashboard

---

*Testing analysis: 2026-01-27*
