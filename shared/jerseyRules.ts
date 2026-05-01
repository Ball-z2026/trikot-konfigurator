/**
 * Trikotnummern-Regeln nach Sportart und Spielklasse
 * 
 * Quellen:
 * - DFB Durchführungsbestimmungen § 33 + Anhang IV LO (Fußball)
 * - FIVB Offizielle Regeln 2025-2028, Regel 4.3.3.2 (Volleyball)
 * - IHF Spielregeln, Regel 4:8 / DHB Zusatzbestimmungen (Handball)
 * - FIBA Official Basketball Rules 2024, Art. 4 (Basketball)
 */

// ── Deutsche Bundesländer ──────────────────────────────────────────
export const BUNDESLAENDER = [
  { value: "bw", label: "Baden-Württemberg", verband: "Badischer FV / Südbadischer FV / WFV" },
  { value: "by", label: "Bayern", verband: "BFV" },
  { value: "be", label: "Berlin", verband: "Berliner FV" },
  { value: "bb", label: "Brandenburg", verband: "FLB" },
  { value: "hb", label: "Bremen", verband: "Bremer FV" },
  { value: "hh", label: "Hamburg", verband: "HFV" },
  { value: "he", label: "Hessen", verband: "HFV" },
  { value: "mv", label: "Mecklenburg-Vorpommern", verband: "LFV MV" },
  { value: "ni", label: "Niedersachsen", verband: "NFV" },
  { value: "nw", label: "Nordrhein-Westfalen", verband: "FLVW / FVN / FVM" },
  { value: "rp", label: "Rheinland-Pfalz", verband: "FVR / SWFV" },
  { value: "sl", label: "Saarland", verband: "SFV" },
  { value: "sn", label: "Sachsen", verband: "SFV" },
  { value: "st", label: "Sachsen-Anhalt", verband: "FSA" },
  { value: "sh", label: "Schleswig-Holstein", verband: "SHFV" },
  { value: "th", label: "Thüringen", verband: "TFV" },
] as const;

export type BundeslandCode = (typeof BUNDESLAENDER)[number]["value"];

// ── Sportarten ─────────────────────────────────────────────────────
export const SPORTARTEN = [
  { value: "fussball", label: "Fußball" },
  { value: "volleyball", label: "Volleyball" },
  { value: "handball", label: "Handball" },
  { value: "basketball", label: "Basketball" },
] as const;

export type SportartCode = (typeof SPORTARTEN)[number]["value"];

// ── Spielklassen ───────────────────────────────────────────────────
export const SPIELKLASSEN_FUSSBALL = [
  { value: "bundesliga", label: "Bundesliga", level: "profi" },
  { value: "2_bundesliga", label: "2. Bundesliga", level: "profi" },
  { value: "3_liga", label: "3. Liga", level: "profi" },
  { value: "regionalliga", label: "Regionalliga", level: "semi" },
  { value: "oberliga", label: "Oberliga", level: "semi" },
  { value: "verbandsliga", label: "Verbandsliga", level: "amateur" },
  { value: "landesliga", label: "Landesliga", level: "amateur" },
  { value: "bezirksliga", label: "Bezirksliga", level: "amateur" },
  { value: "kreisliga_a", label: "Kreisliga A", level: "amateur" },
  { value: "kreisliga_b", label: "Kreisliga B", level: "amateur" },
  { value: "kreisliga_c", label: "Kreisliga C", level: "amateur" },
  { value: "kreisliga_d", label: "Kreisliga D", level: "amateur" },
] as const;

export const SPIELKLASSEN_VOLLEYBALL = [
  { value: "1_bundesliga", label: "1. Bundesliga", level: "profi" },
  { value: "2_bundesliga", label: "2. Bundesliga", level: "profi" },
  { value: "3_liga", label: "3. Liga", level: "semi" },
  { value: "regionalliga", label: "Regionalliga", level: "semi" },
  { value: "oberliga", label: "Oberliga", level: "amateur" },
  { value: "verbandsliga", label: "Verbandsliga", level: "amateur" },
  { value: "landesliga", label: "Landesliga", level: "amateur" },
  { value: "bezirksliga", label: "Bezirksliga", level: "amateur" },
  { value: "bezirksklasse", label: "Bezirksklasse", level: "amateur" },
  { value: "kreisliga", label: "Kreisliga", level: "amateur" },
  { value: "kreisklasse", label: "Kreisklasse", level: "amateur" },
] as const;

export const SPIELKLASSEN_HANDBALL = [
  { value: "1_bundesliga", label: "1. Bundesliga", level: "profi" },
  { value: "2_bundesliga", label: "2. Bundesliga", level: "profi" },
  { value: "3_liga", label: "3. Liga", level: "semi" },
  { value: "oberliga", label: "Oberliga", level: "semi" },
  { value: "verbandsliga", label: "Verbandsliga", level: "amateur" },
  { value: "landesliga", label: "Landesliga", level: "amateur" },
  { value: "bezirksoberliga", label: "Bezirksoberliga", level: "amateur" },
  { value: "bezirksliga", label: "Bezirksliga", level: "amateur" },
  { value: "kreisliga", label: "Kreisliga", level: "amateur" },
  { value: "kreisklasse", label: "Kreisklasse", level: "amateur" },
] as const;

