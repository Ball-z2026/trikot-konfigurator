import { eq, and, asc, not } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  users,
  products,
  productParts,
  productZones,
  InsertProduct,
  InsertProductPart,
  InsertProductZone,
  organizations,
  departments,
  memberships,
  orgLogos,
  departmentFonts,
  InsertOrganization,
  InsertDepartment,
  InsertMembership,
  InsertOrgLogo,
  InsertDepartmentFont,
  teams,
  players,
  InsertTeam,
  InsertPlayer,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── User Helpers ───────────────────────────────────────────────────────────

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db
      .insert(users)
      .values(values)
      .onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }
  const result = await db
    .select()
    .from(users)
    .where(eq(users.openId, openId))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ─── Product Helpers ────────────────────────────────────────────────────────

export async function listProducts(publishedOnly = false) {
  const db = await getDb();
  if (!db) return [];
  if (publishedOnly) {
    return db
      .select()
      .from(products)
      .where(eq(products.published, true))
      .orderBy(asc(products.name));
  }
  return db.select().from(products).orderBy(asc(products.name));
}

export async function getProductById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(products)
    .where(eq(products.id, id))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createProduct(data: InsertProduct) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(products).values(data);
  return result[0].insertId;
}

export async function updateProduct(
  id: number,
  data: Partial<InsertProduct>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(products).set(data).where(eq(products.id, id));
}

export async function deleteProduct(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(productZones).where(eq(productZones.productId, id));
  await db.delete(productParts).where(eq(productParts.productId, id));
  await db.delete(products).where(eq(products.id, id));
}

// ─── Product Parts Helpers ──────────────────────────────────────────────────

export async function listPartsByProduct(productId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(productParts)
    .where(eq(productParts.productId, productId))
    .orderBy(asc(productParts.sortOrder));
}

export async function createPart(data: InsertProductPart) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(productParts).values(data);
  return result[0].insertId;
}

export async function updatePart(id: number, data: Partial<InsertProductPart>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(productParts).set(data).where(eq(productParts.id, id));
}

export async function deletePart(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(productZones).where(eq(productZones.partId, id));
  await db.delete(productParts).where(eq(productParts.id, id));
}

/**
 * Create a product from a template: creates the product, all parts, and all predefined zones.
 * Now supports all extended zone fields (rotation, cm, font, clubName).
 */
export async function createProductFromTemplate(
  productData: InsertProduct,
  parts: Array<{
    key: string;
    label: string;
    imageUrl: string;
    sortOrder: number;
    zones: Array<{
      label: string;
      type: "image" | "text" | "both";
      purpose: "logo" | "playerName" | "playerNumber" | "clubName" | "custom";
      posX: number;
      posY: number;
      width: number;
      height: number;
      widthCm?: number;
      heightCm?: number;
      rotation?: number;
      fontFamily?: string;
      fontSize?: number;
      fontColor?: string;
      fontWeight?: string;
      textAlign?: string;
      sortOrder: number;
    }>;
  }>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // 1. Create the product
  const productResult = await db.insert(products).values(productData);
  const productId = productResult[0].insertId;

  // 2. Create parts and their zones
  for (const part of parts) {
    const partResult = await db.insert(productParts).values({
      productId,
      key: part.key,
      label: part.label,
      imageUrl: part.imageUrl,
      sortOrder: part.sortOrder,
    });
    const partId = partResult[0].insertId;

    // 3. Create zones for this part with all extended fields
    for (const zone of part.zones) {
      await db.insert(productZones).values({
        productId,
        partId,
        label: zone.label,
        side: "front",
        type: zone.type,
        purpose: zone.purpose,
        posX: zone.posX,
        posY: zone.posY,
        width: zone.width,
        height: zone.height,
        widthCm: zone.widthCm ?? null,
        heightCm: zone.heightCm ?? null,
        rotation: zone.rotation ?? 0,
        fontFamily: zone.fontFamily ?? null,
        fontSize: zone.fontSize ?? null,
        fontColor: zone.fontColor ?? null,
        fontWeight: zone.fontWeight ?? null,
        textAlign: zone.textAlign ?? null,
        sortOrder: zone.sortOrder,
      });
    }
  }

  return productId;
}

