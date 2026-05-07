/**
 * Crest-in-Number Compositing Service
 * 
 * Compositet das Vereinswappen als Textur IN die Rückennummer-Ziffern.
 * 
 * Ansatz (robust, ohne LLM-Vision-Abhängigkeit):
 * 1. Das generierte Bild zeigt Front+Back nebeneinander → rechte Hälfte = Rückseite
 * 2. Im Rückenbereich ist die Nummer typischerweise im oberen Drittel, zentriert
 * 3. Wir verwenden eine feste Bounding-Box basierend auf den bekannten Positionsregeln
 * 4. Erstelle eine Farb-Kontrast-Maske der Nummern-Ziffern
 * 5. Composite das Wappen NUR innerhalb der Ziffern-Pixel
 */
import sharp from "sharp";
import axios from "axios";

/**
 * Lädt ein Bild von einer URL und gibt es als Buffer zurück
 */
async function fetchImageBuffer(url: string): Promise<Buffer> {
  const response = await axios.get(url, { responseType: "arraybuffer", timeout: 30000 });
  return Buffer.from(response.data);
}

/**
 * Berechnet die erwartete Bounding-Box der Rückennummer basierend auf den
 * bekannten Positionsregeln (jerseyRules.ts):
 * - Bild zeigt Front+Back nebeneinander → rechte Hälfte = Rückseite
 * - Rückennummer: ca. 25-35cm auf 75cm Trikot = 33-47% der Höhe
 * - Position: vertikal ca. 25-65% (Mitte des Rückens)
 * - Horizontal: zentriert auf der rechten Hälfte
 */
function getExpectedNumberBBox(imgWidth: number, imgHeight: number): {
  left: number; top: number; width: number; height: number;
} {
  // Rechte Hälfte = Rückseite
  const backStartX = Math.round(imgWidth * 0.5);
  const backWidth = Math.round(imgWidth * 0.5);
  
  // Nummer ist typischerweise:
  // - Horizontal: 25-75% der Rückseiten-Breite (zentriert)
  // - Vertikal: 20-65% der Höhe (obere Mitte des Rückens)
  const numberLeft = backStartX + Math.round(backWidth * 0.20);
  const numberTop = Math.round(imgHeight * 0.22);
  const numberWidth = Math.round(backWidth * 0.60);
  const numberHeight = Math.round(imgHeight * 0.40);
  
  return { left: numberLeft, top: numberTop, width: numberWidth, height: numberHeight };
}

/**
 * Erstellt eine Alpha-Maske aus den Nummern-Ziffern durch Farb-Kontrast-Erkennung.
 * Die Ziffern sind typischerweise eine stark kontrastierende Farbe zum Trikot-Hintergrund.
 */
async function createNumberMask(
  imageBuffer: Buffer,
  bbox: { left: number; top: number; width: number; height: number }
): Promise<Buffer> {
  // Nummer-Bereich ausschneiden
  const numberRegion = await sharp(imageBuffer)
    .extract({ left: bbox.left, top: bbox.top, width: bbox.width, height: bbox.height })
    .removeAlpha() // Sicherstellen dass wir nur RGB haben
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { data, info } = numberRegion;
  const channels = info.channels; // sollte 3 sein (RGB)
  const pixelCount = info.width * info.height;

  // Durchschnittsfarbe des Randes berechnen (= Trikot-Hintergrund)
  // Nimm die äußeren Pixel als Referenz
  let bgR = 0, bgG = 0, bgB = 0, bgCount = 0;
  const edgeMarginX = Math.round(info.width * 0.06);
  const edgeMarginY = Math.round(info.height * 0.04);
  
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      const isEdge = x < edgeMarginX || x >= info.width - edgeMarginX ||
                     y < edgeMarginY || y >= info.height - edgeMarginY;
      if (isEdge) {
        const idx = (y * info.width + x) * channels;
        bgR += data[idx];
        bgG += data[idx + 1];
        bgB += data[idx + 2];
        bgCount++;
      }
    }
  }
  
  if (bgCount === 0) {
    // Fallback: Verwende die Ecken
    bgR = data[0]; bgG = data[1]; bgB = data[2];
    bgCount = 1;
  }
  
  bgR = Math.round(bgR / bgCount);
  bgG = Math.round(bgG / bgCount);
  bgB = Math.round(bgB / bgCount);

  console.log(`Background color detected: RGB(${bgR}, ${bgG}, ${bgB})`);

  // Maske erstellen: Pixel die NICHT dem Hintergrund ähneln = Nummer-Pixel
  const maskData = Buffer.alloc(pixelCount);
  
  // Dynamische Schwelle basierend auf dem Kontrast im Bild
  // Berechne zunächst die Standardabweichung der Farbabstände
  let totalDist = 0;
  const distances: number[] = [];
  
  for (let i = 0; i < pixelCount; i++) {
    const idx = i * channels;
    const r = data[idx];
    const g = data[idx + 1];
    const b = data[idx + 2];
    const dist = Math.sqrt(
      Math.pow(r - bgR, 2) + Math.pow(g - bgG, 2) + Math.pow(b - bgB, 2)
    );
    distances.push(dist);
    totalDist += dist;
  }
  
  const avgDist = totalDist / pixelCount;
  // Schwelle: Verwende einen Wert zwischen Durchschnitt und Maximum
  // Typischerweise sind Nummern-Pixel deutlich anders als der Hintergrund
  const threshold = Math.max(40, avgDist * 1.5);
  
  console.log(`Mask threshold: ${threshold.toFixed(1)}, avg distance: ${avgDist.toFixed(1)}`);

  for (let i = 0; i < pixelCount; i++) {
    maskData[i] = distances[i] > threshold ? 255 : 0;
  }

  // Maske glätten und Rauschen entfernen
  const mask = await sharp(maskData, { raw: { width: info.width, height: info.height, channels: 1 } })
    .blur(1.5) // Glättung
    .threshold(140) // Wieder binär machen (etwas höher für saubere Kanten)
    .png()
    .toBuffer();

  return mask;
}

