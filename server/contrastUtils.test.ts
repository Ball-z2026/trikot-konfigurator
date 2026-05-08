/**
 * Tests für die Kontrast-Utilities
 * 
 * Testet die automatische Farbanpassung:
 * - Blaues Wappen auf blauem Hintergrund → Weiß
 * - Gelbe Schrift auf gelbem Hintergrund → Schwarz
 * - Guter Kontrast bleibt unverändert
 */
import { describe, it, expect } from "vitest";
import {
  hexToRgb,
  rgbToHex,
  getRelativeLuminance,
  getContrastRatio,
  isDarkColor,
  isLightColor,
  colorsAreTooSimilar,
  ensureTextContrast,
  getTextOutlineForContrast,
  shouldUseWhiteLogoVersion,
  getOptimalCrestDisplay,
  getOptimalWatermarkOpacity,
} from "../shared/contrastUtils";

describe("contrastUtils", () => {
  describe("hexToRgb", () => {
    it("konvertiert Hex-Farben korrekt", () => {
      expect(hexToRgb("#FFFFFF")).toEqual({ r: 255, g: 255, b: 255 });
      expect(hexToRgb("#000000")).toEqual({ r: 0, g: 0, b: 0 });
      expect(hexToRgb("#012f7b")).toEqual({ r: 1, g: 47, b: 123 });
      expect(hexToRgb("#fefb41")).toEqual({ r: 254, g: 251, b: 65 });
    });

    it("funktioniert ohne # Prefix", () => {
      expect(hexToRgb("FF0000")).toEqual({ r: 255, g: 0, b: 0 });
    });
  });

  describe("rgbToHex", () => {
    it("konvertiert RGB zu Hex", () => {
      expect(rgbToHex(255, 255, 255)).toBe("#ffffff");
      expect(rgbToHex(0, 0, 0)).toBe("#000000");
      expect(rgbToHex(255, 0, 0)).toBe("#ff0000");
    });
  });

  describe("getRelativeLuminance", () => {
    it("Weiß hat Luminanz 1", () => {
      expect(getRelativeLuminance("#FFFFFF")).toBeCloseTo(1, 2);
    });

    it("Schwarz hat Luminanz 0", () => {
      expect(getRelativeLuminance("#000000")).toBeCloseTo(0, 2);
    });

    it("Dunkelblau hat niedrige Luminanz", () => {
      const lum = getRelativeLuminance("#012f7b");
      expect(lum).toBeLessThan(0.1);
    });

    it("Gelb hat hohe Luminanz", () => {
      const lum = getRelativeLuminance("#fefb41");
      expect(lum).toBeGreaterThan(0.7);
    });
  });

  describe("getContrastRatio", () => {
    it("Schwarz/Weiß hat maximalen Kontrast (21:1)", () => {
      const ratio = getContrastRatio("#000000", "#FFFFFF");
      expect(ratio).toBeCloseTo(21, 0);
    });

    it("Gleiche Farben haben Kontrast 1:1", () => {
      const ratio = getContrastRatio("#012f7b", "#012f7b");
      expect(ratio).toBeCloseTo(1, 1);
    });

    it("Dunkelblau auf Dunkelblau hat schlechten Kontrast", () => {
      const ratio = getContrastRatio("#012f7b", "#0a3580");
      expect(ratio).toBeLessThan(2);
    });
  });

  describe("isDarkColor / isLightColor", () => {
    it("Dunkelblau (#012f7b) ist dunkel", () => {
      expect(isDarkColor("#012f7b")).toBe(true);
    });

    it("Gelb (#fefb41) ist hell", () => {
      expect(isLightColor("#fefb41")).toBe(true);
    });

    it("Weiß ist hell", () => {
      expect(isLightColor("#FFFFFF")).toBe(true);
    });

    it("Schwarz ist dunkel", () => {
      expect(isDarkColor("#000000")).toBe(true);
    });
  });

  describe("colorsAreTooSimilar", () => {
    it("Blau auf Blau ist zu ähnlich", () => {
      expect(colorsAreTooSimilar("#012f7b", "#0a3580")).toBe(true);
    });

    it("Blau auf Weiß ist NICHT zu ähnlich", () => {
      expect(colorsAreTooSimilar("#012f7b", "#FFFFFF")).toBe(false);
    });

    it("Gelb auf Gelb ist zu ähnlich", () => {
      expect(colorsAreTooSimilar("#fefb41", "#f5f040")).toBe(true);
    });

    it("Schwarz auf Weiß ist NICHT zu ähnlich", () => {
      expect(colorsAreTooSimilar("#000000", "#FFFFFF")).toBe(false);
    });
  });

  describe("ensureTextContrast", () => {
    it("Schwarzer Text auf weißem Hintergrund bleibt schwarz", () => {
      expect(ensureTextContrast("#000000", "#FFFFFF")).toBe("#000000");
    });

    it("Weißer Text auf schwarzem Hintergrund bleibt weiß", () => {
      expect(ensureTextContrast("#FFFFFF", "#000000")).toBe("#FFFFFF");
    });

    it("Gelber Text auf gelbem Hintergrund wird zu Schwarz", () => {
      const result = ensureTextContrast("#fefb41", "#f5f040");
      expect(result).toBe("#000000");
    });

    it("Blauer Text auf blauem Hintergrund wird zu Weiß", () => {
      const result = ensureTextContrast("#012f7b", "#0a3580");
      expect(result).toBe("#FFFFFF");
    });
  });

  describe("getTextOutlineForContrast", () => {
    it("Guter Kontrast → keine Outline nötig", () => {
      const result = getTextOutlineForContrast("#000000", "#FFFFFF");
      expect(result.needsOutline).toBe(false);
    });

    it("Schlechter Kontrast → Outline empfohlen", () => {
      const result = getTextOutlineForContrast("#012f7b", "#0a3580");
      expect(result.needsOutline).toBe(true);
      expect(result.outlineColor).toBe("#FFFFFF"); // Weiße Outline auf dunklem Hintergrund
      expect(result.outlineWidth).toBeGreaterThan(0);
    });
  });

  describe("shouldUseWhiteLogoVersion", () => {
    it("Blaues Logo auf blauem Hintergrund → weiße Version", () => {
      const result = shouldUseWhiteLogoVersion("#012f7b", "#0a3580");
      expect(result.useWhiteVersion).toBe(true);
      expect(result.tintColor).toBe("#FFFFFF");
    });

    it("Blaues Logo auf weißem Hintergrund → Original beibehalten", () => {
      const result = shouldUseWhiteLogoVersion("#012f7b", "#FFFFFF");
      expect(result.useWhiteVersion).toBe(false);
    });

    it("Rotes Logo auf rotem Hintergrund → weiße Version", () => {
      const result = shouldUseWhiteLogoVersion("#CC0000", "#AA0000");
      expect(result.useWhiteVersion).toBe(true);
    });
  });

  describe("getOptimalCrestDisplay", () => {
    it("Blaues Wappen auf blauem Trikot → weiß", () => {
      const result = getOptimalCrestDisplay(["#012f7b", "#fefb41"], "#0a3580");
      expect(result.mode).toBe("white");
    });

    it("Blaues Wappen auf weißem Trikot → original", () => {
      const result = getOptimalCrestDisplay(["#012f7b", "#fefb41"], "#FFFFFF");
      expect(result.mode).toBe("original");
    });

    it("Blaues Wappen auf gelbem Trikot → original", () => {
      const result = getOptimalCrestDisplay(["#012f7b", "#fefb41"], "#fefb41");
      expect(result.mode).toBe("original");
    });
  });

  describe("getOptimalWatermarkOpacity", () => {
    it("Dunkler Hintergrund → höhere Opacity", () => {
      const opacity = getOptimalWatermarkOpacity("#012f7b");
      expect(opacity).toBeGreaterThan(15);
    });

    it("Heller Hintergrund → Standard-Opacity", () => {
      const opacity = getOptimalWatermarkOpacity("#FFFFFF");
      expect(opacity).toBe(15);
    });
  });
});
