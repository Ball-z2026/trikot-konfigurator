/**
 * Spezifikations-Datenblatt-Generator (PDF)
 *
 * Erzeugt ein druckfertiges Datenblatt mit allen Produkt-Elementen:
 * - Produktname, Template, Kategorie
 * - Alle Teile (Parts) mit Zonen
 * - Pro Zone: Zweck, Typ, Position, Maße (cm), Schrift, Farbe (HEX + CMYK), Rotation
 * - Farbpalette (Sublimation)
 * - Verwendete Schriften
 *
 * Dieses Datenblatt dient der Druckerei als Referenz.
 */
import PDFDocument from "pdfkit";
import { Buffer } from "node:buffer";

// ═══════════════════════════════════════════════════════════════════
// Typen
// ═══════════════════════════════════════════════════════════════════

export interface SpecZone {
  label: string;
  purpose: string;
  type: "image" | "text" | "both";
  posX: number;
  posY: number;
  width: number;
  height: number;
  widthCm: number | null;
  heightCm: number | null;
  rotation: number;
  fontFamily: string | null;
  fontSize: number | null;
  fontColor: string | null;
  fontWeight: string | null;
  textAlign: string | null;
}

export interface SpecPart {
  key: string;
  label: string;
  imageUrl: string | null;
  zones: SpecZone[];
}

export interface SpecSheetConfig {
  productName: string;
  templateId: string | null;
  category: string | null;
  parts: SpecPart[];
  colorPalette: string[];
  createdAt: string;
}

// ═══════════════════════════════════════════════════════════════════
// Farb-Konvertierung
// ═══════════════════════════════════════════════════════════════════

function hexToCmyk(hex: string): { c: number; m: number; y: number; k: number } {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.substring(0, 2), 16) / 255;
  const g = parseInt(clean.substring(2, 4), 16) / 255;
  const b = parseInt(clean.substring(4, 6), 16) / 255;

  const k = 1 - Math.max(r, g, b);
  if (k === 1) return { c: 0, m: 0, y: 0, k: 100 };

  return {
    c: Math.round(((1 - r - k) / (1 - k)) * 100),
    m: Math.round(((1 - g - k) / (1 - k)) * 100),
    y: Math.round(((1 - b - k) / (1 - k)) * 100),
    k: Math.round(k * 100),
  };
}

function formatCmykStr(hex: string): string {
  const cmyk = hexToCmyk(hex);
  return `C:${cmyk.c} M:${cmyk.m} Y:${cmyk.y} K:${cmyk.k}`;
}

// ═══════════════════════════════════════════════════════════════════
// Purpose-Labels
// ═══════════════════════════════════════════════════════════════════

const PURPOSE_LABELS: Record<string, string> = {
  logo: "Logo",
  clubLogo: "Vereinswappen",
  playerName: "Spielername",
  playerNumber: "Spielernummer",
  playerInitials: "Kürzel (Spieler)",
  clubName: "Vereinsname",
  abbreviation: "Kürzel (Verein)",
  coordinates: "Koordinaten",
  hashtag: "Hashtag",
  flag: "Flagge",
  qrCode: "QR-Code",
  sponsor: "Sponsor",
  custom: "Freitext",
};

const TYPE_LABELS: Record<string, string> = {
  image: "Bild",
  text: "Text",
  both: "Bild + Text",
};

// ═══════════════════════════════════════════════════════════════════
// PDF-Generierung
// ═══════════════════════════════════════════════════════════════════