export const SPIELKLASSEN_BASKETBALL = [
  { value: "bbl", label: "BBL (Basketball Bundesliga)", level: "profi" },
  { value: "pro_a", label: "ProA (2. Liga)", level: "profi" },
  { value: "pro_b", label: "ProB (3. Liga)", level: "semi" },
  { value: "1_regionalliga", label: "1. Regionalliga", level: "semi" },
  { value: "2_regionalliga", label: "2. Regionalliga", level: "amateur" },
  { value: "oberliga", label: "Oberliga", level: "amateur" },
  { value: "landesliga", label: "Landesliga", level: "amateur" },
  { value: "bezirksliga", label: "Bezirksliga", level: "amateur" },
  { value: "kreisliga", label: "Kreisliga", level: "amateur" },
] as const;

export function getSpielklassen(sportart: SportartCode) {
  switch (sportart) {
    case "fussball": return SPIELKLASSEN_FUSSBALL;
    case "volleyball": return SPIELKLASSEN_VOLLEYBALL;
    case "handball": return SPIELKLASSEN_HANDBALL;
    case "basketball": return SPIELKLASSEN_BASKETBALL;
  }
}

// ── Mannschafts-Kategorien ─────────────────────────────────────────
export const TEAM_KATEGORIEN = [
  { value: "herren", label: "Herren" },
  { value: "damen", label: "Damen" },
  { value: "a_jugend", label: "A-Jugend (U19)" },
  { value: "b_jugend", label: "B-Jugend (U17)" },
  { value: "c_jugend", label: "C-Jugend (U15)" },
  { value: "d_jugend", label: "D-Jugend (U13)" },
  { value: "e_jugend", label: "E-Jugend (U11)" },
  { value: "f_jugend", label: "F-Jugend (U9)" },
  { value: "g_jugend", label: "G-Jugend (U7)" },
] as const;

export type TeamKategorie = (typeof TEAM_KATEGORIEN)[number]["value"];

// ── Trikotnummern-Regeln ───────────────────────────────────────────
export interface NumberRule {
  /** Mindesthöhe Rückennummer in cm */
  backMinHeight: number;
  /** Mindesthöhe Brustnummer in cm (null = keine Brustnummer vorgeschrieben) */
  frontMinHeight: number | null;
  /** Mindesthöhe Hosenummer in cm (null = keine Hosenummer vorgeschrieben) */
  shortsMinHeight: number | null;
  /** Mindestbreite des Nummernstreifens in cm */
  strokeMinWidth: number;
  /** Erlaubter Nummernkreis */
  numberRange: { min: number; max: number };
  /** Ist eine Rückennummer Pflicht? */
  backRequired: boolean;
  /** Ist eine Brustnummer Pflicht? */
  frontRequired: boolean;
  /** Zusätzliche Hinweise */
  notes: string[];
  /** Quelle der Regel */
  source: string;
}

/**
 * Gibt die Trikotnummern-Regeln basierend auf Sportart und Spielklassen-Level zurück
 */
