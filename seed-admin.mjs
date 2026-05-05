/**
 * Seed-Script: Admin-Account anlegen
 * 
 * Erstellt den Admin-Account Assemacher@iCloud.com mit Passwort Test1234!
 * Kann mehrfach ausgeführt werden (upsert-Logik).
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import mysql from "mysql2/promise";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL nicht gesetzt!");
  process.exit(1);
}

async function main() {
  const connection = await mysql.createConnection(DATABASE_URL);

  const email = "assemacher@icloud.com";
  const password = "Test1234!";
  const name = "Markus Assemacher";
  const role = "admin";

  // Prüfe ob der Account bereits existiert
  const [existing] = await connection.execute(
    "SELECT id, email, role FROM users WHERE email = ?",
    [email]
  );

  if (Array.isArray(existing) && existing.length > 0) {
    // Account existiert - Passwort und Rolle aktualisieren
    const passwordHash = await bcrypt.hash(password, 12);
    await connection.execute(
      "UPDATE users SET passwordHash = ?, role = ?, loginMethod = 'local', mustChangePassword = 0 WHERE email = ?",
      [passwordHash, role, email]
    );
    console.log(`✓ Admin-Account aktualisiert: ${email} (ID: ${existing[0].id})`);
  } else {
    // Neuen Account erstellen
    const passwordHash = await bcrypt.hash(password, 12);
    const openId = `local_${nanoid(16)}`;

    await connection.execute(
      `INSERT INTO users (openId, name, email, loginMethod, passwordHash, mustChangePassword, role, lastSignedIn, createdAt, updatedAt)
       VALUES (?, ?, ?, 'local', ?, 0, ?, NOW(), NOW(), NOW())`,
      [openId, name, email, passwordHash, role]
    );
    console.log(`✓ Admin-Account erstellt: ${email} (openId: ${openId})`);
  }

  await connection.end();
  console.log("Fertig! Du kannst dich jetzt unter /login mit folgenden Daten anmelden:");
  console.log(`  E-Mail: ${email}`);
  console.log(`  Passwort: ${password}`);
}

main().catch((err) => {
  console.error("Fehler:", err);
  process.exit(1);
});
