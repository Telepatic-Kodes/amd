# Testing Patterns

**Analysis Date:** 2026-02-14

## Test Framework

**Runner:**
- Vitest 4.0.18 (configured in `vitest.config.ts`)
- Environment: jsdom (browser-like testing)
- Globals enabled (`globals: true`)

**Config File:** `vitest.config.ts`
```typescript
export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    globals: true,
    css: false,
    include: ["**/__tests__/**/*.test.{ts,tsx}", "**/*.test.{ts,tsx}"],
    exclude: ["node_modules", ".next", "remotion"],
    coverage: {
      provider: "v8",
      include: ["app/**", "components/**", "lib/**"],
      exclude: ["node_modules", ".next", "remotion", "**/*.d.ts"],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
      "@convex": path.resolve(__dirname, "../../convex"),
    },
  },
});
```

**Assertion Library:**
- Testing Library React (assertions via `expect()` from Vitest)
- `@testing-library/jest-dom` for DOM matchers (imported in `vitest.setup.ts`)
- `@testing-library/user-event` for user interactions

**Run Commands:**
```bash
npm run test           # Watch mode (default)
npm run test:run       # Run once (CI mode)
npm run test:coverage  # Generate coverage report
```

## Test File Organization

**Location:**
- Co-located: `component.test.tsx` next to `component.tsx` (preferred for components)
- Centralized: `__tests__/critical-paths/` for integration/critical path tests

**Naming:**
- `*.test.ts` for unit tests (utils, hooks, pure functions)
- `*.test.tsx` for React component tests
- Test name format: `[feature]-[scenario].test.tsx`
  - Example: `content-creation.test.tsx`, `auth-enforcement.test.ts`

**Structure:**
```
ai-marketing-department/
├── components/
│   ├── content/
│   │   ├── GenerateContentModal.tsx
│   │   └── GenerateContentModal.test.tsx
│   └── charts/
│       ├── LineChart.tsx
│       └── LineChart.test.tsx
├── lib/
│   ├── contentTypes.ts
│   └── contentTypes.test.ts
└── __tests__/
    └── critical-paths/
        ├── content-creation.test.tsx
        ├── auth-enforcement.test.ts
        └── oauth-flows.test.ts
```

## Test Structure

**Suite Organization:**
```typescript
describe("Content Creation — Critical Path", () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders modal when isOpen is true", () => {
    render(<GenerateContentModal {...defaultProps} />);
    expect(screen.getByText("Generar Contenido")).toBeInTheDocument();
  });

  it("does NOT render when isOpen is false", () => {
    render(<GenerateContentModal isOpen={false} onClose={vi.fn()} />);
    expect(screen.queryByText("Generar Contenido")).not.toBeInTheDocument();
  });
});
```

**Patterns:**

1. **Setup:** `beforeEach()` clears mocks before each test
   ```typescript
   beforeEach(() => {
     vi.clearAllMocks();
   });
   ```

2. **Assertions:** Direct `expect()` calls from Vitest
   ```typescript
   expect(screen.getByText("Generar Contenido")).toBeInTheDocument();
   expect(generateButton).toBeDisabled();
   expect(screen.getByRole("button")).toBeEnabled();
   ```

3. **Query styles:** Prefer semantic queries
   ```typescript
   screen.getByText()        // Text content
   screen.getByRole()        // Accessible name
   screen.getByPlaceholderText()  // Form inputs
   screen.queryByText()      // Assert NOT present
   ```

4. **User interactions:** `userEvent.setup()` for realistic simulation
   ```typescript
   const user = userEvent.setup();
   await user.click(linkedinBtn);
   await user.type(topicInput, "Test topic");
   ```

## Mocking

**Framework:** Vitest `vi` namespace

**Setup file:** `vitest.setup.ts` pre-mocks all external integrations

**Patterns:**

