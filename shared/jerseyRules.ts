/**
 * Trikotnummern-Regeln nach Sportart und Spielklasse
 * 
 * Quellen:
 * - DFB Durchführungsbestimmungen § 33 + Anhang IV LO (Fußball)
 * - DFL Richtlinie für Spielkleidung und Ausrüstung (Profifußball)
 * - FIVB Offizielle Regeln 2025-2028, Regel 4.3.3.2 (Volleyball)
 * - VBL-Reglement / VBL-Wiki (Volleyball Bundesliga)
 * - IHF Spielregeln, Regel 4:8 / DHB Zusatzbestimmungen (Handball)
 * - IHF Reglement XVII – Werbung auf Sportkleidung (Handball)
 * - FIBA Official Basketball Rules 2024, Art. 4 (Basketball)
 * - easyCredit BBL Standards 2025/2026 (Basketball Bundesliga)
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
  backMinHeight: number;
  frontMinHeight: number | null;
  shortsMinHeight: number | null;
  strokeMinWidth: number;
  numberRange: { min: number; max: number };
  backRequired: boolean;
  frontRequired: boolean;
  notes: string[];
  source: string;
}

// ── Sponsoren-Regeln ───────────────────────────────────────────────
export interface SponsorRule {
  /** Maximale Anzahl Sponsoren auf dem Trikot (null = unbegrenzt) */
  maxSponsorsTotal: number | null;
  /** Brustwerbung: max. Fläche in cm² (null = keine Begrenzung) */
  chestMaxAreaCm2: number | null;
  /** Brustwerbung: max. Breite in cm (null = keine Begrenzung) */
  chestMaxWidthCm: number | null;
  /** Brustwerbung: max. Höhe in cm (null = keine Begrenzung) */
  chestMaxHeightCm: number | null;
  /** Ärmelwerbung: max. Fläche in cm² (null = keine Begrenzung) */
  sleeveMaxAreaCm2: number | null;
  /** Ärmelwerbung: max. Höhe in cm (null = keine Begrenzung) */
  sleeveMaxHeightCm: number | null;
  /** Rückenwerbung: max. Fläche in cm² (null = keine Begrenzung) */
  backMaxAreaCm2: number | null;
  /** Rückenwerbung: max. Höhe in cm (null = keine Begrenzung) */
  backMaxHeightCm: number | null;
  /** Hosenwerbung: max. Fläche in cm² (null = keine Begrenzung) */
  shortsMaxAreaCm2: number | null;
  /** Mindestabstand Rückenwerbung zur Nummer in cm */
  backMinDistanceToNumberCm: number;
  /** Zusätzliche Hinweise */
  notes: string[];
  source: string;
}

// ── Vereinsemblem-Regeln ───────────────────────────────────────────
export interface EmblemRule {
  /** Max. Fläche auf dem Trikot (Brust) in cm² (null = keine Begrenzung) */
  chestMaxAreaCm2: number | null;
  /** Max. Fläche auf der Hose in cm² (null = keine Begrenzung) */
  shortsMaxAreaCm2: number | null;
  /** Position: Pflicht auf Herzseite? */
  heartSideRequired: boolean;
  /** Muss oberhalb der Brustwerbung sein? */
  aboveChestSponsor: boolean;
  notes: string[];
  source: string;
}

// ── Spielername-Regeln ─────────────────────────────────────────────
export interface PlayerNameRule {
  /** Ist der Spielername Pflicht? */
  required: boolean;
  /** Mindesthöhe der Buchstaben in cm */
  minHeightCm: number;
  /** Position: "above_number" | "below_collar" | "flexible" */
  position: "above_number" | "below_collar" | "flexible";
  /** Mindestabstand zur Nummer in cm */
  minDistanceToNumberCm: number;
  notes: string[];
  source: string;
}

