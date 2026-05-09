/**
 * Druckbogen-Generator: Erzeugt druckfertige CMYK-PDFs mit Vektorgrafiken.
 *
 * Jeder Druckbogen enthält:
 * - Alle Texte als Vektoren (kein Rastertext)
 * - CMYK-Farbraum für professionellen Druck
 * - Exakte Positionierung basierend auf Konfektionsgröße
 * - Beschnittmarken und Passermarken
 * - 300 DPI Auflösung für Bilder
 *
 * Pro Spieler werden bis zu 4 Druckbögen erzeugt:
 * 1. Vorderseite
 * 2. Rückseite
 * 3. Ärmel Links (falls vorhanden)
 * 4. Ärmel Rechts (falls vorhanden)
 */

import {
  ensureTextContrast,
  getTextOutlineForContrast,
  colorsAreTooSimilar,
  isDarkColor,
} from "../shared/contrastUtils";
import PDFDocument from "pdfkit";
import { Buffer } from "node:buffer";
import sharp from "sharp";
import {
  getSizeDimensions,
  type SizeCode,
  type SportCode,
  type GenderCode,
} from "../shared/sizeCharts";

// ═══════════════════════════════════════════════════════════════════
// Typen
// ═══════════════════════════════════════════════════════════════════

export interface PrintZone {
  /** Zonentyp */
  purpose: string;
  /** Inhalt: Text oder Bild-URL */
  content: string;
  /** X-Position in % des Parts */
  posXPercent: number;
  /** Y-Position in % des Parts */
  posYPercent: number;
  /** Breite in % des Parts */
  widthPercent: number;
  /** Höhe in % des Parts */
  heightPercent: number;
  /** Textstil */
  textStyle?: "arc" | "straight";
  /** Bogengrad (nur bei arc) */
  arcDegree?: number;
  /** Textfarbe als HEX */
  fontColor?: string;
  /** Outline-Farbe als HEX */
  outlineColor?: string;
  /** Outline-Breite in % der Schrifthöhe */
  outlineWidth?: number;
  /** Schriftart-Kategorie */
  fontStyle?: string;
  /** Schriftstärke */
  fontWeight?: string;
  /** Schriftfamilie (exakter Name) */
  fontFamily?: string;
  /** Schriftgröße in % der Zonenhöhe */
  fontSize?: number;
  /** Textausrichtung */
  textAlign?: "left" | "center" | "right";
  /** Rotation in Grad */
  rotation?: number;
  /** Ist dies ein Bild statt Text? */
  isImage?: boolean;
  /** Bild-URL (für Logo/Wappen) */
  imageUrl?: string;
}

export interface PrintSheetConfig {
  /** Part-Bezeichnung: vorderteil, rueckteil, aermel_links, aermel_rechts */
  partKey: string;
  /** Part-Label für die Anzeige */
  partLabel: string;
  /** Reale Breite des Parts in cm */
  realWidthCm: number;
  /** Reale Höhe des Parts in cm */
  realHeightCm: number;
  /** Zonen auf diesem Part */
  zones: PrintZone[];
  /** Hintergrundbild-URL für dieses Part (KI-generiertes Muster) */
  backgroundImageUrl?: string;
  /** Schnittmuster-Bild-URL (Form des Trikotteils mit Alpha-Kanal) */
  partImageUrl?: string;
}

export interface PlayerPrintData {
  /** Spieler-ID */
  playerId: number;
  /** Spielername */
  playerName: string;
  /** Spielernummer */
  playerNumber: string;
  /** Konfektionsgröße */
  size: SizeCode;
  /** Initialen */
  initials?: string;
}

export interface PrintJobConfig {
  /** Vereinsname (für Trikot-Rücken) */
  clubName: string;
  /** Sportart */
  sport: SportCode;
  /** Geschlecht/Kategorie */
  gender: GenderCode;
  /** Spieler-Daten */
  player: PlayerPrintData;
  /** Parts mit Zonen-Konfiguration (aus dem Konfigurator) */
  parts: PrintSheetConfig[];
  /** Beschnitt in mm (Standard: 3mm) */
  bleedMm?: number;
  /** Primäre Hintergrundfarbe des Designs (für Kontrast-Logik) */
  bgColor?: string;
  /** Hintergrundbild-URL (KI-generiertes Muster) pro Part */
  backgroundImageUrl?: string;
  /** DPI für Bildauflösung (Standard: 300) */
  dpi?: number;
}

// ═══════════════════════════════════════════════════════════════════
// Farb-Konvertierung: HEX → CMYK
// ═══════════════════════════════════════════════════════════════════

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace("#", "");
  return {
    r: parseInt(clean.substring(0, 2), 16),
    g: parseInt(clean.substring(2, 4), 16),
    b: parseInt(clean.substring(4, 6), 16),
  };
}

function rgbToCmyk(r: number, g: number, b: number): [number, number, number, number] {
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;

  const k = 1 - Math.max(rNorm, gNorm, bNorm);
  if (k >= 1) return [0, 0, 0, 100];

  const c = ((1 - rNorm - k) / (1 - k)) * 100;
  const m = ((1 - gNorm - k) / (1 - k)) * 100;
  const y = ((1 - bNorm - k) / (1 - k)) * 100;
  const kPercent = k * 100;

  return [
    Math.round(c * 10) / 10,
    Math.round(m * 10) / 10,
    Math.round(y * 10) / 10,
    Math.round(kPercent * 10) / 10,
  ];
}

function hexToCmyk(hex: string): [number, number, number, number] {
  const { r, g, b } = hexToRgb(hex);
  return rgbToCmyk(r, g, b);
}