export async function generateSpecSheet(config: SpecSheetConfig): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margins: { top: 40, bottom: 40, left: 40, right: 40 },
      info: {
        Title: `Spezifikation: ${config.productName}`,
        Author: "Trikot-Konfigurator",
        Subject: "Produkt-Spezifikation / Datenblatt",
        CreationDate: new Date(),
      },
    });

    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const pageWidth = 595.28 - 80; // A4 width minus margins
    const primaryColor = "#1a1a2e";
    const accentColor = "#16213e";
    const mutedColor = "#666666";

    // ─── Titelseite ──────────────────────────────────────────────
    doc.fontSize(24).fillColor(primaryColor).text("PRODUKT-SPEZIFIKATION", { align: "center" });
    doc.moveDown(0.5);
    doc.fontSize(16).fillColor(accentColor).text(config.productName, { align: "center" });
    doc.moveDown(0.3);

    // Meta-Informationen
    doc.fontSize(10).fillColor(mutedColor);
    doc.text(`Template: ${config.templateId || "–"}`, { align: "center" });
    doc.text(`Kategorie: ${config.category || "–"}`, { align: "center" });
    doc.text(`Erstellt: ${config.createdAt}`, { align: "center" });
    doc.moveDown(1);

    // Trennlinie
    doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke(accentColor);
    doc.moveDown(1);

    // ─── Übersicht ───────────────────────────────────────────────
    doc.fontSize(14).fillColor(primaryColor).text("Übersicht");
    doc.moveDown(0.3);
    doc.fontSize(10).fillColor("#333333");

    const totalZones = config.parts.reduce((sum, p) => sum + p.zones.length, 0);
    const allZones = config.parts.flatMap((p) => p.zones);
    const textZones = allZones.filter((z) => z.type === "text" || z.type === "both");
    const imageZones = allZones.filter((z) => z.type === "image" || z.type === "both");
    const usedFonts = [...new Set(textZones.map((z) => z.fontFamily).filter(Boolean))];
    const usedColors = [...new Set(textZones.map((z) => z.fontColor).filter(Boolean))];

    doc.text(`Teile: ${config.parts.length}`);
    doc.text(`Zonen gesamt: ${totalZones} (${textZones.length} Text, ${imageZones.length} Bild)`);
    doc.text(`Verwendete Schriften: ${usedFonts.length > 0 ? usedFonts.join(", ") : "–"}`);
    doc.text(`Verwendete Farben: ${usedColors.length}`);
    doc.moveDown(0.5);

    // ─── Farbpalette (Sublimation) ───────────────────────────────
    if (config.colorPalette.length > 0) {
      doc.fontSize(12).fillColor(primaryColor).text("Farbpalette (Sublimation)");
      doc.moveDown(0.3);
      doc.fontSize(9).fillColor("#333333");

      for (const color of config.colorPalette) {
        const cmykStr = formatCmykStr(color);
        // Farbfeld zeichnen
        const y = doc.y;
        doc.rect(40, y, 12, 12).fill(color);
        doc.fillColor("#333333").text(`  ${color.toUpperCase()}  –  ${cmykStr}`, 58, y + 2);
        doc.moveDown(0.3);
      }
      doc.moveDown(0.5);
    }

    // ─── Verwendete Farben ───────────────────────────────────────
    if (usedColors.length > 0) {
      doc.fontSize(12).fillColor(primaryColor).text("Verwendete Textfarben");
      doc.moveDown(0.3);
      doc.fontSize(9).fillColor("#333333");

      for (const color of usedColors) {
        const cmykStr = formatCmykStr(color!);
        const y = doc.y;
        doc.rect(40, y, 12, 12).fill(color!);
        doc.fillColor("#333333").text(`  ${color!.toUpperCase()}  –  ${cmykStr}`, 58, y + 2);
        doc.moveDown(0.3);
      }
      doc.moveDown(0.5);
    }

    // ─── Zonen-Details pro Part ──────────────────────────────────
    for (const part of config.parts) {
      // Neue Seite wenn wenig Platz
      if (doc.y > 650) {
        doc.addPage();
      }

      doc.fontSize(14).fillColor(primaryColor).text(`Teil: ${part.label}`);
      doc.moveDown(0.2);
      doc.fontSize(9).fillColor(mutedColor).text(`Key: ${part.key} | ${part.zones.length} Zonen`);
      doc.moveDown(0.3);

      // Trennlinie
      doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke("#cccccc");
      doc.moveDown(0.3);

      for (let i = 0; i < part.zones.length; i++) {
        const zone = part.zones[i];
        const purposeLabel = PURPOSE_LABELS[zone.purpose] || zone.purpose;
        const typeLabel = TYPE_LABELS[zone.type] || zone.type;

        // Neue Seite wenn wenig Platz
        if (doc.y > 700) {
          doc.addPage();
        }

        // Zone-Header
        doc.fontSize(11).fillColor(accentColor).text(`${i + 1}. ${purposeLabel} (${typeLabel})`);
        doc.moveDown(0.2);

        // Details als Tabelle
        doc.fontSize(9).fillColor("#333333");

        const details: [string, string][] = [
          ["Position", `X: ${zone.posX.toFixed(1)}% | Y: ${zone.posY.toFixed(1)}% | B: ${zone.width.toFixed(1)}% | H: ${zone.height.toFixed(1)}%`],
        ];

        if (zone.widthCm && zone.heightCm) {
          details.push(["Druckmaße", `${zone.widthCm} × ${zone.heightCm} cm`]);
        }

        if (zone.rotation > 0) {
          details.push(["Rotation", `${zone.rotation}°`]);
        }

        if (zone.type === "text" || zone.type === "both") {
          if (zone.fontFamily) {
            details.push(["Schriftart", zone.fontFamily]);
          }
          if (zone.fontSize) {
            details.push(["Schriftgröße", `${zone.fontSize}px`]);
          }
          if (zone.fontWeight) {
            details.push(["Schriftstärke", zone.fontWeight]);
          }
          if (zone.textAlign) {
            details.push(["Ausrichtung", zone.textAlign === "left" ? "Links" : zone.textAlign === "right" ? "Rechts" : "Zentriert"]);
          }
          if (zone.fontColor) {
            const cmykStr = formatCmykStr(zone.fontColor);
            details.push(["Farbe", `${zone.fontColor.toUpperCase()} (${cmykStr})`]);
          }
        }

        if (zone.type === "image" || zone.type === "both") {
          details.push(["Bildtyp", "Originaldatei wird beim Konfigurieren zugewiesen"]);
        }

        // Details rendern
        for (const [label, value] of details) {
          doc.fillColor(mutedColor).text(`${label}: `, 60, doc.y, { continued: true });
          doc.fillColor("#333333").text(value);
        }

        doc.moveDown(0.5);
      }

      doc.moveDown(0.5);
    }

    // ─── Fußzeile ────────────────────────────────────────────────
    doc.moveDown(1);
    doc.fontSize(8).fillColor(mutedColor).text(
      "Dieses Datenblatt wurde automatisch generiert. Alle Angaben fließen direkt in den Druckbogen ein.",
      { align: "center" }
    );
    doc.text(
      "Änderungen im Produktdesigner werden automatisch übernommen.",
      { align: "center" }
    );

    doc.end();
  });
}
