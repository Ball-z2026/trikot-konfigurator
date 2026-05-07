/**
 * Crest-in-Number Compositing Service
 * 
 * Compositet das Vereinswappen als Textur IN die Rückennummer-Ziffern.
 * 
 * Ansatz:
 * 1. Schneide den Rückenbereich aus dem generierten Bild aus (rechte Hälfte bei Front+Back-Ansicht)
 * 2. Verwende LLM-Vision um die exakte Bounding-Box der Rückennummer zu finden
 * 3. Extrahiere die Nummer-Pixel als Alpha-Maske (die Ziffern sind die "Fenster")
 * 4. Fülle die Ziffern-Bereiche mit dem Wappen-Bild (Clipping-Mask-Effekt)
 * 5. Composite das Ergebnis zurück auf das Originalbild
 */
import sharp from "sharp";
import axios from "axios";
import { invokeLLM } from "./_core/llm";

/**
 * Lädt ein Bild von einer URL und gibt es als Buffer zurück
 */
async function fetchImageBuffer(url: string): Promise<Buffer> {
  const response = await axios.get(url, { responseType: "arraybuffer", timeout: 15000 });
  return Buffer.from(response.data);
}

/**
 * Verwendet LLM-Vision um die Bounding-Box der Rückennummer im Bild zu finden.
 * Gibt die Box als Prozent-Koordinaten zurück.
 */
async function detectNumberBoundingBox(imageUrl: string): Promise<{
  x: number; y: number; width: number; height: number;
} | null> {
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "You are an image analysis assistant. You detect the bounding box of the large back number on a sports jersey. Return ONLY a JSON object with x, y, width, height as percentages (0-100) of the image dimensions. The back number is typically the large number in the center-back area of the jersey."
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Find the large BACK NUMBER (Rückennummer) on this jersey image. Return the bounding box as JSON: {\"x\": percent_from_left, \"y\": percent_from_top, \"width\": percent_width, \"height\": percent_height}. Only the large back number, not front number or any text. If you see front and back view side by side, analyze ONLY the RIGHT jersey (back view)."
            },
            {
              type: "image_url",
              image_url: { url: imageUrl, detail: "high" }
            }
          ]
        }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "number_bbox",
          strict: true,
          schema: {
            type: "object",
            properties: {
              x: { type: "number", description: "Left edge as percentage (0-100)" },
              y: { type: "number", description: "Top edge as percentage (0-100)" },
              width: { type: "number", description: "Width as percentage (0-100)" },
              height: { type: "number", description: "Height as percentage (0-100)" }
            },
            required: ["x", "y", "width", "height"],
            additionalProperties: false
          }
        }
      }
    });

    const content = response.choices?.[0]?.message?.content;
    if (!content || typeof content !== 'string') return null;
    
    const bbox = JSON.parse(content);
    // Validierung
    if (bbox.x >= 0 && bbox.y >= 0 && bbox.width > 0 && bbox.height > 0 &&
        bbox.x + bbox.width <= 100 && bbox.y + bbox.height <= 100) {
      return bbox;
    }
    return null;
  } catch (err) {
    console.error("Number detection failed:", err);
    return null;
  }
}

/**
 * Erstellt eine Alpha-Maske aus den Nummern-Ziffern.
 * Die Ziffern sind typischerweise eine kontrastierende Farbe zum Trikot-Hintergrund.
 * Wir isolieren die Ziffern durch Kontrast-Erkennung.
 */