// ═══════════════════════════════════════════════════════════════════
// PDF-Erzeugung
// ═══════════════════════════════════════════════════════════════════

/** Konvertiert cm in PDF-Punkte (1 cm = 28.3465 pt) */
const CM_TO_PT = 28.3465;

/** Konvertiert mm in PDF-Punkte */
const MM_TO_PT = 2.83465;

/**
 * Erzeugt einen einzelnen Druckbogen (PDF) für einen Part eines Spielers.
 */
export async function generatePrintSheet(
  config: PrintJobConfig,
  partIndex: number
): Promise<Buffer> {
  const part = config.parts[partIndex];
  if (!part) throw new Error(`Part ${partIndex} nicht gefunden`);

  const bleedMm = config.bleedMm ?? 3;
  const bleedPt = bleedMm * MM_TO_PT;

  // Reale Maße für die Spielergröße berechnen
  const sizeDims = getSizeDimensions(config.sport, config.player.size, config.gender);
  let partWidthCm = part.realWidthCm;
  let partHeightCm = part.realHeightCm;

  if (sizeDims) {
    const isBody = part.partKey === "vorderteil" || part.partKey === "rueckteil";
    const isSleeve = part.partKey.includes("aermel");

    if (isBody) {
      partWidthCm = sizeDims.body.widthCm;
      partHeightCm = sizeDims.body.heightCm;
    } else if (isSleeve && sizeDims.sleeve) {
      partWidthCm = sizeDims.sleeve.widthCm;
      partHeightCm = sizeDims.sleeve.heightCm;
    }
  }

  // PDF-Seitengröße: Part-Maße + 2x Beschnitt + Seitenleisten
  const sidebarWidthCm = 6; // 6cm Seitenleiste links und rechts
  const sidebarWidthPt = sidebarWidthCm * CM_TO_PT;
  const headerHeightPt = 40; // 40pt Header oben fuer Titel
  const footerHeightPt = 20; // 20pt Footer unten
  const pageWidthPt = partWidthCm * CM_TO_PT + 2 * bleedPt + 2 * sidebarWidthPt;
  const pageHeightPt = partHeightCm * CM_TO_PT + 2 * bleedPt + headerHeightPt + footerHeightPt;

  // PDF-Dokument erstellen
  const doc = new PDFDocument({
    size: [pageWidthPt, pageHeightPt],
    margin: 0,
    info: {
      Title: `Druckbogen – ${config.player.playerName} – ${part.partLabel} – Größe ${config.player.size}`,
      Author: "Textil-Konfigurator",
      Subject: `${config.clubName} – ${config.sport}`,
      Keywords: `Druckbogen, ${config.sport}, ${config.player.size}, CMYK`,
      Creator: "Textil-Konfigurator Druckbogen-Generator",
    },
  });

  // Buffer sammeln
  const chunks: Uint8Array[] = [];
  doc.on("data", (chunk: Uint8Array) => chunks.push(chunk));

  // ── Beschnittmarken werden nach safeX/safeY gezeichnet ──

  // ── Sicherer Bereich (innerhalb Beschnitt) – zentriert zwischen Seitenleisten ──
  const safeX = sidebarWidthPt + bleedPt;
  const safeY = headerHeightPt + bleedPt;
  const safeWidth = partWidthCm * CM_TO_PT;
  const safeHeight = partHeightCm * CM_TO_PT;

  // ── Beschnittmarken zeichnen (um den Druckbereich herum) ──
  drawCropMarksOffset(doc, safeX - bleedPt, safeY - bleedPt, safeWidth + 2 * bleedPt, safeHeight + 2 * bleedPt, bleedPt);

  // ── Header-Bereich (oben) ──
  doc.fontSize(10);
  doc.font("Helvetica-Bold");
  doc.fillColor("black");
  doc.text(
    `DRUCKBOGEN – ${config.clubName}`,
    sidebarWidthPt,
    8,
    { width: safeWidth + 2 * bleedPt, align: "center" }
  );
  doc.fontSize(7);
  doc.font("Helvetica");
  doc.text(
    `${config.player.playerName} #${config.player.playerNumber} | ${part.partLabel} | Größe ${config.player.size} | ${partWidthCm}×${partHeightCm} cm | Beschnitt ${bleedMm}mm`,
    sidebarWidthPt,
    22,
    { width: safeWidth + 2 * bleedPt, align: "center" }
  );
  // ── Trennlinie unter Header ──
  doc.moveTo(sidebarWidthPt, headerHeightPt - 2)
     .lineTo(pageWidthPt - sidebarWidthPt, headerHeightPt - 2)
     .lineWidth(0.5)
     .stroke();
  // ── Hintergrund: Schnittmuster-Bild mit Farbe als Maske rendern ──
  console.log("[PrintSheet] bgColor:", config.bgColor, "partImageUrl:", part.partImageUrl, "zones:", part.zones.length);
  if (part.partImageUrl && config.bgColor) {
    // Schnittmuster-Bild laden (hat Alpha-Kanal = Form des Trikotteils)
    try {
      const patternBuffer = await fetchImageBuffer(part.partImageUrl);
      if (patternBuffer) {
        const meta = await sharp(patternBuffer).metadata();
        const imgW = meta.width!;
        const imgH = meta.height!;
        // Farbe als RGB
        const hex = config.bgColor.replace("#", "");
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        // Alpha-Kanal des Schnittmusters extrahieren
        const alphaChannel = await sharp(patternBuffer).extractChannel(3).raw().toBuffer();
        // Farbfläche in RGB erstellen
        const colorRaw = await sharp({
          create: { width: imgW, height: imgH, channels: 3, background: { r, g, b } }
        }).raw().toBuffer();
        // RGBA zusammenbauen: Farbe + Alpha-Maske des Schnittmusters
        const rgbaBuffer = Buffer.alloc(imgW * imgH * 4);
        for (let i = 0; i < imgW * imgH; i++) {
          rgbaBuffer[i * 4] = colorRaw[i * 3];
          rgbaBuffer[i * 4 + 1] = colorRaw[i * 3 + 1];
          rgbaBuffer[i * 4 + 2] = colorRaw[i * 3 + 2];
          rgbaBuffer[i * 4 + 3] = alphaChannel[i];
        }
        // PNG erstellen für PDFKit
        const maskedPng = await sharp(rgbaBuffer, { raw: { width: imgW, height: imgH, channels: 4 } })
          .png()
          .toBuffer();
        // Bild im Druckbereich platzieren (füllt den gesamten safeArea)
        doc.image(maskedPng, safeX, safeY, {
          width: safeWidth,
          height: safeHeight,
        });
      } else {
        // Fallback: einfache Farbfläche wenn Schnittmuster nicht geladen werden kann
        const bgCmykArr = hexToCmyk(config.bgColor);
        doc.save();
        doc.rect(safeX, safeY, safeWidth, safeHeight)
          .fill([bgCmykArr[0], bgCmykArr[1], bgCmykArr[2], bgCmykArr[3]] as any);
        doc.restore();
      }
    } catch (err) {
      console.warn("[PrintSheet] Schnittmuster konnte nicht geladen werden:", err);
      // Fallback: einfache Farbfläche
      if (config.bgColor) {
        const bgCmykArr = hexToCmyk(config.bgColor);
        doc.save();
        doc.rect(safeX, safeY, safeWidth, safeHeight)
          .fill([bgCmykArr[0], bgCmykArr[1], bgCmykArr[2], bgCmykArr[3]] as any);
        doc.restore();
      }
    }
  } else if (config.bgColor) {
    // Kein Schnittmuster vorhanden: Fallback auf einfache Farbfläche
    const bgCmykArr = hexToCmyk(config.bgColor);
    doc.save();
    doc.rect(safeX, safeY, safeWidth, safeHeight)
      .fill([bgCmykArr[0], bgCmykArr[1], bgCmykArr[2], bgCmykArr[3]] as any);
    doc.restore();
  }
  // ── Druckbereich-Rahmen (gestrichelt) ──
  doc.save();
  doc.dash(3, { space: 3 });
  doc.lineWidth(0.3);
  doc.strokeColor("#999999");
  doc.rect(safeX, safeY, safeWidth, safeHeight).stroke();
  doc.undash();
  doc.restore();

  // ── LINKE SEITENLEISTE: Spieler- & Produktionsdaten ──
  const leftX = 8;
  let leftY = headerHeightPt + 10;
  const leftWidth = sidebarWidthPt - 16;
  doc.fontSize(8);
  doc.font("Helvetica-Bold");
  doc.fillColor("black");
  doc.text("SPIELERDATEN", leftX, leftY, { width: leftWidth });
  leftY += 14;
  doc.font("Helvetica");
  doc.fontSize(6.5);
  doc.text(`Name: ${config.player.playerName}`, leftX, leftY, { width: leftWidth });
  leftY += 10;
  doc.text(`Nummer: ${config.player.playerNumber}`, leftX, leftY, { width: leftWidth });
  leftY += 10;
  doc.text(`Größe: ${config.player.size}`, leftX, leftY, { width: leftWidth });
  leftY += 10;
  doc.text(`Sportart: ${config.sport}`, leftX, leftY, { width: leftWidth });
  leftY += 10;
  doc.text(`Geschlecht: ${config.gender}`, leftX, leftY, { width: leftWidth });
  leftY += 18;

  doc.font("Helvetica-Bold");
  doc.fontSize(8);
  doc.text("ABMESSUNGEN", leftX, leftY, { width: leftWidth });
  leftY += 14;
  doc.font("Helvetica");
  doc.fontSize(6.5);
  doc.text(`Teil: ${part.partLabel}`, leftX, leftY, { width: leftWidth });
  leftY += 10;
  doc.text(`Breite: ${partWidthCm} cm`, leftX, leftY, { width: leftWidth });
  leftY += 10;
  doc.text(`Höhe: ${partHeightCm} cm`, leftX, leftY, { width: leftWidth });
  leftY += 10;
  doc.text(`Beschnitt: ${bleedMm} mm`, leftX, leftY, { width: leftWidth });
  leftY += 10;
  doc.text(`Auflösung: 300 DPI`, leftX, leftY, { width: leftWidth });
  leftY += 10;
  doc.text(`Farbraum: CMYK`, leftX, leftY, { width: leftWidth });
  leftY += 18;

  doc.font("Helvetica-Bold");
  doc.fontSize(8);
  doc.text("PRODUKTION", leftX, leftY, { width: leftWidth });
  leftY += 14;
  doc.font("Helvetica");
  doc.fontSize(6.5);
  doc.text(`Verfahren: Sublimation`, leftX, leftY, { width: leftWidth });
  leftY += 10;
  doc.text(`Verein: ${config.clubName}`, leftX, leftY, { width: leftWidth });
  leftY += 10;
  const now = new Date();
  doc.text(`Datum: ${now.toLocaleDateString("de-DE")}`, leftX, leftY, { width: leftWidth });
  leftY += 10;
  doc.text(`Seite: ${partIndex + 1} von ${config.parts.length}`, leftX, leftY, { width: leftWidth });

  // ── RECHTE SEITENLEISTE: Zonen-Details & Farben ──
  const rightX = pageWidthPt - sidebarWidthPt + 8;
  let rightY = headerHeightPt + 10;
  const rightWidth = sidebarWidthPt - 16;
  doc.font("Helvetica-Bold");
  doc.fontSize(8);
  doc.fillColor("black");
  doc.text("ELEMENTE", rightX, rightY, { width: rightWidth });
  rightY += 14;
  doc.font("Helvetica");
  doc.fontSize(6.5);
  for (const zone of part.zones) {
    if (rightY > pageHeightPt - 60) break;
    const label = zone.purpose === "playerNumber" ? "Nummer"
      : zone.purpose === "playerName" ? "Name"
      : zone.purpose === "clubName" ? "Verein"
      : zone.purpose === "logo" ? "Logo/Wappen"
      : zone.purpose === "sponsor" ? "Sponsor"
      : zone.purpose;
    const zoneHCm = ((zone.heightPercent / 100) * partHeightCm).toFixed(1);
    const zoneWCm = ((zone.widthPercent / 100) * partWidthCm).toFixed(1);
    doc.font("Helvetica-Bold");
    doc.text(`${label}`, rightX, rightY, { width: rightWidth });
    rightY += 9;
    doc.font("Helvetica");
    doc.text(`  Inhalt: ${zone.content || "(Bild)"}`, rightX, rightY, { width: rightWidth });
    rightY += 9;
    doc.text(`  Größe: ${zoneWCm} x ${zoneHCm} cm`, rightX, rightY, { width: rightWidth });
    rightY += 9;
    if (zone.fontColor) {
      const cmyk = hexToCmyk(zone.fontColor);
      doc.text(`  Farbe: ${zone.fontColor}`, rightX, rightY, { width: rightWidth });
      rightY += 9;
      doc.text(`  CMYK: C${cmyk[0]} M${cmyk[1]} Y${cmyk[2]} K${cmyk[3]}`, rightX, rightY, { width: rightWidth });
      rightY += 9;
    }
    if (zone.fontFamily || zone.fontStyle) {
      doc.text(`  Schrift: ${zone.fontFamily || zone.fontStyle || "Standard"}`, rightX, rightY, { width: rightWidth });
      rightY += 9;
    }
    rightY += 5;
  }

  // Hintergrundfarbe-Info
  if (config.bgColor) {
    rightY += 5;
    doc.font("Helvetica-Bold");
    doc.fontSize(8);
    doc.text("HINTERGRUND", rightX, rightY, { width: rightWidth });
    rightY += 14;
    doc.font("Helvetica");
    doc.fontSize(6.5);
    doc.text(`Farbe: ${config.bgColor}`, rightX, rightY, { width: rightWidth });
    rightY += 9;
    const bgCmyk = hexToCmyk(config.bgColor);
    doc.text(`CMYK: C${bgCmyk[0]} M${bgCmyk[1]} Y${bgCmyk[2]} K${bgCmyk[3]}`, rightX, rightY, { width: rightWidth });
    rightY += 9;
  }

  // ── Vertikale Trennlinien ──
  doc.lineWidth(0.5);
  doc.strokeColor("black");
  doc.moveTo(sidebarWidthPt, headerHeightPt).lineTo(sidebarWidthPt, pageHeightPt - footerHeightPt).stroke();
  doc.moveTo(pageWidthPt - sidebarWidthPt, headerHeightPt).lineTo(pageWidthPt - sidebarWidthPt, pageHeightPt - footerHeightPt).stroke();

  // ── Footer ──
  doc.fontSize(5);
  doc.fillColor("#666666");
  doc.text(
    "Textil-Konfigurator – Druckbogen – Alle Maße in cm – CMYK-Farbraum – 300 DPI – Vektorgrafiken",
    sidebarWidthPt,
    pageHeightPt - footerHeightPt + 6,
    { width: safeWidth + 2 * bleedPt, align: "center" }
  );
  // DEAKTIVIERT:   // ── Hintergrundbild rendern (KI-Design) – nur im Druckbereich ──
  // DEAKTIVIERT:   // Das KI-Bild zeigt Vorder- und Rückseite nebeneinander.
  // DEAKTIVIERT:   // Für den Druckbogen schneiden wir die richtige Hälfte aus:
  // DEAKTIVIERT:   // - Vorderteil: linke Hälfte des Bildes
  // DEAKTIVIERT:   // - Rückteil: rechte Hälfte des Bildes
  // DEAKTIVIERT:   // - Ärmel: Seitenbereich des Bildes
  // DEAKTIVIERT:   const bgImageUrl = part.backgroundImageUrl || config.backgroundImageUrl;
  // DEAKTIVIERT:   if (bgImageUrl) {
  // DEAKTIVIERT:     try {
  // DEAKTIVIERT:       const bgImageBuffer = await fetchImageBuffer(bgImageUrl);
  // DEAKTIVIERT:       if (bgImageBuffer) {
  // DEAKTIVIERT:         const sharp = (await import("sharp")).default;
  // DEAKTIVIERT:         const metadata = await sharp(bgImageBuffer).metadata();
  // DEAKTIVIERT:         const imgWidth = metadata.width || 1024;
  // DEAKTIVIERT:         const imgHeight = metadata.height || 1024;
  // DEAKTIVIERT:         
  // DEAKTIVIERT:         let croppedBuffer: Buffer;
  // DEAKTIVIERT:         const isBack = part.partKey.includes("rueck") || part.partKey.includes("back");
  // DEAKTIVIERT:         const isSleeve = part.partKey.includes("aermel") || part.partKey.includes("sleeve");
  // DEAKTIVIERT:         
  // DEAKTIVIERT:         if (isSleeve) {
  // DEAKTIVIERT:           // Ärmel: Seitenbereich des Bildes (oberer Rand, seitlich)
  // DEAKTIVIERT:           const isLeft = part.partKey.includes("links") || part.partKey.includes("left");
  // DEAKTIVIERT:           const sleeveW = Math.round(imgWidth * 0.25);
  // DEAKTIVIERT:           const sleeveH = Math.round(imgHeight * 0.35);
  // DEAKTIVIERT:           const sleeveX = isLeft ? 0 : Math.round(imgWidth * 0.25);
  // DEAKTIVIERT:           const sleeveY = Math.round(imgHeight * 0.05);
  // DEAKTIVIERT:           croppedBuffer = await sharp(bgImageBuffer)
  // DEAKTIVIERT:             .extract({ left: sleeveX, top: sleeveY, width: Math.min(sleeveW, imgWidth - sleeveX), height: Math.min(sleeveH, imgHeight - sleeveY) })
  // DEAKTIVIERT:             .toBuffer();
  // DEAKTIVIERT:         } else if (isBack) {
  // DEAKTIVIERT:           // Rückteil: rechte Hälfte des Bildes
  // DEAKTIVIERT:           const halfW = Math.round(imgWidth / 2);
  // DEAKTIVIERT:           croppedBuffer = await sharp(bgImageBuffer)
  // DEAKTIVIERT:             .extract({ left: halfW, top: 0, width: imgWidth - halfW, height: imgHeight })
  // DEAKTIVIERT:             .toBuffer();
  // DEAKTIVIERT:         } else {
  // DEAKTIVIERT:           // Vorderteil: linke Hälfte des Bildes
  // DEAKTIVIERT:           const halfW = Math.round(imgWidth / 2);
  // DEAKTIVIERT:           croppedBuffer = await sharp(bgImageBuffer)
  // DEAKTIVIERT:             .extract({ left: 0, top: 0, width: halfW, height: imgHeight })
  // DEAKTIVIERT:             .toBuffer();
  // DEAKTIVIERT:         }
  // DEAKTIVIERT:         
  // DEAKTIVIERT:         doc.image(croppedBuffer, safeX, safeY, {
  // DEAKTIVIERT:           width: safeWidth,
  // DEAKTIVIERT:           height: safeHeight,
  // DEAKTIVIERT:         });
  // DEAKTIVIERT:       }
  // DEAKTIVIERT:     } catch (err) {
  // DEAKTIVIERT:       console.warn(`[PrintSheet] Hintergrundbild konnte nicht geladen werden: ${bgImageUrl}`, err);
  // DEAKTIVIERT:     }
  // DEAKTIVIERT:   }
  // ── Zonen rendern ──
  // bgColor an alle Zonen übergeben (für Kontrast-Logik)
  const bgColor = config.bgColor;
  if (bgColor) {
    for (const zone of part.zones) {
      (zone as any).bgColor = bgColor;
    }
  }
  for (const zone of part.zones) {
    console.log("[PrintSheet] Rendering zone:", zone.purpose, "content:", zone.content, "pos:", zone.posXPercent, zone.posYPercent, "size:", zone.widthPercent, zone.heightPercent);
    const zoneX = safeX + (zone.posXPercent / 100) * safeWidth;
    const zoneY = safeY + (zone.posYPercent / 100) * safeHeight;
    const zoneW = (zone.widthPercent / 100) * safeWidth;
    const zoneH = (zone.heightPercent / 100) * safeHeight;

    if (zone.isImage && zone.imageUrl) {
      // Bild-Zone: Bild laden und platzieren
      try {
        const imageBuffer = await fetchImageBuffer(zone.imageUrl);
        if (imageBuffer) {
          doc.image(imageBuffer, zoneX, zoneY, {
            fit: [zoneW, zoneH],
            align: "center",
            valign: "center",
          });
        }
      } catch (err) {
        // Fallback: Platzhalter-Rechteck
        doc.rect(zoneX, zoneY, zoneW, zoneH).stroke();
        doc.fontSize(8).text("Bild fehlt", zoneX, zoneY + zoneH / 2 - 4, {
          width: zoneW,
          align: "center",
        });
      }
    } else if (zone.content) {
      // Text-Zone
      renderTextZone(doc, zone, zoneX, zoneY, zoneW, zoneH);
    }
  }

  // PDF abschließen
  doc.end();

  return new Promise<Buffer>((resolve, reject) => {
    doc.on("end", () => {
      resolve(Buffer.concat(chunks) as Buffer);
    });
    doc.on("error", reject);
  });
}

