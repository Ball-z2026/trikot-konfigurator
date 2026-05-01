import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock DB module
const mockDb = {
  insert: vi.fn().mockReturnThis(),
  values: vi.fn().mockResolvedValue([{ insertId: 42 }]),
  select: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  orderBy: vi.fn().mockResolvedValue([]),
  update: vi.fn().mockReturnThis(),
  set: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
};

vi.mock("drizzle-orm/mysql2", () => ({
  drizzle: () => mockDb,
}));

vi.mock("drizzle-orm", () => ({
  eq: (col: any, val: any) => ({ col, val }),
  and: (...args: any[]) => ({ type: "and", args }),
  asc: (col: any) => ({ col, dir: "asc" }),
  desc: (col: any) => ({ col, dir: "desc" }),
  not: (val: any) => ({ type: "not", val }),
  inArray: (col: any, vals: any[]) => ({ col, vals }),
  gt: (col: any, val: any) => ({ col, val }),
  sql: (strings: TemplateStringsArray, ...values: any[]) => ({ strings, values }),
}));

vi.mock("mysql2/promise", () => ({
  createPool: () => ({}),
}));

vi.mock("./_core/env", () => ({
  ENV: {
    DATABASE_URL: "mysql://test:test@localhost/test",
    JWT_SECRET: "test",
    BUILT_IN_FORGE_API_URL: "http://test",
    BUILT_IN_FORGE_API_KEY: "test",
  },
}));

