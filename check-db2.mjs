import { getDb } from './server/db.ts';

async function main() {
  const db = await getDb();
  const [products] = await db.execute('SELECT id, name, templateId, published, freeZoneMode FROM products ORDER BY id');
  console.log('=== PRODUCTS ===');
  for (const p of products) {
    console.log(`  ID=${p.id} name="${p.name}" template=${p.templateId} published=${p.published} freeZone=${p.freeZoneMode}`);
  }
  console.log(`Total: ${products.length} products`);
  
  const [parts] = await db.execute('SELECT COUNT(*) as cnt FROM product_parts');
  console.log(`Parts: ${parts.cnt}`);
  
  const [zones] = await db.execute('SELECT COUNT(*) as cnt FROM product_zones');
  console.log(`Zones: ${zones.cnt}`);
  
  process.exit(0);
}
main();
