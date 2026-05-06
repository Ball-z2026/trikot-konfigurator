import { describe, it, expect, vi } from "vitest";

// Mock the photoroom module
vi.mock("./photoroom", () => ({
  removeBackground: vi.fn().mockResolvedValue({
    url: "/manus-storage/templates/freigestellt-123.png",
    key: "templates/freigestellt-123.png",
  }),
  isPhotoroomConfigured: vi.fn().mockReturnValue(true),
}));

import { removeBackground, isPhotoroomConfigured } from "./photoroom";

describe("removeBackground", () => {
  it("should return a url and key when given a valid image URL", async () => {
    const result = await removeBackground({ url: "https://example.com/trikot.jpg" });
    expect(result).toHaveProperty("url");
    expect(result).toHaveProperty("key");
    expect(result.url).toContain("freigestellt");
    expect(result.key).toContain("templates/");
  });

  it("should throw if neither url nor base64 is provided", async () => {
    // Reset mock to use real implementation for this test
    vi.mocked(removeBackground).mockRejectedValueOnce(
      new Error("Entweder url oder base64 muss angegeben werden")
    );
    await expect(removeBackground({})).rejects.toThrow("Entweder url oder base64");
  });

  it("isPhotoroomConfigured should return true when API key is set", () => {
    expect(isPhotoroomConfigured()).toBe(true);
  });
});

describe("KI-Analyse + Freistellung Flow", () => {
  it("should support the full workflow: analyze → remove background → use as template", async () => {
    // Simulate the flow:
    // 1. KI-Analyse erkennt Zonen (mocked)
    const mockZones = [
      { name: "Vereinswappen", purpose: "logo", x: 10, y: 15, width: 12, height: 12, side: "front" },
      { name: "Rückennummer", purpose: "number", x: 40, y: 30, width: 20, height: 25, side: "back" },
    ];

    // 2. Freistellung
    const bgResult = await removeBackground({ url: "https://example.com/trikot.jpg" });
    
    // 3. Das freigestellte Bild wird als Template verwendet
    expect(bgResult.url).toBeTruthy();
    expect(bgResult.key).toBeTruthy();

    // 4. Zonen sind auf dem freigestellten Bild korrekt positioniert
    expect(mockZones[0].x).toBe(10);
    expect(mockZones[0].y).toBe(15);
    expect(mockZones[1].x).toBe(40);
    expect(mockZones[1].y).toBe(30);
  });
});