1. **Module mocking (global setup in `vitest.setup.ts`):**
   ```typescript
   vi.mock("convex/react", () => ({
     useQuery: vi.fn(),
     useMutation: vi.fn(() => vi.fn()),
     useAction: vi.fn(() => vi.fn()),
     useConvex: vi.fn(),
     useConvexAuth: vi.fn(() => ({
       isLoading: false,
       isAuthenticated: true,
     })),
     ConvexProvider: ({ children }: { children: React.ReactNode }) => children,
   }));
   ```

2. **Clerk authentication mocking:**
   ```typescript
   vi.mock("@clerk/nextjs", () => ({
     useUser: vi.fn(() => ({
       isSignedIn: true,
       user: { id: "test-user-id", firstName: "Test", lastName: "User" },
       isLoaded: true,
     })),
     useAuth: vi.fn(() => ({
       isSignedIn: true,
       userId: "test-user-id",
       isLoaded: true,
     })),
     SignedIn: ({ children }: { children: React.ReactNode }) => children,
     ClerkProvider: ({ children }: { children: React.ReactNode }) => children,
   }));
   ```

3. **Next.js navigation mocking:**
   ```typescript
   vi.mock("next/navigation", () => ({
     useRouter: vi.fn(() => ({
       push: vi.fn(),
       replace: vi.fn(),
       refresh: vi.fn(),
       prefetch: vi.fn(),
     })),
     usePathname: vi.fn(() => "/"),
     useSearchParams: vi.fn(() => new URLSearchParams()),
   }));
   ```

4. **Library mocking (Framer Motion to skip animations):**
   ```typescript
   vi.mock("framer-motion", async () => {
     const actual = await vi.importActual("framer-motion");
     return {
       ...actual,
       useInView: vi.fn(() => true),
     };
   });
   ```

5. **Test-time mocking (override in specific test):**
   ```typescript
   vi.mock("@/components/ui/Toast", () => ({
     useToast: vi.fn(() => ({
       success: vi.fn(),
       error: vi.fn(),
     })),
   }));
   ```

**What to Mock:**
- External services (Convex, Clerk, APIs)
- Next.js hooks (useRouter, usePathname, useSearchParams)
- Heavy third-party libraries (Framer Motion for deterministic tests)
- Toast/notification systems to avoid noise

**What NOT to Mock:**
- React hooks (useState, useCallback) — test real behavior
- Utility functions from `lib/` — test actual logic
- DOM interactions — use Testing Library's user event
- Zod schemas — validate actual behavior

## Fixtures and Factories

**Test Data:**
```typescript
// From content-creation.test.tsx
const defaultProps = {
  isOpen: true,
  onClose: vi.fn(),
};

// From auth-enforcement.test.ts
const originalEnv = process.env;
beforeEach(() => {
  process.env = { ...originalEnv };
  process.env.NODE_ENV = "development";
  delete process.env.VERCEL_ENV;
});
afterAll(() => {
  process.env = originalEnv;
});
```

**Location:**
- Inline in test file for small fixtures
- Separate `fixtures/` folder not used in this codebase
- Mock data defined at top of `describe` block

**Pattern:**
```typescript
describe("Feature X", () => {
  const mockData = {
    user: { id: "123", name: "Test User" },
    content: { title: "Test", body: "..." },
  };

  beforeEach(() => {
    // Reset state per test
    vi.clearAllMocks();
  });

  it("test scenario", () => {
    // Use mockData
  });
});
```

## Coverage

**Requirements:** Not explicitly enforced (no threshold in config)

**View Coverage:**
```bash
npm run test:coverage
```

Coverage targets measured but not gating:
- `app/**`, `components/**`, `lib/**` included in coverage
- `.next/`, `remotion/`, `**/*.d.ts` excluded

**Critical path tests in `__tests__/critical-paths/`:**
- `content-creation.test.tsx` — Content generation modal
- `auth-enforcement.test.ts` — Environment validation
- `oauth-flows.test.ts` — OAuth integrations (if present)

## Test Types

**Unit Tests:**
- Scope: Individual functions, utilities, hooks
- Approach: Test input → output, edge cases
- Example: Testing `validateFile()` from `lib/file-parsers.ts`
  ```typescript
  it("rejects files larger than maxSizeMB", () => {
    const largeFile = new File(["x".repeat(11 * 1024 * 1024)], "large.pdf", {
      type: "application/pdf",
    });
    const result = validateFile(largeFile, 10);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("demasiado grande");
  });
  ```

