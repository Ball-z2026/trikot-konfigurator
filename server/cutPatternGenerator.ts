/**
 * Cut Pattern Generator V2 – Schnittmuster-Generierung
 * 
 * Korrekter Workflow (wie im erfolgreichen Test):
 * 1. KI generiert EIN großes Stoffmuster (flaches Pattern)
 * 2. Das Muster wird auf die Stoffgröße skaliert/gekachelt
 * 3. Alle 7 Schnittteile werden per Polygon-Maske aus dem SELBEN Stoff ausgeschnitten
 * 4. Durch das Layout passen die Nähte automatisch zusammen
 * 5. Logos/Wappen/Sponsoren werden per Compositing draufgelegt (Post-Processing)
 * 
 * Teile: Vorderteil, Rückteil, Ärmel L, Ärmel R, Kragen, Bündchen 1, Bündchen 2
 */
import sharp from "sharp";
import { generateImage } from "./_core/imageGeneration";
import { compositeLogosOnImage, LogoPlacement } from "./logoCompositing";
import { storagePut, storageGetSignedUrl } from "./storage";
import {
  getOptimalCrestDisplay,
} from "../shared/contrastUtils";

/** Schnitteil-Typen (7 Teile) */
export type CutPart = 
  | "vorderteil" 
  | "rueckteil" 
  | "aermel_links" 
  | "aermel_rechts" 
  | "kragen" 
  | "buendchen_1" 
  | "buendchen_2";

/** Normalisiertes Polygon (0-1 Koordinaten) */
type NormalizedPolygon = [number, number][];

/** Konfiguration pro Schnittteil */
interface PartConfig {
  size: [number, number]; // [width, height] in Pixeln
  poly: NormalizedPolygon;
  label: string;
}

/** Layout-Position auf dem Stoff */
interface LayoutPosition {
  x: number;
  y: number;
}

// --- Schnittmuster-Konturen als normalisierte Polygone (0-1) ---
// Basierend auf den echten Schnittmustern (Größe L)

// Vorderteil (part_7): 1679x2260 - V-Halsausschnitt
const VORDERTEIL_POLY: NormalizedPolygon = [
  [0.05, 0.08],   // Schulter links oben
  [0.05, 0.15],   // Armausschnitt links oben
  [0.00, 0.25],   // Armausschnitt links tief
  [0.00, 0.98],   // Saum links unten
  [1.00, 0.98],   // Saum rechts unten
  [1.00, 0.25],   // Armausschnitt rechts tief
  [0.95, 0.15],   // Armausschnitt rechts oben
  [0.95, 0.08],   // Schulter rechts oben
  [0.65, 0.02],   // Hals rechts
  [0.50, 0.05],   // Hals V-Spitze
  [0.35, 0.02],   // Hals links
];

// Rückteil (part_8): 1679x2266 - U-Rundhals
const RUECKTEIL_POLY: NormalizedPolygon = [
  [0.05, 0.08],   // Schulter links oben
  [0.05, 0.15],   // Armausschnitt links oben
  [0.00, 0.25],   // Armausschnitt links tief
  [0.00, 0.98],   // Saum links unten
  [1.00, 0.98],   // Saum rechts unten
  [1.00, 0.25],   // Armausschnitt rechts tief
  [0.95, 0.15],   // Armausschnitt rechts oben
  [0.95, 0.08],   // Schulter rechts oben
  [0.70, 0.03],   // Hals rechts
  [0.60, 0.07],   // Hals U-Bogen rechts
  [0.50, 0.09],   // Hals U-Bogen mitte
  [0.40, 0.07],   // Hals U-Bogen links
  [0.30, 0.03],   // Hals links
];

// Ärmel (part_2): 1380x764 - Pentagon mit Bogen oben
const AERMEL_POLY: NormalizedPolygon = [
  [0.00, 0.70],   // Unten links
  [0.00, 0.50],   // Seite links
  [0.10, 0.30],   // Schulter links
  [0.25, 0.12],   // Bogen links
  [0.40, 0.03],   // Bogen oben links
  [0.50, 0.00],   // Bogen Spitze
  [0.60, 0.03],   // Bogen oben rechts
  [0.75, 0.12],   // Bogen rechts
  [0.90, 0.30],   // Schulter rechts
  [1.00, 0.50],   // Seite rechts
  [1.00, 0.70],   // Unten rechts
  [0.90, 0.95],   // Saum rechts
  [0.10, 0.95],   // Saum links
];

// Kragen (part_6): 1457x210 - Rechteck
const KRAGEN_POLY: NormalizedPolygon = [
  [0.02, 0.10],
  [0.98, 0.10],
  [0.98, 0.90],
  [0.02, 0.90],
];