// ─── Zone Helpers ───────────────────────────────────────────────────────────

export async function listZonesByProduct(productId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(productZones)
    .where(eq(productZones.productId, productId))
    .orderBy(asc(productZones.sortOrder));
}

export async function listZonesByPart(partId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(productZones)
    .where(eq(productZones.partId, partId))
    .orderBy(asc(productZones.sortOrder));
}

export async function createZone(data: InsertProductZone) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(productZones).values(data);
  return result[0].insertId;
}

export async function updateZone(
  id: number,
  data: Partial<InsertProductZone>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(productZones).set(data).where(eq(productZones.id, id));
}

export async function deleteZone(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(productZones).where(eq(productZones.id, id));
}

export async function bulkUpdateZones(
  zones: { id: number; posX: number; posY: number; width: number; height: number; rotation?: number }[]
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  for (const z of zones) {
    const updateData: Record<string, number> = {
      posX: z.posX,
      posY: z.posY,
      width: z.width,
      height: z.height,
    };
    if (z.rotation !== undefined) {
      updateData.rotation = z.rotation;
    }
    await db
      .update(productZones)
      .set(updateData)
      .where(eq(productZones.id, z.id));
  }
}

// ─── Organization Helpers ──────────────────────────────────────────────────

export async function createOrganization(data: InsertOrganization) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(organizations).values(data);
  return result[0].insertId;
}

export async function getOrganizationById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(organizations).where(eq(organizations.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateOrganization(id: number, data: Partial<InsertOrganization>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(organizations).set(data).where(eq(organizations.id, id));
}

export async function listOrganizationsByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const userMemberships = await db
    .select()
    .from(memberships)
    .where(eq(memberships.userId, userId));
  if (userMemberships.length === 0) return [];
  const orgIds = [...new Set(userMemberships.map((m) => m.orgId))];
  const orgs = [];
  for (const orgId of orgIds) {
    const org = await getOrganizationById(orgId);
    if (org) {
      const membership = userMemberships.find((m) => m.orgId === orgId);
      orgs.push({ ...org, userRole: membership?.role });
    }
  }
  return orgs;
}

// ─── Department Helpers ────────────────────────────────────────────────────

export async function createDepartment(data: InsertDepartment) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(departments).values(data);
  return result[0].insertId;
}

