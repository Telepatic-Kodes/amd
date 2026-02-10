// @vitest-environment node
import { getFrontendUrl, getOAuthCallbackUrl } from "@convex/oauthHelpers";

describe("OAuth Helpers — Critical Path", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe("getFrontendUrl", () => {
    it("returns localhost fallback when FRONTEND_URL is not set", () => {
      delete process.env.FRONTEND_URL;
      expect(getFrontendUrl()).toBe("http://localhost:3000");
    });

    it("returns the env value when FRONTEND_URL is set", () => {
      process.env.FRONTEND_URL = "https://app.mysite.com";
      expect(getFrontendUrl()).toBe("https://app.mysite.com");
    });

    it("strips trailing slash from FRONTEND_URL", () => {
      process.env.FRONTEND_URL = "https://app.mysite.com/";
      expect(getFrontendUrl()).toBe("https://app.mysite.com");
    });
  });

  describe("getOAuthCallbackUrl", () => {
    it("builds callback URL from request origin + path", () => {
      const result = getOAuthCallbackUrl(
        "https://myapp.convex.site/auth/callback",
        "/api/auth/clerk"
      );
      expect(result).toBe("https://myapp.convex.site/api/auth/clerk");
    });

    it("works with localhost request URLs", () => {
      const result = getOAuthCallbackUrl(
        "http://localhost:3210/something",
        "/auth/done"
      );
      expect(result).toBe("http://localhost:3210/auth/done");
    });
  });
});
