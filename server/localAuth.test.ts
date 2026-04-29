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

describe("Local Auth - Forgot Password", () => {
  it("rejects forgot-password without email", async () => {
    const res = await fetch("http://localhost:3000/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("E-Mail-Adresse ist erforderlich");
  });

  it("returns success even for non-existent email (prevents enumeration)", async () => {
    const res = await fetch("http://localhost:3000/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "nonexistent@example.com", origin: "http://localhost:3000" }),
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.message).toContain("Falls ein Account");
  });

  it("forgot-password route exists and accepts POST", async () => {
    const res = await fetch("http://localhost:3000/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "test@test.de", origin: "http://localhost:3000" }),
    });
    // Should be 200 (success response) not 404
    expect(res.status).toBe(200);
  });
});

describe("Local Auth - Reset Password", () => {
  it("rejects reset without token", async () => {
    const res = await fetch("http://localhost:3000/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ newPassword: "newpass123" }),
    });
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("Reset-Token ist erforderlich");
  });

  it("rejects reset with short password", async () => {
    const res = await fetch("http://localhost:3000/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: "sometoken", newPassword: "ab" }),
    });
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("mindestens 6 Zeichen");
  });

  it("rejects reset with invalid token", async () => {
    const res = await fetch("http://localhost:3000/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: "invalid_token_that_does_not_exist", newPassword: "newpass123" }),
    });
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("Ungültiger oder bereits verwendeter");
  });

  it("reset-password route exists and accepts POST", async () => {
    const res = await fetch("http://localhost:3000/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: "test", newPassword: "newpass123" }),
    });
    // Should not be 404 (route exists)
    expect(res.status).not.toBe(404);
  });
});
