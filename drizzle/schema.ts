import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, float, json, double } from "drizzle-orm/mysql-core";

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
  /** Bundesland (z.B. "nw" für NRW, "by" für Bayern) */
  state: varchar("state", { length: 5 }),
  /** Hauptsportart der Organisation */
  sport: varchar("sport", { length: 50 }),
  /** Adresse */
  street: varchar("street", { length: 255 }),
  zip: varchar("zip", { length: 10 }),
  city: varchar("city", { length: 255 }),
  country: varchar("country", { length: 100 }).default("Deutschland"),
  /** Offizielle Vereinsbezeichnung (z.B. "Turn- und Sportverein Musterstadt 1920 e.V.") */
  officialName: varchar("officialName", { length: 500 }),
  /** Ansprechpartner */
  contactFirstName: varchar("contactFirstName", { length: 100 }),
  contactLastName: varchar("contactLastName", { length: 100 }),
  contactRole: varchar("contactRole", { length: 100 }),
  /** Kontaktdaten */
  phone: varchar("phone", { length: 50 }),
  email: varchar("email", { length: 255 }),
  website: varchar("website", { length: 500 }),
  fax: varchar("fax", { length: 50 }),
  /** Rechtliches */
  registerNumber: varchar("registerNumber", { length: 100 }),
  taxId: varchar("taxId", { length: 50 }),
  foundedYear: int("foundedYear"),
  /** Hashtag des Vereins (z.B. #TSVMusterstadt) */
  hashtag: varchar("hashtag", { length: 100 }),
  /** Koordinaten (automatisch aus Adresse generiert) */
  latitude: double("latitude"),
  longitude: double("longitude"),
  /** Vereinsfarben (HEX) */
  primaryColor: varchar("primaryColor", { length: 7 }),
  secondaryColor: varchar("secondaryColor", { length: 7 }),
  /** Vereinsfarben (CMYK: C,M,Y,K jeweils 0-100, als JSON-String gespeichert) */
  primaryColorCmyk: varchar("primaryColorCmyk", { length: 50 }),
  secondaryColorCmyk: varchar("secondaryColorCmyk", { length: 50 }),
  /** Vereinsname auf dem Trikot (kann vom offiziellen Namen abweichen) */
  jerseyName: varchar("jerseyName", { length: 255 }),
  /** Onboarding abgeschlossen (alle Pflichtfelder ausgefüllt + Logo hochgeladen) */
  onboardingComplete: boolean("onboardingComplete").default(false).notNull(),
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
  /** Freie Zonen-Logik: Trainer definiert Zonen selbst (Position, Größe, Löschen) */
  freeZoneMode: boolean("freeZoneMode").default(false).notNull(),
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
 * - clubLogo: Vereinswappen – wird automatisch vom Owner-Logo gesetzt, nur Owner kann es ändern
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
  purpose: mysqlEnum("purpose", ["logo", "clubLogo", "playerName", "playerNumber", "playerInitials", "clubName", "abbreviation", "coordinates", "hashtag", "custom"]).default("logo").notNull(),
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
  /** Spielklasse (z.B. "landesliga", "bezirksliga") */
  league: varchar("league", { length: 100 }),
  /** Kategorie: Herren, Damen, Jugend etc. */
  category: varchar("category", { length: 50 }),
  /** Trainer/Betreuer der diese Mannschaft verwaltet */
  trainerId: int("trainerId").notNull(),
  /**
   * Bestellstatus der Mannschaft:
   * - offen: Noch keine Bestellung aufgegeben
   * - bestellt: Bestellung wurde aufgegeben
   * - in_produktion: Trikots sind in Produktion
   * - geliefert: Trikots wurden geliefert
   */
  orderStatus: mysqlEnum("orderStatus", ["offen", "bestellt", "in_produktion", "geliefert"]).default("offen").notNull(),
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
  /** Konfektionsgröße (S, M, L, XL, XXL, 3XL) – optional */
  size: varchar("size", { length: 10 }),
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

/**
 * Saved Designs – Gespeicherte Trikot-Designs.
 * Trainer können ihre konfigurierten Designs mit einem Namen speichern
 * und später wieder laden/bearbeiten.
 */