/**
 * Hauptfunktion: Compositet das Vereinswappen IN die Rückennummer-Ziffern.
 * 
 * @param baseImageUrl - URL des KI-generierten Trikot-Bildes (Front+Back nebeneinander)
 * @param crestImageUrl - URL des Vereinswappens
 * @param opacity - Opacity des Wappens innerhalb der Nummer (0-1, default 0.85)
 * @returns Buffer des fertigen Bildes
 */
export async function compositeCrestInNumber(
  baseImageUrl: string,
  crestImageUrl: string,
  opacity: number = 0.85
): Promise<Buffer> {
  console.log("=== compositeCrestInNumber START ===");
  console.log("Base image URL:", baseImageUrl.substring(0, 100));
  console.log("Crest image URL:", crestImageUrl.substring(0, 100));
  
  // 1. Bilder laden
  const baseBuffer = await fetchImageBuffer(baseImageUrl);
  const crestBuffer = await fetchImageBuffer(crestImageUrl);
  
  const metadata = await sharp(baseBuffer).metadata();
  const imgWidth = metadata.width || 1024;
  const imgHeight = metadata.height || 1024;
  
  console.log(`Image dimensions: ${imgWidth}x${imgHeight}`);
  
  // 2. Erwartete Nummer-Position berechnen (basierend auf Positionsregeln)
  const bbox = getExpectedNumberBBox(imgWidth, imgHeight);
  console.log(`Expected number bbox: left=${bbox.left}, top=${bbox.top}, width=${bbox.width}, height=${bbox.height}`);

  // 3. Nummer-Maske erstellen (Farb-Kontrast-basiert)
  const mask = await createNumberMask(baseBuffer, bbox);
  console.log("Number mask created successfully");

  // 4. Wappen auf die Größe der Nummer-Box skalieren
  const crestResized = await sharp(crestBuffer)
    .resize(bbox.width, bbox.height, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .ensureAlpha()
    .png()
    .toBuffer();

  // 5. Wappen mit der Nummer-Maske maskieren (nur innerhalb der Ziffern sichtbar)
  const maskedCrest = await sharp(crestResized)
    .composite([{
      input: mask,
      blend: "dest-in" // Nur dort sichtbar wo die Maske weiß ist
    }])
    .png()
    .toBuffer();
  
  console.log("Crest masked with number shape");

  // 6. Opacity anwenden
  let finalCrest = maskedCrest;
  if (opacity < 1) {
    const opacityValue = Math.round(opacity * 255);
    finalCrest = await sharp(maskedCrest)
      .composite([{
        input: Buffer.from([0, 0, 0, opacityValue]),
        raw: { width: 1, height: 1, channels: 4 },
        tile: true,
        blend: "dest-in"
      }])
      .png()
      .toBuffer();
  }

  // 7. Maskiertes Wappen auf das Originalbild an der richtigen Position compositen
  const result = await sharp(baseBuffer)
    .composite([{
      input: finalCrest,
      left: bbox.left,
      top: bbox.top,
      blend: "over"
    }])
    .png()
    .toBuffer();

  console.log("=== compositeCrestInNumber DONE ===");
  return result;
}
