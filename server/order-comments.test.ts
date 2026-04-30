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

describe("orderComment", () => {
  describe("create", () => {
    it("rejects unauthenticated users", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);
      await expect(
        caller.orderComment.create({ teamId: 1, message: "Test" })
      ).rejects.toThrow();
    });

    it("rejects empty messages", async () => {
      const ctx = createUserContext(1);
      const caller = appRouter.createCaller(ctx);
      await expect(
        caller.orderComment.create({ teamId: 1, message: "" })
      ).rejects.toThrow();
    });

    it("rejects messages exceeding 2000 characters", async () => {
      const ctx = createUserContext(1);
      const caller = appRouter.createCaller(ctx);
      const longMessage = "a".repeat(2001);
      await expect(
        caller.orderComment.create({ teamId: 1, message: longMessage })
      ).rejects.toThrow();
    });
  });

  describe("listByTeam", () => {
    it("rejects unauthenticated users", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);
      await expect(
        caller.orderComment.listByTeam({ teamId: 1 })
      ).rejects.toThrow();
    });
  });

  describe("countByTeams", () => {
    it("rejects unauthenticated users", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);
      await expect(
        caller.orderComment.countByTeams({ teamIds: [1, 2] })
      ).rejects.toThrow();
    });

    it("accepts empty teamIds array for authenticated users", async () => {
      const ctx = createUserContext(1);
      const caller = appRouter.createCaller(ctx);
      const result = await caller.orderComment.countByTeams({ teamIds: [] });
      expect(result).toEqual({});
    });
  });
});
