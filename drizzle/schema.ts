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
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

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
