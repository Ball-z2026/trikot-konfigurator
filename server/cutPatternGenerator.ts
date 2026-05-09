/**
 * Cut Pattern Generator V3 – Korrekter Produktions-Workflow
 * 
 * Basiert auf dem funktionierenden full_workflow.py und test_b.py:
 * 1. KI generiert EIN Stoffmuster (oder nutzt bestehendes Bild als Referenz)
 * 2. Masken werden aus den echten Schnittmuster-PNGs extrahiert (part_7, part_8, etc.)
 * 3. Stoffmuster wird auf die Gesamtfläche skaliert (Vorder+Rückseite nebeneinander → Seitennaht passt)
 * 4. Teile werden mit den Masken zugeschnitten
 * 5. Post-Processing: Wappen, Nummer, Name, Sponsor per Compositing drauf
 * 6. Druckbögen mit 1cm Beschnitt und Schnittmarken
 * 
 * Templates: /home/ubuntu/trikot-parts/part_*.png (Größe L, aus L_aufbereitet.pdf)
 * Mapping:
 *   part_7.png = RÜCKTEIL (V-Ausschnitt) – 1679×2260
 *   part_8.png = VORDERTEIL (U-Rundhals) – 1679×2266
 *   part_2.png = ÄRMEL 1 – 1380×764
 *   part_4.png = ÄRMEL 2 – 1380×764
 *   part_6.png = KRAGEN – 1457×210
 *   part_3.png = BÜNDCHEN 1 – 1139×223
 *   part_5.png = BÜNDCHEN 2 – 1139×223
 */
import sharp from "sharp";
import { generateImage } from "./_core/imageGeneration";
import { storagePut, storageGet, storageGetSignedUrl } from "./storage";
import path from "path";
import fs from "fs";

// ═══════════════════════════════════════════════════════════════
// TYPEN
// ═══════════════════════════════════════════════════════════════

export type CutPart =
  | "vorderteil"
  | "rueckteil"
  | "aermel_links"
  | "aermel_rechts"
  | "kragen"
  | "buendchen_1"
  | "buendchen_2";

/** Konfiguration pro Schnittteil */
interface PartTemplate {
  /** Pfad zur PNG-Datei (Schnittmuster-Template) */
  templateFile: string;
  /** Storage-URL des Templates (für deployed Umgebung) */
  storageUrl: string;
  /** Breite in Pixel */
  width: number;
  /** Höhe in Pixel */
  height: number;
  /** Beschreibung */
  label: string;
}

export interface CutPatternConfig {
  /** Sportart */
  sport: string;
  /** Design-Stil */
  designStyle: string;
  /** Primärfarbe (Hex) */
  primaryColor: string;
  /** Sekundärfarbe (Hex) */
  secondaryColor: string;
  /** Akzentfarbe (Hex) */
  accentColor: string;
  /** Vereinsname */
  clubName?: string;
  /** Zusätzliche Design-Notizen */
  additionalNotes?: string;
  /** Welche Teile generiert werden sollen */
  parts: CutPart[];
  /** Referenzbilder (Straßenkarte, Wahrzeichen-Silhouette etc.) */
  referenceImageUrls?: string[];
  /** Straßenkarte als Wasserzeichen (URL) */
  streetMapUrl?: string;
  /** Vereinswappen-URL */
  crestUrl?: string;
  /** Vereinswappen-Deckkraft auf Rückseite (0-100, default 20) */
  crestWatermarkOpacity?: number;
  /** Dominante Farben des Vereinswappens */
  crestDominantColors?: string[];
  /** Sublimationsbereiche */
  sublimationAreas?: string[];
  /** Hashtag */
  hashtag?: string;
  /** Bereits generiertes Trikot-Bild als Referenz für Stil */
  sourceImageUrl?: string;
  /** Koordinaten-Text */
  coordinatesText?: string;
  /** Brustsponsor-Logo URL */
  chestSponsorUrl?: string;
  /** Rückensponsor-Logo URL */
  backSponsorUrl?: string;
  /** Ärmel-Sponsor-Logo URL */
  sleeveSponsorUrl?: string;
  /** Spielernummer (für Brust und Rücken) */
  playerNumber?: string;
  /** Spielername (für Rücken) */
  playerName?: string;
  /** Schriftart für Nummer */
  numberFont?: string;
  /** Schriftart für Name */
  nameFont?: string;
  /** Schriftfarbe (Hex) */
  fontColor?: string;
  /** Wahrzeichen-Silhouette URL (für Wasserzeichen) */
  landmarkSilhouetteUrl?: string;
  /** Wahrzeichen-Deckkraft (0-100) */
  landmarkOpacity?: number;
}

export interface CutPatternResult {
  part: CutPart;
  /** URL des generierten Musters (rein, ohne Overlays) */
  patternUrl: string;
  /** URL des fertigen Bildes (mit Logos/Overlays) */
  compositeUrl: string;
  /** Ob die Kontrast-Logik eingegriffen hat */
  contrastAdjusted: boolean;
}

// ═══════════════════════════════════════════════════════════════
// KONSTANTEN
// ═══════════════════════════════════════════════════════════════

/** Druckparameter */
const DPI = 200;
const BESCHNITT_CM = 1.0;
const BESCHNITT_PX = Math.round(BESCHNITT_CM * DPI / 2.54); // ~79px

