/**
 * Maßtabellen für Sportbekleidung – alle Maße in cm, flach liegend (halbe Breite).
 *
 * Quellen:
 * - Alisy.de Größentabellen für Fußballtrikots (Basic/Victory)
 * - Owayo Größentabellen Fußball/Handball/Volleyball/Basketball
 * - Industrie-Standards für Sublimations- und DTF-Druck
 *
 * Alle Breiten-Angaben sind HALBE BREITE (flach liegend), nicht Umfang.
 * Toleranz: ±1-2 cm je nach Material und Elastizität.
 */

export type SizeCode =
  | "3XS" | "2XS" | "XS" | "S" | "M" | "L" | "XL" | "2XL" | "3XL" | "4XL"
  | "116" | "128" | "140" | "152" | "164" | "176";

export type SportCode = "fussball" | "handball" | "volleyball" | "basketball";

export type GenderCode = "herren" | "damen" | "kinder";

/**
 * Maße eines einzelnen Trikotteils in cm (flach liegend)
 */
export interface PartDimensions {
  /** Breite in cm (halbe Breite, flach liegend) */
  widthCm: number;
  /** Höhe/Länge in cm */
  heightCm: number;
}

/**
 * Maße eines kompletten Trikots in einer bestimmten Größe
 */
export interface JerseySizeDimensions {
  /** Vorderteil / Rückteil */
  body: PartDimensions;
  /** Ärmel (falls vorhanden, z.B. nicht bei Basketball) */
  sleeve?: PartDimensions;
  /** Kragen (falls vorhanden) */
  collar?: PartDimensions;
  /** Bündchen (falls vorhanden) */
  cuff?: PartDimensions;
}

/**
 * Komplette Maßtabelle für eine Sportart + Geschlecht
 */
export interface SizeChart {
  sport: SportCode;
  gender: GenderCode;
  /** Maße pro Größe */
  sizes: Partial<Record<SizeCode, JerseySizeDimensions>>;
}

// ═══════════════════════════════════════════════════════════════════
// Fußball – Herren
// ═══════════════════════════════════════════════════════════════════

const FUSSBALL_HERREN: SizeChart = {
  sport: "fussball",
  gender: "herren",
  sizes: {
    "3XS": {
      body: { widthCm: 34, heightCm: 44 },
      sleeve: { widthCm: 17, heightCm: 23 },
    },
    "2XS": {
      body: { widthCm: 37, heightCm: 49 },
      sleeve: { widthCm: 19, heightCm: 25 },
    },
    XS: {
      body: { widthCm: 46, heightCm: 66 },
      sleeve: { widthCm: 25, heightCm: 33 },
    },
    S: {
      body: { widthCm: 49, heightCm: 68 },
      sleeve: { widthCm: 26, heightCm: 35 },
    },
    M: {
      body: { widthCm: 52, heightCm: 70 },
      sleeve: { widthCm: 28, heightCm: 37 },
    },
    L: {
      body: { widthCm: 55, heightCm: 72 },
      sleeve: { widthCm: 29, heightCm: 39 },
    },
    XL: {
      body: { widthCm: 58, heightCm: 74 },
      sleeve: { widthCm: 31, heightCm: 41 },
    },
    "2XL": {
      body: { widthCm: 61, heightCm: 76 },
      sleeve: { widthCm: 32, heightCm: 43 },
    },
    "3XL": {
      body: { widthCm: 64, heightCm: 78 },
      sleeve: { widthCm: 34, heightCm: 45 },
    },
    "4XL": {
      body: { widthCm: 67, heightCm: 80 },
      sleeve: { widthCm: 36, heightCm: 47 },
    },
    // Kindergrößen
    "116": {
      body: { widthCm: 34, heightCm: 44 },
      sleeve: { widthCm: 17, heightCm: 23 },
    },
    "128": {
      body: { widthCm: 37, heightCm: 49 },
      sleeve: { widthCm: 19, heightCm: 25 },
    },
    "140": {
      body: { widthCm: 40, heightCm: 54 },
      sleeve: { widthCm: 20, heightCm: 27 },
    },
    "152": {
      body: { widthCm: 43, heightCm: 59 },
      sleeve: { widthCm: 22, heightCm: 29 },
    },
    "164": {
      body: { widthCm: 44, heightCm: 63 },
      sleeve: { widthCm: 23, heightCm: 31 },
    },
    "176": {
      body: { widthCm: 46, heightCm: 66 },
      sleeve: { widthCm: 25, heightCm: 33 },
    },
  },
};

// ═══════════════════════════════════════════════════════════════════
// Fußball – Damen
// ═══════════════════════════════════════════════════════════════════

