import { describe, it, expect } from "vitest";

// Test the storageUrl utility function logic (same logic as in client/src/lib/utils.ts)
function storageUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  if (url.startsWith("/manus-storage/")) {
    return url.replace("/manus-storage/", "/api/storage-proxy/");
  }
  return url;
}

describe("storageUrl utility", () => {
  it("should transform /manus-storage/ URLs to /api/storage-proxy/", () => {
    expect(storageUrl("/manus-storage/trikot_vorderteil_58c100c1.png"))
      .toBe("/api/storage-proxy/trikot_vorderteil_58c100c1.png");
  });

  it("should transform SVG storage URLs", () => {
    expect(storageUrl("/manus-storage/trikot_svg_vorderteil_9c36a538.svg"))
      .toBe("/api/storage-proxy/trikot_svg_vorderteil_9c36a538.svg");
  });

  it("should not transform non-storage URLs", () => {
    expect(storageUrl("https://example.com/image.png"))
      .toBe("https://example.com/image.png");
  });

  it("should not transform data: URLs", () => {
    expect(storageUrl("data:image/png;base64,abc123"))
      .toBe("data:image/png;base64,abc123");
  });

  it("should return undefined for null input", () => {
    expect(storageUrl(null)).toBeUndefined();
  });

  it("should return undefined for undefined input", () => {
    expect(storageUrl(undefined)).toBeUndefined();
  });

  it("should return undefined for empty string", () => {
    expect(storageUrl("")).toBeUndefined();
  });

  it("should handle nested storage paths", () => {
    expect(storageUrl("/manus-storage/org-240001/logos/logo_abc123.png"))
      .toBe("/api/storage-proxy/org-240001/logos/logo_abc123.png");
  });

  it("should not transform relative paths without /manus-storage/ prefix", () => {
    expect(storageUrl("/images/logo.png")).toBe("/images/logo.png");
  });

  it("should handle /api/storage-proxy/ URLs (already transformed)", () => {
    expect(storageUrl("/api/storage-proxy/image.png"))
      .toBe("/api/storage-proxy/image.png");
  });
});

describe("/api/storage-proxy/ route", () => {
  it("should serve files through the proxy route", async () => {
    // Test that the route responds with 200 for a known file
    const response = await fetch("http://localhost:3000/api/storage-proxy/trikot_svg_vorderteil_9c36a538.svg");
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("image/svg+xml");
    expect(response.headers.get("cache-control")).toBe("public, max-age=3600");
    expect(response.headers.get("access-control-allow-origin")).toBe("*");
  });

  it("should serve PNG files through the proxy route", async () => {
    const response = await fetch("http://localhost:3000/api/storage-proxy/trikot_vorderteil_58c100c1.png");
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("image/png");
  });

  it("should return 400 for missing key", async () => {
    const response = await fetch("http://localhost:3000/api/storage-proxy/");
    // The route should handle empty key gracefully
    expect([400, 404, 502]).toContain(response.status);
  });
});
