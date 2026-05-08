/**
 * Test-Script: Druckbogen aus KI-Design generieren
 * Nutzt den echten printSheet.ts Generator mit korrekten Positionen
 */
import { generateAllPrintSheets, fillZonesForPlayer } from "./server/printSheet.js";
import { storagePut } from "./server/storage.js";
import { FRONT_ZONE_POSITIONS, calculateBackPositions, DEFAULT_BACK_LAYOUT } from "./shared/jerseyRules.js";
import type { PrintJobConfig, PrintSheetConfig, PrintZone, PlayerPrintData } from "./server/printSheet.js";
import type { SizeCode, SportCode, GenderCode } from "./shared/sizeCharts.js";
import { getSizeDimensions } from "./shared/sizeCharts.js";

// ── Vereinsdaten (SC Harmstorf) ──
const CLUB_NAME = "SC Harmstorf";
const SPORT: SportCode = "fussball";
const GENDER: GenderCode = "herren";
const SIZE: SizeCode = "L";
const BG_COLOR = "#fefb41"; // Gelb (Hauptfarbe des Trikots)

// ── Spielerdaten ──
const PLAYER: PlayerPrintData = {
  playerId: 1,
  playerName: "MÜLLER",
  playerNumber: "77",
  size: SIZE,
  initials: "M",
};

// ── Sponsor-URLs (aus DB) ──
const SPONSOR_BRUST_URL = "/manus-storage/org-450001/sponsor-templates/1777999591992-DTF__0e1f5600.jpg";
const SPONSOR_RUECKEN_URL = "/manus-storage/org-450001/sponsor-templates/1778195346162-Visa__7e0150e4.png";
const CLUB_LOGO_URL = "/manus-storage/org-450001/logos/sc_harmstorf_wappen.jpg";

// ── Maße für Größe L ──
const dims = getSizeDimensions(SPORT, SIZE, GENDER);
if (!dims) throw new Error("Keine Maße für Größe L gefunden");

console.log(`Maße für ${SPORT} ${GENDER} ${SIZE}:`);
console.log(`  Body: ${dims.body.widthCm} x ${dims.body.heightCm} cm`);
console.log(`  Sleeve: ${dims.sleeve?.widthCm} x ${dims.sleeve?.heightCm} cm`);

// ── Vorderseite-Zonen aus FRONT_ZONE_POSITIONS ──
const frontZones: PrintZone[] = [
  // Brustnummer
  {
    purpose: "playerNumber",
    content: PLAYER.playerNumber,
    posXPercent: FRONT_ZONE_POSITIONS.playerNumberFront.posX,
    posYPercent: FRONT_ZONE_POSITIONS.playerNumberFront.posY,
    widthPercent: FRONT_ZONE_POSITIONS.playerNumberFront.width,
    heightPercent: FRONT_ZONE_POSITIONS.playerNumberFront.height,
    fontColor: "#012f7b",
    outlineColor: "none",
    outlineWidth: 0,
    fontStyle: "block",
    fontWeight: "bold",
    fontSize: 80,
    textAlign: "center" as const,
    rotation: 0,
    isImage: false,
    textStyle: "straight",
    arcDegree: 0,
  },
  // Vereinswappen
  {
    purpose: "clubLogo",
    content: "",
    posXPercent: FRONT_ZONE_POSITIONS.clubLogo.posX,
    posYPercent: FRONT_ZONE_POSITIONS.clubLogo.posY,
    widthPercent: FRONT_ZONE_POSITIONS.clubLogo.width,
    heightPercent: FRONT_ZONE_POSITIONS.clubLogo.height,
    fontColor: "#000000",
    outlineColor: "none",
    outlineWidth: 0,
    fontStyle: "block",
    fontWeight: "bold",
    fontSize: 80,
    textAlign: "center" as const,
    rotation: 0,
    isImage: true,
    imageUrl: CLUB_LOGO_URL,
    textStyle: "straight",
    arcDegree: 0,
  },
  // Brust-Sponsor
  {
    purpose: "sponsor",
    content: "",
    posXPercent: FRONT_ZONE_POSITIONS.chestSponsor.posX,
    posYPercent: FRONT_ZONE_POSITIONS.chestSponsor.posY,
    widthPercent: FRONT_ZONE_POSITIONS.chestSponsor.width,
    heightPercent: FRONT_ZONE_POSITIONS.chestSponsor.height,
    fontColor: "#000000",
    outlineColor: "none",
    outlineWidth: 0,
    fontStyle: "block",
    fontWeight: "bold",
    fontSize: 80,
    textAlign: "center" as const,
    rotation: 0,
    isImage: true,
    imageUrl: SPONSOR_BRUST_URL,
    textStyle: "straight",
    arcDegree: 0,
  },
];

// ── Rückseite-Zonen aus calculateBackPositions ──
const backPositions = calculateBackPositions(DEFAULT_BACK_LAYOUT, SPORT, "amateur");
const backZones: PrintZone[] = [];