// Bündchen (part_3): 1139x223 - leicht trapezförmig
const BUENDCHEN_POLY: NormalizedPolygon = [
  [0.05, 0.10],
  [0.95, 0.10],
  [0.98, 0.90],
  [0.02, 0.90],
];

// --- Teile-Konfiguration ---
const PARTS: Record<CutPart, PartConfig> = {
  vorderteil: {
    size: [1679, 2260],
    poly: VORDERTEIL_POLY,
    label: "Vorderteil",
  },
  rueckteil: {
    size: [1679, 2266],
    poly: RUECKTEIL_POLY,
    label: "Rückteil",
  },
  aermel_links: {
    size: [1380, 764],
    poly: AERMEL_POLY,
    label: "Ärmel L",
  },
  aermel_rechts: {
    size: [1380, 764],
    poly: AERMEL_POLY,
    label: "Ärmel R",
  },
  kragen: {
    size: [1457, 210],
    poly: KRAGEN_POLY,
    label: "Kragen",
  },
  buendchen_1: {
    size: [1139, 223],
    poly: BUENDCHEN_POLY,
    label: "Bündchen L",
  },
  buendchen_2: {
    size: [1139, 223],
    poly: BUENDCHEN_POLY,
    label: "Bündchen R",
  },
};

// Layout auf dem Stoff – Teile die an der Naht zusammenpassen liegen nebeneinander
const LAYOUT: Record<CutPart, LayoutPosition> = {
  vorderteil: { x: 0, y: 0 },
  rueckteil: { x: 1679, y: 0 },         // direkt rechts neben Vorderteil (Seitennaht!)
  aermel_links: { x: 0, y: 2266 },      // unter Vorderteil (Schulternaht!)
  aermel_rechts: { x: 1679, y: 2266 },  // unter Rückteil (Schulternaht!)
  kragen: { x: 0, y: 3030 },
  buendchen_1: { x: 1457, y: 3030 },
  buendchen_2: { x: 2596, y: 3030 },
};

const FABRIC_WIDTH = 3358;
const FABRIC_HEIGHT = 3300;

/** Konfiguration für die Schnittmuster-Generierung */
export interface CutPatternConfig {
  /** Sportart (fussball, handball, basketball, volleyball) */
  sport: string;
  /** Design-Stil (geometric, organic, gradient, abstract, etc.) */
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
  /** Vereinswappen-URL (für Rückseite als Wasserzeichen) */
  crestUrl?: string;
  /** Vereinswappen-Deckkraft auf Rückseite (0-100, default 20) */
  crestWatermarkOpacity?: number;
  /** Dominante Farben des Vereinswappens (für Kontrast-Logik) */
  crestDominantColors?: string[];
  /** Sublimationsbereiche (Kragen, Bündchen etc.) */
  sublimationAreas?: string[];
  /** Hashtag (optional, für Nackenbereich) */
  hashtag?: string;
  /** Koordinaten-Text (optional) */
  coordinatesText?: string;
  /** Brustsponsor-Logo URL */
  chestSponsorUrl?: string;
  /** Rückensponsor-Logo URL */
  backSponsorUrl?: string;
  /** Ärmel-Sponsor-Logo URL */
  sleeveSponsorUrl?: string;
}

/** Ergebnis pro Schnittteil */
export interface CutPatternResult {
  part: CutPart;
  /** URL des generierten Musters (rein, ohne Overlays) */
  patternUrl: string;
  /** URL des fertigen Bildes (mit Logos/Overlays) */
  compositeUrl: string;
  /** Ob die Kontrast-Logik eingegriffen hat */
  contrastAdjusted: boolean;
}

/**
 * Erstellt eine SVG-Polygon-Maske und gibt sie als Sharp-Buffer zurück.
 */