const FUSSBALL_DAMEN: SizeChart = {
  sport: "fussball",
  gender: "damen",
  sizes: {
    XS: {
      body: { widthCm: 43, heightCm: 62 },
      sleeve: { widthCm: 18, heightCm: 24 },
    },
    S: {
      body: { widthCm: 45, heightCm: 64 },
      sleeve: { widthCm: 19, heightCm: 25.5 },
    },
    M: {
      body: { widthCm: 47, heightCm: 66 },
      sleeve: { widthCm: 20, heightCm: 27 },
    },
    L: {
      body: { widthCm: 49, heightCm: 68 },
      sleeve: { widthCm: 21, heightCm: 28.5 },
    },
    XL: {
      body: { widthCm: 51, heightCm: 70 },
      sleeve: { widthCm: 23, heightCm: 30 },
    },
    "2XL": {
      body: { widthCm: 53, heightCm: 72 },
      sleeve: { widthCm: 24, heightCm: 31.5 },
    },
  },
};

// ═══════════════════════════════════════════════════════════════════
// Handball – Herren (engerer Schnitt als Fußball)
// ═══════════════════════════════════════════════════════════════════

const HANDBALL_HERREN: SizeChart = {
  sport: "handball",
  gender: "herren",
  sizes: {
    XS: {
      body: { widthCm: 44, heightCm: 65 },
      sleeve: { widthCm: 22, heightCm: 20 },
    },
    S: {
      body: { widthCm: 47, heightCm: 67 },
      sleeve: { widthCm: 23, heightCm: 21 },
    },
    M: {
      body: { widthCm: 50, heightCm: 69 },
      sleeve: { widthCm: 25, heightCm: 22 },
    },
    L: {
      body: { widthCm: 53, heightCm: 71 },
      sleeve: { widthCm: 27, heightCm: 23 },
    },
    XL: {
      body: { widthCm: 56, heightCm: 73 },
      sleeve: { widthCm: 29, heightCm: 24 },
    },
    "2XL": {
      body: { widthCm: 59, heightCm: 75 },
      sleeve: { widthCm: 31, heightCm: 25 },
    },
    "3XL": {
      body: { widthCm: 62, heightCm: 77 },
      sleeve: { widthCm: 33, heightCm: 26 },
    },
    "4XL": {
      body: { widthCm: 65, heightCm: 79 },
      sleeve: { widthCm: 35, heightCm: 27 },
    },
    "116": {
      body: { widthCm: 33, heightCm: 43 },
      sleeve: { widthCm: 16, heightCm: 15 },
    },
    "128": {
      body: { widthCm: 36, heightCm: 48 },
      sleeve: { widthCm: 17, heightCm: 16 },
    },
    "140": {
      body: { widthCm: 38, heightCm: 53 },
      sleeve: { widthCm: 18, heightCm: 17 },
    },
    "152": {
      body: { widthCm: 41, heightCm: 58 },
      sleeve: { widthCm: 20, heightCm: 18 },
    },
    "164": {
      body: { widthCm: 43, heightCm: 62 },
      sleeve: { widthCm: 21, heightCm: 19 },
    },
    "176": {
      body: { widthCm: 44, heightCm: 65 },
      sleeve: { widthCm: 22, heightCm: 20 },
    },
  },
};

const HANDBALL_DAMEN: SizeChart = {
  sport: "handball",
  gender: "damen",
  sizes: {
    XS: {
      body: { widthCm: 41, heightCm: 61 },
      sleeve: { widthCm: 18, heightCm: 18 },
    },
    S: {
      body: { widthCm: 43, heightCm: 63 },
      sleeve: { widthCm: 19, heightCm: 19 },
    },
    M: {
      body: { widthCm: 45, heightCm: 65 },
      sleeve: { widthCm: 20, heightCm: 20 },
    },
    L: {
      body: { widthCm: 47, heightCm: 67 },
      sleeve: { widthCm: 21, heightCm: 21 },
    },
    XL: {
      body: { widthCm: 49, heightCm: 69 },
      sleeve: { widthCm: 23, heightCm: 22 },
    },
    "2XL": {
      body: { widthCm: 51, heightCm: 71 },
      sleeve: { widthCm: 24, heightCm: 23 },
    },
  },
};

// ═══════════════════════════════════════════════════════════════════
// Volleyball – Herren (leichter Stoff, ähnlich wie Handball)
// ═══════════════════════════════════════════════════════════════════

