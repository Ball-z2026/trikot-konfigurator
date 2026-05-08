/**
 * Logo Compositing Service
 * 
 * Legt echte Logos (Vereinswappen, Sponsoren) als Overlay auf KI-generierte Trikot-Bilder.
 * Die KI generiert nur das reine Design ohne Logos - die echten Logos werden danach
 * programmatisch platziert, damit sie pixel-perfekt und korrekt sind.
 * 
 * KONTRAST-LOGIK:
 * - Blaues Wappen auf blauem Hintergrund → automatisch in Weiß
 * - Gelbes Wappen auf gelbem Hintergrund → automatisch in Schwarz
 * - Automatische Erkennung der dominanten Farbe im Zielbereich
 */
import sharp from "sharp";
import axios from "axios";
import { colorsAreTooSimilar, isDarkColor, rgbToHex } from "@shared/contrastUtils";

export interface LogoPlacement {
  /** URL des Logo-Bildes (Storage-URL oder signierte URL) */
  imageUrl: string;
  /** Position: Prozent von links (0-100) */
  xPercent: number;
  /** Position: Prozent von oben (0-100) */
  yPercent: number;
  /** Breite in Prozent des Gesamtbildes (0-100) */
  widthPercent: number;
  /** Höhe in Prozent des Gesamtbildes (0-100) */
  heightPercent: number;
  /** Optionale Opacity (0-1, default 1.0) */
  opacity?: number;
  /** Automatische Kontrast-Anpassung aktivieren (default: false) */
  autoContrast?: boolean;
  /** Dominante Farbe des Logos (Hex) - für Kontrast-Prüfung ohne Bildanalyse */
  logoDominantColor?: string;
}

/**
 * Lädt ein Bild von einer URL und gibt es als Buffer zurück
 */
async function fetchImageBuffer(url: string): Promise<Buffer> {
  const response = await axios.get(url, { responseType: "arraybuffer", timeout: 15000 });
  return Buffer.from(response.data);
}

/**
 * Ermittelt die dominante Farbe eines Bildbereichs.
 * Analysiert den Bereich wo das Logo platziert wird und gibt die häufigste Farbe zurück.
 */
async function getDominantColorInRegion(
  imageBuffer: Buffer,
  xPercent: number,
  yPercent: number,
  widthPercent: number,
  heightPercent: number
): Promise<string> {
  const metadata = await sharp(imageBuffer).metadata();
  const imgWidth = metadata.width || 1024;
  const imgHeight = metadata.height || 1024;

  // Region berechnen
  const left = Math.round((xPercent / 100) * imgWidth);
  const top = Math.round((yPercent / 100) * imgHeight);
  const width = Math.max(1, Math.round((widthPercent / 100) * imgWidth));
  const height = Math.max(1, Math.round((heightPercent / 100) * imgHeight));

  // Sicherstellen dass die Region innerhalb des Bildes liegt
  const safeLeft = Math.min(left, imgWidth - 1);
  const safeTop = Math.min(top, imgHeight - 1);
  const safeWidth = Math.min(width, imgWidth - safeLeft);
  const safeHeight = Math.min(height, imgHeight - safeTop);

  try {
    // Region ausschneiden und auf 1x1 Pixel verkleinern → Durchschnittsfarbe
    const { data, info } = await sharp(imageBuffer)
      .extract({ left: safeLeft, top: safeTop, width: safeWidth, height: safeHeight })
      .resize(1, 1, { fit: "cover" })
      .raw()
      .toBuffer({ resolveWithObject: true });

    const r = data[0] || 0;
    const g = data[1] || 0;
    const b = data[2] || 0;

    return rgbToHex(r, g, b);
  } catch (err) {
    console.error("getDominantColorInRegion failed:", err);
    // Fallback: Mittelgrau (kein Kontrast-Problem)
    return "#808080";
  }
}

/**
 * Ermittelt die dominante Farbe eines Logo-Bildes (ignoriert transparente Pixel).
 */