export async function getDepartmentById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(departments).where(eq(departments.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function listDepartmentsByOrg(orgId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(departments).where(eq(departments.orgId, orgId)).orderBy(asc(departments.name));
}

export async function updateDepartment(id: number, data: Partial<InsertDepartment>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(departments).set(data).where(eq(departments.id, id));
}

export async function deleteDepartment(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(departmentFonts).where(eq(departmentFonts.departmentId, id));
  await db.delete(memberships).where(eq(memberships.departmentId, id));
  await db.delete(departments).where(eq(departments.id, id));
}

// ─── Membership Helpers ────────────────────────────────────────────────────

export async function createMembership(data: InsertMembership) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(memberships).values(data);
  return result[0].insertId;
}

export async function getMembershipByUserAndOrg(userId: number, orgId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(memberships)
    .where(and(eq(memberships.userId, userId), eq(memberships.orgId, orgId)))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllMembershipsByUserAndOrg(userId: number, orgId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(memberships)
    .where(and(eq(memberships.userId, userId), eq(memberships.orgId, orgId)));
}

export async function listMembershipsByOrg(orgId: number) {
  const db = await getDb();
  if (!db) return [];
  const mems = await db.select().from(memberships).where(eq(memberships.orgId, orgId));
  // Enrich with user data
  const enriched = [];
  for (const mem of mems) {
    const user = await db.select().from(users).where(eq(users.id, mem.userId)).limit(1);
    enriched.push({
      ...mem,
      userName: user[0]?.name || "Unbekannt",
      userEmail: user[0]?.email || null,
    });
  }
  return enriched;
}

export async function listMembershipsByDepartment(departmentId: number) {
  const db = await getDb();
  if (!db) return [];
  const mems = await db.select().from(memberships).where(eq(memberships.departmentId, departmentId));
  const enriched = [];
  for (const mem of mems) {
    const user = await db.select().from(users).where(eq(users.id, mem.userId)).limit(1);
    enriched.push({
      ...mem,
      userName: user[0]?.name || "Unbekannt",
      userEmail: user[0]?.email || null,
    });
  }
  return enriched;
}

export async function updateMembership(id: number, data: Partial<InsertMembership>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(memberships).set(data).where(eq(memberships.id, id));
}

export async function deleteMembership(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(memberships).where(eq(memberships.id, id));
}

// ─── Organization Logo Helpers ─────────────────────────────────────────────

export async function createOrgLogo(data: InsertOrgLogo) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(orgLogos).values(data);
  return result[0].insertId;
}

export async function listOrgLogos(orgId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(orgLogos).where(eq(orgLogos.orgId, orgId)).orderBy(asc(orgLogos.sortOrder));
}

export async function getDefaultOrgLogo(orgId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(orgLogos)
    .where(and(eq(orgLogos.orgId, orgId), eq(orgLogos.isDefault, true)))
    .limit(1);
  if (result.length > 0) return result[0];
  // Fallback: erstes Logo
  const fallback = await db
    .select()
    .from(orgLogos)
    .where(eq(orgLogos.orgId, orgId))
    .orderBy(asc(orgLogos.sortOrder))
    .limit(1);
  return fallback.length > 0 ? fallback[0] : undefined;
}

export async function updateOrgLogo(id: number, data: Partial<InsertOrgLogo>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(orgLogos).set(data).where(eq(orgLogos.id, id));
}

export async function deleteOrgLogo(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(orgLogos).where(eq(orgLogos.id, id));
}

export async function setDefaultOrgLogo(orgId: number, logoId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Alle Logos der Org auf nicht-default setzen
  await db.update(orgLogos).set({ isDefault: false }).where(eq(orgLogos.orgId, orgId));
  // Gewähltes Logo auf default setzen
  await db.update(orgLogos).set({ isDefault: true }).where(eq(orgLogos.id, logoId));
}

// ─── Department Font Helpers ───────────────────────────────────────────────

export async function createDepartmentFont(data: InsertDepartmentFont) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(departmentFonts).values(data);
  return result[0].insertId;
}

export async function listDepartmentFonts(departmentId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(departmentFonts).where(eq(departmentFonts.departmentId, departmentId));
}

export async function getDefaultDepartmentFont(departmentId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(departmentFonts)
    .where(and(eq(departmentFonts.departmentId, departmentId), eq(departmentFonts.isDefault, true)))
    .limit(1);
  if (result.length > 0) return result[0];
  const fallback = await db
    .select()
    .from(departmentFonts)
    .where(eq(departmentFonts.departmentId, departmentId))
    .limit(1);
  return fallback.length > 0 ? fallback[0] : undefined;
}

export async function updateDepartmentFont(id: number, data: Partial<InsertDepartmentFont>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(departmentFonts).set(data).where(eq(departmentFonts.id, id));
}

export async function deleteDepartmentFont(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(departmentFonts).where(eq(departmentFonts.id, id));
}

export async function setDefaultDepartmentFont(departmentId: number, fontId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(departmentFonts).set({ isDefault: false }).where(eq(departmentFonts.departmentId, departmentId));
  await db.update(departmentFonts).set({ isDefault: true }).where(eq(departmentFonts.id, fontId));
}

// ─── User lookup by email ──────────────────────────────────────────────────

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function listAllUsers() {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: users.id,
    name: users.name,
    email: users.email,
    openId: users.openId,
    loginMethod: users.loginMethod,
    role: users.role,
    mustChangePassword: users.mustChangePassword,
    createdAt: users.createdAt,
    lastSignedIn: users.lastSignedIn,
  }).from(users);
}

/**
 * Alle Benutzer mit ihren Mitgliedschaften laden (für Admin-Benutzerverwaltung).
 */
