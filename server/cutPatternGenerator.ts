/**
 * Cut Pattern Generator – Schnittmuster-Generierung
 * 
 * Generiert separate KI-Muster für jedes Schnittteil (Vorderseite, Rückseite, Ärmel).
 * Die KI erzeugt flache Sublimations-Druckvorlagen (keine Mockups mit Personen),
 * die direkt als Druckbogen-Input verwendet werden können.
 * 
 * Workflow:
 * 1. KI generiert ein reines MUSTER (Pattern) pro Teil
 * 2. Logos/Wappen/Sponsoren werden per Compositing draufgelegt (mit Kontrast-Logik)
 * 3. Ergebnis wird in Storage gespeichert und kann als Druckbogen-Hintergrund genutzt werden
 */
import { generateImage } from "./_core/imageGeneration";
import { compositeLogosOnImage, LogoPlacement } from "./logoCompositing";
import { storagePut, storageGetSignedUrl } from "./storage";
import {
  ensureTextContrast,
  getOptimalCrestDisplay,
  shouldUseWhiteLogoVersion,
  isDarkColor,
} from "../shared/contrastUtils";

/** Schnittteil-Typen */
export type CutPart = "front" | "back" | "sleeve_left" | "sleeve_right";

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
 * Baut den KI-Prompt für ein einzelnes Schnittteil auf.
 * Generiert ein flaches Sublimations-Druckmuster (kein Mockup).
 * 
 * WICHTIG: Der Prompt darf KEINE Anweisungen enthalten die die KI dazu verleiten,
 * Text, Logos, Nummern oder Wasserzeichen ins Bild zu generieren.
 * Alle Overlays (Wappen, Sponsoren, Nummern, Namen) werden NACHTRÄGLICH
 * per Compositing programmatisch draufgelegt.
 */