/**
 * Erzeugt alle Druckbögen für einen Spieler (bis zu 4 PDFs).
 */
export async function generateAllPrintSheets(
  config: PrintJobConfig
): Promise<{ partKey: string; partLabel: string; pdf: Buffer }[]> {
  const results: { partKey: string; partLabel: string; pdf: Buffer }[] = [];

  for (let i = 0; i < config.parts.length; i++) {
    const part = config.parts[i];
    // Nur Parts mit Zonen generieren
    if (part.zones.length === 0) continue;

    const pdf = await generatePrintSheet(config, i);
    results.push({
      partKey: part.partKey,
      partLabel: part.partLabel,
      pdf,
    });
  }

  return results;
}

// ═══════════════════════════════════════════════════════════════════
// Hilfsfunktionen
// ═══════════════════════════════════════════════════════════════════

/**
 * Zeichnet Beschnittmarken (Crop Marks) an den Ecken eines Bereichs (mit Offset).
 */
function drawCropMarksOffset(
  doc: PDFKit.PDFDocument,
  areaX: number,
  areaY: number,
  areaW: number,
  areaH: number,
  bleed: number
) {
  const markLen = 10;
  const offset = 2;
  doc.lineWidth(0.25);
  doc.strokeColor("black");
  doc.moveTo(areaX + bleed - offset, areaY).lineTo(areaX + bleed - offset, areaY + markLen).stroke();
  doc.moveTo(areaX, areaY + bleed - offset).lineTo(areaX + markLen, areaY + bleed - offset).stroke();
  doc.moveTo(areaX + areaW - bleed + offset, areaY).lineTo(areaX + areaW - bleed + offset, areaY + markLen).stroke();
  doc.moveTo(areaX + areaW, areaY + bleed - offset).lineTo(areaX + areaW - markLen, areaY + bleed - offset).stroke();
  doc.moveTo(areaX + bleed - offset, areaY + areaH).lineTo(areaX + bleed - offset, areaY + areaH - markLen).stroke();
  doc.moveTo(areaX, areaY + areaH - bleed + offset).lineTo(areaX + markLen, areaY + areaH - bleed + offset).stroke();
  doc.moveTo(areaX + areaW - bleed + offset, areaY + areaH).lineTo(areaX + areaW - bleed + offset, areaY + areaH - markLen).stroke();
  doc.moveTo(areaX + areaW, areaY + areaH - bleed + offset).lineTo(areaX + areaW - markLen, areaY + areaH - bleed + offset).stroke();
  const crossSize = 5;
  const positions = [
    { x: areaX + areaW / 2, y: areaY + bleed / 2 },
    { x: areaX + areaW / 2, y: areaY + areaH - bleed / 2 },
    { x: areaX + bleed / 2, y: areaY + areaH / 2 },
    { x: areaX + areaW - bleed / 2, y: areaY + areaH / 2 },
  ];
  for (const pos of positions) {
    doc.moveTo(pos.x - crossSize, pos.y).lineTo(pos.x + crossSize, pos.y).stroke();
    doc.moveTo(pos.x, pos.y - crossSize).lineTo(pos.x, pos.y + crossSize).stroke();
    doc.circle(pos.x, pos.y, 3).stroke();
  }
}

