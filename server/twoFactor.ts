/**
 * Two-Factor Authentication (2FA) Module
 * 
 * Implements TOTP (Time-based One-Time Password) based 2FA using the otpauth library.
 * Provides:
 * - TOTP secret generation and QR code URL
 * - TOTP token verification
 * - Backup code generation and verification
 */
import { TOTP, Secret } from "otpauth";
import * as QRCode from "qrcode";
import crypto from "crypto";
import bcrypt from "bcryptjs";

const APP_NAME = "Textil-Konfigurator";
const TOTP_PERIOD = 30; // seconds
const TOTP_DIGITS = 6;
const TOTP_ALGORITHM = "SHA1";
const BACKUP_CODE_COUNT = 8;

/**
 * Generate a new TOTP secret for a user
 */
export function generateTotpSecret(userEmail: string): { secret: string; otpauthUrl: string } {
  const secret = new Secret({ size: 20 });
  
  const totp = new TOTP({
    issuer: APP_NAME,
    label: userEmail,
    algorithm: TOTP_ALGORITHM,
    digits: TOTP_DIGITS,
    period: TOTP_PERIOD,
    secret,
  });

  return {
    secret: secret.base32,
    otpauthUrl: totp.toString(),
  };
}

/**
 * Generate a QR code data URL from an otpauth URL
 */
export async function generateQrCodeDataUrl(otpauthUrl: string): Promise<string> {
  return QRCode.toDataURL(otpauthUrl, {
    width: 256,
    margin: 2,
    color: {
      dark: "#000000",
      light: "#ffffff",
    },
  });
}

/**
 * Verify a TOTP token against a secret
 * Allows a window of 1 period before and after (to account for clock drift)
 */
export function verifyTotpToken(token: string, secretBase32: string): boolean {
  const totp = new TOTP({
    issuer: APP_NAME,
    algorithm: TOTP_ALGORITHM,
    digits: TOTP_DIGITS,
    period: TOTP_PERIOD,
    secret: Secret.fromBase32(secretBase32),
  });

  // delta returns null if invalid, or the time step difference
  const delta = totp.validate({ token, window: 1 });
  return delta !== null;
}

/**
 * Generate backup codes (plaintext + hashed versions)
 * Returns both so plaintext can be shown to user once, and hashed stored in DB
 */
export async function generateBackupCodes(): Promise<{ plaintext: string[]; hashed: string[] }> {
  const codes: string[] = [];
  for (let i = 0; i < BACKUP_CODE_COUNT; i++) {
    // Generate 8-character alphanumeric codes in format XXXX-XXXX
    const part1 = crypto.randomBytes(2).toString("hex").toUpperCase();
    const part2 = crypto.randomBytes(2).toString("hex").toUpperCase();
    codes.push(`${part1}-${part2}`);
  }

  const hashed = await Promise.all(
    codes.map((code) => bcrypt.hash(code, 10))
  );

  return { plaintext: codes, hashed };
}

/**
 * Verify a backup code against the stored hashed codes
 * Returns the index of the matched code (for removal), or -1 if no match
 */
export async function verifyBackupCode(code: string, hashedCodes: string[]): Promise<number> {
  const normalizedCode = code.toUpperCase().replace(/\s/g, "");
  for (let i = 0; i < hashedCodes.length; i++) {
    const match = await bcrypt.compare(normalizedCode, hashedCodes[i]);
    if (match) return i;
  }
  return -1;
}