export async function listAllUsersWithMemberships() {
  const db = await getDb();
  if (!db) return [];
  
  // Lade alle Benutzer
  const allUsers = await db.select({
    id: users.id,
    name: users.name,
    email: users.email,
    openId: users.openId,
    loginMethod: users.loginMethod,
    role: users.role,
    mustChangePassword: users.mustChangePassword,
    createdAt: users.createdAt,
    lastSignedIn: users.lastSignedIn,
  }).from(users).orderBy(users.createdAt);

  // Lade alle Mitgliedschaften mit Org/Dept-Namen
  const allMemberships = await db
    .select({
      id: memberships.id,
      userId: memberships.userId,
      orgId: memberships.orgId,
      departmentId: memberships.departmentId,
      role: memberships.role,
      orgName: organizations.name,
      departmentName: departments.name,
    })
    .from(memberships)
    .innerJoin(organizations, eq(memberships.orgId, organizations.id))
    .leftJoin(departments, eq(memberships.departmentId, departments.id));

  // Zusammenführen
  return allUsers.map(u => ({
    ...u,
    memberships: allMemberships.filter(m => m.userId === u.id),
  }));
}

/**
 * Benutzer löschen (inkl. Mitgliedschaften).
 */
export async function deleteUser(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  // Erst Mitgliedschaften löschen
  await db.delete(memberships).where(eq(memberships.userId, userId));
  // Dann Benutzer löschen
  await db.delete(users).where(eq(users.id, userId));
}

/**
 * Passwort eines Benutzers zurücksetzen (Admin-Funktion).
 */
export async function adminResetUserPassword(userId: number, passwordHash: string) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(users).set({
    passwordHash,
    mustChangePassword: true,
  }).where(eq(users.id, userId));
}

/**
 * Passwort für einen bestehenden OAuth-Benutzer setzen (damit er auch lokal einloggen kann).
 */
export async function setUserPassword(userId: number, passwordHash: string) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(users).set({
    passwordHash,
    loginMethod: "local",
    mustChangePassword: true,
  }).where(eq(users.id, userId));
}
/**
 * Benutzer-Name und/oder E-Mail aktualisieren (Admin-Funktion).
 * Prüft auf E-Mail-Duplikate.
 */
export async function updateUserInfo(userId: number, data: { name?: string; email?: string }) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");

  // Prüfe E-Mail-Duplikat falls E-Mail geändert wird
  if (data.email) {
    const existing = await db.select({ id: users.id })
      .from(users)
      .where(and(eq(users.email, data.email), not(eq(users.id, userId))))
      .limit(1);
    if (existing.length > 0) {
      throw new Error("Diese E-Mail-Adresse wird bereits von einem anderen Benutzer verwendet");
    }
  }

  const updateData: Record<string, unknown> = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.email !== undefined) updateData.email = data.email;

  if (Object.keys(updateData).length === 0) return;

  await db.update(users).set(updateData).where(eq(users.id, userId));
}

// ─── User Memberships (for auto-assignment in configurator) ────────────────────────────────

export async function listMembershipsByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db
    .select({
      id: memberships.id,
      orgId: memberships.orgId,
      departmentId: memberships.departmentId,
      userId: memberships.userId,
      role: memberships.role,
      orgName: organizations.name,
      departmentName: departments.name,
    })
    .from(memberships)
    .innerJoin(organizations, eq(memberships.orgId, organizations.id))
    .leftJoin(departments, eq(memberships.departmentId, departments.id))
    .where(eq(memberships.userId, userId));
  return rows;
}

// ─── Teams (Mannschaften) ──────────────────────────────────────────────────

export async function createTeam(data: Omit<InsertTeam, "id" | "createdAt" | "updatedAt">) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(teams).values(data);
  return Number(result[0].insertId);
}

