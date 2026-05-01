import { getDb } from './server/db.ts';
import { productZones } from './drizzle/schema.ts';

async function main() {
  const db = await getDb();
  
  // Regeln:
  // 1. Kürzel-Zone (playerInitials): Vorderseite, unten links, 8x8 cm - auf ALLEN Nicht-Trikot-Artikeln
  // 2. Vereinsname (clubName): Immer Rückseite
  // 3. Vereinswappen (clubLogo): Immer Herzseite (links oben Brust = Vorderseite)
  
  // Aktuelle Situation:
  // Hoodie (540001): Vorderseite=480001, Rückseite=480002
  //   - 480001: clubLogo (5,15), Brust Sponsor custom (30,15) ✓
  //   - 480002: playerName (20,15), playerNumber (30,35) ✓
  //   FEHLT: Kürzel (Vorderseite), Vereinsname (Rückseite)
  
  // Jacke (540002): Vorderseite=480003, Rückseite=480004, Ärmel=480005/480006
  //   - 480003: clubLogo (5,15), clubName (35,20) ← clubName auf Vorderseite, soll auf Rückseite!
  //   - 480004: playerName (20,15), playerNumber (30,35) ✓
  //   FEHLT: Kürzel (Vorderseite), Vereinsname auf Rückseite statt Vorderseite
  
  // T-Shirt (540003): Vorderseite=480007, Rückseite=480008
  //   - 480007: clubLogo (29.87,23.64), Brust Sponsor custom (25.09,55.2) ✓
  //   - 480008: Rücken Sponsor custom (23.41,52.51) ✓
  //   FEHLT: Kürzel (Vorderseite), Vereinsname (Rückseite), playerName (Rückseite), playerNumber (Rückseite)
  
  const newZones = [
    // === HOODIE (540001) ===
    // Kürzel auf Vorderseite unten links
    { productId: 540001, partId: 480001, label: 'Kürzel', purpose: 'playerInitials', type: 'text', posX: 5, posY: 75, width: 15, height: 15, widthCm: 8, heightCm: 8, sortOrder: 3 },
    // Vereinsname auf Rückseite (oben mittig)
    { productId: 540001, partId: 480002, label: 'Vereinsname', purpose: 'clubName', type: 'text', posX: 15, posY: 5, width: 70, height: 8, widthCm: 30, heightCm: 5, sortOrder: 0 },
    
    // === JACKE (540002) ===
    // Kürzel auf Vorderseite unten links
    { productId: 540002, partId: 480003, label: 'Kürzel', purpose: 'playerInitials', type: 'text', posX: 5, posY: 75, width: 15, height: 15, widthCm: 8, heightCm: 8, sortOrder: 3 },
    // Vereinsname auf Rückseite (oben mittig) - muss noch die falsche Zone auf Vorderseite entfernt werden
    { productId: 540002, partId: 480004, label: 'Vereinsname', purpose: 'clubName', type: 'text', posX: 15, posY: 5, width: 70, height: 8, widthCm: 30, heightCm: 5, sortOrder: 0 },
    
    // === T-SHIRT (540003) ===
    // Kürzel auf Vorderseite unten links
    { productId: 540003, partId: 480007, label: 'Kürzel', purpose: 'playerInitials', type: 'text', posX: 5, posY: 75, width: 15, height: 15, widthCm: 8, heightCm: 8, sortOrder: 3 },
    // Vereinsname auf Rückseite (oben mittig)
    { productId: 540003, partId: 480008, label: 'Vereinsname', purpose: 'clubName', type: 'text', posX: 15, posY: 5, width: 70, height: 8, widthCm: 30, heightCm: 5, sortOrder: 0 },
    // Spielername auf Rückseite
    { productId: 540003, partId: 480008, label: 'Spielername', purpose: 'playerName', type: 'text', posX: 20, posY: 15, width: 60, height: 8, widthCm: 30, heightCm: 5, sortOrder: 1 },
    // Spielernummer auf Rückseite
    { productId: 540003, partId: 480008, label: 'Spielernummer', purpose: 'playerNumber', type: 'text', posX: 30, posY: 30, width: 40, height: 30, widthCm: 20, heightCm: 20, sortOrder: 2 },
  ];
  
  for (const zone of newZones) {
    const result = await db.insert(productZones).values(zone);
    console.log(`Inserted: ${zone.label} (${zone.purpose}) for product ${zone.productId}, part ${zone.partId} -> ID ${result[0].insertId}`);
  }
  
  // Entferne die falsche clubName-Zone von der Jacke-Vorderseite (ID 510006, partId 480003)
  const { eq } = await import('drizzle-orm');
  await db.delete(productZones).where(eq(productZones.id, 510006));
  console.log('Deleted: clubName zone 510006 from Jacke Vorderseite (moved to Rückseite)');
  
  console.log('\nDone! All zones added.');
  process.exit(0);
}
main();
