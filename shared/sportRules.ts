/**
 * Offizielle Verbandsregeln für Trikot-Beschriftung pro Sportart.
 * 
 * Quellen:
 * - Fußball: DFB Durchführungsbestimmungen §7, DFL Richtlinie für Spielkleidung
 * - Handball: DHB Spielordnung
 * - Volleyball: FIVB/DVV Offizielle Regeln 2025-2028
 * - Basketball: FIBA/DBB Offizielle Basketball-Regeln 2024
 * 
 * Alle Maße beziehen sich auf Erwachsenen-Trikots (Herren).
 * Für Jugend/Damen gelten ggf. reduzierte Maße.
 */

import type { SportType } from "./templates";

export interface ZoneRule {
  /** Bezeichnung der Zone */
  label: string;
  /** Zweck der Zone */
  purpose: "playerNumber" | "playerName" | "clubLogo" | "logo" | "custom";
  /** Seite: Vorder- oder Rückteil */
  side: "front" | "back";
  /** Pflichtfeld */
  required: boolean;
  /** Minimale Höhe in cm */
  minHeightCm?: number;
  /** Maximale Höhe in cm */
  maxHeightCm?: number;
  /** Minimale Breite in cm */
  minWidthCm?: number;
  /** Maximale Breite in cm */
  maxWidthCm?: number;
  /** Maximale Fläche in cm² */
  maxAreaCm2?: number;
  /** Beschreibung der Regel (für Tooltip/Warnung) */
  description: string;
}

export interface SportRuleSet {
  /** Sportart */
  sport: SportType;
  /** Name des Verbands */
  federation: string;
  /** Mindestabstand von Nähten in cm (universell) */
  seamMarginCm: number;
  /** Regeln pro Zone */
  zoneRules: ZoneRule[];
}

/**
 * Universeller Mindestabstand von allen Nähten: 2 cm
 */
export const UNIVERSAL_SEAM_MARGIN_CM = 2;

/**
 * Verbandsregeln pro Sportart
 */