/** Template-Dateien (lokal im Sandbox-Dateisystem) */
const TEMPLATE_DIR = "/home/ubuntu/trikot-parts";

/** Template-Konfiguration */
const PART_TEMPLATES: Record<CutPart, PartTemplate> = {
  vorderteil: {
    templateFile: path.join(TEMPLATE_DIR, "part_8.png"), // U-Rundhals
    storageUrl: "/manus-storage/part_8_495d6327.png",
    width: 1679,
    height: 2266,
    label: "Vorderteil (U-Rundhals)",
  },
  rueckteil: {
    templateFile: path.join(TEMPLATE_DIR, "part_7.png"), // V-Ausschnitt
    storageUrl: "/manus-storage/part_7_8670f9e0.png",
    width: 1679,
    height: 2260,
    label: "Rückteil (V-Ausschnitt)",
  },
  aermel_links: {
    templateFile: path.join(TEMPLATE_DIR, "part_2.png"),
    storageUrl: "/manus-storage/part_2_68af941e.png",
    width: 1380,
    height: 764,
    label: "Ärmel Links",
  },
  aermel_rechts: {
    templateFile: path.join(TEMPLATE_DIR, "part_4.png"),
    storageUrl: "/manus-storage/part_4_4d71c439.png",
    width: 1380,
    height: 764,
    label: "Ärmel Rechts",
  },
  kragen: {
    templateFile: path.join(TEMPLATE_DIR, "part_6.png"),
    storageUrl: "/manus-storage/part_6_bd67327a.png",
    width: 1457,
    height: 210,
    label: "Kragen",
  },
  buendchen_1: {
    templateFile: path.join(TEMPLATE_DIR, "part_3.png"),
    storageUrl: "/manus-storage/part_3_c36fea9e.png",
    width: 1139,
    height: 223,
    label: "Bündchen Links",
  },
  buendchen_2: {
    templateFile: path.join(TEMPLATE_DIR, "part_5.png"),
    storageUrl: "/manus-storage/part_5_d1d2cb3b.png",
    width: 1139,
    height: 223,
    label: "Bündchen Rechts",
  },
};

// ═══════════════════════════════════════════════════════════════
// HILFSFUNKTIONEN
// ═══════════════════════════════════════════════════════════════

/**
 * Erstellt eine Maske aus einem Schnittmuster-PNG.
 * Die Schnittmuster haben dünne graue Linien auf weißem Hintergrund.
 * Die INNENFLÄCHE (weiß innerhalb der Kontur) wird als Maske extrahiert.
 * 
 * Algorithmus (wie in test_b.py):
 * 1. Bild in Graustufen laden
 * 2. Binärisieren: Linien = schwarz, Rest = weiß
 * 3. Linien verdicken (Dilatation)
 * 4. Flood-Fill von den Rändern → Außenbereich markieren
 * 5. Alles was NICHT außen und NICHT Linie ist = Innenfläche = Maske
 */
