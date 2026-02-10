import "@testing-library/jest-dom/vitest";
import React from "react";

// Mock Convex client for tests
vi.mock("convex/react", () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(() => vi.fn()),
  useAction: vi.fn(() => vi.fn()),
  usePaginatedQuery: vi.fn(() => ({
    results: [],
    status: "Exhausted",
    loadMore: vi.fn(),
  })),
  useConvex: vi.fn(),
  useConvexAuth: vi.fn(() => ({
    isLoading: false,
    isAuthenticated: true,
  })),
  ConvexProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock Clerk for tests
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
  useOrganization: vi.fn(() => ({
    organization: null,
    isLoaded: true,
  })),
  SignedIn: ({ children }: { children: React.ReactNode }) => children,
  SignedOut: () => null,
  ClerkProvider: ({ children }: { children: React.ReactNode }) => children,
  auth: vi.fn(() => ({ userId: "test-user-id" })),
  currentUser: vi.fn(),
}));

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  })),
  usePathname: vi.fn(() => "/"),
  useSearchParams: vi.fn(() => new URLSearchParams()),
  redirect: vi.fn(),
}));

// Mock next/image
vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>) =>
    React.createElement("img", props),
}));

// Mock framer-motion to avoid animation issues in tests
vi.mock("framer-motion", async () => {
  const actual = await vi.importActual("framer-motion");
  return {
    ...actual,
    useInView: vi.fn(() => true),
  };
});
