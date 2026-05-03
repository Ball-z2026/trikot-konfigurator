import { getDb } from "./server/db.ts";
import { products, productParts } from "./drizzle/schema.ts";
import { eq, like } from "drizzle-orm";

async function main() {
  const db = await getDb();
  const basketballProducts = await db.select().from(products).where(like(products.name, '%Basketball%'));
  console.log("=== Basketball-Produkte ===");
  for (const p of basketballProducts) {
    console.log(`ID: ${p.id}, Name: ${p.name}, Template: ${p.templateId}`);
    const parts = await db.select().from(productParts).where(eq(productParts.productId, p.id));
    for (const part of parts) {
      console.log(`  Part: ${part.name}, Bild: ${part.imageUrl || 'kein Bild'}`);
    }
  }
  if (basketballProducts.length === 0) {
    console.log("Keine Basketball-Produkte. Alle Produkte:");
    const all = await db.select().from(products);
    for (const p of all) console.log(`  ${p.id}: ${p.name} (template: ${p.templateId})`);
  }
  process.exit(0);
}
main();
