import { describe, it, expect } from "vitest";

describe("Admin Users - List Users (via tRPC)", () => {
  it("adminUsers.list rejects without auth", async () => {
    const res = await fetch("http://localhost:3000/api/trpc/adminUsers.list", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    // Without auth, tRPC returns 401 or 403
    expect([401, 403]).toContain(res.status);
  });
});

describe("Admin Users - Create User Validation", () => {
  it("adminUsers.create rejects without auth", async () => {
    const res = await fetch("http://localhost:3000/api/trpc/adminUsers.create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        json: { name: "Test User", email: "test@test.de" },
      }),
    });
    expect([401, 403]).toContain(res.status);
  });
});

describe("Admin Users - Reset Password Validation", () => {
  it("adminUsers.resetPassword rejects without auth", async () => {
    const res = await fetch("http://localhost:3000/api/trpc/adminUsers.resetPassword", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        json: { userId: "nonexistent-id" },
      }),
    });
    expect([401, 403]).toContain(res.status);
  });
});

describe("Admin Users - Delete User Validation", () => {
  it("adminUsers.delete rejects without auth", async () => {
    const res = await fetch("http://localhost:3000/api/trpc/adminUsers.delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        json: { userId: "nonexistent-id" },
      }),
    });
    expect([401, 403]).toContain(res.status);
  });
});

describe("Admin Users - Set Password Validation", () => {
  it("adminUsers.setPassword rejects without auth", async () => {
    const res = await fetch("http://localhost:3000/api/trpc/adminUsers.setPassword", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        json: { userId: "nonexistent-id", password: "newpass123" },
      }),
    });
    expect([401, 403]).toContain(res.status);
  });
});
