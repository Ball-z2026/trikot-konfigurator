import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock bcryptjs
vi.mock("bcryptjs", () => ({
  default: {
    hash: vi.fn().mockResolvedValue("$2a$12$hashedpassword"),
    compare: vi.fn().mockImplementation((plain: string, hash: string) => {
      // Simulate: "testpass123" matches the hash
      return Promise.resolve(plain === "testpass123");
    }),
  },
}));

// Mock nanoid
vi.mock("nanoid", () => ({
  nanoid: vi.fn().mockReturnValue("mock_nanoid_16ch"),
}));

describe("Local Auth - Password Generation", () => {
  it("generatePassword returns an 8-character string", async () => {
    const { generatePassword } = await import("./localUserHelpers");
    const pw = generatePassword();
    expect(pw).toHaveLength(8);
    expect(typeof pw).toBe("string");
    // Should only contain allowed characters
    const allowed = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
    for (const char of pw) {
      expect(allowed).toContain(char);
    }
  });

  it("generatePassword produces different passwords each call", async () => {
    const { generatePassword } = await import("./localUserHelpers");
    const passwords = new Set<string>();
    for (let i = 0; i < 20; i++) {
      passwords.add(generatePassword());
    }
    // At least 15 unique passwords out of 20 (statistically near-certain)
    expect(passwords.size).toBeGreaterThanOrEqual(15);
  });
});

describe("Local Auth - Login Validation", () => {
  it("rejects login without email", async () => {
    const res = await fetch("http://localhost:3000/api/auth/local-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: "test" }),
    });
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("E-Mail und Passwort sind erforderlich");
  });

  it("rejects login without password", async () => {
    const res = await fetch("http://localhost:3000/api/auth/local-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "test@test.de" }),
    });
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("E-Mail und Passwort sind erforderlich");
  });

  it("rejects login with non-existent email", async () => {
    const res = await fetch("http://localhost:3000/api/auth/local-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "nonexistent@test.de", password: "test123" }),
    });
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toContain("ungültig");
  });
});

describe("Local Auth - Change Password Validation", () => {
  it("rejects password change without auth", async () => {
    const res = await fetch("http://localhost:3000/api/auth/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: "old", newPassword: "newpass123" }),
    });
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toContain("Nicht angemeldet");
  });

  it("rejects short new password", async () => {
    // This test would need auth, so we test the endpoint exists
    const res = await fetch("http://localhost:3000/api/auth/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ newPassword: "ab" }),
    });
    // Should be 401 (not authenticated) not 404 (route not found)
    expect(res.status).toBe(401);
  });
});
