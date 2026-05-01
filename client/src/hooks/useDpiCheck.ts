/**
 * DPI-Prüfung für hochgeladene Bilder.
 * Berechnet die effektive DPI basierend auf der Pixel-Auflösung des Bildes
 * und der vorgesehenen Druckfläche in cm.
 * 
 * 3-Stufen-Prüfung:
 * - Unter 250 DPI: Ablehnung (Bild wird nicht akzeptiert)
 * - 250–299 DPI: Warnung (Bild wird zugelassen, aber Hinweis auf geringe Qualität)
 * - Ab 300 DPI: OK (optimale Druckqualität)
 */

const MIN_DPI = 250;       // Absolute Untergrenze
const OPTIMAL_DPI = 300;   // Empfohlene DPI für optimale Druckqualität
const CM_PER_INCH = 2.54;

export type DpiStatus = "rejected" | "warning" | "ok";

export type DpiCheckResult = {
  valid: boolean;       // true wenn DPI >= 250 (zugelassen)
  status: DpiStatus;    // "rejected" | "warning" | "ok"
  dpiX: number;
  dpiY: number;
  minDpi: number;
  imageWidth: number;
  imageHeight: number;
  requiredWidth: number;   // Pixel für 300 DPI
  requiredHeight: number;  // Pixel für 300 DPI
  minRequiredWidth: number;  // Pixel für 250 DPI
  minRequiredHeight: number; // Pixel für 250 DPI
  message: string;
};

/**
 * Berechnet die DPI eines Bildes basierend auf der Druckfläche.
 * @param imageWidth - Breite des Bildes in Pixeln
 * @param imageHeight - Höhe des Bildes in Pixeln
 * @param printWidthCm - Druckbreite in cm
 * @param printHeightCm - Druckhöhe in cm
 */
export function calculateDpi(
  imageWidth: number,
  imageHeight: number,
  printWidthCm: number,
  printHeightCm: number
): DpiCheckResult {
  const printWidthInch = printWidthCm / CM_PER_INCH;
  const printHeightInch = printHeightCm / CM_PER_INCH;

  const dpiX = Math.round(imageWidth / printWidthInch);
  const dpiY = Math.round(imageHeight / printHeightInch);
  const minDpi = Math.min(dpiX, dpiY);

  // Pixel-Anforderungen für optimale und minimale DPI
  const requiredWidth = Math.ceil(OPTIMAL_DPI * printWidthInch);
  const requiredHeight = Math.ceil(OPTIMAL_DPI * printHeightInch);
  const minRequiredWidth = Math.ceil(MIN_DPI * printWidthInch);
  const minRequiredHeight = Math.ceil(MIN_DPI * printHeightInch);

  let status: DpiStatus;
  let valid: boolean;
  let message: string;

  if (minDpi >= OPTIMAL_DPI) {
    // Ab 300 DPI: Alles gut
    status = "ok";
    valid = true;
    message = `Auflösung optimal: ${minDpi} DPI ✓`;
  } else if (minDpi >= MIN_DPI) {
    // 250–299 DPI: Warnung, aber zugelassen
    status = "warning";
    valid = true;
    message = `Geringe Auflösung (${minDpi} DPI) – Druckqualität könnte nicht optimal sein. Empfohlen: mindestens ${requiredWidth} × ${requiredHeight} Pixel (300 DPI).`;
  } else {
    // Unter 250 DPI: Ablehnung
    status = "rejected";
    valid = false;
    message = `Auflösung zu gering: ${minDpi} DPI. Für eine Druckfläche von ${printWidthCm} × ${printHeightCm} cm werden mindestens ${minRequiredWidth} × ${minRequiredHeight} Pixel benötigt (250 DPI). Empfohlen: ${requiredWidth} × ${requiredHeight} Pixel (300 DPI).`;
  }

  return {
    valid,
    status,
    dpiX,
    dpiY,
    minDpi,
    imageWidth,
    imageHeight,
    requiredWidth,
    requiredHeight,
    minRequiredWidth,
    minRequiredHeight,
    message,
  };
}

/**
 * Prüft ein File-Objekt auf die Mindest-DPI für eine gegebene Druckfläche.
 * @param file - Das hochzuladende Bild
 * @param printWidthCm - Druckbreite in cm (optional, wenn nicht bekannt wird nur Pixel-Mindestgröße geprüft)
 * @param printHeightCm - Druckhöhe in cm (optional)
 * @returns Promise mit dem DPI-Prüfungsergebnis
 */
export function checkImageDpi(
  file: File,
  printWidthCm?: number | null,
  printHeightCm?: number | null
): Promise<DpiCheckResult> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      const imageWidth = img.naturalWidth;
      const imageHeight = img.naturalHeight;

      // Wenn keine Druckfläche angegeben, verwende Standard-Mindestgröße (10x10cm)
      const widthCm = printWidthCm || 10;
      const heightCm = printHeightCm || 10;

      const result = calculateDpi(imageWidth, imageHeight, widthCm, heightCm);
      resolve(result);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Bild konnte nicht geladen werden"));
    };

    img.src = url;
  });
}

/**
 * Prüft eine Data-URL auf die Mindest-DPI.
 */
export function checkDataUrlDpi(
  dataUrl: string,
  printWidthCm?: number | null,
  printHeightCm?: number | null
): Promise<DpiCheckResult> {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      const imageWidth = img.naturalWidth;
      const imageHeight = img.naturalHeight;

      const widthCm = printWidthCm || 10;
      const heightCm = printHeightCm || 10;

      const result = calculateDpi(imageWidth, imageHeight, widthCm, heightCm);
      resolve(result);
    };

    img.onerror = () => {
      reject(new Error("Bild konnte nicht geladen werden"));
    };

    img.src = dataUrl;
  });
}
