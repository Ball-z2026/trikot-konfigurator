import { describe, it, expect } from "vitest";

// Replicate the CMYK utility functions for server-side testing
// (same logic as client/src/lib/cmyk.ts)

interface CMYK {
  c: number;
  m: number;
  y: number;
  k: number;
}

interface RGB {
  r: number;
  g: number;
  b: number;
}

function rgbToCmyk(r: number, g: number, b: number): CMYK {
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;
  const k = 1 - Math.max(rNorm, gNorm, bNorm);
  if (k === 1) return { c: 0, m: 0, y: 0, k: 100 };
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

function cmykToRgb(c: number, m: number, y: number, k: number): RGB {
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

function hexToRgb(hex: string): RGB {
  const clean = hex.replace("#", "");
  const bigint = parseInt(clean, 16);
  return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255,
  };
}

function rgbToHex(r: number, g: number, b: number): string {
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

function hexToCmyk(hex: string): CMYK {
  const rgb = hexToRgb(hex);
  return rgbToCmyk(rgb.r, rgb.g, rgb.b);
}

function cmykToHex(c: number, m: number, y: number, k: number): string {
  const { r, g, b } = cmykToRgb(c, m, y, k);
  return rgbToHex(r, g, b);
}

function formatCmyk(cmyk: CMYK): string {
  return `C:${cmyk.c} M:${cmyk.m} Y:${cmyk.y} K:${cmyk.k}`;
}

function parseCmykString(str: string): CMYK | null {
  const match = str.match(/C:(\d+)\s*M:(\d+)\s*Y:(\d+)\s*K:(\d+)/i);
  if (!match) return null;
  return {
    c: Math.min(100, parseInt(match[1])),
    m: Math.min(100, parseInt(match[2])),
    y: Math.min(100, parseInt(match[3])),
    k: Math.min(100, parseInt(match[4])),
  };
}

describe("CMYK-Konvertierung", () => {
  describe("RGB → CMYK", () => {
    it("sollte Schwarz korrekt konvertieren", () => {
      expect(rgbToCmyk(0, 0, 0)).toEqual({ c: 0, m: 0, y: 0, k: 100 });
    });

    it("sollte Weiß korrekt konvertieren", () => {
      expect(rgbToCmyk(255, 255, 255)).toEqual({ c: 0, m: 0, y: 0, k: 0 });
    });

    it("sollte reines Rot korrekt konvertieren", () => {
      expect(rgbToCmyk(255, 0, 0)).toEqual({ c: 0, m: 100, y: 100, k: 0 });
    });

    it("sollte reines Grün korrekt konvertieren", () => {
      expect(rgbToCmyk(0, 255, 0)).toEqual({ c: 100, m: 0, y: 100, k: 0 });
    });

    it("sollte reines Blau korrekt konvertieren", () => {
      expect(rgbToCmyk(0, 0, 255)).toEqual({ c: 100, m: 100, y: 0, k: 0 });
    });

    it("sollte Cyan korrekt konvertieren", () => {
      expect(rgbToCmyk(0, 255, 255)).toEqual({ c: 100, m: 0, y: 0, k: 0 });
    });

    it("sollte Magenta korrekt konvertieren", () => {
      expect(rgbToCmyk(255, 0, 255)).toEqual({ c: 0, m: 100, y: 0, k: 0 });
    });

    it("sollte Gelb korrekt konvertieren", () => {
      expect(rgbToCmyk(255, 255, 0)).toEqual({ c: 0, m: 0, y: 100, k: 0 });
    });

    it("sollte Grau korrekt konvertieren", () => {
      const cmyk = rgbToCmyk(128, 128, 128);
      expect(cmyk.c).toBe(0);
      expect(cmyk.m).toBe(0);
      expect(cmyk.y).toBe(0);
      expect(cmyk.k).toBeGreaterThan(45);
      expect(cmyk.k).toBeLessThan(55);
    });
  });

  describe("CMYK → RGB", () => {
    it("sollte Schwarz korrekt konvertieren", () => {
      expect(cmykToRgb(0, 0, 0, 100)).toEqual({ r: 0, g: 0, b: 0 });
    });

    it("sollte Weiß korrekt konvertieren", () => {
      expect(cmykToRgb(0, 0, 0, 0)).toEqual({ r: 255, g: 255, b: 255 });
    });

    it("sollte reines Rot korrekt konvertieren", () => {
      expect(cmykToRgb(0, 100, 100, 0)).toEqual({ r: 255, g: 0, b: 0 });
    });

    it("sollte Werte auf 0-255 clampen", () => {
      const rgb = cmykToRgb(0, 0, 0, 0);
      expect(rgb.r).toBeLessThanOrEqual(255);
      expect(rgb.g).toBeLessThanOrEqual(255);
      expect(rgb.b).toBeLessThanOrEqual(255);
      expect(rgb.r).toBeGreaterThanOrEqual(0);
    });
  });

  describe("HEX ↔ CMYK Roundtrip", () => {
    it("sollte HEX → CMYK → HEX konsistent sein (Schwarz)", () => {
      const cmyk = hexToCmyk("#000000");
      const hex = cmykToHex(cmyk.c, cmyk.m, cmyk.y, cmyk.k);
      expect(hex).toBe("#000000");
    });

    it("sollte HEX → CMYK → HEX konsistent sein (Weiß)", () => {
      const cmyk = hexToCmyk("#ffffff");
      const hex = cmykToHex(cmyk.c, cmyk.m, cmyk.y, cmyk.k);
      expect(hex).toBe("#ffffff");
    });

    it("sollte HEX → CMYK → HEX konsistent sein (Rot)", () => {
      const cmyk = hexToCmyk("#ff0000");
      const hex = cmykToHex(cmyk.c, cmyk.m, cmyk.y, cmyk.k);
      expect(hex).toBe("#ff0000");
    });

    it("sollte HEX → CMYK → HEX nahe am Original sein (gemischte Farbe)", () => {
      // Rundungsfehler sind bei CMYK-Konvertierung normal
      const original = "#1e3a5f";
      const cmyk = hexToCmyk(original);
      const roundtrip = cmykToHex(cmyk.c, cmyk.m, cmyk.y, cmyk.k);
      // Prüfe, dass die Farbe nahe am Original ist (max 5 Abweichung pro Kanal)
      const origRgb = hexToRgb(original);
      const rtRgb = hexToRgb(roundtrip);
      expect(Math.abs(origRgb.r - rtRgb.r)).toBeLessThanOrEqual(5);
      expect(Math.abs(origRgb.g - rtRgb.g)).toBeLessThanOrEqual(5);
      expect(Math.abs(origRgb.b - rtRgb.b)).toBeLessThanOrEqual(5);
    });
  });

  describe("formatCmyk", () => {
    it("sollte CMYK korrekt formatieren", () => {
      expect(formatCmyk({ c: 0, m: 100, y: 100, k: 0 })).toBe("C:0 M:100 Y:100 K:0");
    });

    it("sollte Nullwerte korrekt formatieren", () => {
      expect(formatCmyk({ c: 0, m: 0, y: 0, k: 0 })).toBe("C:0 M:0 Y:0 K:0");
    });

    it("sollte maximale Werte korrekt formatieren", () => {
      expect(formatCmyk({ c: 100, m: 100, y: 100, k: 100 })).toBe("C:100 M:100 Y:100 K:100");
    });
  });

  describe("parseCmykString", () => {
    it("sollte gültigen CMYK-String parsen", () => {
      expect(parseCmykString("C:20 M:80 Y:100 K:0")).toEqual({ c: 20, m: 80, y: 100, k: 0 });
    });

    it("sollte ungültigen String als null zurückgeben", () => {
      expect(parseCmykString("invalid")).toBeNull();
    });

    it("sollte Werte auf 100 begrenzen", () => {
      const result = parseCmykString("C:150 M:200 Y:300 K:400");
      expect(result).toEqual({ c: 100, m: 100, y: 100, k: 100 });
    });

    it("sollte case-insensitiv sein", () => {
      expect(parseCmykString("c:50 m:50 y:50 k:50")).toEqual({ c: 50, m: 50, y: 50, k: 50 });
    });
  });

  describe("Druckfarben-Vorlagen", () => {
    const PRINT_COLORS = [
      { name: "Weiß", cmyk: { c: 0, m: 0, y: 0, k: 0 }, hex: "#ffffff" },
      { name: "Schwarz", cmyk: { c: 0, m: 0, y: 0, k: 100 }, hex: "#000000" },
      { name: "Rot", cmyk: { c: 0, m: 100, y: 100, k: 0 }, hex: "#ff0000" },
    ];

    it("sollte konsistente HEX-Werte für Vorlagen haben", () => {
      for (const preset of PRINT_COLORS) {
        const computedHex = cmykToHex(preset.cmyk.c, preset.cmyk.m, preset.cmyk.y, preset.cmyk.k);
        expect(computedHex.toLowerCase()).toBe(preset.hex.toLowerCase());
      }
    });

    it("sollte konsistente CMYK-Werte für Vorlagen haben", () => {
      for (const preset of PRINT_COLORS) {
        const computedCmyk = hexToCmyk(preset.hex);
        expect(computedCmyk).toEqual(preset.cmyk);
      }
    });
  });
});