// ── Vereinsname-Regeln ─────────────────────────────────────────────
export interface TeamNameRule {
  /** Ist der Vereinsname auf dem Trikot erlaubt? */
  allowed: boolean;
  /** Max. Höhe in cm (null = keine Begrenzung) */
  maxHeightCm: number | null;
  /** Position */
  position: string;
  notes: string[];
  source: string;
}

// ── Gesamtregelwerk pro Sportart/Level ─────────────────────────────
export interface JerseyRuleSet {
  sportart: SportartCode;
  level: "profi" | "semi" | "amateur";
  number: NumberRule;
  sponsor: SponsorRule;
  emblem: EmblemRule;
  playerName: PlayerNameRule;
  teamName: TeamNameRule;
}

/**
 * Gibt das vollständige Regelwerk für eine Sportart und Spielklassen-Level zurück
 */
export function getJerseyRules(
  sportart: SportartCode,
  level: "profi" | "semi" | "amateur" = "amateur"
): JerseyRuleSet {
  return {
    sportart,
    level,
    number: getNumberRules(sportart, level),
    sponsor: getSponsorRules(sportart, level),
    emblem: getEmblemRules(sportart, level),
    playerName: getPlayerNameRules(sportart, level),
    teamName: getTeamNameRules(sportart, level),
  };
}

// ═══════════════════════════════════════════════════════════════════
// Trikotnummern
// ═══════════════════════════════════════════════════════════════════

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
            "Rückennummer: 25–35 cm Höhe (DFL Richtlinie)",
            "Strichstärke: 2–5 cm",
            "Hosenummer: 10–15 cm, optional am linken oder rechten Hosenbein",
            "Nummern müssen aus 50 m Entfernung lesbar sein",
            "Nummernfeld: 2 cm oben, 3 cm unten/seitlich frei von Werbung",
            "Deutlicher Kontrast zur Trikotfarbe",
            "Nummer 1 nur für Torhüter",
          ],
          source: "DFL Anhang IV zur LO, §§ 9–10, 22–24",
        };
      }
      return {
        backMinHeight: 25,
        frontMinHeight: null,
        shortsMinHeight: null,
        strokeMinWidth: 2,
        numberRange: { min: 1, max: 49 },
        backRequired: true,
        frontRequired: false,
        notes: [
          "Rückennummer: 25–35 cm Höhe",
          "Strichstärke: 2–5 cm",
          "Nummern 1–49 (Nummer 1 nur für Torhüter)",
          "Nummern müssen sich farblich deutlich abheben",
          "Hosenummer optional, 10–15 cm",
          "Landesverband kann ergänzende Richtlinien festlegen",
        ],
        source: "DFB Allgemeinverbindliche Vorschriften §§ 9–10",
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
            "Rückennummer: mind. 15 cm (VBL)",
            "Brustnummer: mind. 10 cm (VBL)",
            "Nummernkreis: 1–18 (Standard), 19–99 (erweitert)",
            "Nummernstreifen: mind. 2 cm breit",
            "Fette Blockschrift ohne Serifen obligatorisch",
            "Hosennummer optional: 4–6 cm, mind. 1 cm Strichstärke",
          ],
          source: "VBL-Reglement / VBL-Wiki",
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
          "Rückennummer: mind. 20 cm (FIVB/DVV)",
          "Brustnummer: mind. 15 cm (FIVB/DVV)",
          "Nummernstreifen: mind. 2 cm breit",
          "Zentriert vorne und hinten",
          "Kontrastierende Farbe zum Trikot",
          "Fette Blockschrift ohne Serifen obligatorisch",
        ],
        source: "FIVB Offizielle Regeln 2025–2028, Regel 4.3.3.2 / DVV BSO",
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
          "Nummern 0–99 erlaubt (seit 2014)",
        ],
        source: "FIBA Official Basketball Rules 2024, Art. 4",
      };
  }
}

// ═══════════════════════════════════════════════════════════════════
// Sponsorenregeln
// ═══════════════════════════════════════════════════════════════════