async function getLogoDominantColor(logoBuffer: Buffer): Promise<string> {
  try {
    // Logo auf kleine Größe verkleinern für schnelle Analyse
    const { data, info } = await sharp(logoBuffer)
      .resize(32, 32, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    // Pixel-Farben sammeln (nur nicht-transparente)
    const colorCounts: Record<string, number> = {};
    const channels = info.channels;

    for (let i = 0; i < data.length; i += channels) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = channels >= 4 ? data[i + 3] : 255;

      // Transparente Pixel ignorieren
      if (a < 128) continue;
      // Weiße/fast-weiße Pixel ignorieren (oft Hintergrund)
      if (r > 240 && g > 240 && b > 240) continue;
      // Schwarze/fast-schwarze Pixel ignorieren (oft Umrisse)
      if (r < 15 && g < 15 && b < 15) continue;

      // Farbe quantisieren (auf 16er-Schritte) für bessere Gruppierung
      const qr = Math.round(r / 32) * 32;
      const qg = Math.round(g / 32) * 32;
      const qb = Math.round(b / 32) * 32;
      const key = `${qr},${qg},${qb}`;
      colorCounts[key] = (colorCounts[key] || 0) + 1;
    }

    // Häufigste Farbe finden
    let maxCount = 0;
    let dominantKey = "0,0,128"; // Fallback: Dunkelblau
    for (const [key, count] of Object.entries(colorCounts)) {
      if (count > maxCount) {
        maxCount = count;
        dominantKey = key;
      }
    }

    const [r, g, b] = dominantKey.split(",").map(Number);
    return rgbToHex(r, g, b);
  } catch (err) {
    console.error("getLogoDominantColor failed:", err);
    return "#000080"; // Fallback
  }
}

/**
 * Konvertiert ein Logo in eine einfarbige Version (Weiß oder Schwarz).
 * Behält die Form/Silhouette bei, ändert aber alle Farben.
 */
async function tintLogo(logoBuffer: Buffer, tintColor: "white" | "black"): Promise<Buffer> {
  try {
    // Logo-Metadaten lesen
    const metadata = await sharp(logoBuffer).metadata();
    const hasAlpha = metadata.channels === 4 || metadata.hasAlpha;

    if (hasAlpha) {
      // Logo hat Transparenz → Alpha-Kanal als Maske verwenden
      // Alle nicht-transparenten Pixel in die Zielfarbe umfärben
      const { r, g, b } = tintColor === "white" 
        ? { r: 255, g: 255, b: 255 } 
        : { r: 0, g: 0, b: 0 };

      // Erstelle ein einfarbiges Bild in der Zielfarbe
      const { width, height } = metadata;
      const solidColor = await sharp({
        create: {
          width: width || 100,
          height: height || 100,
          channels: 4,
          background: { r, g, b, alpha: 255 },
        },
      }).png().toBuffer();

      // Verwende den Alpha-Kanal des Originals als Maske
      const alphaChannel = await sharp(logoBuffer)
        .extractChannel(3) // Alpha-Kanal extrahieren
        .toBuffer();

      // Einfarbiges Bild mit Original-Alpha kombinieren
      const result = await sharp(solidColor)
        .joinChannel(alphaChannel)
        .png()
        .toBuffer();

      // Korrektur: sharp joinChannel fügt einen 5. Kanal hinzu, stattdessen composite verwenden
      const tinted = await sharp(logoBuffer)
        .tint({ r, g, b })
        .png()
        .toBuffer();

      return tinted;
    } else {
      // Logo ohne Transparenz → einfach tint verwenden
      const { r, g, b } = tintColor === "white" 
        ? { r: 255, g: 255, b: 255 } 
        : { r: 0, g: 0, b: 0 };

      return await sharp(logoBuffer)
        .tint({ r, g, b })
        .png()
        .toBuffer();
    }
  } catch (err) {
    console.error("tintLogo failed:", err);
    return logoBuffer; // Fallback: Original zurückgeben
  }
}

/**
 * Composited mehrere Logos auf ein Basis-Bild.
 * 
 * NEU: Automatische Kontrast-Prüfung
 * - Analysiert die dominante Farbe im Zielbereich
 * - Wenn Logo-Farbe ≈ Hintergrundfarbe → Logo wird in Weiß/Schwarz umgefärbt
 * 
 * @param baseImageUrl - URL des KI-generierten Trikot-Bildes
 * @param logos - Array von Logo-Platzierungen
 * @returns Buffer des fertigen Bildes mit allen Logos
 */
