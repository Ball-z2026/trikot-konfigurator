import { db } from './server/db.ts';
import { productParts } from './drizzle/schema.ts';
import { eq } from 'drizzle-orm';

const parts = await db.select().from(productParts).where(eq(productParts.productId, 690040));
console.log(JSON.stringify(parts.map(p => ({id: p.id, key: p.partKey, img: p.imageUrl})), null, 2));
process.exit(0);