export function getSponsorRules(
  sportart: SportartCode,
  level: "profi" | "semi" | "amateur" = "amateur"
): SponsorRule {
  switch (sportart) {
    case "fussball":
      if (level === "profi") {
        return {
          maxSponsorsTotal: 3,
          chestMaxAreaCm2: 200,
          chestMaxWidthCm: null,
          chestMaxHeightCm: null,
          sleeveMaxAreaCm2: 100,
          sleeveMaxHeightCm: 12,
          backMaxAreaCm2: 200,
          backMaxHeightCm: 7.5,
          shortsMaxAreaCm2: null,
          backMinDistanceToNumberCm: 2,
          notes: [
            "Max. 3 Sponsoren: Brust + Ärmel (links) + Rücken",
            "Brustwerbung: max. 200 cm², zentriert auf Rumpfteil",
            "Ärmelwerbung: max. 100 cm², max. 12 cm hoch",
            "Rückenwerbung: max. 200 cm², max. 7,5 cm hoch",
            "Rückenwerbung: unterhalb der Nummer, 2 cm Abstand",
            "Nummernfeld muss frei bleiben (2 cm oben, 3 cm unten/seitlich)",
            "Werbung für Tabak/starken Alkohol (>15%) verboten",
            "Bei Jugend: auch Glücksspiel/Sportwetten/Alkohol verboten",
          ],
          source: "DFL Anhang IV zur LO, §§ 24–25, 36",
        };
      }
      // Amateur + Semi: gleiche DFB-Regeln
      return {
        maxSponsorsTotal: 3,
        chestMaxAreaCm2: 200,
        chestMaxWidthCm: null,
        chestMaxHeightCm: null,
        sleeveMaxAreaCm2: 100,
        sleeveMaxHeightCm: 12,
        backMaxAreaCm2: 200,
        backMaxHeightCm: 7.5,
        shortsMaxAreaCm2: null,
        backMinDistanceToNumberCm: 2,
        notes: [
          "Max. 1–3 Sponsoren je nach Spielklasse/Wettbewerb",
          "Brustwerbung: max. 200 cm², zentriert",
          "Ärmelwerbung (falls erlaubt): max. 100 cm², max. 12 cm hoch",
          "Rückenwerbung (falls erlaubt): max. 200 cm², max. 7,5 cm hoch",
          "Rückenwerbung: 2 cm Abstand zur Nummer",
          "Landesverband kann abweichende Regeln haben",
          "Werbung für Tabak/starken Alkohol verboten",
          "Bei Jugend: auch Glücksspiel/Sportwetten/Alkohol verboten",
        ],
        source: "DFB Allgemeinverbindliche Vorschriften §§ 24–25",
      };

    case "handball":
      return {
        maxSponsorsTotal: null, // Unbegrenzt
        chestMaxAreaCm2: 550,
        chestMaxWidthCm: 25,
        chestMaxHeightCm: 22,
        sleeveMaxAreaCm2: 120,
        sleeveMaxHeightCm: null,
        backMaxAreaCm2: 550,
        backMaxHeightCm: 22,
        shortsMaxAreaCm2: 300,
        backMinDistanceToNumberCm: 0,
        notes: [
          "Anzahl Sponsoren NICHT begrenzt (nur Flächenbegrenzung)",
          "Brust: max. 25 cm breit × 22 cm hoch (max. 550 cm²)",
          "Rücken: max. 25 cm breit × 22 cm hoch (max. 550 cm²)",
          "Ärmel: max. 12 cm × 10 cm (max. 120 cm²)",
          "Hose: max. 20 cm breit × 15 cm hoch (max. 300 cm²)",
          "Werbung darf Sichtbarkeit der Nummern nicht beeinträchtigen",
          "Werbung für Tabak/Alkohol bei Jugend verboten",
        ],
        source: "IHF Reglement XVII – Werbung auf Sportkleidung",
      };

    case "volleyball":
      return {
        maxSponsorsTotal: null, // Unbegrenzt
        chestMaxAreaCm2: null, // Keine Begrenzung
        chestMaxWidthCm: null,
        chestMaxHeightCm: null,
        sleeveMaxAreaCm2: null,
        sleeveMaxHeightCm: null,
        backMaxAreaCm2: null,
        backMaxHeightCm: null,
        shortsMaxAreaCm2: null,
        backMinDistanceToNumberCm: 0,
        notes: [
          "Anzahl der Werbeflächen NICHT begrenzt (VBL-Werbeordnung)",
          "Zwischen Kragen und Spielername kein Sponsor erlaubt",
          "VBL-Logo: rechter Ärmel, 6 cm Durchmesser, 15×15 cm freie Fläche",
          "Werbung kann je Spieler unterschiedlich sein (nur national)",
          "Gestaltung der Aufdrucke (Nummer, Name, Logo) muss identisch sein",
        ],
        source: "VBL-Reglement / VBL-Wiki / VBL-Werbeordnung",
      };

    case "basketball":
      return {
        maxSponsorsTotal: 4,
        chestMaxAreaCm2: 200,
        chestMaxWidthCm: null,
        chestMaxHeightCm: null,
        sleeveMaxAreaCm2: null, // Ärmellos
        sleeveMaxHeightCm: null,
        backMaxAreaCm2: 200,
        backMaxHeightCm: null,
        shortsMaxAreaCm2: 100,
        backMinDistanceToNumberCm: 4,
        notes: [
          "Max. 4 Sponsoren auf Spielkleidung",
          "Brust: max. 200 cm² (Hauptsponsor)",
          "Rücken: max. 200 cm² (unter Nummer)",
          "Hose: max. 100 cm² pro Seite",
          "Ärmelwerbung nicht möglich (ärmellose Trikots)",
          "Mind. 4–5 cm Abstand zu Nummern/Logos",
        ],
        source: "FIBA Rules Art. 4 / easyCredit BBL Standards 2025/2026",
      };
  }
}

