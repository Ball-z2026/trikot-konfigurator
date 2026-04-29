import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createUserContext(userId = 1): TrpcContext {
  const user: AuthenticatedUser = {
    id: userId,
    openId: `user-${userId}`,
    email: `user${userId}@example.com`,
    name: `User ${userId}`,
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

describe("Organization role-based access", () => {
  describe("org.list", () => {
    it("requires authentication", async () => {
      const caller = appRouter.createCaller(createPublicContext());
      await expect(caller.org.list()).rejects.toThrow();
    });

    it("returns an array for authenticated users", async () => {
      const caller = appRouter.createCaller(createUserContext());
      // May return empty array if DB is not seeded, but should not throw
      const result = await caller.org.list();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("org.create", () => {
    it("requires authentication", async () => {
      const caller = appRouter.createCaller(createPublicContext());
      await expect(
        caller.org.create({ name: "Test Verein", type: "verein" })
      ).rejects.toThrow();
    });
  });

  describe("org.getById", () => {
    it("requires authentication", async () => {
      const caller = appRouter.createCaller(createPublicContext());
      await expect(caller.org.getById({ id: 999 })).rejects.toThrow();
    });

    it("throws FORBIDDEN for non-member", async () => {
      const caller = appRouter.createCaller(createUserContext(9999));
      await expect(caller.org.getById({ id: 999 })).rejects.toThrow();
    });
  });

  describe("department.getById", () => {
    it("requires authentication", async () => {
      const caller = appRouter.createCaller(createPublicContext());
      await expect(
        caller.department.getById({ id: 1, orgId: 1 })
      ).rejects.toThrow();
    });

    it("throws for non-member", async () => {
      const caller = appRouter.createCaller(createUserContext(9999));
      await expect(
        caller.department.getById({ id: 1, orgId: 1 })
      ).rejects.toThrow();
    });
  });

  describe("department.create", () => {
    it("requires authentication", async () => {
      const caller = appRouter.createCaller(createPublicContext());
      await expect(
        caller.department.create({ orgId: 1, name: "Fussball" })
      ).rejects.toThrow();
    });
  });

  describe("membership.add", () => {
    it("requires authentication", async () => {
      const caller = appRouter.createCaller(createPublicContext());
      await expect(
        caller.membership.add({
          orgId: 1,
          userEmail: "test@example.com",
          role: "trainer",
        })
      ).rejects.toThrow();
    });
  });

  describe("deptFont.approve", () => {
    it("requires authentication", async () => {
      const caller = appRouter.createCaller(createPublicContext());
      await expect(
        caller.deptFont.approve({
          departmentId: 1,
          orgId: 1,
          fontFamily: "Inter",
          isDefault: false,
        })
      ).rejects.toThrow();
    });
  });

  describe("deptFont.list", () => {
    it("requires authentication", async () => {
      const caller = appRouter.createCaller(createPublicContext());
      await expect(
        caller.deptFont.list({ departmentId: 1, orgId: 1 })
      ).rejects.toThrow();
    });
  });

  describe("orgLogo.upload", () => {
    it("requires authentication", async () => {
      const caller = appRouter.createCaller(createPublicContext());
      await expect(
        caller.orgLogo.upload({
          orgId: 1,
          name: "Logo",
          imageBase64: "dGVzdA==",
          mimeType: "image/png",
          isDefault: false,
        })
      ).rejects.toThrow();
    });
  });
});