/**
 * Zeichnet Beschnittmarken (Crop Marks) an den Ecken.
 */
function drawCropMarks(
  doc: PDFKit.PDFDocument,
  pageW: number,
  pageH: number,
  bleed: number
) {
  const markLen = 10; // 10pt Markenlänge
  const offset = 2; // 2pt Abstand zum Druckbereich

  doc.lineWidth(0.25);
  doc.strokeColor("black");

  // Oben links
  doc.moveTo(bleed - offset, 0).lineTo(bleed - offset, markLen).stroke();
  doc.moveTo(0, bleed - offset).lineTo(markLen, bleed - offset).stroke();

  // Oben rechts
  doc.moveTo(pageW - bleed + offset, 0).lineTo(pageW - bleed + offset, markLen).stroke();
  doc.moveTo(pageW, bleed - offset).lineTo(pageW - markLen, bleed - offset).stroke();

  // Unten links
  doc.moveTo(bleed - offset, pageH).lineTo(bleed - offset, pageH - markLen).stroke();
  doc.moveTo(0, pageH - bleed + offset).lineTo(markLen, pageH - bleed + offset).stroke();

  // Unten rechts
  doc.moveTo(pageW - bleed + offset, pageH).lineTo(pageW - bleed + offset, pageH - markLen).stroke();
  doc.moveTo(pageW, pageH - bleed + offset).lineTo(pageW - markLen, pageH - bleed + offset).stroke();

  // Passermarken (Kreuz in der Mitte jeder Seite)
  const crossSize = 5;
  const positions = [
    { x: pageW / 2, y: bleed / 2 },           // Oben Mitte
    { x: pageW / 2, y: pageH - bleed / 2 },    // Unten Mitte
    { x: bleed / 2, y: pageH / 2 },             // Links Mitte
    { x: pageW - bleed / 2, y: pageH / 2 },     // Rechts Mitte
  ];

  for (const pos of positions) {
    doc.moveTo(pos.x - crossSize, pos.y).lineTo(pos.x + crossSize, pos.y).stroke();
    doc.moveTo(pos.x, pos.y - crossSize).lineTo(pos.x, pos.y + crossSize).stroke();
    doc.circle(pos.x, pos.y, 3).stroke();
  }
}