function createPolygonMaskSvg(width: number, height: number, poly: NormalizedPolygon): Buffer {
  const points = poly
    .map(([x, y]) => `${Math.round(x * width)},${Math.round(y * height)}`)
    .join(" ");
  
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
    <polygon points="${points}" fill="white"/>
  </svg>`;
  
  return Buffer.from(svg);
}

/**
 * Baut den KI-Prompt für das Stoffmuster auf.
 * Die KI generiert NUR ein flaches Stoffmuster – KEINE Trikot-Form, KEINE Texte.
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

  // Straßenkarte als Textur-Element
  if (config.streetMapUrl) {
    prompt += `Incorporate the street map pattern from the reference image as a subtle texture woven into the fabric design. `;
  }

  // STRIKTE Verbote
  prompt += `\n\nSTRICT RULES: `;
  prompt += `• ABSOLUTELY NO TEXT (no words, letters, numbers, names, placeholders). `;
  prompt += `• ABSOLUTELY NO LOGOS (no crests, emblems, brand marks). `;
  prompt += `• ABSOLUTELY NO WATERMARKS. `;
  prompt += `• ABSOLUTELY NO garment shapes or silhouettes – ONLY flat rectangular pattern. `;
  prompt += `• NO manufacturer branding (no Nike, Adidas, Puma). `;
  prompt += `• Output is ONLY a flat rectangular fabric pattern/texture. `;
  prompt += `High resolution, print-ready quality, seamless repeatable pattern. `;

  if (config.additionalNotes) {
    prompt += `Additional design notes: ${config.additionalNotes}. `;
  }

  return prompt;
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
 * Berechnet die Logo-Overlay-Positionen für ein Schnittteil.
 * Basiert auf den Regeln aus jerseyRules.ts (FRONT_ZONE_POSITIONS).
 * Positionen sind relativ zum jeweiligen Schnittteil (nicht zum Gesamtstoff).
 */
function getOverlaysForPart(config: CutPatternConfig, part: CutPart): LogoPlacement[] {
  const overlays: LogoPlacement[] = [];

  if (part === "vorderteil") {
    // Vereinswappen auf der Herzseite (rechts im Bild = links am Träger)
    if (config.crestUrl) {
      overlays.push({
        imageUrl: config.crestUrl,
        xPercent: 60, // Herzseite
        yPercent: 8,
        widthPercent: 15,
        heightPercent: 14,
        autoContrast: true,
        logoDominantColor: config.crestDominantColors?.[0],
      });
    }

    // Brustsponsor (Mitte)
    if (config.chestSponsorUrl) {
      overlays.push({
        imageUrl: config.chestSponsorUrl,
        xPercent: 20,
        yPercent: 40,
        widthPercent: 60,
        heightPercent: 14,
        autoContrast: true,
      });
    }
  } else if (part === "rueckteil") {
    // Vereinswappen als Wasserzeichen (groß, dezent)
    if (config.crestUrl && config.crestWatermarkOpacity && config.crestWatermarkOpacity > 0) {
      overlays.push({
        imageUrl: config.crestUrl,
        xPercent: 20,
        yPercent: 20,
        widthPercent: 60,
        heightPercent: 55,
        opacity: (config.crestWatermarkOpacity || 20) / 100,
        autoContrast: false,
      });
    }

    // Rückensponsor (unterer Rücken)
    if (config.backSponsorUrl) {
      overlays.push({
        imageUrl: config.backSponsorUrl,
        xPercent: 25,
        yPercent: 80,
        widthPercent: 50,
        heightPercent: 12,
        autoContrast: true,
      });
    }
  } else if (part === "aermel_links" || part === "aermel_rechts") {
    // Ärmel-Sponsor
    if (config.sleeveSponsorUrl) {
      overlays.push({
        imageUrl: config.sleeveSponsorUrl,
        xPercent: 15,
        yPercent: 25,
        widthPercent: 70,
        heightPercent: 35,
        autoContrast: true,
      });
    }
  }

  return overlays;
}

/**
 * Generiert ein Stoffmuster und schneidet alle Teile daraus zu.
 * 
 * Workflow:
 * 1. KI generiert EIN großes Stoffmuster
 * 2. Muster wird auf Stoffgröße (3358x3300) skaliert
 * 3. Jedes Teil wird an seiner Layout-Position ausgeschnitten
 * 4. Polygon-Maske wird angewendet (ergibt die Schnittform)
 * 5. Overlays (Logos, Wappen) werden per Compositing draufgelegt
 */
export async function generateAllCutPatterns(
  config: CutPatternConfig
): Promise<CutPatternResult[]> {
  console.log("[CutPattern V2] Starting fabric pattern generation...");

  // 1. KI generiert EIN Stoffmuster
  const fabricPrompt = buildFabricPrompt(config);
  console.log(`[CutPattern V2] Fabric prompt (${fabricPrompt.length} chars): ${fabricPrompt.substring(0, 200)}...`);

  const originalImages: Array<{ url?: string; mimeType: string }> = [];

  // Straßenkarte als Referenz
  if (config.streetMapUrl) {
    const resolvedUrl = await resolveStorageUrl(config.streetMapUrl);
    originalImages.push({ url: resolvedUrl, mimeType: "image/png" });
  }

  // Weitere Referenzbilder
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

  console.log("[CutPattern V2] Fabric pattern generated, scaling to layout size...");

  // 2. Stoffmuster laden und auf Layout-Größe skalieren
  let fabricUrl = fabricResult.url;
  if (fabricUrl.includes("/manus-storage/")) {
    const keyMatch = fabricUrl.match(/\/manus-storage\/(.+)/);
    if (keyMatch) {
      fabricUrl = await storageGetSignedUrl(keyMatch[1]);
    }
  }

  const fabricResponse = await fetch(fabricUrl);
  const fabricBuffer = Buffer.from(await fabricResponse.arrayBuffer());

  // Auf Stoffgröße skalieren (cover – das Muster füllt die gesamte Fläche)
  const scaledFabric = await sharp(fabricBuffer)
    .resize(FABRIC_WIDTH, FABRIC_HEIGHT, { fit: "cover" })
    .png()
    .toBuffer();

  console.log(`[CutPattern V2] Fabric scaled to ${FABRIC_WIDTH}x${FABRIC_HEIGHT}`);

  // Fabric-Gesamtbild speichern (für Debugging/Vorschau)
  const { url: fullFabricUrl } = await storagePut(
    `ki-designs/fabric-full_${Date.now()}.png`,
    scaledFabric,
    "image/png"
  );
  console.log(`[CutPattern V2] Full fabric saved: ${fullFabricUrl}`);

  // 3. Jedes Teil ausschneiden
  const results: CutPatternResult[] = [];

  for (const partName of config.parts) {
    const partConfig = PARTS[partName];
    if (!partConfig) {
      console.warn(`[CutPattern V2] Unknown part: ${partName}, skipping`);
      continue;
    }

    const [partWidth, partHeight] = partConfig.size;
    const layout = LAYOUT[partName];

    console.log(`[CutPattern V2] Cutting ${partName} (${partWidth}x${partHeight}) at layout (${layout.x}, ${layout.y})...`);

    // Stoffausschnitt an der Layout-Position
    const cropBuffer = await sharp(scaledFabric)
      .extract({
        left: layout.x,
        top: layout.y,
        width: Math.min(partWidth, FABRIC_WIDTH - layout.x),
        height: Math.min(partHeight, FABRIC_HEIGHT - layout.y),
      })
      .resize(partWidth, partHeight, { fit: "fill" })
      .png()
      .toBuffer();

    // Polygon-Maske erstellen und anwenden
    const maskSvg = createPolygonMaskSvg(partWidth, partHeight, partConfig.poly);

    const maskedBuffer = await sharp(cropBuffer)
      .ensureAlpha()
      .composite([{
        input: maskSvg,
        blend: "dest-in",
      }])
      .png()
      .toBuffer();

    // Pattern speichern
    const patternFileName = `ki-designs/cut-${partName}_${Date.now()}.png`;
    const { url: patternUrl } = await storagePut(patternFileName, maskedBuffer, "image/png");

    console.log(`[CutPattern V2] ${partName} cut and saved: ${patternUrl}`);

    // 4. Overlays (Logos, Wappen) per Compositing drauflegen
    const overlays = getOverlaysForPart(config, partName);
    let compositeUrl = patternUrl;
    let contrastAdjusted = false;

    if (overlays.length > 0) {
      try {
        const resolvedOverlays = await Promise.all(
          overlays.map(async (overlay) => ({
            ...overlay,
            imageUrl: await resolveStorageUrl(overlay.imageUrl),
          }))
        );

        // Basis-Bild URL auflösen
        let baseUrl = patternUrl;
        if (baseUrl.includes("/manus-storage/")) {
          const keyMatch = baseUrl.match(/\/manus-storage\/(.+)/);
          if (keyMatch) {
            baseUrl = await storageGetSignedUrl(keyMatch[1]);
          }
        }

        const compositedBuffer = await compositeLogosOnImage(baseUrl, resolvedOverlays);

        const compositeFileName = `ki-designs/cut-${partName}-composite_${Date.now()}.png`;
        const { url } = await storagePut(compositeFileName, compositedBuffer, "image/png");
        compositeUrl = url;
        contrastAdjusted = true;
      } catch (err) {
        console.error(`[CutPattern V2] Compositing for ${partName} failed:`, err);
        compositeUrl = patternUrl;
      }
    }

    results.push({
      part: partName,
      patternUrl,
      compositeUrl,
      contrastAdjusted,
    });
  }

  console.log(`[CutPattern V2] All ${results.length} parts generated successfully`);
  return results;
}

/**
 * Legacy-Kompatibilität: Generiert ein einzelnes Teil.
 * Intern wird trotzdem das gesamte Stoffmuster generiert.
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
