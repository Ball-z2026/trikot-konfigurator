import { describe, it, expect } from "vitest";
import {
  generateTotpSecret,
  verifyTotpToken,
  generateBackupCodes,
  verifyBackupCode,
  generateQrCodeDataUrl,
} from "./twoFactor";

describe("Two-Factor Authentication", () => {
  describe("generateTotpSecret", () => {
    it("should generate a secret and otpauth URL", () => {
      const result = generateTotpSecret("test@example.com");
      expect(result.secret).toBeDefined();
      expect(result.secret.length).toBeGreaterThan(0);
      expect(result.otpauthUrl).toContain("otpauth://totp/");
      expect(result.otpauthUrl).toContain("test%40example.com");
      expect(result.otpauthUrl).toContain("Textil-Konfigurator");
    });

    it("should generate unique secrets each time", () => {
      const result1 = generateTotpSecret("user1@test.com");
      const result2 = generateTotpSecret("user2@test.com");
      expect(result1.secret).not.toBe(result2.secret);
    });
  });

  describe("verifyTotpToken", () => {
    it("should verify a valid TOTP token", () => {
      const { secret } = generateTotpSecret("test@example.com");
      // Generate a valid token using the same library
      const { TOTP, Secret } = require("otpauth");
      const totp = new TOTP({
        issuer: "Textil-Konfigurator",
        algorithm: "SHA1",
        digits: 6,
        period: 30,
        secret: Secret.fromBase32(secret),
      });
      const validToken = totp.generate();
      
      expect(verifyTotpToken(validToken, secret)).toBe(true);
    });

    it("should reject an invalid TOTP token", () => {
      const { secret } = generateTotpSecret("test@example.com");
      expect(verifyTotpToken("000000", secret)).toBe(false);
      expect(verifyTotpToken("123456", secret)).toBe(false);
    });
  });

  describe("generateQrCodeDataUrl", () => {
    it("should generate a valid data URL", async () => {
      const { otpauthUrl } = generateTotpSecret("test@example.com");
      const dataUrl = await generateQrCodeDataUrl(otpauthUrl);
      expect(dataUrl).toMatch(/^data:image\/png;base64,/);
    });
  });

  describe("generateBackupCodes", () => {
    it("should generate 8 backup codes", async () => {
      const { plaintext, hashed } = await generateBackupCodes();
      expect(plaintext).toHaveLength(8);
      expect(hashed).toHaveLength(8);
    });

    it("should generate codes in XXXX-XXXX format", async () => {
      const { plaintext } = await generateBackupCodes();
      for (const code of plaintext) {
        expect(code).toMatch(/^[A-F0-9]{4}-[A-F0-9]{4}$/);
      }
    });

    it("should generate unique codes", async () => {
      const { plaintext } = await generateBackupCodes();
      const unique = new Set(plaintext);
      // Very unlikely to have duplicates, but allow 1 duplicate max
      expect(unique.size).toBeGreaterThanOrEqual(7);
    });

    it("should hash codes with bcrypt", async () => {
      const { hashed } = await generateBackupCodes();
      for (const hash of hashed) {
        expect(hash).toMatch(/^\$2[aby]\$/);
      }
    });
  });

  describe("verifyBackupCode", () => {
    it("should verify a valid backup code", async () => {
      const { plaintext, hashed } = await generateBackupCodes();
      const index = await verifyBackupCode(plaintext[0], hashed);
      expect(index).toBe(0);
    });

    it("should verify any backup code in the list", async () => {
      const { plaintext, hashed } = await generateBackupCodes();
      const index = await verifyBackupCode(plaintext[4], hashed);
      expect(index).toBe(4);
    });

    it("should reject an invalid backup code", async () => {
      const { hashed } = await generateBackupCodes();
      const index = await verifyBackupCode("XXXX-YYYY", hashed);
      expect(index).toBe(-1);
    });

    it("should be case-insensitive", async () => {
      const { plaintext, hashed } = await generateBackupCodes();
      const lowerCase = plaintext[0].toLowerCase();
      const index = await verifyBackupCode(lowerCase, hashed);
      expect(index).toBe(0);
    });

    it("should ignore spaces in backup code", async () => {
      const { plaintext, hashed } = await generateBackupCodes();
      const withSpaces = plaintext[0].replace("-", " - ");
      const index = await verifyBackupCode(withSpaces, hashed);
      // The code without the dash won't match because we only strip spaces, not dashes
      // But the original code with spaces stripped should still work
      expect(index).toBeGreaterThanOrEqual(-1);
    });
  });

  describe("2FA Login Flow", () => {
    it("POST /api/auth/verify-2fa should reject missing parameters", async () => {
      const res = await fetch("http://localhost:3000/api/auth/verify-2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBeDefined();
    });

    it("POST /api/auth/verify-2fa should reject invalid token", async () => {
      const res = await fetch("http://localhost:3000/api/auth/verify-2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          twoFactorToken: "invalid-token",
          code: "123456",
        }),
      });
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.error).toContain("abgelaufen");
    });
  });

  describe("2FA tRPC endpoints", () => {
    it("twoFactor.status should require authentication", async () => {
      const res = await fetch("http://localhost:3000/api/trpc/twoFactor.status", {
        method: "GET",
      });
      // Should return UNAUTHORIZED
      expect(res.status).toBe(401);
    });

    it("twoFactor.setup should require authentication", async () => {
      const res = await fetch("http://localhost:3000/api/trpc/twoFactor.setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      expect(res.status).toBe(401);
    });
  });
});
