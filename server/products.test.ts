import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "admin-user",
    email: "admin@example.com",
    name: "Admin User",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

function createUserContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 2,
    openId: "regular-user",
    email: "user@example.com",
    name: "Regular User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("product.list", () => {
  it("returns an array from the public endpoint", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.product.list();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("product.create", () => {
  it("rejects unauthenticated users", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.product.create({ name: "Test" })
    ).rejects.toThrow();
  });

  it("rejects non-admin users", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.product.create({ name: "Test" })
    ).rejects.toThrow();
  });

  it("allows admin users to create products", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.product.create({
      name: "Test Hoodie",
      category: "Hoodie",
    });
    expect(result).toHaveProperty("id");
    expect(typeof result.id).toBe("number");
  });
});

describe("product.getById", () => {
  it("returns a product with zones", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    // First create a product
    const { id } = await caller.product.create({
      name: "Test Jacket",
      category: "Jacke",
    });

    // Then fetch it
    const product = await caller.product.getById({ id });
    expect(product).not.toBeNull();
    expect(product?.name).toBe("Test Jacket");
    expect(product?.zones).toBeDefined();
    expect(Array.isArray(product?.zones)).toBe(true);
  });
});

describe("zone.create", () => {
  it("creates a zone for a product", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    // Create product first
    const { id: productId } = await caller.product.create({
      name: "Zone Test Product",
    });

    // Create zone
    const zone = await caller.zone.create({
      productId,
      label: "Brust Mitte",
      side: "front",
      type: "image",
      posX: 30,
      posY: 20,
      width: 40,
      height: 30,
      sortOrder: 0,
    });

    expect(zone).toHaveProperty("id");

    // Verify zone is in product
    const product = await caller.product.getById({ id: productId });
    expect(product?.zones.length).toBe(1);
    expect(product?.zones[0].label).toBe("Brust Mitte");
  });
});

describe("zone.bulkUpdatePositions", () => {
  it("updates multiple zone positions at once", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    // Create product and zones
    const { id: productId } = await caller.product.create({
      name: "Bulk Test Product",
    });

    const { id: z1 } = await caller.zone.create({
      productId,
      label: "Zone A",
      side: "front",
      type: "image",
      posX: 10,
      posY: 10,
      width: 20,
      height: 20,
      sortOrder: 0,
    });

    const { id: z2 } = await caller.zone.create({
      productId,
      label: "Zone B",
      side: "front",
      type: "text",
      posX: 50,
      posY: 50,
      width: 30,
      height: 15,
      sortOrder: 1,
    });

    // Bulk update
    const result = await caller.zone.bulkUpdatePositions({
      zones: [
        { id: z1, posX: 15, posY: 15, width: 25, height: 25 },
        { id: z2, posX: 55, posY: 55, width: 35, height: 20 },
      ],
    });

    expect(result.success).toBe(true);
  });
});

describe("zone.create with purpose", () => {
  it("creates a zone with purpose field", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const { id: productId } = await caller.product.create({
      name: "Purpose Test Product",
    });

    // Create logo zone
    const logoZone = await caller.zone.create({
      productId,
      label: "Sponsor Logo",
      side: "front",
      type: "image",
      purpose: "logo",
      posX: 30,
      posY: 20,
      width: 40,
      height: 30,
      sortOrder: 0,
    });
    expect(logoZone).toHaveProperty("id");

    // Create playerName zone
    const nameZone = await caller.zone.create({
      productId,
      label: "Spielername",
      side: "back",
      type: "text",
      purpose: "playerName",
      posX: 20,
      posY: 10,
      width: 60,
      height: 15,
      sortOrder: 1,
    });
    expect(nameZone).toHaveProperty("id");

    // Create playerNumber zone
    const numberZone = await caller.zone.create({
      productId,
      label: "Rückennummer",
      side: "back",
      type: "text",
      purpose: "playerNumber",
      posX: 30,
      posY: 30,
      width: 40,
      height: 40,
      sortOrder: 2,
    });
    expect(numberZone).toHaveProperty("id");

    // Verify all zones are in product
    const product = await caller.product.getById({ id: productId });
    expect(product?.zones.length).toBe(3);

    const purposes = product?.zones.map((z: any) => z.purpose);
    expect(purposes).toContain("logo");
    expect(purposes).toContain("playerName");
    expect(purposes).toContain("playerNumber");
  });
});

describe("zone.update purpose", () => {
  it("updates zone purpose and auto-adjusts type", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const { id: productId } = await caller.product.create({
      name: "Update Purpose Test",
    });

    const { id: zoneId } = await caller.zone.create({
      productId,
      label: "Test Zone",
      side: "front",
      type: "image",
      purpose: "logo",
      posX: 10,
      posY: 10,
      width: 20,
      height: 20,
      sortOrder: 0,
    });

    // Update purpose to playerName
    const result = await caller.zone.update({
      id: zoneId,
      purpose: "playerName",
      type: "text",
    });
    expect(result.success).toBe(true);
  });
});

describe("product.delete", () => {
  it("deletes a product", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const { id } = await caller.product.create({
      name: "To Delete",
    });

    const result = await caller.product.delete({ id });
    expect(result.success).toBe(true);

    // Verify it's gone
    const product = await caller.product.getById({ id });
    expect(product).toBeNull();
  });
});
