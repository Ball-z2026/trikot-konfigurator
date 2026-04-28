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
 * Ein Produkt kann aus mehreren Teilen bestehen (Vorderteil, Rückteil, Ärmel, etc.)
 * oder nur aus Vorder-/Rückseite (Legacy-Modus).
 */
export const products = mysqlTable("products", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 100 }),
  /** Legacy: Einfaches Vorder-/Rückseitenbild für Produkte ohne Teile */
  frontImageUrl: text("frontImageUrl"),
  backImageUrl: text("backImageUrl"),
  /** Welches Template wurde als Basis verwendet (null = kein Template) */
  templateId: varchar("templateId", { length: 100 }),
  published: boolean("published").default(false).notNull(),
  createdBy: int("createdBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;

/**
 * Product Parts – Einzelteile eines Produkts (z.B. Vorderteil, Rückteil, Ärmel, Kragen).
 * Jedes Teil hat ein eigenes Bild und kann eigene Platzierungszonen haben.
 */
export const productParts = mysqlTable("product_parts", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId").notNull(),
  /** Interner Schlüssel (z.B. "vorderteil", "rueckteil", "aermel_links") */
  key: varchar("key", { length: 100 }).notNull(),
  /** Anzeigename (z.B. "Vorderteil", "Rückteil", "Ärmel Links") */
  label: varchar("label", { length: 255 }).notNull(),
  /** Bild-URL des Teils */
  imageUrl: text("imageUrl"),
  /** Sortierreihenfolge für die Anzeige */
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ProductPart = typeof productParts.$inferSelect;
export type InsertProductPart = typeof productParts.$inferInsert;

/**
 * Product Zones – Platzierungszonen auf einem Produkt.
 * Position und Größe werden als Prozentwerte gespeichert (0-100).
 * Eine Zone gehört entweder zu einem Part (partId) oder zu einer Seite (side) für Legacy-Produkte.
 */
export const productZones = mysqlTable("product_zones", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId").notNull(),
  /** Referenz auf ein Produktteil (null für Legacy-Produkte ohne Parts) */
  partId: int("partId"),
  label: varchar("label", { length: 255 }).notNull(),
  /** Legacy: Seite für Produkte ohne Parts */
  side: mysqlEnum("side", ["front", "back"]).default("front").notNull(),
  /** Zone-Typ: image = nur Bild-Upload, text = nur Text, both = beides */
  type: mysqlEnum("type", ["image", "text", "both"]).default("image").notNull(),
  /** Zweck der Zone */
  purpose: mysqlEnum("purpose", ["logo", "playerName", "playerNumber", "custom"]).default("logo").notNull(),
  /** Position X in % vom linken Rand */
  posX: float("posX").default(10).notNull(),
  /** Position Y in % vom oberen Rand */
  posY: float("posY").default(10).notNull(),
  /** Breite in % der Bildbreite */
  width: float("width").default(20).notNull(),
  /** Höhe in % der Bildhöhe */
  height: float("height").default(15).notNull(),
  /** Sortierreihenfolge */
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ProductZone = typeof productZones.$inferSelect;
export type InsertProductZone = typeof productZones.$inferInsert;
