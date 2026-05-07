/**
 * Logo Compositing Service
 * 
 * Legt echte Logos (Vereinswappen, Sponsoren) als Overlay auf KI-generierte Trikot-Bilder.
 * Die KI generiert nur das reine Design ohne Logos - die echten Logos werden danach
 * programmatisch platziert, damit sie pixel-perfekt und korrekt sind.
 */
import sharp from "sharp";
import axios from "axios";

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
}

/**
 * Lädt ein Bild von einer URL und gibt es als Buffer zurück
 */
async function fetchImageBuffer(url: string): Promise<Buffer> {
  const response = await axios.get(url, { responseType: "arraybuffer", timeout: 15000 });
  return Buffer.from(response.data);
}

/**
 * Composited mehrere Logos auf ein Basis-Bild.
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
      const logoBuffer = await fetchImageBuffer(logo.imageUrl);
      
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