// Vereinsname
if (backPositions.clubName) {
  backZones.push({
    purpose: "clubName",
    content: CLUB_NAME,
    posXPercent: backPositions.clubName.posX,
    posYPercent: backPositions.clubName.posY,
    widthPercent: backPositions.clubName.width,
    heightPercent: backPositions.clubName.height,
    fontColor: "#012f7b",
    outlineColor: "none",
    outlineWidth: 0,
    fontStyle: "block",
    fontWeight: "bold",
    fontSize: 80,
    textAlign: "center" as const,
    rotation: 0,
    isImage: false,
    textStyle: "straight",
    arcDegree: 0,
  });
}

// Rückennummer
if (backPositions.playerNumberBack) {
  backZones.push({
    purpose: "playerNumber",
    content: PLAYER.playerNumber,
    posXPercent: backPositions.playerNumberBack.posX,
    posYPercent: backPositions.playerNumberBack.posY,
    widthPercent: backPositions.playerNumberBack.width,
    heightPercent: backPositions.playerNumberBack.height,
    fontColor: "#012f7b",
    outlineColor: "none",
    outlineWidth: 0,
    fontStyle: "block",
    fontWeight: "bold",
    fontSize: 80,
    textAlign: "center" as const,
    rotation: 0,
    isImage: false,
    textStyle: "straight",
    arcDegree: 0,
  });
}

// Spielername
if (backPositions.playerName) {
  backZones.push({
    purpose: "playerName",
    content: PLAYER.playerName,
    posXPercent: backPositions.playerName.posX,
    posYPercent: backPositions.playerName.posY,
    widthPercent: backPositions.playerName.width,
    heightPercent: backPositions.playerName.height,
    fontColor: "#012f7b",
    outlineColor: "none",
    outlineWidth: 0,
    fontStyle: "block",
    fontWeight: "bold",
    fontSize: 80,
    textAlign: "center" as const,
    rotation: 0,
    isImage: false,
    textStyle: "straight",
    arcDegree: 0,
  });
}

// Rücken-Sponsor
if (backPositions.backSponsor) {
  backZones.push({
    purpose: "sponsor",
    content: "",
    posXPercent: backPositions.backSponsor.posX,
    posYPercent: backPositions.backSponsor.posY,
    widthPercent: backPositions.backSponsor.width,
    heightPercent: backPositions.backSponsor.height,
    fontColor: "#000000",
    outlineColor: "none",
    outlineWidth: 0,
    fontStyle: "block",
    fontWeight: "bold",
    fontSize: 80,
    textAlign: "center" as const,
    rotation: 0,
    isImage: true,
    imageUrl: SPONSOR_RUECKEN_URL,
    textStyle: "straight",
    arcDegree: 0,
  });
}

// ── PrintJobConfig zusammenbauen ──
const printConfig: PrintJobConfig = {
  clubName: CLUB_NAME,
  sport: SPORT,
  gender: GENDER,
  player: PLAYER,
  bgColor: BG_COLOR,
  parts: [
    {
      partKey: "vorderteil",
      partLabel: "Vorderseite",
      realWidthCm: dims.body.widthCm,
      realHeightCm: dims.body.heightCm,
      zones: frontZones,
    },
    {
      partKey: "rueckteil",
      partLabel: "Rückseite",
      realWidthCm: dims.body.widthCm,
      realHeightCm: dims.body.heightCm,
      zones: backZones,
    },
    {
      partKey: "aermel_links",
      partLabel: "Ärmel Links",
      realWidthCm: dims.sleeve?.widthCm || 29,
      realHeightCm: dims.sleeve?.heightCm || 39,
      zones: [], // Keine Zonen auf Ärmeln für diesen Test
    },
    {
      partKey: "aermel_rechts",
      partLabel: "Ärmel Rechts",
      realWidthCm: dims.sleeve?.widthCm || 29,
      realHeightCm: dims.sleeve?.heightCm || 39,
      zones: [], // Keine Zonen auf Ärmeln für diesen Test
    },
  ],
  bleedMm: 3,
  dpi: 300,
};

async function main() {
  console.log("\n═══ Druckbogen-Generierung ═══");
  console.log(`Verein: ${CLUB_NAME}`);
  console.log(`Spieler: ${PLAYER.playerName} #${PLAYER.playerNumber}`);
  console.log(`Größe: ${SIZE} (${dims.body.widthCm}×${dims.body.heightCm} cm)`);
  console.log(`Rückseiten-Layout: ${DEFAULT_BACK_LAYOUT}`);
  console.log("");

  try {
    const sheets = await generateAllPrintSheets(printConfig);
    console.log(`✓ ${sheets.length} Druckbögen generiert`);

    // PDFs lokal speichern
    const fs = await import("fs");
    const outputDir = "/home/ubuntu/trikot-parts/druckboegen_pdf";
    fs.mkdirSync(outputDir, { recursive: true });

    for (const sheet of sheets) {
      const filePath = `${outputDir}/${sheet.partKey}_${PLAYER.playerName}_${SIZE}.pdf`;
      fs.writeFileSync(filePath, sheet.pdf);
      console.log(`  → ${filePath} (${(sheet.pdf.length / 1024).toFixed(1)} KB)`);
    }

    console.log("\n✓ Alle Druckbögen gespeichert!");
    console.log(`  Ausgabe-Verzeichnis: ${outputDir}`);
  } catch (err) {
    console.error("FEHLER:", err);
  }
}

main();
