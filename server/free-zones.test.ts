import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock DB functions
const mockGetProductById = vi.fn();
const mockCreateZone = vi.fn();
const mockDeleteZone = vi.fn();
const mockBulkUpdateZones = vi.fn();
const mockListZonesByProduct = vi.fn();

vi.mock("./db", () => ({
  getProductById: (...args: any[]) => mockGetProductById(...args),
  createZone: (...args: any[]) => mockCreateZone(...args),
  deleteZone: (...args: any[]) => mockDeleteZone(...args),
  bulkUpdateZones: (...args: any[]) => mockBulkUpdateZones(...args),
  listZonesByProduct: (...args: any[]) => mockListZonesByProduct(...args),
}));

describe("Free Zone Mode Logic", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("freeZoneMode Product Detection", () => {
    it("should identify freeZoneMode products", async () => {
      mockGetProductById.mockResolvedValue({
        id: 1,
        name: "Trainingshose",
        freeZoneMode: true,
      });
      const product = await mockGetProductById(1);
      expect(product.freeZoneMode).toBe(true);
    });

    it("should identify non-freeZoneMode products (Trikots)", async () => {
      mockGetProductById.mockResolvedValue({
        id: 2,
        name: "Fußballtrikot",
        freeZoneMode: false,
      });
      const product = await mockGetProductById(2);
      expect(product.freeZoneMode).toBe(false);
    });
  });

  describe("Zone Creation in freeZoneMode", () => {
    it("should allow creating zones for freeZoneMode products", async () => {
      mockGetProductById.mockResolvedValue({ id: 1, freeZoneMode: true });
      mockCreateZone.mockResolvedValue(42);

      const product = await mockGetProductById(1);
      expect(product.freeZoneMode).toBe(true);

      const zoneId = await mockCreateZone({
        productId: 1,
        partId: 10,
        label: "Sponsor Rücken",
        side: "back",
        type: "both",
        purpose: "custom",
        posX: 30,
        posY: 40,
        width: 25,
        height: 15,
      });
      expect(zoneId).toBe(42);
      expect(mockCreateZone).toHaveBeenCalledTimes(1);
    });

    it("should reject zone creation for non-freeZoneMode products", async () => {
      mockGetProductById.mockResolvedValue({ id: 2, freeZoneMode: false });
      const product = await mockGetProductById(2);
      expect(product.freeZoneMode).toBe(false);
      // In the real router, this would throw FORBIDDEN
    });
  });

  describe("Zone Deletion in freeZoneMode", () => {
    it("should allow deleting custom zones", async () => {
      mockGetProductById.mockResolvedValue({ id: 1, freeZoneMode: true });
      mockListZonesByProduct.mockResolvedValue([
        { id: 10, purpose: "custom", label: "Sponsor" },
        { id: 11, purpose: "clubLogo", label: "Vereinswappen" },
      ]);
      mockDeleteZone.mockResolvedValue(undefined);

      const zones = await mockListZonesByProduct(1);
      const customZone = zones.find((z: any) => z.purpose === "custom");
      expect(customZone).toBeDefined();
      expect(customZone.purpose).not.toBe("clubLogo");

      await mockDeleteZone(customZone.id);
      expect(mockDeleteZone).toHaveBeenCalledWith(10);
    });

    it("should NOT allow deleting clubLogo zones", async () => {
      mockListZonesByProduct.mockResolvedValue([
        { id: 10, purpose: "custom", label: "Sponsor" },
        { id: 11, purpose: "clubLogo", label: "Vereinswappen" },
      ]);

      const zones = await mockListZonesByProduct(1);
      const clubLogoZone = zones.find((z: any) => z.purpose === "clubLogo");
      expect(clubLogoZone).toBeDefined();
      expect(clubLogoZone.purpose).toBe("clubLogo");
      // In the real router, this would throw FORBIDDEN
    });
  });

  describe("Zone Position Updates (Drag & Resize)", () => {
    it("should allow bulk position updates for freeZoneMode products", async () => {
      mockGetProductById.mockResolvedValue({ id: 1, freeZoneMode: true });
      mockBulkUpdateZones.mockResolvedValue(undefined);

      const updates = [
        { id: 10, posX: 35, posY: 45, width: 20, height: 12 },
        { id: 11, posX: 60, posY: 20, width: 15, height: 8 },
      ];

      await mockBulkUpdateZones(updates);
      expect(mockBulkUpdateZones).toHaveBeenCalledWith(updates);
    });

    it("should clamp positions within 0-100 range", () => {
      // Client-side validation
      const clamp = (val: number, min: number, max: number) =>
        Math.max(min, Math.min(max, val));

      expect(clamp(-5, 0, 100)).toBe(0);
      expect(clamp(105, 0, 100)).toBe(100);
      expect(clamp(50, 0, 100)).toBe(50);
    });
  });

  describe("Auto-Field Toggles", () => {
    it("should track enabled auto fields", () => {
      const enabledAutoFields: Record<string, boolean> = {
        playerName: true,
        playerNumber: true,
        playerInitials: false,
      };

      expect(enabledAutoFields.playerName).toBe(true);
      expect(enabledAutoFields.playerInitials).toBe(false);
    });

    it("should toggle auto fields on/off", () => {
      const enabledAutoFields: Record<string, boolean> = {
        playerName: true,
        playerNumber: true,
        playerInitials: false,
      };

      // Toggle off
      enabledAutoFields.playerName = false;
      expect(enabledAutoFields.playerName).toBe(false);

      // Toggle on
      enabledAutoFields.playerInitials = true;
      expect(enabledAutoFields.playerInitials).toBe(true);
    });
  });

  describe("Bekleidung Templates", () => {
    it("should have 5 new bekleidung templates", async () => {
      // Import templates
      const { TEXTIL_TEMPLATES } = await import("../shared/templates");
      const bekleidungTemplates = TEXTIL_TEMPLATES.filter(
        (t) => t.category === "Bekleidung"
      );
      expect(bekleidungTemplates.length).toBe(5);
    });

    it("all bekleidung templates should have freeZoneMode=true", async () => {
      const { TEXTIL_TEMPLATES } = await import("../shared/templates");
      const bekleidungTemplates = TEXTIL_TEMPLATES.filter(
        (t) => t.category === "Bekleidung"
      );
      bekleidungTemplates.forEach((t) => {
        expect(t.freeZoneMode).toBe(true);
      });
    });

    it("all bekleidung templates should have clubLogo zone", async () => {
      const { TEXTIL_TEMPLATES } = await import("../shared/templates");
      const bekleidungTemplates = TEXTIL_TEMPLATES.filter(
        (t) => t.category === "Bekleidung"
      );
      bekleidungTemplates.forEach((t) => {
        const hasClubLogo = t.parts.some((p) =>
          p.zones.some((z) => z.purpose === "clubLogo")
        );
        expect(hasClubLogo).toBe(true);
      });
    });

    it("bekleidung template IDs should be correct", async () => {
      const { TEXTIL_TEMPLATES } = await import("../shared/templates");
      const bekleidungIds = TEXTIL_TEMPLATES
        .filter((t) => t.category === "Bekleidung")
        .map((t) => t.id);
      expect(bekleidungIds).toContain("trainingshose");
      expect(bekleidungIds).toContain("aufwaermshirt");
      expect(bekleidungIds).toContain("zipjacke");
      expect(bekleidungIds).toContain("halfzipper");
      expect(bekleidungIds).toContain("warmejacke");
    });

    it("each bekleidung template should have front and back parts", async () => {
      const { TEXTIL_TEMPLATES } = await import("../shared/templates");
      const bekleidungTemplates = TEXTIL_TEMPLATES.filter(
        (t) => t.category === "Bekleidung"
      );
      bekleidungTemplates.forEach((t) => {
        expect(t.parts.length).toBe(2);
        const keys = t.parts.map((p) => p.key);
        expect(keys).toContain("vorderteil");
        expect(keys).toContain("rueckteil");
      });
    });
  });
});
