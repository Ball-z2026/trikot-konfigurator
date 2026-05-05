/**
 * Test-Script für die KI-Analyse - ruft direkt die LLM-Funktion auf
 * Ausführung: cd /home/ubuntu/trikot-konfigurator && npx tsx test-ki-analyse.mjs
 */
import 'dotenv/config';
import fs from 'fs';
import path from 'path';

// ENV manuell setzen falls nötig
const FORGE_API_URL = process.env.BUILT_IN_FORGE_API_URL;
const FORGE_API_KEY = process.env.BUILT_IN_FORGE_API_KEY;

if (!FORGE_API_KEY) {
  console.error('BUILT_IN_FORGE_API_KEY nicht gesetzt!');
  process.exit(1);
}

const apiUrl = FORGE_API_URL 
  ? `${FORGE_API_URL.replace(/\/$/, '')}/v1/chat/completions`
  : 'https://forge.manus.im/v1/chat/completions';

function imageToDataUrl(filePath) {
  const buffer = fs.readFileSync(filePath);
  const ext = path.extname(filePath).slice(1);
  const mimeType = ext === 'jpg' ? 'image/jpeg' : `image/${ext}`;
  return `data:${mimeType};base64,${buffer.toString('base64')}`;
}

async function analyzeImage(imagePath, sport, category = 'Trikot') {
  const imageUrl = imageToDataUrl(imagePath);
  
  console.log(`\n${'='.repeat(60)}`);
  console.log(`KI-Analyse: ${path.basename(imagePath)} (${sport})`);
  console.log(`${'='.repeat(60)}`);

  const systemPrompt = `Du bist ein Experte für Sportbekleidung und Textildesign mit jahrelanger Erfahrung in der Druckproduktion. Analysiere das hochgeladene Bild eines Trikots oder Sportbekleidungsstücks EXTREM GENAU.

Deine Aufgabe: Erkenne ALLE sichtbaren Text- und Grafik-Elemente und deren EXAKTE Positionen auf dem Kleidungsstück. Das Ziel ist eine 100%-ige Positionskopie – die erkannten Positionen müssen so präzise sein, dass sie 1:1 auf ein anderes Trikot übertragen werden können.

Mögliche Elemente:
- playerName: Spielername (meist oben auf dem Rücken, oft GEBOGEN/GEWÖLBT)
- playerNumber: Rücken-/Frontnummer (große Ziffern)
- clubName: Vereins-/Teamname (oft auf der Vorderseite, manchmal GEBOGEN)
- logo: Vereinswappen/Logo (meist auf der Herzseite/links oben)
- sponsor: Sponsoren-Logo
- abbreviation: Kürzel
- custom: Sonstige Elemente

Für JEDES erkannte Element gib zurück:
1. POSITION: x, y (obere linke Ecke), width, height – alles in Prozent (0-100).
   KRITISCH: Die Positionen müssen RELATIV ZUR JEWEILIGEN SEITE (Vorder- oder Rückseite) angegeben werden!
   - Wenn das Bild BEIDE Seiten nebeneinander zeigt (z.B. Vorderseite links, Rückseite rechts):
     * Behandle JEDE Seite als eigenständiges 100%-Koordinatensystem (0-100% Breite, 0-100% Höhe)
     * Ein Element in der Mitte der Rückseite hat x=50%, NICHT x=75% (was die Position im Gesamtbild wäre)
     * Messe immer relativ zur jeweiligen Seite des Kleidungsstücks
   - Wenn das Bild nur EINE Seite zeigt: Messe relativ zum sichtbaren Kleidungsstück
   - Messe vom oberen Rand des Kleidungsstücks (Schulter), nicht vom Bildrand
2. TEXTSTIL:
   - textStyle: "arc" (gebogen/gewölbt wie auf echten Trikots) oder "straight" (gerade)
   - arcDegree: Bogengrad in Grad (0 = gerade, positiv = nach oben gewölbt, negativ = nach unten). Typisch: 15-30° für Spielernamen auf dem Rücken
   - fontColor: Hauptfarbe des Textes als HEX (z.B. "#FFFFFF" für weiß)
   - outlineColor: Outline/Umrandungsfarbe als HEX (z.B. "#FF0000" für rot), oder "none" wenn keine Outline
   - outlineWidth: Breite der Outline in Prozent der Schrifthöhe (z.B. 10 für 10%), oder 0
   - fontStyle: Schriftart-Kategorie: "block" (fette Blockschrift), "serif" (Serifenschrift), "sans" (serifenlos), "script" (Schreibschrift), "outline" (nur Umriss), "shadow" (mit Schatten)
   - fontWeight: "normal" oder "bold"
   - fontSize: Geschätzte Schrifthöhe relativ zur Zonenhöhe in Prozent (z.B. 80 = Text füllt 80% der Zonenhöhe)

WICHTIG:
- Sei EXTREM PRÄZISE bei den Positionen. Achte auf Symmetrie (z.B. zentrierte Nummern = x ca. 25-35%, width ca. 30-50%).
- Erkenne ob das Bild Vorder- UND Rückseite zeigt (z.B. nebeneinander). Wenn ja, gib Positionen PRO SEITE an (jeweils 0-100%).
- Bei gebogenem Text: Der Bogen ist typisch für Spielernamen auf Basketball-, Football- und Baseball-Trikots.
- Schätze Farben so genau wie möglich aus dem Bild.
- Wenn ein Element eine Outline/Umrandung hat (z.B. weiße Schrift mit roter Umrandung), erkenne BEIDE Farben.
- Typische Positionen als Referenz:
  * Vereinswappen: x=5-15%, y=5-15%, width=10-18%, height=10-15% (Herzseite)
  * Spielername Rücken: x=15-25%, y=15-25%, width=50-70%, height=6-10% (zentriert oben)
  * Rückennummer: x=25-35%, y=30-50%, width=30-50%, height=20-35% (zentriert Mitte)
  * Sponsor Brust: x=20-30%, y=35-50%, width=40-60%, height=8-15% (zentriert)`;

  const payload = {
    model: 'gemini-2.5-flash',
    messages: [
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: [
          { type: 'image_url', image_url: { url: imageUrl, detail: 'high' } },
          { type: 'text', text: `Analysiere dieses ${category}-Bild (Sportart: ${sport}) EXTREM GENAU. Erkenne alle Elemente (Name, Nummer, Logo, Vereinsname, Sponsor etc.), ihre EXAKTEN Positionen und den STIL (gebogen/gerade, Farben, Outline, Schriftart). Ziel: 100%-ige Positionskopie auf ein anderes Trikot.` },
        ],
      },
    ],
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'zone_analysis',
        strict: true,
        schema: {
          type: 'object',
          properties: {
            zones: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string', description: 'Beschreibender Name der Zone' },
                  purpose: { type: 'string', enum: ['playerName', 'playerNumber', 'clubName', 'logo', 'sponsor', 'abbreviation', 'custom'] },
                  x: { type: 'number', description: 'X-Position in Prozent (0-100)' },
                  y: { type: 'number', description: 'Y-Position in Prozent (0-100)' },
                  width: { type: 'number', description: 'Breite in Prozent (0-100)' },
                  height: { type: 'number', description: 'Höhe in Prozent (0-100)' },
                  side: { type: 'string', enum: ['front', 'back'] },
                  textStyle: { type: 'string', enum: ['arc', 'straight'] },
                  arcDegree: { type: 'number' },
                  fontColor: { type: 'string' },
                  outlineColor: { type: 'string' },
                  outlineWidth: { type: 'number' },
                  fontStyle: { type: 'string', enum: ['block', 'serif', 'sans', 'script', 'outline', 'shadow'] },
                  fontWeight: { type: 'string', enum: ['normal', 'bold'] },
                  fontSize: { type: 'number' },
                },
                required: ['name', 'purpose', 'x', 'y', 'width', 'height', 'side', 'textStyle', 'arcDegree', 'fontColor', 'outlineColor', 'outlineWidth', 'fontStyle', 'fontWeight', 'fontSize'],
                additionalProperties: false,
              },
            },
          },
          required: ['zones'],
          additionalProperties: false,
        },
      },
    },
  };

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${FORGE_API_KEY}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  
  if (!response.ok) {
    console.error('API-Fehler:', response.status, JSON.stringify(data).slice(0, 500));
    return null;
  }

  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    console.error('Keine Antwort:', JSON.stringify(data).slice(0, 500));
    return null;
  }

  const parsed = JSON.parse(content);
  
  // Shorts-Filter (wie im Router)
  if (parsed.zones) {
    parsed.zones = parsed.zones.filter(z => {
      if (z.y > 75) {
        console.log(`  [GEFILTERT] ${z.name} (y=${z.y}% > 75% = Shorts-Bereich)`);
        return false;
      }
      if (z.y + z.height > 100) {
        z.height = Math.max(5, 100 - z.y);
      }
      return true;
    });
  }
  
  console.log(`\nErkannte Zonen (${parsed.zones?.length || 0}):`);
  console.log('-'.repeat(60));
  
  if (parsed.zones) {
    for (const zone of parsed.zones) {
      console.log(`  ${(zone.side || '?').toUpperCase().padEnd(5)} | ${zone.purpose.padEnd(14)} | "${zone.name}"`);
      console.log(`         Position: x=${zone.x}%, y=${zone.y}%, w=${zone.width}%, h=${zone.height}%`);
      console.log(`         Stil: ${zone.textStyle}, Bogen: ${zone.arcDegree}°, Farbe: ${zone.fontColor}, Font: ${zone.fontStyle}/${zone.fontWeight}`);
      if (zone.outlineColor !== 'none') {
        console.log(`         Outline: ${zone.outlineColor} (${zone.outlineWidth}%)`);
      }
      console.log('');
    }
  }
  
  return parsed;
}

