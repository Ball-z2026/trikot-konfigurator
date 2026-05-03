import { getDb } from "./server/db.ts";
import { productParts } from "./drizzle/schema.ts";
import { eq } from "drizzle-orm";

async function main() {
  const db = await getDb();
  // Basketball SVG DTF (hat Bilder)
  const parts = await db.select().from(productParts).where(eq(productParts.productId, 1380014));
  console.log("=== Basketball SVG-DTF Parts ===");
  for (const p of parts) {
    console.log(JSON.stringify(p, null, 2));
  }
  process.exit(0);
}
main();