// ═══════════════════════════════════════════════════════════════════
// Vereinsemblem-Regeln
// ═══════════════════════════════════════════════════════════════════

export function getEmblemRules(
  sportart: SportartCode,
  level: "profi" | "semi" | "amateur" = "amateur"
): EmblemRule {
  switch (sportart) {
    case "fussball":
      return {
        chestMaxAreaCm2: 100,
        shortsMaxAreaCm2: 50,
        heartSideRequired: true,
        aboveChestSponsor: true,
        notes: [
          "Trikot: max. 100 cm² auf Brusthöhe (Herzseite)",
          "Hose: max. 50 cm² auf Vorderseite",
          "Stutzen: max. 50 cm²",
          "Emblem muss oberhalb der Brustwerbung sein",
          "Darf keine Herstelleridentifikation oder Sponsorenwerbung enthalten",
        ],
        source: "DFB Allgemeinverbindliche Vorschriften § 13",
      };

    case "handball":
      return {
        chestMaxAreaCm2: null, // Keine spezifische Begrenzung
        shortsMaxAreaCm2: null,
        heartSideRequired: false,
        aboveChestSponsor: false,
        notes: [
          "Keine spezifische Größenbeschränkung im DHB",
          "Üblicherweise auf der Brust (links oder rechts)",
          "Darf Sichtbarkeit der Nummern nicht beeinträchtigen",
        ],
        source: "DHB Spielordnung / IHF Reglement",
      };

    case "volleyball":
      return {
        chestMaxAreaCm2: null, // Keine Begrenzung
        shortsMaxAreaCm2: null,
        heartSideRequired: false,
        aboveChestSponsor: false,
        notes: [
          "Frei positionierbar (Brust, Ärmel, Hose)",
          "Keine Größenbeschränkung",
          "Gestaltung muss auf allen Trikots identisch sein",
        ],
        source: "VBL-Reglement / VBL-Wiki",
      };

    case "basketball":
      return {
        chestMaxAreaCm2: null, // Keine spezifische Begrenzung
        shortsMaxAreaCm2: null,
        heartSideRequired: false,
        aboveChestSponsor: false,
        notes: [
          "Vereinsname auf Vorderseite des Trikots",
          "Logo üblicherweise auf Brust oder Hose",
          "Keine spezifische Größenbeschränkung",
        ],
        source: "FIBA Rules Art. 4 / DBB Spielordnung",
      };
  }
}

