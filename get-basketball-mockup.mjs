import { getDb } from "./server/db.ts";
import { products, productParts } from "./drizzle/schema.ts";
import { eq, like } from "drizzle-orm";

async function main() {
  const db = await getDb();
  
  // Finde Basketball DTF Produkt (das mit dem Mockup)
  const basketballProducts = await db.select().from(products).where(like(products.name, '%Basketball%'));
  console.log("=== Basketball-Produkte ===");
  for (const p of basketballProducts) {
    console.log(`ID: ${p.id}, Name: ${p.name}, Template: ${p.templateId}, MockupImage: ${p.mockupImage || 'KEINE'}`);
    const parts = await db.select().from(productParts).where(eq(productParts.productId, p.id));
    for (const part of parts) {
      console.log(`  Part ID: ${part.id}, Name: ${part.name}, Image: ${part.imageUrl || 'KEINE'}, MockupImage: ${part.mockupImageUrl || 'KEINE'}`);
    }
  }
  process.exit(0);
}
main();
