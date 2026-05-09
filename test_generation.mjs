/**
 * Test-Script: Vergleiche KI-Generierung MIT vs. OHNE logoOverlays
 * 
 * Test A: Nur Prompt (KI platziert alles selbst) - wie gestern
 * Test B: Mit logoOverlays (nachträgliches Compositing) - aktueller Zustand
 */
import 'dotenv/config';
import fs from 'fs';

const FORGE_API_URL = process.env.BUILT_IN_FORGE_API_URL;
const FORGE_API_KEY = process.env.BUILT_IN_FORGE_API_KEY;

if (!FORGE_API_URL || !FORGE_API_KEY) {
  console.error("BUILT_IN_FORGE_API_URL oder BUILT_IN_FORGE_API_KEY nicht gesetzt!");
  process.exit(1);
}

async function generateImage(prompt) {
  const baseUrl = FORGE_API_URL.endsWith("/") ? FORGE_API_URL : `${FORGE_API_URL}/`;
  const fullUrl = new URL("images.v1.ImageService/GenerateImage", baseUrl).toString();

  const response = await fetch(fullUrl, {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "connect-protocol-version": "1",
      authorization: `Bearer ${FORGE_API_KEY}`,
    },
    body: JSON.stringify({
      prompt: prompt,
      original_images: [],
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Generation failed (${response.status}): ${detail}`);
  }

  const result = await response.json();
  return Buffer.from(result.image.b64Json, "base64");
}

// ═══════════════════════════════════════════════════════════
// TEST A: Nur Prompt – KI platziert Nummer, Vereinsname etc. selbst
// (So wie es gestern funktioniert hat)
// ═══════════════════════════════════════════════════════════
const PROMPT_A = `Professional product photography of a handball jersey, flat lay on white background. Design style: geometric. Primary color: #FFD700 (gold/yellow), secondary color: #1a1a8a (dark blue), accent color: #FF4500 (orange-red).

Club: SC Harmstorf.

The jersey is SIZE L (75cm height). Show FRONT and BACK view side by side (front on left, back on right).

CRITICAL POSITIONING RULES (the image is 1024x1024 pixels):
- The LEFT HALF (0-512px) shows the FRONT of the jersey
- The RIGHT HALF (512-1024px) shows the BACK of the jersey
- Each jersey half fills approximately 400px width, centered in its half

FRONT VIEW (left jersey):
- Club crest/badge: Small (approx 60x60px), positioned at 30% from left edge, 28% from top (heart side / right chest from viewer perspective)
- Chest number "11": Height exactly 10% of image, positioned at 15% from left, 38% from top. SOLID single color, bold, highly legible.
- NO other text or logos on front

BACK VIEW (right jersey):
- Club name "SC Harmstorf": Centered horizontally in right half, at 22% from top. Font height max 4% of image.
- Back number "11": LARGE (25-35cm = approx 25% of image height), centered in right half, at 35% from top. SOLID single color, same color as front number.
- Player name "MÜLLER": Centered in right half, directly below the number, at 62% from top. Font height max 5% of image.

ABSOLUTE PROHIBITION: Do NOT add ANY manufacturer logos, brand names, swooshes, stripes, or fictional brand marks. The shoulders MUST be plain fabric. ONLY the explicitly listed elements belong on this jersey.

CRITICAL: Show ONLY the jersey/shirt - do NOT include shorts, pants, socks. High-end product photography, studio lighting, no wrinkles.`;

// ═══════════════════════════════════════════════════════════
// TEST B: Minimaler Prompt – nur Stoff-Design, KEINE Beschriftung
// (Für den Fall dass wir Overlays danach drauflegen)
// ═══════════════════════════════════════════════════════════
const PROMPT_B = `Professional product photography of a handball jersey, flat lay on white background. Design style: geometric. Primary color: #FFD700 (gold/yellow), secondary color: #1a1a8a (dark blue), accent color: #FF4500 (orange-red).

The jersey is SIZE L (75cm height). Show FRONT and BACK view side by side (front on left, back on right).

DESIGN ONLY - NO TEXT, NO NUMBERS, NO LOGOS:
- Generate ONLY the fabric pattern/design
- Do NOT place any numbers, names, crests, or logos
- The jersey should show ONLY the geometric pattern in the specified colors
- Leave the chest area, back center, and shoulders COMPLETELY clean/empty
- This is a blank template jersey with only the fabric design

ABSOLUTE PROHIBITION: Do NOT add ANY text, numbers, manufacturer logos, brand names, crests, or any markings whatsoever. Pure fabric design only.

CRITICAL: Show ONLY the jersey/shirt - do NOT include shorts, pants, socks. High-end product photography, studio lighting, no wrinkles.`;

async function runTests() {
  console.log("═══ TEST A: Prompt mit exakten Positionen (Nummer, Name, Wappen) ═══");
  console.log("Generiere...");
  try {
    const bufferA = await generateImage(PROMPT_A);
    fs.writeFileSync("/home/ubuntu/test_A_mit_beschriftung.png", bufferA);
    console.log("✓ Test A gespeichert: /home/ubuntu/test_A_mit_beschriftung.png");
    console.log(`  Größe: ${bufferA.length} bytes`);
  } catch (err) {
    console.error("✗ Test A fehlgeschlagen:", err.message);
  }

  console.log("\n═══ TEST B: Prompt NUR Stoff-Design (keine Beschriftung) ═══");
  console.log("Generiere...");
  try {
    const bufferB = await generateImage(PROMPT_B);
    fs.writeFileSync("/home/ubuntu/test_B_nur_stoff.png", bufferB);
    console.log("✓ Test B gespeichert: /home/ubuntu/test_B_nur_stoff.png");
    console.log(`  Größe: ${bufferB.length} bytes`);
  } catch (err) {
    console.error("✗ Test B fehlgeschlagen:", err.message);
  }

  console.log("\n═══ TESTS ABGESCHLOSSEN ═══");
  console.log("Vergleiche die Bilder:");
  console.log("- test_A_mit_beschriftung.png = KI platziert alles selbst");
  console.log("- test_B_nur_stoff.png = Nur Stoff, Beschriftung kommt danach");
}

runTests();
