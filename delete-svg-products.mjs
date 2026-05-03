import { getDb } from "./server/db.ts";
import { products, productParts, productZones } from "./drizzle/schema.ts";
import { eq, like } from "drizzle-orm";

async function main() {
  const db = await getDb();
  
  // Finde alle SVG-Produkte
  const svgProducts = await db.select().from(products).where(like(products.templateId, '%_svg%'));
  console.log(`=== ${svgProducts.length} SVG-Produkte gefunden ===`);
  
  for (const p of svgProducts) {
    console.log(`Lösche: ${p.id} - ${p.name} (template: ${p.templateId})`);
    
    // Erst Zonen löschen (die auf Parts referenzieren)
    const parts = await db.select().from(productParts).where(eq(productParts.productId, p.id));
    for (const part of parts) {
      await db.delete(productZones).where(eq(productZones.partId, part.id));
    }
    
    // Dann Parts löschen
    await db.delete(productParts).where(eq(productParts.productId, p.id));
    
    // Dann Produkt löschen
    await db.delete(products).where(eq(products.id, p.id));
    console.log(`  -> Gelöscht!`);
  }
  
  console.log("\n=== Verbleibende Produkte ===");
  const remaining = await db.select().from(products);
  for (const p of remaining) {
    console.log(`  ${p.id}: ${p.name} (${p.templateId})`);
  }
  
  process.exit(0);
}
main();
