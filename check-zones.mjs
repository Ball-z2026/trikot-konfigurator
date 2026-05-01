import { getDb } from './server/db.ts';
import { productZones, productParts } from './drizzle/schema.ts';
import { inArray } from 'drizzle-orm';

async function main() {
  const db = await getDb();
  const parts = await db.select().from(productParts).where(inArray(productParts.productId, [540001, 540002, 540003]));
  console.log('=== PARTS ===');
  parts.forEach(p => console.log(JSON.stringify({id: p.id, productId: p.productId, name: p.name})));

  const partIds = parts.map(p => p.id);
  if (partIds.length > 0) {
    const zones = await db.select().from(productZones).where(inArray(productZones.partId, partIds));
    console.log('=== ZONES ===');
    zones.forEach(z => console.log(JSON.stringify({id: z.id, partId: z.partId, label: z.label, purpose: z.purpose, posX: z.posX, posY: z.posY, widthCm: z.widthCm, heightCm: z.heightCm})));
  }
  process.exit(0);
}
main();
