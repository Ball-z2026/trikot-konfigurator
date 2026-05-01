/**
 * Seed-Script: Erstellt alle Produkte aus den TEXTIL_TEMPLATES in der Datenbank.
 * Bestehende Produkte (gleiche templateId) werden nicht dupliziert.
 * 
 * Aufruf: node seed-products.mjs
 */
import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL nicht gesetzt!");
  process.exit(1);
}

// ─── Template-Definitionen (aus shared/templates.ts extrahiert) ───
// Wir definieren alle Templates hier direkt, da ESM-Import von .ts nicht möglich ist

const TEMPLATES = [
  // ═══ Fußball Sublimation ═══
  {
    id: "fussball_sublimation",
    name: "Fußballtrikot – Sublimation",
    description: "Sublimationstrikot: Alle Teile konfigurierbar (Vorderteil, Rückteil, Ärmel, Kragen, Bündchen). Farben frei wählbar.",
    category: "Trikot",
    freeZoneMode: false,
    parts: [
      { key: "vorderteil", label: "Vorderteil", imageUrl: "", sortOrder: 1, zones: [
        { label: "Vereinswappen", type: "image", purpose: "clubLogo", posX: 5, posY: 5, width: 15, height: 15, sortOrder: 1 },
        { label: "Brustnummer", type: "text", purpose: "playerNumber", posX: 75, posY: 5, width: 15, height: 15, sortOrder: 2 },
        { label: "Brust-Sponsor", type: "both", purpose: "logo", posX: 25, posY: 25, width: 50, height: 20, sortOrder: 3 },
        { label: "Bauch-Sponsor", type: "both", purpose: "logo", posX: 20, posY: 60, width: 60, height: 15, sortOrder: 4 },
      ]},
      { key: "rueckteil", label: "Rückteil", imageUrl: "", sortOrder: 2, zones: [
        { label: "Vereinsname", type: "text", purpose: "clubName", posX: 10, posY: 2, width: 80, height: 10, sortOrder: 1 },
        { label: "Spielername", type: "text", purpose: "playerName", posX: 10, posY: 12, width: 80, height: 10, sortOrder: 2 },
        { label: "Spielernummer", type: "text", purpose: "playerNumber", posX: 25, posY: 25, width: 50, height: 30, sortOrder: 3 },
        { label: "Rücken-Sponsor", type: "both", purpose: "logo", posX: 15, posY: 65, width: 70, height: 15, sortOrder: 4 },
      ]},
      { key: "aermel_links", label: "Ärmel Links", imageUrl: "", sortOrder: 3, zones: [
        { label: "Ärmel-Logo Links", type: "image", purpose: "logo", posX: 10, posY: 10, width: 80, height: 40, sortOrder: 1 },
      ]},
      { key: "aermel_rechts", label: "Ärmel Rechts", imageUrl: "", sortOrder: 4, zones: [
        { label: "Ärmel-Logo Rechts", type: "image", purpose: "logo", posX: 10, posY: 10, width: 80, height: 40, sortOrder: 1 },
      ]},
      { key: "kragen", label: "Kragen", imageUrl: "", sortOrder: 5, zones: [] },
      { key: "buendchen_links", label: "Bündchen Links", imageUrl: "", sortOrder: 6, zones: [] },
      { key: "buendchen_rechts", label: "Bündchen Rechts", imageUrl: "", sortOrder: 7, zones: [] },
    ],
  },
  // ═══ Fußball DTF ═══
  {
    id: "fussball_dtf",
    name: "Fußballtrikot – DTF",
    description: "DTF-Trikot (Direct-to-Film): Bedruckung auf Vorderteil, Rückteil und Ärmel. Kragen und Bündchen sind nicht konfigurierbar.",
    category: "Trikot",
    freeZoneMode: false,
    parts: [
      { key: "vorderteil", label: "Vorderteil", imageUrl: "", sortOrder: 1, zones: [
        { label: "Vereinswappen", type: "image", purpose: "clubLogo", posX: 5, posY: 5, width: 15, height: 15, sortOrder: 1 },
        { label: "Brustnummer", type: "text", purpose: "playerNumber", posX: 75, posY: 5, width: 15, height: 15, sortOrder: 2 },
        { label: "Brust-Sponsor", type: "both", purpose: "logo", posX: 25, posY: 25, width: 50, height: 20, sortOrder: 3 },
        { label: "Bauch-Sponsor", type: "both", purpose: "logo", posX: 20, posY: 60, width: 60, height: 15, sortOrder: 4 },
      ]},
      { key: "rueckteil", label: "Rückteil", imageUrl: "", sortOrder: 2, zones: [
        { label: "Vereinsname", type: "text", purpose: "clubName", posX: 10, posY: 2, width: 80, height: 10, sortOrder: 1 },
        { label: "Spielername", type: "text", purpose: "playerName", posX: 10, posY: 12, width: 80, height: 10, sortOrder: 2 },
        { label: "Spielernummer", type: "text", purpose: "playerNumber", posX: 25, posY: 25, width: 50, height: 30, sortOrder: 3 },
        { label: "Rücken-Sponsor", type: "both", purpose: "logo", posX: 15, posY: 65, width: 70, height: 15, sortOrder: 4 },
      ]},
      { key: "aermel_links", label: "Ärmel Links", imageUrl: "", sortOrder: 3, zones: [
        { label: "Ärmel-Logo Links", type: "image", purpose: "logo", posX: 10, posY: 10, width: 80, height: 40, sortOrder: 1 },
      ]},
      { key: "aermel_rechts", label: "Ärmel Rechts", imageUrl: "", sortOrder: 4, zones: [
        { label: "Ärmel-Logo Rechts", type: "image", purpose: "logo", posX: 10, posY: 10, width: 80, height: 40, sortOrder: 1 },
      ]},
    ],
  },
  // ═══ Handball Sublimation ═══
  {
    id: "handball_sublimation",
    name: "Handballtrikot – Sublimation",
    description: "Sublimationstrikot für Handball: Alle Teile konfigurierbar.",
    category: "Trikot",
    freeZoneMode: false,
    parts: [
      { key: "vorderteil", label: "Vorderteil", imageUrl: "", sortOrder: 1, zones: [
        { label: "Vereinswappen", type: "image", purpose: "clubLogo", posX: 5, posY: 5, width: 15, height: 15, sortOrder: 1 },
        { label: "Brustnummer", type: "text", purpose: "playerNumber", posX: 75, posY: 5, width: 15, height: 15, sortOrder: 2 },
        { label: "Brust-Sponsor", type: "both", purpose: "logo", posX: 25, posY: 25, width: 50, height: 20, sortOrder: 3 },
        { label: "Bauch-Sponsor", type: "both", purpose: "logo", posX: 20, posY: 60, width: 60, height: 15, sortOrder: 4 },
      ]},
      { key: "rueckteil", label: "Rückteil", imageUrl: "", sortOrder: 2, zones: [
        { label: "Vereinsname", type: "text", purpose: "clubName", posX: 10, posY: 2, width: 80, height: 10, sortOrder: 1 },
        { label: "Spielername", type: "text", purpose: "playerName", posX: 10, posY: 12, width: 80, height: 10, sortOrder: 2 },
        { label: "Spielernummer", type: "text", purpose: "playerNumber", posX: 25, posY: 25, width: 50, height: 30, sortOrder: 3 },
        { label: "Rücken-Sponsor", type: "both", purpose: "logo", posX: 15, posY: 65, width: 70, height: 15, sortOrder: 4 },
      ]},
      { key: "aermel_links", label: "Ärmel Links", imageUrl: "", sortOrder: 3, zones: [
        { label: "Ärmel-Logo Links", type: "image", purpose: "logo", posX: 10, posY: 10, width: 80, height: 40, sortOrder: 1 },
      ]},
      { key: "aermel_rechts", label: "Ärmel Rechts", imageUrl: "", sortOrder: 4, zones: [
        { label: "Ärmel-Logo Rechts", type: "image", purpose: "logo", posX: 10, posY: 10, width: 80, height: 40, sortOrder: 1 },
      ]},
      { key: "kragen", label: "Kragen", imageUrl: "", sortOrder: 5, zones: [] },
      { key: "buendchen_links", label: "Bündchen Links", imageUrl: "", sortOrder: 6, zones: [] },
      { key: "buendchen_rechts", label: "Bündchen Rechts", imageUrl: "", sortOrder: 7, zones: [] },
    ],
  },
  // ═══ Handball DTF ═══
  {
    id: "handball_dtf",
    name: "Handballtrikot – DTF",
    description: "DTF-Trikot für Handball: Bedruckung auf Vorderteil, Rückteil und Ärmel.",
    category: "Trikot",
    freeZoneMode: false,
    parts: [
      { key: "vorderteil", label: "Vorderteil", imageUrl: "", sortOrder: 1, zones: [
        { label: "Vereinswappen", type: "image", purpose: "clubLogo", posX: 5, posY: 5, width: 15, height: 15, sortOrder: 1 },
        { label: "Brustnummer", type: "text", purpose: "playerNumber", posX: 75, posY: 5, width: 15, height: 15, sortOrder: 2 },
        { label: "Brust-Sponsor", type: "both", purpose: "logo", posX: 25, posY: 25, width: 50, height: 20, sortOrder: 3 },
        { label: "Bauch-Sponsor", type: "both", purpose: "logo", posX: 20, posY: 60, width: 60, height: 15, sortOrder: 4 },
      ]},
      { key: "rueckteil", label: "Rückteil", imageUrl: "", sortOrder: 2, zones: [
        { label: "Vereinsname", type: "text", purpose: "clubName", posX: 10, posY: 2, width: 80, height: 10, sortOrder: 1 },
        { label: "Spielername", type: "text", purpose: "playerName", posX: 10, posY: 12, width: 80, height: 10, sortOrder: 2 },
        { label: "Spielernummer", type: "text", purpose: "playerNumber", posX: 25, posY: 25, width: 50, height: 30, sortOrder: 3 },
        { label: "Rücken-Sponsor", type: "both", purpose: "logo", posX: 15, posY: 65, width: 70, height: 15, sortOrder: 4 },
      ]},
      { key: "aermel_links", label: "Ärmel Links", imageUrl: "", sortOrder: 3, zones: [
        { label: "Ärmel-Logo Links", type: "image", purpose: "logo", posX: 10, posY: 10, width: 80, height: 40, sortOrder: 1 },
      ]},
      { key: "aermel_rechts", label: "Ärmel Rechts", imageUrl: "", sortOrder: 4, zones: [
        { label: "Ärmel-Logo Rechts", type: "image", purpose: "logo", posX: 10, posY: 10, width: 80, height: 40, sortOrder: 1 },
      ]},
    ],
  },
  // ═══ Volleyball Sublimation ═══
  {
    id: "volleyball_sublimation",
    name: "Volleyballtrikot – Sublimation",
    description: "Sublimationstrikot für Volleyball: Alle Teile konfigurierbar.",
    category: "Trikot",
    freeZoneMode: false,
    parts: [
      { key: "vorderteil", label: "Vorderteil", imageUrl: "", sortOrder: 1, zones: [
        { label: "Vereinswappen", type: "image", purpose: "clubLogo", posX: 5, posY: 5, width: 15, height: 15, sortOrder: 1 },
        { label: "Brustnummer", type: "text", purpose: "playerNumber", posX: 75, posY: 5, width: 15, height: 15, sortOrder: 2 },
        { label: "Brust-Sponsor", type: "both", purpose: "logo", posX: 25, posY: 25, width: 50, height: 20, sortOrder: 3 },
        { label: "Bauch-Sponsor", type: "both", purpose: "logo", posX: 20, posY: 60, width: 60, height: 15, sortOrder: 4 },
      ]},
      { key: "rueckteil", label: "Rückteil", imageUrl: "", sortOrder: 2, zones: [
        { label: "Vereinsname", type: "text", purpose: "clubName", posX: 10, posY: 2, width: 80, height: 10, sortOrder: 1 },
        { label: "Spielername", type: "text", purpose: "playerName", posX: 10, posY: 12, width: 80, height: 10, sortOrder: 2 },
        { label: "Spielernummer", type: "text", purpose: "playerNumber", posX: 25, posY: 25, width: 50, height: 30, sortOrder: 3 },
        { label: "Rücken-Sponsor", type: "both", purpose: "logo", posX: 15, posY: 65, width: 70, height: 15, sortOrder: 4 },
      ]},
      { key: "aermel_links", label: "Ärmel Links", imageUrl: "", sortOrder: 3, zones: [
        { label: "Ärmel-Logo Links", type: "image", purpose: "logo", posX: 10, posY: 10, width: 80, height: 40, sortOrder: 1 },
      ]},
      { key: "aermel_rechts", label: "Ärmel Rechts", imageUrl: "", sortOrder: 4, zones: [
        { label: "Ärmel-Logo Rechts", type: "image", purpose: "logo", posX: 10, posY: 10, width: 80, height: 40, sortOrder: 1 },
      ]},
      { key: "kragen", label: "Kragen", imageUrl: "", sortOrder: 5, zones: [] },
      { key: "buendchen_links", label: "Bündchen Links", imageUrl: "", sortOrder: 6, zones: [] },
      { key: "buendchen_rechts", label: "Bündchen Rechts", imageUrl: "", sortOrder: 7, zones: [] },
    ],
  },
  // ═══ Volleyball DTF ═══
  {
    id: "volleyball_dtf",
    name: "Volleyballtrikot – DTF",
    description: "DTF-Trikot für Volleyball: Bedruckung auf Vorderteil, Rückteil und Ärmel.",
    category: "Trikot",
    freeZoneMode: false,
    parts: [
      { key: "vorderteil", label: "Vorderteil", imageUrl: "", sortOrder: 1, zones: [
        { label: "Vereinswappen", type: "image", purpose: "clubLogo", posX: 5, posY: 5, width: 15, height: 15, sortOrder: 1 },
        { label: "Brustnummer", type: "text", purpose: "playerNumber", posX: 75, posY: 5, width: 15, height: 15, sortOrder: 2 },
        { label: "Brust-Sponsor", type: "both", purpose: "logo", posX: 25, posY: 25, width: 50, height: 20, sortOrder: 3 },
        { label: "Bauch-Sponsor", type: "both", purpose: "logo", posX: 20, posY: 60, width: 60, height: 15, sortOrder: 4 },
      ]},
      { key: "rueckteil", label: "Rückteil", imageUrl: "", sortOrder: 2, zones: [
        { label: "Vereinsname", type: "text", purpose: "clubName", posX: 10, posY: 2, width: 80, height: 10, sortOrder: 1 },
        { label: "Spielername", type: "text", purpose: "playerName", posX: 10, posY: 12, width: 80, height: 10, sortOrder: 2 },
        { label: "Spielernummer", type: "text", purpose: "playerNumber", posX: 25, posY: 25, width: 50, height: 30, sortOrder: 3 },
        { label: "Rücken-Sponsor", type: "both", purpose: "logo", posX: 15, posY: 65, width: 70, height: 15, sortOrder: 4 },
      ]},
      { key: "aermel_links", label: "Ärmel Links", imageUrl: "", sortOrder: 3, zones: [
        { label: "Ärmel-Logo Links", type: "image", purpose: "logo", posX: 10, posY: 10, width: 80, height: 40, sortOrder: 1 },
      ]},
      { key: "aermel_rechts", label: "Ärmel Rechts", imageUrl: "", sortOrder: 4, zones: [
        { label: "Ärmel-Logo Rechts", type: "image", purpose: "logo", posX: 10, posY: 10, width: 80, height: 40, sortOrder: 1 },
      ]},
    ],
  },
  // ═══ Basketball Sublimation ═══
  {
    id: "basketball_sublimation",
    name: "Basketballtrikot – Sublimation",
    description: "Sublimationstrikot für Basketball: Ärmellos, alle Teile konfigurierbar.",
    category: "Trikot",
    freeZoneMode: false,
    parts: [
      { key: "vorderteil", label: "Vorderteil", imageUrl: "", sortOrder: 1, zones: [
        { label: "Vereinswappen", type: "image", purpose: "clubLogo", posX: 5, posY: 5, width: 15, height: 15, sortOrder: 1 },
        { label: "Brustnummer", type: "text", purpose: "playerNumber", posX: 75, posY: 5, width: 15, height: 15, sortOrder: 2 },
        { label: "Brust-Sponsor", type: "both", purpose: "logo", posX: 25, posY: 25, width: 50, height: 20, sortOrder: 3 },
        { label: "Bauch-Sponsor", type: "both", purpose: "logo", posX: 20, posY: 60, width: 60, height: 15, sortOrder: 4 },
      ]},
      { key: "rueckteil", label: "Rückteil", imageUrl: "", sortOrder: 2, zones: [
        { label: "Vereinsname", type: "text", purpose: "clubName", posX: 10, posY: 2, width: 80, height: 10, sortOrder: 1 },
        { label: "Spielername", type: "text", purpose: "playerName", posX: 10, posY: 12, width: 80, height: 10, sortOrder: 2 },
        { label: "Spielernummer", type: "text", purpose: "playerNumber", posX: 25, posY: 25, width: 50, height: 30, sortOrder: 3 },
        { label: "Rücken-Sponsor", type: "both", purpose: "logo", posX: 15, posY: 65, width: 70, height: 15, sortOrder: 4 },
      ]},
    ],
  },
  // ═══ Basketball DTF ═══
  {
    id: "basketball_dtf",
    name: "Basketballtrikot – DTF",
    description: "DTF-Trikot für Basketball: Ärmellos, Bedruckung auf Vorderteil und Rückteil.",
    category: "Trikot",
    freeZoneMode: false,
    parts: [
      { key: "vorderteil", label: "Vorderteil", imageUrl: "", sortOrder: 1, zones: [
        { label: "Vereinswappen", type: "image", purpose: "clubLogo", posX: 5, posY: 5, width: 15, height: 15, sortOrder: 1 },
        { label: "Brustnummer", type: "text", purpose: "playerNumber", posX: 75, posY: 5, width: 15, height: 15, sortOrder: 2 },
        { label: "Brust-Sponsor", type: "both", purpose: "logo", posX: 25, posY: 25, width: 50, height: 20, sortOrder: 3 },
        { label: "Bauch-Sponsor", type: "both", purpose: "logo", posX: 20, posY: 60, width: 60, height: 15, sortOrder: 4 },
      ]},
      { key: "rueckteil", label: "Rückteil", imageUrl: "", sortOrder: 2, zones: [
        { label: "Vereinsname", type: "text", purpose: "clubName", posX: 10, posY: 2, width: 80, height: 10, sortOrder: 1 },
        { label: "Spielername", type: "text", purpose: "playerName", posX: 10, posY: 12, width: 80, height: 10, sortOrder: 2 },
        { label: "Spielernummer", type: "text", purpose: "playerNumber", posX: 25, posY: 25, width: 50, height: 30, sortOrder: 3 },
        { label: "Rücken-Sponsor", type: "both", purpose: "logo", posX: 15, posY: 65, width: 70, height: 15, sortOrder: 4 },
      ]},
    ],
  },
  // ═══ SVG-Trikots (DTF mit SVG-Silhouetten) ═══
  {
    id: "fussball_dtf_svg",
    name: "Fußballtrikot SVG – DTF",
    description: "DTF-Trikot mit SVG-Silhouetten für Fußball.",
    category: "Trikot",
    freeZoneMode: false,
    parts: [
      { key: "vorderteil", label: "Vorderteil", imageUrl: "/manus-storage/trikot_svg_vorderteil_9c36a538.svg", sortOrder: 1, zones: [
        { label: "Vereinswappen", type: "image", purpose: "clubLogo", posX: 5, posY: 8, width: 15, height: 18, sortOrder: 1 },
        { label: "Brustnummer", type: "text", purpose: "playerNumber", posX: 78, posY: 8, width: 14, height: 16, sortOrder: 2 },
        { label: "Brust-Sponsor", type: "both", purpose: "logo", posX: 22, posY: 30, width: 56, height: 18, sortOrder: 3 },
        { label: "Bauch-Sponsor", type: "both", purpose: "logo", posX: 18, posY: 62, width: 64, height: 14, sortOrder: 4 },
      ]},
      { key: "rueckteil", label: "Rückteil", imageUrl: "/manus-storage/trikot_svg_rueckteil_2e281b2f.svg", sortOrder: 2, zones: [
        { label: "Vereinsname", type: "text", purpose: "clubName", posX: 10, posY: 4, width: 80, height: 8, sortOrder: 1 },
        { label: "Spielername", type: "text", purpose: "playerName", posX: 10, posY: 14, width: 80, height: 8, sortOrder: 2 },
        { label: "Spielernummer", type: "text", purpose: "playerNumber", posX: 28, posY: 26, width: 44, height: 30, sortOrder: 3 },
        { label: "Rücken-Sponsor", type: "both", purpose: "logo", posX: 15, posY: 65, width: 70, height: 14, sortOrder: 4 },
      ]},
      { key: "aermel_links", label: "Ärmel Links", imageUrl: "/manus-storage/trikot_svg_aermel_links_1513b77c.svg", sortOrder: 3, zones: [
        { label: "Ärmel-Logo Links", type: "image", purpose: "logo", posX: 10, posY: 15, width: 80, height: 35, sortOrder: 1 },
      ]},
      { key: "aermel_rechts", label: "Ärmel Rechts", imageUrl: "/manus-storage/trikot_svg_aermel_rechts_ebafd1a1.svg", sortOrder: 4, zones: [
        { label: "Ärmel-Logo Rechts", type: "image", purpose: "logo", posX: 10, posY: 15, width: 80, height: 35, sortOrder: 1 },
      ]},
    ],
  },
  {
    id: "handball_dtf_svg",
    name: "Handballtrikot SVG – DTF",
    description: "DTF-Trikot mit SVG-Silhouetten für Handball.",
    category: "Trikot",
    freeZoneMode: false,
    parts: [
      { key: "vorderteil", label: "Vorderteil", imageUrl: "/manus-storage/trikot_svg_vorderteil_9c36a538.svg", sortOrder: 1, zones: [
        { label: "Vereinswappen", type: "image", purpose: "clubLogo", posX: 5, posY: 8, width: 15, height: 18, sortOrder: 1 },
        { label: "Brustnummer", type: "text", purpose: "playerNumber", posX: 78, posY: 8, width: 14, height: 16, sortOrder: 2 },
        { label: "Brust-Sponsor", type: "both", purpose: "logo", posX: 22, posY: 30, width: 56, height: 18, sortOrder: 3 },
        { label: "Bauch-Sponsor", type: "both", purpose: "logo", posX: 18, posY: 62, width: 64, height: 14, sortOrder: 4 },
      ]},
      { key: "rueckteil", label: "Rückteil", imageUrl: "/manus-storage/trikot_svg_rueckteil_2e281b2f.svg", sortOrder: 2, zones: [
        { label: "Vereinsname", type: "text", purpose: "clubName", posX: 10, posY: 4, width: 80, height: 8, sortOrder: 1 },
        { label: "Spielername", type: "text", purpose: "playerName", posX: 10, posY: 14, width: 80, height: 8, sortOrder: 2 },
        { label: "Spielernummer", type: "text", purpose: "playerNumber", posX: 28, posY: 26, width: 44, height: 30, sortOrder: 3 },
        { label: "Rücken-Sponsor", type: "both", purpose: "logo", posX: 15, posY: 65, width: 70, height: 14, sortOrder: 4 },
      ]},
      { key: "aermel_links", label: "Ärmel Links", imageUrl: "/manus-storage/trikot_svg_aermel_links_1513b77c.svg", sortOrder: 3, zones: [
        { label: "Ärmel-Logo Links", type: "image", purpose: "logo", posX: 10, posY: 15, width: 80, height: 35, sortOrder: 1 },
      ]},
      { key: "aermel_rechts", label: "Ärmel Rechts", imageUrl: "/manus-storage/trikot_svg_aermel_rechts_ebafd1a1.svg", sortOrder: 4, zones: [
        { label: "Ärmel-Logo Rechts", type: "image", purpose: "logo", posX: 10, posY: 15, width: 80, height: 35, sortOrder: 1 },
      ]},
    ],
  },
  {
    id: "volleyball_dtf_svg",
    name: "Volleyballtrikot SVG – DTF",
    description: "DTF-Trikot mit SVG-Silhouetten für Volleyball.",
    category: "Trikot",
    freeZoneMode: false,
    parts: [
      { key: "vorderteil", label: "Vorderteil", imageUrl: "/manus-storage/trikot_svg_vorderteil_9c36a538.svg", sortOrder: 1, zones: [
        { label: "Vereinswappen", type: "image", purpose: "clubLogo", posX: 5, posY: 8, width: 15, height: 18, sortOrder: 1 },
        { label: "Brustnummer", type: "text", purpose: "playerNumber", posX: 78, posY: 8, width: 14, height: 16, sortOrder: 2 },
        { label: "Brust-Sponsor", type: "both", purpose: "logo", posX: 22, posY: 30, width: 56, height: 18, sortOrder: 3 },
        { label: "Bauch-Sponsor", type: "both", purpose: "logo", posX: 18, posY: 62, width: 64, height: 14, sortOrder: 4 },
      ]},
      { key: "rueckteil", label: "Rückteil", imageUrl: "/manus-storage/trikot_svg_rueckteil_2e281b2f.svg", sortOrder: 2, zones: [
        { label: "Vereinsname", type: "text", purpose: "clubName", posX: 10, posY: 4, width: 80, height: 8, sortOrder: 1 },
        { label: "Spielername", type: "text", purpose: "playerName", posX: 10, posY: 14, width: 80, height: 8, sortOrder: 2 },
        { label: "Spielernummer", type: "text", purpose: "playerNumber", posX: 28, posY: 26, width: 44, height: 30, sortOrder: 3 },
        { label: "Rücken-Sponsor", type: "both", purpose: "logo", posX: 15, posY: 65, width: 70, height: 14, sortOrder: 4 },
      ]},
      { key: "aermel_links", label: "Ärmel Links", imageUrl: "/manus-storage/trikot_svg_aermel_links_1513b77c.svg", sortOrder: 3, zones: [
        { label: "Ärmel-Logo Links", type: "image", purpose: "logo", posX: 10, posY: 15, width: 80, height: 35, sortOrder: 1 },
      ]},
      { key: "aermel_rechts", label: "Ärmel Rechts", imageUrl: "/manus-storage/trikot_svg_aermel_rechts_ebafd1a1.svg", sortOrder: 4, zones: [
        { label: "Ärmel-Logo Rechts", type: "image", purpose: "logo", posX: 10, posY: 15, width: 80, height: 35, sortOrder: 1 },
      ]},
    ],
  },
  {
    id: "basketball_dtf_svg",
    name: "Basketballtrikot SVG – DTF",
    description: "DTF-Trikot mit SVG-Silhouetten für Basketball (ärmellos).",
    category: "Trikot",
    freeZoneMode: false,
    parts: [
      { key: "vorderteil", label: "Vorderteil", imageUrl: "/manus-storage/trikot_svg_vorderteil_9c36a538.svg", sortOrder: 1, zones: [
        { label: "Vereinswappen", type: "image", purpose: "clubLogo", posX: 5, posY: 8, width: 15, height: 18, sortOrder: 1 },
        { label: "Brustnummer", type: "text", purpose: "playerNumber", posX: 78, posY: 8, width: 14, height: 16, sortOrder: 2 },
        { label: "Brust-Sponsor", type: "both", purpose: "logo", posX: 22, posY: 30, width: 56, height: 18, sortOrder: 3 },
        { label: "Bauch-Sponsor", type: "both", purpose: "logo", posX: 18, posY: 62, width: 64, height: 14, sortOrder: 4 },
      ]},
      { key: "rueckteil", label: "Rückteil", imageUrl: "/manus-storage/trikot_svg_rueckteil_2e281b2f.svg", sortOrder: 2, zones: [
        { label: "Vereinsname", type: "text", purpose: "clubName", posX: 10, posY: 4, width: 80, height: 8, sortOrder: 1 },
        { label: "Spielername", type: "text", purpose: "playerName", posX: 10, posY: 14, width: 80, height: 8, sortOrder: 2 },
        { label: "Spielernummer", type: "text", purpose: "playerNumber", posX: 28, posY: 26, width: 44, height: 30, sortOrder: 3 },
        { label: "Rücken-Sponsor", type: "both", purpose: "logo", posX: 15, posY: 65, width: 70, height: 14, sortOrder: 4 },
      ]},
    ],
  },
  // ═══ Bekleidung (freeZoneMode) ═══
  {
    id: "trainingshose",
    name: "Trainingshose",
    description: "Trainingshose mit freier Zonen-Konfiguration. Trainer kann eigene Zonen erstellen und positionieren.",
    category: "Hose",
    freeZoneMode: true,
    parts: [
      { key: "vorderteil", label: "Vorderteil", imageUrl: "/manus-storage/trainingshose_front_e7906657.svg", sortOrder: 1, zones: [
        { label: "Vereinswappen", type: "image", purpose: "clubLogo", posX: 35, posY: 5, width: 30, height: 15, sortOrder: 1 },
      ]},
      { key: "rueckteil", label: "Rückteil", imageUrl: "/manus-storage/trainingshose_back_efd89dfa.svg", sortOrder: 2, zones: [] },
    ],
  },
  {
    id: "aufwaermshirt",
    name: "Aufwärmshirt",
    description: "Langarm-Aufwärmshirt mit freier Zonen-Konfiguration.",
    category: "Shirt",
    freeZoneMode: true,
    parts: [
      { key: "vorderteil", label: "Vorderteil", imageUrl: "/manus-storage/aufwaermshirt_front_ae95cc7f.svg", sortOrder: 1, zones: [
        { label: "Vereinswappen", type: "image", purpose: "clubLogo", posX: 5, posY: 8, width: 15, height: 18, sortOrder: 1 },
      ]},
      { key: "rueckteil", label: "Rückteil", imageUrl: "/manus-storage/aufwaermshirt_back_ce952a93.svg", sortOrder: 2, zones: [] },
    ],
  },
  {
    id: "zipjacke",
    name: "Zip-Jacke",
    description: "Zip-Jacke mit durchgehendem Reißverschluss und freier Zonen-Konfiguration.",
    category: "Jacke",
    freeZoneMode: true,
    parts: [
      { key: "vorderteil", label: "Vorderteil", imageUrl: "/manus-storage/zipjacke_front_21c5a323.svg", sortOrder: 1, zones: [
        { label: "Vereinswappen", type: "image", purpose: "clubLogo", posX: 5, posY: 8, width: 15, height: 18, sortOrder: 1 },
      ]},
      { key: "rueckteil", label: "Rückteil", imageUrl: "/manus-storage/zipjacke_back_8fd59235.svg", sortOrder: 2, zones: [] },
    ],
  },
  {
    id: "halfzipper",
    name: "Half-Zipper",
    description: "Half-Zip Pullover mit halbem Reißverschluss und freier Zonen-Konfiguration.",
    category: "Pullover",
    freeZoneMode: true,
    parts: [
      { key: "vorderteil", label: "Vorderteil", imageUrl: "/manus-storage/halfzipper_front_a4f66ee1.svg", sortOrder: 1, zones: [
        { label: "Vereinswappen", type: "image", purpose: "clubLogo", posX: 5, posY: 12, width: 15, height: 18, sortOrder: 1 },
      ]},
      { key: "rueckteil", label: "Rückteil", imageUrl: "/manus-storage/halfzipper_back_bb8bc0d7.svg", sortOrder: 2, zones: [] },
    ],
  },
  {
    id: "warmejacke",
    name: "Warme Jacke",
    description: "Gefütterte Winterjacke mit Kapuze und freier Zonen-Konfiguration.",
    category: "Jacke",
    freeZoneMode: true,
    parts: [
      { key: "vorderteil", label: "Vorderteil", imageUrl: "/manus-storage/warmejacke_front_88ce747a.svg", sortOrder: 1, zones: [
        { label: "Vereinswappen", type: "image", purpose: "clubLogo", posX: 5, posY: 10, width: 15, height: 18, sortOrder: 1 },
      ]},
      { key: "rueckteil", label: "Rückteil", imageUrl: "/manus-storage/warmejacke_back_344fce0a.svg", sortOrder: 2, zones: [] },
    ],
  },
];

