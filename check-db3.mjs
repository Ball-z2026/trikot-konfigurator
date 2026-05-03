import { getDb } from './server/db.ts';

async function main() {
  const db = await getDb();
  const [r1] = await db.execute('SELECT COUNT(*) as cnt FROM product_parts');
  console.log('Parts:', JSON.stringify(r1));
  const [r2] = await db.execute('SELECT COUNT(*) as cnt FROM product_zones');
  console.log('Zones:', JSON.stringify(r2));
  const [r3] = await db.execute('SELECT COUNT(*) as cnt FROM organizations');
  console.log('Orgs:', JSON.stringify(r3));
  const [r4] = await db.execute('SELECT COUNT(*) as cnt FROM departments');
  console.log('Depts:', JSON.stringify(r4));
  const [r5] = await db.execute('SELECT COUNT(*) as cnt FROM teams');
  console.log('Teams:', JSON.stringify(r5));
  const [r6] = await db.execute('SELECT COUNT(*) as cnt FROM saved_designs');
  console.log('Designs:', JSON.stringify(r6));
  process.exit(0);
}
main();
