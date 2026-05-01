/**
 * CMYK-Farbmodell Utilities für den Textildruck
 * 
 * CMYK (Cyan, Magenta, Yellow, Key/Black) ist das Standard-Farbmodell
 * für den professionellen Druck, insbesondere Textildruck.
 * Alle Werte sind Prozent (0-100).
 */

export interface CMYK {
  c: number; // Cyan 0-100
  m: number; // Magenta 0-100
  y: number; // Yellow 0-100
  k: number; // Key/Black 0-100
}

export interface RGB {
  r: number; // 0-255
  g: number; // 0-255
  b: number; // 0-255
}

/**
 * RGB → CMYK Konvertierung
 */
export function rgbToCmyk(r: number, g: number, b: number): CMYK {
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;

  const k = 1 - Math.max(rNorm, gNorm, bNorm);

  if (k === 1) {
    return { c: 0, m: 0, y: 0, k: 100 };
  }

  const c = ((1 - rNorm - k) / (1 - k)) * 100;
  const m = ((1 - gNorm - k) / (1 - k)) * 100;
  const y = ((1 - bNorm - k) / (1 - k)) * 100;

  return {
    c: Math.round(c),
    m: Math.round(m),
    y: Math.round(y),
    k: Math.round(k * 100),
  };
}

/**
 * CMYK → RGB Konvertierung
 */
export function cmykToRgb(c: number, m: number, y: number, k: number): RGB {
  const cNorm = c / 100;
  const mNorm = m / 100;
  const yNorm = y / 100;
  const kNorm = k / 100;

  const r = Math.round(255 * (1 - cNorm) * (1 - kNorm));
  const g = Math.round(255 * (1 - mNorm) * (1 - kNorm));
  const b = Math.round(255 * (1 - yNorm) * (1 - kNorm));

  return {
    r: Math.max(0, Math.min(255, r)),
    g: Math.max(0, Math.min(255, g)),
    b: Math.max(0, Math.min(255, b)),
  };
}

/**
 * HEX → CMYK Konvertierung
 */
export function hexToCmyk(hex: string): CMYK {
  const rgb = hexToRgb(hex);
  return rgbToCmyk(rgb.r, rgb.g, rgb.b);
}

/**
 * CMYK → HEX Konvertierung
 */
export function cmykToHex(c: number, m: number, y: number, k: number): string {
  const { r, g, b } = cmykToRgb(c, m, y, k);
  return rgbToHex(r, g, b);
}

/**
 * HEX → RGB Konvertierung
 */
export function hexToRgb(hex: string): RGB {
  const clean = hex.replace("#", "");
  const bigint = parseInt(clean, 16);
  return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255,
  };
}

/**
 * RGB → HEX Konvertierung
 */
export function rgbToHex(r: number, g: number, b: number): string {
  return (
    "#" +
    [r, g, b]
      .map((x) => {
        const hex = Math.max(0, Math.min(255, x)).toString(16);
        return hex.length === 1 ? "0" + hex : hex;
      })
      .join("")
  );
}

/**
 * CMYK-String formatieren: "C:20 M:80 Y:100 K:0"
 */
export function formatCmyk(cmyk: CMYK): string {
  return `C:${cmyk.c} M:${cmyk.m} Y:${cmyk.y} K:${cmyk.k}`;
}

/**
 * CMYK-String parsen: "C:20 M:80 Y:100 K:0" → CMYK
 */
export function parseCmykString(str: string): CMYK | null {
  const match = str.match(/C:(\d+)\s*M:(\d+)\s*Y:(\d+)\s*K:(\d+)/i);
  if (!match) return null;
  return {
    c: Math.min(100, parseInt(match[1])),
    m: Math.min(100, parseInt(match[2])),
    y: Math.min(100, parseInt(match[3])),
    k: Math.min(100, parseInt(match[4])),
  };
}

/**
 * Vordefinierte CMYK-Druckfarben für Textildruck
 */
export const PRINT_COLORS: { name: string; cmyk: CMYK; hex: string }[] = [
  { name: "Weiß", cmyk: { c: 0, m: 0, y: 0, k: 0 }, hex: "#ffffff" },
  { name: "Schwarz", cmyk: { c: 0, m: 0, y: 0, k: 100 }, hex: "#000000" },
  { name: "Rot", cmyk: { c: 0, m: 100, y: 100, k: 0 }, hex: "#ff0000" },
  { name: "Dunkelrot", cmyk: { c: 0, m: 100, y: 100, k: 30 }, hex: "#b30000" },
  { name: "Blau", cmyk: { c: 100, m: 100, y: 0, k: 0 }, hex: "#0000ff" },
  { name: "Dunkelblau", cmyk: { c: 100, m: 80, y: 0, k: 40 }, hex: "#001f99" },
  { name: "Marineblau", cmyk: { c: 100, m: 60, y: 0, k: 60 }, hex: "#002966" },
  { name: "Grün", cmyk: { c: 100, m: 0, y: 100, k: 0 }, hex: "#00ff00" },
  { name: "Dunkelgrün", cmyk: { c: 100, m: 0, y: 100, k: 40 }, hex: "#009900" },
  { name: "Gelb", cmyk: { c: 0, m: 0, y: 100, k: 0 }, hex: "#ffff00" },
  { name: "Orange", cmyk: { c: 0, m: 50, y: 100, k: 0 }, hex: "#ff8000" },
  { name: "Lila", cmyk: { c: 50, m: 100, y: 0, k: 0 }, hex: "#8000ff" },
  { name: "Pink", cmyk: { c: 0, m: 80, y: 0, k: 0 }, hex: "#ff33cc" },
  { name: "Grau", cmyk: { c: 0, m: 0, y: 0, k: 50 }, hex: "#808080" },
  { name: "Hellgrau", cmyk: { c: 0, m: 0, y: 0, k: 25 }, hex: "#bfbfbf" },
];
