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
    passwordHash: null,
    mustChangePassword: false,
    totpSecret: null,
    totpEnabled: false,
    backupCodes: null,
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
    } as unknown as TrpcContext["res"],
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
    } as unknown as TrpcContext["res"],
  };
}

describe("orderComment.markAsRead", () => {
  it("rejects unauthenticated users", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.orderComment.markAsRead({ teamId: 1 })
    ).rejects.toThrow();
  });

  it("accepts authenticated users with valid teamId", async () => {
    const ctx = createUserContext(1);
    const caller = appRouter.createCaller(ctx);
    // Should not throw - markAsRead is a mutation that returns { success: true }
    const result = await caller.orderComment.markAsRead({ teamId: 99999 });
    expect(result).toEqual({ success: true });
  });

  it("can be called multiple times without error (upsert)", async () => {
    const ctx = createUserContext(1);
    const caller = appRouter.createCaller(ctx);
    const result1 = await caller.orderComment.markAsRead({ teamId: 88888 });
    expect(result1).toEqual({ success: true });
    const result2 = await caller.orderComment.markAsRead({ teamId: 88888 });
    expect(result2).toEqual({ success: true });
  });
});

describe("orderComment.getUnreadCounts", () => {
  it("rejects unauthenticated users", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.orderComment.getUnreadCounts({ teamIds: [1] })
    ).rejects.toThrow();
  });

  it("returns empty object for empty teamIds", async () => {
    const ctx = createUserContext(1);
    const caller = appRouter.createCaller(ctx);
    const result = await caller.orderComment.getUnreadCounts({ teamIds: [] });
    expect(result).toEqual({});
  });

  it("returns empty object for teams with no comments", async () => {
    const ctx = createUserContext(1);
    const caller = appRouter.createCaller(ctx);
    const result = await caller.orderComment.getUnreadCounts({ teamIds: [77777] });
    expect(result).toEqual({});
  });
});

describe("orderComment.getReadReceipt", () => {
  it("rejects unauthenticated users", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.orderComment.getReadReceipt({ teamId: 1 })
    ).rejects.toThrow();
  });

  it("returns null when no other user has read", async () => {
    const ctx = createUserContext(1);
    const caller = appRouter.createCaller(ctx);
    const result = await caller.orderComment.getReadReceipt({ teamId: 66666 });
    expect(result).toBeNull();
  });

  it("returns read receipt after another user marks as read", async () => {
    const teamId = 55555;
    // User 1 marks as read
    const ctx1 = createUserContext(1);
    const caller1 = appRouter.createCaller(ctx1);
    await caller1.orderComment.markAsRead({ teamId });

    // User 2 checks read receipt - should see User 1's read receipt
    const ctx2 = createUserContext(2);
    const caller2 = appRouter.createCaller(ctx2);
    const receipt = await caller2.orderComment.getReadReceipt({ teamId });
    expect(receipt).not.toBeNull();
    expect(receipt?.userId).toBe(1);
    expect(receipt?.lastReadAt).toBeDefined();
  });
});