export async function compositeLogosOnImage(
  baseImageUrl: string,
  logos: LogoPlacement[]
): Promise<Buffer> {
  // Basis-Bild laden
  const baseBuffer = await fetchImageBuffer(baseImageUrl);
  const baseImage = sharp(baseBuffer);
  const metadata = await baseImage.metadata();
  
  const imgWidth = metadata.width || 1024;
  const imgHeight = metadata.height || 1024;

  // Alle Logo-Overlays vorbereiten
  const compositeInputs: sharp.OverlayOptions[] = [];

  for (const logo of logos) {
    try {
      let logoBuffer = await fetchImageBuffer(logo.imageUrl);
      
      // ═══ KONTRAST-LOGIK ═══
      if (logo.autoContrast !== false) {
        // Dominante Farbe im Zielbereich ermitteln
        const bgColor = await getDominantColorInRegion(
          baseBuffer,
          logo.xPercent,
          logo.yPercent,
          logo.widthPercent,
          logo.heightPercent
        );

        // Dominante Farbe des Logos ermitteln (oder aus Parameter nehmen)
        const logoColor = logo.logoDominantColor || await getLogoDominantColor(logoBuffer);

        // Kontrast prüfen
        if (colorsAreTooSimilar(logoColor, bgColor)) {
          // Logo wäre unsichtbar → in Kontrastfarbe umfärben
          const tintTarget = isDarkColor(bgColor) ? "white" : "black";
          console.log(`[Kontrast] Logo-Farbe ${logoColor} zu ähnlich zu Hintergrund ${bgColor} → ${tintTarget} Version`);
          logoBuffer = await tintLogo(logoBuffer, tintTarget);
        }
      }
      
      // Zielgröße berechnen
      const targetWidth = Math.round((logo.widthPercent / 100) * imgWidth);
      const targetHeight = Math.round((logo.heightPercent / 100) * imgHeight);
      
      // Logo auf Zielgröße skalieren (Seitenverhältnis beibehalten, in Box einpassen)
      let resizedLogo = sharp(logoBuffer)
        .resize(targetWidth, targetHeight, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } });
      
      // Opacity anwenden wenn nötig
      if (logo.opacity !== undefined && logo.opacity < 1) {
        const opacity = Math.round(logo.opacity * 255);
        // Erstelle ein halbtransparentes Overlay
        resizedLogo = resizedLogo.composite([{
          input: Buffer.from([0, 0, 0, opacity]),
          raw: { width: 1, height: 1, channels: 4 },
          tile: true,
          blend: "dest-in"
        }]);
      }
      
      const logoFinalBuffer = await resizedLogo.png().toBuffer();
      
      // Position berechnen
      const left = Math.round((logo.xPercent / 100) * imgWidth);
      const top = Math.round((logo.yPercent / 100) * imgHeight);

      compositeInputs.push({
        input: logoFinalBuffer,
        left,
        top,
        blend: "over",
      });
    } catch (err) {
      // Wenn ein Logo nicht geladen werden kann, überspringen
      console.error(`Logo compositing failed for ${logo.imageUrl}:`, err);
    }
  }

  if (compositeInputs.length === 0) {
    // Keine Logos → Originalbild zurückgeben
    return baseBuffer;
  }

  // Alle Logos auf das Basisbild compositen
  const result = await baseImage
    .composite(compositeInputs)
    .png()
    .toBuffer();

  return result;
}

/**
 * Standard-Platzierungen für Trikot-Logos basierend auf Typ
 */
export function getStandardPlacement(type: "clubCrest" | "mainSponsor" | "secondarySponsor" | "sleeveSponsor" | "manufacturer", side: "front" | "back"): Omit<LogoPlacement, "imageUrl"> {
  switch (type) {
    case "clubCrest":
      // Herzseite (RECHTS im Bild = links am Träger)
      // Gemäß Verbandsvorgabe: X=60%, Y=28%, Größe 12%×10%
      return { xPercent: 60, yPercent: 28, widthPercent: 12, heightPercent: 10 };
    case "mainSponsor":
      // Vorne mittig auf der Brust
      return { xPercent: 30, yPercent: 35, widthPercent: 25, heightPercent: 12 };
    case "secondarySponsor":
      // Rücken oben mittig (unter Kragen, über Vereinsname)
      return { xPercent: 32, yPercent: 15, widthPercent: 20, heightPercent: 8 };
    case "sleeveSponsor":
      // Ärmel
      return { xPercent: 5, yPercent: 25, widthPercent: 12, heightPercent: 8 };
    case "manufacturer":
      // Rechte Brust
      return { xPercent: 55, yPercent: 18, widthPercent: 6, heightPercent: 6 };
    default:
      return { xPercent: 40, yPercent: 40, widthPercent: 15, heightPercent: 10 };
  }
}