async function createNumberMask(
  imageBuffer: Buffer,
  bbox: { x: number; y: number; width: number; height: number }
): Promise<{ mask: Buffer; cropLeft: number; cropTop: number; cropWidth: number; cropHeight: number }> {
  const metadata = await sharp(imageBuffer).metadata();
  const imgWidth = metadata.width || 1024;
  const imgHeight = metadata.height || 1024;

  // Bounding-Box in Pixel umrechnen
  const cropLeft = Math.round((bbox.x / 100) * imgWidth);
  const cropTop = Math.round((bbox.y / 100) * imgHeight);
  const cropWidth = Math.round((bbox.width / 100) * imgWidth);
  const cropHeight = Math.round((bbox.height / 100) * imgHeight);

  // Nummer-Bereich ausschneiden
  const numberRegion = await sharp(imageBuffer)
    .extract({ left: cropLeft, top: cropTop, width: cropWidth, height: cropHeight })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { data, info } = numberRegion;
  const channels = info.channels;
  const pixelCount = info.width * info.height;

  // Durchschnittsfarbe des Randes berechnen (= Trikot-Hintergrund)
  // Nimm die äußeren 10% Pixel als Referenz für den Hintergrund
  let bgR = 0, bgG = 0, bgB = 0, bgCount = 0;
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      const isEdge = x < info.width * 0.08 || x > info.width * 0.92 ||
                     y < info.height * 0.05 || y > info.height * 0.95;
      if (isEdge) {
        const idx = (y * info.width + x) * channels;
        bgR += data[idx];
        bgG += data[idx + 1];
        bgB += data[idx + 2];
        bgCount++;
      }
    }
  }
  bgR = Math.round(bgR / bgCount);
  bgG = Math.round(bgG / bgCount);
  bgB = Math.round(bgB / bgCount);

  // Maske erstellen: Pixel die NICHT dem Hintergrund ähneln = Nummer-Pixel
  const maskData = Buffer.alloc(pixelCount);
  const threshold = 60; // Farbabstand-Schwelle

  for (let i = 0; i < pixelCount; i++) {
    const idx = i * channels;
    const r = data[idx];
    const g = data[idx + 1];
    const b = data[idx + 2];
    
    // Euklidischer Farbabstand
    const dist = Math.sqrt(
      Math.pow(r - bgR, 2) + Math.pow(g - bgG, 2) + Math.pow(b - bgB, 2)
    );
    
    // Wenn der Pixel deutlich anders als der Hintergrund ist → Nummer-Pixel
    maskData[i] = dist > threshold ? 255 : 0;
  }

  // Maske glätten (Erosion + Dilation für saubere Kanten)
  const mask = await sharp(maskData, { raw: { width: info.width, height: info.height, channels: 1 } })
    .blur(1.2) // Leichte Glättung
    .threshold(128) // Wieder binär machen
    .png()
    .toBuffer();

  return { mask, cropLeft, cropTop, cropWidth, cropHeight };
}

/**
 * Hauptfunktion: Compositet das Vereinswappen IN die Rückennummer-Ziffern.
 * 
 * @param baseImageUrl - URL des KI-generierten Trikot-Bildes (Front+Back nebeneinander)
 * @param crestImageUrl - URL des Vereinswappens
 * @param opacity - Opacity des Wappens innerhalb der Nummer (0-1, default 0.7)
 * @returns Buffer des fertigen Bildes
 */
export async function compositeCrestInNumber(
  baseImageUrl: string,
  crestImageUrl: string,
  opacity: number = 0.7
): Promise<Buffer> {
  // 1. Bilder laden
  const baseBuffer = await fetchImageBuffer(baseImageUrl);
  const crestBuffer = await fetchImageBuffer(crestImageUrl);
  
  // 2. Rückennummer-Position finden via LLM-Vision
  const bbox = await detectNumberBoundingBox(baseImageUrl);
  if (!bbox) {
    console.warn("Could not detect back number position, returning original image");
    return baseBuffer;
  }

  console.log("Detected number bbox:", bbox);

  // 3. Nummer-Maske erstellen
  const { mask, cropLeft, cropTop, cropWidth, cropHeight } = await createNumberMask(baseBuffer, bbox);

  // 4. Wappen auf die Größe der Nummer-Box skalieren
  const crestResized = await sharp(crestBuffer)
    .resize(cropWidth, cropHeight, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  // 5. Wappen mit der Nummer-Maske maskieren (nur innerhalb der Ziffern sichtbar)
  // Erst die Maske als Alpha-Kanal auf das Wappen anwenden
  const maskedCrest = await sharp(crestResized)
    .ensureAlpha()
    .composite([{
      input: mask,
      blend: "dest-in" // Nur dort sichtbar wo die Maske weiß ist
    }])
    .png()
    .toBuffer();

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
      left: cropLeft,
      top: cropTop,
      blend: "over"
    }])
    .png()
    .toBuffer();

  return result;
}
