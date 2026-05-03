import { db } from './server/db.ts';
import { departments, teams, players } from './drizzle/schema.ts';

const depts = await db.select().from(departments);
console.log('Alle Abteilungen:', JSON.stringify(depts.map(d => ({id: d.id, name: d.name, orgId: d.orgId})), null, 2));

const allTeams = await db.select().from(teams);
console.log('\nAlle Mannschaften:', JSON.stringify(allTeams.map(t => ({id: t.id, name: t.name, deptId: t.departmentId})), null, 2));

const allPlayers = await db.select().from(players);
console.log('\nAnzahl Spieler:', allPlayers.length);

process.exit(0);