export const savedDesigns = mysqlTable("saved_designs", {
  id: int("id").autoincrement().primaryKey(),
  /** Name des Designs (vom Trainer vergeben) */
  name: varchar("name", { length: 255 }).notNull(),
  /** Welches Team */
  teamId: int("teamId").notNull(),
  /** Welches Produkt-Template */
  productId: int("productId").notNull(),
  /** Wer hat es erstellt */
  userId: int("userId").notNull(),
  /** Komplette Zonen-Konfiguration als JSON */
  zonesConfig: json("zonesConfig").notNull(),
  /** Ausgewählte Farben als JSON */
  colorsConfig: json("colorsConfig"),
  /** Thumbnail-Vorschau-URL (Canvas-Screenshot beim Speichern) */
  thumbnailUrl: text("thumbnailUrl"),
  /** Organisationsweite Vorlage? Nur Owner kann setzen */
  isOrgTemplate: boolean("isOrgTemplate").default(false).notNull(),
  /** Organisation (für organisationsweite Vorlagen) */
  orgId: int("orgId"),
  /** Kategorie: Heimtrikot, Auswärtstrikot, Training, Sonstiges */
  category: mysqlEnum("category", ["heimtrikot", "auswaertstrikot", "training", "sonstiges"]).default("sonstiges"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SavedDesign = typeof savedDesigns.$inferSelect;
export type InsertSavedDesign = typeof savedDesigns.$inferInsert;

/**
 * Sponsor Templates – Sponsor-Vorlagen pro Organisation.
 * Der Owner kann häufig verwendete Sponsoren-Logos als Vorlagen hinterlegen,
 * die Trainer dann per Klick in Sponsor-Zonen einfügen können.
 */
export const sponsorTemplates = mysqlTable("sponsor_templates", {
  id: int("id").autoincrement().primaryKey(),
  orgId: int("orgId").notNull(),
  /** Name des Sponsors (z.B. "Stadtwerke Musterstadt", "Autohaus Müller") */
  name: varchar("name", { length: 255 }).notNull(),
  /** URL zum gespeicherten Sponsor-Logo */
  logoUrl: text("logoUrl").notNull(),
  /** Storage-Key für S3 */
  storageKey: text("storageKey"),
  /** MIME-Type des Logos (z.B. image/png, application/pdf) */
  logoMimeType: varchar("logoMimeType", { length: 100 }),
  /** Thumbnail-URL für PDF-Logos (PNG-Vorschau) */
  logoThumbnailUrl: text("logoThumbnailUrl"),
  /** Optionaler Kategorie-Tag (z.B. "Hauptsponsor", "Co-Sponsor", "Ausrüster") */
  category: varchar("category", { length: 100 }),
  /**
   * Sponsor-Typ:
   * - hauptsponsor: Gilt für den gesamten Verein
   * - spartensponsor: Gilt für eine bestimmte Sparte
   * - mannschaftssponsor: Gilt für eine bestimmte Mannschaft
   */
  sponsorType: mysqlEnum("sponsorType", ["hauptsponsor", "spartensponsor", "mannschaftssponsor"]).default("hauptsponsor").notNull(),
  /**
   * Verpflichtung (nur bei hauptsponsor und spartensponsor relevant):
   * - alle_produkte: Muss auf jedem Produkt erscheinen
   * - nur_trikot: Muss nur auf Trikots erscheinen
   * - nicht_verpflichtend: Optional
   */
  obligation: mysqlEnum("obligation", ["alle_produkte", "nur_trikot", "nicht_verpflichtend"]).default("nicht_verpflichtend").notNull(),
  /** Abteilung (nur bei spartensponsor) */
  departmentId: int("departmentId"),
  /** Mannschaft (nur bei mannschaftssponsor) */
  teamId: int("teamId"),
  // ─── Kontaktdaten ───
  /** Kontaktperson: Vorname */
  contactFirstName: varchar("contactFirstName", { length: 100 }),
  /** Kontaktperson: Nachname */
  contactLastName: varchar("contactLastName", { length: 100 }),
  /** E-Mail der Kontaktperson */
  contactEmail: varchar("contactEmail", { length: 255 }),
  /** Telefon der Kontaktperson */
  contactPhone: varchar("contactPhone", { length: 50 }),
  // ─── Firmenadresse ───
  /** Straße und Hausnummer */
  street: varchar("street", { length: 255 }),
  /** Postleitzahl */
  zip: varchar("zip", { length: 10 }),
  /** Ort */
  city: varchar("city", { length: 100 }),
  /** Land (Standard: Deutschland) */
  country: varchar("country", { length: 100 }).default("Deutschland"),
  // ─── Rechnungsdaten ───
  /** USt-IdNr. */
  vatId: varchar("vatId", { length: 50 }),
  /** Rechnungsadresse abweichend? */
  billingDifferent: boolean("billingDifferent").default(false),
  /** Rechnungsadresse: Straße */
  billingStreet: varchar("billingStreet", { length: 255 }),
  /** Rechnungsadresse: PLZ */
  billingZip: varchar("billingZip", { length: 10 }),
  /** Rechnungsadresse: Ort */
  billingCity: varchar("billingCity", { length: 100 }),
  /** Rechnungsadresse: Land */
  billingCountry: varchar("billingCountry", { length: 100 }),
  // ─── Sponsoring ───
  /** Sponsoring-Summe (in Cent, nur für Owner sichtbar) */
  sponsoringAmount: int("sponsoringAmount"),
  /** Währung */
  sponsoringCurrency: varchar("sponsoringCurrency", { length: 3 }).default("EUR"),
  /** Vertragslaufzeit: Start */
  contractStart: timestamp("contractStart"),
  /** Vertragslaufzeit: Ende */
  contractEnd: timestamp("contractEnd"),
  // ─── Meta ───
  /** Sortierreihenfolge */
  sortOrder: int("sortOrder").default(0).notNull(),
  /** Erstellt von (userId) */
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SponsorTemplate = typeof sponsorTemplates.$inferSelect;
export type InsertSponsorTemplate = typeof sponsorTemplates.$inferInsert;

/**
 * Sponsor-Einladungen – Token-basierte Einladungen an Sponsoren,
 * damit diese ihre Daten selbst ausfüllen können.
 */
export const sponsorInvitations = mysqlTable("sponsor_invitations", {
  id: int("id").autoincrement().primaryKey(),
  /** Zugehörige Organisation */
  orgId: int("orgId").notNull(),
  /** Zugehöriger Sponsor (wird nach Erstellung verknüpft) */
  sponsorTemplateId: int("sponsorTemplateId"),
  /** Einladungs-Token (eindeutig, für URL) */
  token: varchar("token", { length: 64 }).notNull().unique(),
  /** E-Mail des eingeladenen Sponsors */
  sponsorEmail: varchar("sponsorEmail", { length: 255 }).notNull(),
  /** Name des Sponsors (zur Anzeige) */
  sponsorName: varchar("sponsorName", { length: 255 }),
  /** Status: pending, completed, expired */
  status: mysqlEnum("status", ["pending", "completed", "expired"]).default("pending").notNull(),
  /** Eingeladen von (userId) */
  invitedBy: int("invitedBy").notNull(),
  /** Ablaufdatum */
  expiresAt: timestamp("expiresAt").notNull(),
  /** Ausgefüllt am */
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SponsorInvitation = typeof sponsorInvitations.$inferSelect;
export type InsertSponsorInvitation = typeof sponsorInvitations.$inferInsert;

/**
 * Mockup Gallery – Gespeicherte KI-generierte Mockups pro Team.
 * Trainer können generierte Mockups speichern, vergleichen und per Link teilen.
 */
export const mockupGallery = mysqlTable("mockup_gallery", {
  id: int("id").autoincrement().primaryKey(),
  /** Welches Team */
  teamId: int("teamId").notNull(),
  /** Welches Produkt-Template */
  productId: int("productId").notNull(),
  /** Wer hat es erstellt */
  userId: int("userId").notNull(),
  /** URL zum generierten Mockup-Bild (Storage) */
  imageUrl: text("imageUrl").notNull(),
  /** Seite: front oder back */
  side: mysqlEnum("side", ["front", "back"]).default("front").notNull(),
  /** Optionaler Name/Titel */
  title: varchar("title", { length: 255 }),
  /** Öffentlicher Share-Token für Link-Sharing */
  shareToken: varchar("shareToken", { length: 64 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type MockupGalleryItem = typeof mockupGallery.$inferSelect;
export type InsertMockupGalleryItem = typeof mockupGallery.$inferInsert;

/**
 * Collections – Kollektionen von Designs.
 * 
 * Hierarchie:
 * - Trainer erstellt Kollektion (scope: team) → sichtbar in seiner Sparte
 * - Spartenleiter erstellt Kollektion (scope: department) → sichtbar in seiner Sparte
 * - Owner erstellt Vereinskollektion (scope: org) → sichtbar für alle
 * 
 * Enforcement (nur für scope: org):
 * - optional: Kollektion steht zur Auswahl
 * - mandatory: Kollektion ist Pflicht für alle Mannschaften
 */
export const collections = mysqlTable("collections", {
  id: int("id").autoincrement().primaryKey(),
  /** Name der Kollektion (z.B. "Saison 2025/26 Heimtrikot-Set") */
  name: varchar("name", { length: 255 }).notNull(),
  /** Optionale Beschreibung */
  description: text("description"),
  /** Organisation */
  orgId: int("orgId").notNull(),
  /** Abteilung (null = organisationsweit) */
  departmentId: int("departmentId"),
  /** Ersteller */
  createdByUserId: int("createdByUserId").notNull(),
  /** Sichtbarkeitsbereich: team = nur Sparte, department = Sparte, org = gesamter Verein */
  scope: mysqlEnum("scope", ["team", "department", "org"]).default("team").notNull(),
  /** Verbindlichkeit (nur bei scope=org relevant): optional oder Pflicht */
  enforcement: mysqlEnum("enforcement", ["optional", "mandatory"]).default("optional").notNull(),
  /** Thumbnail-Vorschau-URL */
  thumbnailUrl: text("thumbnailUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Collection = typeof collections.$inferSelect;
export type InsertCollection = typeof collections.$inferInsert;

/**
 * Collection Items – Einzelne Designs innerhalb einer Kollektion.
 * Verknüpft ein gespeichertes Design (savedDesign) mit einer Kollektion.
 */
export const collectionItems = mysqlTable("collection_items", {
  id: int("id").autoincrement().primaryKey(),
  collectionId: int("collectionId").notNull(),
  /** Referenz auf das gespeicherte Design */
  savedDesignId: int("savedDesignId").notNull(),
  /** Sortierreihenfolge innerhalb der Kollektion */
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CollectionItem = typeof collectionItems.$inferSelect;
export type InsertCollectionItem = typeof collectionItems.$inferInsert;

/**
 * Collection Assignments – Spartenleiter weist eine Kollektion seiner Sparte zu.
 * Damit wird die Kollektion für alle Trainer in der Sparte sichtbar/empfohlen.
 */
export const collectionAssignments = mysqlTable("collection_assignments", {
  id: int("id").autoincrement().primaryKey(),
  collectionId: int("collectionId").notNull(),
  /** Ziel-Abteilung der Zuweisung */
  departmentId: int("departmentId").notNull(),
  /** Wer hat zugewiesen */
  assignedByUserId: int("assignedByUserId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CollectionAssignment = typeof collectionAssignments.$inferSelect;
export type InsertCollectionAssignment = typeof collectionAssignments.$inferInsert;

/**
 * Sponsor-Produkt-Zuweisungen – Welche Produkte einem Sponsor zur Freigabe zugewiesen sind.
 * Der Owner weist Sponsoren bestimmte Produkte zu, deren Mockups dann vom Sponsor
 * freigegeben werden müssen bevor sie verwendet werden dürfen.
 */
export const sponsorProductAssignments = mysqlTable("sponsor_product_assignments", {
  id: int("id").autoincrement().primaryKey(),
  /** Referenz auf den Sponsor */
  sponsorId: int("sponsorId").notNull(),
  /** Referenz auf das Produkt */
  productId: int("productId").notNull(),
  /** Wer hat die Zuweisung erstellt */
  assignedByUserId: int("assignedByUserId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SponsorProductAssignment = typeof sponsorProductAssignments.$inferSelect;
export type InsertSponsorProductAssignment = typeof sponsorProductAssignments.$inferInsert;

/**
 * Mockup-Freigaben – Tracking ob ein generiertes Mockup vom jeweiligen Sponsor freigegeben wurde.
 * 
 * Workflow:
 * 1. Trainer generiert Mockup und reicht es zur Freigabe ein → Status: pending
 * 2. Sponsor erhält Link per E-Mail mit Review-Token
 * 3. Sponsor sieht Mockup und gibt frei (approved) oder lehnt ab (rejected) mit Kommentar
 * 4. Bei Ablehnung kann Trainer überarbeiten und erneut einreichen → neuer Eintrag mit revision+1
 */
export const mockupApprovals = mysqlTable("mockup_approvals", {
  id: int("id").autoincrement().primaryKey(),
  /** Referenz auf das Mockup in der Galerie */
  mockupId: int("mockupId").notNull(),
  /** Referenz auf den Sponsor der freigeben muss */
  sponsorId: int("sponsorId").notNull(),
  /** Aktueller Status */
  status: mysqlEnum("status", ["pending", "approved", "rejected"]).default("pending").notNull(),
  /** Einzigartiger Token für den Sponsor-Review-Link */
  reviewToken: varchar("reviewToken", { length: 128 }).notNull(),
  /** Name/E-Mail des Reviewers (wird beim Review gesetzt) */
  reviewedBy: varchar("reviewedBy", { length: 255 }),
  /** Kommentar des Sponsors bei Freigabe/Ablehnung */
  reviewNote: text("reviewNote"),
  /** Zeitpunkt der Freigabe/Ablehnung */
  reviewedAt: timestamp("reviewedAt"),
  /** Revisionsnummer (bei erneuter Einreichung nach Ablehnung) */
  revision: int("revision").default(1).notNull(),
  /** Wer hat die Freigabe angefragt (userId) */
  submittedByUserId: int("submittedByUserId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MockupApproval = typeof mockupApprovals.$inferSelect;
export type InsertMockupApproval = typeof mockupApprovals.$inferInsert;
