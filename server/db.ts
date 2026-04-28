import { eq, and, asc } from "drizzle-orm";
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
  // Delete zones first, then parts, then product
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
  // Delete zones belonging to this part first
  await db.delete(productZones).where(eq(productZones.partId, id));
  await db.delete(productParts).where(eq(productParts.id, id));
}

/**
 * Create a product from a template: creates the product, all parts, and all predefined zones.
 * Returns the new product ID.
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
      purpose: "logo" | "playerName" | "playerNumber" | "custom";
      posX: number;
      posY: number;
      width: number;
      height: number;
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

    // 3. Create zones for this part
    for (const zone of part.zones) {
      await db.insert(productZones).values({
        productId,
        partId,
        label: zone.label,
        side: "front", // default, not used for part-based products
        type: zone.type,
        purpose: zone.purpose,
        posX: zone.posX,
        posY: zone.posY,
        width: zone.width,
        height: zone.height,
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
  zones: { id: number; posX: number; posY: number; width: number; height: number }[]
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  for (const z of zones) {
    await db
      .update(productZones)
      .set({ posX: z.posX, posY: z.posY, width: z.width, height: z.height })
      .where(eq(productZones.id, z.id));
  }
}
