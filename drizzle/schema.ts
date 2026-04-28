import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, float } from "drizzle-orm/mysql-core";

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
 * Jedes Produkt hat ein Bild für Vorder- und Rückseite.
 */
export const products = mysqlTable("products", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 100 }),
  frontImageUrl: text("frontImageUrl"),
  backImageUrl: text("backImageUrl"),
  published: boolean("published").default(false).notNull(),
  createdBy: int("createdBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;

/**
 * Product Zones – Platzierungszonen auf einem Produkt.
 * Position und Größe werden als Prozentwerte gespeichert (0-100),
 * damit sie unabhängig von der Bildgröße funktionieren.
 */
export const productZones = mysqlTable("product_zones", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId").notNull(),
  label: varchar("label", { length: 255 }).notNull(),
  side: mysqlEnum("side", ["front", "back"]).default("front").notNull(),
  /** Zone-Typ: image = nur Bild-Upload, text = nur Text, both = beides */
  type: mysqlEnum("type", ["image", "text", "both"]).default("image").notNull(),
  /** Zweck der Zone: logo = Bild-Upload, playerName = Spielername, playerNumber = Spielernummer, custom = freier Text */
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
