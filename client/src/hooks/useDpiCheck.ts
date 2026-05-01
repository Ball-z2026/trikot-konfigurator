/**
 * DPI-Prüfung für hochgeladene Bilder.
 * Berechnet die effektive DPI basierend auf der Pixel-Auflösung des Bildes
 * und der vorgesehenen Druckfläche in cm.
 * 
 * Mindestanforderung: 300 DPI für professionellen Textildruck.
 */

const MIN_DPI = 300;
const CM_PER_INCH = 2.54;

export type DpiCheckResult = {
  valid: boolean;
  dpiX: number;
  dpiY: number;
  minDpi: number;
  imageWidth: number;
  imageHeight: number;
  requiredWidth: number;
  requiredHeight: number;
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

  const requiredWidth = Math.ceil(MIN_DPI * printWidthInch);
  const requiredHeight = Math.ceil(MIN_DPI * printHeightInch);

  const valid = minDpi >= MIN_DPI;

  let message: string;
  if (valid) {
    message = `Auflösung OK: ${minDpi} DPI (mind. ${MIN_DPI} DPI erforderlich)`;
  } else {
    message = `Auflösung zu gering: ${minDpi} DPI. Für eine Druckfläche von ${printWidthCm} × ${printHeightCm} cm werden mindestens ${requiredWidth} × ${requiredHeight} Pixel benötigt (300 DPI).`;
  }

  return {
    valid,
    dpiX,
    dpiY,
    minDpi,
    imageWidth,
    imageHeight,
    requiredWidth,
    requiredHeight,
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