function buildPatternPrompt(config: CutPatternConfig, part: CutPart): string {
  const sportMap: Record<string, string> = {
    fussball: "soccer",
    handball: "handball",
    basketball: "basketball",
    volleyball: "volleyball",
  };
  const sportEn = sportMap[config.sport] || "soccer";

  const partShapes: Record<CutPart, string> = {
    front: "a sleeveless torso-shaped front panel (tank top silhouette without arms, wider at shoulders tapering slightly at waist)",
    back: "a sleeveless torso-shaped back panel (same silhouette as front, slightly longer)",
    sleeve_left: "a single isolated SHORT SLEEVE shape (a small tapered tube, wider at shoulder seam, narrower at bicep opening, approximately 24cm wide × 35cm tall)",
    sleeve_right: "a single isolated SHORT SLEEVE shape (a small tapered tube, wider at shoulder seam, narrower at bicep opening, approximately 24cm wide × 35cm tall, mirror of left sleeve)",
  };

  const partDimensions: Record<CutPart, string> = {
    front: "approximately 55cm wide × 75cm tall (Size L)",
    back: "approximately 55cm wide × 75cm tall (Size L)",
    sleeve_left: "approximately 24cm wide × 35cm tall (Size L)",
    sleeve_right: "approximately 24cm wide × 35cm tall (Size L)",
  };

  const shape = partShapes[part];
  const dimensions = partDimensions[part];

  // Basis-Prompt: Reines Sublimations-Druckmuster
  let prompt = `CRITICAL: Generate ONLY a pure decorative pattern/design on ${shape} for a ${sportEn} jersey sublimation print. `;
  prompt += `This is a FLAT FABRIC CUT PIECE – NOT a complete garment, NOT a 3D mockup, NOT a person wearing it. `;
  prompt += `Show ONLY the single isolated panel shape on a pure white background. `;
  prompt += `Dimensions: ${dimensions}. `;
  prompt += `Design style: ${config.designStyle}. `;
  prompt += `Color palette: Primary ${config.primaryColor}, Secondary ${config.secondaryColor}, Accent ${config.accentColor}. `;

  // Teil-spezifische Design-Anweisungen (NUR Muster, keine Platzhalter)
  if (part === "front") {
    prompt += `The front panel should have dynamic, bold graphic design elements (stripes, gradients, geometric shapes, or organic flowing patterns). `;
    prompt += `Keep the center-chest area and upper-left chest area slightly less busy (these areas will receive overlays later). `;
  } else if (part === "back") {
    prompt += `The back panel should complement the front design but be slightly calmer. `;
    prompt += `Keep the center area (where a large number would go) slightly less busy. `;
  } else {
    // Ärmel – klare Anweisung dass es NUR ein Ärmel ist
    prompt += `IMPORTANT: This is ONLY a single sleeve piece – a small isolated fabric panel shaped like a short sleeve. `;
    prompt += `It must NOT look like a full shirt or torso. It is just the sleeve cutout. `;
    prompt += `The design should be simpler and complementary to the body panels, flowing naturally from shoulder to bicep. `;
    if (config.sublimationAreas?.includes("cuff_left") || config.sublimationAreas?.includes("cuff_right")) {
      prompt += `Include a designed cuff/band at the bottom edge of the sleeve. `;
    }
  }

  // Straßenkarte als Textur-Element (nur wenn Referenzbild gesendet wird)
  if (config.streetMapUrl && (part === "front" || part === "back")) {
    prompt += `Incorporate the street map pattern from the reference image as a subtle texture woven into the fabric design. `;
  }

  // STRIKTE Verbote – mehrfach betont damit die KI es nicht ignoriert
  prompt += `\n\nSTRICT RULES (MUST FOLLOW): `;
  prompt += `• ABSOLUTELY NO TEXT of any kind (no words, no letters, no numbers, no placeholders like "CLUB NAME" or "PLAYER"). `;
  prompt += `• ABSOLUTELY NO LOGOS (no crests, no emblems, no brand marks, no sponsor logos). `;
  prompt += `• ABSOLUTELY NO WATERMARKS (no faint logos, no ghost images of crests). `;
  prompt += `• ONLY pure decorative pattern/design on the fabric shape. `;
  prompt += `• Pure white background OUTSIDE the panel shape. `;
  prompt += `• NO manufacturer branding (no Nike, Adidas, Puma, etc.). `;
  prompt += `• The output is ONLY the colored/patterned fabric cut piece on white. `;
  prompt += `High resolution, print-ready quality. `;

  if (config.additionalNotes) {
    prompt += `Additional design notes: ${config.additionalNotes}. `;
  }

  return prompt;
}

/**
 * Berechnet die Logo-Overlay-Positionen für ein Schnittteil.
 * Basiert auf den Regeln aus jerseyRules.ts (FRONT_ZONE_POSITIONS).
 */