**Integration Tests:**
- Scope: Component + hooks + state
- Approach: Render component, user interactions, verify UI updates
- Example: From `content-creation.test.tsx`
  ```typescript
  it("allows toggling channel selection", async () => {
    const user = userEvent.setup();
    render(<GenerateContentModal {...defaultProps} />);

    const linkedinBtn = screen.getByRole("button", { name: /LinkedIn/ });
    await user.click(linkedinBtn);

    const topicInput = screen.getByPlaceholderText(/tendencias de IA/);
    await user.type(topicInput, "Test topic");

    const generateButton = screen.getByRole("button", { name: /1 canal/ });
    expect(generateButton).toBeEnabled();
  });
  ```

**E2E Tests:**
- Framework: Not used currently (no Cypress, Playwright test config in this project)
- Approach: Browser automation, full user flows (outside scope of this codebase)
- Note: `playwright-core` is a dependency but likely for server-side PDF handling, not E2E tests

## Common Patterns

**Async Testing:**
```typescript
it("handles async operations", async () => {
  const user = userEvent.setup();
  render(<MyComponent />);

  const button = screen.getByRole("button", { name: /Submit/ });
  await user.click(button);

  // Wait for async operation
  await waitFor(() => {
    expect(screen.getByText("Success")).toBeInTheDocument();
  });
});
```

**Error Testing:**
```typescript
it("throws if NEXT_PUBLIC_CONVEX_URL is not set", () => {
  delete process.env.NEXT_PUBLIC_CONVEX_URL;
  expect(() => validateEnvironment()).toThrow(
    "NEXT_PUBLIC_CONVEX_URL is not set"
  );
});
```

**Environment/State Testing (from `auth-enforcement.test.ts`):**
```typescript
it("throws in production with Clerk test keys", () => {
  process.env.NODE_ENV = "production";
  process.env.VERCEL_ENV = "production";
  process.env.NEXT_PUBLIC_CONVEX_URL = "https://my-app.convex.cloud";
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = "pk_test_abc123";

  expect(() => validateEnvironment()).toThrow("Clerk test keys");
});
```

**Render + Assert Pattern (from `content-creation.test.tsx`):**
```typescript
it("renders all 7 channel options", () => {
  render(<GenerateContentModal {...defaultProps} />);

  expect(screen.getByRole("button", { name: /LinkedIn/ })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /Twitter/ })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /Instagram/ })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /TikTok/ })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /Blog/ })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /Newsletter/ })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /YouTube/ })).toBeInTheDocument();
});
```

## Environment & Node Version

**Environment for tests:** Node.js (via Vitest)

**Key environment variable handling:**
- Tests can override `process.env` for validation testing
- Store original, restore in `afterAll()`
- Mock external env-dependent modules in `vitest.setup.ts`

**Node version requirement:**
- Specified in `.nvmrc` or inferred from Next.js requirements
- Minimum: Node 18+ (Next.js 16 requirement)

---

## Best Practices

1. **Test behavior, not implementation** — Test that modal renders when `isOpen=true`, not internal state
2. **Use semantic queries** — `getByRole()`, `getByText()` > `getByTestId()` unless no other option
3. **Clear mocks between tests** — `beforeEach(() => vi.clearAllMocks())`
4. **Arrange-Act-Assert structure** — Setup → Execute → Verify
5. **Avoid testing library internals** — Test public API, not internal functions
6. **Mock external dependencies globally** — `vitest.setup.ts` centralizes all mocks
7. **Use `userEvent` not `fireEvent`** — More realistic user interaction simulation
8. **Test accessibility** — Use `getByRole()` with accessible names to ensure UI is accessible
9. **Keep tests focused** — One logical assertion per test (or grouped related ones)
10. **Name tests clearly** — `it("renders modal when isOpen is true")` is clearer than `it("renders")`

---

*Testing analysis: 2026-02-14*