/**
 * Rendert eine Text-Zone mit allen Stil-Optionen (Bogentext, Outline, CMYK).
 */
function renderTextZone(
  doc: PDFKit.PDFDocument,
  zone: PrintZone,
  x: number,
  y: number,
  w: number,
  h: number
) {
  const text = zone.content;
  if (!text) return;
  // Schriftgröße berechnen
  const fontSizePercent = zone.fontSize || 80;
  let fontSize = (fontSizePercent / 100) * h;
  // Mindestgröße
  fontSize = Math.max(fontSize, 6);
  // Schriftart wählen (PDFKit hat nur Helvetica, Courier, Times eingebaut)
  let fontName = "Helvetica";
  if (zone.fontWeight === "bold") fontName = "Helvetica-Bold";
  if (zone.fontStyle === "serif") fontName = zone.fontWeight === "bold" ? "Times-Bold" : "Times-Roman";
  if (zone.fontStyle === "sans") fontName = zone.fontWeight === "bold" ? "Helvetica-Bold" : "Helvetica";
  doc.font(fontName);
  doc.fontSize(fontSize);
  // Textbreite prüfen und ggf. Schriftgröße anpassen
  let textWidth = doc.widthOfString(text);
  while (textWidth > w * 0.95 && fontSize > 4) {
    fontSize -= 0.5;
    doc.fontSize(fontSize);
    textWidth = doc.widthOfString(text);
  }
  const textHeight = doc.heightOfString(text, { width: w });

  // ═══ KONTRAST-LOGIK: Automatische Farbanpassung ═══
  // Textfarbe bestimmen – wenn bgColor vorhanden, Kontrast prüfen
  let fontColor = zone.fontColor || "#000000";
  let effectiveOutlineColor = zone.outlineColor || "none";
  let effectiveOutlineWidth = zone.outlineWidth || 0;

  if ((zone as any).bgColor) {
    const bg = (zone as any).bgColor as string;
    // Prüfe ob Textfarbe genug Kontrast zum Hintergrund hat
    fontColor = ensureTextContrast(fontColor, bg);
    // Wenn immer noch grenzwertig: Outline hinzufügen
    const outlineResult = getTextOutlineForContrast(fontColor, bg);
    if (outlineResult.needsOutline && (!effectiveOutlineColor || effectiveOutlineColor === "none")) {
      effectiveOutlineColor = outlineResult.outlineColor;
      effectiveOutlineWidth = outlineResult.outlineWidth;
    }
  }

  const cmyk = hexToCmyk(fontColor);

  if (zone.textStyle === "arc" && zone.arcDegree && zone.arcDegree !== 0) {
    // ── Bogentext rendern ──
    renderArcText(doc, text, x, y, w, h, fontSize, zone.arcDegree, cmyk, zone);
  } else {
    // ── Gerader Text rendern ──
    // Vertikale Zentrierung
    const textY = y + (h - textHeight) / 2;
    // Outline (entweder vom User definiert oder automatisch durch Kontrast-Logik)
    if (effectiveOutlineColor && effectiveOutlineColor !== "none" && effectiveOutlineWidth > 0) {
      const outlineCmyk = hexToCmyk(effectiveOutlineColor);
      const outlineWidthPt = (effectiveOutlineWidth / 100) * fontSize;
      doc.save();
      // PDFKit: Text als Pfad mit Stroke für Outline
      doc.lineWidth(outlineWidthPt);
      doc.strokeColor(outlineCmyk as any);
      doc.fillColor(cmyk as any);
      doc.text(text, x, textY, {
        width: w,
        align: zone.textAlign || "center",
        stroke: true,
        fill: true,
      } as any);
      doc.restore();
    } else {
      // Nur Füllung
      doc.fillColor(cmyk as any);
      doc.text(text, x, textY, {
        width: w,
        align: zone.textAlign || "center",
      });
    }
  }
}

