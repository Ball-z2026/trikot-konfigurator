import "dotenv/config";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { orgLogos } from "./drizzle/schema.ts";

async function main() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  const db = drizzle(connection);
  const logos = await db.select().from(orgLogos);
  console.log(JSON.stringify(logos, null, 2));
  await connection.end();
}
main().catch(console.error);