// Validierung: Prüfe ob Positionen sinnvoll sind
function validateZones(zones, sport) {
  const issues = [];
  
  for (const zone of zones) {
    // Prüfe ob Positionen im gültigen Bereich sind
    if (zone.x < 0 || zone.x > 100) issues.push(`${zone.name}: x=${zone.x} außerhalb 0-100`);
    if (zone.y < 0 || zone.y > 100) issues.push(`${zone.name}: y=${zone.y} außerhalb 0-100`);
    if (zone.width < 1 || zone.width > 100) issues.push(`${zone.name}: width=${zone.width} unrealistisch`);
    if (zone.height < 1 || zone.height > 100) issues.push(`${zone.name}: height=${zone.height} unrealistisch`);
    if (zone.x + zone.width > 105) issues.push(`${zone.name}: x+width=${zone.x + zone.width} > 100 (überragt rechts)`);
    if (zone.y + zone.height > 105) issues.push(`${zone.name}: y+height=${zone.y + zone.height} > 100 (überragt unten)`);
    
    // Prüfe typische Positionen
    if (zone.purpose === 'playerNumber' && zone.side === 'back') {
      if (zone.x < 15 || zone.x > 45) issues.push(`${zone.name}: Rückennummer x=${zone.x} sollte zentriert sein (25-35)`);
      if (zone.width < 20 || zone.width > 60) issues.push(`${zone.name}: Rückennummer width=${zone.width} sollte 30-50 sein`);
    }
    if (zone.purpose === 'playerName' && zone.side === 'back') {
      if (zone.y > 40) issues.push(`${zone.name}: Spielername y=${zone.y} sollte oben sein (15-30)`);
    }
    if (zone.purpose === 'logo' && zone.side === 'front') {
      // Logo kann auch zentriert sein (z.B. Basketball, manche Handball-Trikots)
      // Nur warnen wenn es rechts ist (x > 70%)
      if (zone.x > 70) issues.push(`${zone.name}: Logo x=${zone.x} ist sehr weit rechts - prüfen`);
    }
  }
  
  if (issues.length > 0) {
    console.log('\n⚠️  VALIDIERUNGSPROBLEME:');
    issues.forEach(i => console.log(`   - ${i}`));
  } else {
    console.log('\n✅ Alle Positionen sehen plausibel aus!');
  }
  
  return issues;
}