async function main() {
  console.log("🔗 Verbinde mit Datenbank...");
  const connection = await mysql.createConnection(DATABASE_URL);
  
  // Prüfe bestehende Produkte
  const [existingRows] = await connection.execute("SELECT templateId FROM products WHERE templateId IS NOT NULL");
  const existingTemplateIds = new Set(existingRows.map(r => r.templateId));
  console.log(`📦 ${existingTemplateIds.size} bestehende Produkte gefunden: ${[...existingTemplateIds].join(", ")}`);

  let created = 0;
  let skipped = 0;

  for (const template of TEMPLATES) {
    if (existingTemplateIds.has(template.id)) {
      console.log(`⏭️  Überspringe "${template.name}" (templateId: ${template.id}) – existiert bereits`);
      skipped++;
      continue;
    }

    console.log(`➕ Erstelle "${template.name}" (templateId: ${template.id})...`);

    // 1. Produkt erstellen
    const [productResult] = await connection.execute(
      "INSERT INTO products (name, description, category, templateId, freeZoneMode, published) VALUES (?, ?, ?, ?, ?, ?)",
      [template.name, template.description, template.category, template.id, template.freeZoneMode ? 1 : 0, 1]
    );
    const productId = productResult.insertId;

    // 2. Parts und Zonen erstellen
    for (const part of template.parts) {
      const [partResult] = await connection.execute(
        "INSERT INTO product_parts (productId, `key`, label, imageUrl, sortOrder) VALUES (?, ?, ?, ?, ?)",
        [productId, part.key, part.label, part.imageUrl, part.sortOrder]
      );
      const partId = partResult.insertId;

      for (const zone of part.zones) {
        await connection.execute(
          `INSERT INTO product_zones (productId, partId, label, side, type, purpose, posX, posY, width, height, widthCm, heightCm, rotation, fontFamily, fontSize, fontColor, fontWeight, textAlign, sortOrder)
           VALUES (?, ?, ?, 'front', ?, ?, ?, ?, ?, ?, ?, ?, 0, NULL, NULL, NULL, NULL, NULL, ?)`,
          [productId, partId, zone.label, zone.type, zone.purpose, zone.posX, zone.posY, zone.width, zone.height, null, null, zone.sortOrder]
        );
      }
    }

    console.log(`   ✅ Produkt #${productId} erstellt mit ${template.parts.length} Teilen`);
    created++;
  }

  console.log(`\n🎉 Fertig! ${created} Produkte erstellt, ${skipped} übersprungen.`);
  
  // Zeige alle Produkte
  const [allProducts] = await connection.execute("SELECT id, name, templateId, published, freeZoneMode FROM products ORDER BY id");
  console.log(`\n📋 Alle Produkte in der Datenbank (${allProducts.length}):`);
  for (const p of allProducts) {
    console.log(`   #${p.id} ${p.name} [${p.templateId || 'kein Template'}] published=${p.published} freeZone=${p.freeZoneMode}`);
  }

  await connection.end();
}

main().catch((err) => {
  console.error("❌ Fehler:", err);
  process.exit(1);
});