export function getNumberRules(
  sportart: SportartCode,
  level: "profi" | "semi" | "amateur" = "amateur"
): NumberRule {
  switch (sportart) {
    case "fussball":
      if (level === "profi") {
        return {
          backMinHeight: 25,
          frontMinHeight: null,
          shortsMinHeight: 10,
          strokeMinWidth: 2,
          numberRange: { min: 1, max: 99 },
          backRequired: true,
          frontRequired: false,
          notes: [
            "Rückennummer: 25-35 cm Höhe (DFL Richtlinie)",
            "Hosenummer: 10-15 cm, optional",
            "Nummern müssen aus 50m Entfernung lesbar sein",
            "Nummernfeld: 2 cm oben, 3 cm unten und seitlich frei",
            "Deutlicher Kontrast zur Trikotfarbe",
          ],
          source: "DFL Anhang IV zur LO, §§ 22-24",
        };
      }
      // Amateur + Semi
      return {
        backMinHeight: 15,
        frontMinHeight: null,
        shortsMinHeight: null,
        strokeMinWidth: 2,
        numberRange: { min: 1, max: 20 },
        backRequired: true,
        frontRequired: false,
        notes: [
          "Rückennummer: mind. 15 cm empfohlen (kein bundesweites Mindestmaß)",
          "Nummern müssen sich farblich deutlich abheben (§ 33 DFB-SpO)",
          "Nummerierung 1-11 (Stamm), 12-18/20 (Auswechsler)",
          "Nummerierung muss mit Spielbericht übereinstimmen",
          "Landesverband kann ergänzende Richtlinien festlegen",
        ],
        source: "DFB Durchführungsbestimmungen § 33",
      };

    case "volleyball":
      if (level === "profi") {
        return {
          backMinHeight: 15,
          frontMinHeight: 10,
          shortsMinHeight: null,
          strokeMinWidth: 2,
          numberRange: { min: 1, max: 18 },
          backRequired: true,
          frontRequired: true,
          notes: [
            "Rückennummer: mind. 15 cm (VBL-Reglement)",
            "Brustnummer: mind. 10 cm (VBL-Reglement)",
            "Nummernkreis: 1-18 (Bundesliga)",
            "Nummernstreifen: mind. 2 cm breit",
          ],
          source: "VBL-Reglement",
        };
      }
      return {
        backMinHeight: 20,
        frontMinHeight: 15,
        shortsMinHeight: null,
        strokeMinWidth: 2,
        numberRange: { min: 1, max: 99 },
        backRequired: true,
        frontRequired: true,
        notes: [
          "Rückennummer: mind. 20 cm (FIVB-Regel 4.3.3.2)",
          "Brustnummer: mind. 15 cm (FIVB-Regel 4.3.3.2)",
          "Nummernstreifen: mind. 2 cm breit",
          "Kontrastierende Farbe zum Trikot",
        ],
        source: "FIVB Offizielle Regeln 2025-2028, Regel 4.3.3.2",
      };

    case "handball":
      return {
        backMinHeight: 20,
        frontMinHeight: 10,
        shortsMinHeight: null,
        strokeMinWidth: 2,
        numberRange: { min: 1, max: 99 },
        backRequired: true,
        frontRequired: true,
        notes: [
          "Rückennummer: mind. 20 cm (IHF Regel 4:8)",
          "Brustnummer: mind. 10 cm (IHF Regel 4:8)",
          "Nummern müssen deutlich sichtbar und kontrastierend sein",
          "DHB übernimmt IHF-Regeln für alle Spielklassen",
        ],
        source: "IHF Spielregeln Regel 4:8 / DHB Zusatzbestimmungen",
      };

    case "basketball":
      return {
        backMinHeight: 20,
        frontMinHeight: 10,
        shortsMinHeight: null,
        strokeMinWidth: 2,
        numberRange: { min: 0, max: 99 },
        backRequired: true,
        frontRequired: true,
        notes: [
          "Rückennummer: mind. 20 cm (FIBA Rules Art. 4)",
          "Brustnummer: mind. 10 cm (FIBA Rules Art. 4)",
          "Einfarbig, kontrastierend zur Trikotfarbe",
          "Mind. 4-5 cm Abstand zu Werbung/Logos",
          "Nummern 0-99 erlaubt (seit 2014)",
        ],
        source: "FIBA Official Basketball Rules 2024, Art. 4",
      };
  }
}

// ── Konfektionsgrößen ──────────────────────────────────────────────
export const KONFEKTIONSGROESSEN = [
  { value: "3XS", label: "3XS" },
  { value: "2XS", label: "2XS" },
  { value: "XS", label: "XS" },
  { value: "S", label: "S" },
  { value: "M", label: "M" },
  { value: "L", label: "L" },
  { value: "XL", label: "XL" },
  { value: "2XL", label: "2XL" },
  { value: "3XL", label: "3XL" },
  { value: "4XL", label: "4XL" },
  { value: "116", label: "116 (Kinder)" },
  { value: "128", label: "128 (Kinder)" },
  { value: "140", label: "140 (Kinder)" },
  { value: "152", label: "152 (Kinder)" },
  { value: "164", label: "164 (Kinder)" },
  { value: "176", label: "176 (Jugend)" },
] as const;

export type Konfektionsgroesse = (typeof KONFEKTIONSGROESSEN)[number]["value"];

/**
 * Gibt die empfohlenen Größen basierend auf der Mannschafts-Kategorie zurück
 */
export function getRecommendedSizes(kategorie: TeamKategorie): typeof KONFEKTIONSGROESSEN[number][] {
  const all = [...KONFEKTIONSGROESSEN];
  if (kategorie.includes("jugend") || kategorie === "herren" || kategorie === "damen") {
    // Alle Größen verfügbar
    return all;
  }
  return all;
}

/**
 * Formatiert die Regeln als lesbaren Hinweistext für den Konfigurator
 */
export function formatRulesForDisplay(rules: NumberRule): string {
  const lines: string[] = [];
  
  if (rules.backRequired) {
    lines.push(`Rückennummer: mind. ${rules.backMinHeight} cm Höhe`);
  }
  if (rules.frontRequired && rules.frontMinHeight) {
    lines.push(`Brustnummer: mind. ${rules.frontMinHeight} cm Höhe`);
  }
  if (rules.shortsMinHeight) {
    lines.push(`Hosenummer: ${rules.shortsMinHeight} cm`);
  }
  lines.push(`Nummernkreis: ${rules.numberRange.min}-${rules.numberRange.max}`);
  lines.push(`Quelle: ${rules.source}`);
  
  return lines.join("\n");
}
