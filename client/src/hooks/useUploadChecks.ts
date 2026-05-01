/**
 * Upload-Prüfungen für Druckdateien:
 * - PDF: Überdrucken (Overprint) und Transparenz erkennen
 * - Bilder (PNG): Transparenz (Alpha-Kanal) erkennen
 * 
 * Beide Prüfungen geben Warnungen zurück, blockieren den Upload aber nicht.
 */

export type UploadWarning = {
  type: "overprint" | "transparency";
  message: string;
};

export type UploadCheckResult = {
  warnings: UploadWarning[];
  isPdf: boolean;
};

/**
 * Prüft eine PDF-Datei auf Überdrucken und Transparenz.
 * Liest die rohen PDF-Bytes und sucht nach relevanten Operatoren/Flags.
 */
async function checkPdfFile(file: File): Promise<UploadWarning[]> {
  const warnings: UploadWarning[] = [];

  try {
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    // PDF als Text lesen (ASCII-Bereich, reicht für Operator-Suche)
    const text = new TextDecoder("latin1").decode(bytes);

    // --- Überdrucken (Overprint) ---
    // Suche nach Overprint-Flags in ExtGState oder direkt im Content-Stream
    // /OP true = Overprint für Füllung, /op true = Overprint für Kontur
    // /OPM 1 = Overprint-Modus
    const overprintPatterns = [
      /\/OP\s+true/i,
      /\/op\s+true/i,
      /\/OPM\s+1/,
    ];

    const hasOverprint = overprintPatterns.some(pattern => pattern.test(text));
    if (hasOverprint) {
      warnings.push({
        type: "overprint",
        message: "Überdrucken (Overprint) erkannt! Dies kann beim Textildruck zu unerwarteten Farbmischungen führen. Bitte prüfe die Datei in deinem Grafikprogramm und deaktiviere Überdrucken.",
      });
    }

    // --- Transparenz ---
    // Suche nach Transparenz-Indikatoren:
    // /ca oder /CA < 1.0 = Deckkraft < 100%
    // /SMask = Soft Mask (Transparenz-Maske)
    // /BM (Blend Mode) != /Normal
    // /Group mit /S /Transparency = Transparenz-Gruppe
    const transparencyIndicators: { pattern: RegExp; check?: (match: string) => boolean }[] = [
      {
        // /ca 0.5 oder /CA 0.8 (Deckkraft < 1)
        pattern: /\/(?:ca|CA)\s+([\d.]+)/g,
        check: (match: string) => {
          const val = parseFloat(match);
          return !isNaN(val) && val < 1.0;
        },
      },
      { pattern: /\/SMask\s+(?!\/None)/ },
      { pattern: /\/BM\s+\/(?!Normal)/ },
      { pattern: /\/S\s+\/Transparency/ },
    ];

    let hasTransparency = false;

    for (const indicator of transparencyIndicators) {
      if (indicator.check) {
        // Für Patterns mit Wert-Prüfung (ca/CA)
        const matches = text.matchAll(indicator.pattern);
        for (const m of matches) {
          if (m[1] && indicator.check(m[1])) {
            hasTransparency = true;
            break;
          }
        }
      } else {
        if (indicator.pattern.test(text)) {
          hasTransparency = true;
          break;
        }
      }
      if (hasTransparency) break;
    }

    if (hasTransparency) {
      warnings.push({
        type: "transparency",
        message: "Transparenzen erkannt! Transparente Bereiche können beim Textildruck zu unerwarteten Ergebnissen führen (z. B. weiße Flächen statt Durchsichtigkeit). Bitte prüfe die Datei und reduziere Transparenzen.",
      });
    }
  } catch {
    // Bei Fehler keine Warnung – Datei wird trotzdem akzeptiert
  }

  return warnings;
}

/**
 * Prüft ein Bild auf Transparenz (Alpha-Kanal).
 * Zeichnet das Bild auf einen Canvas und prüft die Alpha-Werte.
 */
async function checkImageTransparency(file: File): Promise<UploadWarning[]> {
  const warnings: UploadWarning[] = [];

  // Nur PNG und WebP können Transparenz haben
  if (!file.type.includes("png") && !file.type.includes("webp")) {
    return warnings;
  }

  try {
    const url = URL.createObjectURL(file);
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = reject;
      i.src = url;
    });
    URL.revokeObjectURL(url);

    // Canvas erstellen und Bild zeichnen
    const canvas = document.createElement("canvas");
    // Für Performance: nur einen Ausschnitt prüfen (max 500x500)
    const scale = Math.min(1, 500 / Math.max(img.naturalWidth, img.naturalHeight));
    canvas.width = Math.round(img.naturalWidth * scale);
    canvas.height = Math.round(img.naturalHeight * scale);

    const ctx = canvas.getContext("2d");
    if (!ctx) return warnings;

    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // Prüfe Alpha-Kanal (jedes 4. Byte)
    let transparentPixels = 0;
    let semiTransparentPixels = 0;
    const totalPixels = data.length / 4;

    for (let i = 3; i < data.length; i += 4) {
      if (data[i] === 0) {
        transparentPixels++;
      } else if (data[i] < 255) {
        semiTransparentPixels++;
      }
    }

    const transparentPercent = ((transparentPixels + semiTransparentPixels) / totalPixels) * 100;

    if (transparentPercent > 0.5) {
      // Mehr als 0.5% transparente Pixel
      const detail = semiTransparentPixels > 0
        ? `${transparentPercent.toFixed(1)}% der Pixel sind transparent oder halbtransparent.`
        : `${transparentPercent.toFixed(1)}% der Pixel sind vollständig transparent.`;

      warnings.push({
        type: "transparency",
        message: `Transparenzen erkannt! ${detail} Beim Textildruck werden transparente Bereiche möglicherweise weiß gedruckt. Bitte prüfe die Datei.`,
      });
    }
  } catch {
    // Bei Fehler keine Warnung
  }

  return warnings;
}

/**
 * Hauptfunktion: Prüft eine hochgeladene Datei auf Druckprobleme.
 * Erkennt automatisch ob es ein PDF oder Bild ist.
 */
export async function checkUploadFile(file: File): Promise<UploadCheckResult> {
  const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");

  let warnings: UploadWarning[] = [];

  if (isPdf) {
    warnings = await checkPdfFile(file);
  } else {
    warnings = await checkImageTransparency(file);
  }

  return { warnings, isPdf };
}