async function createMaskFromTemplate(templatePath: string): Promise<Buffer> {
  // Lade das Template als Graustufen-Bild
  const templateBuffer = fs.readFileSync(templatePath);
  const { data, info } = await sharp(templateBuffer)
    .grayscale()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const width = info.width;
  const height = info.height;
  const pixels = new Uint8Array(data);

  // Schritt 1: Binärisieren – Linien (dunkel < 200) vs. Hintergrund (hell > 200)
  const THRESHOLD = 200;
  const isLine = new Uint8Array(width * height);
  for (let i = 0; i < pixels.length; i++) {
    isLine[i] = pixels[i] < THRESHOLD ? 1 : 0;
  }

  // Schritt 2: Linien verdicken (3px Radius Dilatation)
  const DILATE_RADIUS = 4;
  const thickLines = new Uint8Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (isLine[y * width + x] === 1) {
        // Verdicke diese Linie
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

  // Schritt 3: Flood-Fill von allen Randpixeln → Außenbereich markieren
  const isOutside = new Uint8Array(width * height); // 0 = unbekannt, 1 = außen
  const queue: number[] = [];

  // Alle Randpixel die NICHT Linie sind als Startpunkte
  for (let x = 0; x < width; x++) {
    if (thickLines[x] === 0) { // Oberer Rand
      queue.push(x);
      isOutside[x] = 1;
    }
    const bottomIdx = (height - 1) * width + x;
    if (thickLines[bottomIdx] === 0) { // Unterer Rand
      queue.push(bottomIdx);
      isOutside[bottomIdx] = 1;
    }
  }
  for (let y = 0; y < height; y++) {
    const leftIdx = y * width;
    if (thickLines[leftIdx] === 0) { // Linker Rand
      queue.push(leftIdx);
      isOutside[leftIdx] = 1;
    }
    const rightIdx = y * width + (width - 1);
    if (thickLines[rightIdx] === 0) { // Rechter Rand
      queue.push(rightIdx);
      isOutside[rightIdx] = 1;
    }
  }

  // BFS Flood-Fill
  let queueIdx = 0;
  while (queueIdx < queue.length) {
    const idx = queue[queueIdx++];
    const x = idx % width;
    const y = Math.floor(idx / width);

    const neighbors = [
      [x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1],
    ];

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

  // Schritt 4: Maske erstellen – Innenfläche = NICHT außen UND NICHT Linie
  const mask = Buffer.alloc(width * height);
  for (let i = 0; i < width * height; i++) {
    mask[i] = (isOutside[i] === 0 && thickLines[i] === 0) ? 255 : 0;
  }

  // Auch die verdickten Linien die INNERHALB liegen zur Maske hinzufügen
  // (die originalen Linien sollen auch Teil des Druckbereichs sein)
  for (let i = 0; i < width * height; i++) {
    if (thickLines[i] === 1 && isOutside[i] === 0) {
      mask[i] = 255;
    }
  }

  // Als PNG-Buffer zurückgeben
  return sharp(mask, { raw: { width, height, channels: 1 } })
    .png()
    .toBuffer();
}

/**
 * Löst Storage-URLs auf (signierte URLs holen).
 */
async function resolveStorageUrl(url: string): Promise<string> {
  if (url.includes("/manus-storage/") || url.includes("/api/storage-proxy/")) {
    const keyMatch = url.match(/(?:\/manus-storage\/|\/api\/storage-proxy\/)(.+)/);
    if (keyMatch) {
      return await storageGetSignedUrl(keyMatch[1]);
    }
  }
  return url;
}

/**
 * Baut den KI-Prompt für das Stoffmuster auf.
 */
function buildFabricPrompt(config: CutPatternConfig): string {
  const sportMap: Record<string, string> = {
    fussball: "soccer",
    handball: "handball",
    basketball: "basketball",
    volleyball: "volleyball",
  };
  const sportEn = sportMap[config.sport] || "soccer";

  let prompt = `Generate a SEAMLESS FLAT FABRIC PATTERN for a ${sportEn} jersey sublimation print. `;
  prompt += `This is ONLY the fabric texture/pattern – NOT a garment shape, NOT a mockup, NOT a person. `;
  prompt += `The output should be a RECTANGULAR tile of decorative fabric pattern that can be applied to cut pieces. `;
  prompt += `Design style: ${config.designStyle}. `;
  prompt += `Color palette: Primary ${config.primaryColor}, Secondary ${config.secondaryColor}, Accent ${config.accentColor}. `;
  prompt += `The pattern should be dynamic and bold (stripes, gradients, geometric shapes, or organic flowing patterns). `;
  prompt += `The pattern should work well when applied to different garment pieces (body, sleeves, collar). `;
  prompt += `The pattern MUST fill the ENTIRE canvas edge to edge with NO empty/white areas. `;

  if (config.streetMapUrl) {
    prompt += `Incorporate the street map pattern from the reference image as a subtle texture woven into the fabric design. `;
  }

  prompt += `\n\nSTRICT RULES: `;
  prompt += `• ABSOLUTELY NO TEXT, letters, numbers, names, or placeholders. `;
  prompt += `• ABSOLUTELY NO LOGOS, crests, emblems, or brand marks. `;
  prompt += `• ABSOLUTELY NO garment shapes or silhouettes – ONLY flat rectangular pattern. `;
  prompt += `• NO manufacturer branding. `;
  prompt += `• Output is ONLY a flat rectangular fabric pattern/texture filling the entire canvas. `;
  prompt += `High resolution, print-ready quality, seamless repeatable pattern. `;

  if (config.additionalNotes) {
    prompt += `Additional design notes: ${config.additionalNotes}. `;
  }

  return prompt;
}

/**
 * Erstellt einen Druckbogen mit Beschnitt und Schnittmarken.
 * Basiert auf create_print_sheet() aus full_workflow.py.
 */
async function createPrintSheet(imageBuffer: Buffer, partWidth: number, partHeight: number): Promise<Buffer> {
  const sheetWidth = partWidth + 2 * BESCHNITT_PX;
  const sheetHeight = partHeight + 2 * BESCHNITT_PX;

  // Erstelle weißen Hintergrund
  const sheet = sharp({
    create: {
      width: sheetWidth,
      height: sheetHeight,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    },
  }).png();

  // Hauptbild in der Mitte platzieren
  // Für den Beschnitt: Randpixel des Bildes werden nach außen wiederholt
  // Das machen wir indem wir das Bild etwas größer skalieren und dann croppen
  const extendedBuffer = await sharp(imageBuffer)
    .extend({
      top: BESCHNITT_PX,
      bottom: BESCHNITT_PX,
      left: BESCHNITT_PX,
      right: BESCHNITT_PX,
      extendWith: "mirror", // Randpixel spiegeln für nahtlosen Beschnitt
    })
    .png()
    .toBuffer();

  // Schnittmarken als SVG-Overlay
  const markLen = Math.round(0.5 * DPI / 2.54); // 5mm
  const markColor = "black";
  const markWidth = 2;

  const markersSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${sheetWidth}" height="${sheetHeight}">
    <!-- Oben-links -->
    <line x1="${BESCHNITT_PX}" y1="0" x2="${BESCHNITT_PX}" y2="${markLen}" stroke="${markColor}" stroke-width="${markWidth}"/>
    <line x1="0" y1="${BESCHNITT_PX}" x2="${markLen}" y2="${BESCHNITT_PX}" stroke="${markColor}" stroke-width="${markWidth}"/>
    <!-- Oben-rechts -->
    <line x1="${BESCHNITT_PX + partWidth}" y1="0" x2="${BESCHNITT_PX + partWidth}" y2="${markLen}" stroke="${markColor}" stroke-width="${markWidth}"/>
    <line x1="${sheetWidth - markLen}" y1="${BESCHNITT_PX}" x2="${sheetWidth}" y2="${BESCHNITT_PX}" stroke="${markColor}" stroke-width="${markWidth}"/>
    <!-- Unten-links -->
    <line x1="${BESCHNITT_PX}" y1="${sheetHeight - markLen}" x2="${BESCHNITT_PX}" y2="${sheetHeight}" stroke="${markColor}" stroke-width="${markWidth}"/>
    <line x1="0" y1="${BESCHNITT_PX + partHeight}" x2="${markLen}" y2="${BESCHNITT_PX + partHeight}" stroke="${markColor}" stroke-width="${markWidth}"/>
    <!-- Unten-rechts -->
    <line x1="${BESCHNITT_PX + partWidth}" y1="${sheetHeight - markLen}" x2="${BESCHNITT_PX + partWidth}" y2="${sheetHeight}" stroke="${markColor}" stroke-width="${markWidth}"/>
    <line x1="${sheetWidth - markLen}" y1="${BESCHNITT_PX + partHeight}" x2="${sheetWidth}" y2="${BESCHNITT_PX + partHeight}" stroke="${markColor}" stroke-width="${markWidth}"/>
  </svg>`;

  // Zusammensetzen: Erweitertes Bild + Schnittmarken
  const result = await sharp(extendedBuffer)
    .resize(sheetWidth, sheetHeight, { fit: "cover" })
    .composite([{
      input: Buffer.from(markersSvg),
      top: 0,
      left: 0,
    }])
    .png()
    .toBuffer();

  return result;
}

// ═══════════════════════════════════════════════════════════════
// POST-PROCESSING: Elemente auf Schnittteile legen
// ═══════════════════════════════════════════════════════════════

/**
 * Lädt ein Bild von einer URL und gibt es als Buffer zurück.
 */
async function fetchImageBuffer(url: string): Promise<Buffer> {
  let resolvedUrl = url;
  if (url.includes("/manus-storage/")) {
    const keyMatch = url.match(/\/manus-storage\/(.+)/);
    if (keyMatch) {
      resolvedUrl = await storageGetSignedUrl(keyMatch[1]);
    }
  }
  const response = await fetch(resolvedUrl);
  if (!response.ok) throw new Error(`Failed to fetch image: ${response.status}`);
  return Buffer.from(await response.arrayBuffer());
}

/**
 * Erstellt ein Text-Overlay als SVG-Buffer.
 * Positionierung in Prozent relativ zur Teil-Größe.
 */
function createTextSvg(
  text: string,
  width: number,
  height: number,
  options: {
    posXPercent: number; // X-Position (linke Kante) in % der Breite
    posYPercent: number; // Y-Position (obere Kante) in % der Höhe
    widthPercent: number; // Breite der Zone in % der Gesamtbreite
    heightPercent: number; // Höhe der Zone in % der Gesamthöhe
    color?: string;
    fontFamily?: string;
    fontWeight?: string;
    textAnchor?: "start" | "middle" | "end";
  }
): Buffer {
  const x = Math.round(width * options.posXPercent / 100);
  const y = Math.round(height * options.posYPercent / 100);
  const zoneW = Math.round(width * options.widthPercent / 100);
  const zoneH = Math.round(height * options.heightPercent / 100);
  const fontSize = Math.round(zoneH * 0.85); // 85% der Zonenhöhe als Schriftgröße
  const color = options.color || "#000000";
  const fontFamily = options.fontFamily || "Arial, sans-serif";
  const fontWeight = options.fontWeight || "bold";
  const anchor = options.textAnchor || "middle";

  // Textposition: Mitte der Zone
  const textX = anchor === "middle" ? x + zoneW / 2 : x;
  const textY = y + zoneH / 2 + fontSize * 0.35; // Vertikale Zentrierung

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
    <text x="${textX}" y="${textY}" 
      font-family="${fontFamily}" font-size="${fontSize}" font-weight="${fontWeight}"
      fill="${color}" text-anchor="${anchor}" 
      letter-spacing="2">${escapeXml(text)}</text>
  </svg>`;

  return Buffer.from(svg);
}

/** Escaped XML-Sonderzeichen */
function escapeXml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/**
 * Wendet pro-Teil-spezifische Overlays auf das zugeschnittene Muster an.
 * 
 * VORDERTEIL:
 * - Vereinswappen (Herzseite, rechts im Bild = links am Träger)
 * - Brustnummer (links im Bild = rechte Brust des Trägers)
 * - Brustsponsor (mittig)
 * - Straßenkarte als Wasserzeichen (wenn gewählt)
 * - Wahrzeichen-Silhouette (wenn gewählt)
 * 
 * RÜCKTEIL:
 * - Vereinsname (oben)
 * - Rückennummer (groß, mittig)
 * - Spielername (unter Nummer)
 * - Wappen-Wasserzeichen (20% Deckkraft)
 * - Rückensponsor (unten)
 * - Koordinaten (wenn gewählt)
 * 
 * ÄRMEL:
 * - Ärmel-Sponsor (wenn vorhanden)
 * 
 * KRAGEN/BÜNDCHEN:
 * - Nur Muster (keine Overlays)
 */
async function applyPartOverlays(
  maskedBuffer: Buffer,
  partName: CutPart,
  config: CutPatternConfig,
  template: PartTemplate
): Promise<Buffer> {
  const { width, height } = template;
  const composites: sharp.OverlayOptions[] = [];

  // ═══ VORDERTEIL ═══
  if (partName === "vorderteil") {
    // Straßenkarte als Wasserzeichen (Hintergrund, 15% Deckkraft)
    if (config.streetMapUrl) {
      try {
        const mapBuffer = await fetchImageBuffer(config.streetMapUrl);
        const mapOverlay = await sharp(mapBuffer)
          .resize(Math.round(width * 0.6), Math.round(height * 0.5), { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
          .ensureAlpha()
          .modulate({ brightness: 1 })
          .png()
          .toBuffer();
        // Deckkraft reduzieren
        const mapWithOpacity = await sharp(mapOverlay)
          .composite([{ input: Buffer.from([0, 0, 0, Math.round(255 * 0.15)]), raw: { width: 1, height: 1, channels: 4 }, blend: "dest-in", tile: true }])
          .png()
          .toBuffer();
        composites.push({
          input: mapWithOpacity,
          left: Math.round(width * 0.2),
          top: Math.round(height * 0.25),
        });
      } catch (e) { console.warn("[CutPattern] Straßenkarte-Overlay fehlgeschlagen:", e); }
    }

    // Wahrzeichen-Silhouette als Wasserzeichen
    if (config.landmarkSilhouetteUrl) {
      try {
        const landmarkBuffer = await fetchImageBuffer(config.landmarkSilhouetteUrl);
        const opacity = (config.landmarkOpacity || 15) / 100;
        const landmarkOverlay = await sharp(landmarkBuffer)
          .resize(Math.round(width * 0.4), Math.round(height * 0.35), { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
          .ensureAlpha()
          .png()
          .toBuffer();
        const landmarkWithOpacity = await sharp(landmarkOverlay)
          .composite([{ input: Buffer.from([0, 0, 0, Math.round(255 * opacity)]), raw: { width: 1, height: 1, channels: 4 }, blend: "dest-in", tile: true }])
          .png()
          .toBuffer();
        composites.push({
          input: landmarkWithOpacity,
          left: Math.round(width * 0.3),
          top: Math.round(height * 0.55),
        });
      } catch (e) { console.warn("[CutPattern] Wahrzeichen-Overlay fehlgeschlagen:", e); }
    }

    // Vereinswappen (Herzseite = rechts im Bild, posX=60%, posY=26%, 12%×10%)
    if (config.crestUrl) {
      try {
        const crestBuffer = await fetchImageBuffer(config.crestUrl);
        const crestW = Math.round(width * 0.12);
        const crestH = Math.round(height * 0.10);
        const crestOverlay = await sharp(crestBuffer)
          .resize(crestW, crestH, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
          .png()
          .toBuffer();
        composites.push({
          input: crestOverlay,
          left: Math.round(width * 0.60),
          top: Math.round(height * 0.26),
        });
      } catch (e) { console.warn("[CutPattern] Wappen-Overlay fehlgeschlagen:", e); }
    }

    // Brustnummer (links im Bild = rechte Brust, posX=30%, posY=25%, 15%×12%)
    if (config.playerNumber) {
      const numberSvg = createTextSvg(config.playerNumber, width, height, {
        posXPercent: 30,
        posYPercent: 25,
        widthPercent: 15,
        heightPercent: 12,
        color: config.fontColor || "#000000",
        fontFamily: config.numberFont || "Arial Black, sans-serif",
      });
      composites.push({ input: numberSvg, top: 0, left: 0 });
    }

    // Brustsponsor (mittig, posX=25%, posY=45%, 50%×12%)
    if (config.chestSponsorUrl) {
      try {
        const sponsorBuffer = await fetchImageBuffer(config.chestSponsorUrl);
        const sponsorW = Math.round(width * 0.50);
        const sponsorH = Math.round(height * 0.12);
        const sponsorOverlay = await sharp(sponsorBuffer)
          .resize(sponsorW, sponsorH, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
          .png()
          .toBuffer();
        composites.push({
          input: sponsorOverlay,
          left: Math.round(width * 0.25),
          top: Math.round(height * 0.45),
        });
      } catch (e) { console.warn("[CutPattern] Brustsponsor-Overlay fehlgeschlagen:", e); }
    }
  }

  // ═══ RÜCKTEIL ═══
  if (partName === "rueckteil") {
    // Wappen-Wasserzeichen (mittig, 20% Deckkraft)
    if (config.crestUrl) {
      try {
        const crestBuffer = await fetchImageBuffer(config.crestUrl);
        const wmW = Math.round(width * 0.35);
        const wmH = Math.round(height * 0.30);
        const crestOverlay = await sharp(crestBuffer)
          .resize(wmW, wmH, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
          .ensureAlpha()
          .png()
          .toBuffer();
        const opacity = (config.crestWatermarkOpacity || 20) / 100;
        const crestWithOpacity = await sharp(crestOverlay)
          .composite([{ input: Buffer.from([0, 0, 0, Math.round(255 * opacity)]), raw: { width: 1, height: 1, channels: 4 }, blend: "dest-in", tile: true }])
          .png()
          .toBuffer();
        composites.push({
          input: crestWithOpacity,
          left: Math.round((width - wmW) / 2),
          top: Math.round((height - wmH) / 2),
        });
      } catch (e) { console.warn("[CutPattern] Wappen-Wasserzeichen fehlgeschlagen:", e); }
    }

    // Vereinsname (oben, Y=21%, zentriert)
    if (config.clubName) {
      const clubNameSvg = createTextSvg(config.clubName, width, height, {
        posXPercent: 28,
        posYPercent: 21,
        widthPercent: 45,
        heightPercent: 9,
        color: config.fontColor || "#000000",
        fontFamily: config.nameFont || "Arial, sans-serif",
        fontWeight: "bold",
        textAnchor: "middle",
      });
      composites.push({ input: clubNameSvg, top: 0, left: 0 });
    }

    // Rückennummer (groß, mittig, Y=32%, Höhe=29%)
    if (config.playerNumber) {
      const numberSvg = createTextSvg(config.playerNumber, width, height, {
        posXPercent: 30,
        posYPercent: 32,
        widthPercent: 40,
        heightPercent: 29,
        color: config.fontColor || "#000000",
        fontFamily: config.numberFont || "Arial Black, sans-serif",
        textAnchor: "middle",
      });
      composites.push({ input: numberSvg, top: 0, left: 0 });
    }

    // Spielername (unter Nummer, Y=63%)
    if (config.playerName) {
      const nameSvg = createTextSvg(config.playerName, width, height, {
        posXPercent: 28,
        posYPercent: 63,
        widthPercent: 45,
        heightPercent: 9,
        color: config.fontColor || "#000000",
        fontFamily: config.nameFont || "Arial, sans-serif",
        fontWeight: "bold",
        textAnchor: "middle",
      });
      composites.push({ input: nameSvg, top: 0, left: 0 });
    }

    // Koordinaten (klein, unter dem Spielernamen)
    if (config.coordinatesText) {
      const coordSvg = createTextSvg(config.coordinatesText, width, height, {
        posXPercent: 30,
        posYPercent: 73,
        widthPercent: 40,
        heightPercent: 4,
        color: config.fontColor || "#000000",
        fontFamily: "monospace",
        fontWeight: "normal",
        textAnchor: "middle",
      });
      composites.push({ input: coordSvg, top: 0, left: 0 });
    }

    // Hashtag (unter Koordinaten)
    if (config.hashtag) {
      const hashSvg = createTextSvg(config.hashtag, width, height, {
        posXPercent: 30,
        posYPercent: 77,
        widthPercent: 40,
        heightPercent: 4,
        color: config.fontColor || "#000000",
        fontFamily: "Arial, sans-serif",
        fontWeight: "normal",
        textAnchor: "middle",
      });
      composites.push({ input: hashSvg, top: 0, left: 0 });
    }

    // Rückensponsor (unten, Y=82%)
    if (config.backSponsorUrl) {
      try {
        const sponsorBuffer = await fetchImageBuffer(config.backSponsorUrl);
        const sponsorW = Math.round(width * 0.50);
        const sponsorH = Math.round(height * 0.10);
        const sponsorOverlay = await sharp(sponsorBuffer)
          .resize(sponsorW, sponsorH, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
          .png()
          .toBuffer();
        composites.push({
          input: sponsorOverlay,
          left: Math.round(width * 0.25),
          top: Math.round(height * 0.82),
        });
      } catch (e) { console.warn("[CutPattern] Rückensponsor-Overlay fehlgeschlagen:", e); }
    }
  }

  // ═══ ÄRMEL ═══
  if ((partName === "aermel_links" || partName === "aermel_rechts") && config.sleeveSponsorUrl) {
    try {
      const sponsorBuffer = await fetchImageBuffer(config.sleeveSponsorUrl);
      const sponsorW = Math.round(width * 0.50);
      const sponsorH = Math.round(height * 0.40);
      const sponsorOverlay = await sharp(sponsorBuffer)
        .resize(sponsorW, sponsorH, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toBuffer();
      composites.push({
        input: sponsorOverlay,
        left: Math.round((width - sponsorW) / 2),
        top: Math.round((height - sponsorH) / 2),
      });
    } catch (e) { console.warn("[CutPattern] Ärmel-Sponsor-Overlay fehlgeschlagen:", e); }
  }

  // Wenn keine Overlays → Original zurückgeben
  if (composites.length === 0) {
    return maskedBuffer;
  }

  // Alle Overlays auf das maskierte Bild compositen
  return sharp(maskedBuffer)
    .composite(composites)
    .png()
    .toBuffer();
}

// ═══════════════════════════════════════════════════════════════
// HAUPTFUNKTION
// ═══════════════════════════════════════════════════════════════

/**
 * Generiert alle Schnittmuster-Teile.
 * 
 * Workflow:
 * 1. KI generiert Stoffmuster (oder nutzt Referenzbild)
 * 2. Masken aus echten Schnittmuster-PNGs erstellen
 * 3. Stoffmuster auf Gesamtfläche skalieren (Vorder+Rückseite nebeneinander)
 * 4. Teile mit Masken zuschneiden
 * 5. Post-Processing (Overlays) – wird im Router gemacht
 * 6. Druckbögen mit Beschnitt
 */
export async function generateAllCutPatterns(
  config: CutPatternConfig
): Promise<CutPatternResult[]> {
  console.log("[CutPattern V3] Starting cut pattern generation...");
  console.log(`[CutPattern V3] Parts: ${config.parts.join(", ")}`);

  // ═══ SCHRITT 1: Stoffmuster generieren oder aus Referenz ableiten ═══
  let fabricBuffer: Buffer;

  if (config.sourceImageUrl) {
    console.log("[CutPattern V3] Using source image as reference for fabric pattern...");
    let sourceUrl = config.sourceImageUrl;
    if (sourceUrl.includes("/manus-storage/")) {
      const keyMatch = sourceUrl.match(/\/manus-storage\/(.+)/);
      if (keyMatch) {
        sourceUrl = await storageGetSignedUrl(keyMatch[1]);
      }
    }

    const fabricPrompt = `Generate a SEAMLESS FLAT FABRIC PATTERN that matches the jersey design shown in the reference image. `
      + `Extract the EXACT same pattern style, colors, and design elements from the reference jersey. `
      + `Create a FLAT, SEAMLESS fabric texture that fills the ENTIRE canvas edge to edge. `
      + `Use the EXACT same colors and geometric/organic shapes as on the reference jersey. `
      + `This is a FLAT fabric swatch – NO jersey shape, NO 3D folds, NO shadows, NO text, NO numbers, NO logos. `
      + `The pattern should cover the ENTIRE surface uniformly with NO empty/white areas. `
      + `High resolution, print-ready quality for sublimation printing.`;

    const fabricResult = await generateImage({
      prompt: fabricPrompt,
      originalImages: [{ url: sourceUrl, mimeType: "image/png" }],
    });

    if (!fabricResult.url) {
      throw new Error("KI-Generierung des Stoffmusters aus Referenz fehlgeschlagen");
    }

    let fabricUrl = fabricResult.url;
    if (fabricUrl.includes("/manus-storage/")) {
      const keyMatch = fabricUrl.match(/\/manus-storage\/(.+)/);
      if (keyMatch) {
        fabricUrl = await storageGetSignedUrl(keyMatch[1]);
      }
    }
    const fabricResponse = await fetch(fabricUrl);
    fabricBuffer = Buffer.from(await fabricResponse.arrayBuffer());

  } else {
    console.log("[CutPattern V3] Generating new fabric pattern...");
    const fabricPrompt = buildFabricPrompt(config);
    console.log(`[CutPattern V3] Prompt: ${fabricPrompt.substring(0, 150)}...`);

    const originalImages: Array<{ url: string; mimeType: string }> = [];

    if (config.streetMapUrl) {
      const resolvedUrl = await resolveStorageUrl(config.streetMapUrl);
      originalImages.push({ url: resolvedUrl, mimeType: "image/png" });
    }

    if (config.referenceImageUrls) {
      for (const imgUrl of config.referenceImageUrls) {
        const resolvedUrl = await resolveStorageUrl(imgUrl);
        originalImages.push({ url: resolvedUrl, mimeType: "image/png" });
      }
    }

    const fabricResult = await generateImage({
      prompt: fabricPrompt,
      originalImages: originalImages.length > 0 ? originalImages : undefined,
    });

    if (!fabricResult.url) {
      throw new Error("KI-Generierung des Stoffmusters fehlgeschlagen");
    }

    let fabricUrl = fabricResult.url;
    if (fabricUrl.includes("/manus-storage/")) {
      const keyMatch = fabricUrl.match(/\/manus-storage\/(.+)/);
      if (keyMatch) {
        fabricUrl = await storageGetSignedUrl(keyMatch[1]);
      }
    }
    const fabricResponse = await fetch(fabricUrl);
    fabricBuffer = Buffer.from(await fabricResponse.arrayBuffer());
  }

  console.log("[CutPattern V3] Fabric pattern obtained, processing parts...");

  // ═══ SCHRITT 2: Stoffmuster auf Gesamtfläche skalieren ═══
  // Layout: Vorderseite + Rückseite nebeneinander (Seitennaht passt!)
  // Darunter: Ärmel nebeneinander
  const vsWidth = PART_TEMPLATES.vorderteil.width;   // 1679
  const vsHeight = PART_TEMPLATES.vorderteil.height; // 2266
  const rsWidth = PART_TEMPLATES.rueckteil.width;    // 1679
  const rsHeight = PART_TEMPLATES.rueckteil.height;  // 2260
  const aeWidth = PART_TEMPLATES.aermel_links.width; // 1380
  const aeHeight = PART_TEMPLATES.aermel_links.height; // 764

  // Gesamtfläche: Vorderseite + Rückseite nebeneinander
  const totalWidth = vsWidth + rsWidth; // 3358
  const totalHeight = Math.max(vsHeight, rsHeight); // 2266

  // Skaliere Stoffmuster auf die Körper-Gesamtfläche
  const scaledFabricBody = await sharp(fabricBuffer)
    .resize(totalWidth, totalHeight, { fit: "cover" })
    .png()
    .toBuffer();

  // Separates Muster für Ärmel (gleicher Stil, andere Proportion)
  const aermelTotalWidth = aeWidth * 2; // 2760 (beide Ärmel nebeneinander)
  const scaledFabricAermel = await sharp(fabricBuffer)
    .resize(aermelTotalWidth, aeHeight, { fit: "cover" })
    .png()
    .toBuffer();

  // Speichere Gesamtmuster für Debugging
  const { url: fullFabricUrl } = await storagePut(
    `ki-designs/fabric-full_${Date.now()}.png`,
    scaledFabricBody,
    "image/png"
  );
  console.log(`[CutPattern V3] Full fabric saved: ${fullFabricUrl}`);

  // ═══ SCHRITT 3: Masken erstellen und Teile zuschneiden ═══
  const results: CutPatternResult[] = [];

  for (const partName of config.parts) {
    const template = PART_TEMPLATES[partName];
    if (!template) {
      console.warn(`[CutPattern V3] Unknown part: ${partName}, skipping`);
      continue;
    }

    console.log(`[CutPattern V3] Processing ${partName} (${template.label})...`);

    // Maske aus dem echten Schnittmuster-PNG erstellen
    let maskBuffer: Buffer;
    try {
      maskBuffer = await createMaskFromTemplate(template.templateFile);
      console.log(`[CutPattern V3] Mask created for ${partName}`);
    } catch (err) {
      console.error(`[CutPattern V3] Failed to create mask for ${partName}:`, err);
      continue;
    }

    // Stoffausschnitt für dieses Teil bestimmen
    let cropBuffer: Buffer;

    if (partName === "vorderteil") {
      // Linke Hälfte des Körper-Musters
      cropBuffer = await sharp(scaledFabricBody)
        .extract({ left: 0, top: 0, width: vsWidth, height: vsHeight })
        .png()
        .toBuffer();
    } else if (partName === "rueckteil") {
      // Rechte Hälfte des Körper-Musters (direkt angrenzend = Seitennaht passt!)
      cropBuffer = await sharp(scaledFabricBody)
        .extract({ left: vsWidth, top: 0, width: rsWidth, height: rsHeight })
        .png()
        .toBuffer();
    } else if (partName === "aermel_links") {
      // Linke Hälfte des Ärmel-Musters
      cropBuffer = await sharp(scaledFabricAermel)
        .extract({ left: 0, top: 0, width: aeWidth, height: aeHeight })
        .png()
        .toBuffer();
    } else if (partName === "aermel_rechts") {
      // Rechte Hälfte des Ärmel-Musters
      cropBuffer = await sharp(scaledFabricAermel)
        .extract({ left: aeWidth, top: 0, width: aeWidth, height: aeHeight })
        .png()
        .toBuffer();
    } else if (partName === "kragen") {
      // Kragen: Aus dem oberen Bereich des Körper-Musters
      cropBuffer = await sharp(scaledFabricBody)
        .extract({ left: 0, top: 0, width: template.width, height: template.height })
        .png()
        .toBuffer();
    } else {
      // Bündchen: Aus dem Ärmel-Muster
      cropBuffer = await sharp(scaledFabricAermel)
        .resize(template.width, template.height, { fit: "cover" })
        .png()
        .toBuffer();
    }

    // Maske auf die korrekte Größe bringen und anwenden
    const resizedMask = await sharp(maskBuffer)
      .resize(template.width, template.height, { fit: "fill" })
      .png()
      .toBuffer();

    // Muster mit Maske zuschneiden (dest-in: nur wo Maske weiß ist bleibt sichtbar)
    const maskedBuffer = await sharp(cropBuffer)
      .ensureAlpha()
      .composite([{
        input: resizedMask,
        blend: "dest-in",
      }])
      .png()
      .toBuffer();

    // Speichern (reines Muster ohne Overlays)
    const patternFileName = `ki-designs/cut-${partName}_${Date.now()}.png`;
    const { url: patternUrl } = await storagePut(patternFileName, maskedBuffer, "image/png");
    console.log(`[CutPattern V3] ${partName} pattern saved: ${patternUrl}`);

    // ═══ POST-PROCESSING: Pro Teil unterschiedliche Elemente drauflegen ═══
    let compositeBuffer = maskedBuffer;
    let contrastAdjusted = false;

    try {
      compositeBuffer = await applyPartOverlays(maskedBuffer, partName, config, template);
      console.log(`[CutPattern V3] ${partName} overlays applied`);
    } catch (err) {
      console.warn(`[CutPattern V3] ${partName} overlay failed, using plain pattern:`, err);
    }

    // Druckbogen mit Beschnitt erstellen
    const printSheetBuffer = await createPrintSheet(compositeBuffer, template.width, template.height);
    const printSheetFileName = `ki-designs/print-${partName}_${Date.now()}.png`;
    const { url: compositeUrl } = await storagePut(printSheetFileName, printSheetBuffer, "image/png");
    console.log(`[CutPattern V3] ${partName} print sheet saved: ${compositeUrl}`);

    results.push({
      part: partName,
      patternUrl,
      compositeUrl, // Der Druckbogen mit Beschnitt + Overlays
      contrastAdjusted,
    });
  }

  console.log(`[CutPattern V3] All ${results.length} parts generated successfully`);
  return results;
}

/**
 * Legacy-Kompatibilität: Generiert ein einzelnes Teil.
 */
export async function generateCutPattern(
  config: CutPatternConfig,
  part: CutPart
): Promise<CutPatternResult> {
  const results = await generateAllCutPatterns({
    ...config,
    parts: [part],
  });
  return results[0];
}
