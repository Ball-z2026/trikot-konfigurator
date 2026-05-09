/**
 * Test: Zwei-Schritt-Generierung
 * 
 * Schritt 1: Combined-Bild (Front+Back mit Nummer, Name, Wappen)
 * Schritt 2: Stoffmuster mit dem Combined als Referenz → gleiches Design
 */
import 'dotenv/config';
import fs from 'fs';

const FORGE_API_URL = process.env.BUILT_IN_FORGE_API_URL;
const FORGE_API_KEY = process.env.BUILT_IN_FORGE_API_KEY;

async function generateImage(prompt, referenceImagePath) {
  const baseUrl = FORGE_API_URL.endsWith("/") ? FORGE_API_URL : `${FORGE_API_URL}/`;
  const fullUrl = new URL("images.v1.ImageService/GenerateImage", baseUrl).toString();

  const originalImages = [];
  if (referenceImagePath) {
    const imgBuffer = fs.readFileSync(referenceImagePath);
    const b64 = imgBuffer.toString("base64");
    originalImages.push({ b64_json: b64, mime_type: "image/png" });
  }

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
      original_images: originalImages,
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Generation failed (${response.status}): ${detail}`);
  }

  const result = await response.json();
  return Buffer.from(result.image.b64Json, "base64");
}

async function runTest() {
  // ═══════════════════════════════════════════════════════════
  // SCHRITT 1: Combined-Bild generieren (Vorschau mit allem)
  // ═══════════════════════════════════════════════════════════
  console.log("═══ SCHRITT 1: Combined-Bild (Front+Back mit Beschriftung) ═══");
  
  const promptCombined = `Professional product photography of a handball jersey, flat lay on white background. Design style: geometric. Primary color: #FFD700 (gold/yellow), secondary color: #1a1a8a (dark blue), accent color: #FF4500 (orange-red).

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

  console.log("Generiere Combined-Bild...");
  const combinedBuffer = await generateImage(promptCombined);
  fs.writeFileSync("/home/ubuntu/test_schritt1_combined.png", combinedBuffer);
  console.log("✓ Schritt 1 gespeichert: /home/ubuntu/test_schritt1_combined.png");

  // ═══════════════════════════════════════════════════════════
  // SCHRITT 2: Stoffmuster generieren MIT dem Combined als Referenz
  // ═══════════════════════════════════════════════════════════
  console.log("\n═══ SCHRITT 2: Stoffmuster (gleicher Look, für Schnittteile) ═══");
  
  const promptFabric = `Generate a SEAMLESS FABRIC PATTERN based on the jersey design shown in the reference image. 

CRITICAL REQUIREMENTS:
- Extract the EXACT same geometric pattern, colors, and design elements from the reference jersey
- Create a FLAT, SEAMLESS fabric texture at 3358x3300 pixels (high resolution for print)
- The pattern must tile/repeat naturally across the entire canvas
- Use the EXACT same colors: gold/yellow (#FFD700), dark blue (#1a1a8a), orange-red (#FF4500)
- Reproduce the SAME geometric shapes, angles, and proportions as on the reference jersey
- This is a FLAT fabric swatch - NO jersey shape, NO 3D folds, NO shadows
- Fill the ENTIRE canvas with the pattern - no empty/white areas
- DO NOT include any text, numbers, names, logos, or crests - ONLY the fabric pattern/design
- The pattern should look like a piece of sublimation-printed fabric laid flat on a table

This fabric pattern will be cut into jersey pieces, so it must be consistent and seamless across the entire surface.`;

  console.log("Generiere Stoffmuster mit Combined als Referenz...");
  const fabricBuffer = await generateImage(promptFabric, "/home/ubuntu/test_schritt1_combined.png");
  fs.writeFileSync("/home/ubuntu/test_schritt2_stoffmuster.png", fabricBuffer);
  console.log("✓ Schritt 2 gespeichert: /home/ubuntu/test_schritt2_stoffmuster.png");

  console.log("\n═══ TEST ABGESCHLOSSEN ═══");
  console.log("Vergleiche:");
  console.log("- test_schritt1_combined.png = Vorschau (Front+Back mit allem)");
  console.log("- test_schritt2_stoffmuster.png = Stoffmuster (gleicher Look, für Druck)");
}

runTest().catch(err => {
  console.error("Fehler:", err.message);
  process.exit(1);
});