export async function getTeamById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(teams).where(eq(teams.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function listTeamsByDepartment(departmentId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(teams).where(eq(teams.departmentId, departmentId));
}

export async function listTeamsByTrainer(trainerId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(teams).where(eq(teams.trainerId, trainerId));
}

export async function listTeamsByTrainerAndOrg(trainerId: number, orgId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(teams).where(and(eq(teams.trainerId, trainerId), eq(teams.orgId, orgId)));
}

export async function updateTeam(id: number, data: Partial<Omit<InsertTeam, "id" | "createdAt" | "updatedAt">>) {
  const db = await getDb();
  if (!db) return;
  await db.update(teams).set(data).where(eq(teams.id, id));
}

export async function deleteTeam(id: number) {
  const db = await getDb();
  if (!db) return;
  // Delete all players in the team first
  await db.delete(players).where(eq(players.teamId, id));
  await db.delete(teams).where(eq(teams.id, id));
}

// ─── Players (Spieler) ──────────────────────────────────────────────────────

export async function createPlayer(data: Omit<InsertPlayer, "id" | "createdAt" | "updatedAt">) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(players).values(data);
  return Number(result[0].insertId);
}

export async function getPlayerById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(players).where(eq(players.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function listPlayersByTeam(teamId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(players).where(eq(players.teamId, teamId));
}

export async function updatePlayer(id: number, data: Partial<Omit<InsertPlayer, "id" | "createdAt" | "updatedAt">>) {
  const db = await getDb();
  if (!db) return;
  await db.update(players).set(data).where(eq(players.id, id));
}

export async function deletePlayer(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(players).where(eq(players.id, id));
}

export async function bulkCreatePlayers(teamId: number, playersList: Array<{ name: string; number?: string; position?: string }>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  if (playersList.length === 0) return [];
  const values = playersList.map((p) => ({
    teamId,
    name: p.name,
    number: p.number || null,
    position: p.position || null,
  }));
  await db.insert(players).values(values);
  return listPlayersByTeam(teamId);
}

export async function deleteAllPlayersByTeam(teamId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(players).where(eq(players.teamId, teamId));
}

// ─── Payment Helpers ────────────────────────────────────────────────────────
import { teamPayments, sponsors, playerPayments, InsertTeamPayment, InsertSponsor, InsertPlayerPayment } from "../drizzle/schema";

export async function getTeamPayment(teamId: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(teamPayments).where(eq(teamPayments.teamId, teamId));
  return rows[0] || null;
}

export async function upsertTeamPayment(data: { teamId: number; paymentType: "club" | "sponsor" | "self"; status?: "pending" | "confirmed"; confirmationToken?: string }) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const existing = await getTeamPayment(data.teamId);
  if (existing) {
    await db.update(teamPayments).set({
      paymentType: data.paymentType,
      status: data.status || "pending",
      confirmationToken: data.confirmationToken || null,
      confirmedAt: null,
    }).where(eq(teamPayments.id, existing.id));
  } else {
    await db.insert(teamPayments).values({
      teamId: data.teamId,
      paymentType: data.paymentType,
      status: data.status || "pending",
      confirmationToken: data.confirmationToken || null,
    });
  }
  return getTeamPayment(data.teamId);
}

export async function confirmTeamPayment(token: string) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(teamPayments).where(eq(teamPayments.confirmationToken, token));
  if (rows.length === 0) return null;
  await db.update(teamPayments).set({ status: "confirmed", confirmedAt: new Date() }).where(eq(teamPayments.id, rows[0].id));
  return { ...rows[0], status: "confirmed" as const };
}

// ─── Sponsor Helpers ────────────────────────────────────────────────────────

export async function getSponsorByTeam(teamId: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(sponsors).where(eq(sponsors.teamId, teamId));
  return rows[0] || null;
}

export async function upsertSponsor(data: Omit<InsertSponsor, "id" | "createdAt" | "updatedAt">) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const existing = await getSponsorByTeam(data.teamId);
  if (existing) {
    await db.update(sponsors).set(data).where(eq(sponsors.id, existing.id));
  } else {
    await db.insert(sponsors).values(data);
  }
  return getSponsorByTeam(data.teamId);
}

export async function deleteSponsor(teamId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(sponsors).where(eq(sponsors.teamId, teamId));
}

// ─── Player Payment Helpers ─────────────────────────────────────────────────

export async function listPlayerPayments(teamId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(playerPayments).where(eq(playerPayments.teamId, teamId));
}

export async function setPlayerPaid(playerId: number, teamId: number, paid: boolean) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const existing = await db.select().from(playerPayments).where(and(eq(playerPayments.playerId, playerId), eq(playerPayments.teamId, teamId)));
  if (existing.length > 0) {
    await db.update(playerPayments).set({ paid, paidAt: paid ? new Date() : null }).where(eq(playerPayments.id, existing[0].id));
  } else {
    await db.insert(playerPayments).values({ playerId, teamId, paid, paidAt: paid ? new Date() : null });
  }
}

export async function deletePlayerPayments(teamId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(playerPayments).where(eq(playerPayments.teamId, teamId));
}