// ═══════════════════════════════════════════════════════════════════
// Spielername-Regeln
// ═══════════════════════════════════════════════════════════════════

export function getPlayerNameRules(
  sportart: SportartCode,
  level: "profi" | "semi" | "amateur" = "amateur"
): PlayerNameRule {
  switch (sportart) {
    case "fussball":
      if (level === "profi") {
        return {
          required: true,
          minHeightCm: 5,
          position: "above_number",
          minDistanceToNumberCm: 2,
          notes: [
            "Spielername Pflicht (Profi)",
            "Oberhalb der Rückennummer, 2 cm Abstand",
            "Farbe muss der Trikotnummer entsprechen",
            "Freigestellt (ohne Hintergrund) auf dem Trikot",
            "Vereinsname optional oberhalb des Spielernamens (max. 2 cm hoch)",
          ],
          source: "DFB Allgemeinverbindliche Vorschriften § 10 / DFL § 25",
        };
      }
      return {
        required: false,
        minHeightCm: 2.5,
        position: "above_number",
        minDistanceToNumberCm: 2,
        notes: [
          "Spielername optional (Amateur)",
          "Nachname und/oder Vorname erlaubt",
          "Muss dem Spielberechtigungslisten-Eintrag entsprechen",
        ],
        source: "DFB Allgemeinverbindliche Vorschriften § 10",
      };

    case "handball":
      return {
        required: false,
        minHeightCm: 4,
        position: "flexible",
        minDistanceToNumberCm: 0,
        notes: [
          "Spielername empfohlen (nicht Pflicht im Amateurbereich)",
          "Einzelbuchstabe mind. 4 cm hoch",
          "Rückseite des Trikots",
        ],
        source: "DHB Zusatzbestimmungen / IHF Reglement",
      };

    case "volleyball":
      if (level === "profi") {
        return {
          required: true,
          minHeightCm: 4,
          position: "below_collar",
          minDistanceToNumberCm: 0,
          notes: [
            "Spielername Pflicht (1. Bundesliga)",
            "Unter dem Kragen, mind. 4 cm hoch",
            "Nachname des Spielers",
            "Fette Blockschrift ohne Serifen obligatorisch",
            "Zwischen Kragen und Name kein Sponsor erlaubt",
          ],
          source: "VBL-Reglement / VBL-Wiki",
        };
      }
      return {
        required: false,
        minHeightCm: 4,
        position: "below_collar",
        minDistanceToNumberCm: 0,
        notes: [
          "Spielername freigestellt (2. Bundesliga und darunter)",
          "Falls verwendet: mind. 4 cm hoch, unter dem Kragen",
          "Fette Blockschrift ohne Serifen obligatorisch",
        ],
        source: "VBL-Reglement / VBL-Wiki",
      };

    case "basketball":
      return {
        required: level === "profi",
        minHeightCm: level === "profi" ? 5 : 2,
        position: "above_number",
        minDistanceToNumberCm: 2,
        notes: [
          level === "profi"
            ? "Spielername Pflicht (BBL)"
            : "Spielername optional (Amateur)",
          "Rückseite, oberhalb der Nummer",
          `Mind. ${level === "profi" ? 5 : 2} cm Buchstabenhöhe`,
        ],
        source: "FIBA Rules Art. 4 / easyCredit BBL Standards",
      };
  }
}

