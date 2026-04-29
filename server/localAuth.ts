/**
 * Local Authentication Routes
 * 
 * Provides E-Mail + Password login for Spartenleiter and Trainer
 * who are invited by the Hauptverantwortlicher or Spartenleiter.
 * 
 * Routes:
 * - POST /api/auth/local-login: Login with email + password
 * - POST /api/auth/change-password: Change password (requires auth)
 */
import type { Express, Request, Response } from "express";
import bcrypt from "bcryptjs";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { sdk } from "./_core/sdk";
import * as db from "./db";

export function registerLocalAuthRoutes(app: Express) {
  /**
   * POST /api/auth/local-login
   * Body: { email: string, password: string }
   * 
   * Authenticates a local user (Spartenleiter/Trainer) with email + password.
   * Sets the same session cookie as OAuth login.
   */
  app.post("/api/auth/local-login", async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({ error: "E-Mail und Passwort sind erforderlich" });
        return;
      }

      // Find user by email
      const user = await db.getUserByEmail(email.toLowerCase().trim());
      if (!user) {
        res.status(401).json({ error: "E-Mail oder Passwort ungültig" });
        return;
      }

      // Check if user has a password hash (local user)
      if (!user.passwordHash) {
        res.status(401).json({ error: "Dieser Account nutzt OAuth-Anmeldung. Bitte verwenden Sie den normalen Login." });
        return;
      }

      // Verify password
      const isValid = await bcrypt.compare(password, user.passwordHash);
      if (!isValid) {
        res.status(401).json({ error: "E-Mail oder Passwort ungültig" });
        return;
      }

      // Update last sign-in
      await db.upsertUser({
        openId: user.openId,
        lastSignedIn: new Date(),
      });

      // Create session token (same as OAuth flow)
      const sessionToken = await sdk.createSessionToken(user.openId, {
        name: user.name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      // Set session cookie (same as OAuth flow)
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      res.json({
        success: true,
        mustChangePassword: user.mustChangePassword,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    } catch (error) {
      console.error("[LocalAuth] Login failed:", error);
      res.status(500).json({ error: "Anmeldung fehlgeschlagen" });
    }
  });

  /**
   * POST /api/auth/change-password
   * Body: { currentPassword: string, newPassword: string }
   * 
   * Changes the password for the currently authenticated local user.
   */
  app.post("/api/auth/change-password", async (req: Request, res: Response) => {
    try {
      // Authenticate the request
      let user;
      try {
        user = await sdk.authenticateRequest(req);
      } catch {
        res.status(401).json({ error: "Nicht angemeldet" });
        return;
      }

      const { currentPassword, newPassword } = req.body;

      if (!newPassword || newPassword.length < 6) {
        res.status(400).json({ error: "Neues Passwort muss mindestens 6 Zeichen lang sein" });
        return;
      }

      // Check if user has a password (local user)
      if (!user.passwordHash) {
        res.status(400).json({ error: "Dieser Account nutzt OAuth-Anmeldung. Passwort kann nicht geändert werden." });
        return;
      }

      // For mustChangePassword, currentPassword can be the initial password
      if (!user.mustChangePassword) {
        if (!currentPassword) {
          res.status(400).json({ error: "Aktuelles Passwort ist erforderlich" });
          return;
        }
        const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
        if (!isValid) {
          res.status(401).json({ error: "Aktuelles Passwort ist ungültig" });
          return;
        }
      }

      // Hash new password and update
      const newHash = await bcrypt.hash(newPassword, 12);
      const dbConn = await db.getDb();
      if (!dbConn) throw new Error("Database not available");

      const { users } = await import("../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      await dbConn.update(users).set({
        passwordHash: newHash,
        mustChangePassword: false,
      }).where(eq(users.id, user.id));

      res.json({ success: true, message: "Passwort erfolgreich geändert" });
    } catch (error) {
      console.error("[LocalAuth] Change password failed:", error);
      res.status(500).json({ error: "Passwort-Änderung fehlgeschlagen" });
    }
  });
}
