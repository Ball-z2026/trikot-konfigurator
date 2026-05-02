/**
 * Local Authentication Routes
 * 
 * Provides E-Mail + Password login for Spartenleiter and Trainer
 * who are invited by the Hauptverantwortlicher or Spartenleiter.
 * 
 * Routes:
 * - POST /api/auth/local-login: Login with email + password
 * - POST /api/auth/change-password: Change password (requires auth)
 * - POST /api/auth/forgot-password: Request password reset link
 * - POST /api/auth/reset-password: Reset password with token
 */
import type { Express, Request, Response } from "express";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { sdk } from "./_core/sdk";
import { notifyOwner } from "./_core/notification";
import * as db from "./db";

export function registerLocalAuthRoutes(app: Express) {
  /**
   * POST /api/auth/register
   * Body: { role: "verein" | "sparte" | "trainer", name, email, password, orgName, deptName?, teamName? }
   * 
   * Self-registration with role selection.
   */
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const { role, name, email, password, orgName, orgState, orgSport, deptName, teamName } = req.body;

      if (!role || !name || !email || !password) {
        res.status(400).json({ error: "Name, E-Mail, Passwort und Rolle sind erforderlich" });
        return;
      }
      if (password.length < 6) {
        res.status(400).json({ error: "Passwort muss mindestens 6 Zeichen lang sein" });
        return;
      }
      if (!orgName) {
        res.status(400).json({ error: "Vereinsname ist erforderlich" });
        return;
      }
      if (role === "sparte" && !deptName) {
        res.status(400).json({ error: "Spartenname ist erforderlich" });
        return;
      }
      if (role === "trainer" && (!deptName || !teamName)) {
        res.status(400).json({ error: "Sparten- und Mannschaftsname sind erforderlich" });
        return;
      }

      // Check if email already exists
      const existing = await db.getUserByEmail(email.toLowerCase().trim());
      if (existing) {
        res.status(409).json({ error: "Ein Benutzer mit dieser E-Mail existiert bereits" });
        return;
      }

      // Create user
      const passwordHash = await bcrypt.hash(password, 12);
      const openId = `local_${nanoid(16)}`;
      const { users } = await import("../drizzle/schema");
      const dbConn = await db.getDb();
      if (!dbConn) throw new Error("Database not available");

      const userResult = await dbConn.insert(users).values({
        openId,
        name,
        email: email.toLowerCase().trim(),
        loginMethod: "local",
        passwordHash,
        mustChangePassword: false,
        role: "user",
        lastSignedIn: new Date(),
      });
      const userId = Number(userResult[0].insertId);

      // Create organization
      const orgId = Number(await db.createOrganization({
        name: orgName,
        type: "verein",
        ownerId: userId,
        state: orgState || undefined,
        sport: orgSport || undefined,
      }));

      let createdDeptId: number | null = null;
      if (role === "verein") {
        // Owner membership
        await db.createMembership({ userId, orgId, role: "owner", departmentId: null });
      } else if (role === "sparte") {
        // Create department + department_lead membership
        createdDeptId = Number(await db.createDepartment({ orgId, name: deptName }));
        await db.createMembership({ userId, orgId, role: "department_lead", departmentId: createdDeptId });
      } else if (role === "trainer") {
        // Create department + team + trainer membership
        createdDeptId = Number(await db.createDepartment({ orgId, name: deptName }));
        await db.createMembership({ userId, orgId, role: "trainer", departmentId: createdDeptId });
        await db.createTeam({ name: teamName, departmentId: createdDeptId, orgId, trainerId: userId });
      }

      // Create session token
      const sessionToken = await sdk.createSessionToken(openId, {
        name,
        expiresInMs: ONE_YEAR_MS,
      });

      // Set session cookie
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      res.json({
        success: true,
        user: { id: userId, name, email: email.toLowerCase().trim(), role: "user" },
        orgId,
        deptId: createdDeptId,
      });
    } catch (error) {
      console.error("[LocalAuth] Registration failed:", error);
      res.status(500).json({ error: "Registrierung fehlgeschlagen" });
    }
  });

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

  /**
   * POST /api/auth/forgot-password
   * Body: { email: string, origin: string }
   * 
   * Generates a password reset token and sends a notification to the owner
   * with the reset link. The user receives the link via the owner.
   */
  app.post("/api/auth/forgot-password", async (req: Request, res: Response) => {
    try {
      const { email, origin } = req.body;

      if (!email) {
        res.status(400).json({ error: "E-Mail-Adresse ist erforderlich" });
        return;
      }

      // Always respond with success to prevent email enumeration
      const successResponse = {
        success: true,
        message: "Falls ein Account mit dieser E-Mail existiert, wurde ein Link zum Zurücksetzen gesendet.",
      };

      // Find user by email
      const user = await db.getUserByEmail(email.toLowerCase().trim());
      if (!user || !user.passwordHash) {
        // Don't reveal whether the email exists
        res.json(successResponse);
        return;
      }

      // Generate a secure reset token
      const token = nanoid(48);
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      // Store the token in the database
      const dbConn = await db.getDb();
      if (!dbConn) throw new Error("Database not available");

      const { passwordResetTokens } = await import("../drizzle/schema");
      await dbConn.insert(passwordResetTokens).values({
        userId: user.id,
        token,
        expiresAt,
      });

      // Build the reset link
      const baseUrl = origin || req.headers.origin || `${req.protocol}://${req.get("host")}`;
      const resetLink = `${baseUrl}/reset-password?token=${token}`;

      // Send notification to owner with the reset link
      try {
        await notifyOwner({
          title: `Passwort-Reset angefordert: ${user.name || user.email}`,
          content: `Der Benutzer "${user.name || "Unbekannt"}" (${user.email}) hat einen Passwort-Reset angefordert.\n\nBitte leiten Sie folgenden Link an den Benutzer weiter:\n\n${resetLink}\n\nDer Link ist 1 Stunde gültig.`,
        });
      } catch (notifyError) {
        console.warn("[LocalAuth] Failed to send reset notification:", notifyError);
      }

      res.json(successResponse);
    } catch (error) {
      console.error("[LocalAuth] Forgot password failed:", error);
      res.status(500).json({ error: "Anfrage fehlgeschlagen. Bitte versuchen Sie es erneut." });
    }
  });

  /**
   * POST /api/auth/reset-password
   * Body: { token: string, newPassword: string }
   * 
   * Resets the password using a valid reset token.
   */
  app.post("/api/auth/reset-password", async (req: Request, res: Response) => {
    try {
      const { token, newPassword } = req.body;

      if (!token) {
        res.status(400).json({ error: "Reset-Token ist erforderlich" });
        return;
      }

      if (!newPassword || newPassword.length < 6) {
        res.status(400).json({ error: "Neues Passwort muss mindestens 6 Zeichen lang sein" });
        return;
      }

      // Find the token in the database
      const dbConn = await db.getDb();
      if (!dbConn) throw new Error("Database not available");

      const { passwordResetTokens, users } = await import("../drizzle/schema");
      const { eq, and, isNull } = await import("drizzle-orm");

      const tokenRecords = await dbConn
        .select()
        .from(passwordResetTokens)
        .where(and(
          eq(passwordResetTokens.token, token),
          isNull(passwordResetTokens.usedAt)
        ))
        .limit(1);

      if (tokenRecords.length === 0) {
        res.status(400).json({ error: "Ungültiger oder bereits verwendeter Reset-Link" });
        return;
      }

      const tokenRecord = tokenRecords[0];

      // Check if token has expired
      if (new Date() > tokenRecord.expiresAt) {
        res.status(400).json({ error: "Der Reset-Link ist abgelaufen. Bitte fordern Sie einen neuen an." });
        return;
      }

      // Hash new password and update user
      const newHash = await bcrypt.hash(newPassword, 12);
      await dbConn.update(users).set({
        passwordHash: newHash,
        mustChangePassword: false,
      }).where(eq(users.id, tokenRecord.userId));

      // Mark token as used
      await dbConn.update(passwordResetTokens).set({
        usedAt: new Date(),
      }).where(eq(passwordResetTokens.id, tokenRecord.id));

      res.json({ success: true, message: "Passwort erfolgreich zurückgesetzt. Sie können sich jetzt anmelden." });
    } catch (error) {
      console.error("[LocalAuth] Reset password failed:", error);
      res.status(500).json({ error: "Passwort-Reset fehlgeschlagen. Bitte versuchen Sie es erneut." });
    }
  });
}
