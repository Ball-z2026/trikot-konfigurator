const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

async function createMaskFromTemplate(templatePath) {
  const templateBuffer = fs.readFileSync(templatePath);
  const { data, info } = await sharp(templateBuffer)
    .grayscale()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const width = info.width;
  const height = info.height;
  const pixels = new Uint8Array(data);

  const THRESHOLD = 200;
  const isLine = new Uint8Array(width * height);
  for (let i = 0; i < pixels.length; i++) {
    isLine[i] = pixels[i] < THRESHOLD ? 1 : 0;
  }

  const DILATE_RADIUS = 4;
  const thickLines = new Uint8Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (isLine[y * width + x] === 1) {
        for (let dy = -DILATE_RADIUS; dy <= DILATE_RADIUS; dy++) {
          for (let dx = -DILATE_RADIUS; dx <= DILATE_RADIUS; dx++) {
            const ny = y + dy;
            const nx = x + dx;
            if (ny >= 0 && ny < height && nx >= 0 && nx < width) {
              thickLines[ny * width + nx] = 1;
            }
          }
        }
      }
    }
  }

  const isOutside = new Uint8Array(width * height);
  const queue = [];
  for (let x = 0; x < width; x++) {
    if (thickLines[x] === 0) { queue.push(x); isOutside[x] = 1; }
    const bottomIdx = (height - 1) * width + x;
    if (thickLines[bottomIdx] === 0) { queue.push(bottomIdx); isOutside[bottomIdx] = 1; }
  }
  for (let y = 0; y < height; y++) {
    const leftIdx = y * width;
    if (thickLines[leftIdx] === 0) { queue.push(leftIdx); isOutside[leftIdx] = 1; }
    const rightIdx = y * width + (width - 1);
    if (thickLines[rightIdx] === 0) { queue.push(rightIdx); isOutside[rightIdx] = 1; }
  }

  let queueIdx = 0;
  while (queueIdx < queue.length) {
    const idx = queue[queueIdx++];
    const x = idx % width;
    const y = Math.floor(idx / width);
    const neighbors = [[x-1,y],[x+1,y],[x,y-1],[x,y+1]];
    for (const [nx, ny] of neighbors) {
      if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
        const nIdx = ny * width + nx;
        if (isOutside[nIdx] === 0 && thickLines[nIdx] === 0) {
          isOutside[nIdx] = 1;
          queue.push(nIdx);
        }
      }
    }
  }

  const mask = Buffer.alloc(width * height);
  for (let i = 0; i < width * height; i++) {
    if (isOutside[i] === 0 && thickLines[i] === 0) mask[i] = 255;
    if (thickLines[i] === 1 && isOutside[i] === 0) mask[i] = 255;
  }

  return sharp(mask, { raw: { width, height, channels: 1 } }).png().toBuffer();
}

