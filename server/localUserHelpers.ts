/**
 * Helpers for creating and managing local users (Spartenleiter, Trainer).
 * 
 * Local users authenticate with email + password instead of OAuth.
 * They get a unique openId prefixed with "local_" to distinguish them from OAuth users.
 */
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import { users } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { getDb, getUserByEmail } from "./db";

/**
 * Generate a random password (8 characters, alphanumeric).
 * Easy to read and type for the invited user.
 */
export function generatePassword(): string {
  // Use nanoid with custom alphabet for readable passwords
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let password = "";
  for (let i = 0; i < 8; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

/**
 * Create a local user with email and password.
 * Returns the user ID and the generated plaintext password.
 * 
 * The user gets a unique openId like "local_abc123" so the existing
 * session system (which uses openId) works without changes.
 */
export async function createLocalUser(params: {
  name: string;
  email: string;
  password?: string; // If not provided, a random password is generated
}): Promise<{ userId: number; password: string; openId: string }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const email = params.email.toLowerCase().trim();

  // Check if email already exists
  const existing = await getUserByEmail(email);
  if (existing) {
    throw new Error("Ein Benutzer mit dieser E-Mail existiert bereits");
  }

  // Generate password and hash
  const password = params.password || generatePassword();
  const passwordHash = await bcrypt.hash(password, 12);

  // Generate unique openId for local user
  const openId = `local_${nanoid(16)}`;

  // Insert user
  const result = await db.insert(users).values({
    openId,
    name: params.name,
    email,
    loginMethod: "local",
    passwordHash,
    mustChangePassword: true,
    role: "user",
    lastSignedIn: new Date(),
  });

  return {
    userId: Number(result[0].insertId),
    password,
    openId,
  };
}

/**
 * Get a local user by email, including password hash for verification.
 */
export async function getLocalUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(users)
    .where(eq(users.email, email.toLowerCase().trim()))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}