/**
 * Rendert gebogenen Text (Arc Text) als Vektor-Pfad.
 */
function renderArcText(
  doc: PDFKit.PDFDocument,
  text: string,
  x: number,
  y: number,
  w: number,
  h: number,
  fontSize: number,
  arcDegree: number,
  cmyk: [number, number, number, number],
  zone: PrintZone
) {
  // Mittelpunkt der Zone
  const cx = x + w / 2;
  const cy = y + h / 2;

  // Bogenradius berechnen (je größer der Grad, desto kleiner der Radius)
  const arcRad = (Math.abs(arcDegree) * Math.PI) / 180;
  const radius = w / (2 * Math.sin(arcRad / 2 || 0.01));

  // Startwinkel berechnen
  const totalAngle = arcRad;
  const chars = text.split("");

  // Zeichenbreiten messen
  const charWidths = chars.map((ch) => doc.widthOfString(ch));
  const totalWidth = charWidths.reduce((sum, w) => sum + w, 0);

  // Winkel pro Zeichen proportional zur Breite
  const anglePerUnit = totalAngle / totalWidth;

  // Startwinkel (zentriert)
  let currentAngle = -Math.PI / 2 - totalAngle / 2;

  // Bogenzentrum (oberhalb oder unterhalb der Zone)
  const arcCenterY = arcDegree > 0
    ? cy + radius - h / 2  // Bogen nach oben
    : cy - radius + h / 2; // Bogen nach unten

  doc.save();
  doc.fillColor(cmyk as any);

  for (let i = 0; i < chars.length; i++) {
    const charAngle = charWidths[i] * anglePerUnit;
    const midAngle = currentAngle + charAngle / 2;

    // Position auf dem Bogen
    const charX = cx + radius * Math.cos(midAngle);
    const charY = arcCenterY - radius * Math.sin(midAngle);

    // Rotation des Zeichens
    const rotationAngle = -(midAngle + Math.PI / 2);

    doc.save();
    doc.translate(charX, charY);
    doc.rotate((rotationAngle * 180) / Math.PI);

    // Outline
    if (zone.outlineColor && zone.outlineColor !== "none" && zone.outlineWidth && zone.outlineWidth > 0) {
      const outlineCmyk = hexToCmyk(zone.outlineColor);
      const outlineWidthPt = (zone.outlineWidth / 100) * fontSize;
      doc.lineWidth(outlineWidthPt);
      doc.strokeColor(outlineCmyk as any);
      doc.fillColor(cmyk as any);
      doc.text(chars[i], -charWidths[i] / 2, -fontSize / 2, {
        lineBreak: false,
        stroke: true,
        fill: true,
      } as any);
    } else {
      doc.text(chars[i], -charWidths[i] / 2, -fontSize / 2, {
        lineBreak: false,
      });
    }

    doc.restore();
    currentAngle += charAngle;
  }

  doc.restore();
}