// ═══════════════════════════════════════════════════════════════════
// Vereinsname-Regeln
// ═══════════════════════════════════════════════════════════════════

export function getTeamNameRules(
  sportart: SportartCode,
  level: "profi" | "semi" | "amateur" = "amateur"
): TeamNameRule {
  switch (sportart) {
    case "fussball":
      return {
        allowed: true,
        maxHeightCm: 2,
        position: "Rücken, oberhalb des Spielernamens (falls vorhanden), 2 cm Abstand",
        notes: [
          "Vereinsname optional auf der Rückseite",
          "Max. 2 cm Höhe",
          "Oberhalb des Spielernamens mit 2 cm Abstand",
          "Farbe muss der Trikotnummer entsprechen (bei Rückenwerbung)",
        ],
        source: "DFB Allgemeinverbindliche Vorschriften § 10 / DFL § 25",
      };

    case "handball":
      return {
        allowed: true,
        maxHeightCm: null,
        position: "Frei positionierbar (meist Rücken oder Brust)",
        notes: [
          "Vereinsname erlaubt",
          "Keine spezifische Größenbeschränkung",
          "Darf Nummern nicht beeinträchtigen",
        ],
        source: "DHB Spielordnung",
      };

    case "volleyball":
      return {
        allowed: true,
        maxHeightCm: 10,
        position: "Rücken (oberhalb der Nummer) oder Brust",
        notes: [
          "Vereinsname erlaubt (Rücken oder Brust)",
          "Max. 10 cm Schrifthöhe (Schweizer Reglement, ähnlich DVV)",
          "Falls Spielername vorhanden: Vereinsname oberhalb der Nummer eingeschränkt",
        ],
        source: "VBL-Reglement / DVV BSO",
      };

    case "basketball":
      return {
        allowed: true,
        maxHeightCm: null,
        position: "Vorderseite des Trikots (Brust)",
        notes: [
          "Vereinsname auf Vorderseite üblich",
          "Keine spezifische Größenbeschränkung",
        ],
        source: "FIBA Rules Art. 4 / DBB Spielordnung",
      };
  }
}

// ═══════════════════════════════════════════════════════════════════
// Validierung: Prüft Zonen gegen Verbandsvorgaben
// ═══════════════════════════════════════════════════════════════════

export interface ValidationWarning {
  /** Schweregrad: error = Regelverstoß, warning = Empfehlung */
  severity: "error" | "warning";
  /** Betroffene Zone/Bereich */
  zone: string;
  /** Kurze Beschreibung des Problems */
  message: string;
  /** Regelquelle */
  source: string;
}

export interface ZoneForValidation {
  purpose: string;
  widthCm?: number;
  heightCm?: number;
  part: string; // "front" | "back" | "sleeve_left" | "sleeve_right" | "shorts"
}

/**
 * Validiert Zonen gegen die Verbandsvorgaben
 */