export const SPORT_RULES: Partial<Record<SportType, SportRuleSet>> = {
  fussball: {
    sport: "fussball",
    federation: "DFB / FIFA",
    seamMarginCm: UNIVERSAL_SEAM_MARGIN_CM,
    zoneRules: [
      {
        label: "Rückennummer",
        purpose: "playerNumber",
        side: "back",
        required: true,
        minHeightCm: 25,
        maxHeightCm: 35,
        description: "DFB §7: Rückennummer muss 25-35 cm hoch sein, zentriert auf der Rückseite.",
      },
      {
        label: "Brustnummer",
        purpose: "playerNumber",
        side: "front",
        required: false,
        minHeightCm: 10,
        maxHeightCm: 15,
        description: "DFB: Brustnummer optional, 10-15 cm Höhe.",
      },
      {
        label: "Spielername",
        purpose: "playerName",
        side: "back",
        required: false,
        maxHeightCm: 7.5,
        description: "DFB: Spielername auf der Rückseite, max. 7,5 cm Höhe, oberhalb der Rückennummer.",
      },
      {
        label: "Vereinswappen",
        purpose: "clubLogo",
        side: "front",
        required: true,
        maxAreaCm2: 100,
        description: "DFB: Vereinswappen auf der linken Brust (Herzseite), max. 100 cm².",
      },
      {
        label: "Brust-Sponsor",
        purpose: "logo",
        side: "front",
        required: false,
        maxAreaCm2: 200,
        maxHeightCm: 20,
        description: "DFB: Hauptsponsor auf der Brust, max. 200 cm².",
      },
      {
        label: "Ärmel-Sponsor",
        purpose: "logo",
        side: "front",
        required: false,
        maxAreaCm2: 100,
        description: "DFB: Ärmelsponsor max. 100 cm².",
      },
      {
        label: "Rücken-Sponsor",
        purpose: "logo",
        side: "back",
        required: false,
        maxAreaCm2: 200,
        maxHeightCm: 7.5,
        description: "DFB: Rückensponsor max. 200 cm², max. 7,5 cm Höhe.",
      },
    ],
  },

  handball: {
    sport: "handball",
    federation: "DHB / IHF",
    seamMarginCm: UNIVERSAL_SEAM_MARGIN_CM,
    zoneRules: [
      {
        label: "Rückennummer",
        purpose: "playerNumber",
        side: "back",
        required: true,
        minHeightCm: 20,
        maxHeightCm: 35,
        description: "DHB: Rückennummer muss 20-35 cm hoch sein, zentriert.",
      },
      {
        label: "Brustnummer",
        purpose: "playerNumber",
        side: "front",
        required: true,
        minHeightCm: 10,
        maxHeightCm: 15,
        description: "DHB: Brustnummer Pflicht, 10-15 cm Höhe.",
      },
      {
        label: "Spielername",
        purpose: "playerName",
        side: "back",
        required: false,
        maxHeightCm: 7.5,
        description: "DHB: Spielername optional, max. 7,5 cm Höhe.",
      },
      {
        label: "Vereinswappen",
        purpose: "clubLogo",
        side: "front",
        required: true,
        maxAreaCm2: 100,
        description: "DHB: Vereinswappen auf der Brust, max. 100 cm².",
      },
      {
        label: "Brust-Sponsor",
        purpose: "logo",
        side: "front",
        required: false,
        maxAreaCm2: 200,
        description: "DHB: Hauptsponsor max. 200 cm².",
      },
    ],
  },

  volleyball: {
    sport: "volleyball",
    federation: "DVV / FIVB",
    seamMarginCm: UNIVERSAL_SEAM_MARGIN_CM,
    zoneRules: [
      {
        label: "Rückennummer",
        purpose: "playerNumber",
        side: "back",
        required: true,
        minHeightCm: 15,
        maxHeightCm: 20,
        description: "FIVB/DVV: Rückennummer mind. 15 cm, max. 20 cm Höhe.",
      },
      {
        label: "Brustnummer",
        purpose: "playerNumber",
        side: "front",
        required: true,
        minHeightCm: 10,
        maxHeightCm: 15,
        description: "FIVB/DVV: Brustnummer Pflicht, mind. 10 cm Höhe (ab Regionalliga mind. 15 cm).",
      },
      {
        label: "Spielername",
        purpose: "playerName",
        side: "back",
        required: false,
        maxHeightCm: 6,
        description: "DVV: Spielername optional, max. 6 cm Höhe.",
      },
      {
        label: "Vereinswappen",
        purpose: "clubLogo",
        side: "front",
        required: true,
        maxAreaCm2: 80,
        description: "DVV: Vereinswappen auf der Brust, max. 80 cm².",
      },
      {
        label: "Brust-Sponsor",
        purpose: "logo",
        side: "front",
        required: false,
        maxAreaCm2: 300,
        description: "DVV: Hauptsponsor auf der Brust, max. 300 cm².",
      },
    ],
  },

  basketball: {
    sport: "basketball",
    federation: "DBB / FIBA",
    seamMarginCm: UNIVERSAL_SEAM_MARGIN_CM,
    zoneRules: [
      {
        label: "Rückennummer",
        purpose: "playerNumber",
        side: "back",
        required: true,
        minHeightCm: 20,
        maxHeightCm: 30,
        description: "FIBA/DBB: Rückennummer mind. 20 cm hoch.",
      },
      {
        label: "Brustnummer",
        purpose: "playerNumber",
        side: "front",
        required: true,
        minHeightCm: 10,
        maxHeightCm: 20,
        description: "FIBA/DBB: Brustnummer Pflicht, mind. 10 cm hoch.",
      },
      {
        label: "Spielername",
        purpose: "playerName",
        side: "back",
        required: false,
        maxHeightCm: 8,
        description: "FIBA: Spielername auf der Rückseite, max. 8 cm Höhe.",
      },
      {
        label: "Vereinswappen",
        purpose: "clubLogo",
        side: "front",
        required: true,
        maxAreaCm2: 100,
        description: "DBB: Vereinswappen auf der Brust, max. 100 cm².",
      },
      {
        label: "Brust-Sponsor",
        purpose: "logo",
        side: "front",
        required: false,
        maxAreaCm2: 200,
        description: "DBB: Hauptsponsor max. 200 cm².",
      },
    ],
  },
};

