/**
 * Kontrast-Utilities für automatische Farbanpassung
 * 
 * Wird verwendet um sicherzustellen, dass:
 * - Blaues Vereinswappen auf blauem Hintergrund → automatisch in Weiß dargestellt wird
 * - Texte (Nummern, Namen) immer lesbar sind (ausreichend Kontrast zum Hintergrund)
 * - Logos automatisch in der richtigen Farbversion verwendet werden
 */

// ═══════════════════════════════════════════════════════════════════
// Farb-Konvertierungen
// ═══════════════════════════════════════════════════════════════════

export interface RGB {
  r: number; // 0-255
  g: number; // 0-255
  b: number; // 0-255
}

export interface HSL {
  h: number; // 0-360
  s: number; // 0-100
  l: number; // 0-100
}

/**
 * Hex-Farbe in RGB konvertieren
 */
export function hexToRgb(hex: string): RGB {
  const clean = hex.replace("#", "");
  const num = parseInt(clean, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

/**
 * RGB in Hex konvertieren
 */
export function rgbToHex(r: number, g: number, b: number): string {
  return "#" + [r, g, b].map(c => c.toString(16).padStart(2, "0")).join("");
}

/**
 * RGB in HSL konvertieren
 */
export function rgbToHsl(r: number, g: number, b: number): HSL {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0, s = 0;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

// ═══════════════════════════════════════════════════════════════════
// Luminanz & Kontrast (WCAG 2.1)
// ═══════════════════════════════════════════════════════════════════

/**
 * Relative Luminanz nach WCAG 2.1 berechnen
 * Gibt einen Wert zwischen 0 (schwarz) und 1 (weiß) zurück
 */
export function getRelativeLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  const [rs, gs, bs] = [r, g, b].map(c => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Kontrastverhältnis zwischen zwei Farben berechnen (WCAG 2.1)
 * Gibt einen Wert zwischen 1:1 (identisch) und 21:1 (schwarz/weiß) zurück
 */
export function getContrastRatio(color1: string, color2: string): number {
  const lum1 = getRelativeLuminance(color1);
  const lum2 = getRelativeLuminance(color2);
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Prüft ob eine Farbe "dunkel" ist (Luminanz < 0.5)
 */
export function isDarkColor(hex: string): boolean {
  return getRelativeLuminance(hex) < 0.2;
}

/**
 * Prüft ob eine Farbe "hell" ist (Luminanz > 0.5)
 */
export function isLightColor(hex: string): boolean {
  return getRelativeLuminance(hex) > 0.5;
}

// ═══════════════════════════════════════════════════════════════════
// Farbähnlichkeit (Hue-basiert)
// ═══════════════════════════════════════════════════════════════════

/**
 * Prüft ob zwei Farben ähnlich genug sind, dass ein Element unsichtbar wäre.
 * Berücksichtigt Farbton (Hue), Sättigung und Helligkeit.
 * 
 * @returns true wenn die Farben zu ähnlich sind und das Element nicht sichtbar wäre
 */
export function colorsAreTooSimilar(color1: string, color2: string): boolean {
  // Kontrastverhältnis prüfen (WCAG AA: mindestens 3:1 für große Texte/Grafiken)
  const ratio = getContrastRatio(color1, color2);
  if (ratio < 3.0) return true;
  
  // Zusätzlich: Farbton-Nähe prüfen (gleicher Farbbereich)
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);
  const hsl1 = rgbToHsl(rgb1.r, rgb1.g, rgb1.b);
  const hsl2 = rgbToHsl(rgb2.r, rgb2.g, rgb2.b);
  
  // Wenn beide Farben im gleichen Farbbereich sind (±30° Hue) UND ähnliche Sättigung haben
  const hueDiff = Math.abs(hsl1.h - hsl2.h);
  const hueClose = hueDiff < 30 || hueDiff > 330; // Berücksichtigt Wrap-around bei 360°
  const satClose = Math.abs(hsl1.s - hsl2.s) < 30;
  
  if (hueClose && satClose && ratio < 4.5) return true;
  
  return false;
}

// ═══════════════════════════════════════════════════════════════════
// Automatische Farbanpassung
// ═══════════════════════════════════════════════════════════════════

/**
 * Gibt die beste kontrastierende Farbe zurück (Weiß oder Schwarz)
 */
export function getContrastingColor(bgColor: string): string {
  return isDarkColor(bgColor) ? "#FFFFFF" : "#000000";
}

/**
 * Bestimmt die optimale Textfarbe für einen gegebenen Hintergrund.
 * Berücksichtigt die gewünschte Farbe und passt sie an wenn nötig.
 * 
 * @param desiredColor - Die gewünschte Textfarbe
 * @param bgColor - Die Hintergrundfarbe
 * @returns Die angepasste Textfarbe (original wenn Kontrast ausreicht, sonst Weiß/Schwarz)
 */
export function ensureTextContrast(desiredColor: string, bgColor: string): string {
  const ratio = getContrastRatio(desiredColor, bgColor);
  // WCAG AA für großen Text: mindestens 3:1
  if (ratio >= 3.0) return desiredColor;
  // Farbe hat nicht genug Kontrast → Weiß oder Schwarz verwenden
  return getContrastingColor(bgColor);
}

/**
 * Bestimmt die optimale Outline-Farbe für Text auf einem gegebenen Hintergrund.
 * Wird verwendet wenn der Text selbst nicht genug Kontrast hat.
 * 
 * @param textColor - Die Textfarbe
 * @param bgColor - Die Hintergrundfarbe
 * @returns { needsOutline, outlineColor, outlineWidth } - Ob eine Outline nötig ist und welche
 */
export function getTextOutlineForContrast(
  textColor: string,
  bgColor: string
): { needsOutline: boolean; outlineColor: string; outlineWidth: number } {
  const ratio = getContrastRatio(textColor, bgColor);
  
  // Genug Kontrast → keine Outline nötig
  if (ratio >= 4.5) {
    return { needsOutline: false, outlineColor: "none", outlineWidth: 0 };
  }
  
  // Mittlerer Kontrast (3-4.5) → dünne Outline
  if (ratio >= 3.0) {
    const outlineColor = isDarkColor(textColor) ? "#FFFFFF" : "#000000";
    return { needsOutline: true, outlineColor, outlineWidth: 3 };
  }
  
  // Schlechter Kontrast (<3) → dicke Outline
  const outlineColor = isDarkColor(textColor) ? "#FFFFFF" : "#000000";
  return { needsOutline: true, outlineColor, outlineWidth: 5 };
}

// ═══════════════════════════════════════════════════════════════════
// Logo/Wappen Kontrast-Logik
// ═══════════════════════════════════════════════════════════════════

/**
 * Bestimmt ob ein Logo/Wappen in seiner Originalfarbe oder in Weiß dargestellt werden soll.
 * 
 * Logik: Wenn die dominante Farbe des Logos zu ähnlich zur Hintergrundfarbe ist,
 * soll das Logo in Weiß (oder der Kontrastfarbe) dargestellt werden.
 * 
 * @param logoDominantColor - Die dominante Farbe des Logos (Hex)
 * @param bgColor - Die Hintergrundfarbe des Trikots an der Logo-Position (Hex)
 * @returns { useWhiteVersion: boolean, tintColor: string }
 */
export function shouldUseWhiteLogoVersion(
  logoDominantColor: string,
  bgColor: string
): { useWhiteVersion: boolean; tintColor: string } {
  // Prüfe ob Logo-Farbe und Hintergrund zu ähnlich sind
  if (colorsAreTooSimilar(logoDominantColor, bgColor)) {
    // Logo wäre unsichtbar → weiße Version verwenden
    const tintColor = isDarkColor(bgColor) ? "#FFFFFF" : "#000000";
    return { useWhiteVersion: true, tintColor };
  }
  
  return { useWhiteVersion: false, tintColor: logoDominantColor };
}

/**
 * Bestimmt die optimale Farbe für ein Vereinswappen basierend auf dem Trikot-Hintergrund.
 * 
 * Regeln:
 * 1. Blaues Wappen auf blauem Trikot → Weiß
 * 2. Gelbes Wappen auf gelbem Trikot → Schwarz oder Dunkelblau
 * 3. Rotes Wappen auf rotem Trikot → Weiß
 * 4. Sonst: Originalfarbe beibehalten
 * 
 * @param clubColors - Array der Vereinsfarben (Hex)
 * @param bgColor - Hintergrundfarbe an der Wappen-Position
 * @returns Empfehlung für die Wappen-Darstellung
 */
export function getOptimalCrestDisplay(
  clubColors: string[],
  bgColor: string
): { mode: "original" | "white" | "black" | "tinted"; tintColor?: string } {
  if (!clubColors || clubColors.length === 0) {
    return { mode: "original" };
  }
  
  // Prüfe ob die Hauptfarbe des Wappens zu ähnlich zum Hintergrund ist
  const primaryClubColor = clubColors[0];
  const { useWhiteVersion, tintColor } = shouldUseWhiteLogoVersion(primaryClubColor, bgColor);
  
  if (useWhiteVersion) {
    if (tintColor === "#FFFFFF") return { mode: "white" };
    if (tintColor === "#000000") return { mode: "black" };
    return { mode: "tinted", tintColor };
  }
  
  // Prüfe auch die sekundäre Vereinsfarbe
  if (clubColors.length > 1) {
    const secondaryColor = clubColors[1];
    const secondaryResult = shouldUseWhiteLogoVersion(secondaryColor, bgColor);
    // Wenn die sekundäre Farbe auch problematisch ist, verwende Kontrastfarbe
    if (secondaryResult.useWhiteVersion && colorsAreTooSimilar(primaryClubColor, bgColor)) {
      return { mode: "white" };
    }
  }
  
  return { mode: "original" };
}

/**
 * Berechnet die optimale Opacity für ein Wasserzeichen basierend auf dem Hintergrund.
 * Dunklere Hintergründe brauchen hellere Wasserzeichen (höhere Opacity).
 */
export function getOptimalWatermarkOpacity(bgColor: string, baseOpacity: number = 15): number {
  const lum = getRelativeLuminance(bgColor);
  // Auf dunklem Hintergrund: Opacity leicht erhöhen für Sichtbarkeit
  if (lum < 0.1) return Math.min(baseOpacity + 10, 40);
  if (lum < 0.3) return Math.min(baseOpacity + 5, 30);
  return baseOpacity;
}