export function validateZonesAgainstRules(
  zones: ZoneForValidation[],
  rules: JerseyRuleSet
): ValidationWarning[] {
  const warnings: ValidationWarning[] = [];

  // 1. Sponsoren-Anzahl prüfen
  const sponsorZones = zones.filter(z => z.purpose === "sponsor" || z.purpose === "logo");
  if (rules.sponsor.maxSponsorsTotal !== null && sponsorZones.length > rules.sponsor.maxSponsorsTotal) {
    warnings.push({
      severity: "error",
      zone: "Sponsoren",
      message: `Max. ${rules.sponsor.maxSponsorsTotal} Sponsoren erlaubt, aktuell ${sponsorZones.length}`,
      source: rules.sponsor.source,
    });
  }

  // 2. Sponsoren-Flächen prüfen
  for (const zone of sponsorZones) {
    if (!zone.widthCm || !zone.heightCm) continue;
    const areaCm2 = zone.widthCm * zone.heightCm;

    if (zone.part === "front" || zone.part.includes("vorder")) {
      if (rules.sponsor.chestMaxAreaCm2 && areaCm2 > rules.sponsor.chestMaxAreaCm2) {
        warnings.push({
          severity: "error",
          zone: `Brustwerbung`,
          message: `Fläche ${areaCm2.toFixed(0)} cm² überschreitet max. ${rules.sponsor.chestMaxAreaCm2} cm²`,
          source: rules.sponsor.source,
        });
      }
      if (rules.sponsor.chestMaxHeightCm && zone.heightCm > rules.sponsor.chestMaxHeightCm) {
        warnings.push({
          severity: "error",
          zone: `Brustwerbung`,
          message: `Höhe ${zone.heightCm} cm überschreitet max. ${rules.sponsor.chestMaxHeightCm} cm`,
          source: rules.sponsor.source,
        });
      }
    }

    if (zone.part.includes("sleeve") || zone.part.includes("aermel") || zone.part.includes("ärmel")) {
      if (rules.sponsor.sleeveMaxAreaCm2 && areaCm2 > rules.sponsor.sleeveMaxAreaCm2) {
        warnings.push({
          severity: "error",
          zone: `Ärmelwerbung`,
          message: `Fläche ${areaCm2.toFixed(0)} cm² überschreitet max. ${rules.sponsor.sleeveMaxAreaCm2} cm²`,
          source: rules.sponsor.source,
        });
      }
      if (rules.sponsor.sleeveMaxHeightCm && zone.heightCm > rules.sponsor.sleeveMaxHeightCm) {
        warnings.push({
          severity: "error",
          zone: `Ärmelwerbung`,
          message: `Höhe ${zone.heightCm} cm überschreitet max. ${rules.sponsor.sleeveMaxHeightCm} cm`,
          source: rules.sponsor.source,
        });
      }
    }

    if (zone.part === "back" || zone.part.includes("rück")) {
      if (rules.sponsor.backMaxAreaCm2 && areaCm2 > rules.sponsor.backMaxAreaCm2) {
        warnings.push({
          severity: "error",
          zone: `Rückenwerbung`,
          message: `Fläche ${areaCm2.toFixed(0)} cm² überschreitet max. ${rules.sponsor.backMaxAreaCm2} cm²`,
          source: rules.sponsor.source,
        });
      }
      if (rules.sponsor.backMaxHeightCm && zone.heightCm > rules.sponsor.backMaxHeightCm) {
        warnings.push({
          severity: "error",
          zone: `Rückenwerbung`,
          message: `Höhe ${zone.heightCm} cm überschreitet max. ${rules.sponsor.backMaxHeightCm} cm`,
          source: rules.sponsor.source,
        });
      }
    }
  }

  // 3. Vereinsemblem prüfen
  const emblemZones = zones.filter(z => z.purpose === "clubLogo");
  for (const zone of emblemZones) {
    if (!zone.widthCm || !zone.heightCm) continue;
    const areaCm2 = zone.widthCm * zone.heightCm;
    if (rules.emblem.chestMaxAreaCm2 && areaCm2 > rules.emblem.chestMaxAreaCm2) {
      warnings.push({
        severity: "warning",
        zone: "Vereinsemblem",
        message: `Fläche ${areaCm2.toFixed(0)} cm² überschreitet empfohlene max. ${rules.emblem.chestMaxAreaCm2} cm²`,
        source: rules.emblem.source,
      });
    }
  }

  // 4. Nummern-Zonen prüfen
  const numberZones = zones.filter(z => z.purpose === "playerNumber");
  for (const zone of numberZones) {
    if (!zone.heightCm) continue;
    if (zone.part === "back" || zone.part.includes("rück")) {
      if (zone.heightCm < rules.number.backMinHeight) {
        warnings.push({
          severity: "error",
          zone: "Rückennummer",
          message: `Höhe ${zone.heightCm} cm unter Mindesthöhe ${rules.number.backMinHeight} cm`,
          source: rules.number.source,
        });
      }
    }
    if ((zone.part === "front" || zone.part.includes("vorder")) && rules.number.frontMinHeight) {
      if (zone.heightCm < rules.number.frontMinHeight) {
        warnings.push({
          severity: "error",
          zone: "Brustnummer",
          message: `Höhe ${zone.heightCm} cm unter Mindesthöhe ${rules.number.frontMinHeight} cm`,
          source: rules.number.source,
        });
      }
    }
  }

  // 5. Pflicht-Elemente prüfen
  if (rules.number.backRequired) {
    const hasBackNumber = numberZones.some(z => z.part === "back" || z.part.includes("rück"));
    if (!hasBackNumber) {
      warnings.push({
        severity: "warning",
        zone: "Rückennummer",
        message: "Rückennummer ist Pflicht, aber keine Nummern-Zone auf der Rückseite gefunden",
        source: rules.number.source,
      });
    }
  }
  if (rules.number.frontRequired && rules.number.frontMinHeight) {
    const hasFrontNumber = numberZones.some(z => z.part === "front" || z.part.includes("vorder"));
    if (!hasFrontNumber) {
      warnings.push({
        severity: "warning",
        zone: "Brustnummer",
        message: "Brustnummer ist Pflicht, aber keine Nummern-Zone auf der Vorderseite gefunden",
        source: rules.number.source,
      });
    }
  }

  return warnings;
}