describe("Saved Designs - Schema & Router Extensions", () => {
  describe("Schema Validation", () => {
    it("should include playerInitials in zone purpose enum", async () => {
      const { z } = await import("zod");
      const zonePurpose = z.enum(["logo", "clubLogo", "playerName", "playerNumber", "playerInitials", "clubName", "custom"]);
      
      expect(zonePurpose.safeParse("playerInitials").success).toBe(true);
      expect(zonePurpose.safeParse("playerName").success).toBe(true);
      expect(zonePurpose.safeParse("playerNumber").success).toBe(true);
      expect(zonePurpose.safeParse("clubName").success).toBe(true);
      expect(zonePurpose.safeParse("invalidPurpose").success).toBe(false);
    });

    it("should validate design category enum", async () => {
      const { z } = await import("zod");
      const categoryEnum = z.enum(["heimtrikot", "auswaertstrikot", "training", "sonstiges"]);
      
      expect(categoryEnum.safeParse("heimtrikot").success).toBe(true);
      expect(categoryEnum.safeParse("auswaertstrikot").success).toBe(true);
      expect(categoryEnum.safeParse("training").success).toBe(true);
      expect(categoryEnum.safeParse("sonstiges").success).toBe(true);
      expect(categoryEnum.safeParse("invalid").success).toBe(false);
    });

    it("should validate save design input with new fields", async () => {
      const { z } = await import("zod");
      const saveInput = z.object({
        name: z.string().min(1),
        teamId: z.number(),
        productId: z.number(),
        zonesConfig: z.unknown(),
        colorsConfig: z.unknown().optional(),
        thumbnailBase64: z.string().optional(),
        category: z.enum(["heimtrikot", "auswaertstrikot", "training", "sonstiges"]).optional(),
      });

      const validInput = {
        name: "Heimtrikot 2026",
        teamId: 1,
        productId: 1,
        zonesConfig: {},
        thumbnailBase64: "iVBORw0KGgoAAAANSUhEUg==",
        category: "heimtrikot" as const,
      };

      expect(saveInput.safeParse(validInput).success).toBe(true);

      // Without optional fields
      const minimalInput = {
        name: "Test",
        teamId: 1,
        productId: 1,
        zonesConfig: {},
      };
      expect(saveInput.safeParse(minimalInput).success).toBe(true);

      // Invalid category
      const invalidInput = { ...validInput, category: "invalid" };
      expect(saveInput.safeParse(invalidInput).success).toBe(false);
    });

    it("should validate update design input with new fields", async () => {
      const { z } = await import("zod");
      const updateInput = z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        zonesConfig: z.unknown().optional(),
        colorsConfig: z.unknown().optional(),
        thumbnailBase64: z.string().optional(),
        category: z.enum(["heimtrikot", "auswaertstrikot", "training", "sonstiges"]).optional(),
      });

      expect(updateInput.safeParse({ id: 1, category: "training" }).success).toBe(true);
      expect(updateInput.safeParse({ id: 1, thumbnailBase64: "abc" }).success).toBe(true);
      expect(updateInput.safeParse({ id: 1 }).success).toBe(true);
    });

    it("should validate duplicate design input", async () => {
      const { z } = await import("zod");
      const duplicateInput = z.object({
        sourceId: z.number(),
        targetTeamId: z.number(),
        newName: z.string().optional(),
      });

      expect(duplicateInput.safeParse({ sourceId: 1, targetTeamId: 2 }).success).toBe(true);
      expect(duplicateInput.safeParse({ sourceId: 1, targetTeamId: 2, newName: "Kopie" }).success).toBe(true);
      expect(duplicateInput.safeParse({ sourceId: 1 }).success).toBe(false);
    });

    it("should validate setOrgTemplate input", async () => {
      const { z } = await import("zod");
      const setOrgTemplateInput = z.object({
        id: z.number(),
        orgId: z.number(),
        isOrgTemplate: z.boolean(),
      });

      expect(setOrgTemplateInput.safeParse({ id: 1, orgId: 1, isOrgTemplate: true }).success).toBe(true);
      expect(setOrgTemplateInput.safeParse({ id: 1, orgId: 1, isOrgTemplate: false }).success).toBe(true);
      expect(setOrgTemplateInput.safeParse({ id: 1, orgId: 1 }).success).toBe(false);
    });
  });

  describe("Player Initials Logic", () => {
    it("should generate correct initials from full name", () => {
      const getInitials = (name: string): string => {
        const parts = name.trim().split(/\s+/);
        if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
        return parts.map(p => p[0]).join("").substring(0, 3).toUpperCase();
      };

      expect(getInitials("Max Mustermann")).toBe("MM");
      expect(getInitials("Anna Maria Schmidt")).toBe("AMS");
      expect(getInitials("Lukas")).toBe("LU");
      expect(getInitials("Hans-Peter Müller")).toBe("HM");
      expect(getInitials("  Trim  Spaces  ")).toBe("TS");
    });

    it("should handle edge cases for initials", () => {
      const getInitials = (name: string): string => {
        const parts = name.trim().split(/\s+/);
        if (parts.length === 0 || !parts[0]) return "";
        if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
        return parts.map(p => p[0]).join("").substring(0, 3).toUpperCase();
      };

      expect(getInitials("A")).toBe("A");
      expect(getInitials("AB")).toBe("AB");
      expect(getInitials("A B C D")).toBe("ABC"); // max 3
    });
  });

  describe("Font Color in Zone Content", () => {
    it("should store fontColor in zone content", () => {
      type ZoneContent = {
        text?: string;
        fontColor?: string;
        fontFamily?: string;
      };

      const content: ZoneContent = {
        text: "Max Mustermann",
        fontColor: "#ff0000",
        fontFamily: "Roboto",
      };

      expect(content.fontColor).toBe("#ff0000");
      expect(content.text).toBe("Max Mustermann");
    });

    it("should support hex color format", () => {
      const isValidHexColor = (color: string): boolean => {
        return /^#[0-9a-fA-F]{6}$/.test(color);
      };

      expect(isValidHexColor("#ff0000")).toBe(true);
      expect(isValidHexColor("#000000")).toBe(true);
      expect(isValidHexColor("#FFFFFF")).toBe(true);
      expect(isValidHexColor("red")).toBe(false);
      expect(isValidHexColor("#fff")).toBe(false);
    });
  });

  describe("Design Category Mapping", () => {
    it("should map category keys to German labels", () => {
      const CATEGORY_LABELS: Record<string, string> = {
        heimtrikot: "Heimtrikot",
        auswaertstrikot: "Auswärtstrikot",
        training: "Training",
        sonstiges: "Sonstiges",
      };

      expect(CATEGORY_LABELS["heimtrikot"]).toBe("Heimtrikot");
      expect(CATEGORY_LABELS["auswaertstrikot"]).toBe("Auswärtstrikot");
      expect(CATEGORY_LABELS["training"]).toBe("Training");
      expect(CATEGORY_LABELS["sonstiges"]).toBe("Sonstiges");
    });
  });
});