/**
 * Naht-Positionen für Standard-Trikot-Teile (Größe L, flach liegend).
 * Alle Werte in % des jeweiligen Teils.
 */
export const STANDARD_SEAM_POSITIONS = {
  /** Vorderteil: Schulternähte oben, Seitennähte links/rechts, Ärmelansatz */
  vorderteil: [
    { label: "Schulternaht links", x1: 0, y1: 5, x2: 25, y2: 0 },
    { label: "Schulternaht rechts", x1: 75, y1: 0, x2: 100, y2: 5 },
    { label: "Seitennaht links", x1: 0, y1: 5, x2: 0, y2: 100 },
    { label: "Seitennaht rechts", x1: 100, y1: 5, x2: 100, y2: 100 },
    { label: "Ärmelansatz links", x1: 0, y1: 5, x2: 5, y2: 35 },
    { label: "Ärmelansatz rechts", x1: 95, y1: 35, x2: 100, y2: 5 },
    { label: "Kragennaht", x1: 30, y1: 0, x2: 70, y2: 0 },
    { label: "Saumnaht unten", x1: 0, y1: 100, x2: 100, y2: 100 },
  ],
  /** Rückteil: Identisch zum Vorderteil */
  rueckteil: [
    { label: "Schulternaht links", x1: 0, y1: 5, x2: 25, y2: 0 },
    { label: "Schulternaht rechts", x1: 75, y1: 0, x2: 100, y2: 5 },
    { label: "Seitennaht links", x1: 0, y1: 5, x2: 0, y2: 100 },
    { label: "Seitennaht rechts", x1: 100, y1: 5, x2: 100, y2: 100 },
    { label: "Ärmelansatz links", x1: 0, y1: 5, x2: 5, y2: 35 },
    { label: "Ärmelansatz rechts", x1: 95, y1: 35, x2: 100, y2: 5 },
    { label: "Kragennaht", x1: 30, y1: 0, x2: 70, y2: 0 },
    { label: "Saumnaht unten", x1: 0, y1: 100, x2: 100, y2: 100 },
  ],
  /** Ärmel: Schulternaht oben, Seitennaht, Bündchen unten */
  aermel: [
    { label: "Schulternaht", x1: 0, y1: 0, x2: 100, y2: 0 },
    { label: "Seitennaht innen", x1: 0, y1: 0, x2: 0, y2: 100 },
    { label: "Seitennaht außen", x1: 100, y1: 0, x2: 100, y2: 100 },
    { label: "Bündchennaht", x1: 0, y1: 100, x2: 100, y2: 100 },
  ],
  /** Kragen: Nähte an allen Seiten */
  kragen: [
    { label: "Oberkante", x1: 0, y1: 0, x2: 100, y2: 0 },
    { label: "Unterkante", x1: 0, y1: 100, x2: 100, y2: 100 },
    { label: "Seite links", x1: 0, y1: 0, x2: 0, y2: 100 },
    { label: "Seite rechts", x1: 100, y1: 0, x2: 100, y2: 100 },
  ],
};

/**
 * Berechnet den Mindestabstand einer Zone von der nächsten Naht in cm.
 * 
 * @param zone - Position und Größe der Zone in %
 * @param seams - Naht-Positionen in %
 * @param partWidthCm - Reale Breite des Parts in cm
 * @param partHeightCm - Reale Höhe des Parts in cm
 * @returns Abstand in cm zur nächsten Naht (negativ = Zone überlappt Naht)
 */