/**
 * Lädt ein Bild von einer URL und gibt es als Buffer zurück.
 */
async function fetchImageBuffer(url: string): Promise<Buffer | null> {
  try {
    // Lokale Storage-URLs
    if (url.startsWith("/manus-storage/")) {
      const { storageGetSignedUrl } = await import("./storage");
      const key = url.replace("/manus-storage/", "");
      const signedUrl = await storageGetSignedUrl(key);
      if (signedUrl) {
        const response = await fetch(signedUrl);
        if (!response.ok) return null;
        const arrayBuffer = await response.arrayBuffer();
        return Buffer.from(arrayBuffer);
      }
      return null;
    }

    // Externe URLs
    const response = await fetch(url);
    if (!response.ok) return null;
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch {
    return null;
  }
}

/**
 * Validiert die Zonen eines Druckbogens gegen die Verbandsregeln.
 * Prüft Mindestgrößen für Nummern, Namen, Vereinsname etc.
 */
export function validatePrintZonesForSize(
  zones: PrintZone[],
  partKey: string,
  sport: SportCode,
  size: SizeCode,
  gender: GenderCode,
  spielklasse?: string
): { zone: PrintZone; warning: string }[] {
  const warnings: { zone: PrintZone; warning: string }[] = [];

  const dims = getSizeDimensions(sport, size, gender);
  if (!dims) return warnings;

  const isBody = partKey === "vorderteil" || partKey === "rueckteil";
  const isSleeve = partKey.includes("aermel");

  let partWidthCm = 0;
  let partHeightCm = 0;

  if (isBody) {
    partWidthCm = dims.body.widthCm;
    partHeightCm = dims.body.heightCm;
  } else if (isSleeve && dims.sleeve) {
    partWidthCm = dims.sleeve.widthCm;
    partHeightCm = dims.sleeve.heightCm;
  }

  if (partWidthCm === 0 || partHeightCm === 0) return warnings;

  for (const zone of zones) {
    const zoneHeightCm = (zone.heightPercent / 100) * partHeightCm;
    const zoneWidthCm = (zone.widthPercent / 100) * partWidthCm;

    // Mindestgrößen nach Sportart prüfen
    if (zone.purpose === "playerNumber") {
      // Rückennummer: Mindesthöhe je nach Sportart
      const minHeights: Record<string, number> = {
        fussball: 20,  // DFB: mind. 20 cm Rückennummer
        handball: 20,  // IHF: mind. 20 cm
        volleyball: 15, // FIVB: mind. 15 cm Rücken, 8 cm Brust
        basketball: 20, // FIBA: mind. 20 cm Rücken, 10 cm Brust
      };

      if (partKey === "rueckteil") {
        const minH = minHeights[sport] || 15;
        if (zoneHeightCm < minH) {
          warnings.push({
            zone,
            warning: `Rückennummer zu klein: ${zoneHeightCm.toFixed(1)} cm (Mindestgröße: ${minH} cm für ${sport})`,
          });
        }
      }

      if (partKey === "vorderteil") {
        const minFrontHeights: Record<string, number> = {
          fussball: 10,
          handball: 10,
          volleyball: 8,
          basketball: 10,
        };
        const minH = minFrontHeights[sport] || 8;
        if (zoneHeightCm < minH) {
          warnings.push({
            zone,
            warning: `Brustnummer zu klein: ${zoneHeightCm.toFixed(1)} cm (Mindestgröße: ${minH} cm für ${sport})`,
          });
        }
      }
    }

    if (zone.purpose === "playerName") {
      const minNameHeights: Record<string, number> = {
        fussball: 2.5,
        handball: 4,
        volleyball: 4,
        basketball: 2,
      };
      const minH = minNameHeights[sport] || 2;
      if (zoneHeightCm < minH) {
        warnings.push({
          zone,
          warning: `Spielername zu klein: ${zoneHeightCm.toFixed(1)} cm (Mindestgröße: ${minH} cm für ${sport})`,
        });
      }
    }

    if (zone.purpose === "clubName") {
      // Vereinsname: Mindesthöhe
      if (zoneHeightCm < 2) {
        warnings.push({
          zone,
          warning: `Vereinsname zu klein: ${zoneHeightCm.toFixed(1)} cm (Mindestgröße: 2 cm)`,
        });
      }
    }
  }

  return warnings;
}

/**
 * Befüllt die Zonen eines Parts mit spielerspezifischen Daten.
 * Ersetzt Platzhalter wie playerName, playerNumber, clubName etc.
 */
export function fillZonesForPlayer(
  zones: PrintZone[],
  player: PlayerPrintData,
  clubName: string
): PrintZone[] {
  return zones.map((zone) => {
    const filled = { ...zone };

    switch (zone.purpose) {
      case "playerName":
        filled.content = player.playerName;
        break;
      case "playerNumber":
        filled.content = player.playerNumber;
        break;
      case "clubName":
        filled.content = clubName;
        break;
      case "playerInitials":
        filled.content = player.initials || "";
        break;
      // logo, sponsor, custom: Inhalt bleibt wie konfiguriert
    }

    return filled;
  });
}