function getOverlaysForPart(config: CutPatternConfig, part: CutPart): LogoPlacement[] {
  const overlays: LogoPlacement[] = [];

  if (part === "front") {
    // Vereinswappen auf der Herzseite (links im Bild = rechte Brust des Trägers)
    if (config.crestUrl) {
      const crestDisplay = config.crestDominantColors
        ? getOptimalCrestDisplay(config.crestDominantColors, config.primaryColor)
        : { mode: "original" as const };

      overlays.push({
        imageUrl: config.crestUrl,
        xPercent: 60, // Herzseite (rechts im Bild bei Flat-Lay = links am Träger)
        yPercent: 8,  // Brusthöhe
        widthPercent: 15, // ~8cm bei 55cm Breite
        heightPercent: 14, // ~10cm bei 75cm Höhe
        autoContrast: true,
        logoDominantColor: config.crestDominantColors?.[0],
      });
    }

    // Brustsponsor (Mitte)
    if (config.chestSponsorUrl) {
      overlays.push({
        imageUrl: config.chestSponsorUrl,
        xPercent: 25, // Zentriert
        yPercent: 10, // Brusthöhe
        widthPercent: 30, // ~16cm bei 55cm Breite
        heightPercent: 12, // ~9cm bei 75cm Höhe
        autoContrast: true,
      });
    }
  } else if (part === "back") {
    // Vereinswappen als Wasserzeichen (groß, dezent)
    if (config.crestUrl && config.crestWatermarkOpacity && config.crestWatermarkOpacity > 0) {
      overlays.push({
        imageUrl: config.crestUrl,
        xPercent: 15, // Zentriert (mit etwas Rand)
        yPercent: 15,
        widthPercent: 70,
        heightPercent: 65,
        opacity: (config.crestWatermarkOpacity || 20) / 100,
        autoContrast: false, // Wasserzeichen soll dezent bleiben
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
  } else if (part === "sleeve_left" || part === "sleeve_right") {
    // Ärmel-Sponsor
    if (config.sleeveSponsorUrl) {
      overlays.push({
        imageUrl: config.sleeveSponsorUrl,
        xPercent: 15,
        yPercent: 20,
        widthPercent: 70,
        heightPercent: 30,
        autoContrast: true,
      });
    }
  }

  return overlays;
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
 * Generiert ein Schnittmuster für ein einzelnes Teil.
 */
export async function generateCutPattern(
  config: CutPatternConfig,
  part: CutPart
): Promise<CutPatternResult> {
  // 1. Prompt aufbauen
  const prompt = buildPatternPrompt(config, part);

  // 2. Referenzbilder zusammenstellen
  const originalImages: Array<{ url?: string; mimeType: string }> = [];

  // Straßenkarte als Referenz (nur für Front/Back)
  if (config.streetMapUrl && (part === "front" || part === "back")) {
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

  // 3. KI-Bild generieren
  console.log(`[CutPattern] Generating ${part} pattern...`);
  console.log(`[CutPattern] Prompt (${prompt.length} chars): ${prompt.substring(0, 200)}...`);

  const result = await generateImage({
    prompt,
    originalImages: originalImages.length > 0 ? originalImages : undefined,
  });

  if (!result.url) {
    throw new Error(`KI-Generierung für ${part} fehlgeschlagen`);
  }

  // Pattern-URL in Storage speichern
  const patternUrl = result.url;

  // 4. Logo-Overlays berechnen und compositen
  const overlays = getOverlaysForPart(config, part);
  let compositeUrl = patternUrl;
  let contrastAdjusted = false;

  if (overlays.length > 0) {
    try {
      // URLs auflösen
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

      // Compositing durchführen (mit automatischer Kontrast-Logik)
      const compositedBuffer = await compositeLogosOnImage(baseUrl, resolvedOverlays);

      // Ergebnis speichern
      const fileName = `ki-designs/cut-pattern-${part}_${Date.now()}.png`;
      const { url } = await storagePut(fileName, compositedBuffer, "image/png");
      compositeUrl = url;
      contrastAdjusted = true; // Kontrast-Logik war aktiv (ob sie tatsächlich eingegriffen hat, loggt compositeLogosOnImage)
    } catch (err) {
      console.error(`[CutPattern] Compositing for ${part} failed:`, err);
      // Fallback: Pattern ohne Overlays
      compositeUrl = patternUrl;
    }
  }

  return {
    part,
    patternUrl,
    compositeUrl,
    contrastAdjusted,
  };
}

/**
 * Generiert alle Schnittmuster für ein komplettes Trikot.
 * Ruft die KI für jedes Teil separat auf.
 */
export async function generateAllCutPatterns(
  config: CutPatternConfig
): Promise<CutPatternResult[]> {
  const results: CutPatternResult[] = [];

  // Sequentiell generieren (KI-API-Limits beachten)
  for (const part of config.parts) {
    const result = await generateCutPattern(config, part);
    results.push(result);
  }

  return results;
}