// ═══════════════════════════════════════════════════════════════════
// Hilfsfunktionen
// ═══════════════════════════════════════════════════════════════════

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

export function getRecommendedSizes(kategorie: TeamKategorie): typeof KONFEKTIONSGROESSEN[number][] {
  const all = [...KONFEKTIONSGROESSEN];
  if (kategorie.includes("jugend") || kategorie === "herren" || kategorie === "damen") {
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

/**
 * Formatiert das gesamte Regelwerk als Zusammenfassung
 */
export function formatFullRulesForDisplay(ruleSet: JerseyRuleSet): string {
  const sections: string[] = [];

  // Nummern
  sections.push("📏 NUMMERN:");
  sections.push(formatRulesForDisplay(ruleSet.number));

  // Sponsoren
  sections.push("\n📣 SPONSOREN:");
  if (ruleSet.sponsor.maxSponsorsTotal !== null) {
    sections.push(`Max. ${ruleSet.sponsor.maxSponsorsTotal} Sponsoren`);
  } else {
    sections.push("Anzahl Sponsoren unbegrenzt");
  }
  if (ruleSet.sponsor.chestMaxAreaCm2) {
    sections.push(`Brust: max. ${ruleSet.sponsor.chestMaxAreaCm2} cm²`);
  }
  if (ruleSet.sponsor.sleeveMaxAreaCm2) {
    sections.push(`Ärmel: max. ${ruleSet.sponsor.sleeveMaxAreaCm2} cm²`);
  }
  if (ruleSet.sponsor.backMaxAreaCm2) {
    sections.push(`Rücken: max. ${ruleSet.sponsor.backMaxAreaCm2} cm²`);
  }

  // Emblem
  sections.push("\n🏛️ VEREINSEMBLEM:");
  if (ruleSet.emblem.chestMaxAreaCm2) {
    sections.push(`Max. ${ruleSet.emblem.chestMaxAreaCm2} cm² auf Brust`);
  }
  if (ruleSet.emblem.heartSideRequired) {
    sections.push("Herzseite (links) Pflicht");
  }

  // Spielername
  sections.push("\n👤 SPIELERNAME:");
  sections.push(ruleSet.playerName.required ? "Pflicht" : "Optional");
  sections.push(`Mind. ${ruleSet.playerName.minHeightCm} cm Buchstabenhöhe`);

  return sections.join("\n");
}
