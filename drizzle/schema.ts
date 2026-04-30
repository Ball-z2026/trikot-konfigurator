import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, float, json } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  /** Bcrypt-Hash des Passworts (nur für lokale Benutzer, null für OAuth-Benutzer) */
  passwordHash: varchar("passwordHash", { length: 255 }),
  /** Muss das Passwort bei der nächsten Anmeldung geändert werden? */
  mustChangePassword: boolean("mustChangePassword").default(false).notNull(),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Organizations – Vereine und Firmen
 */
export const organizations = mysqlTable("organizations", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  /** Typ: Verein oder Firma */
  type: mysqlEnum("type", ["verein", "firma"]).default("verein").notNull(),
  /** Ersteller (Hauptverantwortlicher) */
  ownerId: int("ownerId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Organization = typeof organizations.$inferSelect;
export type InsertOrganization = typeof organizations.$inferInsert;

/**
 * Departments – Sparten / Abteilungen innerhalb einer Organisation
 */
export const departments = mysqlTable("departments", {
  id: int("id").autoincrement().primaryKey(),
  orgId: int("orgId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Department = typeof departments.$inferSelect;
export type InsertDepartment = typeof departments.$inferInsert;

/**
 * Memberships – Zuordnung von Benutzern zu Organisationen und Abteilungen mit Rollen.
 * 
 * Rollen:
 * - owner: Hauptverantwortlicher – kann alles sehen, Logos hochladen, Mitglieder verwalten
 * - department_lead: Spartenleiter – sieht nur seine Abteilung, kann Schriften freigeben
 * - trainer: Trainer – wird später definiert
 */
export const memberships = mysqlTable("memberships", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  orgId: int("orgId").notNull(),
  /** Optional: Abteilungszuordnung (null = organisationsweit) */
  departmentId: int("departmentId"),
  role: mysqlEnum("role", ["owner", "department_lead", "trainer"]).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Membership = typeof memberships.$inferSelect;
export type InsertMembership = typeof memberships.$inferInsert;

/**
 * Organization Logos – Mehrere Logo-Varianten pro Organisation.
 * z.B. Farb-Logo, SW-Logo, Mini-Logo, Wappen etc.
 * Nur der Hauptverantwortliche darf Logos hochladen.
 */
export const orgLogos = mysqlTable("org_logos", {
  id: int("id").autoincrement().primaryKey(),
  orgId: int("orgId").notNull(),
  /** Name der Variante (z.B. "Farb-Logo", "SW-Logo", "Mini-Logo") */
  name: varchar("name", { length: 255 }).notNull(),
  /** URL zum gespeicherten Logo-Bild */
  imageUrl: text("imageUrl").notNull(),
  /** Storage-Key für S3 */
  storageKey: text("storageKey"),
  /** Ist dieses Logo die Standard-Variante? */
  isDefault: boolean("isDefault").default(false).notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type OrgLogo = typeof orgLogos.$inferSelect;
export type InsertOrgLogo = typeof orgLogos.$inferInsert;

/**
 * Department Fonts – Freigegebene Schriftarten pro Abteilung.
 * Der Spartenleiter gibt Schriften frei, die dann automatisch in der Abteilung verwendet werden.
 */
export const departmentFonts = mysqlTable("department_fonts", {
  id: int("id").autoincrement().primaryKey(),
  departmentId: int("departmentId").notNull(),
  /** Schriftart-Name (z.B. "Inter", "Oswald", "Bebas Neue") */
  fontFamily: varchar("fontFamily", { length: 255 }).notNull(),
  /** Optional: URL zu einer Custom-Font-Datei */
  fontUrl: text("fontUrl"),
  /** Ist diese Schrift die Standard-Schrift der Abteilung? */
  isDefault: boolean("isDefault").default(false).notNull(),
  /** Freigegeben durch (userId) */
  approvedBy: int("approvedBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type DepartmentFont = typeof departmentFonts.$inferSelect;
export type InsertDepartmentFont = typeof departmentFonts.$inferInsert;

/**
 * Products – Textilien die der Admin anlegt (Trikot, Hoodie, Jacke, etc.)
 */
export const products = mysqlTable("products", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 100 }),
  frontImageUrl: text("frontImageUrl"),
  backImageUrl: text("backImageUrl"),
  templateId: varchar("templateId", { length: 100 }),
  /** Farbpalette für Sublimation – JSON-Array von Hex-Farben, z.B. ["#ff0000","#0000ff","#ffffff"] */
  colorPalette: json("colorPalette").$type<string[]>(),
  published: boolean("published").default(false).notNull(),
  createdBy: int("createdBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;

/**
 * Product Parts – Einzelteile eines Produkts (z.B. Vorderteil, Rückteil, Ärmel, Kragen).
 */
export const productParts = mysqlTable("product_parts", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId").notNull(),
  key: varchar("key", { length: 100 }).notNull(),
  label: varchar("label", { length: 255 }).notNull(),
  imageUrl: text("imageUrl"),
  /** Standardfarbe für dieses Teil (Hex, z.B. "#ffffff") – nur bei Sublimation relevant */
  defaultColor: varchar("defaultColor", { length: 20 }),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ProductPart = typeof productParts.$inferSelect;
export type InsertProductPart = typeof productParts.$inferInsert;

/**
 * Product Zones – Platzierungszonen auf einem Produkt.
 * 
 * Position (posX, posY) und Größe (width, height) in % des Bildes.
 * Zusätzlich: Breite/Höhe in cm für Druckmaße, Rotation in Grad, Schriftart.
 * 
 * Purpose-Typen:
 * - logo: Bild-Upload Zone (Vereinslogo, Sponsor etc.)
 * - playerName: Wird automatisch mit Spielername aus Mannschaftsliste befüllt
 * - playerNumber: Wird automatisch mit Spielernummer aus Mannschaftsliste befüllt
 * - clubName: Wird automatisch mit dem Vereinsnamen befüllt (fest für alle Trikots gleich)
 * - custom: Frei konfigurierbares Feld (Text oder Bild)
 */
export const productZones = mysqlTable("product_zones", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId").notNull(),
  partId: int("partId"),
  label: varchar("label", { length: 255 }).notNull(),
  side: mysqlEnum("side", ["front", "back"]).default("front").notNull(),
  /** Zone-Typ: image = nur Bild-Upload, text = nur Text, both = beides */
  type: mysqlEnum("type", ["image", "text", "both"]).default("image").notNull(),
  /** Zweck der Zone – bestimmt ob der Inhalt automatisch befüllt wird */
  purpose: mysqlEnum("purpose", ["logo", "playerName", "playerNumber", "clubName", "custom"]).default("logo").notNull(),
  /** Position X in % vom linken Rand */
  posX: float("posX").default(10).notNull(),
  /** Position Y in % vom oberen Rand */
  posY: float("posY").default(10).notNull(),
  /** Breite in % der Bildbreite */
  width: float("width").default(20).notNull(),
  /** Höhe in % der Bildhöhe */
  height: float("height").default(15).notNull(),
  /** Breite in cm (für Druckmaße) – optional */
  widthCm: float("widthCm"),
  /** Höhe in cm (für Druckmaße) – optional */
  heightCm: float("heightCm"),
  /** Rotation in Grad (0-360) */
  rotation: float("rotation").default(0).notNull(),
  /** Schriftart für Text-Zonen (z.B. "Inter", "Oswald", "Bebas Neue") */
  fontFamily: varchar("fontFamily", { length: 100 }),
  /** Schriftgröße in px (Standard für die Zone) */
  fontSize: float("fontSize"),
  /** Schriftfarbe (Hex-Wert, z.B. "#FFFFFF") */
  fontColor: varchar("fontColor", { length: 20 }),
  /** Schriftstil: normal, bold, italic */
  fontWeight: varchar("fontWeight", { length: 20 }),
  /** Textausrichtung: left, center, right */
  textAlign: varchar("textAlign", { length: 20 }),
  /** Sortierreihenfolge */
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ProductZone = typeof productZones.$inferSelect;
export type InsertProductZone = typeof productZones.$inferInsert;

/**
 * Teams – Mannschaften innerhalb einer Abteilung.
 * Ein Trainer/Betreuer kann eine oder mehrere Mannschaften anlegen.
 */
export const teams = mysqlTable("teams", {
  id: int("id").autoincrement().primaryKey(),
  departmentId: int("departmentId").notNull(),
  orgId: int("orgId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  /** Trainer/Betreuer der diese Mannschaft verwaltet */
  trainerId: int("trainerId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Team = typeof teams.$inferSelect;
export type InsertTeam = typeof teams.$inferInsert;

/**
 * Players – Spieler innerhalb einer Mannschaft.
 */
export const players = mysqlTable("players", {
  id: int("id").autoincrement().primaryKey(),
  teamId: int("teamId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  number: varchar("number", { length: 10 }),
  position: varchar("position", { length: 100 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Player = typeof players.$inferSelect;
export type InsertPlayer = typeof players.$inferInsert;

/**
 * Password Reset Tokens – Tokens für Passwort-Zurücksetzen.
 */
export const passwordResetTokens = mysqlTable("password_reset_tokens", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  token: varchar("token", { length: 64 }).notNull().unique(),
  expiresAt: timestamp("expiresAt").notNull(),
  usedAt: timestamp("usedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type InsertPasswordResetToken = typeof passwordResetTokens.$inferInsert;

/**
 * Team Payment Config – Zahlungsmodell pro Mannschaft.
 * 
 * paymentType:
 * - club: Verein zahlt (Bestätigung durch Spartenleiter erforderlich)
 * - sponsor: Sponsor zahlt (Bestätigung durch Sponsor erforderlich)
 * - self: Selbstzahler (jeder Spieler/Trainer zahlt selbst)
 */
export const teamPayments = mysqlTable("team_payments", {
  id: int("id").autoincrement().primaryKey(),
  teamId: int("teamId").notNull(),
  paymentType: mysqlEnum("paymentType", ["club", "sponsor", "self"]).notNull(),
  /** Status: pending = ausstehend, confirmed = bestätigt/freigegeben */
  status: mysqlEnum("status", ["pending", "confirmed"]).default("pending").notNull(),
  /** Token für E-Mail-Bestätigung */
  confirmationToken: varchar("confirmationToken", { length: 64 }),
  confirmedAt: timestamp("confirmedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TeamPayment = typeof teamPayments.$inferSelect;
export type InsertTeamPayment = typeof teamPayments.$inferInsert;

/**
 * Sponsors – Sponsoren-Daten für das Zahlungsmodell "Sponsor zahlt".
 * Enthält alle relevanten Kontaktdaten des Sponsors.
 */
export const sponsors = mysqlTable("sponsors", {
  id: int("id").autoincrement().primaryKey(),
  teamId: int("teamId").notNull(),
  /** Ansprechpartner-Name */
  contactName: varchar("contactName", { length: 255 }).notNull(),
  /** Firmenname des Sponsors */
  companyName: varchar("companyName", { length: 255 }).notNull(),
  /** E-Mail-Adresse für Bestätigungslink */
  email: varchar("email", { length: 320 }).notNull(),
  /** Telefonnummer */
  phone: varchar("phone", { length: 50 }),
  /** Straße und Hausnummer */
  street: varchar("street", { length: 255 }),
  /** PLZ */
  zip: varchar("zip", { length: 10 }),
  /** Stadt */
  city: varchar("city", { length: 255 }),
  /** Zusätzliche Notizen */
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Sponsor = typeof sponsors.$inferSelect;
export type InsertSponsor = typeof sponsors.$inferInsert;

/**
 * Player Payments – Bezahlt-Status pro Spieler (für Selbstzahler-Modell).
 */
export const playerPayments = mysqlTable("player_payments", {
  id: int("id").autoincrement().primaryKey(),
  playerId: int("playerId").notNull(),
  teamId: int("teamId").notNull(),
  /** Hat der Spieler bezahlt? */
  paid: boolean("paid").default(false).notNull(),
  paidAt: timestamp("paidAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PlayerPayment = typeof playerPayments.$inferSelect;
export type InsertPlayerPayment = typeof playerPayments.$inferInsert;

/**
 * Order Comments – Kommentare zwischen Spartenleiter und Trainer zu einer Mannschaftsbestellung.
 * Ermöglicht direkte Kommunikation im Kontext der Bestellübersicht.
 */
export const orderComments = mysqlTable("order_comments", {
  id: int("id").autoincrement().primaryKey(),
  teamId: int("teamId").notNull(),
  /** Wer hat den Kommentar geschrieben */
  userId: int("userId").notNull(),
  /** Name des Verfassers (zum Zeitpunkt des Kommentars) */
  userName: varchar("userName", { length: 255 }).notNull(),
  /** Rolle des Verfassers: department_lead oder trainer */
  userRole: mysqlEnum("userRole", ["department_lead", "trainer"]).notNull(),
  /** Kommentar-Text */
  message: text("message").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type OrderComment = typeof orderComments.$inferSelect;
export type InsertOrderComment = typeof orderComments.$inferInsert;

/**
 * Comment Read Receipts – Lesebestätigungen für Kommentare.
 * Speichert pro User und Team den Zeitpunkt des letzten Lesens.
 * Damit können ungelesene Kommentare berechnet werden.
 */
export const commentReadReceipts = mysqlTable("comment_read_receipts", {
  id: int("id").autoincrement().primaryKey(),
  teamId: int("teamId").notNull(),
  userId: int("userId").notNull(),
  /** Zeitpunkt des letzten Lesens der Kommentare */
  lastReadAt: timestamp("lastReadAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CommentReadReceipt = typeof commentReadReceipts.$inferSelect;
export type InsertCommentReadReceipt = typeof commentReadReceipts.$inferInsert;
