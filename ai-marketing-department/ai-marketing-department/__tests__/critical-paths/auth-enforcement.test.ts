// @vitest-environment node
import { validateEnvironment } from "@/lib/validateEnv";

describe("Auth Enforcement — Critical Path", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    // Default: non-production environment
    process.env.NODE_ENV = "development";
    delete process.env.VERCEL_ENV;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("throws if NEXT_PUBLIC_CONVEX_URL is not set", () => {
    delete process.env.NEXT_PUBLIC_CONVEX_URL;
    expect(() => validateEnvironment()).toThrow(
      "NEXT_PUBLIC_CONVEX_URL is not set"
    );
  });

  it("passes in dev when CONVEX_URL is set", () => {
    process.env.NEXT_PUBLIC_CONVEX_URL = "https://my-app.convex.cloud";
    expect(() => validateEnvironment()).not.toThrow();
  });

  it("throws in production with Clerk test keys", () => {
    process.env.NODE_ENV = "production";
    process.env.VERCEL_ENV = "production";
    process.env.NEXT_PUBLIC_CONVEX_URL = "https://my-app.convex.cloud";
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = "pk_test_abc123";

    expect(() => validateEnvironment()).toThrow(
      "Clerk test keys"
    );
  });

  it("throws in production with localhost Convex URL", () => {
    process.env.NODE_ENV = "production";
    process.env.VERCEL_ENV = "production";
    process.env.NEXT_PUBLIC_CONVEX_URL = "http://localhost:3210";

    expect(() => validateEnvironment()).toThrow(
      "localhost"
    );
  });

  it("passes in production with valid config", () => {
    process.env.NODE_ENV = "production";
    process.env.VERCEL_ENV = "production";
    process.env.NEXT_PUBLIC_CONVEX_URL = "https://my-app.convex.cloud";
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = "pk_live_abc123";

    expect(() => validateEnvironment()).not.toThrow();
  });
});
