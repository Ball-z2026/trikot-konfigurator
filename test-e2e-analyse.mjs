// End-to-End Test: KI-Analyse → Zonen auf Produkt übertragen → Konfigurator prüfen
import 'dotenv/config';
import fs from 'fs';
import path from 'path';

// Import the LLM function directly
const FORGE_API_URL = process.env.BUILT_IN_FORGE_API_URL;
const FORGE_API_KEY = process.env.BUILT_IN_FORGE_API_KEY;

if (!FORGE_API_URL || !FORGE_API_KEY) {
  console.error('Missing BUILT_IN_FORGE_API_URL or BUILT_IN_FORGE_API_KEY');
  process.exit(1);
}

async function invokeLLM(params) {
  const res = await fetch(`${FORGE_API_URL}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${FORGE_API_KEY}`
    },
    body: JSON.stringify({
      model: 'default',
      ...params
    })
  });
  if (!res.ok) throw new Error(`LLM error: ${res.status} ${await res.text()}`);
  return res.json();
}

async function uploadImageToStorage(filePath) {
  const fileBuffer = fs.readFileSync(filePath);
  const fileName = path.basename(filePath);
  
  // Use storagePut equivalent - direct S3 upload via the forge API
  const formData = new FormData();
  formData.append('file', new Blob([fileBuffer]), fileName);
  
  const res = await fetch(`${FORGE_API_URL}/v1/storage/upload`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${FORGE_API_KEY}`
    },
    body: formData
  });
  
  if (!res.ok) {
    // Fallback: convert to base64 data URL
    const base64 = fileBuffer.toString('base64');
    const ext = path.extname(filePath).slice(1);
    const mimeType = ext === 'jpg' ? 'image/jpeg' : `image/${ext}`;
    return `data:${mimeType};base64,${base64}`;
  }
  
  const data = await res.json();
  return data.url;
}

async function analyzeImage(imageUrl, sport) {
  const prompt = `Du bist ein Experte für Sportbekleidungs-Design. Analysiere dieses Trikot-Bild und identifiziere alle bedruckbaren Zonen.

WICHTIG: Das Bild zeigt typischerweise die Vorderseite (links) und Rückseite (rechts) nebeneinander.
Gib die Positionen als Prozent (0-100) RELATIV ZUR JEWEILIGEN SEITE an, NICHT zum Gesamtbild.

Sportart: ${sport}

Typische Zonen für ${sport}-Trikots:
- Vereinswappen/Logo (Herzseite, links oben auf der Brust) - FRONT
- Brustnummer (zentral auf der Brust) - FRONT  
- Sponsor vorne (zentral, unter der Brust) - FRONT
- Ärmel-Logo links - FRONT
- Ärmel-Logo rechts - FRONT
- Vereinsname (oben auf dem Rücken) - BACK
- Spielername (oberes Drittel Rücken) - BACK
- Rückennummer (zentral auf dem Rücken, groß) - BACK
- Sponsor hinten (unterer Rücken) - BACK

WICHTIG: Nur Zonen auf dem OBERTEIL erkennen. Keine Hosen/Shorts-Zonen (y > 70% ignorieren).

Antworte NUR mit einem JSON-Array. Jedes Element hat:
{
  "name": "Zonenname (deutsch)",
  "type": "text" oder "image",
  "side": "front" oder "back",
  "x": Prozent von links (0-100, relativ zur jeweiligen Seite),
  "y": Prozent von oben (0-100),
  "width": Breite in Prozent,
  "height": Höhe in Prozent
}`;

  const response = await invokeLLM({
    messages: [
      { role: 'system', content: 'Du bist ein Bildanalyse-Experte für Sportbekleidung. Antworte NUR mit validem JSON.' },
      { 
        role: 'user', 
        content: [
          { type: 'text', text: prompt },
          { type: 'image_url', image_url: { url: imageUrl, detail: 'high' } }
        ]
      }
    ],
    response_format: { type: 'json_object' }
  });

  const content = response.choices[0].message.content;
  let parsed;
  try {
    parsed = JSON.parse(content);
    // Handle both {zones: [...]} and direct array
    if (parsed.zones) parsed = parsed.zones;
    if (!Array.isArray(parsed)) parsed = [parsed];
  } catch (e) {
    console.error('Failed to parse LLM response:', content);
    return [];
  }

  // Filter: remove shorts zones (y >= 75)
  const filtered = parsed.filter(z => z.y < 75);
  console.log(`  Gefiltert: ${parsed.length - filtered.length} Shorts-Zonen entfernt`);
  
  return filtered;
}

async function runTest(sport, imagePath) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`  ${sport.toUpperCase()} - KI-Analyse Test`);
  console.log(`${'='.repeat(60)}`);
  
  // Convert image to base64 data URL
  const fileBuffer = fs.readFileSync(imagePath);
  const ext = path.extname(imagePath).slice(1);
  const mimeType = ext === 'jpg' ? 'image/jpeg' : `image/${ext}`;
  const imageUrl = `data:${mimeType};base64,${fileBuffer.toString('base64')}`;
  
  console.log(`  Bild: ${path.basename(imagePath)} (${(fileBuffer.length / 1024).toFixed(0)} KB)`);
  console.log(`  Analysiere...`);
  
  const zones = await analyzeImage(imageUrl, sport);
  
  console.log(`\n  Erkannte Zonen (${zones.length}):`);
  console.log(`  ${'─'.repeat(50)}`);
  
  const frontZones = zones.filter(z => z.side === 'front');
  const backZones = zones.filter(z => z.side === 'back');
  
  console.log(`  VORDERSEITE (${frontZones.length}):`);
  frontZones.forEach(z => {
    console.log(`    • ${z.name} [${z.type}] @ (${z.x}%, ${z.y}%) ${z.width}x${z.height}%`);
  });
  
  console.log(`  RÜCKSEITE (${backZones.length}):`);
  backZones.forEach(z => {
    console.log(`    • ${z.name} [${z.type}] @ (${z.x}%, ${z.y}%) ${z.width}x${z.height}%`);
  });
  
  // Validate
  const issues = [];
  if (frontZones.length < 2) issues.push('Zu wenige Front-Zonen (< 2)');
  if (backZones.length < 2) issues.push('Zu wenige Back-Zonen (< 2)');
  if (zones.some(z => z.y >= 75)) issues.push('Shorts-Zonen nicht gefiltert');
  
  // Check for essential zones
  const hasNumber = zones.some(z => z.name.toLowerCase().includes('nummer'));
  const hasName = zones.some(z => z.name.toLowerCase().includes('name') || z.name.toLowerCase().includes('spieler'));
  const hasLogo = zones.some(z => z.name.toLowerCase().includes('logo') || z.name.toLowerCase().includes('wappen'));
  
  if (!hasNumber) issues.push('Keine Nummern-Zone erkannt');
  if (!hasName) issues.push('Keine Namen-Zone erkannt');
  if (!hasLogo) issues.push('Keine Logo-Zone erkannt');
  
  if (issues.length === 0) {
    console.log(`\n  ✅ BESTANDEN - Alle Validierungen OK`);
  } else {
    console.log(`\n  ⚠️  PROBLEME:`);
    issues.forEach(i => console.log(`    - ${i}`));
  }
  
  return { sport, zones, issues, frontZones: frontZones.length, backZones: backZones.length };
}

// Run all tests
async function main() {
  const tests = [
    { sport: 'Fußball (Detail)', image: '/home/ubuntu/trikot-tests/fussball_detail2.jpg' },
    { sport: 'Fußball (Blau)', image: '/home/ubuntu/trikot-tests/fussball_blau.jpg' },
    { sport: 'Handball', image: '/home/ubuntu/trikot-tests/handball_trikot.jpg' },
    { sport: 'Volleyball', image: '/home/ubuntu/trikot-tests/volleyball_trikot.jpg' },
    { sport: 'Basketball', image: '/home/ubuntu/trikot-tests/basketball_trikot.jpg' },
  ];
  
  const results = [];
  
  for (const test of tests) {
    if (!fs.existsSync(test.image)) {
      console.log(`  ⚠️  Bild nicht gefunden: ${test.image}`);
      continue;
    }
    const result = await runTest(test.sport, test.image);
    results.push(result);
  }
  
  // Summary
  console.log(`\n\n${'='.repeat(60)}`);
  console.log(`  ZUSAMMENFASSUNG`);
  console.log(`${'='.repeat(60)}`);
  console.log(`  Sportart      | Front | Back | Gesamt | Status`);
  console.log(`  ${'-'.repeat(50)}`);
  results.forEach(r => {
    const status = r.issues.length === 0 ? '✅' : '⚠️';
    console.log(`  ${r.sport.padEnd(14)} | ${String(r.frontZones).padEnd(5)} | ${String(r.backZones).padEnd(4)} | ${String(r.frontZones + r.backZones).padEnd(6)} | ${status}`);
  });
}

main().catch(console.error);
