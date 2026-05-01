import { getDb } from './server/db.ts';
import { productZones, productParts } from './drizzle/schema.ts';
import { eq } from 'drizzle-orm';

async function main() {
  const db = await getDb();
  const parts = await db.select().from(productParts).where(eq(productParts.productId, 180001));
  console.log('Parts:', JSON.stringify(parts.map(p => ({id: p.id, key: p.key, label: p.label})), null, 2));
  const zones = await db.select().from(productZones).where(eq(productZones.productId, 180001));
  console.log('Zones:', JSON.stringify(zones.map(z => ({id: z.id, label: z.label, purpose: z.purpose, type: z.type, partId: z.partId})), null, 2));
  process.exit(0);
}
main();
