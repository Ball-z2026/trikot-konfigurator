import { eq, and, asc, desc, not, ne, inArray, gt, sql } from "drizzle-orm";
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
  orderComments,
  commentReadReceipts,
  InsertOrderComment,
  savedDesigns,
  sponsorTemplates,
  InsertSponsorTemplate,
  mockupGallery,
  InsertMockupGalleryItem,
  collections,
  InsertCollection,
  collectionItems,
  InsertCollectionItem,
  collectionAssignments,
  InsertCollectionAssignment,
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
      purpose: "logo" | "clubLogo" | "playerName" | "playerNumber" | "playerInitials" | "clubName" | "custom";
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

export async function bulkCreatePlayers(teamId: number, playersList: Array<{ name: string; number?: string; position?: string; size?: string }>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  if (playersList.length === 0) return [];
  const values = playersList.map((p) => ({
    teamId,
    name: p.name,
    number: p.number || null,
    position: p.position || null,
    size: p.size || null,
  }));
  await db.insert(players).values(values);
  return listPlayersByTeam(teamId);
}

/** Aktualisiere die Größen mehrerer Spieler auf einmal */
export async function bulkUpdatePlayerSizes(updates: Array<{ id: number; size: string | null }>) {
  const db = await getDb();
  if (!db) return;
  for (const u of updates) {
    await db.update(players).set({ size: u.size }).where(eq(players.id, u.id));
  }
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

// ─── Order Overview (Bestellübersicht) ──────────────────────────────────────
/**
 * Gibt eine Übersicht aller Mannschaften einer Abteilung mit Zahlungsstatus zurück.
 * Für den Spartenleiter: Mannschaft, Trainer, Zahlungsmodell, Status, Spieleranzahl.
 */
export async function getOrderOverviewByDepartment(departmentId: number) {
  const db = await getDb();
  if (!db) return [];
  // Get all teams in this department
  const teamsList = await db.select().from(teams).where(eq(teams.departmentId, departmentId));
  if (teamsList.length === 0) return [];
  // Get trainer info for all teams
  const trainerIds = [...new Set(teamsList.map(t => t.trainerId))];
  const trainerRows = trainerIds.length > 0
    ? await db.select({ id: users.id, name: users.name, email: users.email }).from(users).where(inArray(users.id, trainerIds))
    : [];
  const trainerMap = new Map(trainerRows.map(t => [t.id, t]));
  // Get team payment info for all teams
  const teamIds = teamsList.map(t => t.id);
  const paymentRows = teamIds.length > 0
    ? await db.select().from(teamPayments).where(inArray(teamPayments.teamId, teamIds))
    : [];
  const paymentMap = new Map(paymentRows.map(p => [p.teamId, p]));
  // Get player counts per team
  const playerRows = teamIds.length > 0
    ? await db.select().from(players).where(inArray(players.teamId, teamIds))
    : [];
  const playerCountMap = new Map<number, number>();
  for (const p of playerRows) {
    playerCountMap.set(p.teamId, (playerCountMap.get(p.teamId) || 0) + 1);
  }
  // Get player payments for self-pay teams
  const selfPayTeamIds = paymentRows.filter(p => p.paymentType === "self").map(p => p.teamId);
  const playerPaymentRows = selfPayTeamIds.length > 0
    ? await db.select().from(playerPayments).where(inArray(playerPayments.teamId, selfPayTeamIds))
    : [];
  const playerPaidMap = new Map<number, { paid: number; total: number }>();
  for (const teamId of selfPayTeamIds) {
    const teamPlayers = playerRows.filter(p => p.teamId === teamId);
    const paidPlayers = playerPaymentRows.filter(pp => pp.teamId === teamId && pp.paid);
    playerPaidMap.set(teamId, { paid: paidPlayers.length, total: teamPlayers.length });
  }
  // Get sponsor info for sponsor-pay teams
  const sponsorTeamIds = paymentRows.filter(p => p.paymentType === "sponsor").map(p => p.teamId);
  const sponsorRows = sponsorTeamIds.length > 0
    ? await db.select().from(sponsors).where(inArray(sponsors.teamId, sponsorTeamIds))
    : [];
  const sponsorMap = new Map(sponsorRows.map(s => [s.teamId, s]));
  return teamsList.map(team => {
    const trainer = trainerMap.get(team.trainerId);
    const payment = paymentMap.get(team.id);
    const playerCount = playerCountMap.get(team.id) || 0;
    const playerPaidInfo = playerPaidMap.get(team.id);
    const sponsor = sponsorMap.get(team.id);
    return {
      teamId: team.id,
      teamName: team.name,
      trainerName: trainer?.name || trainer?.email || "Unbekannt",
      trainerId: team.trainerId,
      playerCount,
      paymentType: payment?.paymentType || null,
      paymentStatus: payment?.status || null,
      confirmedAt: payment?.confirmedAt || null,
      // Bestellstatus
      orderStatus: team.orderStatus,
      // For self-pay: how many players have paid
      playersPaid: playerPaidInfo?.paid || null,
      playersTotal: playerPaidInfo?.total || null,
      // For sponsor-pay: sponsor company name
      sponsorName: sponsor?.companyName || null,
      createdAt: team.createdAt,
    };
  });
}

// ─── Order Status ─────────────────────────────────────────────────────────────
export async function updateOrderStatus(
  teamId: number,
  status: "offen" | "bestellt" | "in_produktion" | "geliefert"
) {
  const db = await getDb();
  if (!db) return null;
  await db.update(teams).set({ orderStatus: status }).where(eq(teams.id, teamId));
  return { teamId, orderStatus: status };
}

// ─── Order Comments ─────────────────────────────────────────────────────────
export async function createOrderComment(data: {
  teamId: number;
  userId: number;
  userName: string;
  userRole: "department_lead" | "trainer";
  message: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(orderComments).values({
    teamId: data.teamId,
    userId: data.userId,
    userName: data.userName,
    userRole: data.userRole,
    message: data.message,
  }).$returningId();
  return result.id;
}

export async function listOrderCommentsByTeam(teamId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db
    .select()
    .from(orderComments)
    .where(eq(orderComments.teamId, teamId))
    .orderBy(asc(orderComments.createdAt));
}

export async function countOrderCommentsByTeams(teamIds: number[]) {
  if (teamIds.length === 0) return {};
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const allComments = await db
    .select({ teamId: orderComments.teamId })
    .from(orderComments)
    .where(inArray(orderComments.teamId, teamIds));
  const counts: Record<number, number> = {};
  for (const c of allComments) {
    counts[c.teamId] = (counts[c.teamId] || 0) + 1;
  }
  return counts;
}

// ─── Comment Read Receipts ─────────────────────────────────────────────────────

/**
 * Markiert Kommentare als gelesen für einen User in einem Team.
 * Upsert: Wenn bereits ein Eintrag existiert, wird lastReadAt aktualisiert.
 */
export async function markCommentsAsRead(teamId: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  const existing = await db
    .select()
    .from(commentReadReceipts)
    .where(and(eq(commentReadReceipts.teamId, teamId), eq(commentReadReceipts.userId, userId)))
    .limit(1);
  if (existing.length > 0) {
    await db
      .update(commentReadReceipts)
      .set({ lastReadAt: new Date() })
      .where(and(eq(commentReadReceipts.teamId, teamId), eq(commentReadReceipts.userId, userId)));
  } else {
    await db.insert(commentReadReceipts).values({
      teamId,
      userId,
      lastReadAt: new Date(),
    });
  }
}

/**
 * Holt die Lesebestätigungen für ein Team.
 */
export async function getReadReceiptsByTeam(teamId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(commentReadReceipts)
    .where(eq(commentReadReceipts.teamId, teamId));
}

/**
 * Zählt ungelesene Kommentare pro Team für einen bestimmten User.
 * Ungelesen = Kommentare von ANDEREN Usern, die nach dem letzten Lesen erstellt wurden.
 */
export async function getUnreadCommentCounts(teamIds: number[], userId: number): Promise<Record<number, number>> {
  if (teamIds.length === 0) return {};
  const db = await getDb();
  if (!db) return {};
  const receipts = await db
    .select()
    .from(commentReadReceipts)
    .where(and(
      inArray(commentReadReceipts.teamId, teamIds),
      eq(commentReadReceipts.userId, userId)
    ));
  const receiptMap = new Map(receipts.map(r => [r.teamId, r.lastReadAt]));
  const result: Record<number, number> = {};
  for (const teamId of teamIds) {
    const lastRead = receiptMap.get(teamId);
    let unreadComments;
    if (lastRead) {
      unreadComments = await db
        .select()
        .from(orderComments)
        .where(and(
          eq(orderComments.teamId, teamId),
          not(eq(orderComments.userId, userId)),
          gt(orderComments.createdAt, lastRead)
        ));
    } else {
      unreadComments = await db
        .select()
        .from(orderComments)
        .where(and(
          eq(orderComments.teamId, teamId),
          not(eq(orderComments.userId, userId))
        ));
    }
    if (unreadComments.length > 0) {
      result[teamId] = unreadComments.length;
    }
  }
  return result;
}

/**
 * Holt die Lesebestätigung des Gegenübers für ein Team.
 * Gibt den Zeitpunkt zurück, wann der andere User zuletzt gelesen hat.
 */
export async function getOtherUserReadReceipt(teamId: number, currentUserId: number) {
  const db = await getDb();
  if (!db) return null;
  const receipts = await db
    .select()
    .from(commentReadReceipts)
    .where(and(
      eq(commentReadReceipts.teamId, teamId),
      not(eq(commentReadReceipts.userId, currentUserId))
    ));
  if (receipts.length === 0) return null;
  return receipts.sort((a, b) => new Date(b.lastReadAt).getTime() - new Date(a.lastReadAt).getTime())[0];
}

/**
 * Ensure at least one admin exists. If no admin exists, promote the oldest user to admin.
 * Called at server startup.
 */
export async function ensureAdminExists() {
  const db = await getDb();
  if (!db) return;
  const admins = await db.select({ id: users.id })
    .from(users)
    .where(eq(users.role, "admin"))
    .limit(1);
  if (admins.length === 0) {
    // Promote the oldest user to admin
    const oldest = await db.select({ id: users.id })
      .from(users)
      .orderBy(users.id)
      .limit(1);
    if (oldest.length > 0) {
      await db.update(users).set({ role: "admin" }).where(eq(users.id, oldest[0].id));
      console.log(`[Admin] Promoted user ${oldest[0].id} to admin (no admin existed)`);
    }
  }
}

// ─── Saved Designs ─────────────────────────────────────────────────────────────

export async function createSavedDesign(data: {
  name: string;
  teamId: number;
  productId: number;
  userId: number;
  zonesConfig: unknown;
  colorsConfig?: unknown;
  thumbnailUrl?: string;
  isOrgTemplate?: boolean;
  orgId?: number;
  category?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(savedDesigns).values(data);
  return Number(result[0].insertId);
}

export async function listSavedDesigns(teamId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db.select().from(savedDesigns)
    .where(and(eq(savedDesigns.teamId, teamId), eq(savedDesigns.userId, userId)))
    .orderBy(desc(savedDesigns.updatedAt));
}

export async function listSavedDesignsByTeam(teamId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db.select().from(savedDesigns)
    .where(eq(savedDesigns.teamId, teamId))
    .orderBy(desc(savedDesigns.updatedAt));
}

export async function getSavedDesign(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const rows = await db.select().from(savedDesigns).where(eq(savedDesigns.id, id));
  return rows[0] || null;
}

export async function updateSavedDesign(id: number, data: {
  name?: string;
  zonesConfig?: unknown;
  colorsConfig?: unknown;
  thumbnailUrl?: string;
  isOrgTemplate?: boolean;
  orgId?: number;
  category?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(savedDesigns).set(data).where(eq(savedDesigns.id, id));
}

export async function deleteSavedDesign(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(savedDesigns).where(eq(savedDesigns.id, id));
}

// ─── Org Design Templates ──────────────────────────────────────────────
export async function listOrgTemplates(orgId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db.select().from(savedDesigns)
    .where(and(eq(savedDesigns.orgId, orgId), eq(savedDesigns.isOrgTemplate, true)))
    .orderBy(desc(savedDesigns.updatedAt));
}

export async function duplicateSavedDesign(sourceId: number, targetTeamId: number, userId: number, newName?: string) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const source = await getSavedDesign(sourceId);
  if (!source) throw new Error("Quell-Design nicht gefunden");
  const result = await db.insert(savedDesigns).values({
    name: newName || source.name + " (Kopie)",
    teamId: targetTeamId,
    productId: source.productId,
    userId,
    zonesConfig: source.zonesConfig,
    colorsConfig: source.colorsConfig,
    thumbnailUrl: source.thumbnailUrl,
    category: source.category,
  });
  return Number(result[0].insertId);
}

// ─── Sponsor Template Helpers ──────────────────────────────────────────────
export async function createSponsorTemplate(data: InsertSponsorTemplate) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(sponsorTemplates).values(data);
  return result[0].insertId;
}

export async function listSponsorTemplates(orgId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(sponsorTemplates).where(eq(sponsorTemplates.orgId, orgId)).orderBy(asc(sponsorTemplates.sortOrder));
}

export async function getSponsorTemplate(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(sponsorTemplates).where(eq(sponsorTemplates.id, id)).limit(1);
  return result[0];
}

export async function updateSponsorTemplate(id: number, data: Partial<InsertSponsorTemplate>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(sponsorTemplates).set(data).where(eq(sponsorTemplates.id, id));
}

export async function deleteSponsorTemplate(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(sponsorTemplates).where(eq(sponsorTemplates.id, id));
}

/** Verpflichtende Sponsoren einer Organisation abrufen (alle_produkte oder nur_trikot) */
export async function getMandatorySponsors(orgId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(sponsorTemplates)
    .where(and(
      eq(sponsorTemplates.orgId, orgId),
      ne(sponsorTemplates.obligation, "nicht_verpflichtend")
    ))
    .orderBy(asc(sponsorTemplates.sortOrder));
}


// ─── Mockup Gallery Helpers ─────────────────────────────────────────────────
export async function createMockupGalleryItem(data: InsertMockupGalleryItem) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(mockupGallery).values(data);
  return { id: result[0].insertId };
}

export async function listMockupsByTeam(teamId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(mockupGallery).where(eq(mockupGallery.teamId, teamId)).orderBy(desc(mockupGallery.createdAt));
}

export async function getMockupByShareToken(shareToken: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(mockupGallery).where(eq(mockupGallery.shareToken, shareToken)).limit(1);
  return result[0];
}

export async function deleteMockupGalleryItem(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(mockupGallery).where(and(eq(mockupGallery.id, id), eq(mockupGallery.userId, userId)));
}

// ─── Collection Helpers ────────────────────────────────────────────────────

export async function createCollection(data: InsertCollection) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(collections).values(data);
  return Number(result[0].insertId);
}