const VOLLEYBALL_HERREN: SizeChart = {
  sport: "volleyball",
  gender: "herren",
  sizes: {
    XS: {
      body: { widthCm: 45, heightCm: 66 },
      sleeve: { widthCm: 23, heightCm: 22 },
    },
    S: {
      body: { widthCm: 48, heightCm: 68 },
      sleeve: { widthCm: 24, heightCm: 23 },
    },
    M: {
      body: { widthCm: 51, heightCm: 70 },
      sleeve: { widthCm: 26, heightCm: 24 },
    },
    L: {
      body: { widthCm: 54, heightCm: 72 },
      sleeve: { widthCm: 28, heightCm: 25 },
    },
    XL: {
      body: { widthCm: 57, heightCm: 74 },
      sleeve: { widthCm: 30, heightCm: 26 },
    },
    "2XL": {
      body: { widthCm: 60, heightCm: 76 },
      sleeve: { widthCm: 32, heightCm: 27 },
    },
    "3XL": {
      body: { widthCm: 63, heightCm: 78 },
      sleeve: { widthCm: 34, heightCm: 28 },
    },
    "116": {
      body: { widthCm: 34, heightCm: 44 },
      sleeve: { widthCm: 17, heightCm: 16 },
    },
    "128": {
      body: { widthCm: 37, heightCm: 49 },
      sleeve: { widthCm: 18, heightCm: 17 },
    },
    "140": {
      body: { widthCm: 39, heightCm: 54 },
      sleeve: { widthCm: 19, heightCm: 18 },
    },
    "152": {
      body: { widthCm: 42, heightCm: 59 },
      sleeve: { widthCm: 21, heightCm: 19 },
    },
    "164": {
      body: { widthCm: 44, heightCm: 63 },
      sleeve: { widthCm: 22, heightCm: 20 },
    },
    "176": {
      body: { widthCm: 45, heightCm: 66 },
      sleeve: { widthCm: 23, heightCm: 22 },
    },
  },
};

const VOLLEYBALL_DAMEN: SizeChart = {
  sport: "volleyball",
  gender: "damen",
  sizes: {
    XS: {
      body: { widthCm: 42, heightCm: 62 },
      sleeve: { widthCm: 19, heightCm: 19 },
    },
    S: {
      body: { widthCm: 44, heightCm: 64 },
      sleeve: { widthCm: 20, heightCm: 20 },
    },
    M: {
      body: { widthCm: 46, heightCm: 66 },
      sleeve: { widthCm: 21, heightCm: 21 },
    },
    L: {
      body: { widthCm: 48, heightCm: 68 },
      sleeve: { widthCm: 22, heightCm: 22 },
    },
    XL: {
      body: { widthCm: 50, heightCm: 70 },
      sleeve: { widthCm: 24, heightCm: 23 },
    },
    "2XL": {
      body: { widthCm: 52, heightCm: 72 },
      sleeve: { widthCm: 25, heightCm: 24 },
    },
  },
};

// ═══════════════════════════════════════════════════════════════════
// Basketball – Herren (ärmellos, weiter Schnitt)
// ═══════════════════════════════════════════════════════════════════

const BASKETBALL_HERREN: SizeChart = {
  sport: "basketball",
  gender: "herren",
  sizes: {
    XS: {
      body: { widthCm: 48, heightCm: 70 },
      // Kein Ärmel bei Basketball
    },
    S: {
      body: { widthCm: 51, heightCm: 72 },
    },
    M: {
      body: { widthCm: 54, heightCm: 74 },
    },
    L: {
      body: { widthCm: 57, heightCm: 76 },
    },
    XL: {
      body: { widthCm: 60, heightCm: 78 },
    },
    "2XL": {
      body: { widthCm: 63, heightCm: 80 },
    },
    "3XL": {
      body: { widthCm: 66, heightCm: 82 },
    },
    "4XL": {
      body: { widthCm: 69, heightCm: 84 },
    },
    "116": {
      body: { widthCm: 36, heightCm: 48 },
    },
    "128": {
      body: { widthCm: 39, heightCm: 53 },
    },
    "140": {
      body: { widthCm: 42, heightCm: 58 },
    },
    "152": {
      body: { widthCm: 45, heightCm: 63 },
    },
    "164": {
      body: { widthCm: 47, heightCm: 67 },
    },
    "176": {
      body: { widthCm: 48, heightCm: 70 },
    },
  },
};

const BASKETBALL_DAMEN: SizeChart = {
  sport: "basketball",
  gender: "damen",
  sizes: {
    XS: {
      body: { widthCm: 44, heightCm: 66 },
    },
    S: {
      body: { widthCm: 46, heightCm: 68 },
    },
    M: {
      body: { widthCm: 48, heightCm: 70 },
    },
    L: {
      body: { widthCm: 50, heightCm: 72 },
    },
    XL: {
      body: { widthCm: 52, heightCm: 74 },
    },
    "2XL": {
      body: { widthCm: 54, heightCm: 76 },
    },
  },
};

// ═══════════════════════════════════════════════════════════════════
// Alle Maßtabellen
// ═══════════════════════════════════════════════════════════════════

