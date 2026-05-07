// Test-Script: Berechnet die Rückseiten-Positionen für alle 4 Layouts
// Fußball Amateur Werte:
// - backMinHeight: 25 cm → numberHeight = Math.round((25/75)*100) = 33%
// - playerName.minHeightCm: 2.5 cm → nameHeight = Math.max(Math.round((2.5/75)*100) + 3, 8) = Math.max(3+3, 8) = 8%
// - playerName.minDistanceToNumberCm: 2 cm → minGap = Math.round((2/75)*100) = 3%
// - teamName.maxHeightCm: 2 cm → clubNameHeight = Math.round((2/75)*100) + 2 = 5%

const numberHeight = 33;
const nameHeight = 8;
const minGap = 3;
const clubNameHeight = 5;

console.log("═══════════════════════════════════════════════════════════════");
console.log("RÜCKSEITEN-LAYOUT-POSITIONEN (Fußball Amateur)");
console.log("═══════════════════════════════════════════════════════════════");
console.log(`\nVerbandsvorgaben:`);
console.log(`  Rückennummer-Höhe: 25 cm = ${numberHeight}% der Trikothöhe`);
console.log(`  Spielername-Mindesthöhe: 2.5 cm = ${nameHeight}% (inkl. Padding)`);
console.log(`  Mindestabstand Nummer↔Name: 2 cm = ${minGap}%`);
console.log(`  Vereinsname max. Höhe: 2 cm = ${clubNameHeight}% (inkl. Padding)`);

console.log("\n───────────────────────────────────────────────────────────────");
console.log("LAYOUT 1: Vereinsname → Nummer → Spielername");
console.log("───────────────────────────────────────────────────────────────");
let clubNameY = 12;
let numberY = clubNameY + clubNameHeight + minGap; // 12 + 5 + 3 = 20
let nameY = numberY + numberHeight + minGap; // 20 + 33 + 3 = 56
console.log(`  Vereinsname:  Y=${clubNameY}% bis Y=${clubNameY + clubNameHeight}% (Höhe: ${clubNameHeight}%)`);
console.log(`  [Abstand: ${minGap}%]`);
console.log(`  Rückennummer: Y=${numberY}% bis Y=${numberY + numberHeight}% (Höhe: ${numberHeight}%)`);
console.log(`  [Abstand: ${minGap}%]`);
console.log(`  Spielername:  Y=${nameY}% bis Y=${nameY + nameHeight}% (Höhe: ${nameHeight}%)`);
console.log(`  Rücken-Sponsor: Y=82%`);

console.log("\n───────────────────────────────────────────────────────────────");
console.log("LAYOUT 2: Spielername → Nummer (kein Vereinsname)");
console.log("───────────────────────────────────────────────────────────────");
let nameY2 = 15;
let numberY2 = nameY2 + nameHeight + minGap; // 15 + 8 + 3 = 26
console.log(`  Spielername:  Y=${nameY2}% bis Y=${nameY2 + nameHeight}% (Höhe: ${nameHeight}%)`);
console.log(`  [Abstand: ${minGap}%]`);
console.log(`  Rückennummer: Y=${numberY2}% bis Y=${numberY2 + numberHeight}% (Höhe: ${numberHeight}%)`);
console.log(`  Rücken-Sponsor: Y=82%`);

console.log("\n───────────────────────────────────────────────────────────────");
console.log("LAYOUT 3: Nummer → Spielername (kein Vereinsname)");
console.log("───────────────────────────────────────────────────────────────");
let numberY3 = 18;
let nameY3 = numberY3 + numberHeight + minGap; // 18 + 33 + 3 = 54
console.log(`  Rückennummer: Y=${numberY3}% bis Y=${numberY3 + numberHeight}% (Höhe: ${numberHeight}%)`);
console.log(`  [Abstand: ${minGap}%]`);
console.log(`  Spielername:  Y=${nameY3}% bis Y=${nameY3 + nameHeight}% (Höhe: ${nameHeight}%)`);
console.log(`  Rücken-Sponsor: Y=82%`);

console.log("\n───────────────────────────────────────────────────────────────");
console.log("LAYOUT 4: Vereinsname → Spielername → Nummer");
console.log("───────────────────────────────────────────────────────────────");
let clubNameY4 = 12;
let nameY4 = clubNameY4 + clubNameHeight + minGap; // 12 + 5 + 3 = 20
let numberY4 = nameY4 + nameHeight + minGap; // 20 + 8 + 3 = 31
console.log(`  Vereinsname:  Y=${clubNameY4}% bis Y=${clubNameY4 + clubNameHeight}% (Höhe: ${clubNameHeight}%)`);
console.log(`  [Abstand: ${minGap}%]`);
console.log(`  Spielername:  Y=${nameY4}% bis Y=${nameY4 + nameHeight}% (Höhe: ${nameHeight}%)`);
console.log(`  [Abstand: ${minGap}%]`);
console.log(`  Rückennummer: Y=${numberY4}% bis Y=${numberY4 + numberHeight}% (Höhe: ${numberHeight}%)`);
console.log(`  Rücken-Sponsor: Y=82%`);

console.log("\n═══════════════════════════════════════════════════════════════");
console.log("ZUSAMMENFASSUNG: Alle Positionen in cm (Trikothöhe = 75 cm)");
console.log("═══════════════════════════════════════════════════════════════");
const toCm = (pct) => Math.round(pct * 0.75 * 10) / 10;
console.log(`\nLayout 1: Vereinsname(${toCm(clubNameY)}cm) → ${toCm(minGap)}cm Abstand → Nummer(${toCm(numberY)}cm, ${toCm(numberHeight)}cm hoch) → ${toCm(minGap)}cm Abstand → Name(${toCm(nameY)}cm)`);
console.log(`Layout 2: Name(${toCm(nameY2)}cm) → ${toCm(minGap)}cm Abstand → Nummer(${toCm(numberY2)}cm, ${toCm(numberHeight)}cm hoch)`);
console.log(`Layout 3: Nummer(${toCm(numberY3)}cm) → ${toCm(minGap)}cm Abstand → Name(${toCm(nameY3)}cm)`);
console.log(`Layout 4: Vereinsname(${toCm(clubNameY4)}cm) → ${toCm(minGap)}cm Abstand → Name(${toCm(nameY4)}cm) → ${toCm(minGap)}cm Abstand → Nummer(${toCm(numberY4)}cm, ${toCm(numberHeight)}cm hoch)`);