export async function getCollection(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(collections).where(eq(collections.id, id)).limit(1);
  return result[0];
}

export async function updateCollection(id: number, data: Partial<InsertCollection>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(collections).set(data).where(eq(collections.id, id));
}

export async function deleteCollection(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Lösche zuerst Items und Assignments
  await db.delete(collectionItems).where(eq(collectionItems.collectionId, id));
  await db.delete(collectionAssignments).where(eq(collectionAssignments.collectionId, id));
  await db.delete(collections).where(eq(collections.id, id));
}

/**
 * Listet Kollektionen für einen Benutzer basierend auf seiner Rolle:
 * - Trainer: Eigene + Sparten-Kollektionen + zugewiesene + Org-Kollektionen
 * - Spartenleiter: Alle in seiner Sparte + Org-Kollektionen + alle anderen Sparten
 * - Owner: Alle Org-Kollektionen
 */
export async function listCollectionsForOrg(orgId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(collections)
    .where(eq(collections.orgId, orgId))
    .orderBy(desc(collections.updatedAt));
}

export async function listCollectionsForDepartment(departmentId: number, orgId: number) {
  const db = await getDb();
  if (!db) return [];
  // Alle Kollektionen die für diese Sparte relevant sind:
  // 1. Direkt in der Sparte erstellt (departmentId match)
  // 2. Der Sparte zugewiesen (via collectionAssignments)
  // 3. Org-weite Kollektionen
  const allOrgCollections = await db.select().from(collections)
    .where(eq(collections.orgId, orgId))
    .orderBy(desc(collections.updatedAt));
  
  const assignments = await db.select().from(collectionAssignments)
    .where(eq(collectionAssignments.departmentId, departmentId));
  const assignedIds = new Set(assignments.map(a => a.collectionId));

  return allOrgCollections.filter(c => 
    c.departmentId === departmentId || 
    c.scope === "org" || 
    assignedIds.has(c.id)
  );
}