export const SIZE_CHARTS: SizeChart[] = [
  FUSSBALL_HERREN,
  FUSSBALL_DAMEN,
  HANDBALL_HERREN,
  HANDBALL_DAMEN,
  VOLLEYBALL_HERREN,
  VOLLEYBALL_DAMEN,
  BASKETBALL_HERREN,
  BASKETBALL_DAMEN,
];

/**
 * Gibt die Maßtabelle für eine Sportart + Geschlecht zurück.
 * Falls kein Geschlecht angegeben, wird "herren" als Standard verwendet.
 */
export function getSizeChart(
  sport: SportCode,
  gender: GenderCode = "herren"
): SizeChart | undefined {
  // Kinder nutzen die Herren-Tabelle (Kindergrößen sind dort enthalten)
  const effectiveGender = gender === "kinder" ? "herren" : gender;
  return SIZE_CHARTS.find(
    (sc) => sc.sport === sport && sc.gender === effectiveGender
  );
}

/**
 * Gibt die Maße für eine bestimmte Sportart, Geschlecht und Größe zurück.
 */
export function getSizeDimensions(
  sport: SportCode,
  size: SizeCode,
  gender: GenderCode = "herren"
): JerseySizeDimensions | undefined {
  const chart = getSizeChart(sport, gender);
  return chart?.sizes[size];
}

/**
 * Berechnet den Skalierungsfaktor relativ zur Referenzgröße (L).
 * Gibt { bodyScale, sleeveScale } zurück – Faktoren relativ zu Größe L.
 */
export function getScaleFactors(
  sport: SportCode,
  size: SizeCode,
  gender: GenderCode = "herren"
): { bodyWidthScale: number; bodyHeightScale: number; sleeveWidthScale: number; sleeveHeightScale: number } | undefined {
  const targetDims = getSizeDimensions(sport, size, gender);
  const refDims = getSizeDimensions(sport, "L", gender);

  if (!targetDims || !refDims) return undefined;

  return {
    bodyWidthScale: targetDims.body.widthCm / refDims.body.widthCm,
    bodyHeightScale: targetDims.body.heightCm / refDims.body.heightCm,
    sleeveWidthScale:
      targetDims.sleeve && refDims.sleeve
        ? targetDims.sleeve.widthCm / refDims.sleeve.widthCm
        : 1,
    sleeveHeightScale:
      targetDims.sleeve && refDims.sleeve
        ? targetDims.sleeve.heightCm / refDims.sleeve.heightCm
        : 1,
  };
}

/**
 * Berechnet die realen cm-Maße einer Zone für eine bestimmte Größe.
 * Die Zone-Positionen (in %) bleiben gleich, aber die cm-Werte ändern sich.
 *
 * @param zoneWidthPercent Breite der Zone in % des Parts
 * @param zoneHeightPercent Höhe der Zone in % des Parts
 * @param partKey "vorderteil" | "rueckteil" | "aermel_links" | "aermel_rechts"
 * @param sport Sportart
 * @param size Konfektionsgröße
 * @param gender Geschlecht
 */
export function getZoneDimensionsForSize(
  zoneWidthPercent: number,
  zoneHeightPercent: number,
  partKey: string,
  sport: SportCode,
  size: SizeCode,
  gender: GenderCode = "herren"
): { widthCm: number; heightCm: number } | undefined {
  const dims = getSizeDimensions(sport, size, gender);
  if (!dims) return undefined;

  const isBody = partKey === "vorderteil" || partKey === "rueckteil";
  const isSleeve = partKey.includes("aermel");

  if (isBody) {
    return {
      widthCm: Math.round((zoneWidthPercent / 100) * dims.body.widthCm * 10) / 10,
      heightCm: Math.round((zoneHeightPercent / 100) * dims.body.heightCm * 10) / 10,
    };
  }

  if (isSleeve && dims.sleeve) {
    return {
      widthCm: Math.round((zoneWidthPercent / 100) * dims.sleeve.widthCm * 10) / 10,
      heightCm: Math.round((zoneHeightPercent / 100) * dims.sleeve.heightCm * 10) / 10,
    };
  }

  return undefined;
}

/**
 * Gibt alle verfügbaren Größen für eine Sportart + Geschlecht zurück.
 */
export function getAvailableSizes(
  sport: SportCode,
  gender: GenderCode = "herren"
): SizeCode[] {
  const chart = getSizeChart(sport, gender);
  if (!chart) return [];
  return Object.keys(chart.sizes) as SizeCode[];
}

/**
 * Bestimmt das Geschlecht basierend auf der Team-Kategorie.
 */
export function genderFromTeamCategory(
  kategorie: string
): GenderCode {
  if (kategorie === "damen") return "damen";
  if (kategorie.includes("jugend")) return "kinder";
  return "herren";
}