export function calculateSeamDistance(
  zone: { posX: number; posY: number; width: number; height: number },
  seams: Array<{ x1: number; y1: number; x2: number; y2: number }>,
  partWidthCm: number,
  partHeightCm: number
): { distanceCm: number; nearestSeam: string; isViolation: boolean } {
  // Zone-Grenzen in %
  const zoneLeft = zone.posX;
  const zoneRight = zone.posX + zone.width;
  const zoneTop = zone.posY;
  const zoneBottom = zone.posY + zone.height;

  // 2cm in % umrechnen
  const marginXPercent = (UNIVERSAL_SEAM_MARGIN_CM / partWidthCm) * 100;
  const marginYPercent = (UNIVERSAL_SEAM_MARGIN_CM / partHeightCm) * 100;

  let minDistance = Infinity;
  let nearestSeamLabel = "";

  for (const seam of seams) {
    // Vereinfachte Abstandsberechnung: Punkt-zu-Linie-Abstand für alle 4 Ecken der Zone
    const corners = [
      { x: zoneLeft, y: zoneTop },
      { x: zoneRight, y: zoneTop },
      { x: zoneLeft, y: zoneBottom },
      { x: zoneRight, y: zoneBottom },
    ];

    for (const corner of corners) {
      const dist = pointToLineDistance(corner.x, corner.y, seam.x1, seam.y1, seam.x2, seam.y2);
      // In cm umrechnen (Durchschnitt von X und Y Skalierung)
      const distCmX = (dist / 100) * partWidthCm;
      const distCmY = (dist / 100) * partHeightCm;
      const distCm = Math.min(distCmX, distCmY);

      if (distCm < minDistance) {
        minDistance = distCm;
        nearestSeamLabel = (seam as any).label || "Naht";
      }
    }
  }

  return {
    distanceCm: Math.round(minDistance * 10) / 10,
    nearestSeam: nearestSeamLabel,
    isViolation: minDistance < UNIVERSAL_SEAM_MARGIN_CM,
  };
}

/**
 * Berechnet den Abstand eines Punktes zu einer Linie (in gleicher Einheit wie die Eingabe).
 */
function pointToLineDistance(
  px: number, py: number,
  x1: number, y1: number,
  x2: number, y2: number
): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;

  if (lenSq === 0) {
    // Linie ist ein Punkt
    return Math.sqrt((px - x1) ** 2 + (py - y1) ** 2);
  }

  // Projektion des Punktes auf die Linie
  let t = ((px - x1) * dx + (py - y1) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));

  const closestX = x1 + t * dx;
  const closestY = y1 + t * dy;

  return Math.sqrt((px - closestX) ** 2 + (py - closestY) ** 2);
}

/**
 * Validiert eine Zone gegen die Verbandsregeln.
 * 
 * @returns Array von Warnungen (leer = keine Verstöße)
 */
export function validateZoneAgainstRules(
  zone: { widthCm?: number | null; heightCm?: number | null; purpose: string },
  rules: ZoneRule[]
): string[] {
  const warnings: string[] = [];
  const matchingRules = rules.filter(r => r.purpose === zone.purpose);

  for (const rule of matchingRules) {
    if (zone.heightCm) {
      if (rule.minHeightCm && zone.heightCm < rule.minHeightCm) {
        warnings.push(`${rule.label}: Mindesthöhe ${rule.minHeightCm} cm unterschritten (aktuell: ${zone.heightCm} cm)`);
      }
      if (rule.maxHeightCm && zone.heightCm > rule.maxHeightCm) {
        warnings.push(`${rule.label}: Maximalhöhe ${rule.maxHeightCm} cm überschritten (aktuell: ${zone.heightCm} cm)`);
      }
    }

    if (zone.widthCm) {
      if (rule.minWidthCm && zone.widthCm < rule.minWidthCm) {
        warnings.push(`${rule.label}: Mindestbreite ${rule.minWidthCm} cm unterschritten (aktuell: ${zone.widthCm} cm)`);
      }
      if (rule.maxWidthCm && zone.widthCm > rule.maxWidthCm) {
        warnings.push(`${rule.label}: Maximalbreite ${rule.maxWidthCm} cm überschritten (aktuell: ${zone.widthCm} cm)`);
      }
    }

    if (zone.widthCm && zone.heightCm && rule.maxAreaCm2) {
      const area = zone.widthCm * zone.heightCm;
      if (area > rule.maxAreaCm2) {
        warnings.push(`${rule.label}: Maximalfläche ${rule.maxAreaCm2} cm² überschritten (aktuell: ${Math.round(area)} cm²)`);
      }
    }
  }

  return warnings;
}