// ─── Collection Items ──────────────────────────────────────────────────────

export async function addCollectionItem(data: InsertCollectionItem) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(collectionItems).values(data);
  return Number(result[0].insertId);
}

export async function listCollectionItems(collectionId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    item: collectionItems,
    design: savedDesigns,
  }).from(collectionItems)
    .innerJoin(savedDesigns, eq(collectionItems.savedDesignId, savedDesigns.id))
    .where(eq(collectionItems.collectionId, collectionId))
    .orderBy(asc(collectionItems.sortOrder));
}

export async function removeCollectionItem(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(collectionItems).where(eq(collectionItems.id, id));
}

// ─── Collection Assignments ────────────────────────────────────────────────

export async function assignCollectionToDepartment(data: InsertCollectionAssignment) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(collectionAssignments).values(data);
  return Number(result[0].insertId);
}

export async function unassignCollectionFromDepartment(collectionId: number, departmentId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(collectionAssignments).where(
    and(
      eq(collectionAssignments.collectionId, collectionId),
      eq(collectionAssignments.departmentId, departmentId)
    )
  );
}

export async function listAssignmentsForCollection(collectionId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(collectionAssignments)
    .where(eq(collectionAssignments.collectionId, collectionId));
}

export async function listAssignmentsForDepartment(departmentId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(collectionAssignments)
    .where(eq(collectionAssignments.departmentId, departmentId));
}