async function main() {
  console.log("=== Test cutPatternGenerator V3 – Masken ===");
  console.log("Datum:", new Date().toISOString());
  
  fs.mkdirSync("/home/ubuntu/test_results", { recursive: true });

  // Test 1: Templates prüfen
  console.log("\nTest 1: Templates vorhanden...");
  const templates = [
    { name: "part_8 (Vorderteil)", file: "/home/ubuntu/trikot-parts/part_8.png" },
    { name: "part_7 (Rückteil)", file: "/home/ubuntu/trikot-parts/part_7.png" },
    { name: "part_2 (Ärmel L)", file: "/home/ubuntu/trikot-parts/part_2.png" },
    { name: "part_4 (Ärmel R)", file: "/home/ubuntu/trikot-parts/part_4.png" },
    { name: "part_6 (Kragen)", file: "/home/ubuntu/trikot-parts/part_6.png" },
    { name: "part_3 (Bündchen L)", file: "/home/ubuntu/trikot-parts/part_3.png" },
    { name: "part_5 (Bündchen R)", file: "/home/ubuntu/trikot-parts/part_5.png" },
  ];
  for (const t of templates) {
    const s = fs.statSync(t.file);
    console.log(`  ✓ ${t.name}: ${s.size} bytes`);
  }

  // Test 2: Vorderteil-Maske
  console.log("\nTest 2: Vorderteil-Maske erstellen (part_8.png)...");
  const t0 = Date.now();
  const maskVS = await createMaskFromTemplate("/home/ubuntu/trikot-parts/part_8.png");
  console.log(`  → Maske erstellt in ${Date.now() - t0}ms`);
  await sharp(maskVS).toFile("/home/ubuntu/test_results/mask_vorderteil_v3.png");
  console.log("  → Gespeichert: /home/ubuntu/test_results/mask_vorderteil_v3.png");

  // Test 3: Rückteil-Maske
  console.log("\nTest 3: Rückteil-Maske erstellen (part_7.png)...");
  const t1 = Date.now();
  const maskRS = await createMaskFromTemplate("/home/ubuntu/trikot-parts/part_7.png");
  console.log(`  → Maske erstellt in ${Date.now() - t1}ms`);
  await sharp(maskRS).toFile("/home/ubuntu/test_results/mask_rueckteil_v3.png");
  console.log("  → Gespeichert: /home/ubuntu/test_results/mask_rueckteil_v3.png");

  // Test 4: Ärmel-Maske
  console.log("\nTest 4: Ärmel-Maske erstellen (part_2.png)...");
  const t2 = Date.now();
  const maskAE = await createMaskFromTemplate("/home/ubuntu/trikot-parts/part_2.png");
  console.log(`  → Maske erstellt in ${Date.now() - t2}ms`);
  await sharp(maskAE).toFile("/home/ubuntu/test_results/mask_aermel_v3.png");
  console.log("  → Gespeichert: /home/ubuntu/test_results/mask_aermel_v3.png");

  // Test 5: Muster auf Vorderteil-Maske anwenden
  console.log("\nTest 5: Blaues Testmuster auf Vorderteil-Maske anwenden...");
  const testPattern = await sharp({
    create: { width: 1679, height: 2266, channels: 4, background: { r: 30, g: 60, b: 150, alpha: 1 } }
  }).png().toBuffer();

  const masked = await sharp(testPattern)
    .ensureAlpha()
    .composite([{ input: maskVS, blend: "dest-in" }])
    .png()
    .toBuffer();
  await sharp(masked).toFile("/home/ubuntu/test_results/vorderteil_blau_masked_v3.png");
  console.log("  → Gespeichert: /home/ubuntu/test_results/vorderteil_blau_masked_v3.png");

  // Test 6: Echtes Muster (aus gestern) auf beide Körperteile
  console.log("\nTest 6: Echtes Muster auf Vorder+Rückteil (Seitennaht-Test)...");
  const fabricPath = "/home/ubuntu/trikot-parts/v2_fabric_full.png";
  if (fs.existsSync(fabricPath)) {
    // Skaliere auf Gesamtfläche (Vorder + Rück nebeneinander)
    const totalW = 1679 + 1679; // 3358
    const totalH = Math.max(2266, 2260); // 2266
    const scaledFabric = await sharp(fabricPath)
      .resize(totalW, totalH, { fit: "cover" })
      .png()
      .toBuffer();

    // Vorderteil = linke Hälfte
    const vsCrop = await sharp(scaledFabric)
      .extract({ left: 0, top: 0, width: 1679, height: 2266 })
      .ensureAlpha()
      .composite([{ input: maskVS, blend: "dest-in" }])
      .png()
      .toBuffer();
    await sharp(vsCrop).toFile("/home/ubuntu/test_results/vorderteil_muster_v3.png");
    console.log("  → Vorderteil mit Muster gespeichert");

    // Rückteil = rechte Hälfte
    const rsCrop = await sharp(scaledFabric)
      .extract({ left: 1679, top: 0, width: 1679, height: 2260 })
      .ensureAlpha()
      .composite([{ input: maskRS, blend: "dest-in" }])
      .png()
      .toBuffer();
    await sharp(rsCrop).toFile("/home/ubuntu/test_results/rueckteil_muster_v3.png");
    console.log("  → Rückteil mit Muster gespeichert");

    // Seitennaht-Test: Rechte Kante VS vs Linke Kante RS
    const stripeW = 80;
    const vsStripe = await sharp(scaledFabric)
      .extract({ left: 1679 - stripeW, top: 0, width: stripeW, height: 2260 })
      .png().toBuffer();
    const rsStripe = await sharp(scaledFabric)
      .extract({ left: 1679, top: 0, width: stripeW, height: 2260 })
      .png().toBuffer();
    
    // Nebeneinander legen
    const nahtTest = await sharp({
      create: { width: stripeW * 2 + 4, height: 2260, channels: 4, background: { r: 50, g: 50, b: 50, alpha: 1 } }
    })
      .composite([
        { input: vsStripe, left: 0, top: 0 },
        { input: rsStripe, left: stripeW + 4, top: 0 },
      ])
      .png().toBuffer();
    await sharp(nahtTest).toFile("/home/ubuntu/test_results/seitennaht_test_v3.png");
    console.log("  → Seitennaht-Test gespeichert");
  } else {
    console.log("  ⚠ v2_fabric_full.png nicht vorhanden, überspringe");
  }

  console.log("\n=== Alle Tests bestanden! ===");
  console.log("Prüfe die Ergebnisse visuell in /home/ubuntu/test_results/");
}

main().catch(e => { console.error(e); process.exit(1); });
