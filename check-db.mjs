import { getDb } from './server/db.ts';

async function main() {
  const db = await getDb();
  const [products] = await db.execute('SELECT COUNT(*) as cnt FROM products');
  console.log('Products:', JSON.stringify(products));
  const [orgs] = await db.execute('SELECT COUNT(*) as cnt FROM organizations');
  console.log('Orgs:', JSON.stringify(orgs));
  const [users] = await db.execute('SELECT id, name, email, role FROM users');
  console.log('Users:', JSON.stringify(users));
  const [depts] = await db.execute('SELECT COUNT(*) as cnt FROM departments');
  console.log('Departments:', JSON.stringify(depts));
  const [teams] = await db.execute('SELECT COUNT(*) as cnt FROM teams');
  console.log('Teams:', JSON.stringify(teams));
  process.exit(0);
}
main();