// Hauptprogramm
async function main() {
  const testSport = process.argv[2] || 'all';
  
  const sports = [
    { file: '/home/ubuntu/trikot-tests/fussball_trikot.jpg', sport: 'fussball' },
    { file: '/home/ubuntu/trikot-tests/handball_trikot.jpg', sport: 'handball' },
    { file: '/home/ubuntu/trikot-tests/volleyball_trikot.jpg', sport: 'volleyball' },
    { file: '/home/ubuntu/trikot-tests/basketball_trikot.jpg', sport: 'basketball' },
  ];
  
  const toTest = testSport === 'all' 
    ? sports 
    : sports.filter(s => s.sport === testSport);
  
  const allResults = {};
  
  for (const { file, sport } of toTest) {
    if (!fs.existsSync(file)) {
      console.error(`Bild nicht gefunden: ${file}`);
      continue;
    }
    
    const result = await analyzeImage(file, sport);
    if (result && result.zones) {
      allResults[sport] = result;
      validateZones(result.zones, sport);
      
      // Ergebnis speichern
      fs.writeFileSync(`/home/ubuntu/trikot-tests/ergebnis_${sport}.json`, JSON.stringify(result, null, 2));
    }
  }
  
  // Zusammenfassung
  console.log(`\n${'='.repeat(60)}`);
  console.log('ZUSAMMENFASSUNG');
  console.log(`${'='.repeat(60)}`);
  for (const [sport, result] of Object.entries(allResults)) {
    const frontZones = result.zones?.filter(z => z.side === 'front') || [];
    const backZones = result.zones?.filter(z => z.side === 'back') || [];
    console.log(`${sport.padEnd(12)}: ${result.zones?.length || 0} Zonen (${frontZones.length} vorne, ${backZones.length} hinten)`);
  }
}

main().catch(console.error);
